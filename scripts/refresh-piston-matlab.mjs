// Refresh only the requested piston plot in the previously accepted P4 cohort.
import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { models } from "./p4-models.mjs";
const { lectures, matlab } = await models();
const l = lectures.find((l) => l.id === "4.4.3");
const f = l.figures.find((f) => f.number === "4.4.3-1");
const file = "specs/redesign/matlab-check/P4/manifest.json";
const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
const jobs = manifest.jobs.filter((j) => j.name === "4.4.3-1");
assert.equal(jobs.length, 2);
for (const j of jobs) {
  const panels = f.plot(j.parameters, 0);
  const source =
    "set(groot,'defaultFigureVisible','off');\n" + matlab(panels, f.rows, f.cols, j.name);
  fs.writeFileSync(j.file, source);
  j.sha256 = crypto.createHash("sha256").update(source).digest("hex");
  fs.writeFileSync(
    j.expectedFile,
    JSON.stringify({
      panels: panels.map((q) => ({
        x: q.series.map((s) => s.points.map((p) => p[0])),
        y: q.series.map((s) => s.points.map((p) => p[1])),
        field: null,
      })),
      readouts: l.readouts(j.parameters).map((r) => r[1]),
    }),
  );
}
const prior = JSON.parse(
  fs.readFileSync("specs/redesign/matlab-check/P4/runtime-results.json", "utf8"),
);
const queue = manifest.jobs.filter(
  (j) => !prior.results.some((r) => r.file === j.file && r.sha256 === j.sha256 && r.passed),
);
assert.ok(
  queue.length <= 2 && queue.every((j) => j.name === "4.4.3-1"),
  "only the requested canonical piston scripts may need revalidation",
);
if (queue.length) manifest.runtimeValidated = false;
fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Refreshed 2 standalone half-polar scripts; ${queue.length} pending canonical runs. Run node scripts/run-matlab-check-p4.mjs to refresh pending PNG/runtime evidence.`,
);
