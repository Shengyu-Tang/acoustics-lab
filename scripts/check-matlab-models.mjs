// Each exported script runs in its own R2024b process. Everything writable is in this clone.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { build, stop } from "esbuild";
import { pathToFileURL } from "node:url";
const review = process.argv.includes("--review-sliders");
const p3 = process.argv.includes("--batch=P3");
const p2 = process.argv.includes("--batch=P2") || p3;
const figuresOnly = process.argv.includes("--figures-only");
const selected = process.argv.find((a) => a.startsWith("--filter="))?.slice(9);
const customOut = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
const timeoutMs = Number(
  process.argv.find((a) => a.startsWith("--timeout-ms="))?.slice(13) ?? 300000,
);
assert.ok(Number.isFinite(timeoutMs) && timeoutMs > 0, "positive MATLAB timeout");
const root = process.cwd(),
  out = path.resolve(
    customOut ??
      (review
        ? `outputs/slider-matlab/${p2 ? "P2" : "P1"}`
        : `specs/redesign/matlab-check/${p3 ? "P3" : p2 ? "P2" : "P1-fix"}`),
  ),
  work = path.resolve(`outputs/matlab-models${p3 ? "-P3" : p2 ? "-P2" : ""}`);
assert.ok(
  !path.relative(root, out).startsWith("..") && !path.isAbsolute(path.relative(root, out)),
  "MATLAB output stays inside clone",
);
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
        .filter((f) =>
          p3
            ? /^3\.(6|7|8|9|10)\./.test(f)
            : p2
              ? /^3\.[1-5]\./.test(f)
              : !f.startsWith("3.") && !["1.2.4.ts", "1.2.5.ts"].includes(f),
        )
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("\n") +
      "\nexport * from './src/plot/chapter1Figures';export {axisTicks} from './src/plot/ticks';export {matlab} from './src/plot/export';export {modelsFor} from './src/plot/matlabModels';export * from './src/physics/chapter1';export {example} from './src/content/examples/instrument';export {bandwidthExample} from './src/content/examples/bandwidth';",
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
const variantP2 = (p) =>
  Object.fromEntries(
    Object.entries(p).map(([k, v]) => [
      k,
      {
        medium: 1,
        mode: 1,
        standing: 1,
        spherical: 1,
        shape: 2,
        boundary: 2,
        ratio: 1.25,
        azimuth: -35,
        elevation: 45,
        wavecount: 4,
        phase: 60,
        ideal: 0,
        continuous: 0,
        compressible: 0,
        uniform: 0,
        small: 0,
        left: 0,
        wLeft: -0.004,
      }[k] ??
        v *
          ({
            rho: 1.05,
            c: 0.98,
            f: 1.2,
            pa: 1.1,
            xi: 0.8,
            L: 1.1,
            S: 1.1,
            left: 1.2,
            right: 0.9,
            wLeft: 1.2,
            wRight: 0.9,
            span: 0.5,
            T: 1.2,
            gamma: 1.05,
            P0: 1.1,
            level: 1.02,
            bulk: 1.1,
            waterRho: 1.01,
            depth: 1.2,
            B: 1.1,
            obs: 1.2,
            n: 1.5,
            sourceLevel: 1.05,
            pRms: 1.2,
            intensity: 1.2,
            power: 1.2,
            a1: 1.1,
            a2: 0.9,
            a3: 0.8,
            a4: 1.2,
          }[k] ?? (k.startsWith("h") ? 0.8 : 1)),
    ]),
  );
const variant = (p) =>
  p3
    ? Object.fromEntries(
        Object.entries(p).map(([key, value]) => [
          key,
          { mode: 1, boundary: 1, scenario: 1, sourceType: 1 }[key] ??
            value *
              ({
                c: 0.98,
                c2: 1.02,
                f: 1.08,
                theta: 0.95,
                res: 1.1,
                react: 0.9,
                Z1: 1.1,
                Z2: 1.05,
                h: 1.05,
                source: 0.98,
                launch: 0.95,
                radius: 1.05,
              }[key] ?? 1.1),
        ]),
      )
    : p2
      ? variantP2(p)
      : Object.fromEntries(
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
                value: 1.25,
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
  if (figuresOnly && (name.includes("-E") || ["A-1", "B-1"].includes(name))) return;
  if (selected && !selected.split(",").some((id) => name.includes(id))) return;
  const base = plot(defaults),
    parameters = base[0].matlabModel.parameters;
  const code = all.matlab(base, rows, cols, name);
  for (const set of [0, 1]) {
    const p = set ? variant(defaults) : defaults;
    if (review && set && "L" in p)
      p.L =
        name.startsWith("2.1") || name.startsWith("2.2")
          ? 1.5
          : name.startsWith("2.")
            ? 2
            : name.startsWith("3.1.4")
              ? 0.5
              : 1;
    const expected = plot(p);
    assert.ok(
      expected.every((p) => p.matlabModel),
      name,
    );
    let script = "set(groot,'defaultFigureVisible','off');\n" + code;
    if (set)
      for (const { key } of parameters)
        if (key in p)
          script = script.replace(new RegExp(`^${key} = [^;]+;`, "m"), `${key} = ${p[key]};`);
    // Crucially the alternate set edits only the original parameter block, not the formulas.
    const filename = `fig_${name.replace(/[^\w]/g, "_")}_set${set}`;
    const resultPath = path.join(out, filename + ".json"),
      pngPath = path.join(out, filename + ".png");
    const write = `\nqa=struct('x',{model_x(:)'},'y',{model_y(:)'}); qa.limits=model_limits; if exist('worksheet_answers','var'),qa.answers=worksheet_answers;end; if exist('lecture_readouts','var'),qa.readouts=lecture_readouts;end; if exist('model_fields','var'),qa.fields=model_fields;end; fid=fopen('${mq(resultPath)}','w','n','UTF-8'); fprintf(fid,'%s',jsonencode(qa)); fclose(fid); drawnow; exportgraphics(gcf,'${mq(pngPath)}','Resolution',120); close all;\n`;
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
      expected: expected.map((p) => (p.series ?? []).map((s) => s.points)),
      expectedFields: expected.map((p) => p.field ?? null),
      expectedLimits: expected.map((p) =>
        p.matlabModel.amplitudeAxes || p.unboundedY
          ? {
              x: all.axisTicks(p.xlim, p.xscale === "log").limits,
              y: all.axisTicks(p.ylim, p.yscale === "log").limits,
            }
          : null,
      ),
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
      review && l.parameters.some((d) => d.key === "L")
        ? { ...l.defaults, L: l.parameters.find((d) => d.key === "L").min }
        : l.defaults,
      (p) => f.plot(p, 0),
      f.rows,
      f.cols,
      undefined,
      (p) => l.readouts(p).map((r) => r[1]),
    );
  if (!review)
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
if (!p2) {
  const p0 = { ...all.instrument, Rm: 400 };
  add("1.2.4-1", p0, (p) => all.frequencyPanels(p, false), 2, 3);
  add("1.2.4-1-overlay", p0, (p) => all.frequencyPanels(p, true), 2, 3);
  add("1.2.4-2", p0, (p) => [all.impedancePanel(p)]);
  add("1.2.5-1", p0, (p) => [all.powerPanel(p)]);
  add("1.2.5-2", p0, (p) => all.instantaneousPanels(p), 3, 1);
  if (!review)
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
}
fs.writeFileSync(path.join(work, "expected.json"), JSON.stringify(jobs));
if (process.argv.includes("--prepare-only")) {
  console.log(`Prepared ${jobs.length} scripts.`);
  process.exit(0);
}
const resultFile = path.join(out, "results.json");
const resume = process.argv.includes("--resume");
const results =
  (resume || figuresOnly) && fs.existsSync(resultFile)
    ? JSON.parse(fs.readFileSync(resultFile, "utf8"))
    : [];
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
const pending = jobs.filter(
  (j) =>
    (!figuresOnly || (!j.name.includes("-E") && !["A-1", "B-1"].includes(j.name))) &&
    (changedOnly
      ? j.changed
      : !selected || selected.split(",").some((name) => j.name.includes(name))) &&
    (!resume || !results.some((r) => r.filename === j.filename) || j.changed),
);
const processCount = pending.length;
async function runJob(job, slot) {
  const script = path.join(out, job.filename + ".m"),
    json = path.join(out, job.filename + ".json");
  fs.rmSync(json, { force: true });
  const start = Date.now();
  const prefs = path.join(work, "prefs", p2 ? `worker${slot}` : job.filename),
    tmp = path.join(work, "tmp", job.filename);
  if (p2 && !fs.existsSync(prefs)) {
    const seed = path.join(work, "prefs", "fig_3_1_1_1_set0");
    if (fs.existsSync(seed)) fs.cpSync(seed, prefs, { recursive: true });
  }
  fs.mkdirSync(prefs, { recursive: true });
  fs.mkdirSync(tmp, { recursive: true });
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe",
      [
        "-singleCompThread",
        ...(process.argv.includes("--no-jvm") ? ["-nojvm"] : []),
        "-sd",
        work,
        "-batch",
        `run('${mq(script)}')`,
      ],
      {
        cwd: work,
        windowsHide: true,
        env: { ...process.env, MATLAB_PREFDIR: prefs, TEMP: tmp, TMP: tmp },
      },
    );
    const chunks = [];
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // Stop only this script's launcher and descendants, including MATLAB's
      // Windows core process. A stalled startup must not leave orphan jobs.
      const cleanup = fs.readFileSync("scripts/stop-process-tree.ps1", "utf8");
      spawn(
        "powershell.exe",
        ["-NoProfile", "-Command", `& { ${cleanup} } -RootPid ${child.pid}`],
        {
          windowsHide: true,
          stdio: "ignore",
        },
      );
    }, timeoutMs);
    child.stdout.on("data", (b) => chunks.push(b));
    child.stderr.on("data", (b) => chunks.push(b));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const bytes = Buffer.concat(chunks);
      let log;
      try {
        log = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        log = new TextDecoder("gb18030").decode(bytes);
      }
      resolve({
        code,
        log: timedOut
          ? `MATLAB startup/script timed out after ${timeoutMs / 1000} seconds.\n` + log
          : log,
        timedOut,
      });
    });
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
  if (job.expectedFields.some(Boolean)) {
    const fields = cells(data.fields);
    job.expectedFields.forEach((f, k) => {
      if (!f) return;
      const a = fields[k];
      assert.ok(a, job.filename + " field");
      a.x.forEach((v, i) => near(v, f.x[i], "field x"));
      a.y.forEach((v, i) => near(v, f.y[i], "field y"));
      a.z.forEach((row, j) =>
        row.forEach((v, i) => {
          maxError = Math.max(maxError, near(v, f.z[j][i], job.filename + " field z"));
          count++;
        }),
      );
    });
  }
  job.expectedLimits.forEach((lim, i) => {
    if (!lim) return;
    for (const axis of ["x", "y"])
      lim[axis].forEach((v, j) =>
        near(cells(data.limits)[i][axis][j], v, `${job.filename} panel ${i} ${axis} limit ${j}`),
      );
  });
  if (job.answers)
    cells(data.answers).forEach((v, i) => near(v, job.answers[i], job.filename + " answer " + i));
  if (job.readouts) {
    assert.equal(cells(data.readouts).length, job.readouts.length, job.filename + " readout count");
    cells(data.readouts).forEach((v, i) =>
      near(v, job.readouts[i], job.filename + " readout " + i),
    );
  }
  const previousIndex = results.findIndex((r) => r.filename === job.filename);
  if (previousIndex >= 0) results.splice(previousIndex, 1);
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
const workers = Number(process.argv.find((a) => a.startsWith("--workers="))?.slice(10) ?? 2);
assert.ok(
  Number.isInteger(workers) && workers >= 1 && workers <= 2,
  "one or two independent MATLAB workers",
);
await Promise.all(
  Array.from({ length: workers }, async (_, slot) => {
    while (pending.length) {
      const job = pending.shift();
      try {
        await runJob(job, slot);
      } catch (e) {
        failures.push({ name: job.filename, error: String(e) });
        console.error("FAIL " + job.filename + ": " + e);
        if (!fs.existsSync(path.join(out, job.filename + ".json"))) pending.length = 0;
      }
    }
  }),
);
fs.writeFileSync(path.join(out, "failures.json"), JSON.stringify(failures, null, 2));
console.log(
  `${failures.length ? "FAIL" : "PASS"} ${processCount} independent MATLAB processes / parameter-set comparisons in this run; ${failures.length} failures.`,
);
if (failures.length) process.exitCode = 1;
else if (selected || changedOnly) {
  const previous = fs.existsSync(path.join(out, "results.json"))
    ? JSON.parse(fs.readFileSync(path.join(out, "results.json"), "utf8"))
    : [];
  const merged = new Map(previous.map((r) => [r.filename, r]));
  results.forEach((r) => merged.set(r.filename, r));
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify([...merged.values()], null, 2) + "\n",
  );
}
if (p2 && !failures.length && !selected && !changedOnly && !figuresOnly) {
  const complete = JSON.parse(fs.readFileSync(path.join(out, "results.json"), "utf8"));
  for (const job of jobs) {
    const result = complete.find((r) => r.filename === job.filename);
    assert.ok(result, `Missing MATLAB result ${job.filename}`);
    assert.deepEqual(result.parameters, job.parameters, `Stale MATLAB parameters ${job.filename}`);
    if (!job.answers) continue;
    const actual = JSON.parse(
      fs.readFileSync(path.join(out, job.filename + ".json"), "utf8"),
    ).answers;
    const errors = job.answers.map(
      (v, i) => Math.abs(actual[i] - v) / Math.max(Math.abs(v), 1e-300),
    );
    assert.ok(
      errors.every((e) => e < 0.0049),
      `${job.filename}: relative example error <0.5%`,
    );
    result.maxAnswerRelativeError = Math.max(...errors);
  }
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(complete, null, 2) + "\n");
  console.log(
    `PASS P2: ${jobs.length} current parameter sets; all worked answers agree within 0.5% relative error.`,
  );
}
