import { e382 } from "../../plot/p3Examples";
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
};
const asks = [
  ask(
    "resistance",
    "(1) 球面波波阻",
    "Pa·s/m",
    "\\Re Z_a=\\rho_0c_0\\frac{(kr)^2}{1+(kr)^2}",
    "rho*c*(2*pi*f*obs/c)^2/(1+(2*pi*f*obs/c)^2)",
    (p) => p.rho * p.c * phy.sphericalImpedance((2 * Math.PI * p.f * p.obs) / p.c).re,
    (p) =>
      [obs, lectureFrequency, params.c, params.rho]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "reactance",
    "(2) 球面波波抗",
    "Pa·s/m",
    "\\Im Z_a=\\rho_0c_0\\frac{kr}{1+(kr)^2}",
    "rho*c*(2*pi*f*obs/c)/(1+(2*pi*f*obs/c)^2)",
    (p) => p.rho * p.c * phy.sphericalImpedance((2 * Math.PI * p.f * p.obs) / p.c).im,
    (p) =>
      [obs, lectureFrequency, params.c, params.rho]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
export default makeLecture("3.8.2", {
  defaults: p,
  parameters: [lectureFrequency, params.c, params.rho],

  keyPoints: [
    "简谐均匀扩张球面波的声压幅值随半径反比衰减，振速还含近场项。",
    "球面波波阻抗为 $Z_a=\\rho_0c_0jkr/(1+jkr)$，一般为复数。",
    "波阻随无量纲距离增加趋近特性阻抗，波抗先增后减；远场阻抗相角趋于零。",
  ],
  formulas: [
    ...[
      "P=Ae^{-jkr}/r,\\quad U=\\frac{P}{\\rho_0c_0}(1+1/(jkr)),\\quad Z_a=\\rho_0c_0\\frac{jkr}{1+jkr}",
    ].map((tex, i) => ({
      number: `3.8.2-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.8.2-${i + 1 + 1}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.8.2-1",
      "球面波波阻、波抗的物理距离与无量纲比较",
      (p, t) => radialFigure("3.8.2-1", p, t),
      4,
      1,
    ),
    figure(
      "3.8.2-2",
      "球面波阻抗模值、相角的物理距离与无量纲比较",
      (p, t) => radialFigure("3.8.2-2", p, t),
      4,
      1,
    ),
  ],
  answers: [
    "同一球面声压幅值一致、以单一频率作简谐变化的球面波。",
    "不同，振速含近场项。",
    "远场趋于平面行波的特性阻抗，近场为复数且模值较小。",
    "通常指没有收敛分量的均匀扩张球面波。",
    "波阻单调趋于 $\\rho_0c_0$；波抗在 $kr=1$ 达到最大后趋零。",
    "模值由零单调增大趋于特性阻抗，相角由直角单调减小趋于零。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气中 1 kHz 球面波在距声源 0.1 m 处测量",
  background: "空气中 1 kHz 球面波在距声源 0.1 m 处测量。求局部波阻与波抗，用于评估近场修正。",
  exampleDefaults: { ...p, ...{} },
  given: [obs, lectureFrequency, params.c, params.rho],
  asks,
  judgment: "波抗与波阻的比值量化近场修正，该比足够小时才能采用平面行波阻抗近似。",
  examplePlot: (p) => e382(p),
  engineering: engineering(
    "水听器近场校准需要复波阻抗，而远场可近似使用介质特性阻抗。通过频率、距离和声速确定无量纲距离，再决定是否保留波抗。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
