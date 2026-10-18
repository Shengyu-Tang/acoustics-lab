import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  curve,
  points,
  example,
  ask,
  answerCurve,
  engineering,
} from "../p2";
import { pressureLevel, powerLevel, sumLevels } from "../../physics/chapter3";
const n = parameter("n", "相同非相干声源数", "n", "—", 1, 20, 1),
  sourceLevel = parameter("sourceLevel", "单声源声压级", "L₁", "dB", 20, 140, 1);
const p = { ...defaults, medium: 0, pRms: 1, intensity: 0.01, power: 0.1, n: 2, sourceLevel: 80 };
export default p2Lecture("3.4.6", {
  defaults: p,
  parameters: [{ ...n, integer: true }, sourceLevel, params.rho, params.c],
  interactive: {
    levels: true,
    selectors: [{ key: "medium", label: "声压参考值", options: ["空气：20 μPa", "水：1 μPa"] }],
  },
  keyPoints: [
    "级表示物理量与参考值之比的对数，单位为分贝；使用参考值是定义的一部分。",
    "声压级用有效声压的二十倍常用对数，声强级和声功率级用十倍常用对数。",
    "空气声压参考值为 20 μPa，水声为 1 μPa；本页声强和声功率参考值分别为十的负十二次方 $\\mathrm{W/m^2}$ 与 W。",
    "非相干声源应在线性能量域叠加，不能直接相加分贝数；声压级与声强级相等需要参考值与介质阻抗匹配。",
  ],
  formulas: [
    {
      number: "3.4.6-1",
      tex: String.raw`SPL=20\lg\frac{p_{\rm rms}}{p_{\rm ref}},\quad SIL=10\lg\frac I{I_{\rm ref}},\quad SWL=10\lg\frac W{W_{\rm ref}}`,
      meaning: "换算器三个量分别独立换算；只有指定波场和面积后才可在声压、声强和功率之间转换。",
    },
    {
      number: "3.4.6-2",
      tex: String.raw`SIL=SPL+10\lg\frac{p_{\rm ref}^2}{\rho_0c_0I_{\rm ref}},\quad(SIL-SPL)_{\rm air}=10\lg\frac{400}{\rho_0c_0}`,
      meaning: "修正关系适用于平面行波，右侧的 400 仅对应空气声压参考值与本页声强参考值。",
    },
    {
      number: "3.4.6-3",
      tex: String.raw`L_\Sigma=10\lg\sum_i10^{L_i/10},\quad L_n=L_1+10\lg n`,
      meaning: "本页叠加假设声源互不相干并在同一测点比较；相干声源还需考虑相位。",
    },
  ],
  figures: [
    figure("3.4.6-1", "常见声源声压级标尺（示意量级，非测量限值）", (p) => [
      graph(
        p,
        0,
        "示意量级随距离、环境和工况变化",
        "空气声压级 (dB，参考声压 20 μPa)",
        "",
        [0, 140],
        [0, 6],
        [
          points(
            "典型量级",
            [
              [30, 1],
              [60, 2],
              [80, 3],
              [100, 4],
              [120, 5],
            ],
            "[30 60 80 100 120]",
            "1:5",
            { kind: "barh" },
          ),
        ],
        "",
        {
          legend: false,
          ytickLabels: ["安静房间", "近距交谈", "道路", "设备", "强声"].map((label, i) => ({
            value: i + 1,
            label,
          })),
        },
      ),
    ]),
    figure("3.4.6-2", "相同非相干声源的级叠加", (p) => [
      graph(
        p,
        0,
        "声源数翻倍：约增加 3.01 dB",
        "相同非相干声源数 n（—）",
        "总声压级 (dB)",
        [0, 20],
        [p.sourceLevel, p.sourceLevel + 20],
        [
          curve(
            "L₁ + 10 lg n",
            (x) => (x === 0 ? NaN : p.sourceLevel + 10 * Math.log10(x)),
            [0, 20],
            "linspace(0,20,401)",
            "p2SourceLevel(x,sourceLevel)",
          ),
          points(
            "当前声源数",
            [[p.n, p.sourceLevel + 10 * Math.log10(p.n)]],
            "n",
            "sourceLevel+10*log10(n)",
            { style: "none", marker: "o" },
          ),
        ],
        "",
        {},
        { ylim: "[sourceLevel sourceLevel+20]" },
      ),
    ]),
    figure("3.4.6-3", "平面波声压级与声强级", (p) => [
      graph(
        p,
        0,
        "参考声压与介质阻抗决定两种声级的差值",
        "声压级 (dB)",
        "声强级 (dB)",
        [0, 140],
        [-100, 160],
        [
          curve(
            "声强级",
            (x) => x + 10 * Math.log10((p.medium ? 1e-6 : 20e-6) ** 2 / (p.rho * p.c * 1e-12)),
            [0, 140],
            "linspace(0,140,401)",
            "x+10*log10((20e-6*(1-medium)+1e-6*medium)^2/(Z*1e-12))",
          ),
        ],
      ),
    ]),
  ],
  readouts: (p) => [
    ["声压级", pressureLevel(p.pRms, p.medium ? 1e-6 : 20e-6), "dB"],
    ["声强级", powerLevel(p.intensity), "dB"],
    ["声功率级", powerLevel(p.power), "dB"],
    ["空气行波 SIL−SPL", 10 * Math.log10(400 / (p.rho * p.c)), "dB"],
    ["非相干合成声压级", sumLevels(Array(p.n).fill(p.sourceLevel)), "dB"],
  ],
  readoutModel:
    "[20*log10(pRms/(20e-6*(1-medium)+1e-6*medium)) 10*log10(intensity/1e-12) 10*log10(power/1e-12) 10*log10(400/Z) sourceLevel+10*log10(n)]",
  examples: [
    example(
      "例题　两台非相干设备的声级叠加",
      "两台相同设备在同一测点各自产生 80 dB 的空气声压级，假定互不相干且传播条件不变。计算同时工作时的总声压级及相应有效声压。",
      p,
      [{ ...n, integer: true }, sourceLevel],
      [
        ask(
          "combined",
          "(1) 合成声压级",
          "dB",
          String.raw`L_\Sigma=L_1+10\lg n`,
          "sourceLevel+10*log10(n)",
          (p) => p.sourceLevel + 10 * Math.log10(p.n),
          (p) => `${p.sourceLevel} dB + 10 lg(${p.n})`,
        ),
        ask(
          "rms",
          "(2) 有效声压",
          "Pa",
          String.raw`p_{\rm rms}=20\times10^{-6}10^{L_\Sigma/20}`,
          "20e-6*10^(combined/20)",
          (p) => 20e-6 * 10 ** ((p.sourceLevel + 10 * Math.log10(p.n)) / 20),
          (p) => `20×10⁻⁶ Pa × 10^((${p.sourceLevel}+10 lg(${p.n}))/20)`,
        ),
      ],
      () => "相同独立声源数翻倍增加约 3 dB；相干时结果取决于相位，不能沿用此结论。",
      (p) =>
        answerCurve(
          p,
          "n",
          "声源数（连续延拓）",
          "—",
          (q) => (q.n === 0 ? 0 : 20e-6 * 10 ** (q.sourceLevel / 20) * Math.sqrt(q.n)),
          "20e-6*10^(sourceLevel/20)*sqrt(x)",
        ),
    ),
  ],
  answers: [
    "物理量与参考量之比的对数表示；声压用二十倍，功率与强度用十倍常用对数。",
    "分贝，写作 dB；还需要注明参考量。",
    "不同，改变参考声压会改变声压级，因此空气声级和水声声级不能直接比较。",
    "声学量跨越很大的量级，对数便于压缩动态范围，并适于描述声强比例和感知变化。",
    "应满足声压参考值的平方等于介质特性阻抗乘声强参考值，且声场为平面行波。",
    "不是，人耳感知并不随声压线性增长，还受频率、持续时间等影响。",
  ],
  engineering: engineering(
    "设备降噪设计要在线性能量域合成互不相干声源，并统一测点、参考声压与工况后比较声级。",
  ),
});
