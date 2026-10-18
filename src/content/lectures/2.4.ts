import { completeExamples } from "../calculationSteps";
import { lecture, parameter, fmt } from "../p1";
import { rodSpeed, rodFrequency, youngFromFrequency } from "../../physics/chapter2";
import { panel, line, extent, working, endSeries } from "../../plot/p1Helpers";
import { sample } from "../../plot/types";
const E = parameter("E", "杨氏模量", "E", "GPa", 1, 250, 1),
  rho = parameter("rho", "体密度", "ρ", "kg/m³", 1000, 10000, 10),
  L = parameter("L", "棒长", "L", "m", 0.2, 2, 0.01),
  S = parameter("S", "截面积", "S", "m²", 0.00001, 0.001, 0.00001),
  force = parameter("F0", "端点激励力幅值", "F₀", "N", 1, 100, 1),
  measured = parameter("measured", "实测自由棒基频", "f₁", "Hz", 500, 10000, 10);
const defaults = { E: 200, rho: 7850, L: 1, S: 0.0001, F0: 10, measured: 2500 };
const completedLecture = lecture(
  "2.4",
  [
    "撤去持续激励后，初始扰动激发各简正振型。两端自由细棒的非零固有频率 $f_n = nc/(2L)$，位移振型为 $\\cos(n\\pi z/L)$；$n=0$ 是刚体平移而非振动基频。",
    "持续谐和力驱动的响应以外力频率变化。左端固定、右端力激励时共振频率为 $(2n-1)c/(4L)$，与两端自由序列不同；理想无阻尼共振点不存在有限稳态幅值。",
  ],
  {
    defaults,
    parameters: [E, rho, L, S, force],
    animation: true,
    animationPeriod: (p) => (2 * p.L) / rodSpeed(p.E * 1e9, p.rho),
    keyPoints: [
      "两端自由细棒的端面应力为零，位移振型为余弦分布。",
      "非零自由振动频率为整数倍 $c/(2L)$，另有 $n=0$ 刚体平移解。",
      "细棒的稳态振动与持续谐和外力同频；左端固定、右端谐和力激励的共振序列为奇数倍 $c/(4L)$。",
      "由两端自由棒的实测基频可求波速和杨氏模量；边界条件必须与计算公式一致。",
    ],
    formulas: [
      {
        number: "2.4-1",
        tex: String.raw`\zeta_n(z,t)=A_n\cos(n\pi z/L)\cos\omega_nt,\quad f_n=\frac{nc}{2L},\quad n=1,2,\ldots`,
        meaning:
          "两端自由要求 $\\partial_z\\zeta(0,t) = \\partial_z\\zeta(L,t) = 0$；圆点标自由端、叉号标位移波节。",
      },
      {
        number: "2.4-2",
        tex: String.raw`\zeta(z,t)=\frac{F_0\sin kz}{ESk\cos kL}\cos\omega t,\quad f_n^{\rm force}=\frac{(2n-1)c}{4L}`,
        meaning: "本式适用于左端固定、右端力激励；无阻尼极点处断线并向图框外发散。",
      },
      {
        number: "2.4-3",
        tex: String.raw`c=2Lf_1,\quad E=\rho c^2=4\rho L^2 f_1^2`,
        meaning: "下方测量计算器采用两端自由的实测第一非零固有频率，不能代入固定—自由的基频。",
      },
    ],
    figures: [
      {
        number: "2.4-1",
        independentOf: ["S", "F0"],
        dimensionlessComparison: "单位幅值的振型比较：自由模态与截面积、激励力无关。",
        title: "两端自由细棒前三阶位移振型",
        rows: 3,
        cols: 1,
        plot: (p, t) => {
          const c = rodSpeed(p.E * 1e9, p.rho);
          return [1, 2, 3].map((n) => {
            const phase = Math.cos(((n * Math.PI * c) / p.L) * t);
            return {
              ...panel(
                `自由—自由第 ${n} 阶：${fmt(rodFrequency(n, c, p.L, "free-free"))} Hz`,
                "轴向位置 z (m)",
                "归一化纵向位移 (—)",
                [0, 2],
                [-1.5, 1.5],
                [
                  {
                    name: "位移振型",
                    geometry: { key: "L", axis: "x" },
                    points: sample((r) => Math.cos((n * Math.PI * r) / p.L) * phase, 0, p.L),
                  },
                  {
                    name: "自由端",
                    points: [
                      [0, phase],
                      [p.L, Math.cos(n * Math.PI) * phase],
                    ],
                    style: "none",
                    marker: "o",
                  },
                  {
                    name: "位移波节",
                    points: Array.from(
                      { length: n },
                      (_, j) => [(p.L * (2 * j + 1)) / (2 * n), 0] as [number, number],
                    ),
                    style: "none",
                    marker: "x",
                  },
                ],
              ),
              legend: false,
            };
          });
        },
      },
      {
        number: "2.4-2",
        title: "固定—力激励棒的端点位移幅频",
        rows: 1,
        cols: 1,
        plot: (p) => {
          const c = rodSpeed(p.E * 1e9, p.rho),
            end = 120000,
            A = (p.F0 * p.L) / (p.E * 1e9 * p.S);
          return [
            {
              ...panel(
                "固定端—力激励：无阻尼端点位移",
                "频率 f (Hz)",
                "端点位移幅值 (m)",
                [0, end],
                [0, 4 * A],
                [endSeries(p.F0, p.L, p.E * 1e9 * p.S, c, end)],
              ),
              legend: false,
              unboundedY: true,
              responseNote: "共振发散；显示四倍静位移，超出部分省略。",
              annotations: [1, 2, 3].map((n) => ({
                axis: "x" as const,
                value: rodFrequency(n, c, p.L, "fixed-free"),
                label: `f${n} = ${fmt(rodFrequency(n, c, p.L, "fixed-free"))} Hz`,
              })),
            },
          ];
        },
      },
    ],
    readouts: (p) => {
      const c = rodSpeed(p.E * 1e9, p.rho);
      return [
        ["纵波速度", c, "m/s"],
        ["自由—自由基频", rodFrequency(1, c, p.L, "free-free"), "Hz"],
        ["固定—自由基频", rodFrequency(1, c, p.L, "fixed-free"), "Hz"],
        ["第一自由振型位移节点", p.L / 2, "m"],
      ];
    },
    examples: [
      {
        title: "例题与测量计算器　共振法测杨氏模量",
        background:
          "一根长 1 m、密度 7850 kg/m³ 的细棒在近似两端自由条件下，测得第一非零固有频率为 2500 Hz。分步计算纵波速度与杨氏模量，作为材料弹性参数的实验估计。",
        defaults,
        given: [measured, L, rho],
        asks: [
          {
            key: "measuredSpeed",
            text: "(1) 由基频求波速",
            unit: "m/s",
            tex: String.raw`c=2Lf_1`,
            matlab: "2*L*measured",
            calc: (p) => youngFromFrequency(p.measured, p.L, p.rho).c,
            sub: (p) => `2 × ${p.L} m × ${p.measured} Hz`,
          },
          {
            key: "modulus",
            text: "(2) 杨氏模量",
            unit: "GPa",
            tex: String.raw`E=\rho(2Lf_1)^2`,
            matlab: "rho*measuredSpeed^2/1e9",
            calc: (p) => youngFromFrequency(p.measured, p.L, p.rho).E / 1e9,
            sub: (p) => `${p.rho} kg/m³ × (2×${p.L} m × ${p.measured} Hz)² / 10⁹`,
          },
        ],
        hints: [
          "先确认实测模式是两端自由的第一非零纵振动模态。",
          "该模式半个波长等于棒长，故 $c = 2Lf_1$；再用 $E = \\rho c^2$。",
        ],
        judgment: (p) =>
          `反算 E ≈ ${fmt(youngFromFrequency(p.measured, p.L, p.rho).E / 1e9)} GPa。须核对悬挂边界与纵向模态识别；误将弯曲模态或固定端模态代入会产生系统误差。`,
        plot: (p) => {
          const end = extent(p.measured * 1.5),
            max = youngFromFrequency(end, p.L, p.rho).E / 1e9;
          return working(
            panel(
              "两端自由：由基频反算杨氏模量",
              "实测第一非零基频 f₁ (Hz)",
              "杨氏模量 E (GPa)",
              [0, end],
              [0, max * 1.6],
              [line("E = 4ρL²f₁²", (f) => youngFromFrequency(f, p.L, p.rho).E / 1e9, end)],
            ),
            p.measured,
            youngFromFrequency(p.measured, p.L, p.rho).E / 1e9,
          );
        },
      },
    ],
    engineering: {
      text: "共振法可用频率测量估计细棒弹性参数。应采用尽量自由的悬挂方式，确认测到纵向模态，并评估棒长、密度和频率误差；由于 E 与 $f^2$、$L^2$ 成正比，尺寸误差同样重要。",
      href: "#/cases?project=ultrasound",
      title: "超声无损检测",
    },
  },
);

export default completeExamples(completedLecture);
