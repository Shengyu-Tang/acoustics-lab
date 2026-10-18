import { e3612 } from "../../plot/p3Examples";
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
    "reflectAbs",
    "(2) 声压反射系数模值",
    "—",
    "|R_p|=\\left|\\frac{Z_2\\cos\\theta_i-Z_1\\cos\\theta_t}{Z_2\\cos\\theta_i+Z_1\\cos\\theta_t}\\right|",
    "abs(p3Oblique(Z1,Z2,c,c2,theta))",
    (p) => phy.magnitude(phy.oblique(p.Z1, p.Z2, p.c, p.c2, p.theta).R),
    (p) =>
      [theta, params.c, c2, Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "powerT",
    "(2) 功率透射系数",
    "—",
    "t_W=\\frac{Z_1}{Z_2}|D_p|^2\\frac{\\cos\\theta_t}{\\cos\\theta_i}",
    "p3Power(Z1,Z2,c,c2,theta)",
    (p) => phy.oblique(p.Z1, p.Z2, p.c, p.c2, p.theta).t,
    (p) =>
      [theta, params.c, c2, Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.6.12", {
  defaults: p,
  parameters: [params.c, c2, theta, Z1, Z2],

  keyPoints: [
    "声强反射、折射系数比较各声束单位截面积的声功率。",
    "斜入射时声束截面积发生变化，声强不直接相加。",
    "对同一界面足迹投影后，声功率反射与折射系数之和为一。",
  ],
  formulas: [
    ...[
      "S_i=S\\cos\\theta_i,\\quad S_t=S\\cos\\theta_t",
      "r_W=|R_p|^2,\\quad t_W=\\frac{Z_1\\cos\\theta_t}{Z_2\\cos\\theta_i}|D_p|^2,\\quad r_W+t_W=1",
    ].map((tex, i) => ({
      number: `3.6.12-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.12-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    comparison(
      figure(
        "3.6.12-1",
        "入射、反射、透射声束截面及法向投影",
        (p, t) => obliqueFigure("3.6.12-1", p, t),
        1,
        1,
      ),
      ["Z1", "Z2"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
    comparison(
      figure(
        "3.6.12-2",
        "声强系数与声功率系数的区别",
        (p, t) => obliqueFigure("3.6.12-2", p, t),
        1,
        1,
      ),
      ["theta"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
  ],
  answers: ["无耗散、垂直入射时等于。", "一般不等于；法向投影后的功率才满足守恒。"],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　水声束以 30° 入射声速 1000 m/s、阻抗 1×10⁶ $\\mathrm{Pa\\cdot s/m}$ 的流体",
  background:
    "水声束以 30° 入射声速 1000 m/s、阻抗 1×10⁶ $\\mathrm{Pa\\cdot s/m}$ 的流体。求反射幅值和法向功率透射系数。",
  exampleDefaults: { ...p, ...{} },
  given: [theta, params.c, c2, Z1, Z2],
  asks,
  judgment: "本题法向功率透射约为 94.2%；直接把三列波的声强相加会遗漏截面投影。",
  examplePlot: (p) => e3612(p),
  engineering: engineering(
    "计算斜入射声束通过界面的声功率时，应使用与传播方向垂直的截面积。统一界面足迹的法向投影后，才能进行传输效率与能量预算。",
    "ultrasound",
    "超声无损检测",
  ),
});
