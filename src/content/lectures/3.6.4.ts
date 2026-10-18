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
  answerCurve,
  engineering,
} from "../p3";
import * as phy from "../../physics/chapter3b";
import { normalFigure, obliqueFigure } from "../../plot/p3Interfaces";
const boundary = { ...parameter("boundary", "边界类型", "编号", "—", 0, 4, 1), integer: true };
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1000,
  c: 1500,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  boundary: 1,
};
const asks = [
  ask(
    "reflection",
    "(1) 声压反射系数",
    "—",
    "R_p=\\frac{Z_2-Z_1}{Z_2+Z_1}",
    "(Z2-Z1)/(Z2+Z1)",
    (p) => phy.normalInterface(p.Z1, p.Z2).R,
    (p) => [Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "transmission",
    "(2) 声压折射系数",
    "—",
    "D_p=\\frac{2Z_2}{Z_1+Z_2}",
    "2*Z2/(Z1+Z2)",
    (p) => phy.normalInterface(p.Z1, p.Z2).D,
    (p) => [Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.6.4", {
  defaults: p,
  parameters: [lectureFrequency, params.c, params.pa, Z1, boundary],

  measurements: [
    {
      name: "反射系数",
      unit: "—",
      matlab: "p3Boundary(boundary)",
      calc: (p) => [0, 0.6, -0.6, 1, -1][p.boundary],
    },
    {
      name: "界面声压幅值",
      unit: "Pa",
      matlab: "pa*(1+p3Boundary(boundary))",
      calc: (p) => p.pa * (1 + [0, 0.6, -0.6, 1, -1][p.boundary]),
    },
    {
      name: "界面振速幅值",
      unit: "m/s",
      matlab: "pa/Z1*(1-p3Boundary(boundary))",
      calc: (p) => (p.pa / p.Z1) * (1 - [0, 0.6, -0.6, 1, -1][p.boundary]),
    },
  ],

  keyPoints: [
    "特性阻抗相等时无反射，声压全部透射。",
    "透射侧阻抗较大称硬边界，较小称软边界。",
    "绝对硬边界的声压加倍、法向振速为零；绝对软边界声压为零、振速加倍。",
  ],
  formulas: [
    ...[
      "R_p=0\\ (Z_2=Z_1),\\quad R_p\\to1\\ (Z_2\\to\\infty),\\quad R_p\\to-1\\ (Z_2\\to0)",
      "P(0)=A(1+R_p),\\quad U(0)=A(1-R_p)/Z_1",
    ].map((tex, i) => ({
      number: `3.6.4-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.4-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.6.4-1", "五种阻抗边界的声压与振速包络", (p, t) => normalFigure("3.6.4", p, t), 2, 1),
  ],
  answers: [
    "无反射，声压和振速连续透射。",
    "相对入射介质而言，透射侧阻抗较大为硬，较小为软。",
    "绝对硬取无限大法向阻抗；绝对软取零法向阻抗。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle:
    "例题　水入射钢表面的近似流体模型中，阻抗为 1.5×10⁶ 与 4.6×10⁷ $\\mathrm{Pa\\cdot s/m}$",
  background:
    "水入射钢表面的近似流体模型中，阻抗为 1.5×10⁶ 与 4.6×10⁷ $\\mathrm{Pa\\cdot s/m}$。求声压系数并判断边界软硬。",
  exampleDefaults: { ...p, ...{ Z2: 46000000.0 } },
  given: [Z1, Z2],
  asks,
  judgment: (p) =>
    p.Z2 > p.Z1
      ? "当前为硬边界，声压反射同相。"
      : p.Z2 < p.Z1
        ? "当前为软边界，声压反射反相。"
        : "当前阻抗匹配，没有反射。",
  examplePlot: (p) =>
    answerCurve(
      p,
      "Z1",
      "入射介质阻抗",
      "Pa·s/m",
      (p) => phy.normalInterface(p.Z1, p.Z2).D,
      "2*Z2/(x+Z2)",
    ),
  engineering: engineering(
    "高阻抗试件表面常近似为硬边界，液体自由表面常近似为软边界。依据阻抗比选择近似，再用有限阻抗模型估计近似误差。",
    "ultrasound",
    "超声无损检测",
  ),
});
