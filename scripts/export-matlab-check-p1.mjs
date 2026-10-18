// Run after npm run build. All profiles, downloads, MATLAB preferences and logs stay in this clone.
// Optional --export-only / --render-only support iterating on one stage.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const out = path.join(root, "specs/redesign/matlab-check/P1");
const work = path.join(root, "outputs/matlab-check/P1");
for (const dir of [
  out,
  work,
  path.join(work, "tmp"),
  path.join(work, "prefs"),
  path.join(work, "downloads"),
])
  fs.mkdirSync(dir, { recursive: true });
process.env.TEMP = process.env.TMP = path.join(work, "tmp");
process.env.MATLAB_PREFDIR = path.join(work, "prefs");
fs.writeFileSync(
  path.join(work, "startup.m"),
  "% Batch QA: isolated startup; no desktop integration.\n",
);
const selected = process.argv.find((a) => a.startsWith("--lecture="))?.split("=")[1];
const selectedFigures = process.argv
  .find((a) => a.startsWith("--figure="))
  ?.split("=")[1]
  .split(",");
const topics = fs
  .readdirSync("src/content/lectures")
  .filter((f) => !["1.2.4.ts", "1.2.5.ts"].includes(f) || f === selected + ".ts")
  .map((f) => f.replace(".ts", ""))
  .filter((id) => !selected || id === selected);
let names = process.argv.includes("--render-only")
  ? fs
      .readdirSync(out)
      .filter((f) => f.endsWith(".m") && (!selected || f.startsWith(selected + "-")))
      .map((f) => f.slice(0, -2))
  : [];
const url = "http://127.0.0.1:4175/";

if (!process.argv.includes("--render-only")) {
  const server = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      "4175",
      "--strictPort",
    ],
    { cwd: root, windowsHide: true, stdio: "ignore" },
  );
  let context;
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error("Preview server failed on port 4175");
      try {
        ready = (await fetch(url)).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error("Preview server startup timed out");
    context = await chromium.launchPersistentContext(path.join(work, `profile-${Date.now()}`), {
      channel: "msedge",
      headless: true,
      acceptDownloads: true,
      downloadsPath: path.join(work, "downloads"),
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const topic of topics) {
      await page.goto(url + "#/lab?topic=" + topic);
      const figures = page.locator(".matlab-figure");
      await figures.first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (let index = 0; index < (await figures.count()); index++) {
        const caption = await figures.nth(index).locator("figcaption").textContent();
        const name = caption.match(/^图 ([^　]+)/)[1];
        if (selectedFigures && !selectedFigures.includes(name)) continue;
        names.push(name);
        const figure = figures.filter({
          has: page.locator("figcaption", { hasText: `图 ${name}　` }),
        });
        if ((await figure.count()) !== 1) throw new Error(`Expected exactly one figure ${name}`);
        // Capture calculation exports as well as every figure.
        const downloaded = page.waitForEvent("download");
        await figure.getByRole("button", { name: "导出 MATLAB 代码", exact: true }).click();
        await (await downloaded).saveAs(path.join(out, name + ".m"));
        await figure.screenshot({ path: path.join(work, name + "-web.png") });
        console.log("Exported " + name + ".m");
      }
    }
    for (const topic of topics) {
      await page.goto(url + "#/lab?topic=" + topic);
      const buttons = page.getByRole("button", { name: "导出 MATLAB 计算脚本", exact: true });
      await buttons.first().waitFor();
      for (let i = 0; i < (await buttons.count()); i++) {
        const name = topic + "-E" + (i + 1) + "-calculation";
        if (selectedFigures && !selectedFigures.includes(name)) continue;
        const event = page.waitForEvent("download");
        await buttons.nth(i).click();
        await (await event).saveAs(path.join(out, name + ".m"));
        names.push(name);
      }
    }
    if (errors.length) throw new Error(errors.join("\n"));
  } finally {
    server.kill();
    // Edge can retain a download handle after a persistent context closes.
    await Promise.race([context?.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
  }
}

if (!process.argv.includes("--export-only")) {
  const matlab = process.env.MATLAB_EXE ?? "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe";
  const mq = (s) => "'" + s.replaceAll("\\", "/").replaceAll("'", "''") + "'";
  const results = [];
  for (const name of names.filter((n) => !selectedFigures || selectedFigures.includes(n))) {
    fs.rmSync(path.join(out, name + ".png"), { force: true });
    // Figure numbers contain dots/hyphens and are not MATLAB identifiers; evaluate their UTF-8 source.
    const command = `eval(fileread(${mq(path.join(out, name + ".m"))})); drawnow; exportgraphics(gcf,${mq(path.join(out, name + ".png"))},'Resolution',150); close all;`;
    // Each script gets its own process: a script's clear cannot erase loop variables.
    const result = await new Promise((resolve, reject) => {
      const child = spawn(matlab, ["-sd", work, "-batch", command], {
        cwd: work,
        windowsHide: true,
        env: process.env,
      });
      const chunks = [];
      child.stdout.on("data", (chunk) => {
        chunks.push(chunk);
      });
      child.stderr.on("data", (chunk) => {
        chunks.push(chunk);
      });
      child.on("error", reject);
      child.on("close", (code) => {
        const bytes = Buffer.concat(chunks);
        let log;
        try {
          log = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          log = new TextDecoder("gb18030").decode(bytes);
        }
        resolve({ name, code, log });
      });
    });
    fs.writeFileSync(path.join(work, name + ".log"), result.log);
    results.push(result);
    fs.writeFileSync(
      path.join(work, `results-${selected ?? "all"}.json`),
      JSON.stringify(results, null, 2),
    );
    console.log(
      `${name}: MATLAB exit ${result.code}${result.log ? "\n" + result.log : " (no messages)"}`,
    );
    if (
      result.code !== 0 ||
      /SceneNode|错误使用|Error using/.test(result.log) ||
      !fs.existsSync(path.join(out, name + ".png"))
    )
      process.exitCode = 1;
  }
}

process.exit(process.exitCode ?? 0);
