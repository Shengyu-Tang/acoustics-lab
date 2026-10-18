// Run while check-p6-browser's snapshot server is available on 4186.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const work = path.resolve("outputs/P6/home-tmp");
fs.mkdirSync(work, { recursive: true });
process.env.TEMP = process.env.TMP = work;
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 1440 ? 900 : 844 },
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:4186/current/#/");
    await page.locator(".catalog-group").last().waitFor();
    assert.equal(
      await page.locator(".catalog-group[open]").count(),
      0,
      "chapter three starts collapsed",
    );
    await page.locator(".catalog-group").nth(5).locator("summary").click();
    assert.equal(
      await page.locator(".catalog-group[open]").count(),
      1,
      "native summary opens its group",
    );
    await page
      .locator(".catalog-group")
      .evaluateAll((nodes) => nodes.forEach((el) => (el.open = true)));
    await page.locator(".lecture-thumbnail").evaluateAll(async (nodes) => {
      nodes.forEach((el) => (el.loading = "eager"));
      await Promise.all(nodes.map((el) => el.decode()));
    });
    assert.equal(await page.locator(".course-catalog li").count(), 79);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const boxes = await page
      .locator(".course-catalog li")
      .evaluateAll((nodes) => nodes.map((el) => el.getBoundingClientRect().toJSON()));
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        assert.ok(a.bottom <= b.top || b.bottom <= a.top, "expanded lecture rows do not overlap");
      }
    await page
      .locator(".catalog-group")
      .nth(5)
      .screenshot({
        path: `specs/redesign/screenshots/P6/home-chapter3-expanded-${width}.jpg`,
        type: "jpeg",
        quality: 85,
      });
    await page
      .locator(".course-catalog tbody > tr")
      .nth(3)
      .screenshot({
        path: `specs/redesign/screenshots/P6/home-field-thumbnails-${width}.jpg`,
        type: "jpeg",
        quality: 85,
      });
    await page.close();
  }
  console.log(
    "PASS: 79 decoded real thumbnails, native chapter expansion, no expanded row overlap or page overflow at both viewports.",
  );
} finally {
  await browser.close();
}
