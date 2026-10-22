// Production build audit. Every generated artifact and browser profile stays in this clone.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { auditData } from "./bug-audit-data.mjs";
const out = path.resolve("outputs/bug-audit-1");
for (const name of ["tmp", "downloads", "exports", "screenshots"])
  fs.mkdirSync(path.join(out, name), { recursive: true });
const navigationOnly = process.argv.includes("--navigation-only");
if (!navigationOnly) fs.rmSync(path.join(out, "browser.done"), { force: true });
process.env.TEMP = process.env.TMP = path.join(out, "tmp");
const data = await auditData();
const topics = JSON.parse(fs.readFileSync("src/topics.json", "utf8"));
const report = {
  routes: [],
  sliders: [],
  numbers: [],
  worksheets: [],
  exports: [],
  navigation: [],
  animations: [],
  errors: [],
  failures: [],
};
const save = () =>
  fs.writeFileSync(
    path.join(out, navigationOnly ? "navigation.json" : "browser.json"),
    JSON.stringify(report, null, 2),
  );
const base = "http://127.0.0.1:4186/";
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4186",
    "--strictPort",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let context;
async function attempt(name, fn) {
  try {
    await fn();
  } catch (e) {
    report.failures.push({ name, message: e.message });
    console.error("FAIL", name, e.message.split("\n")[0]);
  }
  save();
}
async function scan(page, state) {
  const result = await page.evaluate(() => {
    const main = document.querySelector("main");
    const invalid = (main?.innerText ?? "").match(/\b(?:NaN|Infinity|undefined|null)\b/g) ?? [];
    const figures = [...document.querySelectorAll(".matlab-figure svg")];
    const blank = figures
      .filter(
        (s) =>
          !s.querySelector(
            '[data-plot-series] path[d*="M"], [data-plot-series] circle, [data-plot-series] rect, image, [data-field-cell], [data-schematic], [data-response-note]',
          ),
      )
      .map((s) => s.getAttribute("aria-label"));
    const broken = [...document.images]
      .filter((i) => i.complete && !i.naturalWidth)
      .map((i) => i.src);
    const invalidSvg = figures
      .flatMap((s) => [...s.querySelectorAll("[d], [x], [y], [width], [height], [transform]")])
      .filter((e) =>
        [...e.attributes].some((a) => /\b(?:NaN|Infinity|undefined|null)\b/.test(a.value)),
      )
      .map((e) => e.outerHTML.slice(0, 200));
    const clippedText = [...(main?.querySelectorAll("h1,h2,h3,h4,figcaption,button") ?? [])]
      .filter((e) => e.clientWidth && e.scrollWidth > e.clientWidth + 2)
      .map((e) => ({ text: e.textContent, width: e.clientWidth, scrollWidth: e.scrollWidth }));
    return {
      invalid,
      blank,
      broken,
      invalidSvg,
      clippedText,
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      figures: figures.length,
      textLength: main?.innerText.length ?? 0,
    };
  });
  assert.ok(result.textLength > 30, `${state}: blank page`);
  for (const k of ["invalid", "blank", "broken", "invalidSvg", "clippedText"])
    assert.deepEqual(result[k], [], `${state}: ${k}`);
  assert.ok(
    result.scrollWidth <= result.width + 1,
    `${state}: horizontal overflow ${result.scrollWidth}/${result.width}`,
  );
  return result;
}
async function download(page, button, name, kind, meta) {
  const promise = page.waitForEvent("download");
  await button.click();
  const dl = await promise;
  const file = path.join(out, "exports", name + "." + kind);
  await dl.saveAs(file);
  assert.ok(fs.statSync(file).size > 20, `empty download ${name}`);
  if (kind === "png") assert.equal(fs.readFileSync(file).subarray(1, 4).toString(), "PNG");
  report.exports.push({
    ...structuredClone(meta),
    kind,
    file: path.relative(process.cwd(), file),
    bytes: fs.statSync(file).size,
    sha256: crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  });
  save();
}
async function navigation(page, width) {
  await page.goto(base + "#/compare?experiment=layer");
  const precise = page.locator("#compare-h");
  await precise.fill("0.235");
  await precise.blur();
  assert.equal(
    Number(await precise.inputValue()),
    0.235,
    "numeric control preserves model precision",
  );
  await precise.fill("");
  assert.equal(await precise.getAttribute("aria-invalid"), "true");
  assert.ok(await page.locator(".number-field-error").isVisible(), "visible input explanation");
  await precise.blur();
  assert.equal(
    Number(await precise.inputValue()),
    0.235,
    "empty input preserves the previous value",
  );
  await scan(page, "numeric validation layout");
  await page
    .locator(".comparison-controls")
    .screenshot({ path: path.join(out, "screenshots", `${width}-invalid-number.png`) });
  await page.goto(base + "#/lab?topic=1.1.3");
  const zeta = page.locator(".calculation-example tbody input").last();
  await zeta.fill("1.05");
  await zeta.blur();
  await page
    .locator(".calculation-example .matlab-figure")
    .screenshot({ path: path.join(out, "screenshots", `${width}-overdamped-envelope.png`) });
  await page.goto(base + "#/lab?topic=3.6.10");
  await page.getByRole("spinbutton", { name: "介质声速数值", exact: true }).fill("6000");
  await page.getByRole("spinbutton", { name: "介质声速数值", exact: true }).blur();
  await page
    .locator("#simulation .matlab-figure")
    .nth(1)
    .screenshot({ path: path.join(out, "screenshots", `${width}-no-evanescent-depth.png`) });
  assert.equal(
    (await page.locator("#principle p").allTextContents()).filter((s) =>
      s.includes("时间因子统一采用"),
    ).length,
    1,
    "phase convention is stated once per lecture",
  );
  await page.goto(base + "#/lab?topic=1.1.2");
  await page.locator("#simulation .matlab-figure").first().waitFor();
  assert.ok(
    await page.locator("#principle .katex").count(),
    "equations render synchronously with the lecture",
  );
  assert.ok(
    await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.family.includes("KaTeX"))
        .every((f) => f.display === "swap"),
    ),
    "math fonts never hide fallback glyphs",
  );
  assert.ok(
    !(await page.locator("#chapter-tree").textContent()).includes("拓展：声呐"),
    "sidebar matches the seven course chapters",
  );
  await page.reload();
  await page.locator("#simulation .matlab-figure").first().waitFor();
  assert.ok((await page.locator("h1").innerText()).startsWith("1.1.2 "));
  if (width === 390) {
    const menu = page.getByRole("button", { name: "展开或收起导航", exact: true });
    await menu.click();
    assert.equal(await menu.getAttribute("aria-expanded"), "true");
    await page.locator('.site-header a[href="#/calendar"]').click();
    await page.locator(".calendar-page").waitFor();
    assert.equal(await menu.getAttribute("aria-expanded"), "false");
    await page.goBack();
    await page.locator(".lecture-layout").waitFor();
    const drawer = page.getByRole("button", { name: "章节目录", exact: true });
    await drawer.click();
    assert.equal(await page.locator(".catalog-toggle").getAttribute("aria-expanded"), "true");
    await page.locator('#chapter-tree a[href="#/lab?topic=1.1.3"]').click();
    await page.waitForURL("**/#/lab?topic=1.1.3");
    await page.locator('.catalog-toggle[aria-expanded="false"]').waitFor();
    assert.equal(await page.locator(".catalog-toggle").getAttribute("aria-expanded"), "false");
  } else {
    // The right-hand TOC is intentionally shown only on wide desktop layouts.
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".page-toc a").filter({ hasText: "思考题" }).click();
    assert.ok(
      await page.locator("#questions").evaluate((e) => {
        const top = e.getBoundingClientRect().top,
          margin = parseFloat(getComputedStyle(e).scrollMarginTop);
        return (
          Math.abs(top - margin) < 2 ||
          (Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight)) < 2 &&
            top >= margin &&
            top < innerHeight)
        );
      }),
      "TOC anchor reaches section",
    );
    await page.setViewportSize({ width, height: 900 });
  }
  await page.locator(".lesson-pagination a").filter({ hasText: "下一讲" }).click();
  await page.waitForFunction(() => scrollY === 0);
  const next = page.url();
  await page.goBack();
  await page.locator("#simulation .matlab-figure").first().waitFor();
  await page.goForward();
  await page.locator("#simulation .matlab-figure").first().waitFor();
  assert.equal(page.url(), next);
  await page.locator(".breadcrumbs a").first().click();
  await page.locator(".lecture-layout").waitFor({ state: "detached" });
  report.navigation.push({
    width,
    reload: true,
    pagination: true,
    history: true,
    breadcrumbs: true,
    mobileMenu: width === 390,
    drawer: width === 390,
    toc: width !== 390,
  });
  await page.goto(base + "#/compare?experiment=layer");
  await page.locator(".comparison-page canvas").waitFor();
  for (const kind of ["array", "duct", "layer"]) {
    await page.locator(`.comparison-switch a[href="#/compare?experiment=${kind}"]`).click();
    await page.waitForTimeout(200);
    const active = await page.evaluate(() => window.__auditTimers());
    assert.deepEqual(
      active,
      { intervals: 0, frames: 1 },
      "one 3D frame loop after comparison switch",
    );
  }
  await page.evaluate(() => {
    location.hash = "#/about";
  });
  await page.locator(".comparison-page").waitFor({ state: "detached" });
  assert.deepEqual(
    await page.evaluate(() => window.__auditTimers()),
    { intervals: 0, frames: 0 },
    "3D cleanup on route change",
  );
  await page.goto(base + "#/plot-demo");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "播放", exact: true }).click();
    assert.equal(
      (await page.evaluate(() => window.__auditTimers())).intervals,
      1,
      "one demo interval",
    );
    await page.getByRole("button", { name: "单步", exact: true }).click();
    assert.equal(
      (await page.evaluate(() => window.__auditTimers())).intervals,
      0,
      "demo single-step stops playback",
    );
  }
  await page.getByRole("button", { name: "播放", exact: true }).click();
  await page.evaluate(() => {
    location.hash = "#/about";
  });
  await page.locator(".plot-demo").waitFor({ state: "detached" });
  await page.waitForTimeout(100);
  assert.deepEqual(
    await page.evaluate(() => window.__auditTimers()),
    { intervals: 0, frames: 0 },
    "demo cleanup on route change",
  );
  report.animations.push({
    width,
    scenes: ["layer", "array", "duct", "plot-demo"],
    schedulerCleanup: true,
  });
}
async function worksheets(page, route, examples, width) {
  const sheets = page.locator(".calculation-example");
  assert.equal(await sheets.count(), examples.length, `${route}: worksheet inventory`);
  for (let index = 0; index < examples.length; index++) {
    const e = examples[index],
      sheet = sheets.nth(index),
      p = { ...e.defaults };
    for (const caption of await sheet.locator("figcaption").allTextContents())
      assert.match(
        caption,
        /^图 (?:[1-7]\.\d+(?:\.\d+)?-E\d+|综合案例\d+(?:-\d+)?)(?:\s|$)/,
        "consistent worksheet figure numbering",
      );
    if (width === 1440)
      await download(
        page,
        sheet.getByRole("button", { name: "导出 MATLAB 计算脚本", exact: true }),
        `${route.replace(/\W/g, "_")}-worksheet-${index}-default`,
        "m",
        { route, worksheet: index, parameters: p, category: "calculation-default" },
      );
    // Set a nondefault condition through the same input handler used by students.
    const given = sheet.locator("tbody input[type=number]");
    const d = e.given[0];
    p[d.key] = p[d.key] === d.max ? d.min : d.max;
    await given.first().fill(String(p[d.key]));
    await given.first().blur();
    const answers = sheet.locator(".student-answer input");
    const solution = e.solve?.(p);
    for (let i = 0; i < e.asks.length; i++) {
      const a = e.asks[i];
      await answers.nth(i).fill(String(a.calc ? a.calc(p) : solution[a.key]));
    }
    await sheet.getByRole("button", { name: "提交答案", exact: true }).click();
    assert.deepEqual(
      await sheet.locator(".student-answer output").allTextContents(),
      e.asks.map(() => "正确"),
      `${route} worksheet ${index}: correct answers`,
    );
    for (const factor of [0.98, 1.02]) {
      for (let i = 0; i < e.asks.length; i++) {
        const a = e.asks[i],
          expected = a.calc ? a.calc(p) : solution[a.key];
        await answers.nth(i).fill(String(expected * factor));
      }
      await sheet.getByRole("button", { name: "提交答案", exact: true }).click();
      assert.deepEqual(
        await sheet.locator(".student-answer output").allTextContents(),
        e.asks.map(() => "正确"),
        `${route}: inclusive tolerance boundary`,
      );
    }
    for (const factor of [0.979, 1.021]) {
      for (let i = 0; i < e.asks.length; i++) {
        const a = e.asks[i],
          expected = a.calc ? a.calc(p) : solution[a.key];
        await answers.nth(i).fill(String(expected === 0 ? 1 : expected * factor));
      }
      await sheet.getByRole("button", { name: "提交答案", exact: true }).click();
      assert.ok(
        (await sheet.locator(".student-answer output").allTextContents()).every(
          (s) => s !== "正确",
        ),
        `${route}: outside 2%`,
      );
    }
    for (const raw of ["", "-1", "0", "1e100"]) {
      await answers.first().fill(raw);
      await sheet.getByRole("button", { name: "提交答案", exact: true }).click();
      assert.ok(
        await sheet.locator(".student-answer output").first().innerText(),
        "invalid/edge answer receives feedback",
      );
    }
    await sheet.getByRole("button", { name: "提示 2：代入步骤", exact: true }).click();
    assert.ok((await sheet.locator(".example-hints p").count()) >= 2);
    await sheet.locator("details.reference-solution").evaluate((el) => {
      el.open = true;
    });
    const before = await sheet.locator(".solution-content").innerText();
    await given.first().fill(String(e.defaults[d.key]));
    await given.first().blur();
    assert.equal(await sheet.locator(".student-answer output").count(), 0, "stale grade cleared");
    assert.notEqual(
      await sheet.locator(".solution-content").innerText(),
      before,
      "solution updates",
    );
    await given.first().fill(String(p[d.key]));
    await given.first().blur();
    for (let i = 0; i < (await given.count()); i++) {
      const input = given.nth(i),
        original = await input.inputValue();
      for (const raw of ["", "-1", "0", "1e100"]) {
        await input.fill(raw);
        const valid =
          raw.trim() &&
          Number(raw) >= Number(await input.getAttribute("min")) &&
          Number(raw) <= Number(await input.getAttribute("max"));
        if (!valid) {
          assert.equal(
            await input.getAttribute("aria-invalid"),
            "true",
            "invalid conditions are identified",
          );
          assert.ok(
            await sheet.locator(".number-field-error").count(),
            "invalid conditions explain allowed input",
          );
        }
        await scan(page, `${route} worksheet ${index} given ${i}=${raw}`);
        await input.blur();
        assert.ok(Number.isFinite(Number(await input.inputValue())), "finite restored input");
        await input.fill(original);
        await input.blur();
      }
      // Browsers sanitize nonnumeric text to an empty number input.
      await input.fill("");
      await input.pressSequentially("abc");
      await input.blur();
      await input.fill(original);
      await input.blur();
    }
    // Invalid frequency edits may adjust a coupled endpoint; restore the entire
    // known parameter set before exporting, rather than just the active field.
    for (let i = 0; i < e.given.length; i++) {
      await given.nth(i).fill(String(p[e.given[i].key]));
      await given.nth(i).blur();
    }
    if (width === 1440)
      await download(
        page,
        sheet.getByRole("button", { name: "导出 MATLAB 计算脚本", exact: true }),
        `${route.replace(/\W/g, "_")}-worksheet-${index}`,
        "m",
        { route, worksheet: index, parameters: p, category: "calculation" },
      );
    report.worksheets.push({
      route,
      width,
      index,
      correctAndOutsideTolerance: true,
      invalidInputs: true,
      reactive: true,
    });
  }
}
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error("audit preview server failed");
    try {
      ready = (await fetch(base)).ok;
    } catch {}
    if (ready) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready);
  context = await chromium.launchPersistentContext(path.join(out, `profile-${Date.now()}`), {
    channel: "msedge",
    headless: true,
    acceptDownloads: true,
    downloadsPath: path.join(out, "downloads"),
    reducedMotion: "reduce",
  });
  context.setDefaultTimeout(20000);
  await context.addInitScript(() => {
    const active = { intervals: new Set(), frames: new Set() };
    const si = window.setInterval.bind(window),
      ci = window.clearInterval.bind(window);
    window.setInterval = (fn, delay, ...args) => {
      const id = si(fn, delay, ...args);
      active.intervals.add(id);
      return id;
    };
    window.clearInterval = (id) => {
      active.intervals.delete(id);
      ci(id);
    };
    const raf = window.requestAnimationFrame.bind(window),
      caf = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (fn) => {
      const id = raf((t) => {
        active.frames.delete(id);
        fn(t);
      });
      active.frames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      active.frames.delete(id);
      caf(id);
    };
    window.__auditTimers = () => ({ intervals: active.intervals.size, frames: active.frames.size });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) =>
    report.errors.push({ route: page.url(), type: "pageerror", message: e.message }),
  );
  page.on("console", (m) => {
    if (m.type() === "error")
      report.errors.push({ route: page.url(), type: "console", message: m.text() });
  });
  page.on("response", (r) => {
    if (r.status() >= 400)
      report.errors.push({ route: page.url(), type: "http", url: r.url(), status: r.status() });
  });
  page.on("requestfailed", (r) => {
    if (r.failure()?.errorText !== "net::ERR_ABORTED")
      report.errors.push({
        route: page.url(),
        type: "requestfailed",
        url: r.url(),
        message: r.failure()?.errorText,
      });
  });
  const allRoutes = [
    "#/",
    "#/cases",
    ...data.engineeringCases.map((e) => `#/cases?project=${e.id}`),
    "#/calendar",
    "#/compare",
    ...["layer", "array", "duct"].map((e) => `#/compare?experiment=${e}`),
    "#/map",
    "#/about",
    "#/feedback",
    "#/plot-demo",
    ...topics.map((t) => `#/lab?topic=${t.id}`),
  ];
  const routes = navigationOnly
    ? []
    : process.argv.includes("--quick")
      ? allRoutes.filter(
          (r) =>
            !r.startsWith("#/lab") ||
            ["1.1.1", "1.2.5", "3.6.10", "7.1"].some((id) => r === `#/lab?topic=${id}`),
        )
      : allRoutes;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await attempt(`${width} navigation`, () => navigation(page, width));
    for (const route of routes)
      await attempt(`${width} ${route}`, async () => {
        await page.goto(base + route);
        await page.locator("main h1").waitFor();
        if (route.startsWith("#/lab"))
          await page.locator("#simulation .matlab-figure").first().waitFor();
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            [...document.images].map((i) => {
              i.loading = "eager";
              return i.decode();
            }),
          );
        });
        const initial = await scan(page, route);
        report.routes.push({ route, width, ...initial });
        await page.screenshot({
          path: path.join(out, "screenshots", `${width}-${route.replace(/\W/g, "_")}.png`),
          fullPage: true,
        });
        if (route === "#/map") {
          await page.getByRole("button", { name: "知识图谱", exact: true }).click();
          await page.locator("canvas").waitFor();
          await scan(page, "knowledge graph");
          await page.screenshot({
            path: path.join(out, "screenshots", `${width}-knowledge-graph.png`),
          });
        }
        if (route === "#/calendar") {
          assert.equal(await page.locator(".calendar-item").count(), 24);
          const links = await page
            .locator('.calendar-page a[href^="#/lab"]')
            .evaluateAll((ns) => ns.map((n) => n.getAttribute("href")));
          for (const href of links)
            assert.ok(
              topics.some((t) => href === `#/lab?topic=${t.id}`),
              `calendar dead link ${href}`,
            );
          report.navigation.push({ width, calendarLessons: 24, calendarLinks: links.length });
        }
        if (route.startsWith("#/lab")) {
          const id = new URLSearchParams(route.split("?")[1]).get("topic");
          const l = data.lectures.find((l) => l.id === id);
          const sliders = page.locator('#simulation input[type="range"]');
          for (let i = 0; i < (await sliders.count()); i++) {
            const slider = sliders.nth(i),
              original = await slider.inputValue();
            const label = await slider.getAttribute("aria-label");
            for (const end of ["min", "max", "default"]) {
              await page.getByRole("button", { name: "恢复默认参数", exact: true }).click();
              await slider.scrollIntoViewIfNeeded();
              if (end !== "default") {
                const box = await slider.boundingBox();
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                await page.mouse.move(
                  end === "min" ? box.x - 10 : box.x + box.width + 10,
                  box.y + box.height / 2,
                  { steps: 3 },
                );
                await page.mouse.up();
              }
              const expected =
                end === "default" ? Number(original) : Number(await slider.getAttribute(end));
              assert.equal(Number(await slider.inputValue()), expected, `${id} ${label} ${end}`);
              await scan(page, `${id} ${label} ${end}`);
              report.sliders.push({ id, width, label, end, value: expected });
            }
          }
          await page.getByRole("button", { name: "恢复默认参数", exact: true }).click();
          const numbers = page.locator('#simulation input[type="number"]');
          for (let i = 0; i < (await numbers.count()); i++) {
            const field = numbers.nth(i),
              original = await field.inputValue();
            for (const end of ["min", "max"]) {
              const raw = await field.getAttribute(end);
              await field.fill(raw);
              await field.blur();
              await scan(page, `${id} number ${i} ${end}`);
              report.numbers.push({ id, width, index: i, end, value: await field.inputValue() });
              await field.fill(original);
              await field.blur();
            }
          }
          await page.getByRole("button", { name: "恢复默认参数", exact: true }).click();
          if (await numbers.count()) {
            const f = numbers.first();
            const original = Number(await f.inputValue());
            const max = Number(await f.getAttribute("max"));
            await f.fill(String(original === max ? Number(await f.getAttribute("min")) : max));
            await f.blur();
          }
          if (width === 1440) {
            const figures = page.locator("#simulation .matlab-figure");
            for (let i = 0; i < (await figures.count()); i++) {
              const fig = figures.nth(i);
              await download(
                page,
                fig.getByRole("button", { name: "导出 MATLAB 代码", exact: true }),
                `${id}-figure-${i}`,
                "m",
                { route, figure: i, category: "figure", nondefault: true },
              );
            }
            if (["1.1.1", "3.2.1", "5.1.1", "7.1"].includes(id))
              for (const kind of ["png", "csv"])
                await download(
                  page,
                  figures.first().getByRole("button", {
                    name: kind === "png" ? "导出 PNG" : "导出数据 CSV",
                    exact: true,
                  }),
                  `${id}-sample`,
                  kind,
                  { route, category: "sample" },
                );
          }
          const examples =
            id === "1.2.4"
              ? [data.instrumentExample]
              : id === "1.2.5"
                ? [data.bandwidthExample]
                : (l?.examples ?? []);
          await worksheets(page, route, examples, width);
          // Every animated lecture must own exactly one timer, including after parameter edits.
          const play = page.getByRole("button", { name: /^播放(?:动画)?$/ });
          if (await play.count()) {
            const baseline = await page.evaluate(() => window.__auditTimers());
            const baselineCount = baseline.intervals + baseline.frames;
            await play.click();
            await page.waitForTimeout(120);
            const running = await page.evaluate(() => window.__auditTimers());
            assert.equal(
              running.intervals + running.frames,
              baselineCount + 1,
              "one new animation scheduler",
            );
            if (await numbers.count()) {
              const f = numbers.first();
              await f.fill(await f.getAttribute("min"));
              await f.blur();
            }
            assert.equal(
              await page.evaluate(() => {
                const t = window.__auditTimers();
                return t.intervals + t.frames;
              }),
              baselineCount + 1,
              "parameter edit retains the scheduler count",
            );
            await page.evaluate(() => {
              location.hash = "#/about";
            });
            await page.locator(".lecture-layout").waitFor({ state: "detached" });
            const stopped = await page.evaluate(() => window.__auditTimers());
            assert.deepEqual(stopped, { intervals: 0, frames: 0 }, "unmount cancels animations");
            report.animations.push({ id, width, baseline, running, stopped });
          }
        } else if (route.startsWith("#/cases?")) {
          const id = new URLSearchParams(route.split("?")[1]).get("project");
          await worksheets(page, route, [data.engineeringCases.find((e) => e.id === id)], width);
        }
        console.log(`PASS ${width} ${route}`);
      });
  }
  assert.deepEqual(report.errors, [], "console, resource and uncaught errors");
  assert.deepEqual(report.failures, [], "browser audit failures");
  console.log(
    `PASS audit: ${report.routes.length} routes, ${report.sliders.length} slider states, ${report.worksheets.length} worksheets, ${report.exports.length} downloads`,
  );
} finally {
  save();
  if (!navigationOnly) fs.writeFileSync(path.join(out, "browser.done"), String(Date.now()));
  await context?.close();
  server.kill();
}
