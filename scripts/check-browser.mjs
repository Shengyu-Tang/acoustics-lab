// Run after npm run build. Uses installed Edge; all profiles/downloads stay in this clone.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
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
  let page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const shots = "screenshots/p0";
  fs.mkdirSync(shots, { recursive: true });
  const pages = [
    ["home", "#/", "声学基础"],
    ["lecture-1.2.4", "#/lab?topic=1.2.4", "1.2.4 强迫振动的稳态振动（1）"],
    ["lecture-1.2.5", "#/lab?topic=1.2.5", "1.2.5 强迫振动的稳态振动（2）"],
    ["plot-demo", "#/plot-demo", "绘图组件演示"],
  ];
  const measurements = [];
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const [name, hash, title] of pages) {
      await page.goto("http://127.0.0.1:4174/" + hash);
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
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
              .filter({ hasText: "f₀ 处 Xₘ" })
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
      .filter({ hasText: /^Qₘ = (1\.7|5|10)$/ })
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
  assert.ok(fs.readFileSync("outputs/downloads/bandwidth-B.m", "utf8").includes("vm=0.4"));
  await page.goto("http://127.0.0.1:4174/#/lab?topic=3.10.5");
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
  await page.screenshot({ path: "outputs/field-3.10.5.png", fullPage: true });
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
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, t.id);
      if (i % 20 === 0) console.log(`PASS: retained lecture ${i + 1}/${topics.length} at ${width}`);
      const l = p1.find((l) => l.id === t.id);
      if (!l) continue;
      await page.waitForTimeout(50);
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
      fs.mkdirSync("screenshots/p1", { recursive: true });
      await page.screenshot({ path: `screenshots/p1/${l.id}-${width}.png`, fullPage: true });
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
      await page.goto("http://127.0.0.1:4174/" + hash);
      await page.locator("header").waitFor();
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, hash);
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
