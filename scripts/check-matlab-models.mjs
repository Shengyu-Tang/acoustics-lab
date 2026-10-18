// Each exported script runs in its own R2024b process. Everything writable is in this clone.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { build, stop } from "esbuild";
import { pathToFileURL } from "node:url";
const root = process.cwd(),
  out = path.resolve("specs/redesign/matlab-check/P1-fix"),
  work = path.resolve("outputs/matlab-models");
for (const dir of [out, work, path.join(work, "tmp"), path.join(work, "prefs")])
  fs.mkdirSync(dir, { recursive: true });
process.env.TEMP = process.env.TMP = path.join(work, "tmp");
process.env.MATLAB_PREFDIR = path.join(work, "prefs");
fs.writeFileSync(path.join(work, "startup.m"), "% Isolated QA startup.\n");
await build({
  stdin: {
    contents:
      fs
        .readdirSync("src/content/lectures")
        .filter((f) => !["1.2.4.ts", "1.2.5.ts"].includes(f))
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("\n") +
      "\nexport * from './src/plot/chapter1Figures';export {matlab} from './src/plot/export';export {modelsFor} from './src/plot/matlabModels';export * from './src/physics/chapter1';export {example} from './src/content/examples/instrument';export {bandwidthExample} from './src/content/examples/bandwidth';",
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(work, "bundle.mjs"),
});
stop();
const all = await import(pathToFileURL(path.join(work, "bundle.mjs")));
const jobs = [];
const variant = (p) =>
  Object.fromEntries(
    Object.entries(p).map(([k, v]) => [
      k,
      v *
        ({
          M: 1.2,
          D: 0.85,
          Rm: 1.15,
          F0: 1.1,
          x0: 0.8,
          v0: 1.2,
          A: 1.2,
          zeta: 1.1,
          Qm: 1.1,
          T: 1.2,
          mu: 1.1,
          L: 0.9,
          height: 0.8,
          pluck: 1.1,
          E: 0.9,
          rho: 1.05,
          S: 1.1,
          tipMass: 1.2,
          sigma: 1.1,
          gradient: 0.8,
          target: 1.05,
          measured: 1.1,
          tObs: 1.2,
          n: 1.05,
          limit: 0.9,
          pulseCycles: 1.25,
          gapCycles: 0.9,
          f1: 0.98,
          f2: 1.02,
          velocity: 1.2,
        }[k] ?? 1),
    ]),
  );
function add(name, defaults, plot, rows = 1, cols = 1, answers, readouts) {
  const base = plot(defaults),
    parameters = base[0].matlabModel.parameters;
  const code = all.matlab(base, rows, cols, name);
  for (const set of [0, 1]) {
    const p = set ? variant(defaults) : defaults;
    const expected = plot(p);
    assert.ok(
      expected.every((p) => p.matlabModel),
      name,
    );
    let script = code;
    if (set)
      for (const { key } of parameters)
        if (key in p)
          script = script.replace(new RegExp(`^${key} = [^;]+;`, "m"), `${key} = ${p[key]};`);
    // Crucially the alternate set edits only the original parameter block, not the formulas.
    const filename = `fig_${name.replace(/[^\w]/g, "_")}_set${set}`;
    const resultPath = path.join(out, filename + ".json"),
      pngPath = path.join(out, filename + ".png");
    const write = `\nqa=struct('x',{model_x(:)'},'y',{model_y(:)'}); if exist('worksheet_answers','var'),qa.answers=worksheet_answers;end; if exist('lecture_readouts','var'),qa.readouts=lecture_readouts;end; fid=fopen('${mq(resultPath)}','w','n','UTF-8'); fprintf(fid,'%s',jsonencode(qa)); fclose(fid); drawnow; exportgraphics(gcf,'${mq(pngPath)}','Resolution',120); close all;\n`;
    const point = script.indexOf("\nfunction ");
    script = script.slice(0, point) + write + script.slice(point);
    const scriptPath = path.join(out, filename + ".m");
    const changed = !fs.existsSync(scriptPath) || fs.readFileSync(scriptPath, "utf8") !== script;
    fs.writeFileSync(scriptPath, script);
    jobs.push({
      name,
      set,
      filename,
      parameters: p,
      expected: expected.map((p) => p.series.map((s) => s.points)),
      changed,
      answers: answers?.(p),
      readouts: readouts?.(p),
    });
  }
}
for (const [key, l] of Object.entries(all).filter(([k]) => /^l\d+$/.test(k))) {
  for (const f of l.figures)
    add(
      f.number,
      l.defaults,
      (p) => f.plot(p, 0),
      f.rows,
      f.cols,
      undefined,
      (p) => l.readouts(p).map((r) => r[1]),
    );
  for (const [i, e] of l.examples.entries())
    add(
      `${l.id}-E${i + 1}`,
      e.defaults,
      (p) => [e.plot(p)],
      1,
      1,
      (p) => e.asks.map((a) => a.calc(p)),
    );
}
const p0 = { ...all.instrument, Rm: 400 };
add("1.2.4-1", p0, (p) => all.frequencyPanels(p, false), 2, 3);
add("1.2.4-1-overlay", p0, (p) => all.frequencyPanels(p, true), 2, 3);
add("1.2.4-2", p0, (p) => [all.impedancePanel(p)]);
add("1.2.5-1", p0, (p) => [all.powerPanel(p)]);
add("1.2.5-2", p0, (p) => all.instantaneousPanels(p), 3, 1);
add(
  "A-1",
  all.example.defaults,
  (p) => [all.instrumentPanel(p)],
  1,
  1,
  (p) => all.example.asks.map((a) => all.example.solve(p)[a.key]),
);
add("B-1", all.bandwidthExample.defaults, (p) => {
  const s = all.bandwidthExample.solve(p),
    panel = all.powerPanel({ ...p, Rm: s.Rm, F0: s.force });
  panel.series.push({
    name: "目标振速工作点",
    points: [[s.f0, s.power]],
    marker: "o",
    style: "none",
  });
  const modeled = all.modelsFor("B-1", { ...p, Rm: s.Rm, F0: s.force }, [panel]);
  return modeled;
});
fs.writeFileSync(path.join(work, "expected.json"), JSON.stringify(jobs));
if (process.argv.includes("--prepare-only")) {
  console.log(`Prepared ${jobs.length} scripts.`);
  process.exit(0);
}
const selected = process.argv.find((a) => a.startsWith("--filter="))?.slice(9);
const results = [];
function mq(s) {
  return s.replaceAll("\\", "/").replaceAll("'", "''");
}
function near(actual, expected, label) {
  if (!Number.isFinite(expected)) {
    assert.equal(actual, null, label);
    return 0;
  }
  assert.ok(Number.isFinite(actual), label);
  const error = Math.abs(actual - expected) / Math.max(1, Math.abs(expected));
  assert.ok(error < 2e-9, `${label}: ${actual} vs ${expected} (${error})`);
  return error;
}
const changedOnly = process.argv.includes("--changed-only");
const pending = jobs.filter((j) =>
  changedOnly ? j.changed : !selected || selected.split(",").some((name) => j.name.includes(name)),
);
async function runJob(job) {
  const script = path.join(out, job.filename + ".m"),
    json = path.join(out, job.filename + ".json");
  fs.rmSync(json, { force: true });
  const start = Date.now();
  const prefs = path.join(work, "prefs", job.filename),
    tmp = path.join(work, "tmp", job.filename);
  fs.mkdirSync(prefs, { recursive: true });
  fs.mkdirSync(tmp, { recursive: true });
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe",
      ["-sd", work, "-batch", `run('${mq(script)}')`],
      {
        cwd: work,
        windowsHide: true,
        env: { ...process.env, MATLAB_PREFDIR: prefs, TEMP: tmp, TMP: tmp },
      },
    );
    const chunks = [];
    child.stdout.on("data", (b) => chunks.push(b));
    child.stderr.on("data", (b) => chunks.push(b));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, log: Buffer.concat(chunks).toString("utf8") }));
  });
  fs.writeFileSync(path.join(out, job.filename + ".log"), result.log);
  assert.equal(result.code, 0, job.filename + "\n" + result.log);
  assert.ok(!/Error using|错误使用|SceneNode/.test(result.log), result.log);
  const data = JSON.parse(fs.readFileSync(json, "utf8"));
  // MATLAB serializes a cell matrix by columns; singletons may become scalars.
  const cells = (v) => (Array.isArray(v) ? v : [v]);
  const xs = cells(data.x),
    ys = cells(data.y),
    nrows = job.expected.length;
  let maxError = 0,
    count = 0;
  job.expected.forEach((series, k) =>
    series.forEach((points, i) => {
      const at = k + i * nrows,
        x = cells(xs[at]),
        y = cells(ys[at]);
      assert.equal(x.length, points.length, `${job.filename} panel ${k} series ${i} length`);
      for (let j = 0; j < points.length; j++) {
        maxError = Math.max(
          maxError,
          near(x[j], points[j][0], `${job.filename} x ${k}/${i}/${j}`),
          near(y[j], points[j][1], `${job.filename} y ${k}/${i}/${j}`),
        );
        count += 2;
      }
    }),
  );
  if (job.answers)
    cells(data.answers).forEach((v, i) => near(v, job.answers[i], job.filename + " answer " + i));
  if (job.readouts) {
    assert.equal(cells(data.readouts).length, job.readouts.length, job.filename + " readout count");
    cells(data.readouts).forEach((v, i) =>
      near(v, job.readouts[i], job.filename + " readout " + i),
    );
  }
  results.push({
    name: job.name,
    set: job.set,
    filename: job.filename,
    parameters: job.parameters,
    valuesCompared: count,
    maxNormalizedError: maxError,
    answers: job.answers,
    readouts: job.readouts,
    exit: result.code,
    seconds: (Date.now() - start) / 1000,
  });
  fs.writeFileSync(
    path.join(out, selected || changedOnly ? "results-filter.json" : "results.json"),
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(`PASS ${job.filename}: ${count} values, max error ${maxError.toExponential(2)}`);
}
const failures = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (pending.length) {
      const job = pending.shift();
      try {
        await runJob(job);
      } catch (e) {
        failures.push({ name: job.filename, error: String(e) });
        console.error("FAIL " + job.filename + ": " + e);
      }
    }
  }),
);
fs.writeFileSync(path.join(out, "failures.json"), JSON.stringify(failures, null, 2));
console.log(
  `PASS ${results.length} independent MATLAB processes / parameter-set comparisons; ${failures.length} failures.`,
);
if (failures.length) process.exitCode = 1;
else if (selected || changedOnly) {
  const previous = JSON.parse(fs.readFileSync(path.join(out, "results.json"), "utf8"));
  const merged = new Map(previous.map((r) => [r.filename, r]));
  results.forEach((r) => merged.set(r.filename, r));
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify([...merged.values()], null, 2) + "\n",
  );
}
