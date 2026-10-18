import { lecture, mechanics, initial, parameter, fmt, industry, type Values } from "../p1";
import { decay, freeMotion } from "../../physics/p1";
import { panel, line, extent, working } from "../../plot/p1Helpers";
const q = parameter("Qm", "品质因数", "Qₘ", "—", 2, 30, 0.5);
const defaults = { M: 2, D: 3200, Qm: 8, x0: 0.006, v0: 0 };
const motion = (p: Values) => ({ ...p, Rm: Math.sqrt(p.M * p.D) / p.Qm });
const info = (p: Values) => {
  const c = decay(motion(p)),
    B = (p.v0 + c.delta * p.x0) / c.wd,
    A = Math.hypot(p.x0, B);
  let z = (Math.atan2(B, p.x0) + Math.PI / 2) / c.wd;
  if (z < 0) z += Math.PI / c.wd;
  return { ...c, A, z, end: extent(Math.min(6 / c.delta, 12 * c.Td)) };
};
const curves = (p: Values) => {
  const c = info(p),
    bound = Math.max(1e-6, c.A);
  return {
    ...panel(
      "欠阻尼自由振动及包络",
      "时间 t (s)",
      "位移 x (m)",
      [0, c.end],
      [-1.6 * bound, 2.2 * bound],
      [
        line("解析位移", (t) => freeMotion(motion(p), t), c.end),
        line("正包络", (t) => c.A * Math.exp(-c.delta * t), c.end, "--"),
        line("负包络", (t) => -c.A * Math.exp(-c.delta * t), c.end, "--"),
      ],
    ),
    annotations:
      c.A === 0
        ? []
        : [
            { axis: "x" as const, value: c.z, label: "过零1" },
            { axis: "x" as const, value: c.z + c.Td / 2, label: `间隔 ${fmt(c.Td / 2)} s` },
          ],
  };
};
export default lecture(
  "1.1.4",
  [
    "不是周期函数。虽然过零间隔相等，但每个周期振幅减少，不能满足 x(t+T)=x(t)。",
    "振幅按 A₀e^(−δt) 指数衰减，振幅时间常数为 1/δ。",
    "欠阻尼振动频率 ω₀′ = √(ω₀²−δ²)，比无阻尼固有频率低；阻尼很小时两者近似相等。",
  ],
  {
    defaults,
    parameters: [...mechanics, q, ...initial],
    keyPoints: [
      "小阻尼自由振动是振幅指数衰减的准简谐振动，过零间隔相等但不严格周期。",
      "阻尼固有角频率 ω₀′ 小于 ω₀。",
      "平均能量在弱阻尼近似下按 e^(−2δt) 衰减，速度是振幅衰减速度的两倍。",
    ],
    formulas: [
      {
        number: "1.1-10",
        tex: String.raw`\omega_0'=\sqrt{\omega_0^2-\delta^2},\quad x=e^{-\delta t}\left[x_0\cos\omega_0't+\frac{v_0+\delta x_0}{\omega_0'}\sin\omega_0't\right]`,
        meaning: "适用于 δ < ω₀；在参数面板中用 Qₘ 保证小阻尼条件。",
      },
      {
        number: "1.1-11",
        tex: String.raw`A(t)=A_0e^{-\delta t},\quad \overline E(t)\simeq\tfrac12DA_0^2 e^{-2\delta t}`,
        meaning: "平均能量公式采用 PPT 的弱阻尼近似；瞬时总机械能仍存在周期内起伏。",
      },
    ],
    figures: [
      {
        number: "1.1.4-1",
        title: "衰减位移、包络和相邻过零点",
        rows: 1,
        cols: 1,
        plot: (p) => [curves(p)],
      },
      {
        number: "1.1.4-2",
        title: "平均能量的指数衰减（半对数坐标）",
        rows: 1,
        cols: 1,
        plot: (p) => {
          const c = info(p),
            E = (p.D * c.A * c.A) / 2;
          if (E === 0)
            return [
              {
                ...panel(
                  "零初始能量：对数坐标不显示 0",
                  "时间 t (s)",
                  "平均能量 E (J)",
                  [0, c.end],
                  [1e-12, 1e-6],
                  [],
                ),
                yscale: "log" as const,
              },
            ];
          return [
            {
              ...panel(
                "弱阻尼近似：平均能量的衰减",
                "时间 t (s)",
                "平均能量 E (J)",
                [0, c.end],
                [E * Math.exp(-2 * c.delta * c.end) * 0.5, E * 2],
                [line("周期平均能量（近似）", (t) => E * Math.exp(-2 * c.delta * t), c.end)],
              ),
              yscale: "log" as const,
            },
          ];
        },
      },
    ],
    readouts: (p) => {
      const c = info(p);
      return [
        ["阻尼角频率 ω₀′", c.wd, "rad/s"],
        ["无阻尼角频率 ω₀", c.w0, "rad/s"],
        ["相对频率降低", (1 - c.wd / c.w0) * 100, "%"],
        ["相邻过零间隔", c.Td / 2, "s"],
        ["振幅时间常数 τ", c.tau, "s"],
      ];
    },
    examples: [
      {
        title: "例题　振动余振的衰减测量",
        background:
          "测量架质量 2 kg、刚度 3200 N/m、品质因数 8。停机后记录余振，用阻尼频率与相邻峰值比估计系统的衰减和频率偏差。",
        defaults,
        given: [...mechanics, q],
        asks: [
          {
            key: "fd",
            text: "(1) 阻尼振动频率",
            unit: "Hz",
            tex: String.raw`f_d=\frac{\sqrt{D/M}}{2\pi}\sqrt{1-\frac{1}{4Q_m^2}}`,
            matlab: "sqrt(D/M)*sqrt(1-1/(4*Qm^2))/(2*pi)",
            calc: (p) => info(p).wd / (2 * Math.PI),
            sub: (p) => `√(${p.D}/${p.M}) × √[1−1/(4×${p.Qm}²)] / (2π) Hz`,
          },
          {
            key: "tau",
            text: "(2) 振幅时间常数",
            unit: "s",
            tex: String.raw`\tau=1/\delta=2Q_m/\omega_0`,
            matlab: "2*Qm/sqrt(D/M)",
            calc: (p) => info(p).tau,
            sub: (p) => `2 × ${p.Qm} / √(${p.D}/${p.M}) s`,
          },
          {
            key: "decrement",
            text: "(3) 对数衰减率",
            unit: "—",
            tex: String.raw`\Lambda=\ln(A_n/A_{n+1})=2\pi\delta/\omega_0'`,
            matlab: "pi/Qm/sqrt(1-1/(4*Qm^2))",
            calc: (p) => info(p).logDecrement,
            sub: (p) => `π / [${p.Qm} × √(1−1/(4×${p.Qm}²))]`,
          },
        ],
        hints: [
          "先由 Qₘ 求 δ，再计算阻尼频率和周期。",
          "相邻同向峰的包络比是 e^(δT_d)，取自然对数得 δT_d。",
        ],
        judgment: (p) =>
          `振幅每 ${fmt(info(p).tau)} s 降到 1/e；频率降低约 ${fmt((1 - info(p).wd / info(p).w0) * 100)}%，测量时应区分 ω₀ 与 ω₀′。`,
        plot: (p) => working(curves(p), info(p).Td, freeMotion(motion(p), info(p).Td)),
      },
    ],
    engineering: industry(
      "停机余振可用于识别结构阻尼。记录相邻同向峰的幅值和间隔，就能估计阻尼系数与阻尼频率，进而预测余振持续时间和传感器触发等待时间。",
    ),
  },
);
