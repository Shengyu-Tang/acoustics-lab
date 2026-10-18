import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  curve,
  points,
  vector,
  example,
  ask,
  answerCurve,
  engineering,
} from "../p2";
const p = { ...defaults, mode: 0, L: 10, xi: 0.0004 };
const xi = parameter("xi", "质点位移峰值", "ξₐ", "m", 0.00001, 0.001, 0.00001),
  L = parameter("L", "测量距离", "L", "m", 1, 100, 1);
export default p2Lecture("3.1.1", {
  defaults: p,
  parameters: [params.f, params.c, xi],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  interactive: {
    selectors: [
      { key: "mode", label: "振动方向", options: ["纵波（流体体声波）", "横波（绳与固体示意）"] },
    ],
  },
  keyPoints: [
    "声具有听觉感受与物理波动两种含义；声波的实质是介质中的机械波。",
    "产生和传播声波需要声源以及传声介质，真空不能传声。",
    "扰动和能量向前传播，质点在平衡位置附近振动，不随波迁移；纵波振动方向平行传播方向，横波与之垂直。",
    "可听声通常约为 20 Hz 至 20 kHz；其外分别称次声和超声，物理本质相同。",
  ],
  formulas: [
    {
      number: "3.1.1-1",
      tex: String.raw`\xi(x,t)=\xi_a\cos(\omega t-kx),\quad k=\omega/c_0`,
      meaning: "质点位移是局部往复运动。动画将位移放大，蓝色高亮点保持原来的平衡位置。",
    },
  ],
  figures: [
    figure(
      "3.1.1-1",
      "纵波与横波中的质点运动",
      (p, t) => {
        const q = Array.from({ length: 31 }, (_, i) => i / 10),
          d = (r: number) => 0.065 * Math.cos(2 * Math.PI * p.f * t - 2 * Math.PI * r);
        return [
          graph(
            p,
            t,
            "质点位移放大；波向右传播",
            "平衡位置 x/λ（—）",
            "横向示意位置（—）",
            [-0.2, 3.2],
            [-0.4, 0.4],
            [
              points(
                "平衡位置",
                q.map((x) => [x, 0]),
                "0:.1:3",
                "zeros(size(x))",
                { style: "none", marker: "x", color: "#777777" },
              ),
              points(
                "运动质点",
                q.map((x) => [x + (p.mode === 0 ? d(x) : 0), p.mode === 1 ? d(x) : 0]),
                "(0:.1:3)+(mode==0)*.065*cos(tau-2*pi*(0:.1:3))",
                "(mode==1)*.065*cos(tau-2*pi*(0:.1:3))",
                { style: "none", marker: "o", color: "#777777" },
              ),
              points(
                "被观察质点",
                [[1.5 + (p.mode === 0 ? d(1.5) : 0), p.mode === 1 ? d(1.5) : 0]],
                "1.5+(mode==0)*.065*cos(tau-3*pi)",
                "(mode==1)*.065*cos(tau-3*pi)",
                { style: "none", marker: "o", color: "#0072BD" },
              ),
            ],
          ),
          graph(
            p,
            t,
            "同一质点的位移时间史",
            "时间 t/T（—）",
            "实际位移 ξ (m)",
            [0, 2],
            [-1.5 * p.xi, 1.5 * p.xi],
            [
              curve(
                "质点位移",
                (r) => p.xi * Math.cos(2 * Math.PI * r - 3 * Math.PI),
                [0, 2],
                "linspace(0,2,401)",
                "xi*cos(2*pi*x-3*pi)",
              ),
              points(
                "当前时刻",
                [[(p.f * t) % 2, p.xi * Math.cos(2 * Math.PI * p.f * t - 3 * Math.PI)]],
                "mod(f*tView,2)",
                "xi*cos(tau-3*pi)",
                { style: "none", marker: "o" },
              ),
            ],
            "",
            {},
            { ylim: "[-1.5 1.5]*xi" },
          ),
        ];
      },
      2,
    ),
  ],
  readouts: (p) => [
    ["波长", p.c / p.f, "m"],
    ["质点振速峰值", 2 * Math.PI * p.f * p.xi, "m/s"],
    ["传播 10 m 所需时间", 10 / p.c, "s"],
  ],
  readoutModel: "[c/f 2*pi*f*xi 10/c]",
  examples: [
    example(
      "例题　水声信号的传播时延",
      "水下两只传感器相距 10 m，声速取 1500 m/s。换能器发出 10 kHz 信号，估计传播时间与波长，为采集系统选择同步采样窗口。",
      { ...p, c: 1500, f: 10000 },
      [L, params.c, params.f],
      [
        ask(
          "delay",
          "(1) 传播时延",
          "ms",
          String.raw`t=L/c_0`,
          "1000*L/c",
          (p) => (1000 * p.L) / p.c,
          (p) => `${p.L} m ÷ ${p.c} m/s × 1000`,
        ),
        ask(
          "lambda",
          "(2) 波长",
          "m",
          String.raw`\lambda=c_0/f`,
          "c/f",
          (p) => p.c / p.f,
          (p) => `${p.c} m/s ÷ ${p.f} Hz`,
        ),
      ],
      (p) => `采样窗口应覆盖传播时间 ${((1000 * p.L) / p.c).toPrecision(4)} ms，并计入触发余量。`,
      (p) => answerCurve(p, "L", "距离 L", "m", (q) => (1000 * q.L) / q.c, "1000*x/c"),
    ),
  ],
  answers: [
    "横波，绳元位移垂直于传播方向。",
    "音乐通常具有较规则的周期与谐波结构；噪声常不规则。是否令人困扰还与环境和用途有关。",
    "真空没有可传递机械扰动的介质。",
    "理想流体不能维持静态剪切恢复力，体内只支持压缩纵波；水面波是界面波，另有重力或表面张力恢复力。",
    "在无风、小振幅且忽略漂移的近似下，木块主要在原处往复运动；声波中的质点也围绕平衡位置振动，扰动传远。",
  ],
  engineering: engineering(
    "水下测距使用扰动传播时间而非质点移动距离；必须区分声速、质点振速及换能器频率。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
