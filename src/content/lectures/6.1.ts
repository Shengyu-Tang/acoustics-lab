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
  log,
} from "../p4";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "脉冲基频", "f", "Hz", 200, 1200, 100),
  a = parameter("a", "接收器半径", "a", "m", 0.0005, 0.05, 0.0005);
const p = { ...water, f: 500, a: 0.05, criterion: 0.99 },
  setup = "gamma=1/(1+1i*k*a);amax=c/(2*pi*f)*sqrt(criterion^(-2)-1);";
const asks = [
  ask(
    "coefficient",
    "(1) 圆球压力系数模值",
    "—",
    "|\\gamma|=1/\\sqrt{1+(ka)^2}",
    "abs(gamma)",
    (p) => phy.magnitude(phy.sphereReceive(phy.kWave(p.f, p.c) * p.a)),
    substitution,
  ),
  ask(
    "maximumRadius",
    "(2) 一百分点幅值误差允许的最大半径",
    "m",
    "a_{\\max}=\\frac{c_0}{2\\pi f}\\sqrt{\\gamma_{\\min}^{-2}-1}",
    "amax",
    (p) => (p.c / (2 * Math.PI * p.f)) * Math.sqrt(p.criterion ** -2 - 1),
    substitution,
  ),
];
const exampleFrequency = parameter("f", "最高测量频率", "f", "Hz", 1000, 50000, 1000);
export default makeLecture("6.1", {
  defaults: p,
  parameters: [a, f],
  keyPoints: [
    "接收是辐射的逆过程：入射声压推动接收器振动，再由换能元件转为电信号。",
    "接收器引起散射，局部总声场与自由场不同；压力系数描述表面平均畸变压力与入射压力之比。",
    "压力系数随频率变化会改变接收振速信号，尺寸远小于波长有助于减轻这部分畸变。",
    "二次辐射阻抗随频率变化也会导致畸变，应使其模值远小于机械阻抗。",
    "机械阻抗本身的频率变化同样影响波形，应结合测量频带与振动系统设计控制。",
  ],
  formulas: [
    {
      number: "6.1-1",
      tex: "\\gamma=\\frac{S^{-1}\\int_SP_o\\,\\mathrm dS}{P_i},\\quad U=\\frac{\\gamma SP_i}{Z_m+Z_{2s}}",
      meaning: "表面压力的平均不能用任意单点的局部畸变压力代替。",
    },
    {
      number: "6.1-2",
      tex: "\\gamma_{\\text{球}}=\\frac1{1+jka},\\quad |\\gamma_{\\text{球}}|=\\frac1{\\sqrt{1+(ka)^2}}",
      meaning:
        "球面平均压力系数的幅值在低频趋于一；本页波形图隔离这一因素，假设机械阻抗平坦且二次辐射负载可忽略。",
    },
  ],
  figures: [
    figure(
      "6.1-1",
      "圆面活塞与圆球接收器的压力系数",
      (p) => [
        graph(
          p,
          0,
          "典型接收器平均压力系数的尺寸效应",
          "无量纲尺寸 ka",
          "压力系数模值",
          [0, 10],
          [0, 3],
          [
            curve(
              "圆球",
              (x) => phy.magnitude(phy.sphereReceive(x)),
              [0, 10],
              "linspace(0,10,401)",
              "abs(p4Receive(x,0))",
            ),
            curve(
              "圆面活塞（瑞利单面负载近似）",
              (x) => phy.magnitude(phy.diskReceive(x)),
              [0, 10],
              "linspace(0,10,401)",
              "abs(p4Receive(x,1))",
            ),
            points(
              "脉冲中心频率对应尺寸",
              [
                [
                  5 * phy.kWave(p.f, p.c) * p.a,
                  phy.magnitude(phy.sphereReceive(5 * phy.kWave(p.f, p.c) * p.a)),
                ],
              ],
              "5*k*a",
              "abs(p4Receive(5*k*a,0))",
              { marker: "o", style: "none" },
            ),
          ],
          setup,
        ),
      ],
      1,
      1,
    ),
    figure("6.1-2", "压力系数频率响应导致宽带接收波形畸变", (p) => [
      graph(
        p,
        0,
        "同一宽带周期脉冲的自由场与接收等效压力",
        "时间 t (s)",
        "等效压力信号 (Pa)",
        [0, 0.004],
        [-1, 1],
        [
          curve(
            "入射宽带脉冲",
            (t) => phy.receivedPulse(t, p.f, p.a, p.c).incident,
            [0, 0.004],
            "linspace(0,.004,1601)",
            "p4Pulse(x,f,a,c,0)",
            "-",
            1601,
          ),
          curve(
            "圆球接收后的平均压力",
            (t) => phy.receivedPulse(t, p.f, p.a, p.c).received,
            [0, 0.004],
            "linspace(0,.004,1601)",
            "p4PulseOut(x,f,a,c,0)",
            "--",
            1601,
          ),
        ],
        setup,
      ),
    ]),
  ],
  answers: [
    "入射声场使接收器产生机械振动，再转换为电信号；与向介质主动输送声能的辐射相对应。",
    "接收器会散射入射波，实际接收的总场由入射场与散射场叠加。",
    "压力系数、二次辐射阻抗和机械阻抗都可能随频率变化。",
    "使接收器尺寸远小于波长，使二次辐射阻抗远小于机械阻抗，并针对频带设计机械阻抗。",
  ],
  exampleTitle: "例题　宽带水听器的尺寸上限",
  background:
    "最高测量频率 20 kHz，拟用半径 5 mm 的圆球接收器。要求压力系数幅值不小于 0.99，求现有接收器的系数与允许的最大半径，以控制由几何散射引起的幅值误差。",
  exampleDefaults: { ...p, f: 20000, a: 0.005 },
  given: [a, exampleFrequency],
  asks,
  judgment: "压力系数合格只控制一种畸变来源；最终宽带性能还需检验机械阻抗及二次辐射负载。",
  examplePlot: (p) => {
    const maxa = asks[1].calc(p);
    return answer(
      graph(
        p,
        0,
        "现有圆球与按最高频率设计的小球接收频响",
        "信号频率 f (Hz)",
        "平均压力系数模值",
        [100, 100000],
        [0, 1],
        [
          points(
            "现有接收器",
            log(100, 100000).map((f) => [
              f,
              phy.magnitude(phy.sphereReceive(phy.kWave(f, p.c) * p.a)),
            ]),
            "logspace(2,5,401)",
            "abs(p4Receive(2*pi*x/c*a,0))",
          ),
          points(
            "按允许最大半径设计",
            log(100, 100000).map((f) => [
              f,
              phy.magnitude(phy.sphereReceive(phy.kWave(f, p.c) * maxa)),
            ]),
            "logspace(2,5,401)",
            "abs(p4Receive(2*pi*x/c*amax,0))",
            { style: "--" },
          ),
          points("现有接收器最高频率响应", [[p.f, asks[0].calc(p)]], "f", "coefficient", {
            marker: "o",
            style: "none",
          }),
        ],
        setup,
        {
          xscale: "log",
          annotations: [{ axis: "y", value: p.criterion, label: "最低允许压力系数" }],
        },
        { annotations: ["criterion"] },
      ),
      "coefficient",
    );
  },
  engineering: engineering(
    "水下监听系统需要在接收灵敏度、传感器尺寸和带宽之间折中；尺寸变小可以降低几何散射畸变，但不能单独保证机械、电学响应平坦。",
    "receiver",
    "水下监听接收器选型",
  ),
});
