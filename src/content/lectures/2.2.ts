import { lecture, parameter, fmt } from "../p1";
import {
  stringSpeed,
  stringFrequency,
  pluckCoefficient,
  pluckWave,
  quarterFrequency,
} from "../../physics/chapter2";
import { panel, line, extent, working, endSeries } from "../../plot/p1Helpers";
import { sample } from "../../plot/types";
const tension = parameter("T", "张力", "T", "N", 20, 300, 1),
  density = parameter("mu", "线密度", "ρ_l", "kg/m", 0.0001, 0.005, 0.0001),
  length = parameter("L", "有效弦长", "L", "m", 0.3, 1.5, 0.01);
const defaults = { T: 70, mu: 0.0004, L: 0.65, height: 0.004, pluck: 0.3, F0: 0.05, target: 440 };
export default lecture(
  "2.2",
  [
    "自由振动是撤去持续外力后，由初始位移和速度激发的振动，可分解为各阶简正振动。",
    "稳态振动是持续谐和力驱动下，以外力频率振动的响应；理想无阻尼模型在共振点没有有限稳态幅值。",
    "固有频率由波速、长度和边界条件共同决定。两端固定弦 $f_n = nc/(2L)$，固定—自由端共振序列为 $(2n-1)c/(4L)$。",
  ],
  {
    defaults,
    parameters: [
      tension,
      density,
      length,
      parameter("height", "拨弦高度", "h", "m", 0.001, 0.01, 0.001),
      parameter("pluck", "拨点位置", "x_p/L", "—", 0.1, 0.9, 0.01),
      parameter("F0", "端点力幅值", "F₀", "N", 0.01, 0.2, 0.01),
    ],
    controls: "pluck",
    animation: true,
    animationPeriod: (p) => (2 * p.L) / stringSpeed(p.T, p.mu),
    keyPoints: [
      "弦的自由振动由初始条件激发；两端固定弦的固有频率构成整数倍谐频，振型为正弦函数。",
      "简正振动是单一振型以自身固有频率振动；任意初始形状可作模态叠加。",
      "拨点位置决定各阶系数，中点拨弦不激发偶数阶。",
      "弦的稳态振动与持续谐和外力同频；固定—力激励边界的共振频率为奇数倍四分之一波长频率，与两端固定序列不同。",
    ],
    formulas: [
      {
        number: "2.2-1",
        tex: String.raw`y_n(x,t)=b_n\sin(n\pi x/L)\cos\omega_nt,\quad f_n=nc/(2L)`,
        meaning: "波节位置为 $x = jL/n,\\quad j = 0,\\ldots,n$。",
      },
      {
        number: "2.2-2",
        tex: String.raw`b_n=\frac{2h\sin(n\pi\alpha)}{n^2\pi^2\alpha(1-\alpha)},\quad \alpha=x_p/L`,
        meaning: "三角形拨弦初值、零初速；动画保留前 12 阶，尖角附近存在截断误差。",
      },
      {
        number: "2.2-3",
        tex: String.raw`\sin kx\cos\omega t=\tfrac12[\sin(kx-\omega t)+\sin(kx+\omega t)]`,
        meaning: "驻波可分解为两列等幅反向行波；合成动画同时显示两列行波与总位移。",
      },
      {
        number: "2.2-4",
        tex: String.raw`|y(L)|=\left|\frac{F_0\tan(kL)}{Tk}\right|,\quad f_n^{\rm force}=\frac{(2n-1)c}{4L}`,
        meaning: "无阻尼共振点幅值发散，图中断开极点，不能把纵轴上限当作真实峰值。",
      },
    ],
    figures: [
      {
        number: "2.2-1",
        title: "两端固定弦前六阶振型与波节",
        rows: 3,
        cols: 2,
        plot: (p, t) => {
          const c = stringSpeed(p.T, p.mu);
          return [1, 2, 3, 4, 5, 6].map((n) => ({
            ...panel(
              `第 ${n} 阶：${fmt(stringFrequency(n, c, p.L))} Hz`,
              "位置 x (m)",
              "横向位移 y (m)",
              [0, 1.5],
              [-0.015, 0.015],
              [
                {
                  name: "瞬时振型",
                  geometry: { key: "L", axis: "x" },
                  points: sample(
                    (x) =>
                      p.height *
                      Math.sin((n * Math.PI * x) / p.L) *
                      Math.cos(((n * Math.PI * c) / p.L) * t),
                    0,
                    p.L,
                  ),
                },
                {
                  name: "波节",
                  points: Array.from(
                    { length: n + 1 },
                    (_, j) => [(p.L * j) / n, 0] as [number, number],
                  ),
                  style: "none",
                  marker: "o",
                },
              ],
            ),
            legend: false,
          }));
        },
      },
      {
        number: "2.2-2",
        title: "拨弦初值、模态系数与合成运动",
        rows: 3,
        cols: 1,
        plot: (p, t) => {
          const c = stringSpeed(p.T, p.mu),
            h = p.height,
            initial = (r: number) =>
              r < p.pluck ? (h * r) / p.pluck : (h * (1 - r)) / (1 - p.pluck);
          return [
            {
              ...panel(
                "初始拨弦形状（三角形）",
                "位置 x (m)",
                "初始位移 y (m)",
                [0, 1.5],
                [-0.003, 0.018],
                [
                  {
                    name: "初始形状",
                    geometry: { key: "L", axis: "x" },
                    points: sample((x) => initial(x / p.L), 0, p.L),
                  },
                  { name: "拨点", points: [[p.pluck * p.L, h]], style: "none", marker: "o" },
                ],
              ),
              legend: false,
            },
            {
              ...panel(
                "前十二阶模态系数幅值",
                "阶数 n (—)",
                "系数幅值 |bₙ| (m)",
                [0, 14],
                [-0.012, 0.012],
                [
                  {
                    name: "模态系数",
                    kind: "bar",
                    points: Array.from(
                      { length: 12 },
                      (_, i) =>
                        [i + 1, Math.abs(pluckCoefficient(i + 1, h, p.pluck))] as [number, number],
                    ),
                  },
                ],
              ),
              legend: false,
              integerX: true,
            },
            panel(
              "反向行波叠加为驻波（慢放）",
              "位置 x (m)",
              "横向位移 y (m)",
              [0, 1.5],
              [-0.02, 0.02],
              [
                {
                  name: "向右行波",
                  points: sample((x) => pluckWave(x, t, c, p.L, h, p.pluck, 12, -1), 0, p.L),
                },
                {
                  name: "向左行波",
                  points: sample((x) => pluckWave(x, t, c, p.L, h, p.pluck, 12, 1), 0, p.L),
                  style: "--",
                },
                {
                  name: "合成位移",
                  geometry: { key: "L", axis: "x" },
                  points: sample((x) => pluckWave(x, t, c, p.L, h, p.pluck), 0, p.L),
                },
              ],
            ),
          ];
        },
      },
      {
        number: "2.2-3",
        title: "固定—力激励弦的端点位移幅频",
        rows: 1,
        cols: 1,
        plot: (p) => {
          const c = stringSpeed(p.T, p.mu),
            end = 9000,
            A = (p.F0 * p.L) / p.T;
          return [
            {
              ...panel(
                "无阻尼：端点位移在共振处发散",
                "频率 f (Hz)",
                "端点位移幅值 (m)",
                [0, end],
                [0, 4 * A],
                [endSeries(p.F0, p.L, p.T, c, end)],
              ),
              legend: false,
              unboundedY: true,
              responseNote: "共振发散；显示四倍静位移，超出部分省略。",
              annotations: [1, 2, 3].map((n) => ({
                axis: "x" as const,
                value: quarterFrequency(n, c, p.L),
                label: `f${n} = ${fmt(quarterFrequency(n, c, p.L))} Hz`,
              })),
            },
          ];
        },
      },
    ],
    readouts: (p) => {
      const c = stringSpeed(p.T, p.mu);
      return [
        ["两端固定基频", stringFrequency(1, c, p.L), "Hz"],
        ["第三谐频", stringFrequency(3, c, p.L), "Hz"],
        ["力激励第一共振", quarterFrequency(1, c, p.L), "Hz"],
        ["第二阶系数 b₂", pluckCoefficient(2, p.height, p.pluck), "m"],
      ];
    },
    examples: [
      {
        title: "例题　琴弦调音的张力设计",
        background:
          "有效弦长 0.65 m，线密度 0.0004 kg/m，当前张力 70 N。计算当前基频，并求调到 440 Hz 所需张力，检查调音量级是否合理。",
        defaults,
        given: [
          tension,
          density,
          length,
          parameter("target", "目标基频", "f_target", "Hz", 100, 1000, 1),
        ],
        asks: [
          {
            key: "fundamental",
            text: "(1) 当前基频",
            unit: "Hz",
            tex: String.raw`f_1=\sqrt{T/\rho_l}/(2L)`,
            matlab: "sqrt(T/mu)/(2*L)",
            calc: (p) => stringFrequency(1, stringSpeed(p.T, p.mu), p.L),
            sub: (p) => `√(${p.T}/${p.mu}) / (2×${p.L}) Hz`,
          },
          {
            key: "targetTension",
            text: "(2) 目标所需张力",
            unit: "N",
            tex: String.raw`T_{\rm target}=\rho_l(2Lf_{\rm target})^2`,
            matlab: "mu*(2*L*target)^2",
            calc: (p) => p.mu * (2 * p.L * p.target) ** 2,
            sub: (p) => `${p.mu} kg/m × (2×${p.L} m × ${p.target} Hz)²`,
          },
        ],
        hints: [
          "基频与张力平方根成正比；反解张力时应对频率项平方。",
          "先求当前波速，再用 $f_1 = c/(2L)$；目标张力为 $\\rho_l(2Lf)^2$。",
        ],
        judgment: (p) =>
          `目标张力为 ${fmt(p.mu * (2 * p.L * p.target) ** 2)} N，约为当前的 ${fmt((p.mu * (2 * p.L * p.target) ** 2) / p.T)} 倍；实际调音还需核对弦的许用拉力。`,
        plot: (p) => {
          const target = p.mu * (2 * p.L * p.target) ** 2,
            end = extent(Math.max(target, p.T) * 1.5),
            max = stringFrequency(1, stringSpeed(end, p.mu), p.L);
          return working(
            panel(
              "基频随张力变化与目标工作点",
              "张力 T (N)",
              "两端固定基频 f₁ (Hz)",
              [0, end],
              [0, max * 1.6],
              [line("基频", (T) => stringFrequency(1, stringSpeed(T, p.mu), p.L), end)],
            ),
            target,
            p.target,
          );
        },
      },
    ],
    engineering: {
      text: "琴弦音高由张力、线密度和有效长度决定，音色还取决于拨点对各阶模态的激发。设计时应同时考虑目标基频、谐波比例和允许张力。",
      href: "#/cases?project=music",
      title: "乐器与琴弦设计",
    },
  },
);
