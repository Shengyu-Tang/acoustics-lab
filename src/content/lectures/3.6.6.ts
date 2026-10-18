import { e366 } from "../../plot/p3Examples";
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
    "nodeGap",
    "(1) 相邻声压波节间距",
    "m",
    "\\Delta d=\\lambda/2=c_0/(2f)",
    "c/(2*f)",
    (p) => p.c / (2 * p.f),
    (p) =>
      [lectureFrequency, params.c, params.pa, Z1]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "umax",
    "(2) 界面振速峰值",
    "m/s",
    "u_a(0)=2p_i/Z_1",
    "2*pa/Z1",
    (p) => (2 * p.pa) / p.Z1,
    (p) =>
      [lectureFrequency, params.c, params.pa, Z1]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
export default makeLecture("3.6.6", {
  defaults: p,
  parameters: [lectureFrequency, params.c, params.pa, Z1],

  keyPoints: [
    "绝对软边界使声波全部反射且声压反相，入射侧形成纯驻波。",
    "界面声压为零、振速为入射振速的两倍；声压波节对应振速波腹。",
    "声压与振速时间相位相差四分之一周期；驻波平均声强为零，但声能密度不为零。",
  ],
  formulas: [
    ...[
      "p(d,t)=-2A\\sin(kd)\\sin\\omega t,\\quad u_n(d,t)=2A\\cos(kd)\\cos\\omega t/Z_1",
      "E_0=\\rho_0u^2/2+p^2/(2\\rho_0c_0^2),\\quad I=\\langle pu\\rangle=0",
    ].map((tex, i) => ({
      number: `3.6.6-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.6-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.6.6-1",
      "绝对软边界前声压与振速的驻波分布",
      (p, t) => normalFigure("3.6.6-1", p, t),
      2,
      1,
    ),
    figure(
      "3.6.6-2",
      "纯驻波的能量密度与零平均声强",
      (p, t) => normalFigure("3.6.6-2", p, t),
      1,
      1,
    ),
  ],
  answers: [
    "水中入射水面近似绝对软界面。",
    "空气入射水面近似绝对硬界面。",
    "幅值最大的固定位置为波腹，幅值为零的位置为纯驻波波节。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　1 kHz 水声波的入射声压峰值为 1 Pa",
  background: "1 kHz 水声波的入射声压峰值为 1 Pa。近似水面为绝对软边界，求波节间距和界面振速峰值。",
  exampleDefaults: { ...p, ...{} },
  given: [lectureFrequency, params.c, params.pa, Z1],
  asks,
  judgment: "水面处声压为波节而振速为波腹，水听器贴近水面可能低估入射信号。",
  examplePlot: (p) => e366(p),
  engineering: engineering(
    "靠近水面的水听器会受到反相反射影响。布放深度应避开目标频率附近的声压波节，声压低谷并不说明介质中没有声能。",
    "ultrasound",
    "超声无损检测",
  ),
});
