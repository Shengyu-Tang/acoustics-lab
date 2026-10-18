import type { Values } from "../content/p1";
import { graph, type Curve } from "../content/p2";
import type { Panel } from "./types";
export function imagePanel(
  p: Values,
  t: number,
  title: string,
  domain: [number, number],
  vertical: [number, number],
  value: (x: number, y: number) => number,
  expression: string,
  setup: string,
  curves: Curve[] = [],
  limits?: [number, number],
  label = "声压 (Pa)",
  fieldLimits?: string,
): Panel {
  const x = Array.from({ length: 161 }, (_, i) => domain[0] + ((domain[1] - domain[0]) * i) / 160),
    y = Array.from({ length: 81 }, (_, i) => vertical[0] + ((vertical[1] - vertical[0]) * i) / 80);
  const mx = "linspace(" + domain.join(",") + ",161)",
    my = "linspace(" + vertical.join(",") + ",81)";
  const z = y.map((y) => x.map((x) => value(x, y)));
  const extent =
    limits ??
    ([-Math.max(...z.flat().map(Math.abs)), Math.max(...z.flat().map(Math.abs))] as [
      number,
      number,
    ]);
  return graph(
    p,
    t,
    title,
    "位置 x (m)",
    "示意坐标 y (m)",
    domain,
    vertical,
    curves,
    setup + ";[XX,YY]=meshgrid(" + mx + "," + my + ");ZZ=" + expression + ";",
    { field: { x, y, z, limits: extent, map: "RdBu", label }, equalAspect: true, legend: false },
    { field: { x: mx, y: my, z: "ZZ" }, fieldLimits },
  );
}
