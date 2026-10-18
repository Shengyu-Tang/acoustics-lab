import { lecture, mechanics, force, ratio, parameter, fmt, industry, type Values } from "../p1";
import { decay, forcedMotion } from "../../physics/p1";
import { panel, line, extent, working } from "../../plot/p1Helpers";
const q = parameter("Qm", "品质因数", "Qₘ", "—", 1.7, 20, 0.1);
const defaults = { M: 4, D: 10000, Qm: 5, F0: 10, ratio: 0.8, x0: 0, v0: 0 };
const motion = (p: Values) => ({ ...p, Rm: Math.sqrt(p.M * p.D) / p.Qm });
const info = (p: Values) => {
  const u = motion(p),
    c = decay(u),
    w = p.ratio * c.w0;
  return { ...c, u, amplitude: p.F0 / Math.hypot(p.D - p.M * w * w, u.Rm * w) };
};
const plots = (p: Values) => {
  const c = info(p),
    end = extent(7 / c.delta),
    keys = ["transient", "steady", "total"] as const;
  const series = keys.map((key, i) =>
    line(["暂态分量", "稳态分量", "合成位移"][i], (t) => forcedMotion(c.u, t)[key], end),
  );
  const A = Math.max(1e-8, ...series.flatMap((s) => s.points.map(([, y]) => Math.abs(y))));
  return series.map((s, i) => ({
    ...panel(
      ["暂态：阻尼固有频率，指数衰减", "稳态：外力频率，恒定振幅", "合成：长时间趋于稳态"][i],
      "时间 t (s)",
      "位移 x (m)",
      [0, end],
      [-A * 1.8, A * 1.8],
      [s],
    ),
    legend: false,
  }));
};
export default lecture(
  "1.2.2",
  [
    "暂态分量的包络按 e^(−δt) 衰减，振动频率为阻尼固有频率；长时间后暂态分量趋于零。",
    "质量块受弹性恢复力 −Dx、黏滞阻力 −Rₘv 和外加谐和力 F₀cosωt。以静平衡位置计位移时重力与静态弹簧力抵消。",
  ],
  {
    defaults,
    parameters: [...mechanics, q, force, ratio],
    keyPoints: [
      "通解由暂态解与稳态解相加组成。",
      "暂态以阻尼固有频率振动并指数衰减，其系数由接入瞬间初始条件决定。",
      "稳态以外力频率振动，幅度与相位由系统参数和外力频率决定。",
      "长时间后暂态消失，合成响应与稳态响应重合。",
    ],
    formulas: [
      {
        number: "1.2-11",
        tex: String.raw`M\ddot x+R_m\dot x+Dx=F_0\cos\omega t,\quad x=x_{\rm tr}+x_{\rm ss}`,
        meaning: "本图采用零初始位移和零初始速度。",
      },
      {
        number: "1.2-12",
        tex: String.raw`x_{\rm ss}=C\cos\omega t+S\sin\omega t,\quad C=\frac{F_0(D-M\omega^2)}{(D-M\omega^2)^2+(R_m\omega)^2},\quad S=\frac{F_0R_m\omega}{(D-M\omega^2)^2+(R_m\omega)^2}`,
        meaning: "这是采用时间因子 $e^{j\\omega t}$ 的稳态复幅值的实部。",
      },
      {
        number: "1.2-13",
        tex: String.raw`x_{\rm tr}=e^{-\delta t}\left[-C\cos\omega_0't+\frac{-\omega S-\delta C}{\omega_0'}\sin\omega_0't\right]`,
        meaning: "暂态初值恰好抵消稳态在 t = 0 的位移与速度，以满足总响应零初值。",
      },
    ],
    figures: [
      {
        number: "1.2.2-1",
        title: "暂态、稳态与合成位移（共用坐标范围）",
        rows: 3,
        cols: 1,
        plot: (p) => plots(p),
      },
    ],
    readouts: (p) => {
      const c = info(p),
        t = 8 / c.delta;
      return [
        ["阻尼固有频率", c.wd / (2 * Math.PI), "Hz"],
        ["外力频率", p.ratio * c.f0, "Hz"],
        ["稳态位移振幅", c.amplitude, "m"],
        ["8τ 时暂态绝对值", Math.abs(forcedMotion(c.u, t).transient), "m"],
      ];
    },
    examples: [
      {
        title: "例题　振动台的稳定测量幅值",
        background:
          "振动台质量 4 kg、刚度 10000 N/m、品质因数 5，以频率比 0.8、力幅值 10 N 驱动。求稳态位移幅值和暂态振动频率，区分刚接入时的信号与可用于校准的稳态信号。",
        defaults,
        given: [...mechanics, q, force, ratio],
        asks: [
          {
            key: "amplitude",
            text: "(1) 稳态位移幅值",
            unit: "m",
            tex: String.raw`x_m=\frac{F_0}{D\sqrt{(1-r^2)^2+(r/Q_m)^2}}`,
            matlab: "F0/(D*sqrt((1-ratio^2)^2+(ratio/Qm)^2))",
            calc: (p) => info(p).amplitude,
            sub: (p) => `${p.F0} N / [${p.D} N/m × √((1−${p.ratio}²)²+(${p.ratio}/${p.Qm})²)]`,
          },
          {
            key: "transientFrequency",
            text: "(2) 暂态振动频率",
            unit: "Hz",
            tex: String.raw`f_d=\frac{\sqrt{D/M}}{2\pi}\sqrt{1-\frac1{4Q_m^2}}`,
            matlab: "sqrt(D/M)*sqrt(1-1/(4*Qm^2))/(2*pi)",
            calc: (p) => info(p).wd / (2 * Math.PI),
            sub: (p) => `√(${p.D}/${p.M}) × √[1−1/(4×${p.Qm}²)] / (2π) Hz`,
          },
        ],
        hints: [
          "稳态幅值由动态刚度的模决定；暂态频率由阻尼固有角频率决定。",
          "将 ω = rω₀、Rₘ = Mω₀/Qₘ 代入动态刚度，可整理为题中的无量纲表达式。",
        ],
        judgment: (p) =>
          `稳态幅值为 ${fmt(info(p).amplitude * 1000)} mm；测量前需等待暂态充分衰减，不能把初始合成峰值当作稳态幅值。`,
        plot: (p) => {
          const c = info(p),
            end = extent(7 / c.delta),
            t = 5 / c.delta;
          return working(
            panel(
              "稳态与合成响应的长时间比较",
              "时间 t (s)",
              "位移 x (m)",
              [0, end],
              [-2.5 * c.amplitude, 2.5 * c.amplitude],
              [
                line("合成响应", (t) => forcedMotion(c.u, t).total, end),
                line("稳态分量", (t) => forcedMotion(c.u, t).steady, end, "--"),
              ],
            ),
            t,
            forcedMotion(c.u, t).total,
          );
        },
      },
    ],
    engineering: industry(
      "对仪器支架进行频响测量时，必须在每个频率点等待暂态衰减。暂态和稳态叠加可使短时读数偏离真实幅值，导致共振风险判断失准。",
    ),
  },
);
