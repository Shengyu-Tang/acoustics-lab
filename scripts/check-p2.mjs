import fs from "node:fs";
import assert from "node:assert/strict";
import { build, stop } from "esbuild";
const files = fs.readdirSync("src/content/lectures").filter((f) => f.startsWith("3."));
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      files
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("") +
      "export * from './src/physics/chapter3';export {axisTicks} from './src/plot/ticks';export {matlab} from './src/plot/export';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/p2-check.mjs",
});
stop();
const a = await import("../outputs/p2-check.mjs");
const near = (v, e, t = 1e-9) =>
  assert.ok(Math.abs(v - e) <= t * Math.max(Math.abs(e), 1e-10), `${v} != ${e}`);
const lectures = files.map((_, i) => a[`l${i}`]);
const refs = JSON.parse(fs.readFileSync("scripts/p2-reference-answers.json", "utf8"));
const sources = JSON.parse(fs.readFileSync("specs/redesign/P2-source-notes.json", "utf8"));
const projects = JSON.parse(fs.readFileSync("src/projects.json", "utf8"));
assert.equal(lectures.length, 21, "P2 explicit lecture IDs");
near(a.gasSpeed(0).adiabatic, 331.316749, 1e-7);
near(a.gasSpeed(20).adiabatic, 343.2319777, 1e-8);
near(a.gasSpeed(0).isothermal, 280.0137630546, 1e-7);
for (const T of [-20, 0, 20, 40]) {
  near(a.gasSpeed(T, 1.4, 70000).adiabatic, a.gasSpeed(T, 1.4, 150000).adiabatic);
  near(a.gasSpeed(T).adiabatic / a.gasSpeed(T).isothermal, Math.sqrt(1.4));
}
near(a.liquidSpeed(2.25e9, 1000), 1500);
near(a.planeQuantities(1, 1000, 1.21, 343).Z, 415.03);
near(a.planeQuantities(1, 1000, 1000, 1500).ua, 6.6666666667e-7);
near(a.planeQuantities(1, 1000, 1.21, 343).displacement, 3.8348e-7, 0.0001);
for (const rho of [1.21, 1000])
  for (const c of [343, 1500])
    for (const f of [100, 1000, 20000]) {
      const q = a.planeQuantities(2, f, rho, c);
      near(q.ua * q.Z, 2);
      near(q.displacement * 2 * Math.PI * f, q.ua);
      near(q.density * c * c, 2);
      near(q.intensity, c * q.energy);
      for (const standing of [false, true]) {
        const w = 2 * Math.PI * f,
          k = w / c,
          x = 0.031,
          t = 0.000017,
          h = (1e-8 / f) * 1000;
        const fields = (x, t) =>
          standing
            ? {
                p: 4 * Math.cos(k * x) * Math.cos(w * t),
                u: (4 / (rho * c)) * Math.sin(k * x) * Math.sin(w * t),
              }
            : { p: 2 * Math.cos(w * t - k * x), u: (2 / (rho * c)) * Math.cos(w * t - k * x) };
        const e = (x, t) => {
          const v = fields(x, t),
            q = a.acousticEnergy(v.p, v.u, rho, c);
          return q.kinetic + q.potential;
        };
        const flux = (x, t) => {
          const v = fields(x, t);
          return v.p * v.u;
        };
        const et = (e(x, t + h) - e(x, t - h)) / (2 * h),
          dx = c * h;
        const div = (flux(x + dx, t) - flux(x - dx, t)) / (2 * dx);
        assert.ok(
          Math.abs(et + div) < 1e-5 * Math.max(1, Math.abs(et)),
          "local acoustic energy conservation",
        );
      }
    }
near(a.densityRate(1.21, 0.012, 0.008, 0.1), 0.0484);
for (const shape of [0, 1]) near(a.pulse(0.6, shape), 1);
near(a.pulse(0.125, 2, [0, 1, 0, 0, 0, 0, 0, 0, 0]), 0.5);
near(a.pulse(-1, 2), 0);
for (const phase of [0, Math.PI / 6, Math.PI / 2]) {
  const average = Array.from({ length: 10000 }, (_, i) => {
    const t = (2 * Math.PI * (i + 0.5)) / 10000;
    return (2 * 0.003 * Math.cos(t) * Math.cos(t - phase)) / 10000;
  }).reduce((s, v) => s + v, 0);
  near(average, a.meanIntensity(2, 0.003, phase), 1e-5);
}
near(a.meanIntensity(2, 0.003, Math.PI / 2), 0, 1e-5);
near(a.pressureLevel(1), 93.97940008672, 1e-10);
near(a.pressureLevel(1, 1e-6), 120);
near(a.sumLevels([80, 80]), 83.01029995664);
near(a.sumLevels([80, 70]), 80.4139268516);
for (const L of [-20, 0, 80, 160]) {
  near(a.pressureLevel(a.pressureFromLevel(L)), L);
  near(a.powerLevel(a.powerFromLevel(L)), L);
}
for (const sphere of [false, true]) {
  const r = 0.7,
    t = 0.00013,
    pa = 2,
    f = 1000,
    rho = 1.21,
    c = 343,
    dr = 1e-6,
    dt = 1e-9;
  const q = a.potential(r, t, pa, f, rho, c, sphere);
  near(
    (rho *
      (a.potential(r, t + dt, pa, f, rho, c, sphere).phi -
        a.potential(r, t - dt, pa, f, rho, c, sphere).phi)) /
      (2 * dt),
    q.p,
    1e-7,
  );
  near(
    -(
      a.potential(r + dr, t, pa, f, rho, c, sphere).phi -
      a.potential(r - dr, t, pa, f, rho, c, sphere).phi
    ) /
      (2 * dr),
    q.u,
    1e-7,
  );
}
for (const ratio of [0.2, 0.6, 1, 1.25, 1.5]) {
  const k = 8.3,
    q = a.helmholtzY(k, k * ratio);
  near((k * ratio) ** 2 + q.real ** 2 - q.decay ** 2, k * k);
  const x = 0.2,
    y = 0.13,
    h = 1e-5,
    P = (x, y) => a.helmholtzField(x, y, k, ratio, 0.3);
  const residual =
    (P(x + h, y) + P(x - h, y) + P(x, y + h) + P(x, y - h) - 4 * P(x, y)) / h ** 2 +
    k * k * P(x, y);
  assert.ok(Math.abs(residual) < 1e-4, "Helmholtz finite difference residual");
}
for (const az of [-120, 0, 30, 90])
  for (const el of [-70, 0, 25, 80]) {
    const v = a.waveVector(8.3, az, el);
    near(Math.hypot(...v), 8.3);
  }
const formulaNumbers = new Set();
let figures = 0;
for (const l of lectures) {
  assert.ok(
    projects.some((p) => l.engineering.href === `#/cases?project=${p.id}`),
    `${l.id}: valid engineering case`,
  );
  assert.deepEqual(
    l.questions.map((q) => q.text),
    sources[l.id].questions,
    `${l.id}: all verbatim original questions`,
  );
  assert.equal(l.moocSource, sources[l.id].source);
  assert.ok(l.keyPoints.length >= 3);
  for (const f of l.formulas) {
    assert.ok(!formulaNumbers.has(f.number));
    formulaNumbers.add(f.number);
  }
  const e = l.examples[0];
  assert.ok(/\d/.test(e.plot(e.defaults).title), l.id + " numeric example title");
  assert.ok(
    !/例题答案|工作点/.test(e.plot(e.defaults).title),
    l.id + " concrete requested quantity",
  );
  for (const p of [l.defaults, e.defaults])
    assert.ok(!("x" in p || "y" in p), `${l.id}: MATLAB plot temporaries must not shadow inputs`);
  assert.equal(e.hints.length, 2);
  e.asks.forEach((q, i) => near(q.calc(e.defaults), refs[l.id][i], 0.0049));
  assert.ok(e.plot(e.defaults).matlabModel.setup.includes("worksheet_answers"));
  for (const d of e.given)
    for (const value of [d.min, d.max]) {
      const p = { ...e.defaults, [d.key]: value };
      const panel = e.plot(p);
      assert.ok(
        panel.xlim[0] < panel.xlim[1] && panel.ylim[0] < panel.ylim[1],
        `${l.id}: example bounds at ${d.key}=${value}`,
      );
      assert.ok(
        e.asks.every((a) => Number.isFinite(a.calc(p))),
        `${l.id}: finite answers at ${d.key}=${value}`,
      );
    }
  if (["3.1.4", "3.3.2"].includes(l.id)) {
    const key = l.id === "3.1.4" ? "left" : "wLeft";
    const panel = e.plot({ ...e.defaults, [key]: 0 });
    assert.ok(panel.xlim[0] < panel.xlim[1]);
  }
  const configs = [
    l.defaults,
    ...l.parameters.flatMap((d) => [
      { ...l.defaults, [d.key]: d.min },
      { ...l.defaults, [d.key]: d.max },
    ]),
  ];
  for (const f of l.figures) {
    assert.equal(typeof f.matlabModel, "function", `${f.number}: P1 MATLAB model convention`);
    figures++;
    const first = f.plot(l.defaults, 0),
      later = f.plot(l.defaults, (l.animationPeriod?.(l.defaults) ?? 1) / 4);
    assert.deepEqual(
      first.map((p) => [p.xlim, p.ylim, p.rightLim]),
      later.map((p) => [p.xlim, p.ylim, p.rightLim]),
      `${f.number}: fixed animation axes`,
    );
    for (const config of configs)
      for (const panel of f.plot(config, 0)) {
        assert.ok(panel.matlabModel, `${f.number}: editable MATLAB model`);
        assert.equal(panel.matlabModel.series.length, panel.series.length);
        assert.ok(panel.matlabModel.setup.includes("lecture_readouts="));
        for (const s of panel.series)
          assert.ok(
            s.points.every(
              ([x, y]) => Number.isFinite(x) && (Number.isFinite(y) || Number.isNaN(y)),
            ),
            `${f.number}: finite plot data`,
          );
        if (panel.field) {
          assert.ok(panel.matlabModel.field);
          assert.ok(panel.field.z.flat().every(Number.isFinite));
        }
        const script = a.matlab([panel], 1, 1, f.title);
        assert.ok(!script.includes("undefined"));
      }
  }
}
console.log(
  `PASS P2: plane relations, air/water speed, impedance, levels, energy conservation, potential derivatives, Helmholtz solutions; ${lectures.length} original-question/summary schemas, ${figures} modeled figures, 42 independent answers <0.5%.`,
);
