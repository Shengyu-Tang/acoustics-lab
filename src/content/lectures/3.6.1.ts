import { e361 } from "../../plot/p3Examples";
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
export default makeLecture("3.6.1", {
  defaults: p,
  parameters: [Z1, Z2, lectureFrequency, params.c, params.pa],

  interactive: {
    presets: [
      { name: "空气—水", values: { Z1: 415, Z2: 1500000, c: 343, c2: 1500 } },
      { name: "水—钢（纵波近似）", values: { Z1: 1500000, Z2: 46000000, c: 1500, c2: 5900 } },
      { name: "水—空气", values: { Z1: 1500000, Z2: 415, c: 1500, c2: 343 } },
    ],
  },

  keyPoints: [
    "声学定解问题需同时满足波动方程与边界条件。",
    "无面质量的流体分界面两侧声压连续。",
    "流体分界面两侧法向质点振速连续，切向振速不要求相等。",
  ],
  formulas: [
    ...[
      "p_i+p_r=p_t,\\qquad u_{in}+u_{rn}=u_{tn}",
      "\\Delta p\\,S=\\rho S\\Delta x\\,\\partial_t u_n\\longrightarrow0\\quad(\\Delta x\\to0)",
    ].map((tex, i) => ({
      number: `3.6.1-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.1-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.6.1-1",
      "分界面两侧的声压与法向振速连续",
      (p, t) => normalFigure("3.6.1", p, t),
      2,
      1,
    ),
  ],
  answers: ["波动方程的形式解尚含待定系数，边界条件决定实际场。", "声压连续与法向质点振速连续。"],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　水与另一流体的界面阻抗为 1.5×10⁶ 与 3×10⁶ $\\mathrm{Pa\\cdot s/m}$",
  background:
    "水与另一流体的界面阻抗为 1.5×10⁶ 与 3×10⁶ $\\mathrm{Pa\\cdot s/m}$。求声压反射和折射系数，并据此核对界面连续性。",
  exampleDefaults: { ...p, ...{} },
  given: [Z1, Z2],
  asks,
  judgment: "声压幅值增加不代表能量被放大，界面还必须满足法向振速连续。",
  examplePlot: (p) => e361(p),
  engineering: engineering(
    "换能器封装层与水接触时，界面两侧的声压与法向振速必须连续。利用这两个条件求未知反射量，再校核封装层材料匹配。",
    "ultrasound",
    "超声无损检测",
  ),
});
