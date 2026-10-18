import { completeExamples } from "../calculationSteps";
import { e365 } from "../../plot/p3Examples";
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
  ask(
    "energy",
    "(3) 声强透射系数",
    "—",
    "t_I=\\frac{4Z_1Z_2}{(Z_1+Z_2)^2}",
    "4*Z1*Z2/(Z1+Z2)^2",
    (p) => phy.normalInterface(p.Z1, p.Z2).t,
    (p) => [Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "loss",
    "(4) 透射损失",
    "dB",
    "TL=-10\\lg t_I",
    "-10*log10(4*Z1*Z2/(Z1+Z2)^2)",
    (p) => phy.normalInterface(p.Z1, p.Z2).TL,
    (p) => [Z1, Z2].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
const completedLecture = makeLecture("3.6.5", {
  defaults: p,
  parameters: [Z1, Z2],

  keyPoints: [
    "声强反射系数、透射系数分别是反射声强与透射声强对入射声强的比值。",
    "无耗散、垂直入射的两种半无限流体满足声强系数之和为一。",
    "透射损失是入射声强与透射声强比值的分贝数；水到空气的透射能量很小。",
  ],
  formulas: [
    ...["r_I=|R_p|^2,\\quad t_I=(Z_1/Z_2)|D_p|^2,\\quad r_I+t_I=1"].map((tex, i) => ({
      number: `3.6.5-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.5-${i + 1 + 1}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.6.5-1", "声强反射与透射的能量守恒", (p, t) => normalFigure("3.6.5", p, t), 1, 1),
  ],
  answers: [
    "分别定义为反射或透射声强与入射声强的比值。",
    "均匀无耗散平面行波的声强不随位置变化，不必只在界面取值。",
    "$TL=10\\lg(I_i/I_t)$。",
    "水与空气的特性阻抗相差很大，水面近似软边界，绝大部分能量被反射。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　水下声信号能否传到空气中",
  background:
    "水下声信号能否传到空气中。按水阻抗 1.5×10⁶、空气阻抗 415 $\\mathrm{Pa\\cdot s/m}$ 求声压反射、折射系数、能量透射比例和透射损失。",
  exampleDefaults: { ...p, ...{} },
  given: [Z1, Z2],
  asks,
  judgment: "阻抗失配会降低穿过界面的声功率；透射声压系数不能直接当作能量系数。",
  examplePlot: (p) => e365(p),
  engineering: engineering(
    "水下通信信号跨越水面会遭遇严重的阻抗失配。透射损失是链路预算中的界面损失，不能与水中传播吸收混为一谈。",
    "ultrasound",
    "超声无损检测",
  ),
});

export default completeExamples(completedLecture);
