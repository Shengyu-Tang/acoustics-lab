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
import { radialFigure } from "../../plot/p3Radial";
const obs = parameter("obs", "观察距离", "r", "m", 0.05, 10, 0.01);
const level = parameter("level", "参考位置声压级", "L₀", "dB", 60, 160, 1);
const reference = parameter("reference", "参考距离", "r₀", "m", 0.5, 5, 0.01);
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1.21,
  c: 343,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  obs: 0.1,
  level: 100,
  reference: 1,
};
const asks = [
  ask(
    "cylResistance",
    "(1) 柱面波波阻",
    "Pa·s/m",
    "Z_a=j\\rho_0c_0 H_0^{(2)}(kr)/H_1^{(2)}(kr)",
    "real(1i*rho*c*besselh(0,2,2*pi*f*obs/c)/besselh(1,2,2*pi*f*obs/c))",
    (p) => p.rho * p.c * phy.cylindricalImpedance((2 * Math.PI * p.f * p.obs) / p.c).re,
    (p) =>
      [obs, lectureFrequency, params.c, params.rho]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "cylReactance",
    "(2) 柱面波波抗",
    "Pa·s/m",
    "X_a=\\Im Z_a",
    "imag(1i*rho*c*besselh(0,2,2*pi*f*obs/c)/besselh(1,2,2*pi*f*obs/c))",
    (p) => p.rho * p.c * phy.cylindricalImpedance((2 * Math.PI * p.f * p.obs) / p.c).im,
    (p) =>
      [obs, lectureFrequency, params.c, params.rho]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
export default makeLecture("3.9.3", {
  defaults: p,
  parameters: [lectureFrequency, params.c, params.rho, level, reference],

  keyPoints: [
    "柱面波阻抗为复数，远场趋于介质特性阻抗。",
    "柱面波振速相速度在近场大于声速，远场趋近声速。",
    "近场瞬时声能流可反向；平均声强与半径成反比，单位长度圆柱面的功率守恒。",
  ],
  formulas: [
    ...[
      "Z_a=j\\rho_0c_0 H_0^{(2)}(kr)/H_1^{(2)}(kr),\\quad I=A^2/(\\pi\\rho_0c_0kr)",
      "c_u=\\omega/|\\partial_r\\arg U|,\\quad I\\propto r^{-1}",
    ].map((tex, i) => ({
      number: `3.9.3-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.9.3-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    comparison(
      figure(
        "3.9.3-1",
        "柱面波阻抗的实部、虚部、模和相角",
        (p, t) => radialFigure("3.9.3-1", p, t),
        4,
        2,
      ),
      ["level", "reference"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
    comparison(
      figure(
        "3.9.3-2",
        "平面、柱面与球面波的距离扩展比较",
        (p, t) => radialFigure("3.9.3-2", p, t),
        1,
        1,
      ),
      ["f", "c", "rho"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
  ],
  answers: [
    "将声压复幅值除以径向振速复幅值。",
    "一般为复数。",
    "波阻逐渐趋近特性阻抗，波抗呈近场储能特征并在远场趋零。",
    "模值趋近特性阻抗，相角逐渐趋零。",
    "远场渐近等于平面行波的特性阻抗。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气中 1 kHz 长线声源，取半径 0.1 m 的局部声场",
  background:
    "空气中 1 kHz 长线声源，取半径 0.1 m 的局部声场。求柱面波波阻与波抗，判断能否近似平面行波。",
  exampleDefaults: { ...p, ...{} },
  given: [obs, lectureFrequency, params.c, params.rho],
  asks,
  judgment: "本题柱面波阻抗仍有虚部，距离加倍的几何扩展约为 3 dB，不能套用球面波的 6 dB。",
  examplePlot: (p) =>
    answerCurve(
      p,
      "obs",
      "观察距离",
      "m",
      (p) => p.rho * p.c * phy.cylindricalImpedance((2 * Math.PI * p.f * p.obs) / p.c).im,
      "imag(1i*rho*c*besselh(0,2,2*pi*f*x/c)/besselh(1,2,2*pi*f*x/c))",
    ),
  engineering: engineering(
    "长线源的几何扩展速度比点源慢。进行水下噪声距离外推时，先判断声场更接近柱面还是球面，再选择相应的声压级衰减规律。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
