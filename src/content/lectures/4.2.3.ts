import {
  makeLecture,
  parameter,
  figure,
  ask,
  engineering,
  water,
  graph,
  curve,
  points,
  substitution,
  answer,
} from "../p4";
import { imagePanel } from "../../plot/p4Fields";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "频率", "f", "Hz", 1000, 10000, 100),
  N = { ...parameter("N", "阵元数", "N", "—", 1, 8, 1), integer: true },
  d = parameter("d", "阵元间距", "d", "m", 0.02, 0.3, 0.01),
  Q = parameter("Q", "单元体积速度", "Q", "m³/s", 1e-6, 3e-5, 1e-6);
const p = { ...water, f: 5000, N: 4, d: 0.15, Q: 1e-5, r: 5 };
const asks = [
  ask(
    "singlePressure",
    "(1) 单源正前方声压峰值",
    "Pa",
    "|P_1|=\\rho_0fQ/(2r)",
    "rho*f*Q/(2*r)",
    (p) => (p.rho * p.f * p.Q) / (2 * p.r),
    substitution,
  ),
  ask(
    "pressure",
    "(2) 正前方测点声压峰值",
    "Pa",
    "P=\\sum_n\\frac{j\\rho_0\\omega Q}{4\\pi r_n}e^{-jkr_n}",
    "abs(p4Array(r,0,N,d,Q,f,rho,c))",
    (p) => phy.magnitude(phy.arrayPressure(p.r, 0, p.N, p.d, p.Q, p.f, p.rho, p.c)),
    substitution,
  ),
];
export default makeLecture("4.2.3", {
  defaults: p,
  parameters: [f, N, d, Q],
  keyPoints: [
    "点声源近似要求声源尺寸远小于波长，且观察距离远大于声源尺寸。",
    "声源强度是体积速度，均匀脉动球的强度等于表面积乘表面振速。",
    "点源的辐射在自由空间中各向同性，复杂声源可按振幅与相位由点源叠加；有限间距阵列通常不再各向同性。",
  ],
  formulas: [
    {
      number: "4.2.3-1",
      tex: "Q=4\\pi a^2v_0,\\quad ka\\ll1,\\quad r\\gg a",
      meaning: "体积速度是每秒排开的体积幅值；两个尺度条件缺一不可。",
    },
    {
      number: "4.2.3-2",
      tex: "\\Phi=-\\frac{Q}{4\\pi r}e^{-jkr},\\quad P=-j\\omega\\rho_0\\Phi,\\quad P_{\\text{阵}}=\\sum_n P_n",
      meaning: "采用 $\\mathbf u=\\nabla\\Phi$ 与 $e^{j\\omega t}$，叠加时须保留相位。",
    },
  ],
  figures: [
    figure("4.2.3-1", "等相位线阵点源的复声压叠加与阵元位置", (p) => [
      imagePanel(
        p,
        0,
        "线阵叠加声场（距点源 5 mm 内截断）",
        [-1.5, 1.5],
        [-1.5, 1.5],
        (x, y) => phy.arrayPressure(x, y, p.N, p.d, p.Q, p.f, p.rho, p.c).re,
        "real(p4Array(XX,YY,N,d,Q,f,rho,c))",
        "",
        [
          points(
            "各点源",
            Array.from({ length: p.N }, (_, i) => [0, (i - (p.N - 1) / 2) * p.d]),
            "zeros(1,N)",
            "((0:N-1)-(N-1)/2)*d",
            { marker: "o", style: "none", geometry: { key: "d", axis: "y" } },
          ),
        ],
        [-p.rho * p.f * p.Q * 2, p.rho * p.f * p.Q * 2],
        "声压 (Pa)",
        "[-2 2]*rho*f*Q",
      ),
    ]),
  ],
  answers: [
    "尺寸相对波长可忽略、观察距离远大于尺寸的理想体积速度源。",
    "扩张球面波，各向同性，声压幅值随距离一次方衰减。",
    "声源强度为单位时间排开的体积，即体积速度幅值。",
    "先由 $\\Phi=-Qe^{-jkr}/(4\\pi r)$ 求速度势，再用 $P=-j\\omega\\rho_0\\Phi$ 求声压。",
  ],
  exampleTitle: "例题　四阵元水声线阵的正前方声压",
  background:
    "四只小型体积速度源同相工作，频率 5 kHz、单元体积速度峰值 $10^{-5}\\ \\mathrm{m^3/s}$、间距 0.15 m。接收点在阵列中心正前方 5 m。求阵元强度与接收声压，并观察横向干涉起伏。",
  exampleDefaults: p,
  given: [N, d, f, Q],
  asks,
  judgment: "正前方各阵元距离相近，声压可近似相干相加；偏离主轴时必须按实际路程叠加复数。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "四阵元线阵在 5 m 接收截线上的干涉波束",
        "横向接收坐标 y (m)",
        "合成声压峰值 (Pa)",
        [-5, 5],
        [0, 1],
        [
          curve(
            "有限距离的相干叠加",
            (y) => phy.magnitude(phy.arrayPressure(p.r, y, p.N, p.d, p.Q, p.f, p.rho, p.c)),
            [-5, 5],
            "linspace(-5,5,401)",
            "abs(p4Array(r,x,N,d,Q,f,rho,c))",
          ),
          points("正前方接收", [[0, asks[1].calc(p)]], "0", "pressure", {
            marker: "o",
            style: "none",
          }),
        ],
      ),
      "pressure",
    ),
  engineering: engineering(
    "线阵声呐通过控制阵元间距、数量和相位形成波束；单元可用点源近似，整个阵列则须考虑方向相关的干涉。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
