import { completeExamples } from "../calculationSteps";
import { e3105 } from "../../plot/p3Examples";
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
import { guideFigure } from "../../plot/p3Guide";
const h = parameter("h", "波导层厚", "h", "m", 0.3, 2, 0.01);
const mode = { ...parameter("mode", "模式阶数", "n", "—", 0, 5, 1), integer: true };
const sound = parameter("c", "介质声速", "c₀", "m/s", 300, 380, 1);
const frequency = parameter("f", "载波频率", "f", "Hz", 800, 2500, 10);
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1000,
  c: 343,
  c2: 343,
  f: 1500,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  h: 0.5,
  mode: 1,
};
const asks = [
  ask(
    "phaseSpeed",
    "(1) 相速度",
    "m/s",
    "c_p=c_0/\\sqrt{1-(f_n/f)^2}",
    "c/sqrt(1-(mode*c/(2*h*f))^2)",
    (p) => phy.guideMode(p.mode, p.f, p.h, p.c).cp,
    (p) => [frequency, sound, h].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "groupSpeed",
    "(2) 群速度",
    "m/s",
    "c_g=c_0\\sqrt{1-(f_n/f)^2}",
    "c*sqrt(1-(mode*c/(2*h*f))^2)",
    (p) => phy.guideMode(p.mode, p.f, p.h, p.c).cg,
    (p) => [frequency, sound, h].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
const completedLecture = makeLecture("3.10.5", {
  defaults: p,
  parameters: [h, sound, frequency],

  keyPoints: [
    "相速度是等相位面的传播速度，波导中大于等于介质声速。",
    "群速度描述窄带信号、能量和包络的传播速度，小于等于介质声速。",
    "各阶模式具有不同频散关系，相速度与群速度的乘积等于声速平方；宽带信号传播后形状会改变。",
  ],
  formulas: [
    ...[
      "c_p=\\omega/k_z,\\quad c_g=d\\omega/dk_z,\\quad c_pc_g=c_0^2",
      "p_1+p_2=2\\cos[(\\Delta\\omega t-\\Delta k_z z)/2]\\cos(\\bar\\omega t-\\bar k_z z)",
    ].map((tex, i) => ({
      number: `3.10.5-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.10.5-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    comparison(
      figure(
        "3.10.5-1",
        "前五阶相速度与群速度的频率特性",
        (p, t) => guideFigure("3.10.5-1", p, t),
        1,
        2,
      ),
      ["f"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
    figure(
      "3.10.5-2",
      "两相近频率形成的拍包络与相位标记",
      (p, t) => guideFigure("3.10.5-2", p, t),
      1,
      1,
    ),
  ],
  answers: [
    "等相位面沿传播方向的移动速度。",
    "相邻频率波叠加包络的传播速度，在本无损波导中也描述能量速度。",
    "传播模态相速度大于等于声速。",
    "群速度小于等于声速。",
    "一般不同，零阶为声速。",
    "一般不同，零阶为声速。",
    "相速度随频率变化的传播介质或导波结构。",
    "各频率分量的相位和群延迟不同，会产生展宽与波形畸变。",
  ],
  animation: true,
  animationPeriod: (p) => 10 / phy.guideMode(p.mode, p.f, p.h, p.c).cp,
  exampleTitle: "例题　空气波导层厚 0.5 m，第一高阶模态以 1500 Hz 传播",
  background: "空气波导层厚 0.5 m，第一高阶模态以 1500 Hz 传播。求相速度和群速度，并核对两者乘积。",
  exampleDefaults: { ...p, ...{} },
  given: [frequency, sound, h],
  asks,
  judgment: (p) =>
    `当前相速度 ${asks[0].calc(p).toPrecision(4)} m/s，群速度 ${asks[1].calc(p).toPrecision(4)} m/s；信号延迟按群速度估计。`,
  examplePlot: (p) => e3105(p),
  engineering: engineering(
    "宽带声信号在波导中传播时，不同频率分量具有不同群延迟。多模态管道测量应按模态的群速度估计到达时刻，并考虑脉冲展宽。",
    "duct",
    "通风管道模态与反射",
  ),
});

export default completeExamples(completedLecture);
