// Refuse to publish final acceptance without current hashes, PNG review and checks.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const root = path.resolve("outputs/bug-audit-1");
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const boardsFile = path.join(root, "matlab-review/manifest.json");
const boards = JSON.parse(fs.readFileSync(boardsFile, "utf8"));
const reviewed = new Set(
  boards.filter((b) => b.reviewed).flatMap((b) => b.images.map((r) => r.png + r.sha256)),
);
function batch(folder, harness, count) {
  const directory = path.join(root, folder);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "browser.json"), "utf8"));
  const records = JSON.parse(fs.readFileSync(path.join(directory, "matlab/results.json"), "utf8"));
  const entries = manifest.exports.filter((e) => e.kind === "m");
  if (count !== undefined) assert.equal(entries.length, count, `${folder}: script inventory`);
  const files = entries.map((e) => {
    assert.equal(sha(e.file), e.sha256, `${e.file}: current manifest hash`);
    const png = path.join(
      directory,
      "matlab",
      path.basename(e.file, ".m"),
      e.sha256.slice(0, 12),
      "figure.png",
    );
    const result = [...records]
      .reverse()
      .find(
        (r) =>
          path.resolve(r.file) === path.resolve(e.file) &&
          r.hash === e.sha256 &&
          r.harness === harness &&
          r.passed &&
          (!e.category.startsWith("calculation") || r.answersMatch) &&
          (harness !== 3 || r.modelsMatch),
      );
    assert.ok(result, `${e.file}: no passing current MATLAB execution`);
    assert.ok(fs.statSync(png).size > 100, `${e.file}: missing PNG`);
    const pngSha256 = sha(png),
      relative = path.relative(process.cwd(), png).replaceAll("\\", "/");
    assert.ok(
      reviewed.has(relative + pngSha256),
      `${relative}: current PNG has not been visually reviewed`,
    );
    return {
      route: e.route,
      category: e.category,
      worksheet: e.worksheet,
      figure: e.figure,
      number: e.number,
      set: e.set,
      parameters: e.parameters,
      ...result,
      png: relative,
      pngSha256,
    };
  });
  return {
    scripts: files.length,
    passed: files.length,
    failed: 0,
    unattempted: 0,
    calculations: files.filter((r) => r.category.startsWith("calculation")).length,
    answersCompared: files.reduce((n, r) => n + (r.answersCompared ?? 0), 0),
    curvesCompared: files.reduce((n, r) => n + (r.curvesCompared ?? 0), 0),
    fieldsCompared: files.reduce((n, r) => n + (r.fieldsCompared ?? 0), 0),
    samplesCompared: files.reduce((n, r) => n + (r.samplesCompared ?? 0), 0),
    maxRelativeError: Math.max(0, ...files.map((r) => r.maxRelativeError ?? 0)),
    files,
  };
}
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
assert.equal(branch, "fix/bug-audit-1");
const round1 = batch("", 2, 314),
  round2 = batch("round2-matlab", 2, 208);
const shards = [batch("final-matlab", 3)];
if (shards[0].scripts < 446) shards.push(batch("final-matlab-shard2", 3));
if (shards.reduce((n, b) => n + b.scripts, 0) < 452) shards.push(batch("legacy-matlab", 3, 6));
const twoSets = shards.flatMap((b) => b.files),
  groups = new Map();
assert.equal(twoSets.length, 452);
for (const file of twoSets) {
  const key = `${file.route}:${file.category.startsWith("calculation") ? "worksheet" + file.worksheet : "figure" + file.figure}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(file.set);
}
assert.equal(groups.size, 226);
for (const [key, sets] of groups)
  assert.deepEqual(sets.sort(), [1, 2], `${key}: both parameter sets`);
const checksFile = path.join(root, "final-checks.json");
const checks = JSON.parse(fs.readFileSync(checksFile, "utf8"));
assert.equal(checks.length, 4);
for (const check of checks) {
  assert.equal(check.exitCode, 0);
  assert.equal(sha(check.log), check.sha256);
}
const report = {
  validatedAt: new Date().toISOString(),
  branch,
  fullyAccepted: true,
  supersedes: [
    "bug-audit-1-validation.json MATLAB status",
    "bug-audit-1-round2-validation.json MATLAB status",
  ],
  runtime: {
    executable: "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe",
    release: "R2024b",
    oneProcessPerScript: true,
    timeoutSeconds: 300,
    modelTolerance: "abs(error) <= 1e-7 * max(1, abs(web value))",
  },
  round1,
  round2,
  twoParameterSets: {
    scripts: twoSets.length,
    passed: twoSets.length,
    failed: 0,
    unattempted: 0,
    lectureFigures: 135,
    legacyFigures: 3,
    legacyExportType:
      "Current-sample snapshots; their plotted coordinates are compared with the web formulas.",
    worksheets: 88,
    answersCompared: shards.reduce((n, b) => n + b.answersCompared, 0),
    curvesCompared: shards.reduce((n, b) => n + b.curvesCompared, 0),
    fieldsCompared: shards.reduce((n, b) => n + b.fieldsCompared, 0),
    samplesCompared: shards.reduce((n, b) => n + b.samplesCompared, 0),
    maxRelativeError: Math.max(...shards.map((b) => b.maxRelativeError)),
    files: twoSets,
  },
  visualReview: {
    boards: boards.filter((b) => b.reviewed).length,
    currentPngs: round1.scripts + round2.scripts + twoSets.length,
    manifest: path.relative(process.cwd(), boardsFile).replaceAll("\\", "/"),
    manifestSha256: sha(boardsFile),
    fixes: [
      "Wrapped long MATLAB explanatory titles.",
      "Kept engineering-case inset legends below cutoff/readout labels.",
      "Made the initial zero-radius Doppler wavefront visible through its source marker and explanation.",
      "Converted vibration headers to equivalent data coordinates after final axes layout to avoid R2024b exportgraphics normalized-text displacement.",
    ],
    observations:
      "All accepted current PNG hashes are linked to contact sheets actually opened for review; byte-identical copies share review evidence. Multi-panel details and targeted corrected figures were also inspected at larger scale.",
  },
  checks,
};
const target = "specs/redesign/bug-audit-1-final-matlab-validation.json";
fs.writeFileSync(target, JSON.stringify(report, null, 2) + "\n");
console.log(
  JSON.stringify({
    target,
    round1: round1.passed,
    round2: round2.passed,
    twoParameterSets: report.twoParameterSets.passed,
    samples: report.twoParameterSets.samplesCompared,
    answers: report.twoParameterSets.answersCompared,
    pngs: report.visualReview.currentPngs,
  }),
);
