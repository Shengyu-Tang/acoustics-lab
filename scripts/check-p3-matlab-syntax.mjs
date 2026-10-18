import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
const folder = "specs/redesign/matlab-check/P3";
const files = fs
  .readdirSync(folder)
  .filter((f) => f.endsWith(".m"))
  .sort();
assert.equal(files.length, 136, "41 simulation figures and 27 example figures, two sets each");
const r = spawnSync(
  "C:/Program Files/MATLAB/R2024b/bin/win64/mlint.exe",
  ["-id", ...files.map((f) => path.resolve(folder, f))],
  { windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
);
assert.ifError(r.error);
const bytes = Buffer.concat([r.stdout, r.stderr]);
let log;
try {
  log = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
} catch {
  log = new TextDecoder("gb18030").decode(bytes);
}
const counts = {};
for (const m of log.matchAll(/\): ([A-Z][A-Z0-9_]+):/g)) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
// NBRAK2 only flags redundant square brackets, e.g. a singleton readout vector.
const allowed = ["NASGU", "DEFNU", "AGROW", "ASGLU", "ALIGN", "NOSEMI", "CAXIS", "NBRAK2"];
const unexpected = Object.keys(counts).filter((c) => !allowed.includes(c));
fs.writeFileSync(
  `${folder}/syntax-check.json`,
  JSON.stringify(
    {
      files: files.length,
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
assert.deepEqual(unexpected, [], "unexpected MATLAB diagnostics");
assert.ok(!/NOFIL|PARSE|SYNER|syntax error/i.test(log), "all scripts opened and parsed");
console.log(
  `PASS: ${files.length} MATLAB scripts parsed; advisory diagnostics only. Runtime and PNG verification remain separate.`,
);
