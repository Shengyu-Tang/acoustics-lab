import { sample, type Panel, type Series, type Point } from "./types";
import { axisTicks } from "./ticks";
import { endCompliance, quarterFrequency } from "../physics/chapter2";
export const extent = (duration: number) => axisTicks([0, duration]).limits[1];
export function panel(
  title: string,
  xlabel: string,
  ylabel: string,
  xlim: [number, number],
  ylim: [number, number],
  series: Series[],
): Panel {
  return { title, xlabel, ylabel, xlim, ylim, series };
}
export const line = (
  name: string,
  fn: (x: number) => number,
  end: number,
  style: Series["style"] = "-",
  n = 1601,
): Series => ({ name, points: sample(fn, 0, end, n), style });
export function working(p: Panel, x: number, y: number): Panel {
  return {
    ...p,
    series: [
      ...(p.series ?? []),
      { name: "当前工作点", points: [[x, y]], style: "none", marker: "o", color: "#A2142F" },
    ],
  };
}
export const segment = (name: string, points: Point[], style: Series["style"] = "-"): Series => ({
  name,
  points,
  style,
});
export function arrow(name: string, from: Point, to: Point, yPerX = 1): Series {
  const dx = to[0] - from[0],
    dy = (to[1] - from[1]) / yPerX,
    h = 0.15;
  return segment(name, [
    from,
    to,
    [to[0] - h * dx + (h * dy) / 2, to[1] - (h * dy + (h * dx) / 2) * yPerX],
    to,
    [to[0] - h * dx - (h * dy) / 2, to[1] - (h * dy - (h * dx) / 2) * yPerX],
  ]);
}
export function endSeries(F: number, L: number, rigidity: number, c: number, end: number): Series {
  const fs = sample((x) => x, 0, end, 6001).map(([x]) => x);
  for (let n = 1; quarterFrequency(n, c, L) <= end; n++) {
    const f = quarterFrequency(n, c, L);
    fs.push(f * (1 - 1e-6), f, f * (1 + 1e-6));
  }
  return {
    name: "端点位移幅值",
    points: fs
      .sort((a, b) => a - b)
      .map((f) => {
        const y = F * endCompliance(f, c, L, rigidity);
        return [f, Number.isFinite(y) ? y : NaN];
      }),
  };
}
