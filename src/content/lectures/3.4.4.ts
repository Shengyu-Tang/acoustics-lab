import { completeExamples } from "../calculationSteps";
import { e344 } from "../../plot/p2Examples";
import {
  p2Lecture,
  defaults,
  params,
  figure,
  graph,
  curve,
  points,
  example,
  ask,
  engineering,
} from "../p2";
const p = { ...defaults };
const impedances = [1.21 * 343, 1.5e6, 1025 * 1500, 7850 * 5000, 1100 * 1600];
const completedLecture = p2Lecture("3.4.4", {
  defaults: p,
  parameters: [params.pa, params.rho, params.c, params.f],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "介质特性阻抗是静态密度和声速的乘积，是介质属性；波阻抗是特定声场声压与某方向振速的比值。",
    "正坐标方向的平面行波波阻抗等于特性阻抗，反向行波为其负值；一般叠加声场不具有这个简单关系。",
    "单向行波瞬时能流不反向，其方向与传播方向一致；平均声强在理想均匀行波场中处处相等。",
  ],
  formulas: [
    {
      number: "3.4.4-1",
      tex: String.raw`Z_a=P/U_x,\quad Z_0=\rho_0c_0,\quad Z_a^{(+)}=Z_0,\quad Z_a^{(-)}=-Z_0`,
      meaning:
        "对负向波，运动方程给出负的振速系数，所以反向波阻抗为负；这不代表介质具有负特性阻抗。",
    },
    {
      number: "3.4.4-2",
      tex: String.raw`W_+(x,t)=\frac{p_a^2}{Z_0}\cos^2(\omega t-kx)\ge0,\quad I=\frac{p_a^2}{2Z_0}`,
      meaning: "声强处处相等，瞬时能流随位置和时间变化，二者不能混同。",
    },
  ],
  figures: [
    figure("3.4.4-1", "常见介质的特性阻抗", (p) => [
      graph(
        p,
        0,
        "示例材料值；固体为纵波等效阻抗",
        "介质（—）",
        "特性阻抗 ρ₀c₀ (Pa·s/m)",
        [0.5, 5.5],
        [100, 1e8],
        [
          points(
            "ρ₀c₀",
            impedances.map((z, i) => [i + 1, z]),
            "1:5",
            "[1.21*343 1.5e6 1025*1500 7850*5000 1100*1600]",
            { kind: "bar" },
          ),
        ],
        "",
        {
          yscale: "linear",
          integerX: true,
          legend: false,
          xtickLabels: ["空气", "水", "海水", "钢", "橡胶"].map((label, i) => ({
            value: i + 1,
            label,
          })),
        },
      ),
    ]),
    figure(
      "3.4.4-2",
      "沿传播方向的声压、振速、能流和声强",
      (p, t) => [
        graph(
          p,
          t,
          "声压与振速同相",
          "位置 x (m)",
          "声压 p (Pa)",
          [0, 2],
          [-1.5 * p.pa, 1.5 * p.pa],
          [
            curve(
              "声压",
              (x) => p.pa * Math.cos(2 * Math.PI * (p.f * t - (p.f * x) / p.c)),
              [0, 2],
              "linspace(0,2,401)",
              "pa*cos(tau-k*x)",
            ),
            {
              ...curve(
                "振速（右轴）",
                (x) => (p.pa / (p.rho * p.c)) * Math.cos(2 * Math.PI * (p.f * t - (p.f * x) / p.c)),
                [0, 2],
                "linspace(0,2,401)",
                "pa/Z*cos(tau-k*x)",
                "--",
              ),
              axis: "right",
            },
          ],
          "",
          {
            rightLabel: "振速 u (m/s)",
            rightLim: [(-1.5 * p.pa) / (p.rho * p.c), (1.5 * p.pa) / (p.rho * p.c)],
          },
          { ylim: "[-1.5 1.5]*pa", rightLim: "[-1.5 1.5]*pa/Z" },
        ),
        graph(
          p,
          t,
          "W 非负；周期平均 I 与位置无关",
          "位置 x (m)",
          "能流与声强 (W/m²)",
          [0, 2],
          [0, (1.6 * p.pa ** 2) / (p.rho * p.c)],
          [
            curve(
              "瞬时能流 W",
              (x) =>
                (p.pa ** 2 / (p.rho * p.c)) *
                Math.cos(2 * Math.PI * (p.f * t - (p.f * x) / p.c)) ** 2,
              [0, 2],
              "linspace(0,2,401)",
              "pa^2/Z*cos(tau-k*x).^2",
            ),
            curve(
              "声强 I",
              () => p.pa ** 2 / (2 * p.rho * p.c),
              [0, 2],
              "linspace(0,2,401)",
              "pa^2/(2*Z)*ones(size(x))",
              "--",
            ),
          ],
          "",
          {},
          { ylim: "[0 1.6]*pa^2/Z" },
        ),
      ],
      2,
    ),
  ],
  readouts: (p) => [
    ["特性阻抗", p.rho * p.c, "Pa·s/m"],
    ["正向波阻抗", p.rho * p.c, "Pa·s/m"],
    ["负向波阻抗", -p.rho * p.c, "Pa·s/m"],
    ["正向平均声强", p.pa ** 2 / (2 * p.rho * p.c), "W/m²"],
  ],
  readoutModel: "[Z Z -Z pa^2/(2*Z)]",
  examples: [
    example(
      "例题　水中定幅行波的声强",
      "水中平面行波声压峰值为 100 Pa，密度 1000 kg/m³、声速 1500 m/s。计算介质特性阻抗与声强，用于估计单位面积可传输的声功率。",
      { ...p, pa: 100, rho: 1000, c: 1500 },
      [params.pa, params.rho, params.c],
      [
        ask(
          "impedance",
          "(1) 特性阻抗",
          "Pa·s/m",
          String.raw`Z_0=\rho_0c_0`,
          "rho*c",
          (p) => p.rho * p.c,
          (p) => `${p.rho} kg/m³ × ${p.c} m/s`,
        ),
        ask(
          "intensity",
          "(2) 声强",
          "W/m²",
          String.raw`I=p_a^2/(2Z_0)`,
          "pa^2/(2*impedance)",
          (p) => p.pa ** 2 / (2 * p.rho * p.c),
          (p) => `${p.pa}² Pa² ÷ (2 × ${p.rho * p.c} Pa·s/m)`,
        ),
      ],
      () => "该估算限于行波；有明显反射时需要先分离双向波或直接测声强。",
      (p) => e344(p),
    ),
  ],
  answers: [
    "介质静态密度与声速的乘积，单位 $\\mathrm{Pa\\cdot s/m}$。",
    "同一方向上复声压与复振速的比值，由介质和波场共同决定。",
    "符号不同。负向波取声压为负空间相位的反向解，运动方程使振速系数带负号，故波阻抗为负的特性阻抗。",
    "单向行波能流的方向总与波传播方向相同。",
    "用峰值声压平方除以两倍特性阻抗；用有效值则不再除以二。",
  ],
  engineering: engineering(
    "水听器输出的声压必须结合介质特性阻抗及行波条件才可转换为声强，固体材料比较还须明确所用波型。",
    "receiver",
    "水下监听接收器选型",
  ),
});

export default completeExamples(completedLecture);
