import { completeExamples } from "../calculationSteps";
import { e385 } from "../../plot/p3Examples";
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
const depth = { ...parameter("depth", "声源深度", "h", "m", 0.1, 3, 0.01), geometry: true };
const distance = parameter("distance", "水平距离", "x", "m", 0.5, 5, 0.01);
const boundary = { ...parameter("boundary", "软硬界面", "编号", "—", 0, 1, 1), integer: true };
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const amplitude = parameter("pa", "球面波幅度常数", "A", "Pa·m", 0.01, 200, 0.01);
const p = {
  rho: 1000,
  c: 1500,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  depth: 1,
  distance: 3,
  boundary: 0,
  receiverDepth: 2,
};
const asks = [
  ask(
    "path",
    "(1) 实源与虚源路径差",
    "m",
    "\\Delta r=\\sqrt{x^2+(y+h)^2}-\\sqrt{x^2+(y-h)^2}",
    "sqrt(distance^2+(receiverDepth+depth)^2)-sqrt(distance^2+(receiverDepth-depth)^2)",
    (p) =>
      Math.hypot(p.distance, p.receiverDepth + p.depth) -
      Math.hypot(p.distance, p.receiverDepth - p.depth),
    (p) =>
      [lectureFrequency, params.c, amplitude, depth, distance]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
  ask(
    "pressure",
    "(2) 合成声压幅值",
    "Pa",
    "|P|=A|e^{-jkr_1}/r_1+s e^{-jkr_2}/r_2|",
    "pa*abs(exp(-1i*2*pi*f/c*sqrt(distance^2+(receiverDepth-depth)^2))/sqrt(distance^2+(receiverDepth-depth)^2)+(2*boundary-1)*exp(-1i*2*pi*f/c*sqrt(distance^2+(receiverDepth+depth)^2))/sqrt(distance^2+(receiverDepth+depth)^2))",
    (p) =>
      phy.magnitude(
        phy.add(
          phy.polar(
            p.pa / Math.hypot(p.distance, p.receiverDepth - p.depth),
            ((-2 * Math.PI * p.f) / p.c) * Math.hypot(p.distance, p.receiverDepth - p.depth),
          ),
          phy.polar(
            ((2 * p.boundary - 1) * p.pa) / Math.hypot(p.distance, p.receiverDepth + p.depth),
            ((-2 * Math.PI * p.f) / p.c) * Math.hypot(p.distance, p.receiverDepth + p.depth),
          ),
        ),
      ),
    (p) =>
      [lectureFrequency, params.c, amplitude, depth, distance]
        .map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`)
        .join("，"),
  ),
];
const completedLecture = makeLecture("3.8.5", {
  defaults: p,
  parameters: [lectureFrequency, params.c, amplitude, depth, distance, boundary],

  keyPoints: [
    "镜像法用满足边界条件的虚源代替反射界面。",
    "水中近水面声源的软边界镜像反相，构成偶极子式声场。",
    "空气中近水面声源的硬边界镜像同相，构成同性极子声场。",
  ],
  formulas: [
    ...[
      "P=A(e^{-jkr_1}/r_1+s e^{-jkr_2}/r_2),\\quad s=-1\\ \\text{软界面},\\ s=1\\ \\text{硬界面}",
    ].map((tex, i) => ({
      number: `3.8.5-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.8.5-${i + 1 + 1}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    comparison(
      figure(
        "3.8.5-1",
        "软硬界面的实源、虚源与镜像叠加声场",
        (p, t) => radialFigure("3.8.5-1", p, t),
        1,
        1,
      ),
      ["distance"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
    figure(
      "3.8.5-2",
      "固定水平距离处的劳埃德镜干涉",
      (p, t) => radialFigure("3.8.5-2", p, t),
      1,
      1,
    ),
  ],
  answers: [
    "以界面另一侧的虚源叠加满足原区域边界条件，仅在实际介质区域解释真实声场。",
    "软边界近似下实源与虚源反相，呈偶极子性质。",
    "硬边界近似下虚源与实源同相，呈同性极子性质。",
  ],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　水中点声源深度 1 m，接收深度 2 m，水平距离 3 m，频率 1 kHz",
  background:
    "水中点声源深度 1 m，接收深度 2 m，水平距离 3 m，频率 1 kHz。以软界面镜像法求两条路径差和合成声压幅值。",
  exampleDefaults: { ...p, ...{} },
  given: [lectureFrequency, params.c, amplitude, depth, distance],
  asks,
  judgment: "反相镜像产生明显干涉，不能仅用实源的球面扩展预测接收声压。",
  examplePlot: (p) => e385(p),
  engineering: engineering(
    "近水面发射器与接收器会产生直达波和水面反射波干涉。镜像法给出两条声程，可用于预测接收深度变化引起的信号起伏。",
    "sonar",
    "海底观测站主动声呐",
  ),
});

export default completeExamples(completedLecture);
