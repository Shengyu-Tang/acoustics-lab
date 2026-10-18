import fs from "node:fs";
import { build, stop } from "esbuild";
fs.mkdirSync("outputs", { recursive: true });
const files = fs.readdirSync("src/content/lectures").filter((f) => /^[123]\./.test(f));
await build({
  stdin: {
    contents:
      files
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("\n") +
      "export {instrument} from './src/physics/chapter1';export {axisTicks} from './src/plot/ticks';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/sensitivity-bundle.mjs",
});
stop();
const mod = await import("../outputs/sensitivity-bundle.mjs");
export const lectures = files
  .map((_, i) => mod[`l${i}`])
  .map((l) =>
    l.defaults
      ? l
      : {
          ...l,
          defaults: { ...mod.instrument, Rm: 400 },
          parameters: l.figures[0].parameters,
          figures: l.figures.map((f) => ({ ...f, plot: (p) => f.plot(p, false) })),
        },
  );
// Compare actual ordinates/abscissae, fields and numeric annotations. Axis bounds,
// Amplitude sliders may preserve curve pixels after rescaling: visible tick
// values and readouts are part of the sensitivity contract too.
function numbers(p, amplitude = false) {
  return [
    ...(amplitude
      ? [
          ...mod.axisTicks(p.ylim, p.yscale === "log").values,
          mod.axisTicks(p.ylim, p.yscale === "log").exponent,
          ...(p.rightLim ? mod.axisTicks(p.rightLim, p.yscale === "log").values : []),
        ]
      : []),
    ...(p.series ?? []).flatMap((s) => s.points.flat()),
    ...(p.field ? [...p.field.x, ...p.field.y, ...p.field.z.flat()] : []),
    ...(p.annotations ?? []).map((a) => a.value),
    ...(p.textLabels ?? []).flatMap((a) => [a.x, a.y]),
  ];
}
function changed(a, b) {
  if (a.length !== b.length) return true;
  return a.some(
    (v, i) =>
      Number.isFinite(v) &&
      Number.isFinite(b[i]) &&
      Math.abs(v - b[i]) > 0.01 * Math.max(Math.abs(v), Math.abs(b[i]), 1e-12),
  );
}
const failures = [],
  exemptions = [];
for (const l of lectures) {
  const times = [0, (l.animationPeriod?.(l.defaults) ?? 1) / 7];
  for (const d of l.parameters) {
    const amplitude = /^(A|pa|B|F0|x0|v0|height|xi|velocity|pRms|power|intensity|a\d+)$/.test(
      d.key,
    );
    const values = [d.min, d.max];
    let lectureSensitive = false;
    for (const f of l.figures) {
      if (f.independentOf?.includes(d.key)) {
        if (!f.dimensionlessComparison)
          throw new Error("independentOf requires an explained dimensionless comparison");
        exemptions.push(`${l.id} ${f.number} — ${d.key}`);
        continue;
      }
      let sensitive = false;
      const contexts = [
        l.defaults,
        ...l.parameters
          .filter((q) => q.integer)
          .flatMap((q) => [q.min, q.max].map((v) => ({ ...l.defaults, [q.key]: v }))),
        ...(l.interactive?.toggles ?? []).map((q) => ({
          ...l.defaults,
          [q.key]: 1 - l.defaults[q.key],
        })),
        ...(l.interactive?.selectors ?? []).flatMap((q) =>
          q.options.map((_, i) => ({ ...l.defaults, [q.key]: i })),
        ),
        ...(l.id === "2.1" ? [{ ...l.defaults, boundary: 1 }] : []),
      ];
      for (const context of contexts)
        for (const t of times) {
          const plotted = (p) => [
            ...f.plot(p, t).flatMap((panel) => numbers(panel, amplitude)),
            ...(amplitude ? (l.readouts?.(p) ?? []).map((r) => r[1]) : []),
          ];
          const baseline = plotted(context);
          for (const v of values)
            if (changed(baseline, plotted({ ...context, [d.key]: v }))) sensitive = true;
        }
      lectureSensitive ||= sensitive;
    }
    if (!lectureSensitive)
      failures.push(`${l.id} -- ${d.key}: invariant plotted data in every figure`);
    // Test marked geometric series directly. A moving arrow cannot conceal
    // a string whose endpoints stay at normalized 0 and 1.
    if (d.geometry || (d.unit === "m" && /^(L|a|d|r|radius|length)$/.test(d.key))) {
      let checked = 0;
      for (const f of l.figures) {
        const base = f.plot(l.defaults, 0);
        base.forEach((panel, i) =>
          (panel.series ?? []).forEach((series, j) => {
            if (series.geometry?.key !== d.key) return;
            checked++;
            const axis = series.geometry.axis === "x" ? 0 : 1;
            const spans = values.map((v) => {
              const points = f
                .plot({ ...l.defaults, [d.key]: v }, 0)
                [i].series[j].points.map((pt) => pt[axis]);
              return Math.max(...points) - Math.min(...points);
            });
            if (!changed([spans[0]], [spans[1]]))
              failures.push(`${l.id} -- ${d.key} -- ${f.number}[${i}]: invariant geometry`);
            const label = axis === 0 ? panel.xlabel : panel.ylabel;
            if (!label.includes("(m)"))
              failures.push(`${l.id} -- ${d.key} -- ${f.number}: geometric axis lacks metres`);
          }),
        );
      }
      if (!checked) failures.push(`${l.id} -- ${d.key}: missing geometric series contract`);
    }
  }
}
fs.writeFileSync(
  "outputs/parameter-sensitivity.json",
  JSON.stringify({ failures, exemptions }, null, 2),
);
console.log(
  exemptions.length
    ? `Declared dimensionless comparisons (${exemptions.length}):\n${exemptions.join("\n")}`
    : "No independentOf declarations",
);
if (failures.length) {
  console.error(`FAIL: ${failures.length} parameter/figure problems\n${failures.join("\n")}`);
  process.exitCode = 1;
} else
  console.log(`PASS: parameter sensitivity and geometry across ${lectures.length} P1/P2 lectures`);
