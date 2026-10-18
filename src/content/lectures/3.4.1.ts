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
const B = parameter("B", "反向波声压峰值", "B", "Pa", 0, 10, 0.01);
const p = { ...defaults, B: 0.4 };
export default p2Lecture("3.4.1", {
  defaults: p,
  parameters: [params.pa, B, params.f, params.rho, params.c],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "平面波的波阵面是平面，声学量只沿法向坐标变化；谐和场具有单一角频率。",
    "一维亥姆霍兹方程有正向和反向两个独立解，边界条件确定两者的系数。",
    "采用统一时间因子时，正向波的空间因子与时间因子反号；无限远的辐射条件排除从无穷远入射的反向波。",
  ],
  formulas: [
    {
      number: "3.4.1-1",
      tex: String.raw`P''+k^2P=0,\quad p(x,t)=\Re\{[Ae^{-jkx}+Be^{jkx}]e^{j\omega t}\}`,
      meaning: "图中两列波的系数为实数峰值，初始相位取零。",
    },
    {
      number: "3.4.1-2",
      tex: String.raw`p_+=A\cos(\omega t-kx),\quad p_-=B\cos(\omega t+kx),\quad u=(p_+-p_-)/(\rho_0c_0)`,
      meaning: "反向波振速的符号改变，不能把合成声压直接除以特性阻抗求合成振速。",
    },
  ],
  figures: [
    figure("3.4.1-1", "正向波、反向波及其合成", (p, t) => [
      graph(
        p,
        t,
        "B = 0 为纯正向行波；A = B 为驻波",
        "位置 x (m)",
        "声压 p (Pa)",
        [0, 2],
        [-1.7 * (p.pa + p.B), 1.7 * (p.pa + p.B)],
        [
          curve(
            "正向波 A",
            (r) => p.pa * Math.cos(2 * Math.PI * (p.f * t - (p.f * r) / p.c)),
            [0, 2],
            "linspace(0,2,401)",
            "pa*cos(tau-k*x)",
            "--",
          ),
          curve(
            "反向波 B",
            (r) => p.B * Math.cos(2 * Math.PI * (p.f * t + (p.f * r) / p.c)),
            [0, 2],
            "linspace(0,2,401)",
            "B*cos(tau+k*x)",
            ":",
          ),
          curve(
            "合成声压",
            (r) =>
              p.pa * Math.cos(2 * Math.PI * (p.f * t - (p.f * r) / p.c)) +
              p.B * Math.cos(2 * Math.PI * (p.f * t + (p.f * r) / p.c)),
            [0, 2],
            "linspace(0,2,401)",
            "pa*cos(tau-k*x)+B*cos(tau+k*x)",
          ),
        ],
        "",
        {},
        { ylim: "[-1.7 1.7]*(pa+B)", legendLocation: "northeastoutside" },
      ),
    ]),
    figure("3.4.1-2", "Particle velocity", (p, t) => [
      graph(
        p,
        t,
        "Velocity uses the difference of pressure components",
        "Position x (m)",
        "Velocity (m/s)",
        [0, 2],
        [-2.2, 2.2],
        [
          curve(
            "Particle velocity",
            (x) =>
              (p.pa * Math.cos(2 * Math.PI * p.f * (t - x / p.c)) -
                p.B * Math.cos(2 * Math.PI * p.f * (t + x / p.c))) /
              (p.rho * p.c),
            [0, 2],
            "linspace(0,2,401)",
            "(pa*cos(tau-k*x)-B*cos(tau+k*x))/Z",
          ),
        ],
      ),
    ]),
  ],
  readouts: (p) => [
    ["正向波声强", p.pa ** 2 / (2 * p.rho * p.c), "W/m²"],
    ["反向波声强（有向）", -(p.B ** 2) / (2 * p.rho * p.c), "W/m²"],
    ["合成净声强", (p.pa ** 2 - p.B ** 2) / (2 * p.rho * p.c), "W/m²"],
  ],
  readoutModel: "[pa^2/(2*Z) -B^2/(2*Z) (pa^2-B^2)/(2*Z)]",
  examples: [
    example(
      "例题　风道中的双向波分量",
      "风道中正向平面波声压峰值为 1 Pa、反向波为 0.4 Pa，空气特性参数为 1.21 kg/m³ 和 343 m/s。求声压最大包络及净声强。",
      p,
      [params.pa, B, params.rho, params.c],
      [
        ask(
          "envelope",
          "(1) 最大声压包络",
          "Pa",
          String.raw`p_{\max}=A+B`,
          "pa+B",
          (p) => p.pa + p.B,
          (p) => `${p.pa} Pa + ${p.B} Pa`,
        ),
        ask(
          "netIntensity",
          "(2) 有向净声强",
          "W/m²",
          String.raw`I=(A^2-B^2)/(2\rho_0c_0)`,
          "(pa^2-B^2)/(2*rho*c)",
          (p) => (p.pa ** 2 - p.B ** 2) / (2 * p.rho * p.c),
          (p) => `(${p.pa}²−${p.B}²) Pa² ÷ (2 × ${p.rho} kg/m³ × ${p.c} m/s)`,
        ),
      ],
      () => "净能量由两列行波声强之差决定，驻波起伏不能单独表示净传能。",
      (p) =>
        answerCurve(
          p,
          "pa",
          "正向波峰值 A",
          "Pa",
          (q) => (q.pa ** 2 - q.B ** 2) / (2 * q.rho * q.c),
          "(x.^2-B^2)/(2*rho*c)",
        ),
    ),
  ],
  answers: [
    "同一时刻处于相同相位的点构成的面。",
    "等相位面为平面，场量只沿平面的法向坐标变化。",
    "无限大均匀振动平面可理想化产生平面波；实际可在大孔径远场局部或低于截止频率的管道中近似实现。",
  ],
  engineering: engineering(
    "风道阻抗测量需要分离正向和反向波，才可把高声压的驻波与实际传输声功率区别开。",
    "duct",
    "通风管道模态与反射",
  ),
});
