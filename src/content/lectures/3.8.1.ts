import { e381 } from "../../plot/p3Examples";
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
    "pressure",
    "(1) 声压峰值",
    "Pa",
    "p_a=A/r",
    "pa/obs",
    (p) => p.pa / p.obs,
    (p) =>
      [obs, amplitude, lectureFrequency, params.c, params.rho]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "velocity",
    "(2) 振速峰值",
    "m/s",
    "u_a=\\frac{A}{\\rho_0c_0r}\\sqrt{1+(kr)^{-2}}",
    "pa/(rho*c*obs)*sqrt(1+(c/(2*pi*f*obs))^2)",
    (p) => (p.pa / (p.rho * p.c * p.obs)) * Math.sqrt(1 + (p.c / (2 * Math.PI * p.f * p.obs)) ** 2),
    (p) =>
      [obs, amplitude, lectureFrequency, params.c, params.rho]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
export default makeLecture("3.8.1", {
  defaults: p,
  parameters: [lectureFrequency, params.c, params.rho, amplitude],

  keyPoints: [
    "均匀球面波的等相位面是同心球面。",
    "球面波方程对 $rp$ 化为一维波动方程，包含扩张波与收敛波。",
    "扩张声压随半径反比衰减，振速还含近场项，近处声压与振速的波形不同。",
  ],
  formulas: [
    ...[
      "\\partial_r^2(rp)=c_0^{-2}\\partial_t^2(rp),\\quad p=[f(r-c_0t)+g(r+c_0t)]/r",
      "P=Ae^{-jkr}/r,\\quad U=P(1+1/(jkr))/(\\rho_0c_0)",
    ].map((tex, i) => ({
      number: `3.8.1-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.8.1-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    comparison(
      figure("3.8.1-1", "扩张与收敛球面脉冲的传播", (p, t) => radialFigure("3.8.1-1", p, t), 1, 1),
      ["f", "rho"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
    figure(
      "3.8.1-2",
      "近场与远场的声压和振速时间函数",
      (p, t) => radialFigure("3.8.1-2", p, t),
      4,
      1,
    ),
  ],
  answers: [
    "等相位面为同心球面的波；均匀球面波在同一球面幅值相同。",
    "不同，振速除传播项外还含近场项，只有远场趋于同相且成固定比例。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气中球面声源的幅度常数为 1 Pa·m，频率为 1 kHz",
  background:
    "空气中球面声源的幅度常数为 1 Pa·m，频率为 1 kHz。求距声源 0.1 m 处的声压与振速峰值。",
  exampleDefaults: { ...p, ...{} },
  given: [obs, amplitude, lectureFrequency, params.c, params.rho],
  asks,
  judgment: "应先用无量纲距离评估近场振速项，只有足够远时才可近似忽略。",
  examplePlot: (p) => e381(p),
  engineering: engineering(
    "小型水声发射器远离源区后常用扩张球面波近似。近场振速包含附加项，因此声压与振速传感器的校准距离不能只按幅度衰减判断。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
