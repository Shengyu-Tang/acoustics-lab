import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { models } from "./p5-models.mjs";
const all = await models(),
  work = path.resolve("outputs/P5/expanded-lectures");
fs.mkdirSync(work, { recursive: true });
process.env.TEMP = work;
process.env.TMP = work;
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
  { stdio: "ignore", windowsHide: true },
);
let context;
const errors = [],
  report = [];
try {
  context = await chromium.launchPersistentContext(work + "/profile-" + Date.now(), {
    channel: "msedge",
    headless: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const l of all.lectures) {
      await page.goto(`http://127.0.0.1:4186/#/lab?topic=${l.id}`);
      await page.getByRole("heading", { name: l.id + " " + l.title, exact: true }).waitFor();
      await page.locator(".reference-solution summary").waitFor();
      await page.locator(".reference-solution summary").click();
      await page.evaluate(() => document.fonts.ready);
      const e = l.defaults ? l.examples[0] : l.id === "1.2.4" ? all.instrument : all.bandwidth;
      assert.equal(
        await page.locator(".student-answer input").count(),
        e.asks.length,
        l.id + " graded questions",
      );
      assert.ok(
        (await page.locator(".solution-content section").count()) >= 2,
        l.id + " numerical steps",
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        l.id + " expanded solution width",
      );
      assert.equal(await page.locator(".katex-error").count(), 0, l.id + " equations parse");
      if (["1.2.5", "3.1.3", "3.1.5", "3.1.8", "3.6.8"].includes(l.id))
        await page
          .locator(".calculation-example")
          .screenshot({ path: `specs/redesign/screenshots/P5/${l.id}-solution-${width}.png` });
      report.push({ lecture: l.id, width, height, asks: e.asks.length, passed: true });
    }
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "specs/redesign/P5-expanded-lectures-validation.json",
    JSON.stringify({ report, errors }, null, 2) + "\n",
  );
  console.log(
    "PASS: 79 expanded lecture worksheets at both viewports, graded question counts, numerical steps, equations and no horizontal page overflow.",
  );
} finally {
  server.kill();
  await Promise.race([context?.close(), new Promise((r) => setTimeout(r, 5000))]);
}
process.exit(0);
