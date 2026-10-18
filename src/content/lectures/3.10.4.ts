import { completeExamples } from "../calculationSteps";
import { e3104 } from "../../plot/p3Examples";
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
  f: 1200,
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
    (p) => [lectureFrequency].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "inclination",
    "(2) 平面波与纵轴夹角",
    "°",
    "\\sin\\theta_n=nc_0/(2hf)",
    "p3ModeAngle(mode,c,h,f)",
    (p) => phy.guideMode(p.mode, p.f, p.h, p.c).theta,
    (p) => [lectureFrequency].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
const completedLecture = makeLecture("3.10.4", {
  defaults: p,
  parameters: [h, params.c, lectureFrequency, mode],

  keyPoints: [
    "各阶简正波沿截面的幅值服从对应横向本征函数，高阶幅值分布不均匀。",
    "每个传播简正波可以分解为两列横向波数相反的斜行平面波。",
    "阶数越高斜行角越大；同阶模式的频率升高时，传播方向更接近波导纵轴。",
  ],
  formulas: [
    ...[
      "\\cos(k_xx)e^{-jk_zz}=\\tfrac12[e^{-j(k_zz+k_xx)}+e^{-j(k_zz-k_xx)}]",
      "\\sin\\theta_n=k_x/k=nc_0/(2hf)",
    ].map((tex, i) => ({
      number: `3.10.4-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.10.4-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.10.4-1", "两列斜行平面波及其叠加简正波", (p, t) => guideFigure("3.10.4", p, t), 3, 1),
  ],
  answers: [
    "零阶均匀，高阶按余弦函数分布且可有横向波节。",
    "不同，夹角由阶数、层厚、频率和声速共同决定。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气波导层厚为 0.5 m，第二阶模式以 1200 Hz 传播",
  background:
    "空气波导层厚为 0.5 m，第二阶模式以 1200 Hz 传播。求该阶截止频率和斜平面波与纵轴夹角。",
  exampleDefaults: { ...p, ...{} },
  given: [{ ...lectureFrequency, min: 800, max: 2000 }],
  asks,
  judgment: (p) => `当前斜行角 ${asks[1].calc(p).toPrecision(4)}°；提高同阶频率会减小传播角。`,
  examplePlot: (p) => e3104(p),
  engineering: engineering(
    "简正波的斜平面波分解把模态传播与几何声线联系起来。阶数、频率或层厚改变时，折返声线角度随之改变，影响壁面相互作用次数。",
    "duct",
    "通风管道模态与反射",
  ),
});

export default completeExamples(completedLecture);
