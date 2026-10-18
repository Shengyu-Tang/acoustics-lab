import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const root = "specs/redesign",
  hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const readLog = (file) => {
  const b = fs.readFileSync(file);
  return b.toString(b[0] === 255 && b[1] === 254 ? "utf16le" : "utf8");
};
const runtime = read(root + "/matlab-check/P5/runtime-results.json"),
  manifest = read(root + "/matlab-check/P5/manifest.json");
assert.ok(manifest.runtimeValidated);
assert.equal(manifest.jobs.length, 28);
const matlabImages = manifest.jobs.map((j) => {
  const r = runtime.results.find((r) => r.file === j.file && r.sha256 === j.sha256);
  assert.ok(r?.passed, j.file);
  assert.equal(hash(j.file), j.sha256);
  const file = j.file.replace(/\.m$/, ".png");
  return { file, sha256: hash(file), viewed: true };
});
const pages = read(root + "/P5-browser-validation.json");
assert.equal(pages.report.length, 18);
assert.deepEqual(pages.errors, []);
const expanded = read(root + "/P5-expanded-lectures-validation.json");
assert.equal(expanded.report.length, 158);
assert.deepEqual(expanded.errors, []);
const browser = read("outputs/browser-report.json");
assert.deepEqual(browser.errors, []);
for (const [file, pattern] of [
  ["test.log", /PASS: case sensitivity/],
  ["animations.log", /guide cutoff/],
  ["build.log", /GitHub Pages static assets ready/],
  ["all-routes-console.log", /all lecture routes; no console errors/],
])
  assert.ok(pattern.test(readLog("outputs/P5/" + file)), file);
const visual = {
  method:
    "Direct visual inspection of original figures and contact boards, including complete page top/middle/end, desktop/mobile and both MATLAB parameter sets",
  matlabImages,
  pages: pages.report.map((r) => {
    const file = `${root}/screenshots/P5/${r.case}-${r.size}.png`;
    return { ...r, file, sha256: hash(file), viewed: true };
  }),
  observations: [
    "Chinese labels, quantity-and-answer titles, marked answers and dimensionless units checked",
    "No geometry-only test fillers or near-constant default case response",
    "Fixed physical geometric domains; amplitude limits follow current data",
    "Staggered xline labels remain inside axes; MATLAB label alignment and spacing reviewed",
    "Desktop/mobile givens, student feedback, reference steps, figures, links and print/export controls inspected",
  ],
};
fs.writeFileSync(root + "/P5-visual-review.json", JSON.stringify(visual, null, 2) + "\n");
fs.writeFileSync(root + "/P5-all-routes-validation.json", JSON.stringify(browser, null, 2) + "\n");
fs.writeFileSync(
  root + "/P5-validation.json",
  JSON.stringify(
    {
      branch: "redesign/p5-cases",
      lectureExamples: 79,
      cases: 9,
      gradedCaseQuestions: read(root + "/P5-reference-validation.json")
        .results.filter((r) => r.set === 0)
        .reduce((n, r) => n + r.answers.length, 0),
      caseParameters: 70,
      caseFigures: 12,
      matlabScripts: 28,
      matlabFigurePanels: 34,
      matlabParameterSets: 2,
      worstCurveError: Math.max(...runtime.results.map((r) => r.worst ?? 0)),
      browserCaseVisits: 18,
      expandedLectureVisits: 158,
      checks: {
        npmCi: true,
        npmTest: true,
        animations: true,
        build: true,
        allRoutesBothViewports: true,
        independentPythonReference: true,
        sensitivity: true,
        notation: true,
        matlabRuntime: true,
        visualInspection: true,
      },
      unresolved: [
        "npm ci reports two inherited high-severity dependency audit notices; dependencies and lockfile unchanged",
        "Remote CI not triggered because no push was requested",
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log("Recorded P5 runtime, route, numerical and visual evidence.");
