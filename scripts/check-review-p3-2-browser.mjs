import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { models } from "./p4-models.mjs";
const { reviewLectures, scriptParts } = await models(),
  out = "specs/redesign/screenshots/P3-2",
  work = path.resolve("outputs/P4/prereq-browser");
for (const d of [out, work, work + "/tmp"]) fs.mkdirSync(d, { recursive: true });
process.env.TEMP = process.env.TMP = work + "/tmp";
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
  { windowsHide: true, stdio: "ignore" },
);
let context;
const report = [],
  errors = [];
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4185")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  context = await chromium.launchPersistentContext(work + "/profile-" + Date.now(), {
    channel: "msedge",
    headless: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  context.setDefaultTimeout(90000);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const l of reviewLectures) {
      await page.goto("http://127.0.0.1:4185/#/lab?topic=" + l.id);
      await page.getByRole("heading", { name: l.id + " " + l.title, exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const q = l.examples[0].plot(l.examples[0].defaults),
        figure = page.locator(".calculation-example .matlab-figure").first();
      const norm = (s) =>
        scriptParts(s)
          .map((p) => p.value)
          .join("");
      assert.ok(
        (await figure.textContent()).includes(norm(q.title)),
        l.id + " correct answer title",
      );
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      const file = out + "/" + l.id + "-E1-" + (width === 1440 ? "desktop" : "mobile") + ".png";
      await figure.screenshot({ path: file });
      report.push({ id: l.id, width, file, title: q.title });
      console.log("PASS review labels " + l.id + " " + width);
    }
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "specs/redesign/P3-2-browser-validation.json",
    JSON.stringify({ report, errors }, null, 2) + "\n",
  );
} finally {
  server.kill();
  await context?.close();
}
process.exit(0);
