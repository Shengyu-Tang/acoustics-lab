import fs from "node:fs";
import { build, stop } from "esbuild";
fs.mkdirSync("outputs", { recursive: true });
const files = fs.readdirSync("src/content/lectures").filter((f) => /^[123]\./.test(f));
await build({
  stdin: {
    contents:
      files
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("\n") + "export {instrument} from './src/physics/chapter1';",
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
          defaults: mod.instrument,
          parameters: l.figures[0].parameters,
          figures: l.figures.map((f) => ({ ...f, plot: (p) => f.plot(p, false) })),
        },
  );
// Compare actual ordinates/abscissae, fields and numeric annotations. Axis bounds,
// titles, MATLAB source and readout tables cannot conceal an invariant drawing.
function numbers(p) {
  return [
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
          const baseline = f.plot(context, t).flatMap(numbers);
          for (const v of values)
            if (changed(baseline, f.plot({ ...context, [d.key]: v }, t).flatMap(numbers)))
              sensitive = true;
        }
      lectureSensitive ||= sensitive;
    }
    if (!lectureSensitive)
      failures.push(`${l.id} -- ${d.key}: invariant plotted data in every figure`);
    // Spatial geometry must change at t=0, independently of motion or readouts.
    if (d.unit === "m" && /^(L|a|d|r|radius|length)$/.test(d.key)) {
      const spatial = l.figures
        .flatMap((f) => f.plot(l.defaults, 0).map((p, i) => ({ f, i, p })))
        .filter(
          ({ p }) => /位置|距离|轴向|径向|空间|坐标/.test(p.xlabel) && !/^时间/.test(p.xlabel),
        );
      for (const { f, i, p } of spatial) {
        if (f.independentOf?.includes(d.key)) continue;
        const ranges = values.map((v) => {
          const q = f.plot({ ...l.defaults, [d.key]: v }, 0)[i];
          return [
            ...(q.series ?? []).flatMap((s) => s.points.map((pt) => pt[0])),
            ...(q.field?.x ?? []),
          ];
        });
        if (!changed(ranges[0], ranges[1]))
          failures.push(`${l.id} — ${d.key} — ${f.number}[${i}]: invariant geometry`);
      }
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
