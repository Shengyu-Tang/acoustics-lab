import { completeExamples } from "../calculationSteps";
import { e372 } from "../../plot/p3Examples";
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
import { surfaceFigure } from "../../plot/p3Surface";
const res = parameter("res", "归一化声阻", "Re Zₙ/ρc", "—", 0.05, 5, 0.01);
const react = parameter("react", "归一化声抗", "Im Zₙ/ρc", "—", -4, 4, 0.01);
const probe = parameter("probe", "探管位置", "d", "m", 0, 2, 0.001);
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1.21,
  c: 343,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  res: 2,
  react: 1,
  probe: 0.18,
};
const asks = [
  ask(
    "standingRatio",
    "(2) 驻波比",
    "—",
    "G=\\frac{1+|R_p|}{1-|R_p|}",
    "(1+abs((res-1+1i*react)/(res+1+1i*react)))/(1-abs((res-1+1i*react)/(res+1+1i*react)))",
    (p) => phy.surfaceReflection(p.res, p.react).G,
    (p) => [res, react].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "absorption",
    "(2) 吸声系数",
    "—",
    "\\alpha=1-|R_p|^2",
    "1-abs((res-1+1i*react)/(res+1+1i*react))^2",
    (p) => phy.surfaceReflection(p.res, p.react).alpha,
    (p) => [res, react].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
const completedLecture = makeLecture("3.7.2", {
  defaults: p,
  parameters: [res, react, lectureFrequency, params.c, params.pa, probe],

  interactive: {
    steps: [
      { tex: "G=p_{max}/p_{min}", text: "移动探管，记录波腹和波节声压幅值。" },
      { tex: "|R_p|=(G-1)/(G+1)", text: "用最大和最小声压幅值反演反射模值。" },
      { tex: "arg R_p=2kd_{min}-π", text: "记录距表面的第一个极小点，以此确定反射相角。" },
      {
        tex: "z_n=(1+R_p)/(1-R_p)",
        text: "再求吸声系数与法向声阻抗率；例题给出正向校准结果供核对。",
      },
    ],
  },

  measurements: [
    {
      name: "最大声压",
      unit: "Pa",
      matlab: "pa*(1+abs(Rs))",
      calc: (p) => p.pa * (1 + phy.surfaceReflection(p.res, p.react).r),
    },
    {
      name: "最小声压",
      unit: "Pa",
      matlab: "pa*(1-abs(Rs))",
      calc: (p) => p.pa * (1 - phy.surfaceReflection(p.res, p.react).r),
    },
    {
      name: "第一极小点距离",
      unit: "m",
      matlab: "mod(angle(Rs)+pi,2*pi)/(4*pi*f/c)",
      calc: (p) =>
        ((phy.surfaceReflection(p.res, p.react).phi + Math.PI) % (2 * Math.PI)) /
        ((4 * Math.PI * p.f) / p.c),
    },
    {
      name: "反射相角",
      unit: "°",
      matlab: "angle(Rs)*180/pi",
      calc: (p) => (phy.surfaceReflection(p.res, p.react).phi * 180) / Math.PI,
    },
    {
      name: "驻波比",
      unit: "—",
      matlab: "(1+abs(Rs))/(1-abs(Rs))",
      calc: (p) => phy.surfaceReflection(p.res, p.react).G,
    },
    {
      name: "吸声系数",
      unit: "—",
      matlab: "1-abs(Rs)^2",
      calc: (p) => phy.surfaceReflection(p.res, p.react).alpha,
    },
    { name: "法向声阻", unit: "Pa·s/m", matlab: "res*rho*c", calc: (p) => p.res * p.rho * p.c },
    { name: "法向声抗", unit: "Pa·s/m", matlab: "react*rho*c", calc: (p) => p.react * p.rho * p.c },
  ],
  keyPoints: [
    "一般驻波可分解为剩余行波与纯驻波之和。",
    "相邻波节和相邻波腹间距均为半波长，波节与相邻波腹相距四分之一波长。",
    "驻波管测得驻波比和第一极小点位置，可反演反射系数的模与相角、吸声系数及法向声阻抗率。",
  ],
  formulas: [
    ...[
      "P=A[(1-|R_p|)e^{jkd}+|R_p|e^{jkd}+R_pe^{-jkd}]",
      "|R_p|=\\frac{G-1}{G+1},\\quad\\arg R_p=2kd_{\\min}-\\pi\\pmod{2\\pi}",
      "Z_n=\\rho_0c_0\\frac{1+R_p}{1-R_p},\\quad\\alpha=1-|R_p|^2",
    ].map((tex, i) => ({
      number: `3.7.2-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.7.2-${i + 1 + 3}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    comparison(
      figure(
        "3.7.2-1",
        "一般驻波分解为剩余行波与纯驻波",
        (p, t) => surfaceFigure("3.7.2-1", p, t),
        3,
        1,
      ),
      ["probe"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
    figure(
      "3.7.2-2",
      "移动探管测量极大值、极小值和第一极小点",
      (p, t) => surfaceFigure("3.7.2-2", p, t),
      1,
      1,
    ),
  ],
  answers: [
    "相邻波节间距为半波长。",
    "相邻波腹间距为半波长。",
    "由 $G$ 求 $|R_p|=(G-1)/(G+1)$，由第一极小点距离求反射相角，再以 $z_n=(1+R_p)/(1-R_p)$ 和 $\\alpha=1-|R_p|^2$ 求材料参数。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　阻抗管被测材料的归一化阻抗为 2+j，频率为 1 kHz",
  background:
    "阻抗管被测材料的归一化阻抗为 2+j，频率为 1 kHz。求应测得的驻波比和吸声系数，并用第一极小点位置反演复阻抗。",
  exampleDefaults: { ...p, ...{} },
  given: [res, react],
  asks,
  judgment: (p) =>
    `当前吸声系数 ${asks[1].calc(p).toPrecision(4)}；还需测得第一极小点位置以恢复阻抗相角。`,
  examplePlot: (p) => e372(p),
  engineering: engineering(
    "实验中沿管道移动探管，测得最大、最小声压及第一个极小点位置。由此反演反射系数、吸声系数与法向阻抗，为吸声材料选择提供数据。",
    "hall",
    "交通枢纽语音清晰度",
  ),
});

export default completeExamples(completedLecture);
