import { lecture, mechanics, parameter, fmt, industry, type Values } from "../p1";
import { panel, line, extent, working } from "../../plot/p1Helpers";
const defaults = { M: 10, D: 395000, input: 2, value: 5 };
const settings = (p: Values) => {
  const w = Math.sqrt(p.D / p.M),
    Rm = p.input === 0 ? p.value : p.input === 1 ? 2 * p.M * p.value : (w * p.M) / p.value,
    delta = Rm / (2 * p.M),
    Qm = (w * p.M) / Rm,
    wd = Math.sqrt(Math.max(0, w * w - delta * delta));
  return { w, Rm, delta, Qm, wd };
};
const curves = (p: Values) => {
  const w = Math.sqrt(p.D / p.M),
    T = (2 * Math.PI) / w,
    end = extent(12 * T),
    colors = ["#0072BD", "#D95319", "#EDB120"];
  return {
    ...panel(
      "品质因数与自由衰减",
      "时间 t (s)",
      "归一化位移 x/A₀ (—)",
      [0, end],
      [-1.2, 2.2],
      [
        ...[1.7, 5, 10].flatMap((Q, i) => {
          const d = w / (2 * Q),
            wd = w * Math.sqrt(1 - 1 / (4 * Q * Q));
          return [
            {
              ...line(`Qₘ = ${Q}`, (t) => Math.exp(-d * t) * Math.cos(wd * t), end),
              color: colors[i],
            },
            {
              ...line("振幅包络", (t) => Math.exp(-d * t), end, "--"),
              color: colors[i],
              legend: false,
            },
            {
              name: "振幅降至 e⁻π",
              points: [[Math.PI / d, Math.exp(-Math.PI)]] as [number, number][],
              style: "none" as const,
              marker: "o" as const,
              color: colors[i],
              legend: false,
            },
          ];
        }),
      ],
    ),
    annotationHeader: true,
    annotations: [1.7, 5, 10].map((Q) => ({
      axis: "x" as const,
      value: Q * T,
      label: `Qₘ=${Q}；N=${fmt(Q * Math.sqrt(1 - 1 / (4 * Q * Q)))}`,
    })),
  };
};
export default lecture(
  "1.1.5",
  [
    "δ 为单位时间内振幅衰减比的自然对数，即 $\\ln[A(t)/A(t+\\Delta t)]/\\Delta t$；单位为 s⁻¹。δ 越大，振幅衰减越快。",
    "$Q_m = \\omega_0/(2\\delta)$ 表征阻尼强弱。振幅降到 $e^{-\\pi}$ 所经历的无阻尼周期数等于 Qₘ；按阻尼周期计数为 $Q_m\\sqrt{1-1/(4Q_m^2)}$，弱阻尼时近似相等。Qₘ 还近似反比于每周期能量损失的相对值。",
  ],
  {
    defaults,
    parameters: [...mechanics, parameter("value", "输入阻尼量", "Qₘ", "—", 0.55, 10000, 0.05)],
    controls: "damping",
    keyPoints: [
      "阻力系数（力阻）Rₘ、阻尼系数 δ、机械品质因数 Qₘ 可相互换算。",
      "δ 是振幅指数衰减率，$\\tau = 1/\\delta$ 是振幅时间常数。",
      "Qₘ 大表示阻尼弱、余振长；每周期相对能量损失约为 $2\\pi/Q_m$（弱阻尼）。",
      "用阻尼周期计数时需保留频率修正，不能把小阻尼近似当作恒等式。",
    ],
    formulas: [
      {
        number: "1.1-12",
        tex: String.raw`\delta=\frac{R_m}{2M},\quad Q_m=\frac{\omega_0M}{R_m}=\frac{\omega_0}{2\delta},\quad \tau=\frac1\delta`,
        meaning: "换算器可选择输入 Rₘ、δ 或 Qₘ；其余量按相同 M、D 自动计算。",
      },
      {
        number: "1.1-13",
        tex: String.raw`\Lambda=\ln\frac{A_n}{A_{n+1}}=\frac{2\pi\delta}{\omega_0'},\quad t_{\pi}=\frac\pi\delta=Q_mT_0,\quad N_d=\frac{t_\pi}{T_d}=Q_m\sqrt{1-\frac1{4Q_m^2}}`,
        meaning:
          "$N_d$ 为振幅降到 $e^{-\\pi}$ 所经历的阻尼周期数；图中用包络标出该位置。过阻尼时阻尼周期及对数衰减率不适用。",
      },
      {
        number: "1.1-14",
        tex: String.raw`\frac{\Delta E}{E}=1-e^{-2\delta T_d}\simeq\frac{2\pi}{Q_m}`,
        meaning: "右端近似只适用于足够大的 Qₘ。",
      },
    ],
    figures: [
      {
        number: "1.1.5-1",
        title: "Qₘ = 1.7、5、10 的衰减与周期计数",
        rows: 1,
        cols: 1,
        plot: (p) => [curves(p)],
      },
    ],
    readouts: (p) => {
      const c = settings(p);
      return [
        ["力阻 Rₘ", c.Rm, "kg/s"],
        ["阻尼系数 δ", c.delta, "s⁻¹"],
        ["品质因数 Qₘ", c.Qm, "—"],
        ["振幅时间常数 τ", 1 / c.delta, "s"],
        ["对数衰减率 Λ", c.wd ? (2 * Math.PI * c.delta) / c.wd : NaN, "—"],
        ["降至 e⁻π 的阻尼周期数", c.wd ? c.wd / (2 * c.delta) : NaN, "—"],
      ];
    },
    examples: [
      {
        title: "例题　由衰减记录确定支架阻尼",
        background:
          "船载支架等效质量为 10 kg，刚度 395000 N/m。测得品质因数为 5，需换算为采购阻尼器所需的力阻，并估算振幅时间常数。",
        defaults: { ...defaults, Qm: 5 },
        given: [...mechanics, parameter("Qm", "品质因数", "Qₘ", "—", 0.55, 30, 0.1)],
        asks: [
          {
            key: "resistance",
            text: "(1) 力阻",
            unit: "kg/s",
            tex: String.raw`R_m=\sqrt{MD}/Q_m`,
            matlab: "sqrt(M*D)/Qm",
            calc: (p) => Math.sqrt(p.M * p.D) / p.Qm,
            sub: (p) => `√[${p.M} kg × ${p.D} N/m] / ${p.Qm}`,
          },
          {
            key: "delta",
            text: "(2) 阻尼系数",
            unit: "s⁻¹",
            tex: String.raw`\delta=\frac{\sqrt{D/M}}{2Q_m}`,
            matlab: "sqrt(D/M)/(2*Qm)",
            calc: (p) => Math.sqrt(p.D / p.M) / (2 * p.Qm),
            sub: (p) => `√(${p.D}/${p.M}) / (2×${p.Qm}) s⁻¹`,
          },
          {
            key: "tau",
            text: "(3) 振幅时间常数",
            unit: "s",
            tex: String.raw`\tau=2Q_m/\omega_0`,
            matlab: "2*Qm/sqrt(D/M)",
            calc: (p) => (2 * p.Qm) / Math.sqrt(p.D / p.M),
            sub: (p) => `2 × ${p.Qm} / √(${p.D}/${p.M}) s`,
          },
        ],
        hints: [
          "$Q_m = \\omega_0M/R_m$；再用 $\\delta = R_m/(2M)$。",
          "先算 ω₀，再求 Rₘ、δ 和 $1/\\delta$。",
        ],
        judgment: (p) =>
          `等效力阻应约为 ${fmt(Math.sqrt(p.M * p.D) / p.Qm)} kg/s；Qₘ 越大，停机后等待余振衰减的时间越长。`,
        plot: (p) => {
          const w = Math.sqrt(p.D / p.M),
            d = w / (2 * p.Qm),
            end = extent(6 / d);
          return working(
            panel(
              "本题振幅包络与 1/e 工作点",
              "时间 t (s)",
              "振幅比 A/A₀ (—)",
              [0, end],
              [0, 1.8],
              [line("振幅包络", (t) => Math.exp(-d * t), end)],
            ),
            1 / d,
            1 / Math.E,
          );
        },
      },
    ],
    engineering: industry(
      "阻尼器采购通常给出力阻，实验辨识常给出衰减率，频响测量又常给出品质因数。统一质量和刚度后换算这些量，才能比较实测结果与设计指标。",
    ),
  },
);
