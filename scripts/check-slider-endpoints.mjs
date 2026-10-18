// Real pointer drags, isolated local Edge profile, screenshots of every slider endpoint.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const out = path.resolve("outputs/slider-check");
fs.mkdirSync(out, { recursive: true });
process.env.TEMP = process.env.TMP = path.join(out, "tmp");
fs.mkdirSync(process.env.TEMP, { recursive: true });
const ids = fs
  .readdirSync("src/content/lectures")
  .filter((f) => /^[1-7]\./.test(f))
  .map((f) => f.slice(0, -3));
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
const selected =
  process.argv.find((a) => a.startsWith("--lectures="))?.slice(11) ??
  process.argv.find((a) => a.startsWith("--lecture="))?.slice(10);
const captureIds = ids.filter(
  (id) => !selected || selected.split(",").some((prefix) => id === prefix || id.startsWith(prefix)),
);

let context;
const errors = [],
  report =
    selected && fs.existsSync(path.join(out, "report.json"))
      ? JSON.parse(fs.readFileSync(path.join(out, "report.json"), "utf8")).screenshots.filter(
          (r) => !captureIds.includes(r.id),
        )
      : [];
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4178/")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  context = await chromium.launchPersistentContext(path.join(out, `profile-${Date.now()}`), {
    channel: "msedge",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const id of captureIds) {
    await page.goto("http://127.0.0.1:4178/#/lab?topic=" + id);
    await page.locator("#simulation .matlab-figure").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const defaultFile = `${id}-default.png`;
    await page.locator("#simulation").screenshot({ path: path.join(out, defaultFile) });
    if (process.argv.includes("--defaults-only")) continue;
    if (["3.4.1", "1.1.3", "1.2.2", "2.2", "3.3.2"].includes(id)) {
      fs.mkdirSync("specs/redesign/screenshots/P2-3", { recursive: true });
      fs.copyFileSync(
        path.join(out, defaultFile),
        `specs/redesign/screenshots/P2-3/${defaultFile}`,
      );
    }
    const sliders = page.locator("#simulation input[type=range]");
    const count = await sliders.count();
    assert.ok(count > 0, id);
    for (let i = 0; i < count; i++)
      for (const end of ["min", "max"]) {
        await page.getByRole("button", { name: "恢复默认参数", exact: true }).click();
        // Conditional sliders are reviewed in the state where they operate.
        if (id === "3.1.3" && i === 3)
          await page.getByRole("checkbox", { name: "小振幅", exact: true }).uncheck();
        if (id === "3.5.2" && i >= 5) {
          const n = sliders.nth(4);
          await n.scrollIntoViewIfNeeded();
          const b = await n.boundingBox();
          await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
          await page.mouse.down();
          await page.mouse.move(b.x + b.width + 20, b.y + b.height / 2, { steps: 5 });
          await page.mouse.up();
        }
        if (id === "2.1" && i === 4)
          await page.getByRole("combobox", { name: "右端边界条件", exact: true }).selectOption("1");
        if (id === "3.10.2" && i >= 6)
          await page
            .getByRole("combobox", { name: "源分布", exact: true })
            .selectOption(i < 8 ? "1" : "2");
        const slider = sliders.nth(i);
        await slider.scrollIntoViewIfNeeded();
        const label = await slider.getAttribute("aria-label");
        const expected = Number(await slider.getAttribute(end));
        const b = await slider.boundingBox();
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
        await page.mouse.down();
        await page.mouse.move(end === "min" ? b.x - 20 : b.x + b.width + 20, b.y + b.height / 2, {
          steps: 10,
        });
        await page.mouse.up();
        assert.equal(Number(await slider.inputValue()), expected, `${id} ${label} ${end}`);
        await page.waitForTimeout(80);
        const axes = await page
          .locator("#simulation svg [data-x-tick],#simulation svg [data-y-tick]")
          .evaluateAll((ns) => ns.map((n) => n.textContent));
        const file = `${id}-slider${i + 1}-${end}.png`;
        await page.locator("#simulation").screenshot({ path: path.join(out, file) });
        if (id === "2.1" && i === 2)
          await page
            .locator("#simulation .matlab-figure")
            .first()
            .screenshot({ path: path.join(out, `2.1-L-${expected}m.png`) });
        report.push({ id, slider: i + 1, label, end, value: expected, file, axes });
        fs.writeFileSync(
          path.join(out, "report.json"),
          JSON.stringify({ screenshots: report, errors }, null, 2),
        );
      }
    if (id === "3.4.2") {
      await page.getByRole("button", { name: "恢复默认参数", exact: true }).click();
      const area = page.locator("#simulation [data-plot-area]").nth(1),
        b = await area.boundingBox();
      await page.mouse.click(b.x + b.width * 0.25, b.y + b.height * 0.5);
      assert.ok(
        Math.abs(
          Number(
            await page
              .getByRole("spinbutton", { name: "观察点位置数值", exact: true })
              .inputValue(),
          ) - 0.5,
        ) < 0.01,
        "physical observer pointer coordinate",
      );
    }
    if (id === "3.4.5") {
      await page.getByRole("button", { name: "恢复默认参数", exact: true }).click();
      await page.getByRole("combobox", { name: "初始波形", exact: true }).selectOption("2");
      const area = page.locator("#simulation [data-plot-area]").first();
      await area.scrollIntoViewIfNeeded();
      const b = await area.boundingBox(),
        x = (0.75 * 343) / 1000;
      const yMin = Number(await area.getAttribute("data-y-min")),
        yMax = Number(await area.getAttribute("data-y-max"));
      await page.mouse.click(
        b.x + (b.width * x) / 2,
        b.y + (b.height * (yMax - 0.4)) / (yMax - yMin),
      );
      const event = page.waitForEvent("download");
      await page
        .locator("#simulation .matlab-figure")
        .first()
        .getByRole("button", { name: "导出数据 CSV", exact: true })
        .click();
      const file = path.join(out, "physical-handdraw.csv");
      await (await event).saveAs(file);
      const points = fs
        .readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((row) => [...row.matchAll(/"([^"]*)"/g)].map((m) => m[1]))
        .filter((row) => row[1] === "初始波形");
      const nearest = points.sort(
        (a, b) => Math.abs(Number(a[2]) - x) - Math.abs(Number(b[2]) - x),
      )[0];
      assert.ok(
        Math.abs(Number(nearest[3]) - 0.4) < 0.05,
        "hand-drawn sample follows physical pointer position",
      );
    }
    console.log(`PASS ${id}: ${count} sliders dragged to both ends`);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${report.length} endpoint screenshots`);
} finally {
  server.kill();
  await Promise.race([context?.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
}

process.exit(process.exitCode ?? 0);
