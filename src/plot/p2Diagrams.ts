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
  const left = arrow("流入", [0.05, 0.65], [0.05 + inflow * scale, 0.65]),
    right = arrow("流出", [1.8, 0.65], [1.8 + outflow * scale, 0.65]);
  const rate = energy ? (inflow - outflow) / p.L : (p.rho * (inflow - outflow)) / p.L;
  const panel = graph(
    p,
    t,
    energy ? "声能控制体：正流入使内部能量增加" : "六面体 ABCDEFGH：质量守恒",
    "x 与深度投影（示意）",
    "z 与深度投影（示意）",
    [-0.4, 2.6],
    [-0.25, 1.5],
    [
      ...paths.map((path, i) =>
        points(
          i === 0 ? "控制体" : "棱边",
          path.map((i) => vertices[i][0]),
          vector(path.map((i) => vertices[i][0][0])),
          vector(path.map((i) => vertices[i][0][1])),
          { color: "#777777", legend: i === 0 },
        ),
      ),
      points(energy ? "能流 W入" : "质量流 ρu入", left.points, "aL(:,1)'", "aL(:,2)'"),
      points(energy ? "能流 W出" : "质量流 ρu出", right.points, "aR(:,1)'", "aR(:,2)'"),
    ],
    `aL=arrowPoints([.05 .65],[.05+${a}*${scale} .65],1);aR=arrowPoints([1.8 .65],[1.8+${b}*${scale} .65],1);rate=${energy ? "" : "rho*"}(${a}-${b})/L;`,
    {
      legend: false,
      textLabels: [
        ...vertices.map(([v, text]) => ({ x: v[0], y: v[1] + 0.06, text })),
        { x: 0, y: 0.85, text: energy ? "W入" : "ρu入" },
        { x: 2.1, y: 0.85, text: energy ? "W出" : "ρu出" },
      ],
      field: {
        x: [0.75, 1.3],
        y: [0.3, 0.95],
        z: [
          [Math.tanh(rate * t * 100), Math.tanh(rate * t * 100)],
          [Math.tanh(rate * t * 100), Math.tanh(rate * t * 100)],
        ],
        limits: [-1, 1],
        map: "RdBu",
        label: energy ? "能量变化（归一化示意）" : "密度变化（归一化示意）",
      },
    },
    { field: { x: "[.75 1.3]", y: "[.3 .95]", z: "tanh(rate*tView*100)*ones(2)" } },
  );
  return panel;
}
