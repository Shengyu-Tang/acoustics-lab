import { graph, points, vector } from "../content/p2";
import { arrow } from "./p1Helpers";
import type { Values } from "../content/p1";
export function controlVolume(p: Values, t: number, energy = false) {
  const vertices: [[number, number], string][] = [
    [[0.4, 0], "A"],
    [[0.4, 1], "B"],
    [[0.7, 1.25], "C"],
    [[0.7, 0.25], "D"],
    [[1.4, 0], "E"],
    [[1.4, 1], "F"],
    [[1.7, 1.25], "G"],
    [[1.7, 0.25], "H"],
  ];
  vertices.forEach(([v]) => {
    v[0] = (v[0] - 0.4) * p.L;
    v[1] *= Math.sqrt(p.S);
  });
  const paths = [
    [0, 1, 2, 3, 0],
    [4, 5, 6, 7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const inflow = energy ? p.wLeft : p.left,
    outflow = energy ? p.wRight : p.right;
  const a = energy ? "wLeft" : "left",
    b = energy ? "wRight" : "right",
    scale = energy ? 40 : 15;
  const left = arrow(
      "流入",
      [-0.15, Math.sqrt(p.S) / 2],
      [-0.15 + inflow * scale, Math.sqrt(p.S) / 2],
    ),
    right = arrow(
      "流出",
      [p.L + 0.1, Math.sqrt(p.S) / 2],
      [p.L + 0.1 + outflow * scale, Math.sqrt(p.S) / 2],
    );
  const rate = energy ? (inflow - outflow) / p.L : (p.rho * (inflow - outflow)) / p.L;
  const panel = graph(
    p,
    t,
    energy ? "声能控制体：正流入使内部能量增加" : "六面体 ABCDEFGH：质量守恒",
    "x + depth projection (m)",
    "z + depth projection (m)",
    [-0.7, 2],
    [-0.15, 1.5],
    [
      ...paths.map((path, i) =>
        points(
          i === 0 ? "控制体" : "棱边",
          path.map((i) => vertices[i][0]),
          `L*${vector(path.map((i) => vertices[i][0][0] / p.L))}`,
          `sqrt(S)*${vector(path.map((i) => vertices[i][0][1] / Math.sqrt(p.S)))}`,
          { color: "#777777", legend: i === 0, geometry: { key: "L", axis: "x" } },
        ),
      ),
      points(energy ? "能流 W入" : "质量流 ρu入", left.points, "aL(:,1)'", "aL(:,2)'"),
      points(energy ? "能流 W出" : "质量流 ρu出", right.points, "aR(:,1)'", "aR(:,2)'"),
    ],
    `aL=arrowPoints([-.15 sqrt(S)/2],[-.15+${a}*${scale} sqrt(S)/2],1);aR=arrowPoints([L+.1 sqrt(S)/2],[L+.1+${b}*${scale} sqrt(S)/2],1);rate=${energy ? "" : "rho*"}(${a}-${b})/L;`,
    {
      legend: false,
      textLabels: [
        ...vertices.map(([v, text]) => ({ x: v[0], y: v[1] + 0.06, text })),
        { x: -0.2, y: 0.85 * Math.sqrt(p.S), text: energy ? "W入" : "ρu入" },
        { x: p.L + 0.2, y: 0.85 * Math.sqrt(p.S), text: energy ? "W出" : "ρu出" },
      ],
      field: {
        x: [0.35 * p.L, 0.9 * p.L],
        y: [0.3 * Math.sqrt(p.S), 0.95 * Math.sqrt(p.S)],
        z: [
          [Math.tanh(rate * t * 100), Math.tanh(rate * t * 100)],
          [Math.tanh(rate * t * 100), Math.tanh(rate * t * 100)],
        ],
        limits: [-1, 1],
        map: "RdBu",
        label: energy ? "能量变化（归一化示意）" : "密度变化（归一化示意）",
      },
    },
    { field: { x: "[.35 .9]*L", y: "[.3 .95]*sqrt(S)", z: "tanh(rate*tView*100)*ones(2)" } },
  );
  return panel;
}
