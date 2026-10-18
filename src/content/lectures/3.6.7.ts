import { completeExamples } from "../calculationSteps";
import { e367 } from "../../plot/p3Examples";
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

const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = { rho: 1000, c: 1500, c2: 1000, f: 1000, pa: 1, Z1: 1500000.0, Z2: 1000000.0, theta: 30 };
const asks = [
  ask(
    "angle",
    "(1) 折射角",
    "°",
    "\\theta_t=\\arcsin[(c_2/c_1)\\sin\\theta_i]",
    "p3Refraction(c,c2,theta)",
    (p) => phy.refractionAngle(p.c, p.c2, p.theta),
    (p) =>
      [theta, params.c, c2, Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "reflectAbs",
    "(2) 声压反射系数模值",
    "—",
    "|R_p|=\\left|\\frac{Z_2\\cos\\theta_i-Z_1\\cos\\theta_t}{Z_2\\cos\\theta_i+Z_1\\cos\\theta_t}\\right|",
    "abs(p3Oblique(Z1,Z2,c,c2,theta))",
    (p) => phy.magnitude(phy.oblique(p.Z1, p.Z2, p.c, p.c2, p.theta).R),
    (p) =>
      [theta, params.c, c2, Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
const completedLecture = makeLecture("3.6.7", {
  defaults: p,
  parameters: [lectureFrequency, params.c, c2, theta, Z1, Z2, params.pa],

  keyPoints: [
    "入射角、反射角、折射角均相对界面法线定义。",
    "两侧波动方程形式相同而声速不同，入射侧由入射与反射波叠加。",
    "边界条件要求声压和法向振速连续，法向振速带有方向余弦。",
  ],
  formulas: [
    ...[
      "P_i=Ae^{-jk_1(x\\sin\\theta_i+y\\cos\\theta_i)},\\quad P_r=Be^{-jk_1(x\\sin\\theta_i-y\\cos\\theta_i)}",
      "P_t=Ce^{-jk_2(x\\sin\\theta_t+y\\cos\\theta_t)},\\quad U_{tn}=P_t\\cos\\theta_t/Z_2",
    ].map((tex, i) => ({
      number: `3.6.7-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.7-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.6.7-1", "斜入射的入射、反射与折射声场", (p, t) => obliqueFigure("3.6.7", p, t), 1, 1),
  ],
  answers: [
    "分别是入射、反射、折射传播方向与界面法线所成的角。",
    "形式相同，介质参数和波数不同；透射侧需满足向外传播或衰减条件。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　水声以 30° 入射声速 1000 m/s、阻抗 1×10⁶ $\\mathrm{Pa\\cdot s/m}$ 的流体",
  background:
    "水声以 30° 入射声速 1000 m/s、阻抗 1×10⁶ $\\mathrm{Pa\\cdot s/m}$ 的流体。求折射角与反射幅值。",
  exampleDefaults: { ...p, ...{} },
  given: [theta, Z1, Z2],
  asks,
  judgment: "折射方向比入射方向更靠近法线；声束指向校准必须使用实际折射角。",
  examplePlot: (p) => e367(p),
  engineering: engineering(
    "斜入射超声探头需要把外部声束方向换算成材料中的传播方向。两流体模型用于说明法向投影和折射规律，固体检测另需考虑模式转换。",
    "ultrasound",
    "超声无损检测",
  ),
});

export default completeExamples(completedLecture);
