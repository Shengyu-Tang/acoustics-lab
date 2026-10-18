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

const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = { rho: 1000, c: 1500, c2: 343, f: 1000, pa: 1, Z1: 1500000.0, Z2: 415, theta: 30 };
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
export default makeLecture("3.6.3", {
  defaults: p,
  parameters: [Z1, Z2],

  keyPoints: [
    "反射系数定义为反射波与入射波的复幅值之比。",
    "折射系数定义为透射波与入射波的复幅值之比。",
    "声压和振速的两组系数不同，由声压连续与法向振速连续联立求出。",
  ],
  formulas: [
    ...["R_p=B/A,\\quad D_p=C/A,\\quad R_u=-R_p,\\quad D_u=2Z_1/(Z_1+Z_2)"].map((tex, i) => ({
      number: `3.6.3-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.3-${i + 1 + 1}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.6.3-1", "声压和振速系数随阻抗比变化", (p, t) => normalFigure("3.6.3", p, t), 1, 1),
  ],
  answers: [
    "分别为反射波、透射波的复幅值与入射波复幅值之比，须注明声压还是振速。",
    "$R_p=(Z_2-Z_1)/(Z_2+Z_1)$，$D_p=2Z_2/(Z_1+Z_2)$。",
    "$R_u=-R_p$，$D_u=2Z_1/(Z_1+Z_2)$。",
    "声压连续和法向振速连续。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle:
    "例题　水下信号垂直射向水面，水和空气阻抗分别为 1.5×10⁶ 与 415 $\\mathrm{Pa\\cdot s/m}$",
  background:
    "水下信号垂直射向水面，水和空气阻抗分别为 1.5×10⁶ 与 415 $\\mathrm{Pa\\cdot s/m}$。求声压反射和折射系数。",
  exampleDefaults: { ...p, ...{} },
  given: [Z1, Z2],
  asks,
  judgment: "反射系数的符号表示相位关系；能量透射比例还需同时计入两侧阻抗。",
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
    "水浸超声检测首先需要估算水与试件的阻抗失配。幅度系数描述回波与透射信号，能量比例还需用特性阻抗换算。",
    "ultrasound",
    "超声无损检测",
  ),
});
