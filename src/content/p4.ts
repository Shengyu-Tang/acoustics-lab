import type { Values, Ask } from "./p1";
import type { Panel } from "../plot/types";
import { graph, points, curve } from "./p2";
export { parameter, figure, ask, engineering } from "./p2";
export { makeLecture, comparison, lin, log } from "./p3";
export { fmt } from "./p1";
export { graph, points, curve };
export const water = { rho: 1000, c: 1500, f: 1000, a: 0.05, v: 0.01 };
export const substitution = (p: Values) =>
  Object.entries(p)
    .map(([k, v]) => `${k} = ${v}`)
    .join("，") + "（SI 单位）";
export function circle(p: Values, title = "振源表面的物理尺寸", maximum = 0.1): Panel {
  const q = graph(
    p,
    0,
    title,
    "位置 x (m)",
    "示意坐标 y (m)",
    [-maximum, maximum],
    [-maximum, maximum],
    [
      points(
        "球面截线",
        Array.from({ length: 181 }, (_, i) => [
          p.a * Math.cos((i * Math.PI) / 90),
          p.a * Math.sin((i * Math.PI) / 90),
        ]),
        "a*cos(linspace(0,2*pi,181))",
        "a*sin(linspace(0,2*pi,181))",
        { geometry: { key: "a", axis: "x" } },
      ),
    ],
    "",
    { equalAspect: true },
  );
  return q;
}
/** The figure author chooses the answer explicitly; no coordinate guessing. */
export function answer(panel: Panel, key: Ask["key"]) {
  return { ...panel, answerKey: key };
}
