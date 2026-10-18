// Run npm test and export-matlab-check-p1 first. This checks the batch artifacts, not visual layout.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const module = await import("../outputs/p1-check.mjs");
const lectures = Object.entries(module)
  .filter(([k]) => /^l\d+$/.test(k))
  .map(([, l]) => l);
assert.equal(lectures.length, 12);
const names = [
  ...lectures.flatMap((l) => [
    ...l.figures.map((f) => f.number),
    ...l.examples.flatMap((_, i) => [`${l.id}-E${i + 1}`, `${l.id}-E${i + 1}-calculation`]),
  ]),
  "1.2.5-2",
  "B-1",
];
const directory = "specs/redesign/matlab-check/P1",
  work = "outputs/matlab-check/P1";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const records = names.map((name) => {
  const m = fs.readFileSync(path.join(directory, name + ".m")),
    png = fs.readFileSync(path.join(directory, name + ".png"));
  const log = fs.readFileSync(path.join(work, name + ".log"), "utf8");
  assert.ok(!/SceneNode|Error using|错误使用/.test(log), name);
  assert.ok(m.toString("utf8").includes("defaultAxesFontName','Microsoft YaHei'"));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  const width = png.readUInt32BE(16),
    height = png.readUInt32BE(20);
  assert.ok(width >= 500 && height >= 300);
  const answers = {};
  if (name.endsWith("-calculation")) {
    const l = lectures.find((l) => name.startsWith(l.id + "-E")),
      example = l.examples[0];
    for (const ask of example.asks) {
      const value = Number(log.match(new RegExp(`(?:^|\\n)${ask.key} = ([^\\r\\n]+)`))[1]),
        expected = ask.calc(example.defaults);
      assert.ok(
        Math.abs(value - expected) < 0.005 * Math.max(Math.abs(expected), 1e-12),
        name + ": " + ask.key,
      );
      answers[ask.key] = { matlab: value, reference: expected };
    }
  }
  return {
    name,
    width,
    height,
    scriptSha256: sha(Buffer.from(m.toString("utf8").replaceAll("\r\n", "\n"))),
    pngSha256: sha(png),
    ...(Object.keys(answers).length ? { answers } : {}),
  };
});
fs.writeFileSync(
  path.join(directory, "artifacts.json"),
  JSON.stringify(
    {
      matlabExecutable: "C:/Program Files/MATLAB/R2024b/bin/matlab.exe",
      processPolicy: "One matlab -batch process per script; exit results observed during export.",
      visualReview: "REVIEW.md",
      scriptHashEncoding: "UTF-8 with LF line endings",
      lectureFigures: 25,
      exampleFigures: 12,
      calculationScripts: 12,
      p0RegressionFigures: 2,
      records,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `PASS: ${records.length} MATLAB PNG/script/log pairs; all 12 exercise calculation outputs agree with references within 0.5%.`,
);
