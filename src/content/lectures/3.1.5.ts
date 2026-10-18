import {
  p2Lecture,
  defaults,
  params,
  figure,
  graph,
  curve,
  example,
  ask,
  answerCurve,
  engineering,
} from "../p2";
const p = { ...defaults };
export default p2Lecture("3.1.5", {
  defaults: p,
  parameters: [params.pa, params.f, params.rho, params.c],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "连续性方程把密度逾量和质点振速联系起来，是三个基本声学方程之一。",
    "一般守恒式中质量流密度是密度乘速度，散度表示单位体积的净流出。",
    "均匀静止背景下，小振幅线性化略去密度逾量与振速的乘积，得到密度时间导数等于负的静态密度乘振速散度。",
  ],
  formulas: [
    {
      number: "3.1.5-1",
      tex: String.raw`\partial_t\rho+\nabla\!\cdot(\rho\mathbf U)=0,\quad\partial_t\rho'=-\rho_0\nabla\!\cdot\mathbf u`,
      meaning: "在没有声源质量注入的区域，连续性方程必须逐点成立。",
    },
    {
      number: "3.1.5-2",
      tex: String.raw`\frac{\max|\partial_x(\rho'u)|}{\max|\rho_0\partial_xu|}=\frac{p_a}{\rho_0c_0^2}`,
      meaning: "对同频平面行波比较两项各自的最大幅值，避免在保留项过零处求逐点比值。",
    },
  ],
  figures: [
    figure("3.1.5-1", "线性连续性方程两侧逐点重合", (p, t) => {
      const a = (p.pa * 2 * Math.PI * p.f) / p.c ** 2;
      return [
        graph(
          p,
          t,
          "密度变化率与负速度散度",
          "位置 x/λ（—）",
          "密度变化率 (kg/(m³·s))",
          [0, 2],
          [-1.6 * a, 1.6 * a],
          [
            curve(
              "∂ρ′/∂t",
              (r) => -a * Math.sin(2 * Math.PI * (p.f * t - r)),
              [0, 2],
              "linspace(0,2,401)",
              "-pa*w/c^2*sin(tau-2*pi*x)",
            ),
            curve(
              "−ρ₀ ∂u/∂x",
              (r) => -a * Math.sin(2 * Math.PI * (p.f * t - r)),
              [0, 2],
              "linspace(0,2,401)",
              "-rho*(pa/Z)*k*sin(tau-2*pi*x)",
              "--",
            ),
          ],
          "",
          {},
          { ylim: "[-1.6 1.6]*pa*w/c^2" },
        ),
      ];
    }),
    figure("3.1.5-2", "被略去的二阶项与一阶项的幅值比", (p) => [
      graph(
        p,
        0,
        "线性化误差指标：平面行波幅值比",
        "声压峰值 pₐ (Pa)",
        "二阶项 / 一阶项（—）",
        [0.001, 100000],
        [1e-12, 10],
        [
          curve(
            "幅值比",
            (x) => x / (p.rho * p.c ** 2),
            [0.001, 100000],
            "logspace(-3,5,401)",
            "x/(rho*c^2)",
          ),
        ].map((s) => ({
          ...s,
          points: Array.from({ length: 401 }, (_, i) => {
            const x = 10 ** (-3 + (8 * i) / 400);
            return [x, x / (p.rho * p.c ** 2)] as [number, number];
          }),
        })),
        "",
        { xscale: "log", yscale: "log" },
      ),
    ]),
  ],
  readouts: (p) => [
    ["一阶密度变化率幅值", (p.pa * 2 * Math.PI * p.f) / p.c ** 2, "kg/(m³·s)"],
    ["二阶项幅值比", p.pa / (p.rho * p.c ** 2), "—"],
  ],
  readoutModel: "[pa*w/c^2 pa/(rho*c^2)]",
  examples: [
    example(
      "例题　水声试验的线性化误差估计",
      "水中平面波声压峰值 100 Pa、频率 2 kHz，密度 1000 kg/m³，声速 1500 m/s。估计密度变化率幅值及二阶连续性项相对幅值。",
      { ...p, pa: 100, f: 2000, rho: 1000, c: 1500 },
      [params.pa, params.f, params.rho, params.c],
      [
        ask(
          "rate",
          "(1) 密度变化率幅值",
          "kg/(m³·s)",
          String.raw`|\partial_t\rho'|_a=\omega p_a/c_0^2`,
          "w*pa/c^2",
          (p) => (2 * Math.PI * p.f * p.pa) / p.c ** 2,
          (p) => `2π × ${p.f} Hz × ${p.pa} Pa ÷ (${p.c} m/s)²`,
        ),
        ask(
          "ratio",
          "(2) 二阶项相对幅值",
          "—",
          String.raw`\epsilon=p_a/(\rho_0c_0^2)`,
          "pa/(rho*c^2)",
          (p) => p.pa / (p.rho * p.c ** 2),
          (p) => `${p.pa} Pa ÷ (${p.rho} kg/m³ × (${p.c} m/s)²)`,
        ),
      ],
      () => "二阶项远小于一阶项，本地连续性关系可作线性近似。",
      (p) =>
        answerCurve(
          p,
          "pa",
          "声压峰值",
          "Pa",
          (q) => (2 * Math.PI * q.f * q.pa) / q.c ** 2,
          "w*x/c^2",
        ),
    ),
  ],
  answers: [
    "声压、密度和速度扰动相对背景量很小，因而扰动的乘积可略去；质点位移还应小于场量的变化尺度。",
    "梯度算符是矢量微分算符。",
    "作用于标量声压得到压力梯度矢量，决定压力力的方向。",
    "与速度矢量作点乘得到散度，表示局部净流出；作叉乘得到旋度，表示局部旋转。",
  ],
  engineering: engineering(
    "水声设备可有明显声压信号而压缩量仍极小；二阶项的幅值比可作为采用线性有限体积模型的初步依据。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
