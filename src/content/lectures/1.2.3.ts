import { lecture, mechanics, force, parameter, fmt, industry, type Values } from "../p1";
import { decay, forcedMotion, pulseMotion } from "../../physics/p1";
import { panel, line, extent, working } from "../../plot/p1Helpers";
const q = parameter("Qm", "品质因数", "Qₘ", "—", 5, 20, 0.5),
  pulse = parameter("pulseCycles", "脉冲宽度", "N_on", "周期", 2, 20, 1),
  gap = parameter("gapCycles", "脉冲间隔", "N_gap", "周期", 4, 30, 1);
const defaults = {
  M: 10,
  D: 395000,
  Qm: 10,
  F0: 50,
  ratio: 0.96,
  x0: 0,
  v0: 0,
  pulseCycles: 8,
  gapCycles: 12,
};
const info = (p: Values) => {
  const u = { ...p, Rm: Math.sqrt(p.M * p.D) / p.Qm };
  return { ...decay(u), u, A: (p.F0 * p.Qm) / p.D };
};
const rise = (p: Values) => {
  const c = info(p),
    end = extent(6 / c.delta),
    u = { ...c.u, ratio: 1 };
  return {
    ...panel(
      "共振建立：精确响应与近似包络",
      "时间 t (s)",
      "位移 x (m)",
      [0, end],
      [-c.A * 1.4, c.A * 2],
      [
        line("精确零初值响应", (t) => forcedMotion(u, t).total, end),
        line("建立包络（弱阻尼近似）", (t) => c.A * (1 - Math.exp(-c.delta * t)), end, "--"),
        line("负包络（近似）", (t) => -c.A * (1 - Math.exp(-c.delta * t)), end, "--"),
      ],
    ),
    annotations: [
      { axis: "x" as const, value: c.transition, label: `95%：${fmt(c.transition)} s` },
    ],
  };
};
export default lecture(
  "1.2.3",
  [
    "暂态频率接近固有频率，稳态频率等于外力频率；两者相近时叠加形成拍。暂态指数衰减，因此拍逐渐消失。",
    "脉冲宽度应考虑建立时间，否则达不到目标幅值；脉冲间隔应允许余振衰减，以免相邻脉冲串扰。Qₘ 越大，建立和衰减越慢，波形畸变越明显。",
  ],
  {
    defaults,
    parameters: [
      ...mechanics,
      q,
      force,
      parameter("ratio", "偏频图激励频率比", "ω/ω₀", "—", 0.85, 1.15, 0.01),
      pulse,
      gap,
    ],
    keyPoints: [
      "过渡过程由暂态与稳态叠加构成，共振附近出现逐渐消失的拍。",
      "共振建立包络在弱阻尼下近似为 1−e^(−δt)。",
      "过渡时间：课件约定 τ₀ = QₘT₀ = π/δ（包络达到约 95.68%）；精确达到 95% 的时间为 ln20/δ，Qₘ 越大建立越慢。",
      "矩形脉冲的填充正弦激励会因建立和余振而畸变，需同时选择脉冲宽度与间隔。",
    ],
    formulas: [
      {
        number: "1.2-14",
        tex: String.raw`A(t)\simeq x_{m,\infty}(1-e^{-\delta t}),\quad x_{m,\infty}=\frac{F_0}{R_m\omega_0}`,
        meaning: "图中位移使用完整初值解，虚线为弱阻尼包络近似；Qₘ 较小时两者会有差异。",
      },
      {
        number: "1.2-15",
        tex: String.raw`\tau_{95}=\frac{\ln20}{\delta}=\frac{2Q_m\ln20}{\omega_0},\quad \frac{\tau_{95}}{T_0}=\frac{Q_m\ln20}{\pi}`,
        meaning:
          "按本批任务使用精确 95% 包络定义。课件第 9–10 页用 τ₀ = π/δ = QₘT₀，对应 95.68%，属于略宽松的近似时间约定。",
      },
      {
        number: "1.2-16",
        tex: String.raw`F(t)=F_0\sin\omega_0t\sum_{j=0}^{1}\left[H(t-jP)-H(t-jP-t_{\rm on})\right],\quad P=t_{\rm on}+t_{\rm gap}`,
        meaning:
          "脉冲图用精确开关响应叠加；各行按各自稳态共振幅值归一化，叠画的虚线是激励门控包络。",
      },
    ],
    figures: [
      {
        number: "1.2.3-1",
        title: "共振响应建立与 95% 过渡时间",
        rows: 1,
        cols: 1,
        plot: (p) => [rise(p)],
      },
      {
        number: "1.2.3-2",
        title: "频率略偏离固有频率时的衰减拍",
        rows: 1,
        cols: 1,
        plot: (p) => {
          const c = info(p),
            end = extent(6 / c.delta),
            max = c.A * 2;
          return [
            panel(
              "近共振：衰减的暂态拍",
              "时间 t (s)",
              "位移 x (m)",
              [0, end],
              [-max, max],
              [
                line("合成响应", (t) => forcedMotion(c.u, t).total, end),
                line("最终稳态", (t) => forcedMotion(c.u, t).steady, end, "--"),
              ],
            ),
          ];
        },
      },
      {
        number: "1.2.3-3",
        title: "正弦填充矩形脉冲的波形畸变",
        rows: 3,
        cols: 1,
        plot: (p) => {
          const T = (2 * Math.PI) / Math.sqrt(p.D / p.M),
            on = p.pulseCycles * T,
            gap = p.gapCycles * T,
            end = extent(2 * (on + gap));
          return [1.7, 5, 10].map((Q) => {
            const u = { ...p, Rm: Math.sqrt(p.M * p.D) / Q, ratio: 1 },
              A = (p.F0 * Q) / p.D;
            return panel(
              `Qₘ = ${Q}：归一化响应与激励门控`,
              "时间 t (s)",
              "响应 / 稳态幅值 (—)",
              [0, end],
              [-1.5, 2],
              [
                line("脉冲响应", (t) => pulseMotion(u, t, on, gap) / A, end, "-", 4001),
                line(
                  "激励包络",
                  (t) => (t < 2 * (on + gap) && t % (on + gap) < on ? 1 : 0),
                  end,
                  "--",
                  4001,
                ),
              ],
            );
          });
        },
      },
    ],
    readouts: (p) => {
      const c = info(p);
      return [
        ["阻尼系数 δ", c.delta, "s⁻¹"],
        ["95% 过渡时间", c.transition, "s"],
        ["课件 π/δ 时间", Math.PI / c.delta, "s"],
        ["95% 建立周期数", c.transition / c.T, "周期"],
        ["本次脉冲末近似建立比例", (1 - Math.exp(-c.delta * p.pulseCycles * c.T)) * 100, "%"],
      ];
    },
    examples: [
      {
        title: "例题　脉冲发射器的建立时间与脉宽",
        background:
          "脉冲激励器等效质量 10 kg、刚度 395000 N/m、品质因数 10。希望正弦填充脉冲内达到稳态幅值的 95%，试判断 8 周期的脉宽是否足够。",
        defaults,
        given: [...mechanics, q, pulse],
        asks: [
          {
            key: "time95",
            text: "(1) 95% 建立时间",
            unit: "s",
            tex: String.raw`\tau_{95}=2Q_m\ln20/\sqrt{D/M}`,
            matlab: "2*Qm*log(20)/sqrt(D/M)",
            calc: (p) => info(p).transition,
            sub: (p) => `2 × ${p.Qm} × ln20 / √(${p.D}/${p.M}) s`,
          },
          {
            key: "riseFraction",
            text: "(2) 脉冲末建立比例",
            unit: "—",
            tex: String.raw`A(t_{\rm on})/A_\infty=1-e^{-\pi N_{\rm on}/Q_m}`,
            matlab: "1-exp(-pi*pulseCycles/Qm)",
            calc: (p) => 1 - Math.exp((-Math.PI * p.pulseCycles) / p.Qm),
            sub: (p) => `1 − exp[−π × ${p.pulseCycles}/${p.Qm}]`,
          },
        ],
        hints: [
          "达到 95% 意味着剩余指数项等于 0.05。",
          "脉宽 t_on = N_on T₀，因此 δt_on = πN_on/Qₘ。",
        ],
        judgment: (p) =>
          `当前脉宽的近似建立比例为 ${fmt((1 - Math.exp((-Math.PI * p.pulseCycles) / p.Qm)) * 100)}%；${p.pulseCycles >= (p.Qm * Math.log(20)) / Math.PI ? "达到" : "未达到"} 95% 要求。还需留足余振衰减间隔。`,
        plot: (p) => {
          const c = info(p);
          return working({ ...rise(p), annotations: [] }, c.transition, 0.95 * c.A);
        },
      },
    ],
    engineering: industry(
      "脉冲声源与振动激励器的高 Qₘ 有助于窄带增益，却使短脉冲建立不足、关断后余振变长。按建立时间和余振时间选脉宽与重复周期，可减少相邻脉冲的干扰。",
    ),
  },
);
