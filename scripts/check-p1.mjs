import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
const files = fs
  .readdirSync("src/content/lectures")
  .filter((f) => !f.startsWith("3.") && !["1.2.4.ts", "1.2.5.ts"].includes(f));
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      files
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("") +
      "export * from './src/physics/p1';export * from './src/physics/chapter2';export {axisTicks} from './src/plot/ticks';export {matlab} from './src/plot/export';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/p1-check.mjs",
});
const all = await import("../outputs/p1-check.mjs");
const lectures = Object.entries(all)
  .filter(([k]) => /^l\d+$/.test(k))
  .map(([, l]) => l);
const near = (a, b, t = 0.00001) =>
  assert.ok(Math.abs(a - b) <= t * Math.max(Math.abs(b), 1e-10), `${a} != ${b}`);
const p = { M: 2, D: 800, Rm: 4, x0: 0.005, v0: 0.08 };
const c = all.decay(p);
near(c.delta, 1);
near(c.w0, 20);
near(c.wd, Math.sqrt(399));
near(c.tau, 1);
near(c.logDecrement, (2 * Math.PI) / Math.sqrt(399));
near(all.freeMotion({ ...p, Rm: 0 }, 0), p.x0);
for (const x0 of [-0.01, 0, 0.01]) {
  const u = { ...p, x0, Rm: 0 };
  const T = all.decay(u).T;
  near(T, Math.PI / 10);
  near(all.freeMotion(u, T), x0);
}
near(all.freeMotion(p, c.Td), p.x0 * Math.exp(-c.logDecrement));
for (const Q of [1.7, 5, 10, 30]) {
  const w = 40,
    delta = w / (2 * Q),
    T0 = (2 * Math.PI) / w,
    Td = (2 * Math.PI) / Math.sqrt(w * w - delta * delta),
    tp = Math.PI / delta;
  near(Math.exp(-delta * tp), Math.exp(-Math.PI));
  near(tp / T0, Q);
  assert.ok(Math.abs(Math.round(tp / Td) - Math.round(Q)) <= 1);
}
for (let i = 0; i < 1000; i++) {
  const t = i / 999,
    A = 0.004,
    w = 30,
    M = 1.5,
    D = 1350;
  const x = A * Math.cos(w * t),
    v = -w * A * Math.sin(w * t),
    a = -w * w * x;
  near(Math.abs(a), Math.abs((D / M) * x));
  near(0.5 * M * v * v + 0.5 * D * x * x, 0.5 * D * A * A);
}
for (const Rm of [0, 4, 80, 120]) {
  const u = { ...p, Rm },
    dt = 0.0001;
  const numeric = all.integrate(u, () => 0, dt, 10000);
  const max = Math.max(...numeric.map(([t, x]) => Math.abs(x - all.freeMotion(u, t))));
  assert.ok(max < 1e-8, `RK4/free solution ${Rm}: ${max}`);
}
for (const Rm of [0, 4, 30])
  for (const ratio of [0.92, 1, 1.2]) {
    const u = { ...p, Rm, ratio, F0: 2, x0: 0, v0: 0 },
      w = Math.sqrt(u.D / u.M),
      dt = 0.0001;
    const numeric = all.integrate(u, (t) => u.F0 * Math.cos(ratio * w * t), dt, 10000);
    const scale = Math.max(...numeric.map(([, x]) => Math.abs(x)));
    assert.ok(
      Math.max(...numeric.map(([t, x]) => Math.abs(x - all.forcedMotion(u, t).total))) / scale <
        0.001,
      "Forced transient analytic/RK4 relative error <0.1%",
    );
  }
const beating = { M: 5, D: 2000, Rm: 0, F0: 2, ratio: 0.92, x0: 0, v0: 0 };
const beatPeriod = (2 * Math.PI) / 1.6;
// Cancellation recurs at the beat-envelope zeros; the signal between them is nonzero.
near(all.forcedMotion(beating, beatPeriod).total, 0, 0.0001);
assert.ok(Math.abs(all.forcedMotion(beating, beatPeriod / 2 + 0.01).total) > 0.0001);
const damped = { ...beating, Rm: 40, ratio: 0.8 },
  dampedDecay = all.decay(damped);
const initialTransient = all.forcedMotion(damped, 0).transient;
assert.equal(all.forcedMotion(damped, 0).total, 0);
const tail = Array.from({ length: 501 }, (_, i) =>
  Math.abs(all.forcedMotion(damped, (8 + i / 500) / dampedDecay.delta).transient),
);
assert.ok(
  Math.max(...tail) < Math.abs(initialTransient) * 0.002,
  "Transient is negligible after 8 time constants",
);
for (const Q of [1.7, 5, 10]) {
  const u = { ...p, F0: 2, ratio: 1, Rm: Math.sqrt(p.M * p.D) / Q, x0: 0, v0: 0 };
  const c = all.decay(u),
    on = 8 * c.T,
    gap = 12 * c.T,
    dt = c.T / 1000;
  near(1 - Math.exp(-c.delta * c.transition), 0.95);
  const numeric = all.integrate(
    u,
    (t) => (t < 2 * (on + gap) && t % (on + gap) < on ? u.F0 * Math.sin(c.w0 * t) : 0),
    dt,
    40000,
  );
  const amplitude = (u.F0 * Q) / u.D;
  assert.ok(
    Math.max(...numeric.map(([t, x]) => Math.abs(x - all.pulseMotion(u, t, on, gap)))) / amplitude <
      0.001,
    "Switched pulse solution / independent RK4 <0.1%",
  );
}
for (const zeta of [1.01, 1.5, 2, 5]) {
  const u = { ...p, Rm: 2 * zeta * Math.sqrt(p.M * p.D) },
    w = Math.sqrt(u.D / u.M),
    d = zeta * w;
  const roots = [-d + Math.sqrt(d * d - w * w), -d - Math.sqrt(d * d - w * w)];
  assert.ok(roots.every((s) => s < 0));
  for (const [x0, v0] of [
    [0.005, 0],
    [0, 0.2],
    [0.005, -0.2],
  ]) {
    const xs = Array.from({ length: 5001 }, (_, i) =>
      all.freeMotion({ ...u, x0, v0 }, i * 0.001),
    ).filter((x) => Math.abs(x) > 1e-12);
    assert.ok(
      xs.slice(1).filter((x, i) => x * xs[i] < 0).length <= 1,
      "Overdamped response may cross zero at most once",
    );
  }
}
const references = {
  "1.1.1": [3.183098861837907, 0.006403124237432849],
  "1.1.2": [0.12, 3.6, 0.0108],
  "1.1.3": [300, 7.639320225002102],
  "1.1.4": [6.353751267, 0.4, 0.39346886],
  "1.1.5": [397.4921383, 19.87460691, 0.05031546054],
  "1.2.1": [3.926990817, 0.01],
  "1.2.2": [0.002538365414, 7.917858446],
  "1.2.3": [0.3014561, 0.9189974078],
  2.1: [418.3300133, 0.00155379719],
  2.2: [321.7923179, 130.8736],
  2.3: [5047.544651, 0.860333589, 691.128],
  2.4: [5000, 196.25],
};
near(all.stringSpeed(70, 0.0004), 418.330013267, 1e-10);
for (const alpha of [0.1, 0.3, 0.5, 0.9])
  for (let n = 1; n <= 12; n++) {
    const h = 0.004,
      N = 20000;
    let integral = 0;
    for (let i = 0; i < N; i++) {
      const r = (i + 0.5) / N,
        y = r < alpha ? (h * r) / alpha : (h * (1 - r)) / (1 - alpha);
      integral += (2 * y * Math.sin(n * Math.PI * r)) / N;
    }
    assert.ok(
      Math.abs(integral - all.pluckCoefficient(n, h, alpha)) < h * 1e-6,
      "Fourier coefficient / numerical quadrature",
    );
    if (alpha === 0.5 && n % 2 === 0)
      assert.ok(Math.abs(all.pluckCoefficient(n, h, alpha)) < 1e-16);
  }
for (let i = 0; i <= 20; i++) {
  const x = (i * 0.65) / 20,
    t = i * 0.00013,
    c = 418.330013267,
    L = 0.65,
    h = 0.004,
    a = 0.3;
  const standing = all.pluckWave(x, t, c, L, h, a),
    left = all.pluckWave(x, t, c, L, h, a, 12, 1),
    right = all.pluckWave(x, t, c, L, h, a, 12, -1);
  assert.ok(
    Math.abs(standing - left - right) < 1e-14,
    "Two traveling waves sum to the standing wave",
  );
}
for (const T of [20, 70, 180, 300])
  for (const mu of [0.0001, 0.0004, 0.005])
    for (const L of [0.3, 0.65, 1.5]) {
      const c = all.stringSpeed(T, mu);
      near(c * c, T / mu);
      for (let n = 1; n <= 6; n++)
        near(all.stringFrequency(n, c, L), (n * Math.sqrt(T / mu)) / (2 * L));
      const e = all.stringElement(T, L, 0.01);
      near(e.leftY, e.rightY);
      assert.ok(e.netY < 0);
    }
const source = JSON.parse(fs.readFileSync("src/topics.json", "utf8"));
const dampedLecture = lectures.find((l) => l.id === "1.1.4");
if (dampedLecture) {
  const zero = { ...dampedLecture.defaults, x0: 0, v0: 0 };
  const displacement = dampedLecture.figures[0].plot(zero, 0)[0],
    energy = dampedLecture.figures[1].plot(zero, 0)[0];
  assert.ok(displacement.series.every((s) => s.points.every(([, y]) => y === 0)));
  assert.equal(displacement.annotations.length, 0);
  assert.equal(energy.series.length, 0);
  assert.ok(energy.ylim[0] > 0 && energy.title.includes("0"));
}
const home = JSON.parse(fs.readFileSync("src/content/homeCatalog.json", "utf8"));
assert.deepEqual(
  home.topics,
  source.map(({ id, title, chapter }) => ({ id, title, chapter })),
  "Generated home catalog matches source",
);
assert.deepEqual(
  [...home.completed].sort(),
  fs
    .readdirSync("src/content/lectures")
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.slice(0, -3))
    .sort(),
);
const formulaNumbers = new Set(["1.2-1", "1.2-2", "1.2-3", "1.2-4", "1.2-5", "1.2-6", "1.2-7"]);
for (const l of lectures) {
  if (l.animation)
    for (const f of l.figures) {
      const at0 = f.plot(l.defaults, 0),
        later = f.plot(l.defaults, (l.animationPeriod?.(l.defaults) ?? 1) / 4);
      assert.deepEqual(
        at0.map((p) => [p.xlim, p.ylim]),
        later.map((p) => [p.xlim, p.ylim]),
        `${l.id}: animation axes fixed`,
      );
    }
  assert.deepEqual(
    l.questions.map((q) => q.text),
    source.find((t) => t.id === l.id).questions,
  );
  assert.ok(
    l.keyPoints.length >= 3 &&
      l.formulas.length >= 1 &&
      l.figures.length >= 1 &&
      l.examples.length >= 1,
  );
  for (const f of l.formulas) {
    assert.ok(!formulaNumbers.has(f.number), `Duplicate ${f.number}`);
    formulaNumbers.add(f.number);
  }
  for (const E of [3e9, 70e9, 200e9])
    for (const rho of [1180, 2700, 7850]) {
      near(all.rodSpeed(E, rho) ** 2, E / rho);
      for (const mass of [0.05, 0.785, 5]) {
        const qs = all.loadedRodRoots(rho, 0.0001, 1, mass, 3),
          alpha = (rho * 0.0001) / mass;
        qs.forEach((q, n) => {
          assert.ok(q > n * Math.PI && q < (n + 0.5) * Math.PI);
          near(q * Math.tan(q), alpha, 1e-9);
        });
      }
    }
  const light = all.loadedRodRoots(7850, 0.0001, 1, 1e-7)[0];
  near(light, Math.PI / 2, 1e-6);
  const heavy = all.loadedRodRoots(7850, 0.0001, 1, 1e6)[0];
  near(heavy, Math.sqrt(0.785 / 1e6), 1e-6);
  for (const L of [0.2, 1, 2])
    for (let n = 1; n <= 6; n++) {
      near(all.rodFrequency(n, 5000, L, "free-free"), (n * 2500) / L);
      near(all.rodFrequency(n, 5000, L, "fixed-free"), ((2 * n - 1) * 1250) / L);
    }
  near(all.rodFrequency(0, 5000, 1, "free-free"), 0);
  const steel = all.rodSpeed(200e9, 7850);
  near(all.rodFrequency(1, steel, 1, "free-free"), 2523.772325625, 1e-10);
  near(all.youngFromFrequency(2500, 1, 7850).c, 5000);
  near(all.youngFromFrequency(2500, 1, 7850).E, 196.25e9);
  for (const f of [500, 2500, 10000])
    for (const L of [0.2, 1, 2]) {
      const e = all.youngFromFrequency(f, L, 7850);
      near(all.rodFrequency(1, Math.sqrt(e.E / 7850), L, "free-free"), f);
    }
  const e = l.examples[0];
  assert.equal(e.hints.length, 2);
  assert.ok(references[l.id], `Independent reference values missing: ${l.id}`);
  e.asks.forEach((a, i) => near(a.calc(e.defaults), references[l.id][i], 0.0049));
  for (const config of [
    l.defaults,
    ...(l.boundaryEquations ?? []).map((_, boundary) => ({ ...l.defaults, boundary })),
    ...l.parameters.flatMap((d) => [
      { ...l.defaults, [d.key]: d.min },
      { ...l.defaults, [d.key]: d.max },
    ]),
  ]) {
    for (const f of l.figures)
      for (const panel of f.plot(config, 0)) {
        assert.ok(panel.xlim[0] < panel.xlim[1] && panel.ylim[0] < panel.ylim[1], f.number);
        const xt = all.axisTicks(panel.xlim, panel.xscale === "log"),
          yt = all.axisTicks(panel.ylim, panel.yscale === "log");
        near(xt.limits[0], xt.values[0]);
        near(xt.limits[1], xt.values.at(-1));
        near(yt.limits[0], yt.values[0]);
        near(yt.limits[1], yt.values.at(-1));
        for (const s of panel.series ?? []) {
          if (s.style === "none" && s.marker)
            for (const [x, y] of s.points) {
              assert.ok(
                x >= xt.limits[0] - 1e-12 &&
                  x <= xt.limits[1] + 1e-12 &&
                  y >= yt.limits[0] - 1e-12 &&
                  y <= yt.limits[1] + 1e-12,
                `${f.number}: marker inside axes`,
              );
            }
          // NaN breaks intentionally split analytic poles. Infinities are never plotted.
          assert.ok(
            s.points.every(([x, y]) =>
              Number.isFinite(x) && !Number.isFinite(y)
                ? Number.isNaN(y)
                : Number.isFinite(x) && Number.isFinite(y),
            ),
            `${f.number} ${s.name}`,
          );
          if (
            s.points.length > 100 &&
            s.style !== "none" &&
            s.kind !== "bar" &&
            !panel.xlabel.includes("实部")
          ) {
            const xs = s.points.map((p) => p[0]);
            near(Math.min(...xs), xt.limits[0], 0.01);
            near(Math.max(...xs), xt.limits[1], 0.01);
          }
        }
        assert.ok(!all.matlab([panel], 1, 1, f.title).includes("undefined"));
      }
  }
}
console.log(
  `PASS: P1 initial-value solutions, RK4, decay, ${lectures.length} lecture schemas, MOOC questions, independent exercise references and plot bounds.`,
);
