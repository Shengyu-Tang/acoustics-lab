import { e312 } from "../../plot/p2Examples";
import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  points,
  example,
  ask,
  engineering,
} from "../p2";
import { planeQuantities, pressureFromLevel } from "../../physics/chapter3";
const p = { ...defaults, medium: 0, level: 93.9794000867 };
const level = parameter("level", "声压级（有效值）", "SPL", "dB", 20, 180, 1);
const values = (p: Record<string, number>) => {
  const rho = p.medium ? 1000 : 1.21,
    c = p.medium ? 1500 : 343,
    rms = pressureFromLevel(p.level, p.medium ? 1e-6 : 20e-6);
  return { rms, ...planeQuantities(Math.SQRT2 * rms, p.f, rho, c) };
};
export default p2Lecture("3.1.2", {
  defaults: p,
  parameters: [level, params.f],
  interactive: {
    selectors: [
      { key: "medium", label: "介质与声压参考值", options: ["空气：20 μPa", "水：1 μPa"] },
    ],
  },
  keyPoints: [
    "声压是有声波时介质压强相对静压的变化量，单位 Pa。",
    "质点振速是介质流速的变化量，单位 m/s；它与声波传播速度不同。",
    "密度逾量是介质密度相对静态密度的变化量；除以静态密度得到压缩量。",
    "以下换算限于理想介质中的平面行波，明确区分峰值与有效值；相同声压级在空气和水中对应不同声压。",
  ],
  formulas: [
    {
      number: "3.1.2-1",
      tex: String.raw`p=P-P_0,\quad\rho'=\rho-\rho_0,\quad s=\rho'/\rho_0`,
      meaning: "三个基本声学量分别描述压力、速度和密度的扰动。",
    },
    {
      number: "3.1.2-2",
      tex: String.raw`u_a=\frac{p_a}{\rho_0c_0},\quad\xi_a=\frac{u_a}{2\pi f},\quad\rho'_a=\frac{p_a}{c_0^2},\quad p_a=\sqrt{2}p_{\rm rms}`,
      meaning: "振速和位移可极小，而波仍以介质声速传播。",
    },
  ],
  figures: [
    figure(
      "3.1.2-1",
      "相同声压在空气与水中的振速、位移量级",
      (p) => {
        const v = values(p),
          pressure = v.rms * Math.SQRT2;
        return [
          graph(
            p,
            0,
            "同一峰值声压：介质与频率的影响",
            "介质（—）",
            "振速幅值 uₐ (m/s)",
            [0.5, 2.5],
            [pressure / 15000000, (pressure / (1.21 * 343)) * 10],
            [
              points(
                "振速",
                [
                  [1, pressure / (1.21 * 343)],
                  [2, pressure / 1500000],
                ],
                "[1 2]",
                "amp./[1.21*343 1.5e6]",
                { kind: "bar" },
              ),
            ],
            "ref=20e-6; if medium==1,ref=1e-6;end;amp=sqrt(2)*ref*10^(level/20);",
            {
              xscale: "linear",
              yscale: "linear",
              xtickLabels: [
                { value: 1, label: "空气" },
                { value: 2, label: "水" },
              ],
              legend: false,
            },
            { ylim: "[amp/1.5e7 amp/(1.21*343)*10]" },
          ),
          graph(
            p,
            0,
            "同一峰值声压：质点位移",
            "介质（—）",
            "位移幅值 ξₐ (m)",
            [0.5, 2.5],
            [
              pressure / (15000000 * 2 * Math.PI * p.f),
              (pressure / (1.21 * 343 * 2 * Math.PI * p.f)) * 10,
            ],
            [
              points(
                "位移",
                [
                  [1, pressure / (1.21 * 343 * 2 * Math.PI * p.f)],
                  [2, pressure / (1500000 * 2 * Math.PI * p.f)],
                ],
                "[1 2]",
                "amp./([1.21*343 1.5e6]*2*pi*f)",
                { kind: "bar" },
              ),
            ],
            "ref=20e-6; if medium==1,ref=1e-6;end;amp=sqrt(2)*ref*10^(level/20);",
            {
              xscale: "linear",
              yscale: "linear",
              xtickLabels: [
                { value: 1, label: "空气" },
                { value: 2, label: "水" },
              ],
              legend: false,
            },
            { ylim: "[amp/(1.5e7*2*pi*f) amp/(1.21*343*2*pi*f)*10]" },
          ),
        ];
      },
      2,
    ),
  ],
  readouts: (p) => {
    const q = values(p);
    return [
      ["声压有效值", q.rms, "Pa"],
      ["声压峰值", q.rms * Math.SQRT2, "Pa"],
      ["振速峰值", q.ua, "m/s"],
      ["位移峰值", q.displacement, "m"],
      ["密度逾量峰值", q.density, "kg/m³"],
      ["压缩量峰值", q.compression, "—"],
    ];
  },
  readoutModel:
    "[ref*10^(level/20) amp amp/((1-medium)*1.21*343+medium*1.5e6) amp/((1-medium)*1.21*343+medium*1.5e6)/(2*pi*f) amp/((1-medium)*343+medium*1500)^2 amp/(((1-medium)*1.21+medium*1000)*((1-medium)*343+medium*1500)^2)]",
  examples: [
    example(
      "例题　校准声场中质点运动的量级",
      "空气声校准场的声压峰值为 1 Pa，频率为 1 kHz，密度 1.21 kg/m³、声速 343 m/s。估计振速和位移峰值，判断微小质点运动是否足以形成可测声压。",
      p,
      [params.pa, params.f, params.rho, params.c],
      [
        ask(
          "ua",
          "(1) 振速峰值",
          "m/s",
          String.raw`u_a=p_a/(\rho_0c_0)`,
          "pa/(rho*c)",
          (p) => planeQuantities(p.pa, p.f, p.rho, p.c).ua,
          (p) => `${p.pa} Pa ÷ (${p.rho} kg/m³ × ${p.c} m/s)`,
        ),
        ask(
          "xi",
          "(2) 位移峰值",
          "m",
          String.raw`\xi_a=u_a/(2\pi f)`,
          "ua/(2*pi*f)",
          (p) => planeQuantities(p.pa, p.f, p.rho, p.c).displacement,
          (p) => `${p.pa / (p.rho * p.c)} m/s ÷ (2π × ${p.f} Hz)`,
        ),
      ],
      () => "位移远小于毫米，声速不能用这个局部振速代替。",
      (p) => e312(p),
    ),
  ],
  answers: [
    "不是。声压是单位面积上的力，单位 Pa，即 N/m²。",
    "声速描述扰动或等相位面的传播，质点振速描述局部介质往复运动。",
    "不一定；线性小振幅条件下增大振幅改变质点振速，不改变介质声速。",
    "理想均匀、无频散流体模型中相同；实际介质可能存在频散和吸收。",
    "压力、运动及密度形变分别对应动力学、质量守恒与状态关系，三者可完整描述小扰动声场。",
  ],
  engineering: engineering(
    "麦克风和水听器通常测声压；换算为振速或位移必须先确认介质参数和平面行波条件。",
    "receiver",
    "水下监听接收器选型",
  ),
});
