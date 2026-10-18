import type { Values, Ask, P1Lecture } from "./p1";
import type { Panel } from "../plot/types";
import { fixedFigureAxes } from "../plot/fixedAxes";
import { axisTicks } from "../plot/ticks";
import {
  p2Lecture,
  parameter,
  params,
  graph,
  curve,
  points,
  figure,
  example,
  ask,
  engineering,
} from "./p2";
export { parameter, params, graph, curve, points, figure, example, ask, engineering };
/** Sweep around a nonzero engineering condition; singular zero limits are excluded. */
export function answerCurve(
  p: Values,
  key: string,
  label: string,
  unit: string,
  fn: (p: Values) => number,
  expr: string,
): Panel {
  const [a, b] = axisTicks([
    p[key] === 0 ? -0.5 : Math.min(0.9 * p[key], 1.1 * p[key]),
    p[key] === 0 ? 0.5 : Math.max(0.9 * p[key], 1.1 * p[key]),
  ]).limits;
  const ys = lin(a, b)
    .map((x) => fn({ ...p, [key]: x }))
    .filter(Number.isFinite);
  const panel = graph(
    p,
    0,
    "计算量随已知条件变化",
    `${label} (${unit})`,
    "计算结果（见题目单位）",
    [a, b],
    [Math.min(0, ...ys), Math.max(1e-12, ...ys) * 1.15],
    [
      curve(
        "参考计算",
        (x) => fn({ ...p, [key]: x }),
        [a, b],
        "linspace(qaRange(1),qaRange(2),401)",
        expr,
      ),
      points("本题数值", [[p[key], fn(p)]], key, expr.replace(/\bx\b/g, key), {
        marker: "o",
        style: "none",
      }),
    ],
    `qaRange=sort([.9*${key} 1.1*${key}]);if ${key}==0,qaRange=[-.5 .5];end;qaRange=p2NiceLimits(qaRange(1),qaRange(2));`,
    {},
    { xlim: "qaRange", ylim: "[min(0,min(model_y{1,1})) max(1e-12,max(model_y{1,1}))*1.15]" },
  );
  return fixedFigureAxes("P3-E", [panel])[0];
}
export const lin = (a: number, b: number, n = 401) =>
  Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
export const log = (a: number, b: number, n = 401) =>
  lin(Math.log10(a), Math.log10(b), n).map((x) => 10 ** x);
export const Z1 = parameter("Z1", "入射介质阻抗", "Z₁", "Pa·s/m", 100, 5e7, 10);
export const Z2 = parameter("Z2", "透射介质阻抗", "Z₂", "Pa·s/m", 100, 5e7, 10);
export const c2 = parameter("c2", "透射介质声速", "c₂", "m/s", 200, 6000, 1);
export const theta = parameter("theta", "入射角", "θᵢ", "°", 0, 89, 0.1);
export const normalDefaults = {
  rho: 1000,
  c: 1500,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1.5e6,
  Z2: 415,
  theta: 30,
};
export const normalSetup = "Rp=(Z2-Z1)/(Z2+Z1);Dp=2*Z2/(Z2+Z1);";
export const obSetup = "[RR,DD,CT]=p3Oblique(Z1,Z2,c,c2,theta);";
export function comparison(f: ReturnType<typeof figure>, keys: string[], reason: string) {
  return { ...f, independentOf: keys, dimensionlessComparison: reason };
}
export function makeLecture(
  id: string,
  data: Omit<Parameters<typeof p2Lecture>[1], "readouts" | "readoutModel" | "examples"> & {
    exampleTitle: string;
    background: string;
    exampleDefaults: Values;
    given: P1Lecture["parameters"];
    asks: Ask[];
    measurements?: { name: string; unit: string; matlab: string; calc: (p: Values) => number }[];
    judgment: string | ((p: Values) => string);
    examplePlot: (p: Values) => Panel;
  },
): P1Lecture {
  const {
    exampleTitle,
    background,
    exampleDefaults,
    given,
    asks,
    measurements,
    judgment,
    examplePlot,
    ...rest
  } = data;
  return p2Lecture(id, {
    ...rest,
    readouts: (p) =>
      measurements
        ? measurements.map((a) => [a.name, a.calc(p), a.unit])
        : asks.map((a) => [a.text.replace(/^\(\d+\)\s*/, ""), a.calc(p), a.unit]),
    readoutModel: `[${(measurements ?? asks).map((a) => a.matlab).join(" ")}]`,
    figures: rest.figures.map((f) => ({
      ...f,
      plot: (p, t) =>
        f.plot(p, t).map((panel) => {
          // Readout expressions may depend on earlier answers; use the same sequence as the worksheet.
          panel.matlabModel!.setup += "\n" + asks.map((a) => `${a.key}=${a.matlab};`).join("\n");
          return panel;
        }),
    })),
    examples: [
      example(
        exampleTitle,
        background,
        exampleDefaults,
        given,
        asks,
        typeof judgment === "function" ? judgment : () => judgment,
        examplePlot,
      ),
    ],
  });
}
