import { sample, type Panel, type Series, type Point } from "./types";
import { axisTicks } from "./ticks";
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
