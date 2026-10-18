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
import { beamWidth } from "../../physics/engineering";
const p = {
  rho: 1000,
  c: 1500,
  f: 80000,
  cl: 1000,
  a: 0.03,
  focus: 0.2,
  low: 50000,
  high: 80000,
  beamLimit: 20,
  errorLimit: 0.1,
};
const n = (p: Values) => p.c / p.cl;
const radius = (p: Values) => Math.round(p.focus * (n(p) - 1) * 1000) / 1000;
const deviation = (p: Values, y = p.a) =>
  Math.asin((n(p) * y) / radius(p)) - Math.asin(y / radius(p));
const edgeFocus = (p: Values) => p.a / Math.tan(deviation(p));
const choice = (p: Values) =>
  Math.abs(edgeFocus(p) / p.focus - 1) <= p.errorLimit
    ? ([p.low, p.high].sort((a, b) => a - b).find((f) => beamWidth(p.a, f, p.c) <= p.beamLimit) ??
      0)
    : 0;
const setup =
  "index=c/cl;radius=round(focus*(index-1)*1000)/1000;deviation=@(yy) asin(index*yy/radius)-asin(yy/radius);edgeF=a/tan(deviation(a));bw=@(ff) 360/pi*asin(min(1,1.61633*c./(2*pi*ff*a)));chosen=0;candidates=sort([low high]);if abs(edgeF/focus-1)<=errorLimit,ok=bw(candidates)<=beamLimit;if any(ok),chosen=candidates(find(ok,1));end;end;plotF=chosen;if plotF==0,plotF=high;end;waist=.257*c/plotF*focus/a;";
export default problem({
  id: "grin-lens",
  title: "水下机器人声透镜的焦距与孔径设计",
  lectures: ["3.5.2", "4.4.3", "3.6.8"],
  defaults: p,
  background:
    "水下机器人需用被动声透镜把换能器的平面波聚到前方约 0.2 m 处。初步方案采用低声速、平面入射面的薄平凸透镜，而非先假设梯度材料一定能校正像差。按折射定律求制造曲率，检查边缘声线焦移，再选择使等效圆孔径波束宽度达标的频率。",
  criterion:
    "曲率半径按近轴薄透镜公式计算并取至 1 mm；边缘声线焦距相对目标焦距误差不超过给定限值。通过焦移校核后，从两个候选频率中选择全波束宽度达标的较低项；任一条件无解填 0。",
  assumptions:
    "无损、流体等效、平面波正入射薄透镜，出射曲面为球面；相对折射率 n=c水/c透镜。声线图用精确斯涅尔折射角，衍射包络为近轴圆孔径半功率尺度估计，不能代替完整近场积分或真实梯度透镜设计。参数范围保证边缘无全内反射。",
  given: [
    parameter("c", "水中声速", "c_w", "m/s", 1480, 1520, 1),
    parameter("cl", "透镜材料声速", "c_l", "m/s", 950, 1050, 1),
    parameter("a", "有效孔径半径", "a", "m", 0.02, 0.035, 0.001),
    parameter("focus", "目标焦距", "F", "m", 0.18, 0.25, 0.001),
    parameter("low", "低频候选", "f_L", "Hz", 40000, 60000, 1000),
    parameter("high", "高频候选", "f_H", "Hz", 70000, 100000, 1000),
    parameter("beamLimit", "全波束宽度上限", "β_{lim}", "°", 15, 30, 1),
    parameter("errorLimit", "允许相对焦移", "ε_{lim}", "—", 0.03, 0.2, 0.01),
  ],
  asks: [
    question(
      "index",
      "(1) 透镜相对折射率",
      "—",
      String.raw`n=c_w/c_l`,
      "index",
      n,
      (p) => `${p.c} m/s / ${p.cl} m/s。`,
    ),
    question(
      "curvature",
      "(2) 制造曲率半径（取至毫米）",
      "m",
      String.raw`R=F(n-1)`,
      "radius",
      radius,
      (p) => `${p.focus} m × (${fmt(n(p))} − 1)，四舍五入至 0.001 m。`,
    ),
    question(
      "edgeAngle",
      "(3) 边缘声线向轴偏折角",
      "°",
      String.raw`\delta=\arcsin(na/R)-\arcsin(a/R)`,
      "deviation(a)*180/pi",
      (p) => (deviation(p) * 180) / Math.PI,
      (p) => `asin(${fmt(n(p))} × ${p.a}/${radius(p)}) − asin(${p.a}/${radius(p)})，弧度转角度。`,
    ),
    question(
      "edgeFocus",
      "(4) 边缘声线的交轴距离",
      "m",
      String.raw`F_e=a/\tan\delta`,
      "edgeF",
      edgeFocus,
      (p) => `${p.a} m / tan(${fmt((deviation(p) * 180) / Math.PI)}°)。`,
    ),
    question(
      "highBeam",
      "(5) 高频候选的等效孔径全波束宽度",
      "°",
      String.raw`\beta_H=2\arcsin\frac{1.61633c_w}{2\pi f_Ha}`,
      "bw(high)",
      (p) => beamWidth(p.a, p.high, p.c),
      (p) => `2 asin[1.61633 × ${p.c} m/s / (2π × ${p.high} Hz × ${p.a} m)]，弧度转角度。`,
    ),
    question(
      "chosen",
      "(6) 通过焦移与波束指标的选定频率",
      "Hz",
      String.raw`f_* = \min\{f_i:\beta_i\leq\beta_{lim},|F_e/F-1|\leq\epsilon_{lim}\}`,
      "chosen",
      choice,
      (p) =>
        `边缘焦移 ${fmt(Math.abs(edgeFocus(p) / p.focus - 1) * 100)}%；低频波束 ${fmt(beamWidth(p.a, p.low, p.c))}°，高频波束 ${fmt(beamWidth(p.a, p.high, p.c))}°，分别与 ${p.errorLimit * 100}% 和 ${p.beamLimit}° 比较。`,
    ),
  ],
  hints: [
    "低声速材料的相对折射率大于一；近轴曲率关系 R=F(n−1)。",
    "边缘声线要用精确折射角，不能直接把近轴焦距当作边缘焦距；两个指标通过后才选择频率。",
  ],
  judgment: (p) =>
    choice(p)
      ? `选 ${fmt(choice(p))} Hz，曲率半径 ${fmt(radius(p))} m；边缘焦移 ${fmt(Math.abs(edgeFocus(p) / p.focus - 1) * 100)}%，通过当前指标。`
      : "候选方案未满足焦移或波束指标，应改变孔径、材料或曲面，再进行声场校核。",
  plot: (p) =>
    physical(
      p,
      "球面声透镜的折射声线与衍射焦区",
      "透镜后轴向距离 z (m)",
      "横向位置 y (m)",
      [0, 0.4],
      "[0 .4]",
      [
        ...[-1, -0.5, 0.5, 1].map((fraction) =>
          line(
            `孔径高度 ${fraction}a 的折射声线`,
            (z) => fraction * p.a - z * Math.tan(deviation(p, fraction * p.a)),
            [0, 0.4],
            `${fraction}*a-x*tan(deviation(${fraction}*a))`,
          ),
        ),
        ...[-1, 1].map((sign) =>
          line(
            sign < 0 ? "近轴半功率焦区下界" : "近轴半功率焦区上界",
            (z) =>
              sign *
              Math.hypot(
                (((0.257 * p.c) / (choice(p) || p.high)) * p.focus) / p.a,
                (p.a * (z - p.focus)) / p.focus,
              ),
            [0, 0.4],
            `${sign}*hypot(waist,a*(x-focus)/focus)`,
            "--",
          ),
        ),
        dot("边缘声线交轴点", edgeFocus(p), 0, "edgeF", "0"),
      ],
      setup,
      {
        answerKey: "edgeFocus",
        coordinateY: true,
        ylim: [-0.08, 0.08],
        annotations: [
          xmark(p.focus, "目标焦平面"),
          xmark(p.focus * (1 - p.errorLimit), "允许焦距下界"),
          xmark(p.focus * (1 + p.errorLimit), "允许焦距上界"),
        ],
        responseNote: `低频候选波束 ${fmt(beamWidth(p.a, p.low, p.c))}°；高频候选波束 ${fmt(beamWidth(p.a, p.high, p.c))}°；允许全宽 ${p.beamLimit}°。`,
      },
      {
        ylim: "[-.08 .08]",
        annotations: ["focus", "focus*(1-errorLimit)", "focus*(1+errorLimit)"],
      },
    ),
  additionalPlots: (p) => [
    physical(
      p,
      "孔径波束宽度与频率选择",
      "频率 f (Hz)",
      "全波束宽度 (°)",
      [30000, 100000],
      "[30000 100000]",
      [
        line("等效圆孔径波束宽度", (f) => beamWidth(p.a, f, p.c), [30000, 100000], "bw(x)"),
        dot("低频候选", p.low, beamWidth(p.a, p.low, p.c), "low", "bw(low)"),
        dot("高频候选", p.high, beamWidth(p.a, p.high, p.c), "high", "bw(high)"),
      ],
      setup,
      { annotations: [{ axis: "y", value: p.beamLimit, label: "全波束宽度上限" }] },
      { annotations: ["beamLimit"] },
    ),
  ],
});
