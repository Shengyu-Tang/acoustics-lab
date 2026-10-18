import { graph, points, curve } from "../content/p2";
import type { Values } from "../content/p1";
import type { Point } from "./types";

/** Shared line geometry for SVG, CSV and the independently runnable MATLAB export. */
export function forceVoltageCircuit(p: Values) {
  const line = (name: string, data: Point[]) =>
    points(
      name,
      data,
      `[${data.map((q) => q[0]).join(" ")}]`,
      `[${data.map((q) => q[1]).join(" ")}]`,
      { color: "#1a1a1a", legend: false },
    );
  return graph(
    p,
    0,
    "力—电压类比：F 驱动串联机械与辐射负载",
    "",
    "示意坐标",
    [0, 12],
    [0, 4],
    [
      line("闭合回路", [
        [1, 2.5],
        [1, 3],
        [2, 3],
      ]),
      curve(
        "F 源",
        (t) => 1.9 + 0.6 * Math.sin(t),
        [0, 2 * Math.PI],
        "linspace(0,2*pi,101)",
        "1.9+.6*sin(x)",
        "-",
        101,
      ),
      line("回线", [
        [1, 1.3],
        [1, 0.8],
        [11, 0.8],
        [11, 3],
        [10.4, 3],
      ]),
      line("源与质量连线", [
        [2, 3],
        [2.4, 3],
      ]),
      line(
        "质量电感 M",
        Array.from(
          { length: 81 },
          (_, i) =>
            [2.4 + (1.6 * i) / 80, 3 + 0.35 * Math.abs(Math.sin((4 * Math.PI * i) / 80))] as Point,
        ),
      ),
      line("质量与柔度连线", [
        [4, 3],
        [4.8, 3],
      ]),
      line("柔度左极板", [
        [4.8, 2.55],
        [4.8, 3.45],
      ]),
      line("柔度右极板", [
        [5.05, 2.55],
        [5.05, 3.45],
      ]),
      line("柔度与力阻连线", [
        [5.05, 3],
        [5.9, 3],
      ]),
      line("内部力阻", [
        [5.9, 3],
        [6.1, 3.3],
        [6.4, 2.7],
        [6.7, 3.3],
        [7, 2.7],
        [7.3, 3.3],
        [7.5, 3],
      ]),
      line("力阻与负载连线", [
        [7.5, 3],
        [8.4, 3],
      ]),
      line("辐射负载", [
        [8.4, 3],
        [8.4, 3.4],
        [10.4, 3.4],
        [10.4, 2.6],
        [8.4, 2.6],
        [8.4, 3],
      ]),
      line("振速方向", [
        [3.5, 1.4],
        [5, 1.4],
        [4.8, 1.55],
        [5, 1.4],
        [4.8, 1.25],
      ]),
    ].map((s, i) =>
      i === 1
        ? {
            ...s,
            points: s.points.map(([t, y]) => [1 + 0.6 * Math.cos(t), y] as Point),
            mx: "1+.6*cos(linspace(0,2*pi,101))",
            my: "1.9+.6*sin(linspace(0,2*pi,101))",
            color: "#1a1a1a",
            legend: false,
          }
        : s,
    ),
    "[Rs,Xs,Prad,Ms]=p4Sphere(a,f,rho,c,v);",
    {
      schematic: "force-voltage",
      legend: false,
      coordinateY: true,
      textLabels: [
        { x: 0.2, y: 2, text: "F" },
        { x: 1, y: 2.12, text: "+" },
        { x: 1, y: 1.58, text: "−" },
        { x: 3.2, y: 3.8, text: "M" },
        { x: 4.92, y: 3.8, text: "1/D" },
        { x: 6.7, y: 3.8, text: "Rₘ" },
        { x: 9.4, y: 3.8, text: "Zᵣ" },
        { x: 6.4, y: 1.4, text: "v 对应 i" },
        { x: 6, y: 0.15, text: "F 对应电压；振速 v 对应电流 i" },
      ],
    },
  );
}
