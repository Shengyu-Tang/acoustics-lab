import {
  problem,
  parameter,
  question,
  physical,
  line,
  dot,
  xmark,
  ymark,
  fmt,
  type Values,
} from "./shared";
const p = {
  rho: 1025,
  c: 1500,
  f: 10000,
  a: 0.015,
  maximumF: 10000,
  lossLimit: 0.5,
  level: 100,
  sensitivity: -180,
};
const ka = (p: Values, f: number, a = p.a) => (2 * Math.PI * f * a) / p.c;
const loss = (p: Values, f: number, a = p.a) => 10 * Math.log10(1 + ka(p, f, a) ** 2);
const radius = (p: Values) =>
  (p.c * Math.sqrt(10 ** (p.lossLimit / 10) - 1)) / (2 * Math.PI * p.maximumF);
const diameter = (p: Values) => [0.03, 0.02, 0.01, 0.005].find((d) => d / 2 <= radius(p)) ?? 0;
const voltage = (p: Values, f: number, a = p.a) =>
  (10 ** (p.level / 20) * 10 ** (p.sensitivity / 20)) / Math.sqrt(1 + ka(p, f, a) ** 2);
const setup =
  "kap=@(ff,aa) 2*pi*ff*aa/c;loss=@(ff,aa) 10*log10(1+kap(ff,aa).^2);amax=c*sqrt(10^(lossLimit/10)-1)/(2*pi*maximumF);chosenDiameter=0;for dd=[.03 .02 .01 .005],if dd/2<=amax,chosenDiameter=dd;break;end;end;plotA=amax;if chosenDiameter>0,plotA=chosenDiameter/2;end;volt=@(ff,aa) 10^(level/20)*10^(sensitivity/20)./sqrt(1+kap(ff,aa).^2);";
export default problem({
  id: "measurement",
  title: "水下监听接收器的尺寸与电压预算",
  lectures: ["6.1", "6.2", "3.4.6"],
  defaults: p,
  background:
    "监听系统需要在最高 10 kHz 以内保持接收声压幅值误差不超过 0.5 dB。供应商给出球形外壳尺寸与低频电压灵敏度，较大的外壳可能使表面平均声压偏离未扰动声场。先用刚性球表面平均压力系数计算尺寸上限，再从标准直径中选型并估计输出电压。",
  criterion:
    "采用 |K|=1/√(1+(ka)²) 的表面平均压力模型。在最高工作频率的幅值损失不超过给定限值，选择 5、10、20、30 mm 标准直径中的最大可行项；没有可行项填 0。",
  assumptions:
    "球面平均接收压力、理想刚性小球，电压灵敏度在本频带内视为平坦且为有效值之比；不包含电子噪声与压电模态共振。水中声压级参考 1 μPa，灵敏度单位为 dB re 1 V/μPa。互易原理不等于不同换能器具有相同灵敏度。",
  given: [
    parameter("a", "现有接收器半径", "a", "m", 0.003, 0.025, 0.001),
    parameter("c", "海水声速", "c", "m/s", 1450, 1550, 1),
    parameter("maximumF", "最高工作频率", "f_{max}", "Hz", 5000, 20000, 100),
    parameter("lossLimit", "允许幅值损失", "L_{lim}", "dB", 0.2, 1, 0.1),
    parameter("level", "待测水中声压级", "L_p", "dB", 80, 140, 1),
    parameter("sensitivity", "低频电压灵敏度", "S_v", "dB", -200, -160, 1),
  ],
  asks: [
    question(
      "sizeParameter",
      "(1) 现有接收器在频带上限的尺寸参数",
      "—",
      String.raw`ka=2\pi f_{max}a/c`,
      "kap(maximumF,a)",
      (p) => ka(p, p.maximumF),
      (p) => `2π × ${p.maximumF} Hz × ${p.a} m / (${p.c} m/s)。`,
    ),
    question(
      "currentLoss",
      "(2) 现有接收器的幅值损失",
      "dB",
      String.raw`L_K=-20\lg|K|=10\lg(1+(ka)^2)`,
      "loss(maximumF,a)",
      (p) => loss(p, p.maximumF),
      (p) => `10 lg[1 + (${fmt(ka(p, p.maximumF))})²]。`,
    ),
    question(
      "pressure",
      "(3) 未扰动声场的声压有效值",
      "Pa",
      String.raw`p_{rms}=10^{-6}10^{L_p/20}`,
      "1e-6*10^(level/20)",
      (p) => 1e-6 * 10 ** (p.level / 20),
      (p) => `1 μPa × 10^(${p.level}/20)，转为 Pa。`,
    ),
    question(
      "maximumRadius",
      "(4) 接收器允许最大半径",
      "m",
      String.raw`a_{max}=\frac{c}{2\pi f_{max}}\sqrt{10^{L_{lim}/10}-1}`,
      "amax",
      radius,
      (p) => `${p.c} m/s × √(10^(${p.lossLimit}/10) − 1) / (2π × ${p.maximumF} Hz)。`,
    ),
    question(
      "voltage",
      "(5) 现有接收器在频带上限的电压有效值",
      "V",
      String.raw`U=p_{rms}[\mu\mathrm{Pa}]\,10^{S_v/20}|K|`,
      "volt(maximumF,a)",
      (p) => voltage(p, p.maximumF),
      (p) =>
        `10^(${p.level}/20) μPa × 10^(${p.sensitivity}/20) V/μPa / √[1 + (${fmt(ka(p, p.maximumF))})²]。`,
    ),
    question(
      "diameter",
      "(6) 最大合格标准直径（无解填 0）",
      "m",
      String.raw`d_* =\max\{d\in\{.005,.010,.020,.030\}:d\leq2a_{max}\}`,
      "chosenDiameter",
      diameter,
      (p) => `将标准直径与 ${fmt(2 * radius(p))} m 比较，取最大合格项。`,
    ),
  ],
  hints: [
    "压力系数是幅值比，分贝换算用 20 lg；反算尺寸后再考虑标准规格。",
    "水中声压先使用 1 μPa 参考值，电压灵敏度也以 V/μPa 给出，两者单位一致才能直接相乘。",
  ],
  judgment: (p) =>
    diameter(p)
      ? `选标准直径 ${diameter(p) * 1000} mm，最高频率的尺寸损失 ${fmt(loss(p, p.maximumF, diameter(p) / 2))} dB。`
      : "现有标准规格均过大，需定制更小的接收头或降低频带上限。",
  plot: (p) =>
    physical(
      p,
      "刚性球尺寸误差与接收电压频响",
      "频率 f (Hz)",
      "表面平均声压损失 (dB)",
      [100, 20000],
      "[100 20000]",
      [
        line("现有接收器幅值损失", (f) => loss(p, f), [100, 20000], "loss(x,a)"),
        line(
          "所选标准尺寸损失",
          (f) => loss(p, f, (diameter(p) || 2 * radius(p)) / 2),
          [100, 20000],
          "loss(x,plotA)",
        ),
        {
          ...line("现有接收器输出电压", (f) => voltage(p, f), [100, 20000], "volt(x,a)"),
          axis: "right",
        },
        dot("频带上限的现有误差", p.maximumF, loss(p, p.maximumF), "maximumF", "loss(maximumF,a)"),
      ],
      setup,
      {
        answerKey: "currentLoss",
        rightLabel: "电压有效值 (V)",
        annotations: [ymark(p.lossLimit, "允许幅值损失"), xmark(p.maximumF, "最高工作频率")],
      },
      { annotations: ["lossLimit", "maximumF"] },
    ),
});
