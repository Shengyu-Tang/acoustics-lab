import fs from "node:fs";
import { lectures } from "./check-parameter-sensitivity.mjs";
const failures = [];
for (const l of lectures)
  for (const f of l.figures) {
    const axes = (panels) => panels.map((p) => [p.xlim, p.ylim, p.rightLim, p.field?.limits]);
    const baseline = JSON.stringify(axes(f.plot(l.defaults, 0)));
    for (const d of l.parameters)
      for (const v of [d.min, d.max])
        for (const t of [0, (l.animationPeriod?.(l.defaults) ?? 1) / 7]) {
          const next = JSON.stringify(axes(f.plot({ ...l.defaults, [d.key]: v }, t)));
          if (next !== baseline)
            failures.push(`${l.id} -- ${d.key}=${v} -- ${f.number}: axes changed`);
        }
  }
// Resonance lies inside the frequency-ratio range, not at a slider corner.
// Test the strongest drive/weakest spring jointly with that critical point.
for (const l of lectures.filter((l) => ["1.2.1", "1.2.2", "1.2.3"].includes(l.id))) {
  const p = { ...l.defaults, ratio: 1 };
  for (const d of l.parameters)
    if (["M", "D"].includes(d.key)) p[d.key] = d.min;
    else if (["F0", "Qm"].includes(d.key)) p[d.key] = d.max;
  for (const f of l.figures)
    for (const panel of f.plot(p, 0))
      for (const series of panel.series ?? [])
        for (const [x, y] of series.points) {
          if (
            Number.isFinite(y) &&
            x >= panel.xlim[0] &&
            x <= panel.xlim[1] &&
            (y < panel.ylim[0] - 1e-9 || y > panel.ylim[1] + 1e-9)
          ) {
            failures.push(`${f.number}: resonant response exceeds fixed vertical envelope`);
            break;
          }
        }
}
fs.writeFileSync("outputs/fixed-axes.json", JSON.stringify({ failures }, null, 2));
if (failures.length) {
  console.error(`FAIL: ${failures.length} axis changes\n${failures.join("\n")}`);
  process.exitCode = 1;
} else console.log("PASS: fixed x/y/right/colour axes for every parameter and animation snapshot");
