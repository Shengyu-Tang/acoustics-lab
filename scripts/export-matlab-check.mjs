// Run after npm run build. All profiles, downloads, MATLAB preferences and logs stay in this clone.
// Optional --export-only / --render-only support iterating on one stage.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const out = path.join(root, "specs/redesign/matlab-check");
const work = path.join(root, "outputs/matlab-check");
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
const names = ["1.2.4-1", "1.2.4-2", "A-1", "1.2.5-1", "1.2.5-2", "B-1"];
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
    for (const topic of ["1.2.4", "1.2.5"]) {
      await page.goto(url + "#/lab?topic=" + topic);
      const figures = page.locator(".matlab-figure");
      await figures.first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const name of topic === "1.2.4" ? names.slice(0, 3) : names.slice(3)) {
        const figure = figures.filter({
          has: page.locator("figcaption", { hasText: `图 ${name}　` }),
        });
        if ((await figure.count()) !== 1) throw new Error(`Expected exactly one figure ${name}`);
        const downloaded = page.waitForEvent("download");
        await figure.getByRole("button", { name: "导出 MATLAB 代码", exact: true }).click();
        await (await downloaded).saveAs(path.join(out, name + ".m"));
        await figure.screenshot({ path: path.join(work, name + "-web.png") });
        console.log("Exported " + name + ".m");
      }
    }
    if (errors.length) throw new Error(errors.join("\n"));
  } finally {
    await context?.close();
    server.kill();
  }
}

if (!process.argv.includes("--export-only")) {
  const matlab = process.env.MATLAB_EXE ?? "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe";
  const mq = (s) => "'" + s.replaceAll("\\", "/").replaceAll("'", "''") + "'";
  const results = [];
  for (const name of names) {
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
    fs.writeFileSync(path.join(work, "results.json"), JSON.stringify(results, null, 2));
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
