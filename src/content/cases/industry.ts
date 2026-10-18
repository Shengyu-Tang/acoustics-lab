import { problem, parameter, question, physical, line, dot, ymark, fmt } from "./shared";
import { mountAmplitude, forceTransmission } from "../../physics/engineering";
import type { Values } from "./shared";
const p = {
  rho: 1000,
  c: 1500,
  f: 1900 / 60,
  M: 10,
  D: 395000,
  Rm: 80,
  F0: 50,
  n: 1900,
  limit: 0.001,
  newD: 40000,
  tLimit: 0.3,
};
const f = (p: Values) => p.n / 60;
const choice = (p: Values) =>
  [p.D, p.newD].find(
    (D) =>
      mountAmplitude({ ...p, D }, f(p)) < p.limit &&
      forceTransmission({ ...p, D }, f(p)) <= p.tLimit,
  ) ?? 0;
const minimumR = (p: Values) =>
  Math.sqrt(Math.max(0, (p.F0 / p.limit) ** 2 - (p.D - p.M * (2 * Math.PI * f(p)) ** 2) ** 2)) /
  (2 * Math.PI * f(p));
const setup =
  "fp=n/60;ww=2*pi*fp; amp=@(ff,dd) F0./hypot(dd-M*(2*pi*ff).^2,Rm*2*pi*ff); tr=@(ff,dd) hypot(dd,Rm*2*pi*ff)./hypot(dd-M*(2*pi*ff).^2,Rm*2*pi*ff); rmin=sqrt(max(0,(F0/limit)^2-(D-M*ww^2)^2))/ww; chosenD=0;for dd=[D newD],if amp(fp,dd)<limit && tr(fp,dd)<=tLimit,chosenD=dd;break;end;end;";
export default problem({
  id: "industry",
  title: "精密车间支架的共振校核与隔振设计",
  lectures: ["1.1.5", "1.2.4", "1.2.5"],
  defaults: p,
  background:
    "精密车间中，水泵周期力通过一套仪器支架传入基础。原支架接近泵的工作转频，测量行程超限；增加阻尼可能限制行程，却未必减小传给基础的力。先完成共振校核，再比较原刚度与低刚度候选方案，同时检查位移和力传递率。",
  criterion:
    "当前转速下，位移幅值须严格小于限值，传给基础的力幅值与输入力幅值之比须不超过传递率上限。先检查原刚度，再检查候选刚度，填第一项合格刚度；均不合格填 0。",
  assumptions:
    "线性黏性阻尼、恒力激励、单自由度质量块。传递率采用弹簧与阻尼器合力的幅值比，不能用位移幅频响应直接代替。只对当前转速作设计选择，投产前还需检查完整运行转速范围与静挠度。",
  given: [
    parameter("M", "等效质量", "M", "kg", 5, 20, 0.1),
    parameter("D", "原支架弹性系数", "D", "N/m", 200000, 600000, 1000),
    parameter("Rm", "支架力阻", "R_m", "kg/s", 40, 500, 1),
    parameter("F0", "泵作用力幅值", "F_0", "N", 20, 100, 1),
    parameter("n", "泵转速", "n", "r/min", 1500, 2400, 1),
    parameter("limit", "允许位移幅值", "x_{lim}", "m", 0.0003, 0.003, 0.0001),
    parameter("newD", "候选弹性系数", "D_*", "N/m", 10000, 80000, 1000),
    parameter("tLimit", "力传递率上限", "T_{lim}", "—", 0.1, 0.5, 0.01),
  ],
  asks: [
    question(
      "f0",
      "(1) 原支架固有频率",
      "Hz",
      String.raw`f_0=\sqrt{D/M}/(2\pi)`,
      "sqrt(D/M)/(2*pi)",
      (p) => Math.sqrt(p.D / p.M) / (2 * Math.PI),
      (p) => `√(${p.D} N/m / ${p.M} kg)/(2π)。`,
    ),
    question(
      "quality",
      "(2) 原支架品质因数",
      "—",
      String.raw`Q_m=\sqrt{MD}/R_m`,
      "sqrt(M*D)/Rm",
      (p) => Math.sqrt(p.M * p.D) / p.Rm,
      (p) => `√(${p.M} kg × ${p.D} N/m) / (${p.Rm} kg/s)。`,
    ),
    question(
      "displacement",
      "(3) 原支架工作位移幅值",
      "mm",
      String.raw`x_m=\frac{F_0}{\sqrt{(D-M\omega^2)^2+(R_m\omega)^2}},\quad\omega=2\pi n/60`,
      "amp(fp,D)*1000",
      (p) => 1000 * mountAmplitude(p, f(p)),
      (p) =>
        `ω = ${fmt(2 * Math.PI * f(p))} rad/s；${p.F0} N / hypot[${p.D} N/m − ${p.M} kg × ω², ${p.Rm} kg/s × ω]，结果从 m 转 mm。`,
    ),
    question(
      "minimumR",
      "(4) 原刚度下满足位移限值的力阻阈值",
      "kg/s",
      String.raw`R_{min}=\frac{\sqrt{\max[0,(F_0/x_{lim})^2-(D-M\omega^2)^2]}}{\omega}`,
      "rmin",
      minimumR,
      (p) =>
        `将 x = ${p.limit} m、ω = ${fmt(2 * Math.PI * f(p))} rad/s 代入；实际选型须大于该阈值。`,
    ),
    question(
      "newDisplacement",
      "(5) 候选刚度的位移幅值",
      "mm",
      String.raw`x_* = F_0/\sqrt{(D_*-M\omega^2)^2+(R_m\omega)^2}`,
      "amp(fp,newD)*1000",
      (p) => 1000 * mountAmplitude({ ...p, D: p.newD }, f(p)),
      (p) => `将刚度改为 ${p.newD} N/m，力阻仍为 ${p.Rm} kg/s，重复第 3 步。`,
    ),
    question(
      "transmissibility",
      "(6) 候选刚度的力传递率",
      "—",
      String.raw`T_F=\frac{\sqrt{D_*^2+(R_m\omega)^2}}{\sqrt{(D_*-M\omega^2)^2+(R_m\omega)^2}}`,
      "tr(fp,newD)",
      (p) => forceTransmission({ ...p, D: p.newD }, f(p)),
      (p) =>
        `分子 hypot[${p.newD} N/m, ${p.Rm} kg/s × ${fmt(2 * Math.PI * f(p))} rad/s]，分母采用第 5 步的动态刚度。`,
    ),
    question(
      "chosen",
      "(7) 选定弹性系数（无解填 0）",
      "N/m",
      String.raw`D_{sel}\in\{D,D_*\}:x<x_{lim},\ T_F\leq T_{lim}`,
      "chosenD",
      choice,
      (p) => `位移与 ${p.limit * 1000} mm 比较，传递率与 ${p.tLimit} 比较，先原方案后候选方案。`,
    ),
  ],
  hints: [
    "用机械动态刚度算位移；品质因数与固有频率决定共振的尖锐程度。",
    "传给基础的力为弹簧力与黏性力的矢量和。分别检查位移和力传递率，不能以降低共振峰就认定隔振成功。",
  ],
  judgment: (p) =>
    choice(p)
      ? `选定刚度 ${fmt(choice(p))} N/m，通过当前转速的两项指标。增加阻尼的位移校核不能代替隔振校核。`
      : "两项刚度均未通过，应重新选质量、刚度或工作转速。",
  plot: (p) =>
    physical(
      p,
      "支架位移与力传递率的方案比较",
      "激励频率 f (Hz)",
      "位移幅值 (mm)",
      [20, 60],
      "[20 60]",
      [
        line("原支架位移", (x) => 1000 * mountAmplitude(p, x), [20, 60], "1000*amp(x,D)"),
        line(
          "候选支架位移",
          (x) => 1000 * mountAmplitude({ ...p, D: p.newD }, x),
          [20, 60],
          "1000*amp(x,newD)",
        ),
        {
          ...line(
            "候选支架力传递率",
            (x) => forceTransmission({ ...p, D: p.newD }, x),
            [20, 60],
            "tr(x,newD)",
          ),
          axis: "right",
        },
        {
          ...line("传递率上限", () => p.tLimit, [20, 60], "tLimit+zeros(size(x))", "--"),
          axis: "right",
        },
        dot("原工作位移", f(p), 1000 * mountAmplitude(p, f(p)), "fp", "1000*amp(fp,D)"),
        dot(
          "候选工作位移",
          f(p),
          1000 * mountAmplitude({ ...p, D: p.newD }, f(p)),
          "fp",
          "1000*amp(fp,newD)",
        ),
      ],
      setup,
      {
        answerKey: "newDisplacement",
        rightLabel: "力传递率",
        annotations: [ymark(1000 * p.limit, "位移限值")],
      },
      { annotations: ["1000*limit"] },
    ),
});
