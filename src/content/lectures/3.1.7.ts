import {
  p2Lecture,
  defaults,
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
import { gasSpeed, liquidSpeed } from "../../physics/chapter3";
const T = parameter("T", "气温", "T", "°C", -30, 50, 1),
  gamma = parameter("gamma", "比热比", "γ", "—", 1.1, 1.67, 0.01),
  P0 = parameter("P0", "静态压强", "P₀", "Pa", 50000, 200000, 1000),
  bulk = parameter("bulk", "水体积模量", "K", "GPa", 1.5, 3, 0.01),
  waterRho = parameter("waterRho", "水密度", "ρ水", "kg/m³", 950, 1050, 1);
const p = { ...defaults, T: 20, gamma: 1.4, P0: 101325, bulk: 2.25, waterRho: 1000 };
export default p2Lecture("3.1.7", {
  defaults: p,
  parameters: [T, gamma, P0],
  keyPoints: [
    "等熵波速由等熵状态斜率决定，理想气体中是比热比、静压和密度的函数。",
    "等温波速由等温状态斜率决定；相同状态下等熵声速是等温声速的比热比平方根倍。",
    "固定气体成分与温度时，理想气体密度随静压同比变化，声速不随静压独立改变；声压扰动不是静压。",
    "按 PPT 的热力学近似，音频采用等熵绝热、次声讨论等温极限；实际是否等温还取决于热交换尺度与时间，不能只由频段一概确定。",
  ],
  formulas: [
    {
      number: "3.1.7-1",
      tex: String.raw`c_s=\sqrt{\gamma P_0/\rho_0}=\sqrt{\gamma R(T+273.15)},\quad c_T=\sqrt{P_0/\rho_0}`,
      meaning: "空气气体常数取 287.05 $\\mathrm{J/(kg\\cdot K)}$，密度按同一静压和温度求出。",
    },
    {
      number: "3.1.7-2",
      tex: String.raw`c_{\rm liquid}=\sqrt{K_s/\rho_0}`,
      meaning: "液体采用等熵体积模量；不能把气体比热比公式直接用于水。",
    },
  ],
  figures: [
    figure("3.1.7-1", "等熵与等温声速随空气温度变化", (p) => [
      graph(
        p,
        0,
        "同一静态状态与两种热力学极限",
        "空气温度 T (°C)",
        "声速 c₀ (m/s)",
        [-40, 60],
        [200, 450],
        [
          points(
            "当前温度",
            [[p.T, gasSpeed(p.T, p.gamma, p.P0).adiabatic]],
            "T",
            "sqrt(gamma*287.05*(T+273.15))",
            { style: "none", marker: "o" },
          ),
          {
            ...curve(
              "静态密度",
              (T) => p.P0 / (287.05 * (T + 273.15)),
              [-40, 60],
              "linspace(-40,60,401)",
              "P0./(287.05*(x+273.15))",
            ),
            axis: "right",
          },
          curve(
            "等熵（拉普拉斯）",
            (T) => gasSpeed(T, p.gamma, p.P0).adiabatic,
            [-40, 60],
            "linspace(-40,60,401)",
            "sqrt(gamma*287.05*(x+273.15))",
          ),
          curve(
            "等温（牛顿）",
            (T) => gasSpeed(T, p.gamma, p.P0).isothermal,
            [-40, 60],
            "linspace(-40,60,401)",
            "sqrt(287.05*(x+273.15))",
          ),
          points(
            "0 °C 对照",
            [
              [0, gasSpeed(0, p.gamma).adiabatic],
              [0, gasSpeed(0, p.gamma).isothermal],
            ],
            "[0 0]",
            "[sqrt(gamma*287.05*273.15) sqrt(287.05*273.15)]",
            { style: "none", marker: "o" },
          ),
        ],
        "",
        {
          rightLabel: "静态密度 (kg/m³)",
          rightLim: [0, 3],
          annotations: [
            {
              axis: "x",
              value: 0,
              label: `0 °C: ${gasSpeed(0, p.gamma).adiabatic.toFixed(0)} / ${gasSpeed(0, p.gamma).isothermal.toFixed(0)} m/s`,
            },
          ],
        },
        {
          rightLim: "[0 3]",
          annotationLabels: [
            "sprintf('0 C: %.0f / %.0f m/s',sqrt(gamma*287.05*273.15),sqrt(287.05*273.15))",
          ],
        },
      ),
    ]),
  ],
  readouts: (p) => {
    const a = gasSpeed(p.T, p.gamma, p.P0);
    return [
      ["理想气体密度", a.rho, "kg/m³"],
      ["等熵波速", a.adiabatic, "m/s"],
      ["等温波速", a.isothermal, "m/s"],
      ["等熵相对等温增加", 100 * (Math.sqrt(p.gamma) - 1), "%"],
    ];
  },
  readoutModel:
    "[P0/(287.05*(T+273.15)) sqrt(gamma*287.05*(T+273.15)) sqrt(287.05*(T+273.15)) 100*(sqrt(gamma)-1)]",
  examples: [
    example(
      "例题　空气与水中的测距声速",
      "测距系统分别用于 20 °C 空气和清水。空气比热比取 1.4；水的等熵体积模量为 2.25 GPa，密度为 1000 kg/m³。分别计算声速，作为时间测距标定参数。",
      p,
      [T, gamma, bulk, waterRho],
      [
        ask(
          "airSpeed",
          "(1) 空气等熵声速",
          "m/s",
          String.raw`c_a=\sqrt{\gamma R(T+273.15)}`,
          "sqrt(gamma*287.05*(T+273.15))",
          (p) => gasSpeed(p.T, p.gamma).adiabatic,
          (p) => `√(${p.gamma} × 287.05 $\\mathrm{J/(kg\\cdot K)}$ × (${p.T}+273.15) K)`,
        ),
        ask(
          "waterSpeed",
          "(2) 水声速",
          "m/s",
          String.raw`c_w=\sqrt{K_s/\rho_w}`,
          "sqrt(bulk*1e9/waterRho)",
          (p) => liquidSpeed(p.bulk * 1e9, p.waterRho),
          (p) => `√(${p.bulk}×10⁹ Pa ÷ ${p.waterRho} kg/m³)`,
        ),
      ],
      () => "两种介质须分别标定声速；空气测距还需补偿温度变化。",
      (p) =>
        answerCurve(
          p,
          "bulk",
          "水体积模量",
          "GPa",
          (q) => liquidSpeed(q.bulk * 1e9, q.waterRho),
          "sqrt(x*1e9/waterRho)",
        ),
    ),
  ],
  answers: [
    "依据介质的热力学状态关系，并指定等熵或等温等实际过程。",
    "将状态关系在静态密度处展开，略去密度逾量的二次及更高阶项。",
    "热交换时间远长于振动周期时接近绝热，远短于振动周期时接近等温；频率和几何热交换尺度共同决定。",
    "按课件的等温次声与等熵音频两极限，前者较低；在实际自由空气中，不能仅凭频段断言不同，须检查热交换条件。",
  ],
  engineering: engineering(
    "超声测距需要温度补偿，水下系统需要采用水的体积模量或实测声速；用空气声速替代水声速将造成显著距离误差。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
