import { e383 } from "../../plot/p3Examples";
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
  rho: 1000,
  c: 343,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  obs: 0.05,
};
const asks = [
  ask(
    "pressureSpeed",
    "(1) 声压相速度",
    "m/s",
    "c_p=c_0",
    "c",
    (p) => p.c,
    (p) =>
      [obs, lectureFrequency, params.c]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "velocitySpeed",
    "(2) 振速相速度",
    "m/s",
    "c_u=c_0[1+(kr)^{-2}]",
    "c*(1+(c/(2*pi*f*obs))^2)",
    (p) => p.c * (1 + (p.c / (2 * Math.PI * p.f * p.obs)) ** 2),
    (p) =>
      [obs, lectureFrequency, params.c]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
export default makeLecture("3.8.3", {
  defaults: p,
  parameters: [lectureFrequency, params.c],

  keyPoints: [
    "相速度由等相位面随时间移动的速度定义。",
    "均匀扩张球面波的声压相速度等于介质声速。",
    "振速的附加空间相位使其近场相速度大于声速，远场趋于声速；相速度不等同于信号速度。",
  ],
  formulas: [
    ...["c_{\\mathrm{phase}}=\\omega/|\\partial_r\\arg P|,\\quad \\arg U=-kr-\\arctan(1/kr)"].map(
      (tex, i) => ({
        number: `3.8.3-${i + 1}`,
        tex,
        meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
      }),
    ),
    ...asks.map((a, i) => ({
      number: `3.8.3-${i + 1 + 1}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.8.3-1", "球面波声压与振速的局部相速度", (p, t) => radialFigure("3.8.3", p, t), 4, 1),
  ],
  answers: [
    "对声压等相位条件求时间导数得到传播速度。",
    "将振速附加相位也计入等相位条件再求导。",
    "声压相速度等于声速，振速相速度近场大于声速、远场渐近相等。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气中球面波频率为 1 kHz，在半径 0.05 m 处比较声压与振速相速度",
  background: "空气中球面波频率为 1 kHz，在半径 0.05 m 处比较声压与振速相速度。求两种相速度。",
  exampleDefaults: { ...p, ...{} },
  given: [obs, lectureFrequency, params.c],
  asks,
  judgment: "振速相速度大于声速源于局部相位变化，不表示信号或能量超声速传播。",
  examplePlot: (p) => e383(p),
  engineering: engineering(
    "声压与质点振速的空间相位梯度不同，导致近场局部相速度不同。估计传输时延时应关注信号传播，不能把局部振速相位速度当作能量速度。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
