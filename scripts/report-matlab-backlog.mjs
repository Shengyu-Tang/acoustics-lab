import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";

const root = "specs/redesign/matlab-check";
const definitions = [
  ["review-P2-3 / P1", "P2-3/P1", 60, /^fig_[12]_/],
  ["review-P2-3 / P2", "P2-3/P2", 68],
  ["P3", "P3", 136],
  ["review-P3-1", "P3-1", 246],
  ["4.4.3-1 half polar", "P4-half-polar", 2],
];
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const final = process.argv.includes("--final");
const reviewFolder = "outputs/matlab-backlog-review";
const boards = fs.existsSync(reviewFolder + "/manifest.json")
  ? JSON.parse(fs.readFileSync(reviewFolder + "/manifest.json", "utf8"))
  : [];
const reviewed = fs.existsSync(reviewFolder + "/reviewed.json")
  ? JSON.parse(fs.readFileSync(reviewFolder + "/reviewed.json", "utf8"))
  : [];
const seen = new Set(reviewed.map((r) => `${r.png}:${r.sha256}:${r.strip}`));
const batches = definitions.map(([batch, folder, required, filter]) => {
  const dir = `${root}/${folder}`;
  const rows = fs.existsSync(dir + "/results.json")
    ? JSON.parse(fs.readFileSync(dir + "/results.json", "utf8"))
    : [];
  const results = rows
    .filter((r) => !filter || filter.test(r.filename))
    .filter((r) => {
      const file = `${dir}/${r.filename}.m`,
        png = `${dir}/${r.filename}.png`;
      return fs.existsSync(file) && fs.existsSync(png) && r.sha256 === hash(file);
    })
    .map((r) => {
      const file = `${dir}/${r.filename}.m`,
        png = `${dir}/${r.filename}.png`;
      const pngSha256 = hash(png);
      const strips = boards
        .flatMap((b) => b.images)
        .filter((i) => i.png === png && i.sha256 === pngSha256);
      return {
        ...r,
        file,
        png,
        pngSha256,
        visuallyReviewed:
          strips.length > 0 && strips.every((i) => seen.has(`${png}:${pngSha256}:${i.strip}`)),
      };
    });
  const pairs = new Map();
  for (const r of results) {
    if (!pairs.has(r.name)) pairs.set(r.name, []);
    pairs.get(r.name).push(r);
    assert.equal(r.exit, 0);
    assert.ok(r.maxNormalizedError < 2e-9);
  }
  const completePairs = [...pairs.values()].filter(
    (p) =>
      p.length === 2 &&
      p.some((r) => r.set === 0) &&
      p.some((r) => r.set === 1) &&
      JSON.stringify(p[0].parameters) !== JSON.stringify(p[1].parameters),
  ).length;
  const summary = {
    batch,
    folder: dir,
    required,
    passed: results.length,
    completePairs,
    visuallyReviewed: results.filter((r) => r.visuallyReviewed).length,
    valuesCompared: results.reduce((n, r) => n + r.valuesCompared, 0),
    maxNormalizedError: Math.max(0, ...results.map((r) => r.maxNormalizedError)),
    results,
  };
  if (final) {
    assert.equal(summary.passed, required, `${batch}: current-source MATLAB results`);
    assert.equal(completePairs * 2, required, `${batch}: distinct parameter pairs`);
    assert.equal(summary.visuallyReviewed, required, `${batch}: all current PNGs inspected`);
  }
  return summary;
});
console.table(batches.map(({ results, ...b }) => b));
if (!final) process.exit(0);

const half = batches.at(-1);
for (const r of half.results) {
  const data = JSON.parse(fs.readFileSync(r.file.replace(/\.m$/, ".json"), "utf8"));
  const limits = Array.isArray(data.limits) ? data.limits[0] : data.limits;
  assert.deepEqual(limits.x, [-90, 90]);
  assert.deepEqual(limits.y, [0, 40]);
}
const report = {
  runtimeValidated: true,
  matlab: "R2024b",
  oneProcessPerScript: true,
  timeoutMs: 300000,
  independentParameterSetRuns: batches.reduce((n, b) => n + b.passed, 0),
  tolerance: "absolute error / max(1, abs(web value)) < 2e-9; worked answer relative error < 0.49%",
  visualReview:
    "All PNGs opened in labelled contact sheets; dense labels and half-polar plots inspected at full size. Chinese, scripts, labels, outside legends, full continuous curve domains, categorical colors checked.",
  batches,
};
const canonical = JSON.parse(
  fs.readFileSync(root + "/P4/runtime-results.json", "utf8"),
).results.filter((r) => /fig_4_4_3_1_set[01]\.m$/.test(r.file));
assert.equal(canonical.length, 2);
for (const r of canonical) {
  assert.ok(
    r.passed && r.sha256 === hash(r.file),
    "canonical P4 half-polar source was revalidated",
  );
}
report.additionalCanonicalPistonRuns = canonical;
fs.writeFileSync(
  "specs/redesign/MATLAB-backlog-validation.json",
  JSON.stringify(report, null, 2) + "\n",
);
for (const b of batches) {
  fs.writeFileSync(b.folder + "/results.json", JSON.stringify(b.results, null, 2) + "\n");
}
const manifestFile = root + "/P3-1/manifest.json";
const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
for (const j of manifest.jobs) {
  const r = batches[3].results.find((r) => r.name === j.name && r.set === j.set);
  j.originalFile ??= j.file;
  j.originalSha256 ??= j.sha256;
  j.file = r.file;
  j.sha256 = r.sha256;
}
manifest.runtimeValidated = true;
manifest.runtimeResults = "results.json";
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");

const table = [
  "| Batch | Scripts / parameter sets | MATLAB | PNG review | Max normalized error |",
  "| --- | ---: | --- | --- | ---: |",
  ...batches.map(
    (b) =>
      `| ${b.batch} | ${b.passed}/${b.required} | PASS | ${b.visuallyReviewed}/${b.required} | ${b.maxNormalizedError.toExponential(3)} |`,
  ),
].join("\n");
const summary = `# MATLAB runtime backlog and half-space piston plot\n\nBranch: \`redesign/p5-cases\`. Local commits only; no push, history rewrite, or stash operations. This file is intentionally uncommitted.\n\n${table}\n\nAll ${report.independentParameterSetRuns} scripts ran in separate MATLAB R2024b \`-batch\` processes with a 300-second timeout. Each figure/example uses two distinct parameter sets. Curve coordinates, fields, readouts, answers and applicable axis limits were compared with independently evaluated web formulas; all comparisons passed. PNGs and logs are beside their scripts. Full provenance and per-script errors: \`specs/redesign/MATLAB-backlog-validation.json\`.\n\nRuntime fixes: categorical patch RGB colors; elementwise waveguide field multiplication; full rectangular subplot data cells; marker-only axis fallback; answer markers in example amplitude limits; matching nice axes and continuous curve domains; positive physical lower bounds; outside legends and wider dynamic-label lanes; corrected example annotation quantities and plotted answer markers. Each parameter set exports its own current labels.\n\n4.4.3-1 now draws only -90..90 degrees in the browser and MATLAB. Both MATLAB angular limits and both parameter sets passed; Chinese labels, dB radial ticks, angle markers and legends were visually inspected.\n\nPassed: \`npm ci\`, \`npm test\`, \`node scripts/check-animations.mjs\`, \`npm run build\`; all 82 lecture routes and auxiliary routes at desktop/mobile widths; all P2/P3 axis labels and captures; 4.4.3 desktop/mobile browser checks.\n\nRun commands:\n\n\`\`\`powershell\nnode scripts/check-matlab-models.mjs --figures-only --out=specs/redesign/matlab-check/P2-3/P1 --workers=1 --timeout-ms=300000\nnode scripts/check-matlab-models.mjs --batch=P2 --figures-only --out=specs/redesign/matlab-check/P2-3/P2 --workers=1 --timeout-ms=300000\nnode scripts/check-matlab-models.mjs --batch=P3 --workers=1 --timeout-ms=300000\nnode scripts/check-matlab-models.mjs --manifest=specs/redesign/matlab-check/P3-1/manifest.json --out=specs/redesign/matlab-check/P3-1 --workers=2 --timeout-ms=300000\nnode scripts/check-matlab-models.mjs --manifest=specs/redesign/matlab-check/P4/manifest.json --filter=4.4.3-1 --out=specs/redesign/matlab-check/P4-half-polar --workers=1 --timeout-ms=300000\n\`\`\`\n\nInterrupted and failed early attempts were rerun after correction; final status requires a matching SHA-256 for every script and visual coverage of every final PNG. All writable QA work is inside this repository; adjacent teaching directories were read only.\n`;
fs.writeFileSync("PR_SUMMARY.md", summary);
fs.writeFileSync(
  "specs/redesign/MATLAB-backlog-validation.md",
  `# MATLAB R2024b runtime backlog validation\n\n${table}\n\nAll 512 current scripts passed independent runtime and web-formula comparisons, with two distinct parameter sets per figure/example and a 300-second timeout per process. All final PNGs were inspected. The full per-script parameters, hashes, PNG hashes, numerical errors and visual coverage are in [MATLAB-backlog-validation.json](MATLAB-backlog-validation.json).\n\nThe scripts and PNGs are in the batch folders listed in the JSON. P3-1 uses its own folder to retain its original parameter pairs independently of the P3 batch; its manifest preserves the original P2/P3 paths and hashes. Earlier blocked startup attempts and mlint-only records are historical and are superseded by this runtime report.\n\nThe 4.4.3-1 plot uses a -90..90-degree half-polar grid in both renderers; both MATLAB angular/radial limits were checked. Legends are outside the curves, dynamic labels have reserved width, edge labels point into the plotting area, and categorical mode maps use exactly two colors.\n\nPassed: npm ci, npm test, animation checks, production build, all 82 lecture/auxiliary browser routes at 1440 and 390 pixels, all P2/P3 axis-label checks/captures, and the half-polar browser checks.\n`,
);
const runtimeSummary = (list) => ({
  status: "passed",
  runtimeValidated: true,
  fullValidationComplete: true,
  matlab: "R2024b",
  oneProcessPerScript: true,
  timeoutSeconds: 300,
  scripts: list.reduce((n, b) => n + b.passed, 0),
  pngs: list.reduce((n, b) => n + b.visuallyReviewed, 0),
  maxNormalizedError: Math.max(...list.map((b) => b.maxNormalizedError)),
  report: "MATLAB-backlog-validation.json",
});
for (const [name, list] of [
  ["P2-3", batches.slice(0, 2)],
  ["P3", [batches[2]]],
]) {
  const file = `specs/redesign/${name}-validation.json`;
  const old = JSON.parse(fs.readFileSync(file, "utf8"));
  old.historicalMatlab ??= old.matlab;
  old.status = "PASS: MATLAB R2024b two-set runtime, numeric comparison and PNG review complete.";
  old.matlab = runtimeSummary(list);
  fs.writeFileSync(file, JSON.stringify(old, null, 2) + "\n");
}
const reviewFile = "specs/redesign/P3-1-validation.json";
const review = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
review.historicalMatlabRuntime ??= review.matlabRuntime;
review.matlabRuntime = runtimeSummary([batches[3]]);
review.matlabSyntax.runtimeValidated = true;
review.matlabSyntax.note =
  "Historical mlint counts; all current regenerated scripts also passed runtime parsing and numerical validation.";
fs.writeFileSync(reviewFile, JSON.stringify(review, null, 2) + "\n");
fs.writeFileSync(
  root + "/P3-1/README.md",
  `# MATLAB evidence for review P3-1\n\nAll 246 scripts (two distinct parameter sets for 75 simulation figures and 48 examples) passed MATLAB R2024b runtime, curve/field/readout/answer comparisons with the web formulas, and visual PNG review.\n\n\`manifest.json\` now points to the validated scripts in this folder and preserves their original P2/P3 paths and hashes as \`originalFile\` / \`originalSha256\`. \`results.json\` records current script and PNG hashes, errors, timings and visual coverage. Keeping this cohort separate preserves its parameter pairs independently of the standard P3 batch.\n\n\`runtime-attempt.json\`, \`mlint.log\` and \`syntax-check.json\` are historical evidence from before runtime recovery; the failed startup attempt is superseded by the complete runtime report.\n\nReproduce from the repository root:\n\n\`\`\`powershell\nnode scripts/check-matlab-models.mjs --manifest=specs/redesign/matlab-check/P3-1/manifest.json --out=specs/redesign/matlab-check/P3-1 --workers=2 --timeout-ms=300000\n\`\`\`\n\nSee [full backlog results](../../MATLAB-backlog-validation.json).\n`,
);
console.log("PASS: final MATLAB backlog report and uncommitted PR_SUMMARY.md written.");
