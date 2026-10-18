import { completeExamples } from "../calculationSteps";
import { e362 } from "../../plot/p3Examples";
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
const p = { rho: 1000, c: 1500, c2: 343, f: 1000, pa: 1, Z1: 1500000.0, Z2: 3000000.0, theta: 30 };
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
];
const completedLecture = makeLecture("3.6.2", {
  defaults: p,
  parameters: [Z1, Z2, lectureFrequency, params.c, c2, params.pa],

  interactive: {
    presets: [
      { name: "空气—水", values: { Z1: 415, Z2: 1500000, c: 343, c2: 1500 } },
      { name: "水—钢（纵波近似）", values: { Z1: 1500000, Z2: 46000000, c: 1500, c2: 5900 } },
      { name: "水—空气", values: { Z1: 1500000, Z2: 415, c: 1500, c2: 343 } },
    ],
  },

  keyPoints: [
    "垂直入射问题由两种介质中的波动方程和界面条件组成。",
    "入射侧声压是入射波与反射波之和，透射侧只保留向外传播的透射波。",
    "质点振速由运动方程求得，反向传播分量的振速符号与声压相反。",
  ],
  formulas: [
    ...[
      "P_1=Ae^{-jk_1x}+Be^{jk_1x},\\quad P_2=Ce^{-jk_2x}",
      "U_1=(Ae^{-jk_1x}-Be^{jk_1x})/Z_1,\\quad U_2=Ce^{-jk_2x}/Z_2",
    ].map((tex, i) => ({
      number: `3.6.2-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.2-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.6.2-1",
      "垂直入射的三列波及入射侧合成场",
      (p, t) => normalFigure("3.6.2", p, t),
      1,
      1,
    ),
  ],
  answers: [
    "是，需在两侧求解波动方程，并同时满足边界条件和无穷远条件。",
    "第 I 介质含入射波和反射波，第 II 介质只有透射波。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　水中平面波垂直入射阻抗为 3×10⁶ $\\mathrm{Pa\\cdot s/m}$ 的流体",
  background:
    "水中平面波垂直入射阻抗为 3×10⁶ $\\mathrm{Pa\\cdot s/m}$ 的流体。求两种声压系数，用于重建反射回波。",
  exampleDefaults: { ...p, ...{} },
  given: [Z1, Z2],
  asks,
  judgment: "两侧阻抗相等时没有反射，失配时必须保留反射分量才能重建界面附近的声场。",
  examplePlot: (p) => e362(p),
  engineering: engineering(
    "脉冲回波检测通过入射、反射与透射分量区分材料界面。界面附近的总场包含干涉，测量探头位置会影响读到的瞬时声压。",
    "ultrasound",
    "超声无损检测",
  ),
});

export default completeExamples(completedLecture);
