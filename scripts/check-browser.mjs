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
  ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4174"],
  { windowsHide: true, stdio: "ignore" },
);
let context;
const errors = [];
const runDirectory = path.resolve(`outputs/browser-run-${Date.now()}`);
fs.mkdirSync(runDirectory, { recursive: true });
try {
  for (let i = 0; i < 40; i++) {
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
      await page.screenshot({ path: `${shots}/${name}-${size}.png`, fullPage: true });
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
  for (const [i, t] of topics.entries()) {
    await page.goto("http://127.0.0.1:4174/#/lab?topic=" + t.id);
    await page.getByRole("heading", { name: t.id + " " + t.title, exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1440, t.id);
    if (i % 20 === 0) console.log(`PASS: retained lecture ${i + 1}/${topics.length}`);
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const hash of [
      "#/cases",
      "#/calendar",
      "#/about",
      "#/map",
      "#/compare",
      "#/cases?project=grin-lens",
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
  await context?.close();
  server.kill();
}
