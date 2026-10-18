import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { models } from "./p4-models.mjs";
const { reviewLectures, matlab } = await models(),
  folder = "specs/redesign/matlab-check/P3-2",
  jobs = [];
fs.mkdirSync(folder, { recursive: true });
for (const l of reviewLectures)
  for (const e of l.examples)
    for (let set = 0; set < 2; set++) {
      const p = { ...e.defaults };
      if (set)
        for (const d of e.given) {
          const v = p[d.key],
            candidate = v === d.max ? v * 0.85 : v * 1.13;
          p[d.key] = Math.min(
            d.max,
            Math.max(d.min, d.min + Math.round((candidate - d.min) / d.step) * d.step),
          );
        }
      const q = e.plot(p),
        name = "fig_" + l.id.replaceAll(".", "_") + "_E1_set" + set,
        file = folder + "/" + name + ".m",
        source =
          "set(groot,'defaultFigureVisible','off');\n" +
          matlab([q], 1, 1, "P3 第二轮评审例题标签复核 " + l.id);
      fs.writeFileSync(file, source);
      const expectedFile = "outputs/P4/" + name + "-web.json";
      fs.writeFileSync(
        expectedFile,
        JSON.stringify({
          panels: [
            {
              x: q.series.map((s) => s.points.map((p) => p[0])),
              y: q.series.map((s) => s.points.map((p) => p[1])),
              field: null,
            },
          ],
          answers: e.asks.map((a) => a.calc(p)),
        }),
      );
      jobs.push({
        lecture: l.id,
        name: l.id + "-E1",
        set,
        file,
        expectedFile,
        parameters: p,
        sha256: crypto.createHash("sha256").update(source).digest("hex"),
      });
    }
fs.writeFileSync(
  folder + "/manifest.json",
  JSON.stringify({ runtimeValidated: false, jobs }, null, 2) + "\n",
);
const r = spawnSync(
  "C:/Program Files/MATLAB/R2024b/bin/win64/mlint.exe",
  ["-id", ...jobs.map((j) => path.resolve(j.file))],
  { windowsHide: true, maxBuffer: 32 * 1024 * 1024 },
);
let log;
try {
  log = new TextDecoder("utf-8", { fatal: true }).decode(r.stdout);
} catch {
  log = new TextDecoder("gb18030").decode(r.stdout);
}
fs.writeFileSync(folder + "/mlint.log", log);
const counts = {};
for (const m of log.matchAll(/\): ([A-Z][A-Z0-9_]+):/g)) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
const unexpected = Object.keys(counts).filter(
  (k) => !["NASGU", "DEFNU", "AGROW", "ASGLU", "ALIGN", "NOSEMI", "CAXIS", "NBRAK2"].includes(k),
);
fs.writeFileSync(
  folder + "/syntax-check.json",
  JSON.stringify({ files: jobs.length, counts, unexpected }, null, 2),
);
assert.deepEqual(unexpected, []);
console.log("Generated " + jobs.length + " P1–P3 prerequisite example scripts.");
