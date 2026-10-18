import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  curve,
  example,
  ask,
  answerCurve,
  engineering,
} from "../p2";
import { controlVolume } from "../../plot/p2Diagrams";
const wLeft = parameter("wLeft", "左面瞬时能流密度", "W入", "W/m²", -0.02, 0.02, 0.001),
  wRight = parameter("wRight", "右面瞬时能流密度", "W出", "W/m²", -0.02, 0.02, 0.001),
  L = parameter("L", "体元长度", "dx", "m", 0.01, 1, 0.01),
  S = parameter("S", "截面积", "S", "m²", 0.001, 1, 0.001);
const p = { ...defaults, wLeft: 0.004, wRight: 0.003, L: 0.1, S: 0.01, left: 0.012, right: 0.008 };
export default p2Lecture("3.3.2", {
  defaults: p,
  parameters: [wLeft, wRight, L, S],
  animation: true,
  animationPeriod: () => 1,
  keyPoints: [
    "声能流密度是单位时间通过垂直于传播方向的单位面积的声能，单位 $\\mathrm{W/m^2}$，是有方向的瞬时量。",
    "无耗散、无源区域中，单位体积能量的时间增加率等于能流密度散度的负值。",
    "对有限控制体，能量积累等于各面净流入声功率；它与质量守恒有相同的收支结构，但所守恒的物理量不同。",
  ],
  formulas: [
    {
      number: "3.3.2-1",
      tex: String.raw`\mathbf W=p\mathbf u,\quad\partial_tE_0=-\nabla\cdot\mathbf W`,
      meaning: "正散度意味着净流出，内部声能量随时间减少。",
    },
    {
      number: "3.3.2-2",
      tex: String.raw`\frac{d}{dt}\int_V E_0\,dV=-\oint_{\partial V}\mathbf W\cdot\mathbf n\,dS`,
      meaning: "图中其余两对表面的净通量设为零；两面输入是某个瞬间的局部量。",
    },
  ],
  figures: [
    figure(
      "3.3.2-1",
      "质量与声能控制体的收支对照",
      (p, t) => [controlVolume(p, t), controlVolume(p, t, true)],
      1,
      2,
    ),
    figure("3.3.2-2", "净声功率与内部能量积累", (p) => [
      graph(
        p,
        0,
        "能量积累 = 净流入声功率 × 时间",
        "时间 dt (s)",
        "声能变化 ΔE (J)",
        [0, 1],
        [-0.0001, 0.0001],
        [
          curve("左面流入能量", (x) => p.wLeft * p.S * x, [0, 1], "linspace(0,1,401)", "wLeft*S*x"),
          curve(
            "右面流出能量",
            (x) => p.wRight * p.S * x,
            [0, 1],
            "linspace(0,1,401)",
            "wRight*S*x",
            "--",
          ),
          curve(
            "内部声能变化",
            (x) => (p.wLeft - p.wRight) * p.S * x,
            [0, 1],
            "linspace(0,1,401)",
            "(wLeft-wRight)*S*x",
          ),
        ],
        "",
        {},
        { ylim: "[-1 1]*max(1e-12,max(abs([wLeft wRight wLeft-wRight]))*S)*1.5" },
      ),
    ]),
  ],
  readouts: (p) => [
    ["净流入声功率", (p.wLeft - p.wRight) * p.S, "W"],
    ["声能量密度变化率", (p.wLeft - p.wRight) / p.L, "W/m³"],
    ["质量密度变化率（对照）", (p.rho * (p.left - p.right)) / p.L, "kg/(m³·s)"],
  ],
  readoutModel: "[(wLeft-wRight)*S (wLeft-wRight)/L rho*(left-right)/L]",
  examples: [
    example(
      "例题　风道微元的瞬时能量积累",
      "一个长 0.1 m、截面积 0.01 m² 的风道体元，在某瞬间左、右面的声能流密度分别为 0.004 和 0.003 $\\mathrm{W/m^2}$。求净流入声功率和能量密度变化率。",
      p,
      [wLeft, wRight, L, S],
      [
        ask(
          "power",
          "(1) 净流入声功率",
          "W",
          String.raw`P_{\rm net}=S(W_{\rm in}-W_{\rm out})`,
          "S*(wLeft-wRight)",
          (p) => p.S * (p.wLeft - p.wRight),
          (p) => `${p.S} m² × (${p.wLeft}−${p.wRight}) W/m²`,
        ),
        ask(
          "rate",
          "(2) 能量密度变化率",
          "W/m³",
          String.raw`\partial_t E_0=P_{\rm net}/(Sdx)`,
          "power/(S*L)",
          (p) => (p.wLeft - p.wRight) / p.L,
          (p) => `${p.S * (p.wLeft - p.wRight)} W ÷ (${p.S} m² × ${p.L} m)`,
        ),
      ],
      (p) =>
        p.wLeft > p.wRight
          ? "该瞬间能量增加；若为无耗散稳态，时间平均净流入应为零。"
          : "该瞬间无正积累；应核对两个表面的正方向。",
      (p) =>
        answerCurve(
          p,
          "wLeft",
          "左面能流密度",
          "W/m²",
          (q) => (q.wLeft - q.wRight) / q.L,
          "(x-wRight)/L",
        ),
    ),
  ],
  answers: [
    "不同。能量密度描述单位体积储存的声能，单位 $\\mathrm{J/m^3}$；能流密度描述穿过单位面积的瞬时功率，单位 $\\mathrm{W/m^2}$。",
  ],
  engineering: engineering(
    "风道离散模型中的声能收支可以检查数值耗散和边界功率；净流入与储能变化必须按同一符号约定统计。",
    "duct",
    "通风管道模态与反射",
  ),
});
