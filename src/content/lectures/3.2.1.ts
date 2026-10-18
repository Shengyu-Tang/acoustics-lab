import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  curve,
  points,
  example,
  ask,
  answerCurve,
  engineering,
} from "../p2";
const p = { ...defaults, step: 0, boundary: 0, L: 2 };
const L = parameter("L", "传感器间距", "L", "m", 0.1, 10, 0.1);
const coordinates = [
  String.raw`\nabla^2=\partial_x^2+\partial_y^2+\partial_z^2`,
  String.raw`\nabla^2=\frac1{r^2}\partial_r(r^2\partial_r)+\frac1{r^2\sin\theta}\partial_\theta(\sin\theta\partial_\theta)+\frac1{r^2\sin^2\theta}\partial_\varphi^2`,
  String.raw`\nabla^2=\frac1r\partial_r(r\partial_r)+\frac1{r^2}\partial_\varphi^2+\partial_z^2`,
];
export default p2Lecture("3.2.1", {
  defaults: p,
  parameters: [params.pa, params.f, params.c],
  boundaryEquations: coordinates,
  interactive: {
    selectors: [{ key: "boundary", label: "坐标系", options: ["直角坐标", "球坐标", "柱坐标"] }],
    steps: [
      {
        tex: String.raw`\partial_t\rho'=-\rho_0\nabla\cdot\mathbf u`,
        text: "从连续性方程开始，对时间再求一次导数。",
      },
      {
        tex: String.raw`\partial_t^2\rho'=-\rho_0\nabla\cdot\underbrace{\partial_t\mathbf u}_{-\nabla p/\rho_0}=\nabla^2p`,
        text: "用运动方程替换速度的时间导数，静态密度相消。",
      },
      {
        tex: String.raw`\rho'=\underbrace{p/c_0^2}_{\text{状态方程}}\ \Longrightarrow\ \nabla^2p-c_0^{-2}\partial_t^2p=0`,
        text: "用状态方程替换密度逾量，完成声压消元。",
      },
    ],
  },
  keyPoints: [
    "波动方程描述声场的空间、时间变化规律及二者之间的联系。",
    "对连续性方程作时间微分，以运动方程消去振速，再以状态方程消去密度逾量，得到声压波动方程。",
    "拉普拉斯算符的坐标表达式随直角、球、柱坐标系改变，物理方程保持一致；须同时给出初始条件与边界条件。",
  ],
  formulas: [
    {
      number: "3.2.1-1",
      tex: String.raw`\nabla^2p-\frac1{c_0^2}\frac{\partial^2p}{\partial t^2}=0`,
      meaning: "理想、均匀、静止流体中小振幅声压满足该方程。",
    },
    ...coordinates.map((tex, i) => ({
      number: `3.2.1-${i + 2}`,
      tex,
      meaning: [
        "直角坐标适合平面与矩形边界。",
        "球坐标适合球面扩展；极点处按正则解取极限。",
        "柱坐标适合轴对称或圆柱形边界。",
      ][i],
    })),
  ],
  figures: [
    figure("3.2.1-1", "三方程消元：声压波动方程两侧", (p) => {
      const a = ((2 * Math.PI * p.f) / p.c) ** 2 * p.pa;
      return [
        graph(
          p,
          0,
          "点击上方“下一步”查看每次替换",
          "位置 x (m)",
          "波动方程两侧 (Pa/m²)",
          [0, 2],
          [-1.6 * a, 1.6 * a],
          [
            curve(
              "∇²p",
              (x) => -a * Math.cos((2 * Math.PI * p.f * x) / p.c),
              [0, 2],
              "linspace(0,2,401)",
              "-k^2*pa*cos(k*x)",
            ),
            curve(
              "(1/c₀²) ∂²p/∂t²",
              (x) => -a * Math.cos((2 * Math.PI * p.f * x) / p.c),
              [0, 2],
              "linspace(0,2,401)",
              "-w^2/c^2*pa*cos(k*x)",
              "--",
            ),
          ],
          "",
          {},
          { ylim: "[-1.6 1.6]*k^2*pa" },
        ),
      ];
    }),
    figure("3.2.1-2", "坐标系几何与拉普拉斯算符", (p) => {
      const circle = Array.from({ length: 81 }, (_, i) => {
        const a = (i * Math.PI * 2) / 80;
        return [Math.cos(a), Math.sin(a)] as [number, number];
      });
      const cart = [
        [-1, 0],
        [1, 0],
        [0, 0],
        [0, 1],
        [0, 0],
        [-0.5, -0.5],
      ] as [number, number][];
      const data =
        p.boundary === 0
          ? cart
          : p.boundary === 1
            ? circle
            : circle.map(([x, y]) => [x, 0.65 + 0.25 * y] as [number, number]);
      const secondary =
        p.boundary === 0
          ? ([
              [0, 0],
              [0.7, 0.7],
            ] as [number, number][])
          : p.boundary === 1
            ? circle.map(([x, y]) => [0.35 * x, y] as [number, number])
            : circle.map(([x, y]) => [x, -0.65 + 0.25 * y] as [number, number]);
      const tertiary =
        p.boundary === 0
          ? ([
              [0, -1],
              [0, 1],
            ] as [number, number][])
          : p.boundary === 1
            ? circle.map(([x, y]) => [x, 0.35 * y] as [number, number])
            : ([
                [-1, -0.65],
                [-1, 0.65],
                [1, 0.65],
                [1, -0.65],
              ] as [number, number][]);
      return [
        graph(
          p,
          0,
          ["直角坐标 x、y、z", "球坐标 r、θ、φ", "柱坐标 r、φ、z"][p.boundary],
          "水平投影（示意）",
          "垂直投影（示意）",
          [-1.5, 1.5],
          [-1.5, 1.5],
          [
            points("坐标参考", data, "gx", "gy"),
            points("子午面 / 底圆", secondary, "sx", "sy"),
            points("赤道 / 轴向参考", tertiary, "tx", "ty", { style: "--" }),
          ],
          "a=linspace(0,2*pi,81);if boundary==0,gx=[-1 1 0 0 0 -.5];gy=[0 0 0 1 0 -.5];sx=[0 .7];sy=[0 .7];tx=[0 0];ty=[-1 1];elseif boundary==1,gx=cos(a);gy=sin(a);sx=.35*cos(a);sy=sin(a);tx=cos(a);ty=.35*sin(a);else,gx=cos(a);gy=.65+.25*sin(a);sx=cos(a);sy=-.65+.25*sin(a);tx=[-1 -1 1 1];ty=[-.65 .65 .65 -.65];end;",
          {
            legend: false,
            textLabels: [
              { x: 0.8, y: 0.8, text: p.boundary === 0 ? "位置矢量" : "r" },
              { x: 0.1, y: 1.1, text: p.boundary === 2 ? "z" : "轴" },
            ],
          },
          { title: "sprintf('坐标系（0=直角，1=球，2=柱）：%d',boundary)" },
        ),
      ];
    }),
  ],
  readouts: (p) => [
    ["波数", (2 * Math.PI * p.f) / p.c, "rad/m"],
    ["波长", p.c / p.f, "m"],
  ],
  readoutModel: "[k c/f]",
  examples: [
    example(
      "例题　阵列相邻测点的相位差",
      "一维阵列在空气中接收 1000 Hz 平面波，两个传感器沿传播方向相隔 0.05 m。计算波数与相位落后，检查空间采样间距。",
      { ...p, L: 0.05 },
      [params.f, params.c, { ...L, min: 0.001, step: 0.001 }],
      [
        ask(
          "waveNumber",
          "(1) 波数",
          "rad/m",
          String.raw`k=2\pi f/c_0`,
          "2*pi*f/c",
          (p) => (2 * Math.PI * p.f) / p.c,
          (p) => `2π × ${p.f} Hz ÷ ${p.c} m/s`,
        ),
        ask(
          "phaseLag",
          "(2) 相位落后",
          "rad",
          String.raw`\Delta\varphi=kL`,
          "waveNumber*L",
          (p) => (2 * Math.PI * p.f * p.L) / p.c,
          (p) => `${(2 * Math.PI * p.f) / p.c} rad/m × ${p.L} m`,
        ),
      ],
      (p) =>
        p.L < p.c / (2 * p.f)
          ? "间距小于半波长，沿此方向采样可避免单频空间混叠。"
          : "间距达到或超过半波长，应检查空间混叠。",
      (p) => answerCurve(p, "L", "传感器间距", "m", (q) => (2 * Math.PI * q.f * q.L) / q.c, "k*x"),
    ),
  ],
  answers: [
    "不相同。坐标曲线的尺度因子不同，球、柱坐标会出现半径和角度的度量因子。",
    "连续性方程对时间求导，以运动方程消去振速，再用状态方程把密度逾量写成声压，即得到声压波动方程。",
  ],
  engineering: engineering(
    "声阵列和风道仿真应根据几何选择坐标系；选择坐标并不会消除对正确初始与边界条件的需要。",
    "duct",
    "通风管道模态与反射",
  ),
});
