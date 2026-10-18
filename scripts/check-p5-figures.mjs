import assert from "node:assert/strict";
import fs from "node:fs";
import { models } from "./p5-models.mjs";
const { engineeringCases: cases } = await models();
const figures = (e, p) => [e.plot(p), ...(e.additionalPlots?.(p) ?? [])];
const data = (q) => [
  ...q.series.flatMap((s) => s.points.flat()),
  ...(q.annotations ?? []).map((a) => a.value),
];
const changed = (a, b) =>
  a.length !== b.length ||
  a.some((v, i) => Math.abs(v - b[i]) > 0.01 * Math.max(1e-15, Math.abs(v), Math.abs(b[i])));
const failures = [],
  report = [];
for (const e of cases) {
  const base = figures(e, e.defaults);
  for (const d of e.given) {
    const variant = [d.min, d.max].map((v) => figures(e, { ...e.defaults, [d.key]: v }));
    if (!variant.some((q) => q.some((p, i) => changed(data(p), data(base[i])))))
      failures.push(`${e.id} ${d.key}: invariant plotted data`);
    for (const qs of variant)
      qs.forEach((q, i) => {
        assert.deepEqual(q.xlim, base[i].xlim, `${e.id} ${d.key} fixed physical x axis`);
        if (q.coordinateY)
          assert.deepEqual(q.ylim, base[i].ylim, `${e.id} ${d.key} fixed geometry y axis`);
        for (const s of q.series)
          assert.ok(
            s.points.every((pt) => pt.every(Number.isFinite)),
            `${e.id} ${d.key}: finite endpoints`,
          );
      });
  }
  for (const [i, q] of base.entries()) {
    const curves = q.series.filter((s) => s.style !== "none" && s.points.length > 100);
    assert.ok(curves.length, e.id + " no geometry-only filler subplot");
    assert.ok(
      curves.some((s) => {
        const ys = s.points.map((p) => p[1]);
        return (Math.max(...ys) - Math.min(...ys)) / Math.max(1e-15, ...ys.map(Math.abs)) >= 0.05;
      }),
      e.id + " default physical variation >=5%",
    );
    for (const side of ["left", ...(q.rightLabel ? ["right"] : [])]) {
      if (q.coordinateY) continue;
      const ys = curves
        .filter((s) => (s.axis ?? "left") === side)
        .flatMap((s) => s.points.map((p) => p[1]));
      if (!ys.length) continue;
      const lim = side === "right" ? q.rightLim : q.ylim;
      const occupied = (Math.max(...ys) - Math.min(...ys)) / (lim[1] - lim[0]);
      assert.ok(occupied >= 0.4, `${e.id} panel${i} ${side} amplitude occupancy ${occupied}`);
    }
    const labels = (q.annotations ?? []).map((a) => a.label);
    assert.equal(new Set(labels).size, labels.length, e.id + " unique annotation labels");
    report.push({ case: e.id, figure: i + 1, xlim: q.xlim, ylim: q.ylim, title: q.title });
  }
}
assert.deepEqual(failures, []);
fs.writeFileSync(
  "specs/redesign/P5-figure-validation.json",
  JSON.stringify(
    { parameters: cases.reduce((n, e) => n + e.given.length, 0), figures: report, failures },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS: case sensitivity at both endpoints, fixed geometric axes, default amplitude occupancy, meaningful curves and unique labels.",
);
