import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const work = path.resolve("outputs/P4-1/browser"),
  evidence = "specs/redesign/screenshots/P4-1";
for (const d of [work, work + "/tmp", evidence]) fs.mkdirSync(d, { recursive: true });
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
const captures = [],
  errors = [];
const requested = ["4.1", "4.2.2", "4.4.3", "4.4.4", "5.2", "6.1", "6.2"];
const topics = JSON.parse(fs.readFileSync("src/topics.json", "utf8")).filter((t) =>
  /^[4-7]\./.test(t.id),
);
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
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const t of topics) {
      await page.goto(`http://127.0.0.1:4185/#/lab?topic=${t.id}`);
      await page.getByRole("heading", { name: `${t.id} ${t.title}`, exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        t.id + " overflow",
      );
      const labels = await page
        .locator("[data-annotation-label]")
        .evaluateAll((nodes) =>
          nodes.map((n) => ({ text: n.textContent, box: n.getBoundingClientRect().toJSON() })),
        );
      for (const [i, a] of labels.entries())
        for (const b of labels.slice(i + 1)) {
          assert.ok(
            a.box.right <= b.box.left ||
              b.box.right <= a.box.left ||
              a.box.bottom <= b.box.top ||
              b.box.bottom <= a.box.top,
            `${t.id} ${width}: ${a.text}/${b.text}`,
          );
        }
      if (t.id === "4.4.4") {
        const figure = page.locator("#simulation .matlab-figure").first();
        const area = await figure.locator("[data-plot-area]").boundingBox();
        for (const box of await figure
          .locator("[data-annotation-label]")
          .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().toJSON())))
          assert.ok(
            box.top >= area.y - 1 && box.bottom <= area.y + area.height + 1,
            "B2 xline labels must stay inside the axes",
          );
      }
      const figs = page.locator(".matlab-figure");
      for (let i = 0; i < (await figs.count()); i++) {
        const file = `${work}/${t.id}-figure${i + 1}-${size}.png`;
        await figs.nth(i).screenshot({ path: file });
        captures.push({
          lecture: t.id,
          size,
          width,
          figure: i + 1,
          file: path.relative(process.cwd(), file).replaceAll("\\", "/"),
        });
      }
      if (requested.includes(t.id)) {
        await page.locator("#simulation").screenshot({ path: `${evidence}/${t.id}-${size}.png` });
        await page.screenshot({ path: `${work}/${t.id}-${size}-full.png`, fullPage: true });
      }
      console.log(`PASS default captures ${t.id} ${size}`);
    }
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${evidence}/manifest.json`,
    JSON.stringify(
      {
        lectures: topics.length,
        viewports: [
          [1440, 900],
          [390, 844],
        ],
        requested,
        captures,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  server.kill();
  await Promise.race([context?.close(), new Promise((r) => setTimeout(r, 5000))]);
}
process.exit(0);
