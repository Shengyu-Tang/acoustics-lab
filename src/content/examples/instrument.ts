import { instrumentSolution, instrument } from "../../physics/chapter1";
export const example = {
  id: "instrument-A",
  title: "样题 A　船载仪器支架的共振校核",
  background:
    "船上一台精密仪器安装在弹性支架上。附近水泵转速可能在 1500–2400 r/min 之间变化，泵的周期作用力会通过船体传到支架。需要计算当前振幅，判断仪器能否正常工作，并选择加阻尼或调整刚度的改进措施。",
  given: [
    { key: "M", symbol: "M", name: "仪器与支架等效质量", unit: "kg", min: 1, max: 100, step: 1 },
    {
      key: "D",
      symbol: "D",
      name: "支架弹性系数",
      unit: "N/m",
      min: 1000,
      max: 1000000,
      step: 1000,
    },
    { key: "Rm", symbol: "Rₘ", name: "支架力阻", unit: "kg/s", min: 1, max: 2000, step: 1 },
    { key: "F0", symbol: "F₀", name: "激励力幅值", unit: "N", min: 1, max: 200, step: 1 },
    { key: "n", symbol: "n", name: "泵转速", unit: "r/min", min: 1500, max: 2400, step: 1 },
    {
      key: "limit",
      symbol: "x_{lim}",
      name: "允许位移幅值（严格小于）",
      unit: "mm",
      min: 0.1,
      max: 10,
      step: 0.1,
    },
  ] as const,
  asks: [
    { key: "f0", text: "(1) 固有频率 f₀", unit: "Hz" },
    { key: "Qm", text: "(2a) 品质因数 Qₘ", unit: "—" },
    { key: "bandwidth", text: "(2b) 半功率带宽 Δf", unit: "Hz" },
    { key: "xMm", text: "(3) 当前转速的位移幅值 xₘ", unit: "mm" },
    { key: "minimumRm", text: "(4) 满足位移上限的力阻阈值（实际取值应更大）", unit: "kg/s" },
  ] as const,
  solve: instrumentSolution,
  defaults: instrument,
  hints: [
    "用 $\\omega_0 = \\sqrt{D/M}$、$Q_m = \\omega_0M/R_m$，再用机械阻抗计算振速和位移。",
    "先将转速除以 60 得 f，再算 $\\omega = 2\\pi f$。用 $x_m = F_0/[\\omega\\sqrt{R_m^2+X_m^2}]$；将 xₘ 换成允许值，反解 Rₘ。",
  ],
};
