import {
  makeLecture,
  parameter,
  figure,
  ask,
  engineering,
  water,
  graph,
  points,
  circle,
  substitution,
  answer,
  log,
} from "../p4";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "工作频率", "f", "Hz", 40000, 80000, 1000),
  a = parameter("a", "活塞半径", "a", "m", 0.025, 0.08, 0.001),
  v = parameter("v", "表面振速峰值", "v₀", "m/s", 0.001, 0.03, 0.001);
const p = { ...water, f: 50000, zobs: 1 },
  setup = "lambda=c/f;D0=max(0,a^2/lambda-lambda/4);Re=4*a^2/lambda;";
const err = (z: number, p: Record<string, number>) => {
  const exact = phy.magnitude(phy.pistonAxis(z, p.a, p.f, p.rho, p.c, p.v)),
    far = (p.rho * p.f * Math.PI * p.a ** 2 * p.v) / z;
  return (100 * Math.abs(far - exact)) / Math.max(1e-20, exact);
};
const asks = [
  ask(
    "lastMax",
    "(1) 最远声压极大位置",
    "m",
    "D_0=a^2/\\lambda-\\lambda/4",
    "D0",
    (p) => phy.lastMaximum(p.a, p.f, p.c),
    substitution,
  ),
  ask(
    "rayleigh",
    "(2) 瑞利距离",
    "m",
    "R_e=d^2/\\lambda=4a^2/\\lambda",
    "Re",
    (p) => phy.rayleigh(p.a, p.f, p.c),
    substitution,
  ),
  ask(
    "pressure",
    "(3) 一米处声压峰值",
    "Pa",
    "|P(z)|=2\\rho_0c_0v_0|\\sin[\\tfrac k2(\\sqrt{z^2+a^2}-z)]|",
    "abs(p4Axis(zobs,a,f,rho,c,v))",
    (p) => phy.magnitude(phy.pistonAxis(p.zobs, p.a, p.f, p.rho, p.c, p.v)),
    substitution,
  ),
  ask(
    "error",
    "(4) 一米处远场幅值近似误差",
    "%",
    "\\epsilon=\\left|\\frac{\\rho_0fa^2\\pi v_0/z}{|P(z)|}-1\\right|",
    "100*abs(rho*f*pi*a^2*v/zobs/pressure-1)",
    (p) => err(p.zobs, p),
    substitution,
  ),
];
export default makeLecture("4.4.4", {
  defaults: p,
  parameters: [f, a, v],
  keyPoints: [
    "圆面活塞轴向声压严格解具有多个极大与极小，最远极大位置与孔径和波长共同有关。",
    "按原课件定义，瑞利距离为最大线度平方除以波长；圆活塞最大线度为直径。",
    "小于瑞利距离为近场或菲涅尔区，大于瑞利距离为过渡区，远大于瑞利距离才可用远场反距离规律。",
    "方向图与辐射性能测量应在远大于瑞利距离处进行；本页以五倍瑞利距离作为可编辑设计的保守参考线，而非普适硬边界。",
  ],
  formulas: [
    {
      number: "4.4.4-1",
      tex: "P(z)=\\rho_0c_0v_0\\big[e^{-jkz}-e^{-jk\\sqrt{z^2+a^2}}\\big]",
      meaning: "轴向两端路程差决定近场起伏；远处趋于反距离幅值规律。",
    },
    {
      number: "4.4.4-2",
      tex: "D_0=\\frac{a^2}{\\lambda}-\\frac\\lambda4,\\quad R_e=\\frac{(2a)^2}{\\lambda}",
      meaning: "本页采用 PPT 的瑞利距离；其他文献的 $\\pi a^2/\\lambda$ 定义不可直接混用。",
    },
  ],
  figures: [
    figure(
      "4.4.4-1",
      "活塞轴向严格声压、各极值与远近场分区",
      (p) => {
        const Re = phy.rayleigh(p.a, p.f, p.c),
          D0 = phy.lastMaximum(p.a, p.f, p.c),
          maxima = phy.extrema(p.a, p.f, p.c, true),
          minima = phy.extrema(p.a, p.f, p.c, false);
        const annotations = [
          { axis: "x" as const, value: D0, label: "最远极大 D₀" },
          { axis: "x" as const, value: Re, label: "瑞利距离 Rₑ" },
          ...maxima
            .slice(1)
            .map((x, i) => ({ axis: "x" as const, value: x, label: "极大 " + (i + 2) })),
          ...minima.map((x, i) => ({ axis: "x" as const, value: x, label: "极小 " + (i + 1) })),
        ];
        return [
          graph(
            p,
            0,
            "轴向声压：近场起伏与远场反距离衰减",
            "轴向距离 z (m)",
            "声压峰值 (Pa)",
            [0.001, 10],
            [0, 1],
            [
              points(
                "活塞轴向严格解",
                log(0.001, 10, 1001).map((z) => [
                  z,
                  phy.magnitude(phy.pistonAxis(z, p.a, p.f, p.rho, p.c, p.v)),
                ]),
                "logspace(-3,1,1001)",
                "abs(p4Axis(x,a,f,rho,c,v))",
              ),
              points(
                "反距离渐近线（仅画瑞利距离外）",
                log(Re, 10).map((z) => [z, (p.rho * p.f * Math.PI * p.a ** 2 * p.v) / z]),
                "logspace(log10(Re),1,401)",
                "rho*f*pi*a^2*v./x",
                { style: "--" },
              ),
            ],
            setup,
            {
              xscale: "log",
              annotations,
              bands: [
                { from: 0.001, to: Re, label: "近场" },
                { from: Re, to: Math.min(10, 5 * Re), label: "过渡区" },
                { from: Math.min(10, 5 * Re), to: 10, label: "远场参考" },
              ],
            },
            {
              annotations: [
                "D0",
                "Re",
                ...maxima
                  .slice(1)
                  .map(
                    (_, i) =>
                      "(a^2-(((" +
                      String(i + 1) +
                      ")+.5)*lambda)^2)/(2*((" +
                      String(i + 1) +
                      ")+.5)*lambda)",
                  ),
                ...minima.map(
                  (_, i) =>
                    "(a^2-(" + String(i + 1) + "*lambda)^2)/(2*" + String(i + 1) + "*lambda)",
                ),
              ],
              bands: [
                { from: ".001", to: "Re" },
                { from: "Re", to: "min(10,5*Re)" },
                { from: "min(10,5*Re)", to: "10" },
              ],
            },
          ),
          circle(p, "圆面活塞孔径", 0.08),
        ];
      },
      2,
      1,
    ),
  ],
  answers: [
    "按本课件，辐射器最大线度的平方除以波长；圆活塞为直径平方除以波长。",
    "小于瑞利距离为近场，大于瑞利距离为过渡区，远大于瑞利距离为远场。",
    "近场有幅值起伏，过渡区趋于单调变化，远场声压幅值按距离一次方衰减且方向函数与距离分离。",
    "需要在远大于瑞利距离的远场测量。",
  ],
  exampleTitle: "例题　活塞换能器的一米校准距离是否足够",
  background:
    "半径 0.05 m、频率 50 kHz 的水声活塞表面振速峰值为 0.01 m/s，水听器放在轴上 1 m 处。求最远声压极大位置、瑞利距离、声压和远场幅值近似误差，决定是否增加校准距离。",
  exampleDefaults: p,
  given: [a, f, v],
  asks,
  judgment:
    "默认一米约为三倍瑞利距离，已越过主要近场起伏；严格测量可选择五倍瑞利距离约 1.67 m 以上。远场判定与允许的幅值、相位误差要求有关。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "增加校准距离对轴向远场幅值近似误差的改善",
        "水听器轴向距离 z (m)",
        "远场幅值近似误差 (%)",
        [0.2, 5],
        [0, 1],
        [
          points(
            "严格解与反距离近似的相对误差",
            log(0.2, 5).map((z) => [z, err(z, p)]),
            "logspace(log10(.2),log10(5),401)",
            "100*abs(rho*f*pi*a^2*v./x./max(1e-20,abs(p4Axis(x,a,f,rho,c,v)))-1)",
          ),
          points("一米校准位置", [[p.zobs, err(p.zobs, p)]], "zobs", "error", {
            marker: "o",
            style: "none",
          }),
        ],
        setup,
        {
          annotations: [
            { axis: "x", value: 5 * phy.rayleigh(p.a, p.f, p.c), label: "五倍瑞利距离参考" },
          ],
        },
        { annotations: ["5*Re"] },
      ),
      "error",
    ),
  engineering: engineering(
    "水池校准应由孔径和工作频率估算所需空间，再用轴向严格解量化拟采用距离的近似误差；一条固定的远场倍数不能代替测量误差预算。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
