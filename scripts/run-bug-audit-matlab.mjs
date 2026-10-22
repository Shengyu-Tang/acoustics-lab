// Each actual browser download runs in its own MATLAB R2024b process, with a 300s limit.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { auditData } from "./bug-audit-data.mjs";
const data = await auditData();
const root = path.resolve(process.env.MATLAB_AUDIT_ROOT ?? "outputs/bug-audit-1");
if (!root.startsWith(path.resolve(".") + path.sep))
  throw new Error("MATLAB audit output must stay inside the repository");
const work = path.join(root, "matlab");
fs.mkdirSync(work, { recursive: true });
const exe = process.env.MATLAB_EXE ?? "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe";
if (!fs.existsSync(exe)) throw new Error(`MATLAB R2024b not found: ${exe}`);
const reportFile = path.join(work, "results.json");
const previous = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, "utf8")) : [];
const results = [...previous];
const running = new Map();
const workers = Math.min(8, Math.max(1, Math.floor(Number(process.env.MATLAB_AUDIT_WORKERS) || 2)));
const quote = (s) => "'" + s.replaceAll("\\", "/").replaceAll("'", "''") + "'";
const save = () => fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
function readManifest() {
  // The browser updates its manifest while this runner consumes downloads.
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "browser.json"), "utf8"));
  } catch {
    return {};
  }
}
async function run(file, hash) {
  const name = path.basename(file, ".m"),
    dir = path.join(work, name, hash.slice(0, 12));
  for (const part of ["", "tmp", "prefs"]) fs.mkdirSync(path.join(dir, part), { recursive: true });
  fs.writeFileSync(path.join(dir, "startup.m"), "% Isolated audit startup.\n");
  // run() supports script-local functions; eval(fileread(...)) does not.
  const script = path.join(dir, "audit_script.m");
  fs.copyFileSync(file, script);
  const image = path.join(dir, "figure.png");
  const values = path.join(dir, "values.json");
  const command = `set(groot,'defaultFigureVisible','off');run(${quote(script)});drawnow;assert(~isempty(findall(groot,'Type','axes'))||~isempty(findall(groot,'Type','polaraxes')),'Audit:BlankFigure','No axes');qa_axes=findall(groot,'Type','axes');for qa_i=1:numel(qa_axes),assert(all(isfinite([qa_axes(qa_i).XLim qa_axes(qa_i).YLim])),'Audit:Axis','Nonfinite axes');end;qa_values=struct();if exist('worksheet_answers','var'),assert(all(isfinite(worksheet_answers)),'Audit:Answers','Nonfinite answers');qa_values.answers=worksheet_answers;end;qa_fid=fopen(${quote(values)},'w');fprintf(qa_fid,'%s',jsonencode(qa_values));fclose(qa_fid);exportgraphics(gcf,${quote(image)},'Resolution',100);close all;`;
  const start = Date.now();
  const result = await new Promise((resolve) => {
    const child = spawn(exe, ["-sd", dir, "-batch", `disp('AUDIT_STARTED');${command}`], {
      cwd: dir,
      windowsHide: true,
      env: {
        ...process.env,
        TEMP: path.join(dir, "tmp"),
        TMP: path.join(dir, "tmp"),
        MATLAB_PREFDIR: path.join(dir, "prefs"),
        MATLABPATH: dir,
      },
    });
    const chunks = [];
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32")
        spawn("python", ["-B", path.resolve("scripts/stop-process-tree.py"), String(child.pid)], {
          windowsHide: true,
          stdio: "ignore",
        });
      else child.kill("SIGKILL");
    }, 300000);
    child.stdout.on("data", (c) => chunks.push(c));
    child.stderr.on("data", (c) => chunks.push(c));
    child.on("error", (error) => {
      chunks.push(Buffer.from(error.message));
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const bytes = Buffer.concat(chunks);
      let log;
      try {
        log = new TextDecoder("utf8", { fatal: true }).decode(bytes);
      } catch {
        log = new TextDecoder("gb18030").decode(bytes);
      }
      fs.writeFileSync(path.join(dir, "run.log"), log);
      resolve({
        file: path.relative(process.cwd(), file),
        hash,
        code,
        timedOut,
        started: log.includes("AUDIT_STARTED"),
        seconds: (Date.now() - start) / 1000,
        pngBytes: fs.existsSync(image) ? fs.statSync(image).size : 0,
        warnings: log.split(/\r?\n/).filter((l) => /warning|警告|error|错误/i.test(l)),
      });
    });
  });
  result.passed = result.code === 0 && !result.timedOut && result.pngBytes > 100;
  result.harness = 2;
  const manifest = readManifest();
  const entry = manifest.exports?.find((e) => path.resolve(e.file) === file && e.sha256 === hash);
  if (result.passed && entry?.category.startsWith("calculation")) {
    const params = new URLSearchParams(entry.route.split("?")[1]);
    const topic = params.get("topic");
    const example = entry.route.startsWith("#/cases")
      ? data.engineeringCases.find((e) => e.id === params.get("project"))
      : topic === "1.2.4"
        ? data.instrumentExample
        : topic === "1.2.5"
          ? data.bandwidthExample
          : data.lectures.find((l) => l.id === topic).examples[entry.worksheet];
    const solution = example.solve?.(entry.parameters);
    const expected = example.asks.map((a) => (a.calc ? a.calc(entry.parameters) : solution[a.key]));
    const actual = JSON.parse(fs.readFileSync(values, "utf8")).answers;
    result.answersCompared = expected.length;
    result.answersMatch =
      actual?.length === expected.length &&
      expected.every((n, i) => Math.abs(n - actual[i]) <= 1e-7 * Math.max(1, Math.abs(n)));
    result.passed &&= result.answersMatch;
    if (!result.answersMatch) result.answerMismatch = { actual, expected };
  }
  results.push(result);
  save();
  console.log(`${result.passed ? "PASS" : "FAIL"} ${name} (${result.seconds}s)`);
}
const watch = process.argv.includes("--watch");
while (true) {
  if (
    process.argv.includes("--stop-on-startup-timeout") &&
    results.slice(previous.length).some((r) => r.timedOut && !r.started)
  ) {
    // An unavailable MATLAB runtime cannot validate more scripts. Drain only
    // processes already started by this runner; leave pending scripts unpassed.
    await Promise.all(running.values());
    console.error(
      "MATLAB startup timed out before the first batch command; remaining scripts are unvalidated.",
    );
    break;
  }
  const manifest = readManifest();
  const files = fs.existsSync(path.join(root, "exports"))
    ? fs
        .readdirSync(path.join(root, "exports"))
        .filter((n) => n.endsWith(".m"))
        .map((n) => path.join(root, "exports", n))
    : [];
  for (const file of files) {
    if (running.size >= workers) break;
    const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    const key = file + hash;
    const compareAnswers = manifest.exports?.some(
      (e) =>
        path.resolve(e.file) === file && e.sha256 === hash && e.category.startsWith("calculation"),
    );
    if (
      running.has(key) ||
      results.some(
        (r) =>
          path.resolve(r.file) === file &&
          r.hash === hash &&
          r.passed &&
          r.harness === 2 &&
          (!compareAnswers || r.answersMatch),
      )
    )
      continue;
    // Failed unchanged scripts are recorded once per invocation, then retried on the next run.
    if (
      results
        .slice(previous.length)
        .some((r) => path.resolve(r.file) === file && r.hash === hash && !r.passed)
    )
      continue;
    const promise = run(file, hash).finally(() => running.delete(key));
    running.set(key, promise);
  }
  if (running.size) await Promise.race(running.values());
  else if (watch && !fs.existsSync(path.join(root, "browser.done")))
    await new Promise((r) => setTimeout(r, 1000));
  else break;
}
save();
const manifest = readManifest();
const current = fs
  .readdirSync(path.join(root, "exports"))
  .filter((n) => n.endsWith(".m"))
  .map((name) => {
    const file = path.join(root, "exports", name);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    const entry = manifest.exports?.find((e) => path.resolve(e.file) === file && e.sha256 === hash);
    const matching = [...results]
      .reverse()
      .filter((r) => path.resolve(r.file) === file && r.hash === hash && r.harness === 2);
    // A later interrupted retry must not hide a successful run of identical content.
    const result =
      matching.find(
        (r) => r.passed && (!entry?.category.startsWith("calculation") || r.answersMatch),
      ) ?? matching[0];
    return {
      ...result,
      file: path.relative(process.cwd(), file),
      hash,
      passed:
        !!result?.passed && (!entry?.category.startsWith("calculation") || !!result.answersMatch),
    };
  });
fs.writeFileSync(path.join(work, "current.json"), JSON.stringify(current, null, 2));
const failed = current.filter((r) => !r.passed);
console.log(
  `MATLAB audit: ${current.length} current scripts; ${results.length} process records; ${failed.length} failures`,
);
if (failed.length) process.exitCode = 1;
