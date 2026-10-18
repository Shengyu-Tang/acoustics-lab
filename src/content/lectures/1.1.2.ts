import { lecture, mechanics, parameter, fmt, industry, type Values } from "../p1";
import { panel, line, extent, working, segment } from "../../plot/p1Helpers";
const defaults = { M: 1.5, D: 1350, A: 0.004 };
const amplitude = parameter("A", "位移振幅", "A", "m", 0.001, 0.02, 0.001);
const energy = (p: Values) => {
  const w = Math.sqrt(p.D / p.M),
    end = extent(((2 * Math.PI) / w) * 2),
    E = (p.D * p.A ** 2) / 2;
  return panel(
    "动能与势能互换",
    "时间 t (s)",
    "能量 E (J)",
    [0, end],
    [0, E * 1.8],
    [
      line("动能", (t) => E * Math.sin(w * t) ** 2, end),
      line("势能", (t) => E * Math.cos(w * t) ** 2, end, "--"),
      line("总机械能", () => E, end, ":"),
    ],
  );
};
export default lecture(
  "1.1.2",
  [
    "总机械能守恒，动能与势能以两倍位移振动频率交替变化；一项增加时另一项等量减少。",
    "经过平衡位置时速率最大，动能最大；位移达到正、负极值时势能最大。",
    "振速超前位移 $\\pi/2$，加速度超前振速 $\\pi/2$；幅值分别为 A、ω₀A、ω₀²A，加速度与位移反相。",
  ],
  {
    defaults,
    parameters: [...mechanics, amplitude],
    animation: true,
    animationPeriod: (p) => (2 * Math.PI) / Math.sqrt(p.D / p.M),
    keyPoints: [
      "位移、速度、加速度均为谐和函数且同频，振幅各相差一个 ω₀ 因子，相位依次超前 $\\pi/2$。",
      "复数表示中，微分等价于乘 jω₀；旋转矢量的实轴投影给出实际值。",
      "无阻尼系统的动能与势能互换，总机械能守恒。",
    ],
    formulas: [
      {
        number: "1.1-4",
        tex: String.raw`x=A\cos\omega_0t,\quad v=-\omega_0 A\sin\omega_0t,\quad a=-\omega_0^2 A\cos\omega_0t`,
        meaning: "本图初相取零，三个响应共用时间轴。",
      },
      {
        number: "1.1-5",
        tex: String.raw`\tilde v=j\omega_0\tilde x,\quad \tilde a=(j\omega_0)^2\tilde x`,
        meaning: "统一采用 $e^{j\\omega t}$；图中矢量分别按各自幅值归一化。",
      },
      {
        number: "1.1-6",
        tex: String.raw`E_k=\tfrac12 Mv^2,\quad E_p=\tfrac12 Dx^2,\quad E=E_k+E_p=\tfrac12 DA^2`,
        meaning: "任意时刻能量之和相同。",
      },
    ],
    figures: [
      {
        number: "1.1.2-1",
        title: "位移、振速与加速度的幅值和相位",
        rows: 3,
        cols: 1,
        plot: (p) => {
          const w = Math.sqrt(p.D / p.M),
            T = (2 * Math.PI) / w,
            end = extent(2 * T);
          return [0, 1, 2].map((i) => {
            const A = p.A * w ** i;
            return {
              ...panel(
                ["位移", "振速：超前位移 π/2", "加速度：超前振速 π/2"][i],
                "时间 t (s)",
                ["位移 x (m)", "振速 v (m/s)", "加速度 a (m/s²)"][i],
                [0, end],
                [-A * 1.8, A * 1.8],
                [
                  line(
                    ["x(t)", "v(t)", "a(t)"][i],
                    (t) => A * Math.cos(w * t + (i * Math.PI) / 2),
                    end,
                  ),
                ],
              ),
              legend: false,
              annotations: [{ axis: "x" as const, value: T / 4, label: "T/4：相位差 π/2" }],
            };
          });
        },
      },
      {
        number: "1.1.2-2",
        independentOf: ["A"],
        dimensionlessComparison: "Phase comparison: each vector is divided by its own amplitude.",
        title: "复平面旋转矢量与实轴投影",
        rows: 1,
        cols: 1,
        plot: (p, t) => {
          const a = Math.sqrt(p.D / p.M) * t;
          return [
            panel(
              "归一化旋转矢量（实轴投影为瞬时值）",
              "实部 / 各自幅值 (—)",
              "虚部 / 各自幅值 (—)",
              [-1.5, 1.5],
              [-1.5, 1.5],
              [
                ...["x/A", "v/(ω₀A)", "a/(ω₀²A)"].map((s, i) =>
                  segment(s, [
                    [0, 0],
                    [Math.cos(a + (i * Math.PI) / 2), Math.sin(a + (i * Math.PI) / 2)],
                  ]),
                ),
                ...[0, 1, 2].map((i) => ({
                  ...segment(
                    "实轴投影",
                    [
                      [Math.cos(a + (i * Math.PI) / 2), Math.sin(a + (i * Math.PI) / 2)],
                      [Math.cos(a + (i * Math.PI) / 2), 0],
                    ],
                    ":",
                  ),
                  color: ["#0072BD", "#D95319", "#EDB120"][i],
                  legend: false,
                })),
              ],
            ),
          ];
        },
      },
      {
        number: "1.1.2-3",
        title: "动能、势能及总机械能",
        rows: 1,
        cols: 1,
        plot: (p) => [energy(p)],
      },
    ],
    readouts: (p) => {
      const w = Math.sqrt(p.D / p.M);
      return [
        ["最大振速", w * p.A, "m/s"],
        ["最大加速度", w * w * p.A, "m/s²"],
        ["总机械能", (p.D * p.A * p.A) / 2, "J"],
      ];
    },
    examples: [
      {
        title: "例题　振动传感器的量程选择",
        background:
          "小型振动台质量为 1.5 kg，刚度 1350 N/m，位移振幅为 4 mm。选择传感器前需计算最大速度、加速度和储能，避免传感器过载。",
        defaults,
        given: [...mechanics, amplitude],
        asks: [
          {
            key: "vmax",
            text: "(1) 最大振速",
            unit: "m/s",
            tex: String.raw`v_m=A\sqrt{D/M}`,
            matlab: "A*sqrt(D/M)",
            calc: (p) => p.A * Math.sqrt(p.D / p.M),
            sub: (p) => `${p.A} m × √[${p.D} N/m / (${p.M} kg)]`,
          },
          {
            key: "amax",
            text: "(2) 最大加速度",
            unit: "m/s²",
            tex: String.raw`a_m=AD/M`,
            matlab: "A*D/M",
            calc: (p) => (p.A * p.D) / p.M,
            sub: (p) => `${p.A} m × ${p.D} N/m / (${p.M} kg)`,
          },
          {
            key: "energy",
            text: "(3) 总机械能",
            unit: "J",
            tex: String.raw`E=DA^2/2`,
            matlab: "D*A^2/2",
            calc: (p) => (p.D * p.A ** 2) / 2,
            sub: (p) => `${p.D} N/m × (${p.A} m)² / 2`,
          },
        ],
        hints: [
          "用位移振幅依次乘 ω₀ 与 ω₀²；能量可在位移最大处求。",
          "先算 $\\omega_0 = \\sqrt{D/M}$，再算 vₘ、aₘ 与 $DA^2/2$。",
        ],
        judgment: (p) => `传感器量程至少覆盖 ${fmt((p.A * p.D) / p.M)} m/s²，并保留过载裕量。`,
        plot: (p) => working(energy(p), 0, (p.D * p.A ** 2) / 2),
      },
    ],
    engineering: industry(
      "位移量程小不等于加速度量程小。为机械振动选择传感器时，需结合固有频率，将位移幅值换算为速度和加速度幅值，同时检查结构储能。",
    ),
  },
);
