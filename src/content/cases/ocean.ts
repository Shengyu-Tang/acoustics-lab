import { problem, parameter, question, physical, line, dot, ymark, fmt } from "./shared";
import { beamWidth, thorpDbKm, spreadingLoss } from "../../physics/engineering";
const p = {
  rho: 1025,
  c: 1500,
  f: 50000,
  a: 0.05,
  low: 30000,
  high: 50000,
  r: 1000,
  beamLimit: 22,
  lossLimit: 80,
};
const select = (p: import("../p1").Values) =>
  [p.low, p.high]
    .sort((a, b) => a - b)
    .find((f) => beamWidth(p.a, f, p.c) <= p.beamLimit && spreadingLoss(p.r, f) <= p.lossLimit) ??
  0;
const setup =
  "bw=@(ff) 360/pi*asin(min(1,1.61633*c./(2*pi*ff*a))); ab=@(ff) .11*(ff/1000).^2./(1+(ff/1000).^2)+44*(ff/1000).^2./(4100+(ff/1000).^2)+2.75e-4*(ff/1000).^2+.003; tl=@(ff) 20*log10(r)+ab(ff)*r/1000; candidates=sort([low high]); ok=bw(candidates)<=beamLimit & tl(candidates)<=lossLimit; chosen=0;if any(ok),chosen=candidates(find(ok,1));end;";
export default problem({
  id: "ocean",
  title: "海底观测站主动声呐的频率选择",
  lectures: ["4.4.3", "4.4.4", "7.1", "7.2"],
  background:
    "海底观测站拟以圆面活塞发射器搜索 1 km 外的目标。备选频率为 30 kHz 和 50 kHz，孔径相同；高频有利于分辨方向，却增加海水吸收。先计算两方案，再按波束与单程传播损失两项指标选择较低的可行频率，为后续回波预算留出余量。",
  criterion:
    "两候选中选择同时满足 −3 dB 全波束宽度 ≤ 波束限值、单程传播损失 ≤ 损失限值的较低频率；均不满足时填 0。",
  assumptions:
    "均匀海水、球面几何扩展、1 m 为传播损失参考距离。吸收用索普经验式，频率代入 kHz，输出 dB/km；此处单程损失不等同于主动声呐往返预算。瑞利距离采用课件的直径平方除以波长。",
  sources: [{ title: "索普海水吸收经验式（沿用 7.2 节）", href: "#/lab?topic=7.2" }],
  defaults: p,
  given: [
    parameter("a", "活塞半径", "a", "m", 0.04, 0.1, 0.001),
    parameter("c", "海水声速", "c", "m/s", 1450, 1550, 1),
    parameter("low", "候选低频", "f_L", "Hz", 25000, 40000, 100),
    parameter("high", "候选高频", "f_H", "Hz", 45000, 70000, 100),
    parameter("r", "目标距离", "r", "m", 500, 1500, 10),
    parameter("beamLimit", "全波束宽度上限", "β_{lim}", "°", 10, 40, 1),
    parameter("lossLimit", "单程损失上限", "L_{lim}", "dB", 65, 95, 1),
  ],
  asks: [
    question(
      "beamLow",
      "(1) 低频方案全波束宽度",
      "°",
      String.raw`\beta_L=2\arcsin\frac{1.61633c}{2\pi f_La}`,
      "bw(low)",
      (p) => beamWidth(p.a, p.low, p.c),
      (p) => `2 asin[1.61633 × ${p.c} m/s / (2π × ${p.low} Hz × ${p.a} m)]，弧度转角度。`,
    ),
    question(
      "alphaHigh",
      "(2) 高频方案海水吸收系数",
      "dB/km",
      String.raw`\alpha'=\frac{0.11F^2}{1+F^2}+\frac{44F^2}{4100+F^2}+2.75\times10^{-4}F^2+0.003,\quad F=f_H/(1000\,\mathrm{Hz})`,
      "ab(high)",
      (p) => thorpDbKm(p.high),
      (p) => `将 F = ${p.high / 1000} 代入索普经验式。`,
    ),
    question(
      "lossHigh",
      "(3) 高频方案单程传播损失",
      "dB",
      String.raw`TL_H=20\lg(r/1\,\mathrm m)+\alpha'_Hr/1000`,
      "tl(high)",
      (p) => spreadingLoss(p.r, p.high),
      (p) => `20 lg(${p.r} m / 1 m) + ${fmt(thorpDbKm(p.high))} dB/km × ${p.r / 1000} km。`,
    ),
    question(
      "beamHigh",
      "(4) 高频方案全波束宽度",
      "°",
      String.raw`\beta_H=2\arcsin\frac{1.61633c}{2\pi f_Ha}`,
      "bw(high)",
      (p) => beamWidth(p.a, p.high, p.c),
      (p) => `2 asin[1.61633 × ${p.c} m/s / (2π × ${p.high} Hz × ${p.a} m)]，弧度转角度。`,
    ),
    question(
      "selected",
      "(5) 选定频率（无可行方案填 0）",
      "Hz",
      String.raw`f_* = \min\{f_i:\beta_i\leq\beta_{lim},TL_i\leq L_{lim}\}`,
      "chosen",
      select,
      (p) =>
        `低频损失 ${fmt(spreadingLoss(p.r, p.low))} dB，高频损失 ${fmt(spreadingLoss(p.r, p.high))} dB；分别与 ${p.beamLimit}°、${p.lossLimit} dB 比较。`,
    ),
  ],
  hints: [
    "先用圆活塞的半功率根求全波束宽度，再把吸收与球面扩展相加。",
    "吸收频率先除以 1000；距离除以 1000 得 km。逐个筛选两项指标，再选较低频率。",
  ],
  judgment: (p) =>
    select(p)
      ? `选择 ${fmt(select(p))} Hz；两项指标均满足。若用于回波探测，仍需将两倍传播损失、目标强度与噪声纳入完整预算。`
      : "两个频率均未通过双重指标，应增大孔径或重新分配传播预算。",
  plot: (p) => {
    const selected = select(p);
    const q = physical(
      p,
      "孔径、频率与传播预算的折中",
      "频率 f (Hz)",
      "全波束宽度 (°)",
      [10000, 80000],
      "[10000 80000]",
      [
        line("全波束宽度", (f) => beamWidth(p.a, f, p.c), [10000, 80000], "bw(x)"),
        {
          ...line("单程传播损失", (f) => spreadingLoss(p.r, f), [10000, 80000], "tl(x)"),
          axis: "right",
        },
        {
          ...line(
            "单程传播损失上限",
            () => p.lossLimit,
            [10000, 80000],
            "lossLimit+zeros(size(x))",
            "--",
          ),
          axis: "right",
        },
        dot("低频波束", p.low, beamWidth(p.a, p.low, p.c), "low", "bw(low)"),
        dot("高频波束", p.high, beamWidth(p.a, p.high, p.c), "high", "bw(high)"),
      ],
      setup,
      {
        answerKey: "selected",
        rightLabel: "单程传播损失 (dB)",
        annotations: [
          ymark(p.beamLimit, "全波束宽度上限"),
          {
            axis: "x",
            value: selected || p.high,
            label: selected ? "选定频率" : "无可行频率，复核高频",
          },
        ],
      },
      { annotations: ["beamLimit", "max(chosen,high*(chosen==0))"] },
    );
    return q;
  },
});
