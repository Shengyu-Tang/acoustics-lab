import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const out = "specs/redesign/screenshots/calendar-review";
const work = path.resolve("outputs/calendar-browser");
const tmp = path.join(work, "tmp");
for (const dir of [out, tmp]) fs.mkdirSync(dir, { recursive: true });
process.env.TEMP = process.env.TMP = tmp;
const url = "http://127.0.0.1:4178/";
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4178",
    "--strictPort",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let context;
const errors = [],
  report = [];
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Preview server ready");
  context = await chromium.launchPersistentContext(path.join(work, "profile"), {
    channel: "msedge",
    headless: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto(url + "#/calendar");
    await page.locator(".calendar-item").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator(".calendar-item").count(), 24);
    const metrics = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      note: document.querySelector(".calendar-note").textContent,
    }));
    assert.equal(metrics.scrollWidth, width, "No horizontal overflow");
    await page.screenshot({ path: `${out}/calendar-${width}.png` });
    await page
      .locator(".week-lessons")
      .first()
      .screenshot({ path: `${out}/first-two-${width}.png` });
    for (const number of [17, 22]) {
      const lesson = page.locator(".calendar-item").nth(number - 1);
      await lesson.locator("summary").click();
      await lesson.screenshot({ path: `${out}/lesson-${number}-${width}.png` });
      const activity = lesson.locator("ul").first().locator("li").last();
      assert.equal(await activity.locator("a").count(), 0, "Non-MOOC activity has no link");
    }
    const lastWeek = page.locator(".week-lessons").last();
    await lastWeek
      .locator("details")
      .evaluateAll((items) => items.forEach((el) => (el.open = true)));
    await lastWeek.screenshot({ path: `${out}/last-two-${width}.png` });
    assert.doesNotMatch(
      await page.locator(".calendar-page").innerText(),
      /教学安排备注|可顺延|机动缓冲约|教师记录/,
    );
    // Check month navigation still focuses the selected lesson.
    await page.getByRole("button", { name: /^12月14日 第17次课/ }).click();
    await page.waitForFunction(
      () => document.activeElement === document.querySelectorAll(".calendar-item")[16],
    );
    // Follow a current lecture and a legacy lecture through the actual router.
    if (width === 1440) {
      for (const id of ["1.1.2", "7.3"]) {
        await page.goto(url + "#/calendar");
        await page.locator(`.calendar-item a[href="#/lab?topic=${id}"]`).first().click();
        await page.locator("#key-points").waitFor();
        assert.ok((await page.locator("h1").innerText()).includes(id));
      }
    }
    report.push(metrics);
    console.log(`PASS: calendar screenshots and navigation at ${width}px`);
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${out}/metrics.json`, JSON.stringify(report, null, 2) + "\n");
} finally {
  await context?.close();
  server.kill();
}
