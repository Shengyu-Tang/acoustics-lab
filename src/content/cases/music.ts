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
  rho: 1000,
  c: 343,
  f: 330,
  L: 0.65,
  mu: 0.0004,
  T: 70,
  Q: 1200,
  target: 330,
  designQ: 300,
  tailLimit: 3,
  tensionLimit: 100,
};
const f0 = (p: Values) => Math.sqrt(p.T / p.mu) / (2 * p.L);
const tail = (f: number, Q: number) => (Q * Math.log(1000)) / (Math.PI * f);
const tension = (p: Values) => p.mu * (2 * p.L * p.target) ** 2;
const choice = (p: Values) =>
  tension(p) <= p.tensionLimit && tail(p.target, p.designQ) <= p.tailLimit ? p.designQ : 0;
const setup =
  "fInitial=sqrt(T/mu)/(2*L);tunedT=mu*(2*L*target)^2;tail=@(ff,qq) qq*log(1000)/(pi*ff);level=@(tt,ff,qq) -20/log(10)*pi*ff*tt/qq;chosen=0;if tunedT<=tensionLimit && tail(target,designQ)<=tailLimit,chosen=designQ;end;";
export default problem({
  id: "music",
  title: "琴弦调音、允许张力与余韵时间设计",
  lectures: ["2.1", "2.2", "1.1.4"],
  defaults: p,
  background:
    "制琴工坊拟为有效弦长 0.65 m 的琴弦调到目标音高。现有弦的张力与损耗已测得，余韵过长影响快速演奏的清晰度。计算目标张力和衰减 60 dB 的时间，再判断候选阻尼处理能否同时满足张力安全与余韵指标。",
  criterion:
    "调到目标基频后的张力不超过允许张力，且候选品质因数对应的幅值衰减 60 dB 时间不超过余韵上限，才采用候选品质因数；不通过填 0。",
  assumptions:
    "柔软均匀两端固定弦、小振幅、轻阻尼单模态近似。品质因数按未阻尼基频定义，振幅包络为 exp(−πft/Q)，60 dB 衰减对应振幅比 0.001；此计算不能预测完整音色。",
  given: [
    parameter("L", "有效弦长", "L", "m", 0.4, 0.9, 0.01),
    parameter("mu", "线密度", "μ", "kg/m", 0.0002, 0.0008, 0.00001),
    parameter("T", "当前张力", "T", "N", 40, 150, 1),
    parameter("Q", "当前品质因数", "Q_m", "—", 500, 1500, 10),
    parameter("target", "目标基频", "f_*", "Hz", 220, 440, 1),
    parameter("designQ", "候选品质因数", "Q_*", "—", 100, 800, 10),
    parameter("tailLimit", "余韵时间上限", "t_{lim}", "s", 1, 5, 0.1),
    parameter("tensionLimit", "允许张力上限", "T_{lim}", "N", 50, 200, 1),
  ],
  asks: [
    question(
      "fundamental",
      "(1) 当前基频",
      "Hz",
      String.raw`f_1=\frac{1}{2L}\sqrt{T/\mu}`,
      "fInitial",
      f0,
      (p) => `√(${p.T} N / ${p.mu} kg/m) / (2 × ${p.L} m)。`,
    ),
    question(
      "currentTail",
      "(2) 当前弦的幅值衰减 60 dB 时间",
      "s",
      String.raw`t_{60}=Q_m\ln(1000)/(\pi f_1)`,
      "tail(fInitial,Q)",
      (p) => tail(f0(p), p.Q),
      (p) => `${p.Q} × ln(1000) / [π × ${fmt(f0(p))} Hz]。`,
    ),
    question(
      "targetTension",
      "(3) 达到目标音高的张力",
      "N",
      String.raw`T_* = \mu(2Lf_*)^2`,
      "tunedT",
      tension,
      (p) => `${p.mu} kg/m × (2 × ${p.L} m × ${p.target} Hz)²。`,
    ),
    question(
      "maximumQ",
      "(4) 满足余韵指标的品质因数上限",
      "—",
      String.raw`Q_{max}=\pi f_*t_{lim}/\ln(1000)`,
      "pi*target*tailLimit/log(1000)",
      (p) => (Math.PI * p.target * p.tailLimit) / Math.log(1000),
      (p) => `π × ${p.target} Hz × ${p.tailLimit} s / ln(1000)。`,
    ),
    question(
      "newTail",
      "(5) 候选处理后的衰减 60 dB 时间",
      "s",
      String.raw`t_{60,*}=Q_*\ln(1000)/(\pi f_*)`,
      "tail(target,designQ)",
      (p) => tail(p.target, p.designQ),
      (p) => `${p.designQ} × ln(1000) / (π × ${p.target} Hz)。`,
    ),
    question(
      "chosen",
      "(6) 采用的品质因数（不通过填 0）",
      "—",
      String.raw`Q_{sel}=Q_*\quad\text{当}\ T_*\leq T_{lim},\ t_{60,*}\leq t_{lim}`,
      "chosen",
      choice,
      (p) =>
        `张力 ${fmt(tension(p))} N 与 ${p.tensionLimit} N 比较；余韵 ${fmt(tail(p.target, p.designQ))} s 与 ${p.tailLimit} s 比较。`,
    ),
  ],
  hints: [
    "张力决定波速与基频；损耗决定包络。振幅降低 60 dB 是降到千分之一。",
    "先反算目标张力，再由 t₆₀ = Q ln1000/(πf) 反算允许的 Q。两项安全条件必须同时通过。",
  ],
  judgment: (p) =>
    choice(p)
      ? `采用品质因数 ${p.designQ}；目标张力 ${fmt(tension(p))} N，余韵 ${fmt(tail(p.target, p.designQ))} s。`
      : "候选处理未满足张力或余韵限制，应换弦或调整损耗。",
  plot: (p) =>
    physical(
      p,
      "当前弦与调音后候选阻尼的衰减包络",
      "时间 t (s)",
      "相对初始振幅级 (dB)",
      [0, 5],
      "[0 5]",
      [
        line(
          "当前张力与损耗",
          (t) => ((-20 / Math.LN10) * Math.PI * f0(p) * t) / p.Q,
          [0, 5],
          "level(x,fInitial,Q)",
        ),
        line(
          "目标音高与候选损耗",
          (t) => ((-20 / Math.LN10) * Math.PI * p.target * t) / p.designQ,
          [0, 5],
          "level(x,target,designQ)",
        ),
        dot("候选衰减六十分贝", tail(p.target, p.designQ), -60, "tail(target,designQ)", "-60"),
      ],
      setup,
      {
        answerKey: "newTail",
        annotations: [ymark(-60, "振幅降至千分之一"), xmark(p.tailLimit, "余韵时间上限")],
      },
      { annotations: ["-60", "tailLimit"] },
    ),
  additionalPlots: (p) => [
    physical(
      p,
      "目标基频与允许张力的联合校核",
      "基频 f (Hz)",
      "所需张力 (N)",
      [200, 500],
      "[200 500]",
      [
        line("调音张力", (f) => p.mu * (2 * p.L * f) ** 2, [200, 500], "mu*(2*L*x).^2"),
        dot("目标张力", p.target, tension(p), "target", "tunedT"),
      ],
      setup,
      { annotations: [ymark(p.tensionLimit, "允许张力上限")] },
      { annotations: ["tensionLimit"] },
    ),
  ],
});
