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
  answerCurve,
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
};
const asks = [
  ask(
    "reflect",
    "(1) 反射系数模值",
    "—",
    "|R_p|=\\left|\\frac{z_n-1}{z_n+1}\\right|",
    "abs((res-1+1i*react)/(res+1+1i*react))",
    (p) => phy.surfaceReflection(p.res, p.react).r,
    (p) => [res, react].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "standingRatio",
    "(2) 驻波比",
    "—",
    "G=\\frac{1+|R_p|}{1-|R_p|}",
    "(1+abs((res-1+1i*react)/(res+1+1i*react)))/(1-abs((res-1+1i*react)/(res+1+1i*react)))",
    (p) => phy.surfaceReflection(p.res, p.react).G,
    (p) => [res, react].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.7.1", {
  defaults: p,
  parameters: [res, react, lectureFrequency, params.c, params.pa],

  keyPoints: [
    "局部作用表面的法向声阻抗率是表面声压与指向表面法向振速的比值。",
    "纯驻波的波节幅值为零，一般驻波波节仍有非零幅值。",
    "驻波比为波腹与波节声压幅值之比；一般驻波的局部波阻抗是复数。",
  ],
  formulas: [
    ...[
      "Z_n=P/U_n,\\quad R_p=(Z_n-\\rho_0c_0)/(Z_n+\\rho_0c_0)",
      "P(d)=A(e^{jkd}+R_pe^{-jkd}),\\quad Z_a(d)=\\rho_0c_0\\frac{e^{jkd}+R_pe^{-jkd}}{e^{jkd}-R_pe^{-jkd}}",
    ].map((tex, i) => ({
      number: `3.7.1-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.7.1-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure("3.7.1-1", "复反射系数与一般驻波声压包络", (p, t) => surfaceFigure("3.7.1", p, t), 2, 1),
  ],
  answers: [
    "波腹幅值最大、波节幅值为零，位置不随时间移动。",
    "位置固定，波节幅值一般不为零。",
    "表面某点的法向振速只取决于该点的声压。",
    "波腹与波节的声压幅值之比。",
    "表面声压与指向表面的法向振速之比。",
    "不同；一般驻波局部波阻抗为复数且随位置改变，行波波阻抗为常实数。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　吸声材料的归一化法向阻抗为 2+j",
  background: "吸声材料的归一化法向阻抗为 2+j。求反射系数模值和驻波比，供阻抗管测量核对。",
  exampleDefaults: { ...p, ...{} },
  given: [res, react],
  asks,
  judgment: "根据反射模值和驻波比区分匹配、一般驻波和纯驻波，复阻抗还决定波节位置。",
  examplePlot: (p) =>
    answerCurve(
      p,
      "res",
      "归一化声阻",
      "—",
      (p) => phy.surfaceReflection(p.res, p.react).G,
      "(1+abs((x-1+1i*react)/(x+1+1i*react)))/(1-abs((x-1+1i*react)/(x+1+1i*react)))",
    ),
  engineering: engineering(
    "通风管道和阻抗管通过驻波测量材料的法向声阻抗。反射系数的模决定驻波起伏，反射相角决定波节相对材料表面的位置。",
    "hall",
    "交通枢纽语音清晰度",
  ),
});
