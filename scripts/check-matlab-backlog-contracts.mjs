import assert from "node:assert/strict";
import { models } from "./review-p3-models.mjs";
const { lectures } = await models();
let checked = 0;
const mismatches = [];
for (const l of lectures) {
  for (const e of l.examples) {
    const sets = [
      e.defaults,
      Object.fromEntries(Object.entries(e.defaults).map(([k, v]) => [k, v])),
    ];
    for (const d of e.given) {
      if (d.options) continue;
      const p = sets[1],
        v = p[d.key];
      p[d.key] = Math.min(
        d.max,
        Math.max(d.min, d.min + Math.round(((v || d.step) * 1.05 - d.min) / d.step) * d.step),
      );
    }
    for (const p of sets) {
      const q = e.plot(p);
      for (const s of q.series ?? []) {
        assert.ok(
          s.points.every((pt) => Number.isFinite(pt[0])),
          `${l.id} ${s.name}: finite sample positions`,
        );
        assert.ok(
          s.points.some((pt) => Number.isFinite(pt[1])),
          `${l.id} ${s.name}: nonempty physical branch`,
        );
        if (s.evaluate) {
          assert.equal(s.points[0][0], q.xlim[0], `${l.id}: curve starts at axis edge`);
          assert.equal(s.points.at(-1)[0], q.xlim[1], `${l.id}: curve reaches axis edge`);
        }
      }
      for (const a of q.annotations ?? []) {
        if (q.matlabModel?.annotationLabels?.[q.annotations.indexOf(a)]) continue;
        const m = a.label.match(/=\s*([\d.-]+)(?!.*[×])/);
        if (m && Math.abs(Number(m[1]) - a.value) > 0.01 * Math.max(1, Math.abs(a.value)))
          mismatches.push({ id: l.id, label: a.label, coordinate: a.value });
      }
      checked++;
    }
  }
}
console.log(JSON.stringify({ checked, annotationReview: mismatches }, null, 2));
assert.deepEqual(
  mismatches,
  [],
  "annotation quantities match their coordinate or have an explicit model label",
);
