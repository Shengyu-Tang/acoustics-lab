// P2 browser acceptance and visual evidence. No browser profile or download leaves this clone.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const out = "specs/redesign/screenshots/P2",
  work = path.resolve("outputs/p2-browser"),
  report = [],
  errors = [];
for (const dir of [out, work, path.join(work, "tmp"), path.join(work, "downloads")])
  fs.mkdirSync(dir, { recursive: true });
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
const selected = process.argv
  .find((a) => a.startsWith("--lectures="))
  ?.slice(11)
  .split(",");
const topics = JSON.parse(fs.readFileSync("src/topics.json", "utf8")).filter(
  (t) => /^3\.[1-5]\./.test(t.id) && (!selected || selected.includes(t.id)),
);
const refs = JSON.parse(fs.readFileSync("scripts/p2-reference-answers.json", "utf8"));
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
    downloadsPath: path.join(work, "downloads"),
    reducedMotion: "reduce",
  });
  context.setDefaultTimeout(90000);
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
    await page.goto("http://127.0.0.1:4176/#/");
    await page.locator(".lecture-thumbnail").first().waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((im) => {
          im.loading = "eager";
          return im.decode();
        }),
      );
    });
    assert.equal(await page.locator(".lecture-thumbnail").count(), 35);
    await page.screenshot({ path: `${out}/home-${size}.png`, fullPage: true });
    for (const t of topics) {
      await page.goto(`http://127.0.0.1:4176/#/lab?topic=${t.id}`);
      await page.getByRole("heading", { name: `${t.id} ${t.title}`, exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);
      assert.equal(await page.locator(".student-answer input").count(), 2);
      const dims = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        figures: document.querySelectorAll(".matlab-figure").length,
      }));
      assert.equal(dims.scroll, width, t.id + " overflow");
      const formulas = await page
        .locator(".formula-line")
        .evaluateAll((els) => els.map((e) => ({ scroll: e.scrollWidth, width: e.clientWidth })));
      assert.ok(
        formulas.every((f) => f.scroll <= f.width + 1),
        t.id + " formula row overflow",
      );
      await page.screenshot({ path: `${out}/${t.id}-${size}-full.png`, fullPage: true });
      await page
        .locator("#simulation")
        .evaluate((el) => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - 65));
      await page.screenshot({ path: `${out}/${t.id}-${size}.png` });
      const figs = page.locator(".matlab-figure");
      for (let i = 0; i < (await figs.count()); i++)
        await figs.nth(i).screenshot({ path: `${out}/${t.id}-figure${i + 1}-${size}.png` });
      const answers = page.locator(".student-answer input");
      for (let i = 0; i < 2; i++) await answers.nth(i).fill(String(refs[t.id][i]));
      await page.getByRole("button", { name: "提交答案", exact: true }).click();
      assert.deepEqual(await page.locator(".student-answer output").allTextContents(), [
        "正确",
        "正确",
      ]);
      await page.getByRole("button", { name: "提示 1：选择公式" }).click();
      await page.getByRole("button", { name: "提示 2：代入步骤" }).click();
      await page.locator(".reference-solution summary").click();
      await page
        .locator(".calculation-example")
        .screenshot({ path: `${out}/${t.id}-worked-${size}.png` });
      const solution = await page.locator(".solution-content").textContent();
      const given = page.locator(".calculation-example table input").first();
      const old = Number(await given.inputValue());
      await given.fill(
        String(old + Math.max(Math.abs(old) * 0.1, Number(await given.getAttribute("step")))),
      );
      await given.blur();
      assert.notEqual(
        await page.locator(".solution-content").textContent(),
        solution,
        `${t.id}: reactive reference solution`,
      );
      if (size === "desktop")
        for (let i = 0; i < (await figs.count()); i++) {
          const download = page.waitForEvent("download");
          await figs.nth(i).getByRole("button", { name: "导出 MATLAB 代码", exact: true }).click();
          const d = await download;
          const file = path.join(work, "downloads", `${t.id}-${i}.m`);
          await d.saveAs(file);
          const source = fs.readFileSync(file, "utf8");
          assert.ok(source.includes("% 参数块") && !source.includes("undefined"), t.id + " export");
        }
      const selects = page.locator("#simulation > label select");
      if (await selects.count()) {
        const svg = await page.locator("#simulation").innerHTML();
        await selects.first().selectOption({ index: 1 });
        await page.waitForTimeout(50);
        assert.notEqual(
          await page.locator("#simulation").innerHTML(),
          svg,
          t.id + " selector changes plot",
        );
      }
      const play = page.getByRole("button", { name: "单步", exact: true });
      if (await play.count()) {
        const at0 = await page.locator("#simulation svg").allInnerTexts();
        const source = await page.locator("#simulation").innerHTML();
        await play.click();
        assert.notEqual(
          await page.locator("#simulation").innerHTML(),
          source,
          t.id + " animation single step",
        );
      }
      report.push({ id: t.id, size, ...dims, grading: "2/2", reactivity: true });
      console.log(`PASS P2 ${t.id} ${size}`);
    }
  }
  // Specific controls required by 01.
  await page.goto("http://127.0.0.1:4176/#/lab?topic=3.1.3");
  await page.locator("#simulation input[type=checkbox]").first().uncheck();
  assert.ok(await page.getByText("有耗散示意：振幅衰减", { exact: true }).count());
  await page.getByRole("checkbox", { name: "小振幅", exact: true }).uncheck();
  const distortion = page.getByRole("spinbutton", { name: "非线性示意强度数值", exact: true });
  await distortion.fill("0");
  await distortion.blur();
  const linearShape = await page.locator("#simulation svg").first().innerHTML();
  await distortion.fill("0.4");
  await distortion.blur();
  assert.notEqual(
    await page.locator("#simulation svg").first().innerHTML(),
    linearShape,
    "gradual nonlinear steepening control",
  );
  await page
    .locator("#simulation .matlab-figure")
    .first()
    .screenshot({ path: `${out}/3.1.3-nonlinear-mobile.png` });
  await page.goto("http://127.0.0.1:4176/#/lab?topic=3.2.1");
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  assert.equal(await page.locator(".p2-derivation [aria-current=step]").count(), 1);
  await page.goto("http://127.0.0.1:4176/#/lab?topic=3.4.6");
  await page.getByRole("spinbutton", { name: "声压有效值级", exact: true }).fill("100");
  await page.getByRole("spinbutton", { name: "声压有效值级", exact: true }).blur();
  assert.ok(
    (
      await page
        .locator(".p2-converter input")
        .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width))
    ).every((w) => w >= 70),
    "all converter inputs retain readable widths",
  );
  assert.equal(
    Number(
      await page.getByRole("spinbutton", { name: "声压有效值线性值", exact: true }).inputValue(),
    ),
    2,
  );
  await page.goto("http://127.0.0.1:4176/#/lab?topic=3.4.5");
  await page.getByRole("combobox", { name: "初始波形", exact: true }).selectOption("2");
  const sketch = page.locator("#simulation .matlab-figure").first();
  await sketch.scrollIntoViewIfNeeded();
  const sketchBefore = await sketch.locator("svg").innerHTML(),
    box = await sketch.locator("svg").boundingBox();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.65, { steps: 8 });
  await page.mouse.up();
  await page.evaluate(() => getSelection()?.removeAllRanges());
  assert.notEqual(
    await sketch.locator("svg").innerHTML(),
    sketchBefore,
    "student sketch edits waveform",
  );
  await page.screenshot({ path: `${out}/3.4.5-hand-drawn-mobile.png` });
  await page.goto("http://127.0.0.1:4176/#/lab?topic=3.4.2");
  const observer = page.getByRole("spinbutton", { name: "观察点位置数值", exact: true }),
    beforeObserver = await observer.inputValue();
  const linked = page.locator("#simulation .matlab-figure").first();
  await linked.scrollIntoViewIfNeeded();
  const lb = await linked.locator("svg").boundingBox();
  await page.mouse.move(lb.x + lb.width * 0.7, lb.y + lb.height * 0.75);
  await page.mouse.down();
  await page.mouse.move(lb.x + lb.width * 0.8, lb.y + lb.height * 0.75);
  await page.mouse.up();
  assert.notEqual(
    await observer.inputValue(),
    beforeObserver,
    "dragging linked plot moves observation point",
  );
  await page.goto("http://127.0.0.1:4176/#/lab?topic=3.4.6");
  const count = page.getByRole("spinbutton", { name: "相同非相干声源数数值", exact: true });
  await count.fill("2.7");
  await count.blur();
  assert.equal(await count.inputValue(), "3");
  assert.deepEqual(errors, []);
  const previous = selected
    ? JSON.parse(
        fs.readFileSync("specs/redesign/P2-browser-validation.json", "utf8"),
      ).report.filter((r) => !selected.includes(r.id))
    : [];
  fs.writeFileSync(
    "specs/redesign/P2-browser-validation.json",
    JSON.stringify(
      {
        viewports: [
          [1440, 900],
          [390, 844],
        ],
        report: [...previous, ...report],
        errors,
        checks: [
          "all graded answers",
          "reactive solutions",
          "editable MATLAB downloads",
          "selectors",
          "single-step animations",
          "five assumptions",
          "derivation",
          "bidirectional level conversion",
          "student-drawn waveform",
          "dragged observation point",
          "integer source counts",
        ],
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
