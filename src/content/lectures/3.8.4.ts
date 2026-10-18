import { completeExamples } from "../calculationSteps";
import { e384 } from "../../plot/p3Examples";
import {
  makeLecture,
  parameter,
  params,
  Z1,
  Z2,
  c2,
  theta,
  figure,
  comparison,
  ask,
  engineering,
} from "../p3";
import * as phy from "../../physics/chapter3b";
import { normalFigure, obliqueFigure } from "../../plot/p3Interfaces";
import { radialFigure } from "../../plot/p3Radial";
const obs = parameter("obs", "观察距离", "r", "m", 0.05, 10, 0.01);
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const amplitude = parameter("pa", "球面波幅度常数", "A", "Pa·m", 0.01, 200, 0.01);
const p = { rho: 1.21, c: 343, c2: 343, f: 1000, pa: 1, Z1: 1500000.0, Z2: 415, theta: 30, obs: 1 };
const asks = [
  ask(
    "intensity",
    "(1) 平均声强",
    "W/m²",
    "I=A^2/(2\\rho_0c_0r^2)",
    "pa^2/(2*rho*c*obs^2)",
    (p) => p.pa ** 2 / (2 * p.rho * p.c * p.obs ** 2),
    (p) =>
      [amplitude, params.rho, params.c, obs]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "power",
    "(2) 穿过球面的声功率",
    "W",
    "W=4\\pi r^2I=2\\pi A^2/(\\rho_0c_0)",
    "2*pi*pa^2/(rho*c)",
    (p) => (2 * Math.PI * p.pa ** 2) / (p.rho * p.c),
    (p) =>
      [amplitude, params.rho, params.c, obs]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
const completedLecture = makeLecture("3.8.4", {
  defaults: p,
  parameters: [lectureFrequency, params.c, params.rho, amplitude],

  keyPoints: [
    "声能流密度由瞬时声压与振速相乘求得，近场可出现指向声源的瞬时能流。",
    "时间平均声强始终径向向外，与声压有效值的平方成正比。",
    "无吸收球面波声强随距离平方反比衰减，穿过同心球面的平均声功率守恒。",
  ],
  formulas: [
    ...[
      "W_r=pu,\\quad I_r=\\langle W_r\\rangle=A^2/(2\\rho_0c_0r^2)",
      "L_p(r_2)-L_p(r_1)=-20\\lg(r_2/r_1)",
    ].map((tex, i) => ({
      number: `3.8.4-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.8.4-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.8.4-1",
      "三个物理位置的声压、振速、能流与平均声强",
      (p, t) => radialFigure("3.8.4-1", p, t),
      3,
      3,
    ),
    comparison(
      figure("3.8.4-2", "球面扩展的声压级与距离", (p, t) => radialFigure("3.8.4-2", p, t), 1, 1),
      ["f", "c", "rho"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
  ],
  answers: [
    "取实际声压与实际振速的乘积。",
    "对声能流密度作一个周期的时间平均。",
    "近场瞬时能流可反向，但平均声强径向向外。",
    "平均声强与距离平方成反比。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气中 1 kHz 球面波的幅度常数为 1 Pa·m",
  background: "空气中 1 kHz 球面波的幅度常数为 1 Pa·m。求距源 1 m 的平均声强和穿过该球面的声功率。",
  exampleDefaults: { ...p, ...{} },
  given: [amplitude, params.rho, params.c, obs],
  asks,
  judgment: "不同球面上的声强随半径平方衰减，而总平均声功率相同；这属于几何扩展。",
  examplePlot: (p) => e384(p),
  engineering: engineering(
    "道路监测需区分车辆运动造成的频移与声程变化造成的声级变化。自由场声强按距离平方下降，可据此估算噪声限值所需的退距。",
    "transport",
    "车辆频移与噪声退距设计",
  ),
});

export default completeExamples(completedLecture);
