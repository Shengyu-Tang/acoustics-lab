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
const p = { rho: 1.21, c: 343, f: 500, h: 0.25, testF: 1500, res: 1.5, react: 0.7, safety: 0.8 };
const cutoff = (p: Values) => p.c / (2 * p.h);
const reflection = (p: Values) => Math.hypot(p.res - 1, p.react) / Math.hypot(p.res + 1, p.react);
const height = (p: Values) =>
  [0.35, 0.3, 0.25, 0.2, 0.15, 0.1].find((h) => h <= (p.safety * p.c) / (2 * p.f)) ?? 0;
const cg = (p: Values, f: number, n: number) =>
  f <= n * cutoff(p) ? 0 : p.c * Math.sqrt(1 - ((n * cutoff(p)) / f) ** 2);
const setup =
  "fc=c/(2*h);rp=abs((res+1i*react-1)/(res+1i*react+1));cg=@(ff,nn) c*sqrt(max(0,1-(nn*fc./ff).^2));chosenH=0;for hh=[.35 .3 .25 .2 .15 .1],if hh<=safety*c/(2*f),chosenH=hh;break;end;end;";
export default problem({
  id: "duct",
  title: "通风管道的单模频带与终端反射设计",
  lectures: ["3.10.3", "3.10.5", "3.7.1"],
  defaults: p,
  background:
    "消声器测试段要求工作频率处只有平面模态传播，便于用一维阻抗法解释测量结果。现有管道高度 0.25 m，终端具有已测得的复阻抗。计算截止频率、第一高阶模态在诊断频率的群速度及终端反射，再从标准高度中选择带截止裕量的最大通道。",
  criterion:
    "按平行硬壁模型，工作频率不超过第一高阶截止频率的给定比例。标准高度为 0.10、0.15、0.20、0.25、0.30、0.35 m，选择满足裕量要求的最大值；没有合格高度填 0。",
  assumptions:
    "只建模一个受限方向的平行平面硬壁波导，另一方向不受限。零阶始终能传播；群速度在截止以下记为 0，表示无传播模态而非实波包静止。终端局部作用阻抗按 ρc 归一化，平面模态反射单独计算。",
  given: [
    parameter("h", "现有波导高度", "h", "m", 0.15, 0.35, 0.01),
    parameter("c", "空气声速", "c", "m/s", 330, 350, 1),
    parameter("f", "工作频率", "f", "Hz", 300, 1000, 10),
    parameter("testF", "高阶模态诊断频率", "f_t", "Hz", 1200, 1800, 10),
    parameter("res", "终端归一化声阻", "r", "—", 0.5, 3, 0.1),
    parameter("react", "终端归一化声抗", "x", "—", 0, 2, 0.1),
    parameter("safety", "频率与截止频率比上限", "η", "—", 0.6, 0.95, 0.01),
  ],
  asks: [
    question(
      "cutoff",
      "(1) 现有波导第一高阶截止频率",
      "Hz",
      String.raw`f_1=c/(2h)`,
      "fc",
      cutoff,
      (p) => `${p.c} m/s / (2 × ${p.h} m)。`,
    ),
    question(
      "groupSpeed",
      "(2) 诊断频率的第一高阶群速度",
      "m/s",
      String.raw`c_g=c\sqrt{1-(f_1/f_t)^2}`,
      "cg(testF,1)",
      (p) => cg(p, p.testF, 1),
      (p) => `${p.c} m/s × √[1 − (${fmt(cutoff(p))} Hz / ${p.testF} Hz)²]。`,
    ),
    question(
      "reflection",
      "(3) 终端声压反射系数模值",
      "—",
      String.raw`|R_p|=\left|\frac{r+jx-1}{r+jx+1}\right|`,
      "rp",
      reflection,
      (p) =>
        String.raw`$\frac{\sqrt{(${p.res - 1})^2+${p.react}^2}}{\sqrt{(${p.res + 1})^2+${p.react}^2}}$。`,
    ),
    question(
      "absorption",
      "(4) 终端吸声系数",
      "—",
      String.raw`\alpha=1-|R_p|^2`,
      "1-rp^2",
      (p) => 1 - reflection(p) ** 2,
      (p) => `1 − (${fmt(reflection(p))})²。`,
    ),
    question(
      "heightLimit",
      "(5) 含裕量的高度上限",
      "m",
      String.raw`h_{max}=\eta c/(2f)`,
      "safety*c/(2*f)",
      (p) => (p.safety * p.c) / (2 * p.f),
      (p) => `${p.safety} × ${p.c} m/s / (2 × ${p.f} Hz)。`,
    ),
    question(
      "selectedHeight",
      "(6) 最大合格标准高度（无解填 0）",
      "m",
      String.raw`h_* =\max\{h_i:h_i\leq h_{max}\}`,
      "chosenH",
      height,
      (p) => `比较标准高度与 ${fmt((p.safety * p.c) / (2 * p.f))} m 的上限。`,
    ),
  ],
  hints: [
    "先区分零阶平面模态与第一高阶模态。第一高阶截止频率是 c/(2h)。",
    "群速度用于诊断频率；选型则使用工作频率与截止裕量。复反射系数要先取模再平方求吸声系数。",
  ],
  judgment: (p) =>
    height(p)
      ? `选高度 ${height(p)} m，工作频率与第一截止频率之比 ${fmt((2 * height(p) * p.f) / p.c)}，满足裕量 ${p.safety}。终端吸声系数 ${fmt(1 - reflection(p) ** 2)}，仍需单独设计终端。`
      : "没有标准高度满足单模裕量，需缩小截面或降低工作频率。",
  plot: (p) => {
    // A reflected pressure field, rather than an unrelated geometric subplot,
    // makes the measured terminal impedance part of the actual design figure.
    const rr = (p.res * p.res + p.react * p.react - 1) / ((p.res + 1) ** 2 + p.react ** 2),
      ri = (2 * p.react) / ((p.res + 1) ** 2 + p.react ** 2);
    const pressure = (x: number) =>
      Math.hypot(
        Math.cos((2 * Math.PI * p.f * x) / p.c) +
          rr * Math.cos((2 * Math.PI * p.f * x) / p.c) +
          ri * Math.sin((2 * Math.PI * p.f * x) / p.c),
        Math.sin((2 * Math.PI * p.f * x) / p.c) -
          rr * Math.sin((2 * Math.PI * p.f * x) / p.c) +
          ri * Math.cos((2 * Math.PI * p.f * x) / p.c),
      );
    return physical(
      p,
      "终端阻抗形成的驻波与单模适用范围",
      "距终端位置 z (m)",
      "合成声压幅值 (Pa)",
      [0, 2],
      "[0 2]",
      [
        line(
          "工作频率的入射与反射合成场",
          pressure,
          [0, 2],
          "abs(exp(1i*2*pi*f*x/c)+RP*exp(-1i*2*pi*f*x/c))",
        ),
        dot("终端声压", 0, pressure(0), "0", "abs(1+RP)"),
      ],
      setup + "RP=(res+1i*react-1)/(res+1i*react+1);",
      {
        answerKey: "reflection",
        annotations: [
          ymark(1 + reflection(p), `波腹声压 ${fmt(1 + reflection(p))} Pa`),
          ymark(1 - reflection(p), `波节声压 ${fmt(1 - reflection(p))} Pa`),
        ],
        responseNote: `截止频率 ${fmt(cutoff(p))} Hz；所选高度 ${fmt(height(p))} m；诊断群速度 ${fmt(cg(p, p.testF, 1))} m/s。`,
      },
      {
        annotations: ["1+rp", "1-rp"],
        annotationLabels: ["sprintf('波腹声压 %.4g Pa',1+rp)", "sprintf('波节声压 %.4g Pa',1-rp)"],
      },
    );
  },
  additionalPlots: (p) => [
    physical(
      p,
      "第一高阶群速度与截止裕量",
      "频率 f (Hz)",
      "群速度 (m/s)",
      [200, 2000],
      "[200 2000]",
      [
        line("第一高阶模态", (x) => cg(p, x, 1), [200, 2000], "cg(x,1)"),
        line("第二高阶模态", (x) => cg(p, x, 2), [200, 2000], "cg(x,2)"),
        dot("诊断频率的第一高阶群速度", p.testF, cg(p, p.testF, 1), "testF", "cg(testF,1)"),
      ],
      setup,
      {
        annotations: [
          xmark(cutoff(p), "第一高阶截止频率"),
          xmark(p.f / p.safety, "工作频率所需最低截止频率"),
        ],
      },
      { annotations: ["fc", "f/safety"] },
    ),
  ],
});
