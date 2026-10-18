import { e3101 } from "../../plot/p3Examples";
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
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  h: 0.5,
  mode: 1,
};
const asks = [
  ask(
    "cutoff",
    "(1) 本阶截止频率",
    "Hz",
    "f_n=nc_0/(2h)",
    "mode*c/(2*h)",
    (p) => (p.mode * p.c) / (2 * p.h),
    (p) => [h].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "crossNumber",
    "(2) 横向波数",
    "rad/m",
    "k_x=n\\pi/h",
    "mode*pi/h",
    (p) => (p.mode * Math.PI) / p.h,
    (p) => [h].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.10.1", {
  defaults: p,
  parameters: [h],

  keyPoints: [
    "波导利用边界约束使声波主要沿不受限方向传播。",
    "平行平面层波导由两平行无限平面围成，绝对硬边界要求法向声压梯度为零。",
    "分离变量得到横向本征函数 $\\cos(n\\pi x/h)$，纵向波数由总波数与横向波数决定。",
  ],
  formulas: [
    ...[
      "\\partial_xP(0,z)=\\partial_xP(h,z)=0,\\quad P=\\sum_{n=0}^\\infty A_n\\cos(n\\pi x/h)e^{-jk_{zn}z}",
      "k_{zn}^2=k^2-(n\\pi/h)^2",
    ].map((tex, i) => ({
      number: `3.10.1-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.10.1-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.10.1-1",
      "平行刚性壁几何及前四阶横向本征函数",
      (p, t) => guideFigure("3.10.1", p, t),
      5,
      1,
    ),
  ],
  answers: [
    "在一个或多个方向受边界限制、沿其余方向传播波动的结构。",
    "两平行无限平面围成的层状传播区域。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气刚性平面层波导厚度为 0.5 m，声速为 343 m/s",
  background:
    "空气刚性平面层波导厚度为 0.5 m，声速为 343 m/s。求第一高阶模式的截止频率与横向波数。",
  exampleDefaults: { ...p, ...{} },
  given: [h],
  asks,
  judgment: "本题结果给出第一高阶截止频率；低于该频率时只有零阶模式可远距离传播。",
  examplePlot: (p) => e3101(p),
  engineering: engineering(
    "刚性通风管道的横向边界约束产生离散模态。由管道横向尺寸估算截止频率，是判断是否可用一维平面波模型的第一步。",
    "duct",
    "通风管道模态与反射",
  ),
});
