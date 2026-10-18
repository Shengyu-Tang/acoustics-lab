import { completeExamples } from "../calculationSteps";
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
  comparison,
  log,
} from "../p4";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "频率", "f", "Hz", 500, 20000, 100),
  a = parameter("a", "刚性球半径", "a", "m", 0.01, 0.08, 0.001),
  pa = parameter("pa", "入射声压峰值", "pₐ", "Pa", 0.1, 10, 0.1);
const p = { ...water, f: 5000, pa: 1 };
const asks = [
  ask(
    "crossSection",
    "(1) 总散射截面",
    "m²",
    "\\sigma_s=\\frac{4\\pi a^2}{(ka)^2}\\sum_{n=0}^{\\infty}(2n+1)|j_n'(ka)/h_n^{(2)\\prime}(ka)|^2",
    "pi*a^2*p4Sigma(k*a)",
    (p) => Math.PI * p.a ** 2 * phy.rigidSphere(phy.kWave(p.f, p.c) * p.a, 0).crossSection,
    substitution,
  ),
  ask(
    "scatteredPower",
    "(2) 总散射声功率",
    "W",
    "\\bar W_s=I_i\\sigma_s,\\quad I_i=p_a^2/(2\\rho_0c_0)",
    "pa^2/(2*rho*c)*crossSection",
    (p) =>
      (p.pa ** 2 / (2 * p.rho * p.c)) *
      Math.PI *
      p.a ** 2 *
      phy.rigidSphere(phy.kWave(p.f, p.c) * p.a, 0).crossSection,
    substitution,
  ),
];
function cumulative(p: Record<string, number>) {
  const ka = phy.kWave(p.f, p.c) * p.a,
    out: [number, number][] = [[0, 0]],
    scale = (2 * Math.PI * p.a ** 2 * p.pa ** 2) / (2 * p.rho * p.c);
  let previous = 0,
    sum = 0;
  for (let i = 1; i <= 400; i++) {
    const th = (i * Math.PI) / 400,
      y = phy.rigidSphere(ka, th).amplitude ** 2 * Math.sin(th);
    sum += ((((previous + y) / 2) * Math.PI) / 400) * scale;
    out.push([(i * 180) / 400, sum]);
    previous = y;
  }
  return out;
}
const completedLecture = makeLecture("5.2", {
  defaults: p,
  parameters: [a, f],
  measurements: [
    { name: "无量纲尺寸", unit: "—", matlab: "k*a", calc: (p) => phy.kWave(p.f, p.c) * p.a },
    {
      name: "散射截面与几何截面之比",
      unit: "—",
      matlab: "p4Sigma(k*a)",
      calc: (p) => phy.rigidSphere(phy.kWave(p.f, p.c) * p.a, 0).crossSection,
    },
  ],
  keyPoints: [
    "刚性球表面总声场的径向导数为零，散射场由球贝塞尔函数与勒让德多项式级数构成。",
    "无量纲尺寸控制散射指向性，小球与波长相当或更大的球具有不同角分布。",
    "瑞利散射区中，固定球半径和入射声强，刚性微小粒子的散射功率正比于频率四次方。",
    "总散射截面由远场散射声强对全立体角积分得到；归一化截面以球的几何截面为分母。",
  ],
  formulas: [
    {
      number: "5.2-1",
      tex: "P_s=-p_a\\sum_{n=0}^\\infty(2n+1)(-j)^n\\frac{j_n'(ka)}{h_n^{(2)\\prime}(ka)}h_n^{(2)}(kr)P_n(\\cos\\theta)",
      meaning: "外向柱面与球面函数均采用第二类，保持 $e^{j\\omega t}$ 约定。",
    },
    {
      number: "5.2-2",
      tex: "\\frac{\\sigma_s}{\\pi a^2}\\xrightarrow{ka\\ll1}\\frac79(ka)^4,\\quad\\bar W_s=I_i\\sigma_s",
      meaning: "低频四次方律只在小尺寸极限适用，不能外推到任意频率。",
    },
  ],
  figures: [
    comparison(
      figure(
        "5.2-1",
        "四种无量纲尺寸下刚性球的散射指向性",
        (p) =>
          [0.5, 1, 3, 10].map((ka) => {
            const th = Array.from({ length: 361 }, (_, i) => (2 * Math.PI * i) / 360),
              vals = th.map((t) => phy.rigidSphere(ka, t).amplitude),
              peak = Math.max(...vals);
            return graph(
              p,
              0,
              "刚性球散射，尺寸参数 " + ka,
              "方向角",
              "归一化散射幅值",
              [0, 2 * Math.PI],
              [0, 1],
              [
                points(
                  "相对最大幅值",
                  th.map((t, i) => [t, vals[i] / peak]),
                  "linspace(0,2*pi,361)",
                  "p4Rigid(" + ka + ",x)/peak",
                ),
              ],
              "qth=linspace(0,2*pi,361);peak=max(p4Rigid(" + ka + ",qth));",
              { kind: "polar" },
            );
          }),
        2,
        2,
      ),
      ["a", "f"],
      "本图固定四组无量纲尺寸以比较方向函数；当前尺寸与绝对散射功率见下图及例题。",
    ),
    figure(
      "5.2-2",
      "刚性球归一化散射截面与瑞利四次方极限",
      (p) => [
        graph(
          p,
          0,
          "小球散射的四次方律及偏离",
          "无量纲尺寸 ka",
          "散射截面与几何截面之比",
          [0.01, 10],
          [1e-9, 1e5],
          [
            points(
              "级数解",
              log(0.01, 10).map((x) => [x, phy.rigidSphere(x, 0).crossSection]),
              "logspace(-2,1,401)",
              "p4Sigma(x)",
            ),
            points(
              "瑞利低频近似",
              log(0.01, 1).map((x) => [x, (7 / 9) * x ** 4]),
              "logspace(-2,0,401)",
              "7/9*x.^4",
              { style: "--" },
            ),
            points(
              "当前刚性球",
              [
                [
                  phy.kWave(p.f, p.c) * p.a,
                  phy.rigidSphere(phy.kWave(p.f, p.c) * p.a, 0).crossSection,
                ],
              ],
              "k*a",
              "p4Sigma(k*a)",
              { marker: "o", style: "none" },
            ),
          ],
          "",
          { xscale: "log", yscale: "log" },
        ),
      ],
      1,
      1,
    ),
  ],
  answers: [
    "散射场满足亥姆霍兹方程，球表面总径向振速为零，远处满足向外辐射条件。",
    "刚性微小粒子在小尺寸极限下，固定入射声强时总散射功率正比于频率四次方。",
  ],
  exampleTitle: "例题　水中刚性球的散射功率预算",
  background:
    "半径 50 mm 的刚性球受到 5 kHz、峰值 1 Pa 的水下平面波照射。求总散射截面与散射功率，并将角向散射逐步积分到全空间，检查总功率。",
  exampleDefaults: p,
  given: [a, f, pa],
  asks,
  judgment: "本题无量纲尺寸约为一，应使用球面级数而不能直接套用瑞利低频四次方近似。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "从前向极点累积到全空间的散射声功率",
        "累积极角 θ (°)",
        "累积散射声功率 (W)",
        [0, 180],
        [0, 1],
        [
          points(
            "对立体角逐步积分",
            cumulative(p),
            "linspace(0,180,401)",
            "2*pi*a^2*pa^2/(2*rho*c)*cumtrapz(qth,p4Rigid(k*a,qth).^2.*sin(qth))",
          ),
          points("全空间散射声功率", [[180, asks[1].calc(p)]], "180", "scatteredPower", {
            marker: "o",
            style: "none",
          }),
        ],
        "qth=linspace(0,pi,401);",
      ),
      "scatteredPower",
    ),
  engineering: engineering(
    "水下目标的散射截面用于把入射声强转化为散射功率；粒径、频率和接收方向都影响目标可探测性。",
    "sonar",
    "海底观测站主动声呐",
  ),
});

export default completeExamples(completedLecture);
