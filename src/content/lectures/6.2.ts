import { completeExamples } from "../calculationSteps";
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
import * as phy from "../../physics/chapter4";
const xB = { ...parameter("xB", "接收点横坐标", "x_B", "m", 1, 5, 0.1), geometry: true },
  yB = { ...parameter("yB", "接收点纵坐标", "y_B", "m", 0.5, 3, 0.1), geometry: true },
  f = parameter("f", "频率", "f", "Hz", 1000, 10000, 100),
  Q = parameter("Q", "体积速度峰值", "Q", "m³/s", 1e-6, 3e-5, 1e-6);
const p = { ...water, xB: 3, yB: 2, Q: 1e-5 },
  setup =
    "distance=hypot(xB,yB);Pab=p4Point(distance,Q,f,rho,c);Pba=p4Point(hypot(-xB,-yB),Q,f,rho,c);";
const asks = [
  ask(
    "distance",
    "(1) 收发间距",
    "m",
    "r_{AB}=\\sqrt{(x_B-x_A)^2+(y_B-y_A)^2}",
    "hypot(xB,yB)",
    (p) => Math.hypot(p.xB, p.yB),
    substitution,
  ),
  ask(
    "pressure",
    "(2) 交换前后声压峰值",
    "Pa",
    "|P_B|=|P_A|=\\frac{\\rho_0 f Q}{2r_{AB}},\\quad Q_A=Q_B=Q",
    "abs(Pab)",
    (p) => phy.magnitude(phy.monopole(p.Q, p.f, p.rho, p.c, Math.hypot(p.xB, p.yB))),
    substitution,
  ),
];
const completedLecture = makeLecture("6.2", {
  defaults: { ...p, f: 10000 },
  parameters: [xB, yB, f, Q],
  keyPoints: [
    "线性、静止、互易介质中，两组声源的互输入功率相等，交换收发位置后传递函数保持不变。",
    "比较声压数值时须保持两次体积速度相同；一般互易关系比较的是接收声压与发射体积速度之比。",
    "同一互易换能器的接收方向函数与发射方向函数相同，收发灵敏度仍需按各自定义区分。",
    "默认 10 kHz、孔径半径 0.05 m，对应 ka≈2.09，可清楚比较收发曲线重合及偏轴衰减。",
  ],
  formulas: [
    {
      number: "6.2-1",
      tex: "\\int_S(P_1U_{n2}-P_2U_{n1})\\,\\mathrm dS=0,\\quad P_BQ_A=P_AQ_B",
      meaning: "互易关系来自两组解的格林恒等式，成立条件包括介质和边界的互易性。",
    },
    {
      number: "6.2-2",
      tex: "G_{AB}=G_{BA},\\quad D_{\\text{接收}}(\\theta)=D_{\\text{发射}}(\\theta)",
      meaning: "方向函数相等采用相同的角度与归一化参考；它不要求接收、发射的有量纲灵敏度数值相同。",
    },
  ],
  figures: [
    figure(
      "6.2-1",
      "两个点源交换收发位置的声压比较",
      (p) => {
        const q = phy.monopole(p.Q, p.f, p.rho, p.c, Math.hypot(p.xB, p.yB));
        return [
          graph(
            p,
            0,
            "均匀水域中交换两个位置的发射与接收",
            "位置 x (m)",
            "示意坐标 y (m)",
            [0, 6],
            [0, 4],
            [
              points(
                "传播路径 A—B",
                [
                  [0, 0],
                  [p.xB, p.yB],
                ],
                "[0 xB]",
                "[0 yB]",
              ),
              points(
                "横向间距",
                [
                  [0, 0],
                  [p.xB, 0],
                ],
                "[0 xB]",
                "[0 0]",
                { geometry: { key: "xB", axis: "x" }, style: "--" },
              ),
              points(
                "纵向间距",
                [
                  [p.xB, 0],
                  [p.xB, p.yB],
                ],
                "[xB xB]",
                "[0 yB]",
                { geometry: { key: "yB", axis: "y" }, style: "--" },
              ),
              points(
                "两次收发位置",
                [
                  [0, 0],
                  [p.xB, p.yB],
                ],
                "[0 xB]",
                "[0 yB]",
                { marker: "o", style: "none" },
              ),
            ],
            setup,
            { equalAspect: true },
          ),
          graph(
            p,
            0,
            "相同体积速度：交换前后接收声压完全重合",
            "时间 t (s)",
            "接收声压 (Pa)",
            [0, 0.004],
            [-1, 1],
            [
              curve(
                "A 发 B 收",
                (t) =>
                  q.re * Math.cos(2 * Math.PI * p.f * t) - q.im * Math.sin(2 * Math.PI * p.f * t),
                [0, 0.004],
                "linspace(0,.004,1601)",
                "real(Pab*exp(1i*w*x))",
                "-",
                1601,
              ),
              curve(
                "B 发 A 收",
                (t) =>
                  q.re * Math.cos(2 * Math.PI * p.f * t) - q.im * Math.sin(2 * Math.PI * p.f * t),
                [0, 0.004],
                "linspace(0,.004,1601)",
                "real(Pba*exp(1i*w*x))",
                "--",
                1601,
              ),
            ],
            setup,
          ),
        ];
      },
      2,
      1,
    ),
    figure("6.2-2", "同一活塞的发射与接收方向函数重合", (p) => [
      graph(
        p,
        0,
        "互易活塞的收发方向函数",
        "偏轴角 θ (°)",
        "方向函数幅值",
        [-90, 90],
        [-0.2, 1],
        [
          curve(
            "发射",
            (th) => phy.pistonD(phy.kWave(p.f, p.c) * p.a * Math.sin((th * Math.PI) / 180)),
            [-90, 90],
            "linspace(-90,90,401)",
            "p4PistonD(k*a*sind(x))",
          ),
          curve(
            "接收",
            (th) => phy.pistonD(phy.kWave(p.f, p.c) * p.a * Math.sin((th * Math.PI) / 180)),
            [-90, 90],
            "linspace(-90,90,401)",
            "p4PistonD(k*a*sind(x))",
            "--",
          ),
        ],
        setup,
      ),
    ]),
  ],
  answers: [
    "两组声场的互输入功率相等；相同体积速度源交换发射、接收位置，接收声压不变。",
    "对同一互易换能器，采用相同方向与归一化约定时二者相同。",
    "归一化辐射方向函数与接收方向函数相等。",
  ],
  exampleTitle: "例题　水池中交换收发位置的互易校验",
  background:
    "两个换能器位置为 A=(0,0) m、B=(3,2) m，在水中使用相同的 1 kHz、$10^{-5}\\ \\mathrm{m^3/s}$ 体积速度源。求两点间距与两次接收声压峰值，作为互易校准的理想基准。",
  exampleDefaults: p,
  given: [xB, yB, f, Q],
  asks,
  judgment: "理想传递函数对交换位置对称；实际互易校准仍需保证源强、方向、环境与电学负载条件一致。",
  examplePlot: (p) => {
    const q = phy.monopole(p.Q, p.f, p.rho, p.c, Math.hypot(p.xB, p.yB)),
      rr = Array.from({ length: 801 }, (_, i) => 0.5 + (9.5 * i) / 800);
    return answer(
      graph(
        p,
        0,
        "自由场复传递的距离轨迹与同一个互易接收向量",
        "接收声压实部 (Pa)",
        "接收声压虚部 (Pa)",
        [-p.rho * p.f * p.Q, p.rho * p.f * p.Q],
        [-p.rho * p.f * p.Q, p.rho * p.f * p.Q],
        [
          points(
            "距离从 0.5 m 到 10 m 的复声压轨迹",
            rr.map((r) => {
              const q = phy.monopole(p.Q, p.f, p.rho, p.c, r);
              return [q.re, q.im];
            }),
            "real(p4Point(rr,Q,f,rho,c))",
            "imag(p4Point(rr,Q,f,rho,c))",
          ),
          points(
            "两次交换共用的声压向量",
            [
              [0, 0],
              [q.re, q.im],
            ],
            "[0 real(Pab)]",
            "[0 imag(Pab)]",
          ),
          points("A 发 B 收", [[q.re, q.im]], "real(Pab)", "imag(Pab)", {
            marker: "o",
            style: "none",
          }),
          points("B 发 A 收", [[q.re, q.im]], "real(Pba)", "imag(Pba)", {
            marker: "s",
            style: "none",
          }),
        ],
        setup + "rr=linspace(.5,10,801);",
        { equalAspect: true },
      ),
      "pressure",
    );
  },
  engineering: engineering(
    "互易校准用收发交换建立灵敏度之间的约束，是水听器校准的重要方法。流动介质或非互易器件可能破坏这些条件。",
    "receiver",
    "水下监听接收器选型",
  ),
});

export default completeExamples(completedLecture);
