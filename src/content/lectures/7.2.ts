import {
  makeLecture,
  parameter,
  figure,
  ask,
  engineering,
  water,
  graph,
  points,
  substitution,
  answer,
  log,
} from "../p4";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "工作频率", "f", "Hz", 1000, 100000, 1000),
  relaxTime = parameter("relaxTime", "弛豫时间", "τ", "s", 1e-6, 1e-4, 1e-6),
  A = parameter("A", "弛豫强度", "A", "s/m", 1e-9, 5e-8, 1e-9),
  B = parameter("B", "古典吸收常数", "B", "s²/m", 1e-15, 5e-14, 1e-15),
  r = parameter("r", "传播距离", "r", "m", 100, 5000, 100);
const p = { ...water, f: 50000, relaxTime: 2e-5, A: 1e-8, B: 5e-15, r: 1000, SL: 180 },
  setup = "alphaSea=p4Thorp(f);";
const asks = [
  ask(
    "absorption",
    "(1) 海水吸收系数",
    "dB/km",
    "\\alpha_s=0.11\\frac{F^2}{1+F^2}+44\\frac{F^2}{4100+F^2}+2.75\\times10^{-4}F^2+0.003",
    "p4Thorp(f)",
    (p) => phy.thorp(p.f),
    substitution,
  ),
  ask(
    "absorbed",
    "(2) 路径吸收损失",
    "dB",
    "TL_a=\\alpha_s r_{\\mathrm{km}}",
    "alphaSea*r/1000",
    (p) => (phy.thorp(p.f) * p.r) / 1000,
    substitution,
  ),
  ask(
    "receivedLevel",
    "(3) 接收声压级",
    "dB",
    "RL=SL-20\\lg(r/r_0)-\\alpha_s r_{\\mathrm{km}}",
    "SL-20*log10(r)-alphaSea*r/1000",
    (p) => p.SL - 20 * Math.log10(p.r) - (phy.thorp(p.f) * p.r) / 1000,
    substitution,
  ),
];
export default makeLecture("7.2", {
  defaults: p,
  parameters: [relaxTime, A, B, f],
  keyPoints: [
    "古典吸收由粘滞与热传导造成，在其适用条件下吸收系数正比于频率平方。",
    "实际介质的吸收可能明显超过古典理论预测，称为超吸收。",
    "分子或化学平衡的弛豫使能量交换滞后于压力变化，产生随频率改变的附加吸收。",
    "海水经验公式将不同机制综合为频率响应；本页索普公式用于代表性海水估算，不包含温度、盐度、深度与酸碱度的独立变化。",
  ],
  formulas: [
    {
      number: "7.2-1",
      tex: "\\alpha_{\\text{古典}}=Bf^2,\\quad\\alpha_{\\text{弛豫}}=\\frac{A\\omega^2\\tau}{1+\\omega^2\\tau^2}",
      meaning: "示意模型隔离古典与单一弛豫过程；古典常数含粘滞、热传导及介质参数。",
    },
    {
      number: "7.2-2",
      tex: "\\alpha_s=0.11\\frac{F^2}{1+F^2}+44\\frac{F^2}{4100+F^2}+2.75\\times10^{-4}F^2+0.003,\\quad F=f/(1\\,\\mathrm{kHz})",
      meaning:
        "索普经验式输出分贝每千米；使用频率不低于约 $0.4\\ \\mathrm{kHz}$，公开实现与适用范围见来源链接。",
    },
  ],
  interactive: {
    links: [
      {
        text: "索普海水吸收公式的公开实现与单位",
        href: "https://www.tetcos.com/documentation/v14.4/UWAN/Model%20Features.html",
      },
      {
        text: "海水吸收模型的环境参数与适用范围",
        href: "https://resource.npl.co.uk/acoustics/techguides/seaabsorption/",
      },
    ],
  },
  figures: [
    figure("7.2-1", "古典吸收、单一弛豫与两者之和的频率依赖", (p) => [
      graph(
        p,
        0,
        "古典平方律与弛豫吸收平台",
        "频率 f (Hz)",
        "幅值吸收系数 (Np/m)",
        [100, 1000000],
        [1e-12, 0.1],
        [
          points(
            "古典吸收",
            log(100, 1000000).map((f) => [f, p.B * f * f]),
            "logspace(2,6,401)",
            "B*x.^2",
          ),
          points(
            "单一弛豫吸收",
            log(100, 1000000).map((f) => [f, phy.relaxation(f, p.A, p.relaxTime)]),
            "logspace(2,6,401)",
            "p4Relax(x,A,relaxTime)",
          ),
          points(
            "两机制总和",
            log(100, 1000000).map((f) => [f, p.B * f * f + phy.relaxation(f, p.A, p.relaxTime)]),
            "logspace(2,6,401)",
            "B*x.^2+p4Relax(x,A,relaxTime)",
          ),
          points(
            "当前频率的总吸收",
            [[p.f, p.B * p.f * p.f + phy.relaxation(p.f, p.A, p.relaxTime)]],
            "f",
            "B*f^2+p4Relax(f,A,relaxTime)",
            { marker: "o", style: "none" },
          ),
        ],
        setup,
        { xscale: "log", yscale: "log" },
      ),
    ]),
    figure("7.2-2", "代表性海水吸收频率曲线（索普经验公式，来源见链接）", (p) => [
      graph(
        p,
        0,
        "海水吸收随频率增加而增强",
        "频率 f (Hz)",
        "海水吸收系数 (dB/km)",
        [400, 1000000],
        [0.001, 1000],
        [
          points(
            "索普海水经验式",
            log(400, 1000000).map((f) => [f, phy.thorp(f)]),
            "logspace(log10(400),6,401)",
            "p4Thorp(x)",
          ),
          points("当前声呐工作频率", [[p.f, phy.thorp(p.f)]], "f", "p4Thorp(f)", {
            marker: "o",
            style: "none",
          }),
        ],
        setup,
        { xscale: "log", yscale: "log" },
      ),
    ]),
  ],
  answers: [
    "粘滞、热传导造成古典吸收，分子或化学平衡弛豫等机制造成附加吸收。",
    "古典吸收系数正比于频率平方。",
  ],
  exampleTitle: "例题　五十千赫声呐的一千米接收预算",
  background:
    "声呐一米参考声源级为 180 dB，频率 50 kHz，传播距离 1 km，采用索普经验式估计海水吸收。求吸收系数、路径吸收损失及接收声压级，并比较频率升高的传播代价。",
  exampleDefaults: p,
  given: [f, r],
  asks,
  judgment:
    "较高频率有利于缩小波束，却增加海水吸收；应把发射孔径、传播距离和接收门限共同纳入设计。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "固定声源级与距离时各频率的接收余量",
        "工作频率 f (Hz)",
        "接收声压级 (dB)",
        [1000, 100000],
        [0, 1],
        [
          points(
            "传播后的接收频谱",
            log(1000, 100000).map((f) => [
              f,
              p.SL - 20 * Math.log10(p.r) - (phy.thorp(f) * p.r) / 1000,
            ]),
            "logspace(3,5,401)",
            "SL-20*log10(r)-p4Thorp(x)*r/1000",
          ),
          points("选定声呐频率", [[p.f, asks[2].calc(p)]], "f", "receivedLevel", {
            marker: "o",
            style: "none",
          }),
        ],
        setup,
        { xscale: "log" },
      ),
      "receivedLevel",
    ),
  engineering: engineering(
    "海底观测站选频需要在波束宽度与海水吸收之间折中。对于具体海域，应使用包含实际温盐深条件的吸收模型复核。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
