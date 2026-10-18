import { graph, curve, points, type Curve } from "../content/p2";
import type { Values } from "../content/p1";
import type { Panel, Series } from "./types";
import { amplitudeLimits, geometryY } from "./fixedAxes";
import { fmt } from "../content/p1";
import { axisTicks } from "./ticks";
import { sample } from "./types";

// Drawing primitives only. Each caller chooses the situation, physical domain,
// fields, observation points and analytic MATLAB expressions independently.
export const grid = "linspace(qaDomain(1),qaDomain(2),401)";
export const line = (
  name: string,
  fn: (x: number) => number,
  domain: [number, number],
  expression: string,
  style: Series["style"] = "-",
) => ({ ...curve(name, fn, domain, grid, expression, style), evaluate: fn });
export const dot = (
  name: string,
  x: number,
  y: number,
  mx: string,
  my: string,
  extra: Partial<Series> = {},
) => points(name, [[x, y]], mx, my, { marker: "o", style: "none", ...extra });
export const xmark = (value: number, label: string) => ({ axis: "x" as const, value, label });
export const ymark = (value: number, label: string) => ({ axis: "y" as const, value, label });
export const value = (symbol: string, n: number, unit = "") =>
  `${symbol} = ${fmt(n)}${unit ? " " + unit : ""}`;
export function physical(
  p: Values,
  title: string,
  xlabel: string,
  ylabel: string,
  domain: [number, number],
  domainExpression: string,
  series: Curve[],
  setup = "",
  extra: Partial<Panel> = {},
  model: Partial<NonNullable<Panel["matlabModel"]>> = {},
): Panel {
  // Continuous situation curves fill the same nice domain used by the axes.
  // Observation markers and finite geometry retain their own coordinates.
  const exactXLimits = domain[0] > 0 && series.some((s) => s.evaluate && s.mx === grid);
  const displayDomain = exactXLimits ? domain : axisTicks(domain, extra.xscale === "log").limits;
  series = series.map((s) =>
    s.evaluate && s.mx === grid ? { ...s, points: sample(s.evaluate, ...displayDomain, 401) } : s,
  );
  const q = graph(
    p,
    0,
    title,
    xlabel,
    ylabel,
    displayDomain,
    [0, 1],
    series,
    setup +
      `;qaDomain=${exactXLimits ? domainExpression : `qaAxisLimits(${domainExpression},${extra.xscale === "log" ? 1 : 0})`};`,
    { ...extra, exactXLimits },
    { xlim: "qaDomain", ...model },
  );
  if (!geometryY(q) && !q.equalAspect && !q.field)
    q.ylim = amplitudeLimits(
      series.filter((s) => s.axis !== "right").flatMap((s) => s.points.map((pt) => pt[1])),
      series.some((s) => s.kind === "bar"),
      q.yscale === "log",
    );
  if (q.rightLabel)
    q.rightLim = amplitudeLimits(
      series.filter((s) => s.axis === "right").flatMap((s) => s.points.map((pt) => pt[1])),
    );
  q.matlabModel!.amplitudeAxes = !geometryY(q) && !q.equalAspect && !q.field;
  q.matlabModel!.amplitudeMarkers = true;
  q.matlabModel!.ylim = q.matlabModel!.amplitudeAxes ? undefined : q.matlabModel!.ylim;
  return q;
}
