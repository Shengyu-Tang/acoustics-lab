import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { models } from "./review-p3-models.mjs";
const { lectures, matlab } = await models(),
  jobs = [];
for (const l of lectures) {
  const folder = `specs/redesign/matlab-check/${Number(l.id.split(".")[1]) <= 5 ? "P2" : "P3"}`;
  const entries = [
    ...l.figures.map((f) => ({
      name: f.number,
      p: l.defaults,
      rows: f.rows,
      cols: f.cols,
      plot: (p) => f.plot(p, 0),
      parameters: l.parameters,
    })),
    ...l.examples.map((e, i) => ({
      name: l.id + "-E" + (i + 1),
      p: e.defaults,
      rows: 1,
      cols: 1,
      plot: (p) => [e.plot(p)],
      parameters: e.given,
    })),
  ];
  for (const e of entries)
    for (let set = 0; set < 2; set++) {
      const p = { ...e.p };
      if (set)
        for (const d of e.parameters) {
          if (d.options) continue;
          const v = p[d.key];
          const proposed = v === 0 ? Math.min(d.max, d.step) : v * 1.05;
          const snapped = d.min + Math.round((proposed - d.min) / d.step) * d.step;
          p[d.key] = Number(Math.min(d.max, Math.max(d.min, snapped)).toPrecision(12));
        }
      const panels = e.plot(p),
        name = "fig_" + e.name.replaceAll(".", "_").replaceAll("-", "_") + "_set" + set;
      const source =
        "set(groot,'defaultFigureVisible','off');\n" +
        matlab(panels, e.rows ?? 1, e.cols ?? 1, e.name);
      const file = folder + "/" + name + ".m";
      fs.writeFileSync(file, source);
      jobs.push({
        lecture: l.id,
        name: e.name,
        set,
        file,
        parameters: p,
        sha256: crypto.createHash("sha256").update(source).digest("hex"),
      });
    }
}
const out = "specs/redesign/matlab-check/P3-1";
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  out + "/manifest.json",
  JSON.stringify({ runtimeValidated: false, jobs }, null, 2) + "\n",
);
const r = spawnSync(
  "C:/Program Files/MATLAB/R2024b/bin/win64/mlint.exe",
  ["-id", ...jobs.map((j) => path.resolve(j.file))],
  { windowsHide: true, maxBuffer: 32 * 1024 * 1024 },
);
assert.ifError(r.error);
const bytes = Buffer.concat([r.stdout, r.stderr]);
let log;
try {
  log = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
} catch {
  log = new TextDecoder("gb18030").decode(bytes);
}
fs.writeFileSync(out + "/mlint.log", log);
const counts = {};
for (const m of log.matchAll(/\): ([A-Z][A-Z0-9_]+):/g)) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
const allowed = ["NASGU", "DEFNU", "AGROW", "ASGLU", "ALIGN", "NOSEMI", "CAXIS", "NBRAK2"];
const unexpected = Object.keys(counts).filter((c) => !allowed.includes(c));
fs.writeFileSync(
  out + "/syntax-check.json",
  JSON.stringify(
    {
      files: jobs.length,
      tool: "MATLAB R2024b mlint.exe -id",
      exit: r.status,
      counts,
      syntaxDiagnostics: unexpected,
      runtimeValidated: false,
    },
    null,
    2,
  ) + "\n",
);
assert.deepEqual(unexpected, []);
assert.ok(!/NOFIL|PARSE|SYNER|syntax error/i.test(log));
console.log(
  `PASS: regenerated and mlint-parsed ${jobs.length} P2/P3 scripts; MATLAB runtime pending.`,
);
