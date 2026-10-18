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
import { meanIntensity, powerLevel } from "../../physics/chapter3";
const phase = parameter("phase", "压力与振速相位差", "φ", "°", 0, 90, 1),
  ua = parameter("ua", "振速峰值", "uₐ", "m/s", 0.00001, 0.02, 0.00001);
const p = { ...defaults, phase: 30, ua: 0.002 };
export default p2Lecture("3.3.3", {
  defaults: p,
  parameters: [params.pa, ua, phase, params.f],
  keyPoints: [
    "声能流密度等于实际声压与实际振速的乘积，不能直接相乘两个复表示。",
    "正负能流表示能量沿选定坐标正向或反向流动；有正有负可表示往复能量交换。",
    "声强是瞬时能流密度的周期平均值，纯驻波的平均声强为零，但声场中仍有能量。",
    "声强级是声强相对参考声强的十倍常用对数，参考值需说明。",
  ],
  formulas: [
    {
      number: "3.3.3-1",
      tex: String.raw`W(t)=p(t)u(t),\quad I=\frac1T\int_0^T W(t)\,dt=\frac12p_au_a\cos\varphi`,
      meaning: "相位差控制有功传能与反应性往复交换。",
    },
    {
      number: "3.3.3-2",
      tex: String.raw`SIL=10\lg(I/I_{\rm ref}),\quad I_{\rm ref}=10^{-12}\,\mathrm{W/m^2}`,
      meaning: "声强为零时级趋向负无穷；负的有向声强不能直接取对数，应另外说明方向。",
    },
  ],
  figures: [
    figure(
      "3.3.3-1",
      "声压、振速和瞬时能流与周期平均",
      (p) => {
        const a = (p.phase * Math.PI) / 180,
          I = meanIntensity(p.pa, p.ua, a);
        return [
          graph(
            p,
            0,
            "声压与振速相位差可调",
            "时间 t (s)",
            "声压 p (Pa)",
            [0, 0.002],
            [-1.5 * p.pa, 1.5 * p.pa],
            [
              curve(
                "声压 p",
                (x) => p.pa * Math.cos(2 * Math.PI * p.f * x),
                [0, 0.002],
                "linspace(0,.002,401)",
                "pa*cos(w*x)",
              ),
              {
                ...curve(
                  "振速 u（右轴）",
                  (x) => p.ua * Math.cos(2 * Math.PI * p.f * x - a),
                  [0, 0.002],
                  "linspace(0,.002,401)",
                  "ua*cos(w*x-phase*pi/180)",
                ),
                axis: "right",
              },
            ],
            "",
            { rightLabel: "振速 u (m/s)", rightLim: [-1.5 * p.ua, 1.5 * p.ua] },
            { ylim: "[-1.5 1.5]*pa", rightLim: "[-1.5 1.5]*ua" },
          ),
          graph(
            p,
            0,
            "瞬时能流与平均声强",
            "时间 t (s)",
            "W 与 I (W/m²)",
            [0, 0.002],
            [-1.2 * p.pa * p.ua, 1.8 * p.pa * p.ua],
            [
              curve(
                "W = p u",
                (x) =>
                  p.pa *
                  p.ua *
                  Math.cos(2 * Math.PI * p.f * x) *
                  Math.cos(2 * Math.PI * p.f * x - a),
                [0, 0.002],
                "linspace(0,.002,401)",
                "pa*ua*cos(w*x).*cos(w*x-phase*pi/180)",
              ),
              curve(
                "平均声强 I",
                () => I,
                [0, 0.002],
                "linspace(0,.002,401)",
                "pa*ua/2*cos(phase*pi/180)*ones(size(x))",
                "--",
              ),
            ],
            "",
            {},
            { ylim: "[-1.2 1.8]*pa*ua" },
          ),
        ];
      },
      2,
    ),
  ],
  readouts: (p) => {
    const I = meanIntensity(p.pa, p.ua, (p.phase * Math.PI) / 180);
    return [
      ["周期平均声强", Math.abs(I) < 1e-16 ? 0 : I, "W/m²"],
      ["声强级（正声强时）", I > 1e-16 ? powerLevel(I) : -Infinity, "dB re 10⁻¹² W/m²"],
    ];
  },
  readoutModel: "[pa*ua/2*cos(phase*pi/180) 10*log10((phase<90)*pa*ua/2*cos(phase*pi/180)/1e-12)]",
  examples: [
    example(
      "例题　相位差对声强测量的影响",
      "双传感器在风道中测得声压峰值 1 Pa、振速峰值 0.002 m/s，两者相位差 30°。计算净声强与声强级，判断能量传递方向。",
      p,
      [params.pa, ua, { ...phase, max: 89 }],
      [
        ask(
          "intensity",
          "(1) 平均声强",
          "W/m²",
          String.raw`I=p_au_a\cos\varphi/2`,
          "pa*ua*cos(phase*pi/180)/2",
          (p) => meanIntensity(p.pa, p.ua, (p.phase * Math.PI) / 180),
          (p) => `${p.pa} Pa × ${p.ua} m/s × cos(${p.phase}°) ÷ 2`,
        ),
        ask(
          "level",
          "(2) 声强级",
          "dB",
          String.raw`SIL=10\lg(I/10^{-12})`,
          "10*log10(intensity/1e-12)",
          (p) => powerLevel(meanIntensity(p.pa, p.ua, (p.phase * Math.PI) / 180)),
          (p) => `10 lg(${meanIntensity(p.pa, p.ua, (p.phase * Math.PI) / 180)} W/m² ÷ 10⁻¹² W/m²)`,
        ),
      ],
      () => "必须测出相位才能确定有功声强，不能仅相乘两个幅值。",
      (p) =>
        answerCurve(
          p,
          "pa",
          "声压峰值",
          "Pa",
          (q) => meanIntensity(q.pa, q.ua, (q.phase * Math.PI) / 180),
          "x*ua*cos(phase*pi/180)/2",
        ),
    ),
  ],
  answers: [
    "先取声压和振速的实际瞬时值，再作乘积得到有向瞬时能流密度。",
    "声强是声能流密度的时间平均，谐和场通常在一个周期上平均。",
    "正声强与参考声强之比的十倍常用对数，单位为分贝，并注明参考值。",
  ],
  engineering: engineering(
    "声强探头利用声压与振速的相位信息区分净传能和反应性声场，舱室或风道中的高声压不一定意味着大净声功率。",
  ),
});
