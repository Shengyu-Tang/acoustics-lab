import { e3102 } from "../../plot/p3Examples";
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
const v0 = parameter("v0", "源振速峰值", "v₀", "m/s", 0.001, 0.1, 0.001);
const sourceType = {
  ...parameter("sourceType", "源分布类型", "编号", "—", 0, 2, 1),
  integer: true,
};
const offset = parameter("offset", "偏置中心比例", "x₀/h", "—", 0.1, 0.9, 0.01);
const width = parameter("width", "源宽度比例", "b/h", "—", 0.05, 0.5, 0.01);
const a1 = parameter("a1", "自定义一阶系数", "b₁", "—", -0.8, 0.8, 0.01);
const a2 = parameter("a2", "自定义二阶系数", "b₂", "—", -0.8, 0.8, 0.01);
const a3 = parameter("a3", "自定义三阶系数", "b₃", "—", -0.8, 0.8, 0.01);
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1.21,
  c: 343,
  c2: 343,
  f: 1200,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  h: 0.5,
  mode: 0,
  v0: 0.01,
  sourceType: 0,
  offset: 0.3,
  width: 0.18,
  a1: 0.4,
  a2: -0.2,
  a3: 0.1,
};
const asks = [
  ask(
    "planePressure",
    "(1) 均匀源激发的平面波声压峰值",
    "Pa",
    "p_a=\\rho_0c_0v_0",
    "rho*c*v0",
    (p) => p.rho * p.c * p.v0,
    (p) =>
      [v0, params.rho, params.c, h].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "firstCutoff",
    "(2) 第一高阶截止频率",
    "Hz",
    "f_1=c_0/(2h)",
    "c/(2*h)",
    (p) => p.c / (2 * p.h),
    (p) =>
      [v0, params.rho, params.c, h].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.10.2", {
  defaults: p,
  parameters: [
    h,
    params.c,
    lectureFrequency,
    params.rho,
    v0,
    sourceType,
    offset,
    width,
    a1,
    a2,
    a3,
  ],
  interactive: {
    selectors: [
      { key: "sourceType", label: "源分布", options: ["均匀", "偏置高斯", "自定义余弦叠加"] },
    ],
  },

  keyPoints: [
    "两平行绝对硬边界要求横向法向振速均为零。",
    "源的截面振速分布通过本征函数正交展开确定各阶激励系数。",
    "与截面同形且振速均匀的面源只激发零阶平面行波，高阶模态系数为零。",
  ],
  formulas: [
    ...[
      "v(x)=\\sum b_n\\cos(n\\pi x/h),\\quad A_n=\\rho_0\\omega b_n/k_{zn}",
      "v(x)=v_0\\Longrightarrow b_0=v_0,\\ b_{n>0}=0,\\quad P=\\rho_0c_0v_0e^{-jkz}",
    ].map((tex, i) => ({
      number: `3.10.2-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.10.2-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.10.2-1",
      "源振速分布、模态系数和合成声场",
      (p, t) => guideFigure("3.10.2", p, t),
      3,
      1,
    ),
  ],
  answers: [
    "$\\partial p/\\partial x=0$ 分别在 $x=0,h$ 成立。",
    "只有零阶均匀平面行波，高阶源展开系数为零。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气波导层厚为 0.5 m，均匀面源振速峰值为 0.01 m/s",
  background:
    "空气波导层厚为 0.5 m，均匀面源振速峰值为 0.01 m/s。求平面波声压峰值及第一高阶截止频率。",
  exampleDefaults: { ...p, ...{} },
  given: [v0, params.rho, params.c, h],
  asks,
  judgment: "理想均匀面源只激发零阶平面波；实际源偏置或振速不均匀会引入高阶模式。",
  examplePlot: (p) => e3102(p),
  engineering: engineering(
    "管道扬声器的振速分布会决定激发哪些模态。尽量均匀覆盖截面可减少高阶模式，局部偏置激励则可用于主动模态控制。",
    "duct",
    "通风管道模态与反射",
  ),
});
