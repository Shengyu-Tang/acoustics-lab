import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import crypto from "node:crypto";
const folder = process.argv[2] ?? "specs/redesign/matlab-check/P6",
  manifest = JSON.parse(fs.readFileSync(folder + "/manifest.json", "utf8")),
  work = path.resolve("outputs/P6/runtime");
fs.mkdirSync(work, { recursive: true });
const quote = (s) => s.replaceAll("\\", "/").replaceAll("'", "''");
let next = 0;
const reportFile = folder + "/runtime-results.json",
  results = fs.existsSync(reportFile)
    ? JSON.parse(fs.readFileSync(reportFile, "utf8")).results
    : [],
  errors = [];
const queue = manifest.jobs.filter(
  (j) => !results.some((r) => r.file === j.file && r.sha256 === j.sha256 && r.passed),
);
for (const j of manifest.jobs)
  assert.equal(
    crypto.createHash("sha256").update(fs.readFileSync(j.file)).digest("hex"),
    j.sha256,
    j.file + " changed since export",
  );
function write() {
  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      { oneProcessPerScript: true, matlab: "R2024b", jobs: manifest.jobs.length, results, errors },
      null,
      2,
    ) + "\n",
  );
}
function compare(job, data) {
  const e = JSON.parse(fs.readFileSync(job.expectedFile, "utf8"));
  let worst = 0;
  const array = (v) => (Array.isArray(v) ? v : [v]);
  const check = (act, exp, label) => {
    act = array(act).flat(Infinity);
    exp = array(exp).flat(Infinity);
    assert.equal(act.length, exp.length, label + " shape");
    const scale = Math.max(1e-10, ...exp.map(Math.abs));
    let err = 0;
    exp.forEach((v, i) => {
      // Dispersive curves deliberately break at cutoff. JSON encodes both
      // MATLAB NaN and browser NaN as null; the gap positions must agree.
      if (v === null) {
        assert.equal(act[i], null, label + " matching gap");
        return;
      }
      assert.ok(Number.isFinite(act[i]), label + " finite");
      err = Math.max(err, Math.abs(act[i] - v) / scale);
    });
    assert.ok(err < 0.005, label + " error " + err);
    worst = Math.max(worst, err);
  };
  // MATLAB cell matrices serialize in column-major order (panel index varies first).
  const X = data.x,
    Y = data.y;
  for (let k = 0; k < e.panels.length; k++) {
    const q = e.panels[k];
    for (let i = 0; i < q.x.length; i++) {
      check(X[i * e.panels.length + k], q.x[i], "panel " + k + " series " + i + " x");
      check(Y[i * e.panels.length + k], q.y[i], "panel " + k + " series " + i + " y");
    }
    if (q.field) {
      const fs2 = e.panels.length === 1 ? data.fields[0] : data.fields[k];
      check(fs2.x, q.field.x, "field x");
      check(fs2.y, q.field.y, "field y");
      check(fs2.z, q.field.z, "field z");
    }
  }
  if (e.readouts) check(data.readouts, e.readouts, "lecture readouts");
  if (e.answers) {
    const actual = array(data.answers);
    e.answers.forEach((v, i) => {
      assert.ok(
        Math.abs(actual[i] - v) <= Math.max(1e-30, 0.0049 * Math.abs(v)),
        "example answer " + i,
      );
    });
  }
  return worst;
}
async function worker(index) {
  while (next < queue.length) {
    const job = queue[next++],
      id = path.basename(job.file, ".m"),
      dir = work + "/" + id;
    fs.mkdirSync(dir, { recursive: true });
    for (const d of ["/tmp", "/prefs"]) fs.mkdirSync(dir + d, { recursive: true });
    const json = dir + "/result.json",
      png = path.resolve(folder + "/" + id + ".png"),
      wrapper = dir + "/run_one.m";
    fs.writeFileSync(
      wrapper,
      "model_fields={};lecture_readouts=[];worksheet_answers=[];\nrun('" +
        quote(path.resolve(job.file)) +
        "');\nout=struct;out.x=model_x;out.y=model_y;out.fields=model_fields;out.readouts=lecture_readouts;out.answers=worksheet_answers;\nfid=fopen('" +
        quote(json) +
        "','w','n','UTF-8');fprintf(fid,'%s',jsonencode(out));fclose(fid);\nexportgraphics(gcf,'" +
        quote(png) +
        "','Resolution',120);\nclose all;\n",
    );
    const log = fs.openSync(dir + "/console.log", "w"),
      start = Date.now();
    const p = spawn(
      "C:/Program Files/MATLAB/R2024b/bin/matlab.exe",
      ["-sd", dir, "-batch", "run('" + quote(wrapper) + "')"],
      {
        cwd: dir,
        env: {
          ...process.env,
          TEMP: dir + "/tmp",
          TMP: dir + "/tmp",
          MATLAB_PREFDIR: dir + "/prefs",
        },
        windowsHide: true,
        stdio: ["ignore", log, log],
      },
    );
    let timeout = false;
    const timer = setTimeout(() => {
      timeout = true;
      spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-File",
          path.resolve("scripts/stop-process-tree.ps1"),
          "-RootPid",
          String(p.pid),
        ],
        { windowsHide: true, timeout: 30000 },
      );
      p.kill();
    }, 300000);
    const exit = await new Promise((resolve) => {
      p.on("error", (e) => resolve(String(e)));
      p.on("exit", (code) => resolve(code));
    });
    clearTimeout(timer);
    fs.closeSync(log);
    let passed = false,
      error = "",
      worst;
    try {
      assert.equal(exit, 0, "MATLAB exit; see " + dir + "/console.log");
      assert.ok(!timeout, "timeout");
      worst = compare(job, JSON.parse(fs.readFileSync(json, "utf8")));
      assert.ok(fs.existsSync(png));
      passed = true;
    } catch (e) {
      error = e.message;
      errors.push({ file: job.file, error });
    }
    const prior = results.findIndex((r) => r.file === job.file);
    const r = {
      file: job.file,
      sha256: job.sha256,
      passed,
      error,
      worst,
      elapsedSeconds: (Date.now() - start) / 1000,
      png,
    };
    if (prior >= 0) results[prior] = r;
    else results.push(r);
    write();
    console.log((passed ? "PASS " : "FAIL ") + id + " " + error);
  }
}
console.log(
  "Running " + queue.length + " scripts; 3 isolated MATLAB workers, one process per script.",
);
await Promise.all([0, 1, 2].map(worker));
write();
manifest.runtimeValidated = manifest.jobs.every((j) =>
  results.some(
    (r) => r.file === j.file && r.sha256 === j.sha256 && r.passed && fs.existsSync(r.png),
  ),
);
fs.writeFileSync(folder + "/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
if (errors.length) process.exitCode = 1;
