import { e391 } from "../../plot/p3Examples";
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
const argument = parameter("argument", "无量纲观察距离", "kr", "—", 0.1, 20, 0.1);
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1000,
  c: 1500,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  argument: 10,
};
const asks = [
  ask(
    "firstKind",
    "(1) 第一类零阶柱函数",
    "—",
    "J_0(z)",
    "besselj(0,argument)",
    (p) => phy.cylindricalBessel(p.argument).J0,
    (p) => [argument].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "secondKind",
    "(2) 第二类零阶柱函数",
    "—",
    "N_0(z)=Y_0(z)",
    "bessely(0,argument)",
    (p) => phy.cylindricalBessel(p.argument).Y0,
    (p) => [argument].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.9.1", {
  defaults: p,
  parameters: [argument],

  keyPoints: [
    "柱面波的等相位面是同轴圆柱面，均匀柱面波仅依赖径向距离。",
    "零阶贝塞尔方程的实解是第一类和第二类柱函数。",
    "汉克尔函数组合表示收敛、扩张柱面行波，单独实柱函数表示驻波；远场幅度按半径平方根反比衰减。",
  ],
  formulas: [
    ...[
      "P_{rr}+r^{-1}P_r+k^2P=0,\\quad P=CJ_0(kr)+DN_0(kr)",
      "H_0^{(1,2)}=J_0\\pm jN_0,\\quad H_0^{(2)}(kr)\\sim\\sqrt{2/(\\pi kr)}e^{-j(kr-\\pi/4)}",
    ].map((tex, i) => ({
      number: `3.9.1-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.9.1-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.9.1-1",
      "第一、第二类零阶贝塞尔函数与远场渐近式",
      (p, t) => radialFigure("3.9.1", p, t),
      1,
      1,
    ),
  ],
  answers: ["等相位面为同轴圆柱面的波。", "第一类、第二类贝塞尔函数及它们组成的汉克尔函数。"],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　一条长线声源在观测位置满足无量纲距离为 10",
  background:
    "水中 1 kHz 长线声源，在半径约 2.39 m 的观测位置满足无量纲距离约为 10。求两类零阶柱函数，用于构造扩张柱面波。",
  exampleDefaults: { ...p, ...{} },
  given: [argument],
  asks,
  judgment: "近轴区域应使用精确柱函数，远场才可用渐近正余弦估计声场。",
  examplePlot: (p) => e391(p),
  engineering: engineering(
    "长线声源在远离端部的位置可近似为柱面辐射。精确柱函数用于近场，渐近正余弦用于远场估算，两者需要按无量纲距离选择。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
