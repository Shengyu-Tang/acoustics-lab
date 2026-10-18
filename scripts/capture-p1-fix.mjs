import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const out = "specs/redesign/screenshots/P1-fix",
  work = path.resolve("outputs/p1-fix-browser");
for (const dir of [out, work, path.join(work, "tmp")]) fs.mkdirSync(dir, { recursive: true });
process.env.TEMP = process.env.TMP = path.join(work, "tmp");
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4176",
    "--strictPort",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let context;
const report = [],
  errors = [],
  downloads = [];
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4176/")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  context = await chromium.launchPersistentContext(path.join(work, `profile-${Date.now()}`), {
    channel: "msedge",
    headless: true,
    acceptDownloads: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const ids = fs.readdirSync("src/content/lectures").map((f) => f.replace(".ts", ""));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const id of ["home", "calendar", ...ids]) {
      await page.goto(
        "http://127.0.0.1:4176/" +
          (id === "home" ? "#/" : id === "calendar" ? "#/calendar" : "#/lab?topic=" + id),
      );
      await page.locator("h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      if (ids.includes(id)) {
        if (width === 1440) {
          for (const label of ["导出 MATLAB 代码", "导出 MATLAB 计算脚本"]) {
            const event = page.waitForEvent("download");
            await page.getByRole("button", { name: label, exact: true }).first().click();
            const download = await event;
            if (!/^[A-Za-z]\w*\.m$/.test(download.suggestedFilename()))
              throw new Error("MATLAB filename: " + download.suggestedFilename());
            downloads.push({ id, label, file: download.suggestedFilename() });
            const script = fs.readFileSync(await download.path(), "utf8");
            if (!script.includes("% 参数块") || script.includes("undefined"))
              throw new Error("Invalid model download: " + id);
          }
        }
        await page
          .locator("#simulation")
          .evaluate((el) => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - 15));
        await page.screenshot({ path: `${out}/${id}-simulation-${width}.png` });
        await page
          .locator(".calculation-example .matlab-figure")
          .first()
          .screenshot({ path: `${out}/${id}-example-${width}.png` });
        if (id === "2.2")
          await page
            .locator("#simulation .matlab-figure")
            .nth(1)
            .screenshot({ path: `${out}/2.2-coefficients-${width}.png` });
      } else await page.screenshot({ path: `${out}/${id}-${width}.png` });
      if (id === "calendar") {
        if (await page.getByText(/第43|用于回顾/).count()) throw new Error("Stale calendar prose");
        if ((await page.locator(".calendar-item").count()) !== 24)
          throw new Error("Calendar count");
        const sixth = page.locator(".calendar-item").nth(5);
        await sixth.screenshot({ path: `${out}/calendar-sixth-${width}.png` });
        if ((await sixth.locator('a[href="#/lab?topic=3.1.1"]').count()) !== 1)
          throw new Error("Missing section link");
      }
      if (
        id === "home" &&
        (await page.getByRole("heading", { name: "本周课程", exact: true }).count())
      )
        throw new Error("Weekly block retained");
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        layout: [...document.querySelectorAll(".simulation-layout")].map((el) => ({
          plot: el.querySelector(".simulation-plots").getBoundingClientRect().toJSON(),
          side: el.querySelector(".simulation-sidebar").getBoundingClientRect().toJSON(),
          position: getComputedStyle(el.querySelector(".simulation-sidebar")).position,
        })),
      }));
      if (metrics.scroll !== width) throw new Error(id + " overflow");
      if (width === 1440 && metrics.layout.length) {
        const { plot, side, position } = metrics.layout[0];
        if (side.x < plot.right || Math.abs(side.width - 300) > 1 || position !== "sticky")
          throw new Error(id + " desktop side layout");
      }
      report.push({ id, ...metrics });
      console.log(`Captured ${id} at ${width}`);
    }
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("http://127.0.0.1:4176/#/lab?topic=1.2.4");
  await page.locator(".simulation-sidebar").waitFor();
  const breakpoint = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    side: document.querySelector(".simulation-sidebar").getBoundingClientRect().width,
    columns: getComputedStyle(document.querySelector(".simulation-layout")).gridTemplateColumns,
  }));
  if (breakpoint.scroll !== 1200 || Math.abs(breakpoint.side - 300) > 1)
    throw new Error("1200px layout");
  report.push({ id: "1200-breakpoint", ...breakpoint });
  await page
    .locator("#simulation")
    .evaluate((el) => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - 15));
  await page.screenshot({ path: `${out}/1.2.4-simulation-1200.png` });
  if (errors.length) throw new Error(errors.join("\n"));
  fs.writeFileSync(`${out}/metrics.json`, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(`${out}/downloads.json`, JSON.stringify(downloads, null, 2) + "\n");
} finally {
  await context?.close();
  server.kill();
}
