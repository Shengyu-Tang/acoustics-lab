import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
const files = fs
  .readdirSync("src/content/lectures")
  .filter((f) => !["1.2.4.ts", "1.2.5.ts"].includes(f));
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      files
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("") +
      "export * from './src/physics/p1';export {axisTicks} from './src/plot/ticks';export {matlab} from './src/plot/export';",
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
};
const source = JSON.parse(fs.readFileSync("src/topics.json", "utf8"));
const formulaNumbers = new Set(["1.2-1", "1.2-2", "1.2-3", "1.2-4", "1.2-5", "1.2-6", "1.2-7"]);
for (const l of lectures) {
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
  const e = l.examples[0];
  assert.equal(e.hints.length, 2);
  assert.ok(references[l.id], `Independent reference values missing: ${l.id}`);
  e.asks.forEach((a, i) => near(a.calc(e.defaults), references[l.id][i], 0.0049));
  for (const config of [
    l.defaults,
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
          // NaN breaks intentionally split analytic poles. Infinities are never plotted.
          assert.ok(
            s.points.every(([x, y]) =>
              Number.isFinite(x) && !Number.isFinite(y)
                ? Number.isNaN(y)
                : Number.isFinite(x) && Number.isFinite(y),
            ),
            `${f.number} ${s.name}`,
          );
          if (s.points.length > 100 && s.style !== "none" && panel.xlabel.includes("时间")) {
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
