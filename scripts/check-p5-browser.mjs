import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { models } from "./p5-models.mjs";
import { secondSet } from "./p5-parameter-sets.mjs";
const { engineeringCases: cases } = await models();
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const folder = "specs/redesign/screenshots/P5";
fs.mkdirSync(folder, { recursive: true });
fs.mkdirSync("outputs/P5/browser-tmp", { recursive: true });
process.env.TEMP = path.resolve("outputs/P5/browser-tmp");
process.env.TMP = process.env.TEMP;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4185",
    "--strictPort",
  ],
  { stdio: "ignore", windowsHide: true },
);
let context;
const errors = [],
  report =
    only && fs.existsSync("specs/redesign/P5-browser-validation.json")
      ? JSON.parse(
          fs.readFileSync("specs/redesign/P5-browser-validation.json", "utf8"),
        ).report.filter((r) => r.case !== only)
      : [];
try {
  context = await chromium.launchPersistentContext(
    path.resolve("outputs/P5/browser-profile-" + Date.now()),
    {
      channel: "msedge",
      headless: true,
      acceptDownloads: true,
      downloadsPath: path.resolve("outputs/P5/downloads"),
      reducedMotion: "reduce",
    },
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const e of cases.filter((e) => !only || e.id === only)) {
      if(only) await page.goto("about:blank");
      await page.goto(`http://127.0.0.1:4185/#/cases?project=${e.id}`);
      await page.locator(".calculation-example h3").filter({ hasText: e.title }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.title(), e.title + " · 声学基础 · 中国海洋大学");
      assert.equal(await page.locator(".student-answer input").count(), e.asks.length);
      assert.equal(
        (await page.locator(".case-problem a[href^='#/lab?topic=']").count()) >= 3,
        true,
      );
      await page.getByRole("button", { name: "提示 2：代入步骤", exact: true }).click();
      assert.equal(await page.locator(".example-hints p").count(), 2);
      for (const a of e.asks)
        await page
          .getByRole("spinbutton", { name: a.text, exact: true })
          .fill(String(Number(a.calc(e.defaults).toPrecision(4))));
      await page.getByRole("button", { name: "提交答案", exact: true }).click();
      assert.deepEqual(
        await page.locator(".student-answer output").allTextContents(),
        e.asks.map(() => "正确"),
      );
      await page.locator(".reference-solution summary").click();
      assert.equal(await page.locator(".solution-content section").count(), e.asks.length);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        e.id + " page width",
      );
      await page.screenshot({ path: `${folder}/${e.id}-${size}.png`, fullPage: true });
      const figures = page.locator(".calculation-example .matlab-figure");
      for (let i = 0; i < (await figures.count()); i++)
        await figures.nth(i).screenshot({ path: `${folder}/${e.id}-figure${i + 1}-${size}.png` });
      await page
        .locator(".calculation-example table")
        .screenshot({ path: `${folder}/${e.id}-givens-${size}.png` });
      // No overflowing inline formulas after the numerical steps are expanded.
      const horizontal = await page.evaluate(() =>
        [...document.querySelectorAll(".solution-content p")]
          .filter((el) => el.scrollWidth > el.clientWidth + 2)
          .map((el) => el.textContent),
      );
      assert.deepEqual(horizontal, [], e.id + " solution overflow");
      const newP = secondSet(e),
        before = await page.locator(".solution-content").innerText();
      for (const d of e.given) {
        await page
          .getByRole("spinbutton", { name: "例题" + d.name, exact: true })
          .fill(String(newP[d.key]));
        await page.getByRole("spinbutton", { name: "例题" + d.name, exact: true }).press("Tab");
      }
      assert.notEqual(
        await page.locator(".solution-content").innerText(),
        before,
        e.id + " recomputed solution",
      );
      assert.equal(
        await page.locator(".student-answer output").count(),
        0,
        e.id + " stale grading cleared",
      );
      for (const a of e.asks)
        await page
          .getByRole("spinbutton", { name: a.text, exact: true })
          .fill(String(Number(a.calc(newP).toPrecision(4))));
      await page.getByRole("button", { name: "提交答案", exact: true }).click();
      assert.deepEqual(
        await page.locator(".student-answer output").allTextContents(),
        e.asks.map(() => "正确"),
      );
      if (size === "desktop") {
        const [dl] = await Promise.all([
          page.waitForEvent("download"),
          page.getByRole("button", { name: "导出 MATLAB 计算脚本", exact: true }).click(),
        ]);
        await dl.saveAs(path.resolve("outputs/P5/" + dl.suggestedFilename()));
        const source = fs.readFileSync(
          path.resolve("outputs/P5/" + dl.suggestedFilename()),
          "utf8",
        );
        assert.ok(source.includes("worksheet_answers"));
        for (const d of e.given)
          assert.ok(
            source.includes(`${d.key} = ${newP[d.key]};`),
            e.id + " parameter in downloaded script " + d.key,
          );
        await page.evaluate(() => {
          window.__printed = false;
          window.print = () => {
            window.__printed = document.querySelector(".reference-solution").open;
            window.dispatchEvent(new Event("afterprint"));
          };
        });
        await page.getByRole("button", { name: "打印本题", exact: true }).click();
        assert.ok(await page.evaluate(() => window.__printed));
      }
      report.push({
        case: e.id,
        size,
        width,
        height,
        questions: e.asks.length,
        figures: await figures.count(),
        passed: true,
      });
      console.log(`PASS ${e.id} ${size}: grading, hints, recalculation, figures and screenshot`);
    }
  }
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const id of ["1.2.5", "3.1.3", "3.1.5", "3.1.8", "3.6.8"]) {
      await page.goto(`http://127.0.0.1:4185/#/lab?topic=${id}`);
      await page
        .getByRole("heading", { name: new RegExp("^" + id.replaceAll(".", "\\.") + " ") })
        .waitFor();
      const fig = page.locator(".calculation-example .matlab-figure").first();
      await fig.waitFor();
      await page.evaluate(() => document.fonts.ready);
      await fig.screenshot({ path: `${folder}/${id}-example-${size}.png` });
    }
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "specs/redesign/P5-browser-validation.json",
    JSON.stringify({ report, errors }, null, 2) + "\n",
  );
} finally {
  server.kill();
  await Promise.race([context?.close(), new Promise((r) => setTimeout(r, 5000))]);
}
process.exit(0);
