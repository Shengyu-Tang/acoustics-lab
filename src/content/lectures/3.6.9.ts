import { completeExamples } from "../calculationSteps";
import { e369 } from "../../plot/p3Examples";
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
const scenario = { ...parameter("scenario", "介质条件", "编号", "—", 0, 3, 1), integer: true };
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1000,
  c: 1000,
  c2: 1500,
  f: 1000,
  pa: 1,
  Z1: 1000000.0,
  Z2: 500000.0,
  theta: 30,
  scenario: 0,
};
const asks = [
  ask(
    "critical",
    "(1) 临界角",
    "°",
    "\\theta_c=\\arcsin(c_1/c_2)",
    "asind(min(1,c/c2))",
    (p) => (Math.asin(Math.min(1, p.c / p.c2)) * 180) / Math.PI,
    (p) => [Z1].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "full",
    "(2) 全透射角",
    "°",
    "\\theta_0=\\arcsin\\sqrt{\\frac{Z_1^2-Z_2^2}{Z_1^2(c_2/c_1)^2-Z_2^2}}",
    "asind(sqrt((Z1^2-Z2^2)/(Z1^2*(c2/c)^2-Z2^2)))",
    (p) => phy.interfaceAngles(p.Z1, p.Z2, p.c, p.c2).brewster,
    (p) => [Z1].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
const completedLecture = makeLecture("3.6.9", {
  defaults: p,
  parameters: [scenario],

  interactive: {
    selectors: [
      {
        key: "scenario",
        label: "介质存在条件",
        options: [
          "有临界角、有全透射角",
          "有临界角、无全透射角",
          "无临界角、有全透射角",
          "两者均无",
        ],
      },
    ],
  },

  measurements: [
    {
      name: "临界角",
      unit: "°",
      matlab: "p3Critical(c,c2)",
      calc: (p) => phy.interfaceAngles(1, 1, 1, [1.5, 1.5, 0.7, 0.7][p.scenario]).critical,
    },
    {
      name: "全透射角",
      unit: "°",
      matlab: "p3Brewster(Z1,Z2,c,c2)",
      calc: (p) =>
        phy.interfaceAngles(1, [0.5, 2, 2, 0.5][p.scenario], 1, [1.5, 1.5, 0.7, 0.7][p.scenario])
          .brewster,
    },
  ],

  keyPoints: [
    "全透射要求声压反射系数为零，存在性同时受声速比与阻抗比限制。",
    "透射侧声速大于入射侧才有临界角；超过临界角发生全内反射。",
    "全内反射时反射系数模值为一，透射侧可存在法向衰减的倏逝波。",
  ],
  formulas: [
    ...[
      "R_p=0\\Longleftrightarrow Z_2\\cos\\theta_i=Z_1\\cos\\theta_t",
      "c_2>c_1,\\quad\\theta_i>\\arcsin(c_1/c_2)\\Longrightarrow |R_p|=1",
    ].map((tex, i) => ({
      number: `3.6.9-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.9-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.6.9-1",
      "全透射角、临界角及四种存在条件",
      (p, t) => obliqueFigure("3.6.9", p, t),
      1,
      1,
    ),
  ],
  answers: [
    "反射声压为零称全透射；严格角度与介质条件较苛刻，实际宽带声束难以完全满足。",
    "入射角大于临界角时没有向透射介质远处传播的法向声功率，反射功率等于入射功率。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle:
    "例题　声速为 1000 与 1500 m/s、阻抗为 1×10⁶ 与 5×10⁵ $\\mathrm{Pa\\cdot s/m}$ 的两种流体",
  background:
    "声速为 1000 与 1500 m/s、阻抗为 1×10⁶ 与 5×10⁵ $\\mathrm{Pa\\cdot s/m}$ 的两种流体。求临界角和全透射角。",
  exampleDefaults: { ...p, ...{} },
  given: [{ ...Z1, min: 800000, max: 1200000 }],
  asks,
  judgment: (p) =>
    `当前临界角 ${asks[0].calc(p).toPrecision(4)}°，全透射角 ${asks[1].calc(p).toPrecision(4)}°；两个角的机制不同。`,
  examplePlot: (p) => e369(p),
  engineering: engineering(
    "声透镜和分层介质测量需要区分全透射与全内反射。只有满足对应介质条件时才使用该特征角，不能将其作为任何界面的通用角度。",
    "ultrasound",
    "超声无损检测",
  ),
});

export default completeExamples(completedLecture);
