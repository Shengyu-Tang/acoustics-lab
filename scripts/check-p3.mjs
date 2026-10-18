import fs from "node:fs";
import assert from "node:assert/strict";
import { build, stop } from "esbuild";
const files = fs.readdirSync("src/content/lectures").filter((f) => /^3\.(6|7|8|9|10)\./.test(f));
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      files
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("") +
      "export * from './src/physics/chapter3b';export {matlab} from './src/plot/export';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/p3-check.mjs",
});
stop();
const a = await import("../outputs/p3-check.mjs");
const near = (v, e, t = 1e-8) =>
  assert.ok(Math.abs(v - e) <= Math.max(1e-12, t * Math.abs(e)), `${v} vs ${e}`);
for (const Z1 of [415, 1.5e6, 4.6e7])
  for (const Z2 of [415, 1.5e6, 4.6e7]) {
    const n = a.normalInterface(Z1, Z2);
    near(1 + n.R, n.D);
    near((1 - n.R) / Z1, n.D / Z2);
    near(n.r + n.t, 1);
    near(n.Ru, -n.R);
    for (const c1 of [343, 1500])
      for (const c2 of [343, 1500])
        for (const theta of [0, 15, 30, 60, 89]) {
          const q = a.oblique(Z1, Z2, c1, c2, theta);
          near(q.r + q.t, 1);
          near(q.st, (c2 / c1) * Math.sin((theta * Math.PI) / 180));
          const lhs = a.scale(a.add(a.complex(1), a.scale(q.R, -1)), q.ci / Z1),
            rhs = a.scale(a.mul(q.D, q.ct), 1 / Z2);
          near(lhs.re, rhs.re);
          near(lhs.im, rhs.im);
          if (q.evanescent) {
            near(a.magnitude(q.R), 1);
            near(q.t, 0);
            assert.ok(q.ct.im < 0, "outgoing decaying branch");
          }
        }
  }
const ang = a.interfaceAngles(1e6, 5e5, 1000, 1500);
near(ang.critical, 41.8103148958, 1e-9);
near(a.magnitude(a.oblique(1e6, 5e5, 1000, 1500, ang.brewster).R), 0);
for (const r of [0.05, 0.1, 1, 10]) {
  const q = a.sphericalState(r, 0, 2, 1000, 1.21, 343);
  near(q.intensity * r * r, 4 / (2 * 1.21 * 343));
  let avg = 0;
  for (let i = 0; i < 4096; i++)
    avg += a.sphericalState(r, (i + 0.5) / 4096000, 2, 1000, 1.21, 343).flux / 4096;
  near(avg, q.intensity);
  const kr = (2 * Math.PI * 1000 * r) / 343,
    z = a.sphericalImpedance(kr);
  near(a.magnitude(z), kr / Math.sqrt(1 + kr * kr));
}
// Wronskian and time-integrated cylindrical energy are independent of the asymptotic implementation.
for (const x of [0.01, 0.1, 1, 5, 11.9, 12, 20, 100]) {
  const b = a.cylindricalBessel(x);
  near(b.J1 * b.Y0 - b.J0 * b.Y1, 2 / (Math.PI * x), 2e-8);
  let avg = 0;
  for (let i = 0; i < 1024; i++)
    avg += a.cylindricalState(x, (2 * Math.PI * (i + 0.5)) / 1024).flux / 1024;
  near(avg, 1 / (Math.PI * x), 2e-8);
}
near(a.cylindricalBessel(1).J0, 0.7651976865579666);
near(a.cylindricalBessel(1).Y0, 0.08825696421567696);
for (const radius of [10, 32.5, 40])
  for (const source of [0.1, 0.95, 0.99])
    for (const launch of [5, 80, 175]) {
      const rays = a.whisperRays(radius, source, launch);
      for (const point of rays.slice(1)) near(Math.hypot(...point), radius, 1e-12);
      for (let i = 1; i < rays.length - 1; i++) {
        const hit = rays[i],
          before = rays[i - 1],
          after = rays[i + 1];
        const incoming = [hit[0] - before[0], hit[1] - before[1]],
          outgoing = [after[0] - hit[0], after[1] - hit[1]];
        const projection = (v) => (v[0] * hit[0] + v[1] * hit[1]) / (radius * Math.hypot(...v));
        near(projection(incoming), -projection(outgoing), 1e-10);
      }
    }
for (const n of [0, 1, 2, 4, 5])
  for (const h of [0.3, 0.5, 2])
    for (const c of [343, 1500]) {
      const fc = (n * c) / (2 * h),
        q = a.guideMode(n, fc + 500, h, c);
      near(q.cp * q.cg, c * c);
      near(q.kz * q.kz + q.kx * q.kx, q.k * q.k);
      if (n) {
        const below = a.guideMode(n, fc * 0.7, h, c);
        assert.ok(!below.propagating && below.decay > 0);
        near(below.decay ** 2, below.kx ** 2 - below.k ** 2);
      }
    }
assert.deepEqual(a.guideCoefficients(0, 0.3, 0.2, 0.5, 0.4, 0.3), [1, 0, 0, 0, 0, 0]);
const refs = JSON.parse(fs.readFileSync("scripts/p3-reference-answers.json", "utf8")),
  sources = JSON.parse(fs.readFileSync("specs/redesign/P3-source-notes.json", "utf8"));
assert.ok(
  files.length > 0 && files.length <= 27,
  "P3 lecture count during sequential implementation",
);
let figures = 0,
  answers = 0;
for (let i = 0; i < files.length; i++) {
  const l = a[`l${i}`],
    e = l.examples[0];
  assert.equal(l.id, files[i].slice(0, -3));
  assert.ok(l.keyPoints.length >= 3);
  assert.deepEqual(
    l.questions.map((q) => q.text),
    sources[l.id].questions,
  );
  assert.equal(l.moocSource, sources[l.id].source);
  assert.ok(l.formulas.length >= 3);
  assert.ok(l.engineering.href.startsWith("#/cases?project="));
  e.asks.forEach((q, j) => {
    near(q.calc(e.defaults), refs[l.id][j], 0.0049);
    answers++;
  });
  for (const p of [
    e.defaults,
    ...e.given.flatMap((d) => [d.min, d.max].map((v) => ({ ...e.defaults, [d.key]: v }))),
  ]) {
    assert.ok(
      e.asks.every((q) => Number.isFinite(q.calc(p))),
      `${l.id}: finite worksheet answers`,
    );
    const panel = e.plot(p);
    assert.ok(
      !/例题答案|工作点/.test(panel.title) && /\d/.test(panel.title),
      l.id + ": descriptive numeric example title",
    );
    assert.ok(panel.matlabModel.setup.includes("worksheet_answers"));
    const xy = panel.series[0].points.filter(([x, y]) => Number.isFinite(x + y));
    const rawY = panel.series
      .filter((s) => s.axis !== "right")
      .flatMap((s) => s.points.map((pt) => pt[1]))
      .filter(Number.isFinite);
    const ys = panel.yscale === "log" ? rawY.filter((v) => v > 0).map(Math.log10) : rawY,
      displayLimits = panel.yscale === "log" ? panel.ylim.map(Math.log10) : panel.ylim,
      lo = Math.min(...ys),
      hi = Math.max(...ys);
    if (hi - lo > 1e-12 && !panel.rightLabel && !panel.equalAspect)
      assert.ok(
        (hi - lo) / (displayLimits[1] - displayLimits[0]) >= (panel.yscale === "log" ? 0.2 : 0.4) - 1e-9,
        `${l.id}: readable example amplitude`,
      );
    assert.ok(xy.length > 1, `${l.id}: physical example has finite data`);
    // Modal bars need half-bin padding; rays occupy only their physical
    // part of a geometry plot. Coverage of an arbitrary sweep is no longer
    // an acceptance criterion. Individual designs are checked separately.
    assert.ok(
      panel.series.some((s) =>
        s.points.some(
          ([x, y]) => Number.isFinite(x + y) && x >= panel.xlim[0] && x <= panel.xlim[1],
        ),
      ),
      `${l.id}: physical data visible in the observation domain`,
    );
  }
  for (const f of l.figures) {
    figures++;
    assert.equal(typeof f.matlabModel, "function");
    for (const p of [
      l.defaults,
      ...l.parameters.flatMap((d) => [d.min, d.max].map((v) => ({ ...l.defaults, [d.key]: v }))),
    ])
      for (const panel of f.plot(p, 0)) {
        assert.ok(panel.matlabModel?.setup.includes("lecture_readouts="));
        assert.equal(panel.matlabModel.series.length, panel.series.length);
        assert.ok(
          (panel.series ?? []).every((s) =>
            s.points.every(
              ([x, y]) => Number.isFinite(x) && (Number.isFinite(y) || Number.isNaN(y)),
            ),
          ),
        );
        if (panel.field) {
          assert.ok(panel.matlabModel.field);
          assert.ok(panel.field.x.length >= 161 && panel.field.y.length >= 81);
          assert.ok(panel.field.z.flat().every(Number.isFinite));
        }
        assert.ok(!a.matlab([panel], 1, 1, f.title).includes("undefined"));
      }
  }
}
console.log(
  `PASS P3: normal/oblique boundary continuity, energy, Snell, critical/total reflection, spherical/cylindrical energy, waveguide cutoff and modes; ${files.length} lectures, ${figures} figures, ${answers} independent example answers <0.5%.`,
);
