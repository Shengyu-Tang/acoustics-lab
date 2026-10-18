import fs from "node:fs";
import { lectures } from "./check-parameter-sensitivity.mjs";
const { axisTicks } = await import("../outputs/sensitivity-bundle.mjs");
// Position/time domains stay fixed. Amplitudes follow current parameters and
// remain stable throughout an animation cycle, including field colour limits.
const failures = [],
  measurements = [];
const geometryY = (p) =>
  /截面坐标|Cross-section|投影|projection/.test(p.ylabel) ||
  p.series?.some((s) => s.geometry?.axis === "y");
for (const l of lectures) {
  const states = [
    { name: "default", p: l.defaults },
    ...l.parameters.flatMap((d) =>
      [d.min, d.max].map((v) => ({ name: `${d.key}=${v}`, p: { ...l.defaults, [d.key]: v } })),
    ),
  ];
  for (const f of l.figures) {
    const base = f.plot(l.defaults, 0);
    for (const { name, p } of states) {
      const period = l.animationPeriod?.(p) ?? 1;
      const frames = (l.animation ? [0, 1 / 7, 1 / 4, 1 / 2, 3 / 4] : [0]).map((phase) =>
        f.plot(p, phase * period),
      );
      frames[0].forEach((panel, i) => {
        const label = `${f.number}[${i + 1}] ${name}`;
        if (JSON.stringify(panel.xlim) !== JSON.stringify(base[i].xlim))
          failures.push(`${label}: position/time x axis changed`);
        if (geometryY(panel) && JSON.stringify(panel.ylim) !== JSON.stringify(base[i].ylim))
          failures.push(`${label}: geometry y axis changed`);
        for (const frame of frames)
          if (
            JSON.stringify([frame[i].ylim, frame[i].rightLim, frame[i].field?.limits]) !==
            JSON.stringify([panel.ylim, panel.rightLim, panel.field?.limits])
          )
            failures.push(`${label}: amplitude axis changes during animation`);
        if (geometryY(panel) || panel.field || panel.kind === "polar") return;
        for (const side of ["left", "right"]) {
          const series = frames.flatMap((frame) =>
            (frame[i].series ?? []).filter(
              (s) => (s.axis ?? "left") === side && s.style !== "none",
            ),
          );
          if (!series.length) continue;
          const limits = axisTicks(
            side === "left" ? panel.ylim : panel.rightLim,
            panel.yscale === "log",
          ).limits;
          const ys = series.flatMap((s) =>
            s.points
              .filter(([x, y]) => x >= panel.xlim[0] && x <= panel.xlim[1] && Number.isFinite(y))
              .map((pt) => pt[1]),
          );
          if (!ys.length) continue;
          const bars = series.some((s) => s.kind === "bar"),
            lo = Math.min(...ys),
            hi = Math.max(...ys);
          if (bars && (limits[0] !== 0 || lo < 0 || hi > limits[1] * (1 + 1e-9)))
            failures.push(
              `${label} ${side}: bars clipped or axis does not start at zero (${lo}…${hi}, ${limits})`,
            );
          // Zero curves have no amplitude; logarithmic/singular equations have
          // separate finite-rendering checks.
          if (panel.yscale === "log" || Math.abs(hi - lo) < 1e-14) continue;
          const occupancy =
            (Math.min(hi, limits[1]) - Math.max(lo, limits[0])) / (limits[1] - limits[0]);
          measurements.push({
            figure: f.number,
            panel: i + 1,
            state: name,
            side,
            occupancy,
            limits,
          });
          if (!bars && occupancy < 0.4 - 1e-9)
            failures.push(
              `${label} ${side}: line occupancy ${(100 * occupancy).toFixed(2)}% < 40%`,
            );
        }
      });
    }
  }
}
for (const l of lectures.filter((l) => ["3.1.4", "3.3.2"].includes(l.id))) {
  const panel = l.figures[0].plot(l.defaults, 0)[0];
  const ys = panel.series.filter((s) => s.geometry).flatMap((s) => s.points.map((pt) => pt[1]));
  if ((Math.max(...ys) - Math.min(...ys)) / (panel.ylim[1] - panel.ylim[0]) < 0.4)
    failures.push(`${l.figures[0].number}: default control volume occupies <40% vertically`);
}
const rod = lectures.find((l) => l.id === "2.3");
const rodPanel = rod.figures[0].plot(rod.defaults, 0)[0];
const force = rodPanel.series.find((s) => s.name.startsWith("轴向合力"));
const arrowWidth =
  Math.abs(force.points[1][0] - force.points[0][0]) / (rodPanel.xlim[1] - rodPanel.xlim[0]);
if (arrowWidth < 0.025)
  failures.push("2.3-1: default axial resultant arrow is a floating dot (<2.5% width)");
fs.writeFileSync("outputs/fixed-axes.json", JSON.stringify({ failures, measurements }, null, 2));
if (failures.length) {
  console.error(`FAIL: ${failures.length} axis/readability problems\n${failures.join("\n")}`);
  process.exitCode = 1;
} else
  console.log(
    "PASS: fixed position/time axes, current-parameter cycle envelopes, readable lines and unclipped bars",
  );
