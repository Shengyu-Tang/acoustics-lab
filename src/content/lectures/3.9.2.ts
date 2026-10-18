import { completeExamples } from "../calculationSteps";
import { e392 } from "../../plot/p3Examples";
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
const amplitude = parameter("pa", "柱面声压幅度系数", "A", "Pa", 0.01, 200, 0.01);
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
    "cylPressure",
    "(1) 柱面声压峰值",
    "Pa",
    "p_a=A|H_0^{(2)}(kr)|",
    "pa*abs(besselh(0,2,2*pi*f*obs/c))",
    (p) =>
      p.pa *
      Math.hypot(
        phy.cylindricalBessel((2 * Math.PI * p.f * p.obs) / p.c).J0,
        phy.cylindricalBessel((2 * Math.PI * p.f * p.obs) / p.c).Y0,
      ),
    (p) =>
      [obs, lectureFrequency, params.c, params.rho, amplitude]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "cylVelocity",
    "(2) 柱面振速峰值",
    "m/s",
    "u_a=\\frac{A}{\\rho_0c_0}|H_1^{(2)}(kr)|",
    "pa/(rho*c)*abs(besselh(1,2,2*pi*f*obs/c))",
    (p) =>
      (p.pa / (p.rho * p.c)) *
      Math.hypot(
        phy.cylindricalBessel((2 * Math.PI * p.f * p.obs) / p.c).J1,
        phy.cylindricalBessel((2 * Math.PI * p.f * p.obs) / p.c).Y1,
      ),
    (p) =>
      [obs, lectureFrequency, params.c, params.rho, amplitude]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
const completedLecture = makeLecture("3.9.2", {
  defaults: p,
  parameters: [lectureFrequency, params.c, params.rho, amplitude],

  keyPoints: [
    "正时间因子下扩张柱面波以第二类汉克尔函数 $H_0^{(2)}(kr)$ 表示。",
    "由速度势的时间导数得到声压 $p=\\rho_0\\partial\\phi/\\partial t$。",
    "由负空间梯度得到振速 $u_r=-\\partial\\phi/\\partial r$；近场声压与振速存在相位差。",
  ],
  formulas: [
    ...[
      "\\phi=B H_0^{(2)}(kr)e^{j\\omega t},\\quad p=\\rho_0\\partial_t\\phi,\\quad u_r=-\\partial_r\\phi",
      "P=A H_0^{(2)}(kr),\\quad U=-j A H_1^{(2)}(kr)/(\\rho_0c_0)",
    ].map((tex, i) => ({
      number: `3.9.2-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.9.2-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.9.2-1",
      "近远场三个位置的柱面声压与振速",
      (p, t) => radialFigure("3.9.2-1", p, t),
      3,
      2,
    ),
    comparison(
      figure(
        "3.9.2-2",
        "柱面波三个时刻的物理空间分布",
        (p, t) => radialFigure("3.9.2-2", p, t),
        1,
        1,
      ),
      ["rho"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
  ],
  answers: [
    "$\\phi=B H_0^{(2)}(kr)e^{j\\omega t}$，满足扩张辐射条件。",
    "$p=\\rho_0\\partial\\phi/\\partial t$。",
    "$u_r=-\\partial\\phi/\\partial r$，用柱函数导数关系计算。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气中长线声源的柱面声压幅度系数为 1 Pa，频率为 1 kHz",
  background:
    "空气中长线声源的柱面声压幅度系数为 1 Pa，频率为 1 kHz。求半径 0.1 m 处的声压与振速峰值。",
  exampleDefaults: { ...p, ...{} },
  given: [obs, lectureFrequency, params.c, params.rho, amplitude],
  asks,
  judgment: "有限半径处声压与振速相位不同，校准长线声源时应保留汉克尔函数关系。",
  examplePlot: (p) => e392(p),
  engineering: engineering(
    "长线阵或长圆柱换能器附近的声压与径向振速可用扩张柱面波估计。近场相位差影响声强测量，应保留声压和振速的复数关系。",
    "sonar",
    "海底观测站主动声呐",
  ),
});

export default completeExamples(completedLecture);
