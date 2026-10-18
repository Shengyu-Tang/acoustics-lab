import assert from "node:assert/strict";
import fs from "node:fs";
import { models } from "./p4-models.mjs";
const references = JSON.parse(fs.readFileSync("scripts/p4-reference-answers.json", "utf8"));
const a = await models(),
  near = (v, e, t = 1e-7) =>
    assert.ok(Math.abs(v - e) < Math.max(1e-9, t * Math.abs(e)), v + " vs " + e);
assert.ok(
  !fs.readFileSync("src/plot/export.ts", "utf8").includes("xticks(ceil(xl(1)):floor(xl(2)))"),
  "integer ticks must use sparse nice ticks",
);
for (const f of [10, 1000, 50000])
  for (const radius of [0.01, 0.05, 0.1]) {
    const q = a.sphere(radius, f, 1000, 1500, 0.01, 2),
      k = a.kWave(f, 1500),
      S = 4 * Math.PI * radius ** 2,
      x = k * radius;
    near(q.z.re, (1000 * 1500 * S * x * x) / (1 + x * x));
    near(q.z.im, (1000 * 1500 * S * x) / (1 + x * x));
    near(q.power, (a.magnitude(q.pressure) ** 2 / (2 * 1000 * 1500)) * 4 * Math.PI * 4);
    const point = a.monopole(S * 0.01, f, 1000, 1500, 2);
    near(a.magnitude(q.pressure) / a.magnitude(point), 1 / Math.sqrt(1 + x * x));
  }
near(a.sphere(0.02, 0.01, 1000, 1500, 0.01, 1).mass, 4 * Math.PI * 1000 * 0.02 ** 3, 1e-8);
near(a.pistonD(0), 1);
near(a.pistonD(3.8317059702075125), 0, 1e-8);
near(a.pistonHalfAngle(0.05, 50000, 1500), 8.879047887665, 1e-5);
near(a.pistonNullAngle(0.05, 50000, 1500), 21.463040293267, 1e-5);
near(a.rayleigh(0.05, 50000, 1500), 1 / 3);
near(a.lastMaximum(0.05, 50000, 1500), 0.0758333333333);
for (const z of [0.001, 0.02, 0.1, 1, 20]) {
  const p = a.pistonAxis(z, 0.05, 50000, 1000, 1500, 0.01);
  near(
    a.magnitude(p),
    2 *
      1000 *
      1500 *
      0.01 *
      Math.abs(Math.sin(((Math.PI * 50000) / 1500) * (Math.hypot(z, 0.05) - z))),
  );
}
const pf = a.magnitude(a.pistonAxis(50, 0.05, 50000, 1000, 1500, 0.01));
near(pf, (1000 * 50000 * Math.PI * 0.05 ** 2 * 0.01) / 50, 2e-5);
let dipoleIntegral = 0;
for (let i = 0; i < 10000; i++) {
  const th = ((i + 0.5) * Math.PI) / 10000;
  dipoleIntegral += (Math.cos(th) ** 2 * Math.sin(th) * Math.PI) / 10000 / 2;
}
near(dipoleIntegral, 1 / 3, 1e-7);
for (const x of [0.01, 0.1, 0.4]) near(a.rigidSphere(x, 0).crossSection / x ** 4, 7 / 9, x * x * 3);
for (const xy of [
  [0, 0],
  [0.2, 0.1],
  [-0.3, 0.15],
]) {
  const p = a.helmholtz(...xy, 0.5, 1000, 1500, 128),
    exact = a.phase(((-2 * Math.PI * 1000) / 1500) * xy[0]);
  near(p.re, exact.re, 1e-7);
  near(p.im, exact.im, 1e-7);
  const outside = a.helmholtz(1.2, 0, 0.5, 1000, 1500, 128);
  near(a.magnitude(outside), 0);
  const pe = a.helmholtz(1.2, 0.1, 0.5, 1000, 1500, 128, true),
    ex = a.green2((2 * Math.PI * 1000) / 1500, Math.hypot(1.2, 0.1));
  near(pe.re, ex.re);
  near(pe.im, ex.im);
  near(a.magnitude(a.helmholtz(0.1, 0.1, 0.5, 1000, 1500, 128, true)), 0);
}
for (const ka of [0.1, 1, 3])
  for (const th of [0, 0.5, 1.7]) {
    const f = (ka * 1500) / (2 * Math.PI * 0.05),
      eps = 1e-6;
    const soft = a.cylinderField(0.05 * Math.cos(th), 0.05 * Math.sin(th), 0.05, f, 1500, true);
    near(a.magnitude(soft.total), 0, 1e-6);
    const p1 = a.cylinderField(
      (0.05 + eps) * Math.cos(th),
      (0.05 + eps) * Math.sin(th),
      0.05,
      f,
      1500,
    );
    const p0 = a.cylinderField(0.05 * Math.cos(th), 0.05 * Math.sin(th), 0.05, f, 1500);
    assert.ok(a.magnitude(a.add(p1.total, a.scale(p0.total, -1))) / eps < 0.1);
  }
for (const r of [0.5, 1, 5]) {
  const AB = a.monopole(1e-5, 1000, 1000, 1500, Math.hypot(r, 2)),
    BA = a.monopole(1e-5, 1000, 1000, 1500, Math.hypot(-r, -2));
  near(AB.re, BA.re);
  near(AB.im, BA.im);
}
near(a.npToDb(1), 8.685889638065);
near(a.absorption(1, 0), 1);
near(a.absorption(0, 1), 0);
for (const f of [500, 1000, 5000]) {
  const q = a.porous(f, 0.05, 10000);
  assert.ok(q.alpha >= 0 && q.alpha <= 1);
  assert.ok(q.z.re > 0);
}
near(a.thorp(1000), 0.0690040904657);
for (const l of a.lectures) {
  l.examples[0].asks.forEach((ask, i) =>
    assert.ok(
      Math.abs(ask.calc(l.examples[0].defaults) - references[l.id][i]) <=
        Math.max(1e-30, Math.abs(references[l.id][i]) * 0.0049),
      l.id + " independent example answer <0.5%",
    ),
  );
  const t = JSON.parse(fs.readFileSync("src/topics.json", "utf8")).find((t) => t.id === l.id);
  assert.deepEqual(
    l.questions.map((q) => q.text),
    t.questions,
    l.id + " original questions",
  );
  assert.ok(l.keyPoints.length >= 3 && l.examples.length >= 1, l.id);
  for (const e of l.examples) {
    const p = e.plot(e.defaults);
    assert.ok(p.matlabModel);
    assert.ok(!/qaRange|工作点|例题答案/.test(p.title));
    assert.ok(e.asks.some((q) => p.title.startsWith(q.text.replace(/^\(\d+\)\s*/, ""))));
  }
  for (const f of l.figures)
    for (const p of f.plot(l.defaults, 0)) {
      assert.ok(p.matlabModel, f.number);
      for (const s of p.series ?? [])
        for (const [x, y] of s.points)
          assert.ok(Number.isFinite(x + y), f.number + " finite curve");
    }
}
for (const ka of [0.001, 0.003])
  for (const theta of [0, 0.8, Math.PI])
    near(
      a.magnitude(a.cylinderFar(ka, theta, false)) / ka ** 2,
      (Math.PI / 4) * Math.abs(1 - 2 * Math.cos(theta)),
      0.001,
    );
near(a.magnitude(a.sphereReceive(0)), 1);
near(a.magnitude(a.diskReceive(0)), 1);
assert.ok(a.magnitude(a.diskReceive(100)) > 1.98 && a.magnitude(a.diskReceive(100)) < 2.02);
for (const alpha of [1e-4, 0.1])
  for (const r of [1, 10, 1000]) near(-20 * Math.log10(Math.exp(-alpha * r)), a.npToDb(alpha) * r);
const designs = new Set();
for (const l of a.lectures)
  for (const e of l.examples)
    for (const p of [
      e.defaults,
      ...e.given.flatMap((d) => [d.min, d.max].map((v) => ({ ...e.defaults, [d.key]: v }))),
    ]) {
      const q = e.plot(p);
      if (q.equalAspect || q.field || q.kind === "polar" || q.yscale === "log") continue;
      const ys = (q.series ?? []).flatMap((s) =>
        s.points
          .filter(([x, y]) => x >= q.xlim[0] && x <= q.xlim[1] && Number.isFinite(y))
          .map((p) => p[1]),
      );
      const lo = Math.min(...ys),
        hi = Math.max(...ys),
        span = q.ylim[1] - q.ylim[0];
      assert.ok(
        lo >= q.ylim[0] - span * 1e-9 && hi <= q.ylim[1] + span * 1e-9,
        l.id + " example clips current response",
      );
      if (q.series?.some((s) => s.kind === "bar"))
        assert.equal(q.ylim[0], 0, l.id + " example bars start at zero");
      else if (hi - lo > 1e-30)
        assert.ok((hi - lo) / span >= 0.4 - 1e-8, l.id + " example amplitude occupancy <40%");
    }
for (const l of a.lectures)
  for (const e of l.examples) {
    const p = e.plot(e.defaults),
      shape = JSON.stringify([
        p.xlabel,
        p.ylabel,
        p.series?.map((s) => [s.name.replace(/[-+]?\d+(\.\d+)?/g, "#"), s.kind, s.style]),
      ]);
    assert.ok(!designs.has(shape), l.id + " repeats an example design");
    designs.add(shape);
    for (const d of e.given) {
      const v = e.defaults[d.key];
      if (v)
        assert.ok(
          !(Math.abs(p.xlim[0] / v - 0.9) < 0.03 && Math.abs(p.xlim[1] / v - 1.1) < 0.03),
          l.id + " example sweeps a known value ±10%",
        );
    }
  }
console.log(
  "PASS P4 physics: sphere impedance/power, point source, dipole power, Helmholtz representation, piston axis and beam, Rayleigh distance, sphere/cylinder limits, reciprocity and absorption; " +
    a.lectures.length +
    " lectures.",
);
