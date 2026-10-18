// Run after npm run build. Uses installed Edge; all profiles/downloads stay in this clone.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { programmingNotation } from "./solution-notation.mjs";
fs.mkdirSync("outputs/browser-tmp", { recursive: true });
process.env.TEMP = path.resolve("outputs/browser-tmp");
process.env.TMP = process.env.TEMP;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4174",
    "--strictPort",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let context;
const errors = [];
// Include decoded thumbnails in full-page captures, including images below the fold.
async function readyForScreenshot(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) => {
        img.loading = "eager";
        return img.decode();
      }),
    );
  });
}
async function checkCaseIndex(page) {
  await page.evaluate(() => document.fonts.ready);
  const items = await page.locator(".case-index li").evaluateAll((nodes) =>
    nodes.map((el, i) => {
      const range = document.createRange();
      range.selectNodeContents(el.querySelector("a"));
      const box = el.getBoundingClientRect().toJSON();
      const marker = document.createElement("canvas").getContext("2d");
      marker.font = getComputedStyle(el, "::marker").font;
      // List-item DOMRects exclude the outside number marker, which is exactly
      // where a long title in the preceding CSS column used to collide.
      box.left -= marker.measureText(`${i + 1}. `).width + 4;
      box.right = Math.max(box.right, range.getBoundingClientRect().right) + 4;
      return {
        text: el.textContent,
        box,
        textBox: range.getBoundingClientRect().toJSON(),
      };
    }),
  );
  assert.equal(items.length, 9, "complete case index");
  const disjoint = (a, b) =>
    a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
  for (const [i, a] of items.entries()) {
    assert.ok(
      a.textBox.left >= a.box.left - 1 && a.textBox.right <= a.box.right + 1,
      `${a.text}: case index text escapes its item box and can overlap adjacent numbering`,
    );
    assert.ok(
      a.textBox.left >= 0 && a.textBox.right <= page.viewportSize().width,
      `${a.text}: case index text fits viewport`,
    );
    for (const b of items.slice(i + 1)) {
      assert.ok(disjoint(a.box, b.box), `${a.text} / ${b.text}: case index item boxes overlap`);
      assert.ok(disjoint(a.textBox, b.textBox), `${a.text} / ${b.text}: case index text overlaps`);
    }
  }
}
async function checkSolutionNotation(page) {
  const texts = await page.locator(".solution-content").evaluateAll((nodes) =>
    nodes.map((node) => {
      const clone = node.cloneNode(true);
      clone.querySelectorAll("annotation").forEach((el) => el.remove());
      return clone.textContent;
    }),
  );
  assert.ok(texts.length, `${page.url()}: reference solution present`);
  for (const text of texts)
    assert.equal(
      text.match(programmingNotation),
      null,
      `${page.url()}: rendered solution notation`,
    );
}
async function checkParameterLayout(page) {
  await page.evaluate(() => document.fonts.ready);
  const fields = await page.locator(".compact-parameter").evaluateAll((rows) =>
    rows.map((row) => {
      const [label, number, unit, slider] = row.children;
      const box = (el) => el.getBoundingClientRect().toJSON();
      return {
        text: label.textContent,
        label: box(label),
        lineHeight: parseFloat(getComputedStyle(label).lineHeight),
        fits: label.scrollWidth <= label.clientWidth,
        number: box(number),
        unit: box(unit),
        slider: box(slider),
      };
    }),
  );
  for (const f of fields) {
    const name = `${page.url()} ${f.text}`;
    assert.ok(f.label.height <= f.lineHeight + 1 && f.fits, `${name}: single visible label line`);
    assert.ok(f.label.bottom <= f.number.top, `${name}: label above controls`);
    assert.ok(Math.abs(f.label.left - f.number.left) < 1, `${name}: controls start below label`);
    assert.ok(
      f.unit.left >= f.number.right && f.slider.left >= f.unit.right,
      `${name}: control order`,
    );
    for (const control of [f.unit, f.slider])
      assert.ok(
        Math.abs(f.number.top + f.number.height / 2 - control.top - control.height / 2) < 2,
        `${name}: input, unit and slider share a row`,
      );
  }
}
async function checkNotationLayout(page) {
  const report = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.querySelector(".lecture-content") ?? document.querySelector("main"),
      NodeFilter.SHOW_TEXT,
    );
    const bad = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        !node.parentElement.closest("script, style, option") &&
        /[\u2080-\u209c]/.test(node.textContent)
      )
        bad.push(node.textContent);
    }
    return {
      bad,
      rows: [...document.querySelectorAll(".student-answer")].map((row) => {
        const [label, input, unit] = row.children;
        const box = (el) => el.getBoundingClientRect().toJSON();
        return { label: box(label), input: box(input), unit: box(unit) };
      }),
      scripts: [...document.querySelectorAll("svg tspan[baseline-shift]")].map((t) => ({
        size: parseFloat(getComputedStyle(t).fontSize),
        parentSize: parseFloat(getComputedStyle(t.parentElement).fontSize),
      })),
      plots: [...document.querySelectorAll(".matlab-figure svg")].map((s) => ({
        width: s.getBoundingClientRect().width,
        units: s.viewBox.baseVal.width,
      })),
    };
  });
  assert.deepEqual(report.bad, [], "rendered Unicode subscript glyphs");
  for (const { width, units } of report.plots)
    assert.ok(Math.abs(width - units) < 1, "plot uses screen-pixel coordinates on the first frame");
  assert.ok(
    report.rows.every((r) => Math.abs(r.input.left - report.rows[0].input.left) < 1),
    "answer inputs share one column",
  );
  for (const { label, input, unit } of report.rows) {
    assert.equal(input.width, 120, "answer width");
    assert.ok(
      input.left - label.right >= 0 && input.left - label.right <= 8,
      "answer follows label",
    );
    assert.ok(unit.left - input.right >= 0 && unit.left - input.right <= 8, "unit follows answer");
    assert.ok(
      Math.abs(label.top + label.height / 2 - input.top - input.height / 2) < 2,
      "label and answer share a row",
    );
  }
  for (const { size, parentSize } of report.scripts)
    assert.ok(Math.abs(size / parentSize - 0.75) < 0.01, "SVG script is 75% of its parent");
}
const runDirectory = path.resolve(`outputs/browser-run-${Date.now()}`);
fs.mkdirSync(runDirectory, { recursive: true });
try {
  for (let i = 0; i < 40; i++) {
    if (server.exitCode !== null) throw new Error("Preview server failed to start on port 4174");
    try {
      if ((await fetch("http://127.0.0.1:4174/")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  context = await chromium.launchPersistentContext(path.join(runDirectory, "profile"), {
    channel: "msedge",
    headless: true,
    acceptDownloads: true,
    reducedMotion: "reduce",
    downloadsPath: path.join(runDirectory, "downloads"),
  });
  context.setDefaultTimeout(90000);
  let page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  fs.mkdirSync("outputs/browser-screenshots/p5-review", { recursive: true });
  for (const width of [1440, 1024, 769, 768, 640, 390, 320]) {
    await page.setViewportSize({ width, height: width > 640 ? 900 : 844 });
    await page.goto("http://127.0.0.1:4174/#/cases");
    await page.locator(".case-index li").last().waitFor();
    await readyForScreenshot(page);
    await page.screenshot({
      path: `outputs/browser-screenshots/p5-review/case-index-${width}.png`,
    });
    await checkCaseIndex(page);
  }
  if (process.argv.includes("--case-index-only")) {
    console.log("PASS: case index item and text boxes at seven viewport widths");
    await context.close();
    server.kill();
    process.exit(0);
  }
  const shots = "outputs/browser-screenshots/p0";
  fs.mkdirSync(shots, { recursive: true });
  const pages = [
    ["home", "#/", "声学基础"],
    ["lecture-1.2.4", "#/lab?topic=1.2.4", "1.2.4 强迫振动的稳态振动（1）"],
    ["lecture-1.2.5", "#/lab?topic=1.2.5", "1.2.5 强迫振动的稳态振动（2）"],
    ["plot-demo", "#/plot-demo", "绘图组件演示"],
  ];
  const measurements = [];
  const reviewShots = "outputs/review-p1-extras";
  fs.mkdirSync(reviewShots, { recursive: true });
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const [name, hash, title] of pages) {
      await page.goto("http://127.0.0.1:4174/" + hash);
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      await readyForScreenshot(page);
      await page.waitForTimeout(150);
      const dims = await page.evaluate(() => ({
        viewport: innerWidth,
        scroll: document.documentElement.scrollWidth,
        header: document.querySelector("header").getBoundingClientRect().height,
      }));
      measurements.push({ name, size, ...dims });
      assert.equal(dims.scroll, width, `${name} ${size}: horizontal overflow`);
      assert.equal(dims.header, 56);
      if (name === "home")
        assert.equal(
          await page.locator(".lecture-thumbnail").count(),
          fs.readdirSync("src/content/lectures").filter((f) => f.endsWith(".ts")).length,
        );
      if (name.startsWith("lecture")) {
        await checkNotationLayout(page);
        const plotMetrics = await page.locator(".matlab-figure svg").evaluateAll((svgs) =>
          svgs.map((svg) => ({
            width: svg.getBoundingClientRect().width,
            units: svg.viewBox.baseVal.width,
            font: getComputedStyle(svg.querySelector("text")).fontSize,
            labels: Array.from(svg.querySelectorAll("[data-annotation-label]")).map((t) => ({
              text: t.textContent,
              box: t.getBoundingClientRect().toJSON(),
              transform: t.getAttribute("transform"),
            })),
            // Sample rendered paths in screen coordinates so a label crossing a curve
            // fails even when labels do not overlap one another.
            curvePoints: Array.from(svg.querySelectorAll("[data-plot-series] path")).flatMap(
              (p) => {
                const length = p.getTotalLength(),
                  matrix = p.getScreenCTM();
                return Array.from({ length: Math.ceil(length) + 1 }, (_, i) => {
                  const point = p.getPointAtLength(Math.min(i, length)).matrixTransform(matrix);
                  return [point.x, point.y];
                });
              },
            ),
            markers: Array.from(
              svg.querySelectorAll("[data-plot-series] circle, [data-plot-series] rect"),
            ).map((m) => m.getBoundingClientRect().toJSON()),
          })),
        );
        for (const plot of plotMetrics) {
          assert.ok(Math.abs(plot.width - plot.units) < 0.1, "SVG units must be screen pixels");
          assert.equal(plot.font, "12px");
          for (let i = 0; i < plot.labels.length; i++) {
            const a = plot.labels[i];
            assert.equal(a.transform, null, "horizontal annotation");
            for (const [x, y] of plot.curvePoints)
              assert.ok(
                x < a.box.left - 2 ||
                  x > a.box.right + 2 ||
                  y < a.box.top - 2 ||
                  y > a.box.bottom + 2,
                `${a.text}: annotation crosses a curve`,
              );
            for (const marker of plot.markers)
              assert.ok(
                marker.right < a.box.left - 2 ||
                  marker.left > a.box.right + 2 ||
                  marker.bottom < a.box.top - 2 ||
                  marker.top > a.box.bottom + 2,
                `${a.text}: annotation overlaps a marker`,
              );
            for (const b of plot.labels.slice(i + 1)) {
              const overlapX =
                Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
              const overlapY =
                Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
              assert.ok(overlapX <= 0 || overlapY <= 0, "annotation labels overlap");
            }
          }
        }
        assert.ok(plotMetrics[1].width <= 640);
        if (size === "mobile") {
          const formulas = await page.locator(".formula-line").evaluateAll((lines) =>
            lines.map((line) => {
              const math = line.querySelector(".math-text"),
                number = line.querySelector(":scope > span");
              math.scrollLeft = math.scrollWidth;
              const result = {
                overflow: getComputedStyle(math).overflowX,
                bottom: math.getBoundingClientRect().bottom,
                numberTop: number.getBoundingClientRect().top,
                scrollable: math.scrollWidth <= math.clientWidth || math.scrollLeft > 0,
              };
              math.scrollLeft = 0;
              return result;
            }),
          );
          assert.ok(
            formulas.every((f) => f.overflow === "auto" && f.numberTop >= f.bottom && f.scrollable),
          );
        }
        if (name === "lecture-1.2.4") {
          assert.equal(
            await page
              .locator(".readouts tr")
              .filter({ hasText: "f0 处 Xm" })
              .locator("td")
              .nth(1)
              .textContent(),
            "0",
          );
        } else {
          assert.equal(
            await page
              .getByRole("heading", { name: "例题 B　振动台的带宽测量与输入功率", exact: true })
              .count(),
            1,
          );
          const transforms = await page
            .locator(".matlab-figure")
            .first()
            .locator("svg > g")
            .evaluateAll((groups) => groups.map((g) => g.getAttribute("transform")));
          assert.equal(transforms.length, 3);
          assert.ok(transforms.every((t) => t.startsWith("translate(0 ")));
        }
      }
      await page.screenshot({ path: `${shots}/${name}-${size}.png`, fullPage: true });
      if (name.startsWith("lecture")) {
        const figures = page.locator(".matlab-figure");
        for (let i = 1; i < (await figures.count()); i++)
          await figures.nth(i).screenshot({ path: `outputs/${name}-figure-${i + 1}-${size}.png` });
      }
      if (name === "lecture-1.2.4") {
        const graph = page.locator(".matlab-figure").first();
        await graph.screenshot({ path: `outputs/plot-${size}.png` });
        if (size === "mobile") {
          await page.getByRole("button", { name: "章节目录", exact: true }).click();
          assert.ok(await page.locator(".chapter-tree").isVisible());
          await page.getByRole("button", { name: "关闭章节目录", exact: true }).click();
        }
      }
      console.log(`PASS: ${name} ${size} ${width}×${height}`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4174/#/lab?topic=1.2.4");
  await page.getByRole("heading", { name: pages[1][2], exact: true }).waitFor();
  const graph = page.locator(".matlab-figure").first(),
    num = page.getByRole("spinbutton", { name: "仪器与支架等效质量数值", exact: true });
  const before = await graph.locator("svg").innerHTML();
  await num.fill("20");
  await num.blur();
  assert.notEqual(await graph.locator("svg").innerHTML(), before);
  await num.fill("9999");
  await num.blur();
  assert.equal(await num.inputValue(), "100");
  await page.getByRole("button", { name: "恢复默认参数", exact: true }).click();
  await page.getByRole("checkbox").check();
  assert.equal(
    await graph
      .locator("text")
      .filter({ hasText: /^Qm = (1\.7|5|10)$/ })
      .count(),
    9,
  );
  await page.getByRole("checkbox").uncheck();
  await graph.locator('[aria-label="移动指针查看数据"]').first().hover();
  assert.ok((await graph.textContent()).includes("X:"));
  const expected = [31.631419324, 24.84325864, 1.2732395447, 3.1364177549, 251.25828393];
  const fields = page.locator(".student-answer input");
  for (let i = 0; i < 5; i++) await fields.nth(i).fill(String(expected[i]));
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  assert.deepEqual(
    await page.locator(".student-answer output").allTextContents(),
    Array(5).fill("正确"),
  );
  await page.getByRole("button", { name: "提示 1：选择公式" }).click();
  await page.getByRole("button", { name: "提示 2：代入步骤" }).click();
  await page.locator(".reference-solution summary").click();
  const answerBefore = await page.locator(".solution-content").textContent();
  await page.getByRole("spinbutton", { name: "例题激励力幅值", exact: true }).fill("100");
  assert.notEqual(await page.locator(".solution-content").textContent(), answerBefore);
  // Test real browser downloads, not only exporter string generation.
  for (const [label, extension] of [
    ["导出 PNG", "png"],
    ["导出数据 CSV", "csv"],
    ["导出 MATLAB 代码", "m"],
  ]) {
    console.log(`Checking ${label} download`);
    const event = page.waitForEvent("download");
    await graph.getByRole("button", { name: label, exact: true }).click();
    const d = await event;
    assert.ok(d.suggestedFilename().endsWith("." + extension));
    await d.saveAs(`outputs/downloads/response.${extension}`);
    assert.ok(fs.statSync(`outputs/downloads/response.${extension}`).size > 100);
  }
  const matlab = fs.readFileSync("outputs/downloads/response.m", "utf8");
  assert.ok(matlab.includes("subplot(2,3,6)"));
  await page.locator(".reference-solution summary").click();
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole("button", { name: "打印本题", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  assert.ok(await page.locator(".solution-content").isVisible());
  await page.pdf({ path: "outputs/sample-A-print.pdf", format: "A4", printBackground: true });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  assert.equal(await page.locator(".reference-solution").getAttribute("open"), null);
  await page.emulateMedia({ media: "screen" });
  await page.goto("http://127.0.0.1:4174/#/lab?topic=1.2.5");
  await page.locator(".student-answer input").first().waitFor();
  const bandwidthAnswers = [
    Math.sqrt(395000 / 10) / (2 * Math.PI) / (100 / 3 - 30),
    2 * Math.PI * 10 * (100 / 3 - 30),
    0.5 * 2 * Math.PI * 10 * (100 / 3 - 30) * 0.2 ** 2,
    2 * Math.PI * 10 * (100 / 3 - 30) * 0.2,
  ];
  for (const [i, value] of bandwidthAnswers.entries())
    await page.locator(".student-answer input").nth(i).fill(String(value));
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  assert.deepEqual(
    await page.locator(".student-answer output").allTextContents(),
    Array(4).fill("正确"),
  );
  await page.getByRole("button", { name: "提示 1：选择公式" }).click();
  await page.getByRole("button", { name: "提示 2：代入步骤" }).click();
  await page.locator(".reference-solution summary").click();
  const powerBefore = await page.locator(".solution-content").textContent();
  await page.getByRole("spinbutton", { name: "例题目标振速峰值", exact: true }).fill("0.4");
  assert.notEqual(await page.locator(".solution-content").textContent(), powerBefore);
  const bandwidthDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 MATLAB 计算脚本", exact: true }).click();
  await (await bandwidthDownload).saveAs("outputs/downloads/bandwidth-B.m");
  assert.ok(fs.readFileSync("outputs/downloads/bandwidth-B.m", "utf8").includes("velocity = 0.4;"));
  await page.goto("http://127.0.0.1:4174/#/lab?topic=3.10.4");
  await page.locator(".matlab-figure image").first().waitFor();
  const raster = await page
    .locator(".matlab-figure image")
    .first()
    .evaluate(async (image) => {
      const bitmap = new Image();
      bitmap.src = image.getAttribute("href");
      await bitmap.decode();
      return {
        width: bitmap.naturalWidth,
        height: bitmap.naturalHeight,
        rendering: getComputedStyle(image).imageRendering,
      };
    });
  assert.ok(raster.width >= 160 && raster.height >= 80);
  assert.equal(raster.rendering, "auto");
  await page.screenshot({ path: "outputs/field-3.10.4.png", fullPage: true });
  await page.close();
  page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.log("Browser page error:", e.message);
  });
  page.on("console", (m) => {
    if (m.type() === "error") {
      errors.push(m.text());
      console.log("Browser console error:", m.text());
    }
  });
  // Every retained lecture and auxiliary route still mounts in the new application.
  const topics = JSON.parse(fs.readFileSync("src/topics.json", "utf8"));
  const p1Module = await import("../outputs/p1-check.mjs");
  const p1 = Object.entries(p1Module)
    .filter(([key]) => /^l\d+$/.test(key))
    .map(([, l]) => l);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const [i, t] of topics.entries()) {
      await page.goto("http://127.0.0.1:4174/#/lab?topic=" + t.id);
      await page.getByRole("heading", { name: t.id + " " + t.title, exact: true }).waitFor();
      if (fs.existsSync(`src/content/lectures/${t.id}.ts`)) await checkSolutionNotation(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, t.id);
      assert.equal(await page.title(), `${t.id} ${t.title} · 声学基础 · 中国海洋大学`);
      await checkParameterLayout(page);
      if (["1.1.3", "3.1.1"].includes(t.id)) {
        const size = width === 1440 ? "desktop" : "mobile";
        await page.locator(".parameter-panel").first().scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${reviewShots}/${t.id}-${size}.png` });
        await page
          .locator(".parameter-panel")
          .first()
          .screenshot({
            path: `${reviewShots}/${t.id}-parameters-${size}.png`,
          });
      }
      if (i % 20 === 0) console.log(`PASS: retained lecture ${i + 1}/${topics.length} at ${width}`);
      const l = p1.find((l) => l.id === t.id);
      if (!l) continue;
      await page.waitForTimeout(50);
      await checkNotationLayout(page);
      if (l.id === "2.2") {
        const ticks = await page
          .locator("#simulation .matlab-figure")
          .nth(1)
          .locator("svg > g")
          .nth(1)
          .locator("[data-x-tick]")
          .evaluateAll((nodes) => nodes.map((n) => Number(n.dataset.xTick)));
        assert.ok(
          ticks.length > 1 && ticks.every(Number.isInteger),
          "modal order ticks must be integers",
        );
      }
      const hiddenCurves = await page.locator(".matlab-figure svg").evaluateAll((svgs) =>
        svgs.flatMap((svg) => {
          const hidden = [];
          for (const legend of svg.querySelectorAll("[data-plot-legend] > rect")) {
            const box = legend.getBoundingClientRect();
            for (const curve of svg.querySelectorAll("[data-plot-series] path")) {
              const matrix = curve.getScreenCTM();
              let previous = null;
              for (const match of curve
                .getAttribute("d")
                .matchAll(/([ML])(-?[\d.e+]+),(-?[\d.e+]+)/g)) {
                const point = new DOMPoint(Number(match[2]), Number(match[3])).matrixTransform(
                  matrix,
                );
                if (match[1] === "L" && previous) {
                  let enter = 0,
                    leave = 1;
                  for (const [a, b, lo, hi] of [
                    [previous.x, point.x, box.left - 1, box.right + 1],
                    [previous.y, point.y, box.top - 1, box.bottom + 1],
                  ]) {
                    const delta = b - a;
                    if (delta === 0) {
                      if (a < lo || a > hi) leave = -1;
                    } else {
                      const ends = [(lo - a) / delta, (hi - a) / delta].sort((a, b) => a - b);
                      enter = Math.max(enter, ends[0]);
                      leave = Math.min(leave, ends[1]);
                    }
                  }
                  if (leave >= enter) {
                    hidden.push(svg.querySelector("text")?.textContent);
                    break;
                  }
                }
                previous = point;
              }
            }
          }
          return hidden;
        }),
      );
      assert.deepEqual(hiddenCurves, [], `${l.id}: legend covers a curve at ${width}`);
      // Capture the initial lecture, before exercise and parameter mutations.
      fs.mkdirSync("outputs/browser-screenshots/p1", { recursive: true });
      await page.screenshot({
        path: `outputs/browser-screenshots/p1/${l.id}-${width}.png`,
        fullPage: true,
      });
      const e = l.examples[0];
      assert.equal(
        await page.locator(".matlab-figure").count(),
        l.figures.length + l.examples.length,
      );
      for (const [j, a] of e.asks.entries())
        await page
          .locator(".student-answer input")
          .nth(j)
          .fill(String(a.calc(e.defaults)));
      await page.getByRole("button", { name: "提交答案", exact: true }).click();
      assert.deepEqual(
        await page.locator(".student-answer output").allTextContents(),
        Array(e.asks.length).fill("正确"),
      );
      await page.getByRole("button", { name: "提示 1：选择公式", exact: true }).click();
      await page.getByRole("button", { name: "提示 2：代入步骤", exact: true }).click();
      await page.locator(".reference-solution summary").click();
      await checkNotationLayout(page);
      const before = await page.locator(".solution-content").textContent();
      const d = e.given[0],
        value = e.defaults[d.key] === d.max ? d.min : d.max;
      const input = page.getByRole("spinbutton", { name: `例题${d.name}`, exact: true });
      await input.fill(String(value));
      await input.blur();
      assert.notEqual(
        await page.locator(".solution-content").textContent(),
        before,
        `${l.id}: reactive solution`,
      );
      await checkSolutionNotation(page);
      if (l.animation) {
        const svg = page.locator(".matlab-figure svg"),
          before = await svg.evaluateAll((nodes) => nodes.map((n) => n.innerHTML).join(""));
        await page.getByRole("button", { name: "单步", exact: true }).click();
        assert.ok(
          (await svg.evaluateAll((nodes) => nodes.map((n) => n.innerHTML).join(""))) !== before,
          `${l.id}: single step updates`,
        );
        await page.getByRole("button", { name: "播放", exact: true }).click();
        await page.waitForTimeout(150);
        await page.getByRole("button", { name: "暂停", exact: true }).click();
      }
      if (l.boundaryEquations) {
        const select = page.getByRole("combobox", { name: "右端边界条件", exact: true });
        for (let boundary = 0; boundary < 4; boundary++)
          await select.selectOption(String(boundary));
        await select.selectOption("0");
      }
      if (l.materials) {
        const select = page.getByRole("combobox", { name: "材料预设", exact: true });
        for (let i = 0; i < l.materials.length; i++) {
          await select.selectOption(String(i));
          assert.equal(
            Number(
              await page
                .getByRole("spinbutton", { name: "杨氏模量数值", exact: true })
                .inputValue(),
            ),
            l.materials[i].E,
          );
        }
        await select.selectOption("0");
      }
      if (l.controls === "damping") {
        const select = page.getByRole("combobox", { name: "阻尼输入方式", exact: true });
        for (const mode of ["0", "1", "2"]) await select.selectOption(mode);
      }
      if (l.id === "2.1") {
        const graph = page.locator(".matlab-figure").first(),
          box = await graph.boundingBox();
        const height = page.getByRole("spinbutton", { name: "初始挠度数值", exact: true }),
          before = await height.inputValue();
        await graph.scrollIntoViewIfNeeded();
        const visible = await graph.boundingBox();
        await page.mouse.move(visible.x + visible.width / 2, visible.y + visible.height / 2);
        await page.mouse.down();
        await page.mouse.move(visible.x + visible.width / 2, visible.y + visible.height / 3);
        await page.mouse.up();
        assert.notEqual(
          await height.inputValue(),
          before,
          "Dragging string changes the deflection",
        );
      }
    }
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const hash of [
      "#/cases",
      "#/calendar",
      "#/about",
      "#/map",
      "#/compare",
      ...JSON.parse(fs.readFileSync("src/projects.json", "utf8")).map(
        (p) => `#/cases?project=${p.id}`,
      ),
    ]) {
      console.log(`Checking route ${hash} at ${width}`);
      await page.goto("http://127.0.0.1:4174/" + hash);
      await page.locator("header").waitFor();
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, hash);
      if (hash.startsWith("#/cases")) {
        await checkCaseIndex(page);
        await page.locator(".reference-solution summary").click();
        await checkSolutionNotation(page);
        assert.equal(await page.locator(".katex-error").count(), 0, `${hash}: solution equations`);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth),
          width,
          `${hash}: expanded solution overflow`,
        );
      }
      if (hash === "#/calendar") {
        const lessons = JSON.parse(fs.readFileSync("src/calendar.json", "utf8"));
        assert.equal(await page.locator(".schedule-heading span").count(), 0);
        assert.equal(await page.locator(".calendar-item").count(), lessons.length);
        const rows = await page.locator(".calendar-item").evaluateAll((items) =>
          items.map((el) => {
            const style = getComputedStyle(el);
            return {
              left: el.getBoundingClientRect().left,
              right: el.getBoundingClientRect().right,
              top: style.borderTopWidth,
              sides: [style.borderLeftWidth, style.borderRightWidth],
              bottom: style.borderBottomWidth,
              radius: style.borderRadius,
            };
          }),
        );
        for (const row of rows) {
          assert.equal(row.left, rows[0].left, "schedule rows share a column");
          assert.equal(row.right, rows[0].right, "schedule rows share a width");
          assert.equal(row.top, "0px");
          assert.deepEqual(row.sides, ["0px", "0px"], "schedule has dividers instead of cards");
          assert.ok(["0px", "1px"].includes(row.bottom));
          assert.equal(row.radius, "0px");
        }
        const size = width === 1440 ? "desktop" : "mobile";
        await page.screenshot({ path: `${reviewShots}/calendar-${size}.png` });
        await page.locator(".schedule-heading").evaluate((el) => el.scrollIntoView());
        await page.screenshot({ path: `${reviewShots}/calendar-schedule-${size}.png` });
        const secondLesson = page.locator(".calendar-item").nth(1);
        await page.locator(".class-day").nth(1).click();
        await page.waitForFunction(() =>
          document.activeElement?.classList.contains("lesson-picked"),
        );
        assert.equal(await secondLesson.evaluate((el) => el === document.activeElement), true);
        await secondLesson.locator("summary").click();
        assert.equal(await secondLesson.locator("details").getAttribute("open"), "");
        assert.equal(
          await secondLesson.locator("li a").first().getAttribute("href"),
          "#/lab?topic=1.1.1",
        );
        await secondLesson.locator("summary").click();
      }
    }
  }
  // Review exact viewport screenshots in addition to the full lecture captures.
  const polish = [];
  fs.mkdirSync("outputs/browser-screenshots/polish", { recursive: true });
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const id of ["home", "1.1.1", "1.2.4", "2.2"]) {
      await page.goto("http://127.0.0.1:4174/" + (id === "home" ? "#/" : `#/lab?topic=${id}`));
      await page
        .getByRole("heading", {
          name: id === "home" ? "声学基础" : `${id} ${topics.find((t) => t.id === id).title}`,
          exact: true,
        })
        .waitFor();
      await readyForScreenshot(page);
      const title = id === "home" ? "" : `${id} ${topics.find((t) => t.id === id).title} · `;
      assert.equal(await page.title(), title + "声学基础 · 中国海洋大学");
      assert.equal(await page.locator(".site-footer").count(), 1);
      assert.ok((await page.locator(".site-footer").textContent()).includes("© 2026 中国海洋大学"));
      assert.equal(await page.locator(".email-placeholder").count(), 0);
      assert.ok(!(await page.locator(".site-footer").textContent()).includes("????"));
      const metrics = await page.evaluate(() => {
        const box = (el) => el.getBoundingClientRect().toJSON();
        return {
          id: location.hash,
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          fields: [...document.querySelectorAll(".compact-parameter")].map((el) => {
            const [label, number, unit, slider] = el.children;
            const style = getComputedStyle(number);
            return {
              label: box(label),
              number: box(number),
              unit: box(unit),
              slider: box(slider),
              height: style.height,
              fontSize: style.fontSize,
              padding: style.padding,
            };
          }),
          actions: [...document.querySelectorAll(".example-actions button")].map(box),
          presets: [...document.querySelectorAll(".parameter-actions button")].map(box),
          tools: [...document.querySelectorAll(".figure-tools button")].map((el) => {
            const style = getComputedStyle(el);
            return {
              fontSize: style.fontSize,
              color: style.color,
              border: style.borderTopWidth,
              text: el.textContent,
            };
          }),
          given: [...document.querySelectorAll(".calculation-example tbody input")].map(box),
          searchHeight: document.querySelector(".catalog-search input")
            ? getComputedStyle(document.querySelector(".catalog-search input")).height
            : null,
        };
      });
      assert.equal(metrics.scrollWidth, width);
      if (id !== "home") {
        assert.equal(await page.locator(".breadcrumbs [aria-current=page]").textContent(), id);
        assert.equal(metrics.searchHeight, "32px");
        for (const f of metrics.fields) {
          assert.equal(f.height, "32px");
          assert.equal(f.fontSize, "14px");
          assert.equal(f.padding, "4px 8px");
          assert.ok(f.label.bottom <= f.number.top);
          assert.ok(f.unit.left >= f.number.right && f.slider.left >= f.unit.right);
          assert.ok(
            Math.abs(f.number.top + f.number.height / 2 - (f.slider.top + f.slider.height / 2)) < 2,
          );
        }
        assert.equal(metrics.actions.length, 3);
        assert.ok(metrics.actions.every((b) => Math.abs(b.top - metrics.actions[0].top) < 2));
        assert.ok(metrics.presets.every((b) => Math.abs(b.top - metrics.presets[0].top) < 2));
        for (const t of metrics.tools) {
          assert.equal(t.fontSize, "12px");
          assert.equal(t.color, "rgb(85, 85, 85)");
          assert.equal(t.border, "0px");
        }
        for (const f of metrics.given) {
          assert.equal(f.height, 32);
          assert.ok(f.width <= 120);
          if (width === 1440) assert.equal(f.width, 120);
        }
      }
      await page.screenshot({ path: `outputs/browser-screenshots/polish/${id}-${size}.png` });
      if (id !== "home") {
        await page
          .locator(".parameter-panel")
          .screenshot({ path: `outputs/${id}-parameters-${size}.png` });
        await page
          .locator(".calculation-example")
          .screenshot({ path: `outputs/${id}-example-${size}.png` });
      }
      polish.push({ id, size, ...metrics });
      console.log(`PASS: polish layout, title and screenshot ${id} ${size}`);
    }
  }
  fs.writeFileSync("outputs/polish-report.json", JSON.stringify(polish, null, 2));
  // Long route sweeps can exhaust Edge's renderer process. Keep the completed
  // route assertions, and isolate the final exact-size review captures.
  assert.deepEqual(errors, [], "route sweep console errors");
  fs.writeFileSync(
    "outputs/browser-routes-passed.json",
    JSON.stringify(
      {
        lectures: topics.length,
        viewports: [
          [1440, 900],
          [390, 844],
        ],
        errors,
      },
      null,
      2,
    ),
  );
  await Promise.race([context.close(), new Promise((r) => setTimeout(r, 5000))]);
  context = await chromium.launchPersistentContext(path.join(runDirectory, "review-profile"), {
    channel: "msedge",
    headless: true,
    reducedMotion: "reduce",
  });
  context.setDefaultTimeout(90000);
  page = await context.newPage();
  // Fresh, exact-size review captures of the requested sections.
  fs.mkdirSync("outputs/browser-screenshots/design-review", { recursive: true });
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const [id, section] of [
      ["1.2.4", "examples"],
      ["1.1.4", "examples"],
      ["2.2", "principle"],
    ]) {
      const reviewPage = await context.newPage();
      reviewPage.on("pageerror", (e) => errors.push(e.message));
      reviewPage.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      try {
        await reviewPage.setViewportSize({ width, height });
        await reviewPage.goto(`http://127.0.0.1:4174/#/lab?topic=${id}`);
        await reviewPage
          .getByRole("heading", {
            name: `${id} ${topics.find((t) => t.id === id).title}`,
            exact: true,
          })
          .waitFor();
        await readyForScreenshot(reviewPage);
        await checkNotationLayout(reviewPage);
        const target = section === "examples" ? ".calculation-example form" : "#principle";
        await reviewPage
          .locator(target)
          .evaluate(
            (el, offset) => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - offset),
            section === "examples" ? (width === 390 ? 350 : 460) : 80,
          );
        await reviewPage.waitForTimeout(400);
        // Warm the headless compositor before recording the review frame.
        if (section === "examples")
          await reviewPage.locator(".calculation-example form h4").screenshot();
        await reviewPage.screenshot();
        await reviewPage.waitForTimeout(100);
        await reviewPage.screenshot({
          path: `outputs/browser-screenshots/design-review/${id}-${section}-${size}.png`,
        });
      } finally {
        await reviewPage.close();
      }
    }
  }
  assert.deepEqual(errors, [], "Browser console errors");
  fs.writeFileSync(
    "outputs/browser-report.json",
    JSON.stringify(
      {
        measurements,
        errors,
        lectures: topics.length,
        checks: [
          "parameters",
          "bounds",
          "Q overlay",
          "grading",
          "two hints",
          "reactive solution",
          "PNG/CSV/MATLAB downloads",
          "print",
          "all lecture routes",
          "fixed screen font sizes and nonoverlapping horizontal annotations",
          "mobile formula scrolling and separate equation numbers",
          "distinct power/bandwidth exercise grading, hints and reactive solution",
          "160×80 smoothly interpolated legacy field",
          "completed-lecture thumbnails only",
          "all lecture document titles",
          "polish control dimensions, inline actions, breadcrumbs, export links and shared footer",
          "eight default-state viewport screenshots",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: browser interactions, exports, print and all lecture routes; no console errors.",
  );
} catch (error) {
  console.log("Browser errors at failure:", errors);
  const page = context?.pages().at(-1);
  if (page && !page.isClosed())
    await page.screenshot({ path: "outputs/browser-failure.png" }).catch(() => {});
  throw error;
} finally {
  server.kill();
  await Promise.race([context?.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
}
process.exit(process.exitCode ?? 0);
