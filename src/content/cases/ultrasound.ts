import {
  problem,
  parameter,
  question,
  physical,
  line,
  dot,
  xmark,
  fmt,
  type Values,
} from "./shared";
import { transmission } from "../../physics/engineering";
const p = {
  rho: 1000,
  c: 1480,
  f: 5000000,
  a: 0.003,
  low: 2000000,
  high: 5000000,
  Zwater: 1480000,
  Zsteel: 46000000,
  cs: 5900,
  cycles: 2,
  z: 0.8,
  depth: 0.03,
  resolutionLimit: 0.002,
};
const rayleigh = (p: Values, f: number) => (4 * p.a * p.a * f) / p.c;
const resolution = (p: Values, f: number) => (p.cycles * p.cs) / (2 * f);
const choice = (p: Values) =>
  [p.low, p.high]
    .sort((a, b) => a - b)
    .find((f) => resolution(p, f) <= p.resolutionLimit && p.z >= 5 * rayleigh(p, f)) ?? 0;
const axial = (p: Values, f: number) =>
  2 * Math.abs(Math.sin(((Math.PI * f) / p.c) * (Math.hypot(p.z, p.a) - p.z)));
const echo = (p: Values, f: number, x: number) =>
  transmission(p.Zwater, p.Zsteel) *
  axial(p, f) *
  Math.exp(-4 * Math.log(2) * ((x - p.depth) / resolution(p, f)) ** 2);
const setup =
  "ti=4*Zwater*Zsteel/(Zwater+Zsteel)^2; re=@(ff) 4*a^2*ff/c; dr=@(ff) cycles*cs./(2*ff); ax=@(ff) 2*abs(sin(pi*ff/c*(hypot(z,a)-z))); echo=@(xx,ff) ti*ax(ff)*exp(-4*log(2)*((xx-depth)/dr(ff)).^2); candidates=sort([low high]); chosen=0;for cf=candidates,if dr(cf)<=resolutionLimit && z>=5*re(cf),chosen=cf;break;end;end;";
export default problem({
  id: "ultrasound",
  title: "水浸超声探头的界面透射、分辨率与校准距离",
  lectures: ["3.6.3", "3.6.5", "4.4.4"],
  defaults: p,
  background:
    "水浸检测线用圆形探头检查钢件内约 30 mm 深的平面反射体。采购提供两种中心频率，脉冲周期数相同。高频提高轴向分辨率，同时拉长近场；还要计算水—钢界面的耦合损失，确认现有水槽距离足够进行远场校准。",
  criterion:
    "候选频率中取最低的可行项：轴向脉冲分辨长度 ≤ 指标，水槽校准距离 ≥ 5 倍课件瑞利距离；都不满足填 0。",
  assumptions:
    "正入射纵波的标量近似，忽略横波、衰减、模式转换与曲面缺陷；瑞利距离为直径平方除以水中波长。图显示单位表面声压下的理想单次回波包络，双程界面声压乘积等于单程能量透射系数；高斯包络半高全宽按周期数乘以波长的一半估算。",
  given: [
    parameter("a", "探头半径", "a", "m", 0.002, 0.005, 0.0001),
    parameter("low", "低频探头", "f_L", "Hz", 1500000, 2500000, 100000),
    parameter("high", "高频探头", "f_H", "Hz", 4000000, 6000000, 100000),
    parameter("Zwater", "水特性阻抗", "Z_w", "Pa·s/m", 1400000, 1600000, 10000),
    parameter("Zsteel", "钢纵波特性阻抗", "Z_s", "Pa·s/m", 40000000, 50000000, 100000),
    parameter("cs", "钢中纵波声速", "c_s", "m/s", 5600, 6100, 10),
    parameter("cycles", "脉冲周期数", "N", "—", 1, 4, 1),
    parameter("z", "水槽校准距离", "z", "m", 0.1, 1.2, 0.01),
    parameter("depth", "反射体深度", "h", "m", 0.01, 0.06, 0.001),
    parameter("resolutionLimit", "允许分辨长度", "Δr_{lim}", "m", 0.001, 0.004, 0.0001),
  ],
  asks: [
    question(
      "energy",
      "(1) 水入钢的单程能量透射系数",
      "—",
      String.raw`t_I=4Z_wZ_s/(Z_w+Z_s)^2`,
      "ti",
      (p) => transmission(p.Zwater, p.Zsteel),
      (p) => `4 × ${p.Zwater} Pa·s/m × ${p.Zsteel} Pa·s/m / (${p.Zwater + p.Zsteel} Pa·s/m)²。`,
    ),
    question(
      "wavelength",
      "(2) 高频探头在水中的波长",
      "m",
      String.raw`\lambda_H=c_w/f_H`,
      "c/high",
      (p) => p.c / p.high,
      (p) => `${p.c} m/s / ${p.high} Hz。`,
    ),
    question(
      "lastMaximum",
      "(3) 高频探头轴向最远极大位置",
      "m",
      String.raw`D_0=a^2/\lambda_H-\lambda_H/4`,
      "a^2*high/c-c/(4*high)",
      (p) => (p.a * p.a * p.high) / p.c - p.c / (4 * p.high),
      (p) => `${p.a}² m² / (${fmt(p.c / p.high)} m) − ${fmt(p.c / p.high)} m / 4。`,
    ),
    question(
      "calibration",
      "(4) 高频探头建议最小校准距离",
      "m",
      String.raw`z_{min}=5R_e=5(2a)^2/\lambda_H`,
      "5*re(high)",
      (p) => 5 * rayleigh(p, p.high),
      (p) => `5 × (2 × ${p.a} m)² / (${fmt(p.c / p.high)} m)。`,
    ),
    question(
      "resolution",
      "(5) 高频探头的轴向分辨长度",
      "m",
      String.raw`\Delta r=Nc_s/(2f_H)`,
      "dr(high)",
      (p) => resolution(p, p.high),
      (p) => `${p.cycles} × ${p.cs} m/s / (2 × ${p.high} Hz)。`,
    ),
    question(
      "chosen",
      "(6) 选定中心频率（无解填 0）",
      "Hz",
      String.raw`f_* = \min\{f_i:\Delta r_i\leq\Delta r_{lim},z\geq5R_{e,i}\}`,
      "chosen",
      choice,
      (p) =>
        `两频率的分辨长度为 ${fmt(resolution(p, p.low))}、${fmt(resolution(p, p.high))} m；最小校准距离为 ${fmt(5 * rayleigh(p, p.low))}、${fmt(5 * rayleigh(p, p.high))} m，与 ${p.resolutionLimit} m 和 ${p.z} m 比较。`,
    ),
  ],
  hints: [
    "先区别声压透射系数与声强透射系数；水中波长用于水槽近场，钢中波长用于内部缺陷分辨率。",
    "两种探头都检查 Δr=Nc_s/(2f) 和 z≥5d²/λ_w。频率升高会同时减小分辨长度、增加校准距离。",
  ],
  judgment: (p) =>
    choice(p)
      ? `选择 ${fmt(choice(p))} Hz，满足当前分辨率与校准空间条件。双程耦合损失仍须计入回波灵敏度预算。`
      : "现有水槽与分辨率要求不能同时满足，需要改变孔径、脉冲周期数或校准距离。",
  plot: (p) =>
    physical(
      p,
      "相同缺陷深度下两种探头的理想回波包络",
      "反射体深度 h (m)",
      "回波声压幅值 (Pa)",
      [0, 0.08],
      "[0 .08]",
      [
        line("低频探头回波", (x) => echo(p, p.low, x), [0, 0.08], "echo(x,low)"),
        line("高频探头回波", (x) => echo(p, p.high, x), [0, 0.08], "echo(x,high)"),
        dot("高频包络峰值", p.depth, echo(p, p.high, p.depth), "depth", "echo(depth,high)"),
      ],
      setup,
      {
        answerKey: "resolution",
        annotations: [
          xmark(p.depth - resolution(p, p.high) / 2, "高频半高宽左端"),
          xmark(p.depth + resolution(p, p.high) / 2, "高频半高宽右端"),
          xmark(p.depth + p.resolutionLimit, "允许分辨长度终点（相对缺陷）"),
        ],
      },
      { annotations: ["depth-dr(high)/2", "depth+dr(high)/2", "depth+resolutionLimit"] },
    ),
});
