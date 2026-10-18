import { completeExamples } from "../calculationSteps";
import { e345 } from "../../plot/p2Examples";
import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  curve,
  example,
  ask,
  engineering,
} from "../p2";
import { pulse } from "../../physics/chapter3";
const p = {
  ...defaults,
  shape: 0,
  B: 0.3,
  L: 10,
  duration: 0.5,
  ...Object.fromEntries([0, 0.3, 1, 0.2, -0.5, 0, 0, 0, 0].map((v, i) => [`h${i}`, v])),
};
const B = parameter("B", "反向波峰值系数", "B", "Pa", 0, 2, 0.01),
  L = parameter("L", "传播距离", "L", "m", 1, 100, 1),
  duration = parameter("duration", "脉冲持续时间", "τ", "ms", 0.01, 10, 0.01);
const model =
  "H=[h0 h1 h2 h3 h4 h5 h6 h7 h8];if shape==0,pulseShape=@(q)exp(-((q-.6)/.12).^2);elseif shape==1,pulseShape=@(q)max(0,1-abs((q-.6)/.2));else,pulseShape=@(q)interp1(0:.25:2,H,q,'linear',0);end;";
const waveform = (p: Record<string, number>, s: number) =>
  pulse(
    s,
    p.shape,
    Array.from({ length: 9 }, (_, i) => p[`h${i}`]),
  );
const completedLecture = p2Lecture("3.4.5", {
  defaults: p,
  parameters: [params.pa, B, params.f, params.c],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  interactive: {
    sketch: true,
    selectors: [{ key: "shape", label: "初始波形", options: ["高斯脉冲", "三角脉冲", "手绘"] }],
  },
  keyPoints: [
    "平面波不必是简谐波；达朗贝尔解由两个任意波形分别向正向和负向平移组成。",
    "在理想均匀无频散介质中，单向平面波的振幅和波形保持不变，波阵面以介质声速传播。",
    "单向波的声压与振速波形相同，正向波比值为特性阻抗，负向波振速反号；叠加场要分别计算两个方向。",
  ],
  formulas: [
    {
      number: "3.4.5-1",
      tex: String.raw`p(x,t)=f_1(x-c_0t)+f_2(x+c_0t),\quad u(x,t)=\frac{f_1(x-c_0t)-f_2(x+c_0t)}{\rho_0c_0}`,
      meaning: "对函数求导可直接验证一维波动方程，任意波形的理想传播不需要拆成单频。",
    },
  ],
  figures: [
    figure(
      "3.4.5-1",
      "任意波形的平移与反向波叠加",
      (p, t) => [
        graph(
          p,
          t,
          "初始波形：手绘模式下可在图中拖动",
          "初始位置 x (m)",
          "归一化初始波形（—）",
          [0, 2],
          [-1.5, 1.5],
          [
            curve(
              "初始波形",
              (x) => waveform(p, (x * p.f) / p.c),
              [0, 2],
              "linspace(0,2,max(401,ceil(64*f/c)+1))",
              "pulseShape(k*x/(2*pi))",
              "-",
              Math.max(401, Math.ceil((64 * p.f) / p.c) + 1),
            ),
          ],
          model,
        ),
        graph(
          p,
          t,
          "波形保持不变，正反向波独立平移",
          "位置 x (m)",
          "声压 p (Pa)",
          [0, 4],
          [-1.6 * (p.pa + p.B), 1.6 * (p.pa + p.B)],
          [
            curve(
              "向右传播",
              (x) => p.pa * waveform(p, (x * p.f) / p.c - p.f * t),
              [0, 4],
              "linspace(0,4,max(401,ceil(128*f/c)+1))",
              "pa*pulseShape(k*x/(2*pi)-f*tView)",
              "--",
              Math.max(401, Math.ceil((128 * p.f) / p.c) + 1),
            ),
            curve(
              "向左传播",
              (x) => p.B * waveform(p, 4 - (x * p.f) / p.c - p.f * t),
              [0, 4],
              "linspace(0,4,max(401,ceil(128*f/c)+1))",
              "B*pulseShape(4-k*x/(2*pi)-f*tView)",
              ":",
              Math.max(401, Math.ceil((128 * p.f) / p.c) + 1),
            ),
            curve(
              "合成声压",
              (x) =>
                p.pa * waveform(p, (x * p.f) / p.c - p.f * t) +
                p.B * waveform(p, 4 - (x * p.f) / p.c - p.f * t),
              [0, 4],
              "linspace(0,4,max(401,ceil(128*f/c)+1))",
              "pa*pulseShape(k*x/(2*pi)-f*tView)+B*pulseShape(4-k*x/(2*pi)-f*tView)",
              "-",
              Math.max(401, Math.ceil((128 * p.f) / p.c) + 1),
            ),
          ],
          model,
          {},
          { ylim: "[-1.6 1.6]*(pa+B)" },
        ),
      ],
      2,
    ),
  ],
  readouts: (p) => [
    ["传播速度", p.c, "m/s"],
    ["空间标尺 λ", p.c / p.f, "m"],
    ["正向波阻抗", p.rho * p.c, "Pa·s/m"],
  ],
  readoutModel: "[c c/f Z]",
  examples: [
    example(
      "例题　水声脉冲的长度与到达时间",
      "水下设备发出持续 0.5 ms 的脉冲，接收点相距 10 m，声速 1500 m/s。求脉冲空间长度和首达时间，用于设置接收门。",
      { ...p, c: 1500 },
      [duration, L, params.c],
      [
        ask(
          "length",
          "(1) 脉冲空间长度",
          "m",
          String.raw`\ell=c_0\tau`,
          "c*duration/1000",
          (p) => (p.c * p.duration) / 1000,
          (p) => `${p.c} m/s × ${p.duration} ms ÷ 1000`,
        ),
        ask(
          "arrival",
          "(2) 首达时间",
          "ms",
          String.raw`t=L/c_0`,
          "1000*L/c",
          (p) => (1000 * p.L) / p.c,
          (p) => `${p.L} m ÷ ${p.c} m/s × 1000`,
        ),
      ],
      () => "接收门从首达时间前开启，并覆盖脉冲持续时间及系统时延。",
      (p) => e345(p),
    ),
  ],
  answers: [
    "不限于简谐波，脉冲或任意满足条件的形状都可以是平面波。",
    "理想无频散均匀介质中以介质声速传播。",
    "单向理想平面波保持波形和幅度；叠加声场在固定位置可以表现出形状变化。",
    "单向波相同，正向波振速等于声压除以特性阻抗，反向波多一个负号。",
  ],
  engineering: engineering(
    "水声脉冲的空间长度决定目标回波的时间分离能力；实际水中吸收、频散与多径可能改变接收波形。",
    "sonar",
    "海底观测站主动声呐",
  ),
});

export default completeExamples(completedLecture);
