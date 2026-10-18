import { completeExamples } from "../calculationSteps";
import { e342 } from "../../plot/p2Examples";
import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  curve,
  points,
  example,
  ask,
  engineering,
} from "../p2";
const obs = parameter("obs", "观察点位置", "x₁", "m", 0, 2, 0.01),
  bulk = parameter("bulk", "介质体积模量", "K", "GPa", 0.0001, 3, 0.0001);
const p = { ...defaults, obs: 0.25, bulk: 0.000142 };
const completedLecture = p2Lecture("3.4.2", {
  defaults: p,
  parameters: [params.pa, params.f, params.c, obs],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "谐和平面行波在理想均匀介质传播时，声压振幅和波形不变，只发生相位平移。",
    "周期、频率和角频率描述时间变化；波长和波数描述空间变化，距离造成相位落后。",
    "等相位面以介质声速前进，波长等于声速除以频率。",
    "介质压缩性影响传播速度：同密度下体积模量越大、可压缩性越小，声速越高。",
  ],
  formulas: [
    {
      number: "3.4.2-1",
      tex: String.raw`T=1/f,\quad\omega=2\pi f,\quad\lambda=c_0/f,\quad k=2\pi/\lambda,\quad\Delta\varphi=kx_1`,
      meaning: "拖动空间图或调节观察点，时间波形与相位读数同时变化。",
    },
    {
      number: "3.4.2-2",
      tex: String.raw`\omega t-kx=\mathrm{const}\Rightarrow dx/dt=\omega/k=c_0,\quad c_0=\sqrt{K_s/\rho_0}`,
      meaning: "压缩性通过体积模量决定声速，而非声压峰值决定。",
    },
  ],
  figures: [
    figure(
      "3.4.2-1",
      "固定位置的时间波形与固定时刻的空间波形",
      (p, t) => [
        graph(
          p,
          t,
          "固定观察点 x₁：标线间为一个周期",
          "时间 t (s)",
          "声压 p (Pa)",
          [0, 0.002],
          [-1.7 * p.pa, 1.7 * p.pa],
          [
            curve(
              "p(x₁,t)",
              (q) => p.pa * Math.cos(2 * Math.PI * (p.f * q - (p.f * p.obs) / p.c)),
              [0, 0.002],
              "linspace(0,.002,401)",
              "pa*cos(w*x-k*obs)",
            ),
          ],
          "",
          {
            annotations: [
              { axis: "x", value: 0, label: "0" },
              { axis: "x", value: 1 / p.f, label: "T" },
            ],
          },
          { annotations: ["0", "1/f"], ylim: "[-1.7 1.7]*pa" },
        ),
        graph(
          p,
          t,
          "固定时刻：标线间为一个波长",
          "位置 x (m)",
          "声压 p (Pa)",
          [0, 2],
          [-1.7 * p.pa, 1.7 * p.pa],
          [
            curve(
              "p(x,t)",
              (q) => p.pa * Math.cos(2 * Math.PI * (p.f * t - (p.f * q) / p.c)),
              [0, 2],
              "linspace(0,2,401)",
              "pa*cos(tau-k*x)",
            ),
            points(
              "观察点",
              [[p.obs, p.pa * Math.cos(2 * Math.PI * (p.f * t - (p.f * p.obs) / p.c))]],
              "obs",
              "pa*cos(tau-k*obs)",
              { style: "none", marker: "o" },
            ),
          ],
          "",
          {
            annotations: [
              { axis: "x", value: 0, label: "0" },
              { axis: "x", value: p.c / p.f, label: "λ" },
            ],
          },
          { annotations: ["0", "c/f"], ylim: "[-1.7 1.7]*pa" },
        ),
      ],
      1,
      2,
    ),
  ],
  readouts: (p) => [
    ["周期", 1000 / p.f, "ms"],
    ["波长", p.c / p.f, "m"],
    ["角频率", 2 * Math.PI * p.f, "rad/s"],
    ["观察点距离", p.obs, "m"],
    ["相位落后", (2 * Math.PI * p.f * p.obs) / p.c, "rad"],
  ],
  readoutModel: "[1000/f c/f w obs k*obs]",
  examples: [
    example(
      "例题　空气声波的时间与空间周期",
      "用 1000 Hz 信号检查空气声传播，声速为 343 m/s。求周期和波长，用于确定示波器时基与测点间距。",
      p,
      [params.f, params.c],
      [
        ask(
          "period",
          "(1) 周期",
          "ms",
          String.raw`T=1/f`,
          "1000/f",
          (p) => 1000 / p.f,
          (p) => `1000 ÷ ${p.f} Hz`,
        ),
        ask(
          "lambda",
          "(2) 波长",
          "m",
          String.raw`\lambda=c_0/f`,
          "c/f",
          (p) => p.c / p.f,
          (p) => `${p.c} m/s ÷ ${p.f} Hz`,
        ),
      ],
      () => "时域记录需覆盖多个周期，空间测点间距应结合波长选择。",
      (p) => e342(p),
    ),
  ],
  answers: [
    "在理想、均匀、无耗散的平面行波模型中保持不变。",
    "保持相位不变时，时间增加必须由位置增加抵消，所以采用正时间因子时正向波的空间因子为负。",
    "无频散介质中相速度就是声波传播速度。",
    "相同密度下可压缩性越小、体积模量越大，声速越高。",
  ],
  engineering: engineering(
    "声学阵列与时域测量必须同时满足时间和空间采样要求；只提高采样频率并不能补救过大的传感器间距。",
    "receiver",
    "水下监听接收器选型",
  ),
});

export default completeExamples(completedLecture);
