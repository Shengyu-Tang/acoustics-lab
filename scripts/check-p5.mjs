import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { models } from "./p5-models.mjs";
import { secondSet } from "./p5-parameter-sets.mjs";
const all = await models();
assert.equal(all.grade(-1.01, -1), "正确");
assert.equal(all.grade(-1.03, -1), "偏小");
assert.equal(all.grade(-0.97, -1), "偏大");
assert.equal(all.grade(12, 1), "量级错误");
assert.equal(all.grade(0, 0), "正确");
assert.equal(all.lectures.length, 79);
const cases = all.engineeringCases;
assert.equal(cases.length, 9);
const inputs = cases.flatMap((e) =>
  [e.defaults, secondSet(e)].map((p, set) => ({ id: e.id, set, p })),
);
fs.writeFileSync("outputs/P5/reference-inputs.json", JSON.stringify(inputs));
const py = spawnSync("python", ["scripts/p5-reference.py", "outputs/P5/reference-inputs.json"], {
  encoding: "utf8",
  windowsHide: true,
});
assert.equal(py.status, 0, py.stderr);
const refs = JSON.parse(py.stdout);
for (const l of all.lectures) {
  const examples = l.defaults ? l.examples : [l.id === "1.2.4" ? all.instrument : all.bandwidth];
  assert.ok(examples.length >= 1, l.id + " graded example");
  assert.ok(
    cases.some((e) => l.engineering.href.endsWith("=" + e.id)),
    l.id + " case link",
  );
  for (const e of examples) {
    assert.ok(
      e.given.length && e.asks.length && e.hints.length === 2,
      l.id + " complete worksheet",
    );
    for (const a of e.asks) {
      assert.ok(
        Number.isFinite(a.calc ? a.calc(e.defaults) : e.solve(e.defaults)[a.key]),
        l.id + " finite answer",
      );
      if (a.sub) assert.ok(a.sub(e.defaults).length > 10, l.id + " substitution");
    }
    {
      const q =
        e.plot?.(e.defaults) ??
        (l.id === "1.2.4" ? all.instrumentPanel(e.defaults) : all.bandwidthPanel(e.defaults));
      assert.ok(q.matlabModel && /\d/.test(q.title), l.id + " titled answer and editable MATLAB");
      assert.ok(
        q.series.some((s) => s.marker || s.kind === "bar") || q.annotations?.length,
        l.id + " answer marked",
      );
    }
  }
}
for (const row of inputs) {
  const e = cases.find((e) => e.id === row.id),
    ref = refs.find((r) => r.id === row.id && r.set === row.set);
  assert.ok(
    e.asks.length >= 3 && e.lectures.length >= 3 && e.lectures.length <= 5,
    e.id + " dependent design questions",
  );
  e.asks.forEach((a, i) => {
    const answer = a.calc(row.p);
    assert.ok(
      Math.abs(answer - ref.answers[i]) <= Math.max(1e-12, 0.0049 * Math.abs(ref.answers[i])),
      `${e.id} set${row.set} ${a.key}: ${answer} vs ${ref.answers[i]}`,
    );
  });
  const q = e.plot(row.p);
  if (e.id === "duct") {
    const p = row.p,
      r = Math.hypot(p.res - 1, p.react) / Math.hypot(p.res + 1, p.react),
      phase = Math.atan2(2 * p.react, p.res * p.res + p.react * p.react - 1);
    for (const i of [20, 40, 80]) {
      const [z, actual] = q.series[0].points[i];
      const expected = Math.sqrt(
        1 + r * r + 2 * r * Math.cos((4 * Math.PI * p.f * z) / p.c - phase),
      );
      assert.ok(
        Math.abs(actual - expected) < 1e-12,
        "duct distance measured away from termination, e^{jwt} phase convention",
      );
    }
  }
  assert.equal(q.answerKey !== undefined, true, e.id + " explicit answer quantity");
  assert.ok(q.title.includes("="), e.id + " quantity and answer title");
  assert.ok(
    q.matlabModel.setup.includes("worksheet_answers"),
    e.id + " MATLAB calculation answers",
  );
  for (const panel of [q, ...(e.additionalPlots?.(row.p) ?? [])]) {
    assert.ok(panel.matlabModel, e.id + " formula-based figure export");
    assert.ok(
      panel.series.every((s) => s.points.every((pt) => pt.every(Number.isFinite))),
      e.id + " finite figure",
    );
    assert.ok(
      panel.series.some((s) => s.style !== "none" && s.points.length > 100),
      e.id + " physical curve, not geometry filler",
    );
  }
}
fs.writeFileSync(
  "specs/redesign/P5-reference-validation.json",
  JSON.stringify(
    {
      lectures: 79,
      cases: 9,
      sets: 2,
      reference: "independent Python standard-library formulas",
      results: inputs.map((x) => ({
        ...x,
        answers: cases.find((e) => e.id === x.id).asks.map((a) => a.calc(x.p)),
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS: 79 graded lecture examples; 9 design cases, two independently calculated parameter sets, answer error <0.5%.",
);
