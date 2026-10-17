import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      "export * from './src/physics/chapter1';export * from './src/plot/chapter1Figures';export {csv,matlab} from './src/plot/export';export {default as lecture124} from './src/content/lectures/1.2.4';export {default as lecture125} from './src/content/lectures/1.2.5';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/p0-check.mjs",
});
const {
  characteristics,
  response,
  instantaneous,
  instrument,
  instrumentSolution,
  grade,
  frequencyPanels,
  impedancePanel,
  instantaneousPanels,
  powerPanel,
  instrumentPanel,
  csv,
  matlab,
  lecture124,
  lecture125,
} = await import("../outputs/p0-check.mjs");
const near = (a, b, t = 0.005) =>
  assert.ok(Math.abs(a - b) <= t * Math.max(Math.abs(b), 1e-12), `${a} ≠ ${b}`);
// Independent peak search catches phase/frequency factors that analytic readouts alone miss.
for (const Q of [1.7, 5, 10, 24.84325864]) {
  const p = { ...instrument, Rm: Math.sqrt(instrument.D * instrument.M) / Q },
    c = characteristics(p);
  for (const [key, f] of [
    ["x", c.fx],
    ["v", c.fv],
    ["a", c.fa],
  ]) {
    const grid = Array.from({ length: 40001 }, (_, i) => c.f0 * (0.1 + (2 * i) / 40000));
    const found = grid.reduce(
      (best, f) => (response(p, f)[key] > response(p, best)[key] ? f : best),
      grid[0],
    );
    near(found, f, 0.0002);
  }
  // Locate half-power crossings numerically rather than substituting returned f1/f2.
  const half = response(p, c.f0).power / 2;
  function root(lo, hi) {
    for (let i = 0; i < 65; i++) {
      const mid = (lo + hi) / 2;
      if ((response(p, lo).power - half) * (response(p, mid).power - half) <= 0) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  }
  near(root(c.f0, c.f0 * 10) - root(0, c.f0), c.f0 / Q, 1e-10);
  near(c.f1 * c.f2, c.f0 * c.f0, 1e-12);
  for (const ratio of [0.8, 1, 1.2]) {
    const f = c.f0 * ratio,
      N = 20000;
    let input = 0,
      dissipation = 0;
    for (let i = 0; i < N; i++) {
      const r = instantaneous(p, f, (i + 0.5) / (f * N));
      input += r.input / N;
      dissipation += r.dissipation / N;
    }
    near(input, response(p, f).power, 1e-10);
    near(input, dissipation, 1e-10);
    const r = response(p, f);
    near(
      p.Rm * r.v * Math.cos(r.pv) -
        (2 * Math.PI * f * p.M - p.D / (2 * Math.PI * f)) * r.v * Math.sin(r.pv),
      p.F0,
      1e-10,
    );
  }
}
const s = instrumentSolution(instrument);
for (const [key, value] of Object.entries({
  omega0: 198.7,
  f0: 31.63,
  Qm: 24.8,
  bandwidth: 1.27,
  xMm: 3.14,
  minimumRm: 251,
  improvedMm: 0.63,
  reactance: 4.43,
  transition: 0.75,
}))
  near(s[key], value);
near(instrumentSolution({ ...instrument, Rm: s.minimumRm }).xMm, instrument.limit, 1e-12);
assert.ok(!s.safe && s.inBand);
assert.ok(instrumentSolution({ ...instrument, Rm: 400 }).safe);
assert.equal(
  characteristics({ ...instrument, Rm: 2 * Math.sqrt(instrument.M * instrument.D) }).fx,
  null,
);
assert.equal(
  characteristics({ ...instrument, Rm: 2 * Math.sqrt(instrument.M * instrument.D) }).fa,
  null,
);
assert.equal(response(instrument, 0).x, instrument.F0 / instrument.D);
assert.equal(grade(31.63, s.f0), "正确");
assert.equal(grade(40, s.f0), "偏大");
assert.equal(grade(20, s.f0), "偏小");
assert.equal(grade(3163, s.f0), "量级错误");
assert.equal(grade(NaN, s.f0), "请输入有限数值");
const panels = [
  ...frequencyPanels(instrument, false),
  ...frequencyPanels(instrument, true),
  impedancePanel(instrument),
  ...instantaneousPanels(instrument),
  powerPanel(instrument),
  instrumentPanel(instrument),
];
for (const p of panels) {
  assert.ok(p.xlim[1] > p.xlim[0] && p.ylim[1] > p.ylim[0]);
  for (const s of p.series ?? [])
    for (const point of s.points) assert.ok(point.every(Number.isFinite));
}
const exported = matlab(panels, Math.ceil(panels.length / 3), 3, "P0 current parameters");
assert.ok(exported.includes("subplot("));
assert.ok(exported.includes("xline("));
assert.ok(exported.includes("yline("));
assert.ok(!exported.includes("undefined"));
const records = csv([powerPanel(instrument)]).split("\r\n");
assert.ok(records.some((r) => r.includes(String(s.f1))));
assert.ok(records.some((r) => r.includes(String(s.f2))));
const original = JSON.parse(fs.readFileSync("src/topics.json", "utf8"));
for (const l of [lecture124, lecture125]) {
  assert.deepEqual(
    l.questions.map((q) => q.text),
    original.find((t) => t.id === l.id).questions,
  );
  assert.equal(l.figures.length, 2);
  assert.ok(l.keyPoints.length >= 3 && l.formulas.length >= 3 && l.examples.length);
}
console.log(
  "PASS: P0 peak search, numerical half-power bandwidth, cycle-averaged energy balance, Sample A (<0.5%), grading, finite plot data, exports and original MOOC questions.",
);
