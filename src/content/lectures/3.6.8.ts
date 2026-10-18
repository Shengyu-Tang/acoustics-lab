import { e368 } from "../../plot/p3Examples";
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
export default makeLecture("3.6.8", {
  defaults: p,
  parameters: [lectureFrequency, params.c, c2, theta, Z1, Z2],

  keyPoints: [
    "界面上切向相位连续给出反射定律和折射定律。",
    "反射角等于入射角；Snell 定律为 $\\sin\\theta_i/c_1=\\sin\\theta_t/c_2$。",
    "声压反射与折射系数同时依赖介质阻抗及方向余弦；折射角到达直角时对应临界入射角。",
  ],
  formulas: [
    ...[
      "\\theta_r=\\theta_i,\\quad \\frac{\\sin\\theta_i}{c_1}=\\frac{\\sin\\theta_t}{c_2},\\quad n=c_1/c_2",
      "R_p=\\frac{Z_2\\cos\\theta_i-Z_1\\cos\\theta_t}{Z_2\\cos\\theta_i+Z_1\\cos\\theta_t},\\quad D_p=1+R_p",
    ].map((tex, i) => ({
      number: `3.6.8-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.8-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    comparison(
      figure("3.6.8-1", "界面三列波的共同迹波长", (p, t) => obliqueFigure("3.6.8-1", p, t), 1, 1),
      ["c2", "Z1", "Z2"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
    comparison(
      figure("3.6.8-2", "声压系数随入射角变化", (p, t) => obliqueFigure("3.6.8-2", p, t), 1, 1),
      ["f", "theta"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
  ],
  answers: [
    "声压连续及法向振速连续。",
    "反射角等于入射角。",
    "$\\sin\\theta_i/c_1=\\sin\\theta_t/c_2$。",
    "透射方向沿界面、折射角为直角时的入射角，只在透射侧声速更大时存在。",
    "有关；方向余弦改变法向阻抗匹配关系。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　水中声束以 30° 入射另一流体，声速由 1500 变为 1000 m/s",
  background: "水中声束以 30° 入射另一流体，声速由 1500 变为 1000 m/s。求折射角和反射系数模值。",
  exampleDefaults: { ...p, ...{} },
  given: [theta, Z1, Z2],
  asks,
  judgment: "界面上三列波的迹波长相等；阵列相位补偿应采用切向波数相等的约束。",
  examplePlot: (p) => e368(p),
  engineering: engineering(
    "水下机器人透声罩改变声束的传播方向。设计时同时匹配切向波数和法向边界条件，才能正确计算接收角与透射幅值。",
    "ultrasound",
    "超声无损检测",
  ),
});
