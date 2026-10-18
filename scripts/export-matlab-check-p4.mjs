import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { models } from "./p4-models.mjs";
const { lectures, matlab } = await models(),
  folder = "specs/redesign/matlab-check/P4";
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(
  "specs/redesign/P4-example-inputs.json",
  JSON.stringify(
    lectures.map((l) => ({
      id: l.id,
      p: l.examples[0].defaults,
      answers: l.examples[0].asks.map((a) => ({
        key: a.key,
        value: a.calc(l.examples[0].defaults),
      })),
    })),
    null,
    2,
  ) + "\n",
);
const jobs = [];
for (const l of lectures) {
  const entries = [
    ...l.figures.map((f) => ({
      name: f.number,
      plot: (p) => f.plot(p, 0),
      parameters: l.parameters,
      p: l.defaults,
      rows: f.rows,
      cols: f.cols,
    })),
    ...l.examples.map((e, i) => ({
      name: l.id + "-E" + (i + 1),
      plot: (p) => [e.plot(p)],
      parameters: e.given,
      p: e.defaults,
      rows: 1,
      cols: 1,
    })),
  ];
  for (const e of entries)
    for (let set = 0; set < 2; set++) {
      const p = { ...e.p };
      if (set)
        for (const d of e.parameters) {
          const v = p[d.key],
            candidate = v === d.max ? v * 0.85 : v * 1.13;
          p[d.key] = Math.min(
            d.max,
            Math.max(d.min, d.min + Math.round((candidate - d.min) / d.step) * d.step),
          );
        }
      const panels = e.plot(p),
        name = "fig_" + e.name.replaceAll(".", "_").replaceAll("-", "_") + "_set" + set,
        file = folder + "/" + name + ".m";
      const source =
        "set(groot,'defaultFigureVisible','off');\n" + matlab(panels, e.rows, e.cols, e.name);
      fs.writeFileSync(file, source);
      const expected = {
        panels: panels.map((q) => ({
          x: q.series?.map((s) => s.points.map((p) => p[0])) ?? [],
          y: q.series?.map((s) => s.points.map((p) => p[1])) ?? [],
          field: q.field ? { x: q.field.x, y: q.field.y, z: q.field.z } : null,
        })),
        readouts: e.name.includes("-E") ? undefined : l.readouts(p).map((r) => r[1]),
        answers: e.name.includes("-E")
          ? l.examples[Number(e.name.split("-E")[1]) - 1].asks.map((q) => q.calc(p))
          : undefined,
      };
      const expectedFile = "outputs/P4/" + name + "-web.json";
      fs.writeFileSync(expectedFile, JSON.stringify(expected));
      jobs.push({
        lecture: l.id,
        name: e.name,
        set,
        file,
        expectedFile,
        parameters: p,
        sha256: crypto.createHash("sha256").update(source).digest("hex"),
      });
    }
}
fs.writeFileSync(
  folder + "/manifest.json",
  JSON.stringify({ runtimeValidated: false, jobs }, null, 2) + "\n",
);
const lint = spawnSync(
  "C:/Program Files/MATLAB/R2024b/bin/win64/mlint.exe",
  ["-id", ...jobs.map((j) => path.resolve(j.file))],
  { windowsHide: true, maxBuffer: 64 * 1024 * 1024 },
);
let log;
try {
  log = new TextDecoder("utf-8", { fatal: true }).decode(lint.stdout);
} catch {
  log = new TextDecoder("gb18030").decode(lint.stdout);
}
fs.writeFileSync(folder + "/mlint.log", log);
const counts = {};
for (const m of log.matchAll(/\): ([A-Z][A-Z0-9_]+):/g)) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
const allowed = ["NASGU", "DEFNU", "AGROW", "ASGLU", "ALIGN", "NOSEMI", "CAXIS", "NBRAK2"];
const unexpected = Object.keys(counts).filter((k) => !allowed.includes(k));
fs.writeFileSync(
  folder + "/syntax-check.json",
  JSON.stringify({ files: jobs.length, tool: "R2024b mlint.exe", counts, unexpected }, null, 2),
);
if (unexpected.length) throw Error("mlint " + unexpected.join(","));
console.log(
  "Generated " + jobs.length + " scripts and independent web data snapshots; mlint passed.",
);
