import {
  problem,
  parameter,
  question,
  physical,
  line,
  dot,
  ymark,
  xmark,
  fmt,
  type Values,
} from "./shared";
const p = {
  rho: 1.21,
  c: 343,
  f: 800,
  v: 20,
  d: 30,
  xobs: 50,
  r0: 10,
  L0: 90,
  background: 60,
  limit: 75,
  proposed: 80,
};
const distance = (p: Values, x: number, d = p.d) => Math.hypot(x, d);
const frequency = (p: Values, x: number, d = p.d) =>
  (p.f * p.c) / (p.c + (p.v * x) / distance(p, x, d));
const sourceLevel = (p: Values, x: number, d = p.d) =>
  p.L0 - 20 * Math.log10(distance(p, x, d) / p.r0);
const total = (p: Values, x: number, d = p.d) =>
  10 * Math.log10(10 ** (sourceLevel(p, x, d) / 10) + 10 ** (p.background / 10));
const minimum = (p: Values) =>
  p.r0 * 10 ** ((p.L0 - 10 * Math.log10(10 ** (p.limit / 10) - 10 ** (p.background / 10))) / 20);
const setup =
  "dist=@(xx,dd) hypot(xx,dd);fq=@(xx,dd) f*c./(c+v*xx./dist(xx,dd));sl=@(xx,dd) L0-20*log10(dist(xx,dd)/r0);tot=@(xx,dd) 10*log10(10.^(sl(xx,dd)/10)+10^(background/10));dmin=r0*10^((L0-10*log10(10^(limit/10)-10^(background/10)))/20);chosen=0;if proposed>=dmin,chosen=proposed;end;";
export default problem({
  id: "transport",
  title: "车辆通过监测点的多普勒频移与降噪退距",
  lectures: ["3.S2", "3.8.4", "3.4.6"],
  defaults: p,
  background:
    "一台有明显纯音成分的工程车辆匀速驶过固定监测点。监测点离行驶直线 30 m，接近和离开时的音调不同，最近通过时声级最高。用运动学和球面扩展把频移与声级变化分开计算，再估算使全程总声级达标所需的最小退距。",
  criterion:
    "背景噪声与车辆不相干。要求最近通过时总声压级不超过限值；计算最小垂直退距，并校核拟建退距，通过则填拟建距离，否则填 0。",
  assumptions:
    "静止空气、静止观察者、匀速亚声速点声源、自由场球面扩展，忽略道路反射、风、吸收和运动辐射增益。横向坐标取发声时刻的源位置，接收时刻需再加声程除以声速；多普勒分母采用该位置的径向速度，靠近时为负。",
  given: [
    parameter("f", "车辆发射纯音频率", "f_s", "Hz", 400, 1200, 10),
    parameter("v", "车辆行驶速度", "v_s", "m/s", 5, 35, 1),
    parameter("c", "空气声速", "c", "m/s", 330, 350, 1),
    parameter("d", "现有垂直退距", "d", "m", 10, 100, 1),
    parameter("xobs", "两次记录的沿路距离绝对值", "x_o", "m", 30, 150, 1),
    parameter("L0", "距声源十米声压级", "L_{10}", "dB", 80, 100, 1),
    parameter("background", "背景声压级", "L_b", "dB", 50, 65, 1),
    parameter("limit", "总声压级限值", "L_{lim}", "dB", 70, 85, 1),
    parameter("proposed", "拟建垂直退距", "d_*", "m", 30, 200, 1),
  ],
  asks: [
    question(
      "approaching",
      "(1) 接近位置的接收频率",
      "Hz",
      String.raw`f_a=\frac{f_sc}{c-v_sx_o/\sqrt{x_o^2+d^2}}`,
      "fq(-xobs,d)",
      (p) => frequency(p, -p.xobs),
      (p) =>
        `${p.f} Hz × ${p.c} m/s / [${p.c} m/s − ${p.v} m/s × ${p.xobs} m / ${fmt(distance(p, p.xobs))} m]。`,
    ),
    question(
      "receding",
      "(2) 离开位置的接收频率",
      "Hz",
      String.raw`f_r=\frac{f_sc}{c+v_sx_o/\sqrt{x_o^2+d^2}}`,
      "fq(xobs,d)",
      (p) => frequency(p, p.xobs),
      (p) =>
        `将上一步径向速度改为远离的正号；径向速度幅值 ${fmt((p.v * p.xobs) / distance(p, p.xobs))} m/s。`,
    ),
    question(
      "vehicleLevel",
      "(3) 记录位置车辆单独声压级",
      "dB",
      String.raw`L_v=L_{10}-20\lg\left(\sqrt{x_o^2+d^2}/10\,\mathrm m\right)`,
      "sl(xobs,d)",
      (p) => sourceLevel(p, p.xobs),
      (p) => `${p.L0} dB − 20 lg(${fmt(distance(p, p.xobs))} m / 10 m)。`,
    ),
    question(
      "totalLevel",
      "(4) 记录位置含背景总声压级",
      "dB",
      String.raw`L_\Sigma=10\lg(10^{L_v/10}+10^{L_b/10})`,
      "tot(xobs,d)",
      (p) => total(p, p.xobs),
      (p) => `10 lg[10^(${fmt(sourceLevel(p, p.xobs))}/10) + 10^(${p.background}/10)]。`,
    ),
    question(
      "minimumDistance",
      "(5) 全程达标所需最小垂直退距",
      "m",
      String.raw`d_{min}=10\,\mathrm m\;10^{[L_{10}-10\lg(10^{L_{lim}/10}-10^{L_b/10})]/20}`,
      "dmin",
      minimum,
      (p) =>
        `先从 ${p.limit} dB 的均方声压预算扣掉 ${p.background} dB 背景，再由 ${p.L0} dB（10 m）反算距离。`,
    ),
    question(
      "chosen",
      "(6) 通过校核的拟建退距（不通过填 0）",
      "m",
      String.raw`d_{sel}=d_*\quad\text{当}\ L_\Sigma(x=0,d_*)\leq L_{lim}`,
      "chosen",
      (p) => (p.proposed >= minimum(p) ? p.proposed : 0),
      (p) =>
        `拟建 ${p.proposed} m，最小要求 ${fmt(minimum(p))} m；最近通过总声级 ${fmt(total(p, 0, p.proposed))} dB。`,
    ),
  ],
  hints: [
    "径向速度不是恒等于车速，要乘源—接收器方向余弦；负坐标表示接近。",
    "声级先转均方声压相加。最坏声级发生在源正对监测点时，此时声程就是垂直退距。",
  ],
  judgment: (p) =>
    p.proposed >= minimum(p)
      ? `采用 ${p.proposed} m 退距，最近通过总声级 ${fmt(total(p, 0, p.proposed))} dB，满足 ${p.limit} dB 指标。`
      : `拟建退距不足，至少需要 ${fmt(minimum(p))} m；不能用音调降低代替声级治理。`,
  plot: (p) =>
    physical(
      p,
      "车辆通过时的音调与总声级变化",
      "沿道路的发声位置 x (m)",
      "接收频率 (Hz)",
      [-200, 200],
      "[-200 200]",
      [
        line("现有退距的接收频率", (x) => frequency(p, x), [-200, 200], "fq(x,d)"),
        { ...line("现有退距的总声级", (x) => total(p, x), [-200, 200], "tot(x,d)"), axis: "right" },
        {
          ...line(
            "拟建退距的总声级",
            (x) => total(p, x, p.proposed),
            [-200, 200],
            "tot(x,proposed)",
          ),
          axis: "right",
        },
        {
          ...line("总声压级限值", () => p.limit, [-200, 200], "limit+zeros(size(x))", "--"),
          axis: "right",
        },
        dot("接近时记录音调", -p.xobs, frequency(p, -p.xobs), "-xobs", "fq(-xobs,d)"),
        dot("离开时记录音调", p.xobs, frequency(p, p.xobs), "xobs", "fq(xobs,d)"),
      ],
      setup,
      {
        answerKey: "approaching",
        rightLabel: "含背景声压级 (dB)",
        annotations: [xmark(0, "最近通过位置")],
      },
      { annotations: ["0"] },
    ),
});
