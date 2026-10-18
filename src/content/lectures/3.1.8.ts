import { e318 } from "../../plot/p2Examples";
import {
  p2Lecture,
  defaults,
  params,
  figure,
  graph,
  curve,
  example,
  ask,
  engineering,
} from "../p2";
const p = { ...defaults };
export default p2Lecture("3.1.8", {
  defaults: p,
  parameters: [params.pa, params.f, params.rho, params.c],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "运动方程来自随流体一起运动的质团所受压力合力与牛顿第二定律，建立声压和质点振速的关系。",
    "质团加速度包含本地时间变化与迁移加速度；固定控制体和随体质团的描述不同。",
    "小振幅下略去扰动密度乘加速度以及迁移加速度，得到静态密度乘本地加速度等于负压力梯度。",
  ],
  formulas: [
    {
      number: "3.1.8-1",
      tex: String.raw`\rho\frac{D\mathbf U}{Dt}=-\nabla P,\quad\frac{D\mathbf U}{Dt}=\partial_t\mathbf U+(\mathbf U\cdot\nabla)\mathbf U`,
      meaning: "压力在两侧不相等时产生净力。",
    },
    {
      number: "3.1.8-2",
      tex: String.raw`\rho_0\partial_t\mathbf u=-\nabla p,\quad\frac{\max|u\partial_xu|}{\max|\partial_tu|}=\frac{u_a}{2c_0}`,
      meaning: "马赫数给出迁移项相对量级；对单一正弦行波比较最大幅值时，精确系数为二分之一。",
    },
  ],
  figures: [
    figure("3.1.8-1", "压力梯度与质团加速度", (p, t) => {
      const a = (p.pa * 2 * Math.PI * p.f) / p.c;
      return [
        graph(
          p,
          t,
          "压力与力密度（右轴）",
          "位置 x (m)",
          "声压 p (Pa)",
          [0, 2],
          [-1.6 * p.pa, 1.6 * p.pa],
          [
            curve(
              "声压",
              (r) => p.pa * Math.cos(2 * Math.PI * (p.f * t - (p.f * r) / p.c)),
              [0, 2],
              "linspace(0,2,401)",
              "pa*cos(tau-k*x)",
            ),
            {
              ...curve(
                "−∂p/∂x",
                (r) => -a * Math.sin(2 * Math.PI * (p.f * t - (p.f * r) / p.c)),
                [0, 2],
                "linspace(0,2,401)",
                "-k*pa*sin(tau-k*x)",
              ),
              axis: "right",
            },
            {
              ...curve(
                "ρ₀ ∂u/∂t",
                (r) => -a * Math.sin(2 * Math.PI * (p.f * t - (p.f * r) / p.c)),
                [0, 2],
                "linspace(0,2,401)",
                "-rho*w*pa/Z*sin(tau-k*x)",
                "--",
              ),
              axis: "right",
            },
          ],
          "",
          { rightLabel: "力密度 (N/m³)", rightLim: [-1.6 * a, 1.6 * a] },
          { ylim: "[-1.6 1.6]*pa", rightLim: "[-1.6 1.6]*k*pa" },
        ),
      ];
    }),
    figure("3.1.8-2", "迁移加速度的马赫数量级", (p) => [
      graph(
        p,
        0,
        "声学马赫数与迁移项幅值比",
        "空气声压级 (dB，参考声压 20 μPa)",
        "比值（—）",
        [0, 200],
        [1e-10, 1],
        [
          curve(
            "马赫数 uₐ/c₀",
            (L) => (Math.SQRT2 * 20e-6 * 10 ** (L / 20)) / (p.rho * p.c * p.c),
            [0, 200],
            "linspace(0,200,401)",
            "sqrt(2)*20e-6*10.^(x/20)/(rho*c^2)",
          ),
          curve(
            "正弦行波：幅值比",
            (L) => (Math.SQRT2 * 10e-6 * 10 ** (L / 20)) / (p.rho * p.c * p.c),
            [0, 200],
            "linspace(0,200,401)",
            "sqrt(2)*10e-6*10.^(x/20)/(rho*c^2)",
            "--",
          ),
        ],
        "",
        { yscale: "log" },
      ),
    ]),
  ],
  readouts: (p) => [
    ["压力梯度幅值", (2 * Math.PI * p.f * p.pa) / p.c, "Pa/m"],
    ["本地加速度幅值", (2 * Math.PI * p.f * p.pa) / (p.rho * p.c), "m/s²"],
    ["声学马赫数", p.pa / (p.rho * p.c ** 2), "—"],
  ],
  readoutModel: "[k*pa w*pa/Z pa/(rho*c^2)]",
  examples: [
    example(
      "例题　声压引起的空气质点加速度",
      "1 kHz 的空气平面波声压峰值为 2 Pa。密度 1.21 kg/m³，声速 343 m/s。估计压力梯度和局部加速度，为振速传感器量程选择提供依据。",
      { ...p, pa: 2 },
      [params.pa, params.f, params.rho, params.c],
      [
        ask(
          "gradient",
          "(1) 压力梯度幅值",
          "Pa/m",
          String.raw`|\partial_xp|_a=kp_a`,
          "k*pa",
          (p) => (2 * Math.PI * p.f * p.pa) / p.c,
          (p) => `2π × ${p.f} Hz ÷ ${p.c} m/s × ${p.pa} Pa`,
        ),
        ask(
          "acceleration",
          "(2) 本地加速度幅值",
          "m/s²",
          String.raw`a_a=kp_a/\rho_0`,
          "gradient/rho",
          (p) => (2 * Math.PI * p.f * p.pa) / (p.rho * p.c),
          (p) => `${(2 * Math.PI * p.f * p.pa) / p.c} Pa/m ÷ ${p.rho} kg/m³`,
        ),
      ],
      () => "微小位移在较高频率下仍可有明显加速度；传感器需匹配频带与量程。",
      (p) => e318(p),
    ),
  ],
  answers: [
    "运动方程跟踪同一团物质，其质量不变、体积可变；连续性方程使用空间位置固定、允许质量流入流出的控制体。",
    "本地加速度是在固定位置速度随时间的变化；迁移加速度是质点移到速度不同的位置所引起的变化。",
  ],
  engineering: engineering(
    "振速探头测量运动时，需要区分局部声学扰动和平均流动；有强背景流时应保留适当的随流体导数。",
  ),
});
