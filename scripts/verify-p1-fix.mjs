import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const dir = "specs/redesign/matlab-check/P1-fix";
const results = JSON.parse(fs.readFileSync(`${dir}/results.json`, "utf8"));
const zeroEnergy = JSON.parse(fs.readFileSync(`${dir}/zero-energy-results.json`, "utf8"));
assert.deepEqual(
  zeroEnergy.map((r) => r.x0),
  [0, 0.006],
);
assert.ok(zeroEnergy.every((r) => r.exit === 0 && r.valuesCompared === 1601));
assert.equal(results.length, 88);
assert.deepEqual(JSON.parse(fs.readFileSync(`${dir}/failures.json`, "utf8")), []);
let p0Readouts = 0,
  p0Answers = 0,
  maxReadoutError = 0;
function compare(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((v, i) => {
    const e = Math.abs(v - expected[i]) / Math.max(1, Math.abs(expected[i]));
    assert.ok(e < 2e-9);
    maxReadoutError = Math.max(maxReadoutError, e);
  });
}
for (const result of results) {
  const p = result.parameters,
    data = JSON.parse(fs.readFileSync(`${dir}/${result.filename}.json`, "utf8"));
  if (result.name.startsWith("1.2.4") || result.name.startsWith("1.2.5")) {
    const w = Math.sqrt(p.D / p.M),
      f0 = w / (2 * Math.PI),
      Q = (w * p.M) / p.Rm,
      d = p.Rm / (2 * p.M),
      root = Math.sqrt(1 - 2 * (d / w) ** 2),
      f1 = (Math.hypot(w, d) - d) / (2 * Math.PI),
      f2 = (Math.hypot(w, d) + d) / (2 * Math.PI),
      power = p.F0 ** 2 / (2 * p.Rm);
    const expected = result.name.startsWith("1.2.4")
      ? [f0, Q, f0 * root, f0, f0 / root, p.Rm, 0]
      : [f1, f2, f2 - f1, f0 / Q, power, power, power];
    compare(data.readouts, expected);
    p0Readouts += expected.length;
  }
  if (result.name === "B-1") {
    const Rm = 2 * Math.PI * p.M * (p.f2 - p.f1),
      force = Rm * p.velocity;
    compare(data.answers, [
      Math.sqrt(p.D / p.M) / (2 * Math.PI) / (p.f2 - p.f1),
      Rm,
      0.5 * Rm * p.velocity ** 2,
      force,
    ]);
    p0Answers += 4;
  }
  assert.equal(result.exit, 0);
  assert.equal(results.filter((r) => r.name === result.name).length, 2);
}
const artifact = (file) => {
  const b = fs.readFileSync(file),
    r = {
      path: file.replaceAll("\\", "/"),
      bytes: b.length,
      sha256: crypto.createHash("sha256").update(b).digest("hex"),
    };
  if (file.endsWith(".png")) r.dimensions = [b.readUInt32BE(16), b.readUInt32BE(20)];
  return r;
};
const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(png|m|log|json)$/.test(f))
  .map((f) => artifact(`${dir}/${f}`));
const screenshots = fs
  .readdirSync("specs/redesign/screenshots/P1-fix")
  .filter((f) => f.endsWith(".png"))
  .map((f) => artifact(`specs/redesign/screenshots/P1-fix/${f}`));
assert.equal(screenshots.length, 65);
const downloads = JSON.parse(
  fs.readFileSync("specs/redesign/screenshots/P1-fix/downloads.json", "utf8"),
);
assert.equal(downloads.length, 28);
assert.ok(downloads.every((d) => /^[A-Za-z]\w*\.m$/.test(d.file)));
const sourceNames = [
  "课程教学日历（理论课程）-2026秋-稳定版_20261018.docx",
  "剩余学期逐次课进度规划_20261018.md",
];
const sources = sourceNames.map((f) => artifact(path.join("../02-教学安排", f)));
const report = {
  branch: execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim(),
  scope: "P1 fixes A–D only; no P2, no push, no history rewrite",
  calendar: { lessons: 24, hours: 48, sources },
  matlab: {
    version: "R2024b",
    executable: "C:\\Program Files\\MATLAB\\R2024b\\bin\\matlab.exe",
    processes: 88,
    cases: 44,
    uniqueFigures: 43,
    overlayVariants: 1,
    sets: 2,
    valuesCompared: results.reduce((s, r) => s + r.valuesCompared, 0),
    maxNormalizedCurveError: Math.max(...results.map((r) => r.maxNormalizedError)),
    tolerance: 2e-9,
    p1ReadoutsCompared: results.reduce((s, r) => s + (r.readouts?.length ?? 0), 0),
    p0ReadoutsCompared: p0Readouts,
    worksheetAnswersCompared: results.reduce((s, r) => s + (r.answers?.length ?? 0), 0) + p0Answers,
    maxNormalizedP0ReadoutOrAnswerError: maxReadoutError,
    zeroEnergyRegression: zeroEnergy,
  },
  checks: [
    "npm ci",
    "npm test",
    "node scripts/check-animations.mjs",
    "npm run build",
    "node scripts/check-browser.mjs",
    "npm run format:check",
    "git diff --check",
  ],
  browser: {
    lectureRoutes: 82,
    mainRoutes: 7,
    projectRoutes: 9,
    viewports: [
      [1440, 900],
      [390, 844],
    ],
    additionalBreakpoint: 1200,
    downloads,
    screenshots,
  },
  artifacts: files,
  existingWarnings: [
    "npm audit reports two high severity dependency findings; lockfile unchanged",
    "Vite reports an existing Three.js chunk larger than 500 kB",
  ],
};
assert.equal(report.branch, "redesign/p1-ch1-2");
fs.writeFileSync("specs/redesign/P1-fix-validation.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.matlab, null, 2));
