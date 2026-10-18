import { lecture, mechanics, force, ratio, parameter, fmt, industry, type Values } from "../p1";
import { forcedMotion } from "../../physics/p1";
import { panel, line, extent, working } from "../../plot/p1Helpers";
const defaults = { M: 5, D: 2000, F0: 2, Rm: 0, x0: 0, v0: 0, ratio: 0.92, tObs: 1 };
const envelope = (p: Values, t: number) => {
  const w0 = Math.sqrt(p.D / p.M),
    w = p.ratio * w0;
  return Math.abs(w - w0) < 1e-9 * w0
    ? (p.F0 * t) / (2 * p.M * w0)
    : Math.abs(((2 * p.F0) / (p.D - p.M * w * w)) * Math.sin(((w - w0) * t) / 2));
};
const resonant = (p: Values, end = extent((12 * 2 * Math.PI) / Math.sqrt(p.D / p.M))) => {
  const w = Math.sqrt(p.D / p.M),
    u = { ...p, ratio: 1, Rm: 0, x0: 0, v0: 0 },
    A = envelope(u, end);
  return panel(
    "共振：位移包络线性增长",
    "时间 t (s)",
    "位移 x (m)",
    [0, end],
    [-1.8 * A, 1.8 * A],
    [
      line("零初值共振响应", (t) => forcedMotion(u, t).total, end),
      line("正线性包络", (t) => envelope(u, t), end, "--"),
      line("负线性包络", (t) => -envelope(u, t), end, "--"),
    ],
  );
};
export default lecture(
  "1.2.1",
  [
    "调音时频率相近的两个音叉或乐器产生时强时弱的响度；机械系统也可能由相近转频激起拍。",
    "拍周期为 2π/|ω−ω₀| = 1/|f−f₀|，这里指振幅绝对值相邻极大的间隔。",
    "谐和力是随时间按单一正弦或余弦规律变化的力，例如 F₀cosωt。",
  ],
  {
    defaults,
    parameters: [...mechanics, force, ratio],
    keyPoints: [
      "无阻尼受迫响应是自由振动分量与强迫振动分量之和，自由分量不会随时间消失。",
      "外力频率接近固有频率时出现明显的拍，拍周期由频差决定。",
      "零初值、精确共振时位移振幅线性增长；真实系统存在阻尼，自由振动分量随时间衰减，最终仅余强迫振动项而达到稳态。",
    ],
    formulas: [
      {
        number: "1.2-8",
        tex: String.raw`M\ddot x+Dx=F_0\cos\omega t,\quad x(0)=\dot x(0)=0`,
        meaning: "本讲忽略阻尼，激励力从 t = 0 接入。",
      },
      {
        number: "1.2-9",
        tex: String.raw`x(t)=\frac{F_0}{M(\omega_0^2-\omega^2)}(\cos\omega t-\cos\omega_0t),\quad T_b=\frac{2\pi}{|\omega-\omega_0|}`,
        meaning:
          "图中拍包络取振幅绝对值；频率比非常接近 1 时显示前 40 个固有周期，读数仍给出完整拍周期。",
      },
      {
        number: "1.2-10",
        tex: String.raw`\lim_{\omega\to\omega_0}x(t)=\frac{F_0t}{2M\omega_0}\sin\omega_0t`,
        meaning: "共振极限不直接用两个接近频率的相减式计算，避免零除与数值消减。",
      },
    ],
    figures: [
      {
        number: "1.2.1-1",
        title: "谐和外力、零初值响应与拍包络",
        rows: 2,
        cols: 1,
        plot: (p) => {
          const w = Math.sqrt(p.D / p.M),
            diff = Math.abs((p.ratio - 1) * w),
            end = extent(
              diff > 1e-8
                ? Math.min((4 * Math.PI) / diff, (40 * 2 * Math.PI) / w)
                : (12 * 2 * Math.PI) / w,
            ),
            u = { ...p, Rm: 0, x0: 0, v0: 0 },
            n = Math.ceil(((end * w) / (2 * Math.PI)) * 100) + 1;
          const E = Array.from({ length: 801 }, (_, i) => envelope(u, (end * i) / 800)),
            A = Math.max(1e-8, ...E);
          return [
            {
              ...panel(
                "外力 F₀ cos(ωt)",
                "时间 t (s)",
                "外力 F (N)",
                [0, end],
                [-p.F0 * 1.8, p.F0 * 1.8],
                [line("谐和激励力", (t) => p.F0 * Math.cos(p.ratio * w * t), end, "-", n)],
              ),
              legend: false,
            },
            panel(
              "自由项与强迫项叠加",
              "时间 t (s)",
              "位移 x (m)",
              [0, end],
              [-1.8 * A, 1.8 * A],
              [
                line("零初值响应", (t) => forcedMotion(u, t).total, end, "-", n),
                line("拍包络 +", (t) => envelope(u, t), end, "--", n),
                line("拍包络 −", (t) => -envelope(u, t), end, "--", n),
              ],
            ),
          ];
        },
      },
      {
        number: "1.2.1-2",
        title: "精确共振的线性增长",
        rows: 1,
        cols: 1,
        plot: (p) => [resonant(p)],
      },
    ],
    readouts: (p) => {
      const w = Math.sqrt(p.D / p.M);
      return [
        ["固有频率", w / (2 * Math.PI), "Hz"],
        ["外力频率", (p.ratio * w) / (2 * Math.PI), "Hz"],
        ["拍周期", p.ratio === 1 ? Infinity : (2 * Math.PI) / (Math.abs(p.ratio - 1) * w), "s"],
      ];
    },
    examples: [
      {
        title: "例题　相近转频引起的拍与共振行程",
        background:
          "质量 5 kg、刚度 2000 N/m 的试验架受到幅值 2 N 的谐和力，频率比为 0.92。求拍周期；若改为精确共振，估计接入 1 s 后的位移包络，用于判断扫频时的行程风险。",
        defaults,
        given: [
          ...mechanics,
          force,
          { ...ratio, min: 0.8, max: 0.99 },
          parameter("tObs", "观察时间", "t", "s", 0.1, 10, 0.1),
        ],
        asks: [
          {
            key: "beatPeriod",
            text: "(1) 拍周期",
            unit: "s",
            tex: String.raw`T_b=\frac{2\pi}{|1-r|\sqrt{D/M}}`,
            matlab: "2*pi/(abs(1-ratio)*sqrt(D/M))",
            calc: (p) => (2 * Math.PI) / (Math.abs(1 - p.ratio) * Math.sqrt(p.D / p.M)),
            sub: (p) => `2π / [|1−${p.ratio}| × √(${p.D}/${p.M})] s`,
          },
          {
            key: "resonantEnvelope",
            text: "(2) 共振位移包络",
            unit: "m",
            tex: String.raw`A(t)=F_0t/(2\sqrt{MD})`,
            matlab: "F0*tObs/(2*sqrt(M*D))",
            calc: (p) => (p.F0 * p.tObs) / (2 * Math.sqrt(p.M * p.D)),
            sub: (p) => `${p.F0} N × ${p.tObs} s / [2√(${p.M}×${p.D})]`,
          },
        ],
        hints: [
          "拍周期由两频率之差决定；精确共振需使用极限公式。",
          "ω₀ = √(D/M)，Δω = |1−r|ω₀；线性增长包络为 F₀t/(2Mω₀)。",
        ],
        judgment: (p) =>
          `共振下 ${p.tObs} s 的包络约 ${fmt(((p.F0 * p.tObs) / (2 * Math.sqrt(p.M * p.D))) * 1000)} mm；无阻尼模型没有稳定的有限共振幅值。`,
        plot: (p) => {
          const end = extent(p.tObs * 1.4);
          return working(resonant(p, end), p.tObs, envelope({ ...p, ratio: 1 }, p.tObs));
        },
      },
    ],
    engineering: industry(
      "扫频校准时，邻近共振的试验架可能先出现拍。持续停留在共振处会使无阻尼模型的行程不断增长；实际设计应考虑阻尼并设置位移限值。",
    ),
  },
);
