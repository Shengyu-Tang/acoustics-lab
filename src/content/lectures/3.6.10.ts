import { e3610 } from "../../plot/p3Examples";
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
const p = { rho: 1000, c: 343, c2: 1500, f: 1000, pa: 1, Z1: 415, Z2: 1500000.0, theta: 60 };
const asks = [
  ask(
    "critical",
    "(1) 临界角",
    "°",
    "\\theta_c=\\arcsin(c_1/c_2)",
    "asind(min(1,c/c2))",
    (p) => (Math.asin(Math.min(1, p.c / p.c2)) * 180) / Math.PI,
    (p) => [lectureFrequency].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "depthAnswer",
    "(2) 法向穿透深度",
    "m",
    "\\delta=\\frac{1}{\\sqrt{(k_1\\sin\\theta_i)^2-k_2^2}}",
    "p3Depth(theta,c,c2,f)",
    (p) =>
      1 /
      Math.sqrt(
        (((2 * Math.PI * p.f) / p.c) * Math.sin((p.theta * Math.PI) / 180)) ** 2 -
          ((2 * Math.PI * p.f) / p.c2) ** 2,
      ),
    (p) => [lectureFrequency].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.6.10", {
  defaults: p,
  parameters: [lectureFrequency, params.c, c2, theta, Z1, Z2, params.pa],

  keyPoints: [
    "全内反射时透射侧仍有非均匀平面波声场。",
    "波沿界面传播，沿法向的幅值按指数规律衰减。",
    "法向声压与振速处于正交相位，时间平均法向声能流为零，切向能流可不为零。",
  ],
  formulas: [
    ...[
      "P_t=C e^{-jk_1x\\sin\\theta_i}e^{-\\alpha y},\\quad \\alpha=\\sqrt{k_1^2\\sin^2\\theta_i-k_2^2}",
      "I_y=\\tfrac12\\Re(P_tU_y^*)=0,\\quad I_x=\\frac{k_1\\sin\\theta_i}{2\\rho_2\\omega}|P_t|^2",
    ].map((tex, i) => ({
      number: `3.6.10-${i + 1}`,
      tex,
      meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
    })),
    ...asks.map((a, i) => ({
      number: `3.6.10-${i + 1 + 2}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.6.10-1",
      "全内反射时透射侧的倏逝声场与切向能流",
      (p, t) => obliqueFigure("3.6.10-1", p, t),
      1,
      1,
    ),
    comparison(
      figure("3.6.10-2", "穿透深度随入射角变化", (p, t) => obliqueFigure("3.6.10-2", p, t), 1, 1),
      ["theta", "Z1", "Z2", "pa"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
  ],
  answers: ["有声场：切向传播而法向指数衰减；平均法向声功率为零。"],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle: "例题　空气声以 60° 入射水面，频率为 1 kHz",
  background: "空气声以 60° 入射水面，频率为 1 kHz。求临界角与幅值降到原值 1/e 的法向深度。",
  exampleDefaults: { ...p, ...{} },
  given: [lectureFrequency],
  asks,
  judgment: "本题远高于临界角，水中只有界面附近的倏逝场，不能用传播折射角解释。",
  examplePlot: (p) => e3610(p),
  engineering: engineering(
    "全内反射附近的界面探测利用倏逝场对邻近介质敏感的特点。接收器离开界面后幅值迅速降低，法向穿透深度决定有效探测范围。",
    "ultrasound",
    "超声无损检测",
  ),
});
