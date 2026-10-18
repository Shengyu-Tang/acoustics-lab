// Regression: export with x0=v0=0, then edit only x0 in that same script.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { build, stop } from "esbuild";
import { pathToFileURL } from "node:url";
const out = path.resolve("outputs/matlab-zero-energy");
fs.mkdirSync(out, { recursive: true });
for (const name of ["tmp", "prefs"]) fs.mkdirSync(path.join(out, name), { recursive: true });
const env = {
  ...process.env,
  TEMP: path.join(out, "tmp"),
  TMP: path.join(out, "tmp"),
  MATLAB_PREFDIR: path.join(out, "prefs"),
};
fs.writeFileSync(path.join(out, "startup.m"), "% Isolated regression check.\n");
await build({
  stdin: {
    contents:
      "export {default as lecture} from './src/content/lectures/1.1.4';export {matlab} from './src/plot/export';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(out, "bundle.mjs"),
});
stop();
const { lecture, matlab } = await import(pathToFileURL(path.join(out, "bundle.mjs")));
const p = { ...lecture.defaults, x0: 0, v0: 0 },
  code = matlab(lecture.figures[1].plot(p, 0), 1, 1, "零初值能量导出再改参数");
const mq = (s) => s.replaceAll("\\", "/").replaceAll("'", "''");
const results = [];
for (const x0 of [0, 0.006]) {
  const name = x0 ? "changed_initial" : "zero_initial";
  let script = code.replace(/^x0 = [^;]+;/m, `x0 = ${x0};`);
  const json = path.join(out, name + ".json"),
    png = path.join(out, name + ".png"),
    file = path.join(out, name + ".m");
  const i = script.indexOf("\nfunction "),
    qa = `\nfid=fopen('${mq(json)}','w');fprintf(fid,'%s',jsonencode(model_y{1,1}));fclose(fid);exportgraphics(gcf,'${mq(png)}','Resolution',120);close all;\n`;
  fs.writeFileSync(file, script.slice(0, i) + qa + script.slice(i));
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe",
      ["-sd", out, "-batch", `run('${mq(file)}')`],
      { cwd: out, windowsHide: true, env },
    );
    const chunks = [];
    child.stdout.on("data", (b) => chunks.push(b));
    child.stderr.on("data", (b) => chunks.push(b));
    child.on("error", reject);
    child.on("close", (exit) => resolve({ exit, log: Buffer.concat(chunks).toString("utf8") }));
  });
  fs.writeFileSync(path.join(out, name + ".log"), result.log);
  assert.equal(result.exit, 0, result.log);
  const actual = JSON.parse(fs.readFileSync(json, "utf8"));
  if (x0 === 0) assert.ok(actual.every((v) => v === 0));
  else {
    const expected = lecture.figures[1].plot({ ...p, x0 }, 0)[0].series[0].points;
    assert.equal(actual.length, expected.length);
    actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i][1]) < 2e-9));
  }
  results.push({ x0, exit: result.exit, valuesCompared: actual.length });
  console.log(`PASS zero-energy export, edited x0=${x0}: ${actual.length} values`);
}
fs.writeFileSync(
  "specs/redesign/matlab-check/P1-fix/zero-energy-results.json",
  JSON.stringify(results, null, 2) + "\n",
);
