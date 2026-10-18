import { completeExamples } from "../calculationSteps";
import { e3103 } from "../../plot/p3Examples";
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
const h = { ...parameter("h", "波导层厚", "h", "m", 0.3, 2, 0.01), geometry: true };
const mode = { ...parameter("mode", "模式阶数", "n", "—", 0, 5, 1), integer: true };
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1000,
  c: 343,
  c2: 343,
  f: 500,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  h: 0.5,
  mode: 2,
};
const asks = [
  ask(
    "cutoff",
    "(1) 本阶截止频率",
    "Hz",
    "f_n=nc_0/(2h)",
    "mode*c/(2*h)",
    (p) => (p.mode * p.c) / (2 * p.h),
    (p) =>
      [h, params.c, lectureFrequency].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "decay",
    "(2) 截止下衰减系数",
    "m⁻¹",
    "\\alpha_n=\\sqrt{(n\\pi/h)^2-(2\\pi f/c_0)^2}",
    "sqrt(max(0,(mode*pi/h)^2-(2*pi*f/c)^2))",
    (p) => phy.guideMode(p.mode, p.f, p.h, p.c).decay,
    (p) =>
      [h, params.c, lectureFrequency].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
const completedLecture = makeLecture("3.10.3", {
  defaults: p,
  parameters: [h, params.c, lectureFrequency, mode],

  keyPoints: [
    "简正波在受限方向为驻波，在不受限方向为行波。",
    "本征函数并非必然是简正波；纵向波数为实数时才可正常传播。",
    "频率大于本阶截止频率时传播，小于截止频率时蜕化为纵向衰减的非均匀波。",
  ],
  formulas: [
    ...[
      "k_{zn}=\\sqrt{(2\\pi f/c_0)^2-(n\\pi/h)^2},\\quad f_n=nc_0/(2h)",
      "f<f_n:\\quad k_{zn}=-j\\alpha_n,\\quad P_n\\propto e^{-\\alpha_nz}",
    ].map((tex, i) => ({
      number: `3.10.3-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.10.3-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.10.3-1", "可传播模式图与各阶截止频率", (p, t) => guideFigure("3.10.3-1", p, t), 1, 1),
    figure("3.10.3-2", "截止以下本征函数沿波导衰减", (p, t) => guideFigure("3.10.3-2", p, t), 1, 1),
  ],
  answers: [
    "受限方向是驻波、不受限方向是行波的波导传播模式。",
    "使某一阶纵向波数刚好为零的频率。",
    "频率大于该阶截止频率。",
    "不一定，截止以下本征函数对应倏逝场。",
    "检查纵向波数是否为实数，等价于频率是否高于该阶截止频率。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气波导厚度 0.5 m，频率 500 Hz，考察第二阶本征函数",
  background: "空气波导厚度 0.5 m，频率 500 Hz，考察第二阶本征函数。求截止频率和纵向衰减系数。",
  exampleDefaults: { ...p, ...{} },
  given: [h, params.c, lectureFrequency],
  asks,
  judgment: (p) =>
    phy.guideMode(p.mode, p.f, p.h, p.c).propagating
      ? "当前频率高于本阶截止频率，可形成传播简正波。"
      : "当前频率不高于本阶截止频率，不能视为传播简正波。",
  examplePlot: (p) => e3103(p),
  engineering: engineering(
    "设计管道消声器前，应逐阶判断目标频率是否高于截止频率。截止以下场随纵向衰减，传播模态则需要进一步评估反射与吸收。",
    "duct",
    "通风管道模态与反射",
  ),
});

export default completeExamples(completedLecture);
