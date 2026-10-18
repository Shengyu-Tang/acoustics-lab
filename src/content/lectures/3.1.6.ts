import { e316 } from "../../plot/p2Examples";
import { axisTicks } from "../../plot/ticks";
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
  engineering,
} from "../p2";
const P0 = parameter("P0", "静态压强", "P₀", "Pa", 80000, 150000, 100),
  gamma = parameter("gamma", "比热比", "γ", "—", 1.1, 1.67, 0.01),
  span = parameter("span", "密度比观察范围", "ε", "—", 0.0001, 0.6, 0.0001),
  rho = parameter("rho", "静态密度", "ρ₀", "kg/m³", 0.5, 2, 0.01);
const p = { ...defaults, P0: 101325, gamma: 1.4, span: 0.5, s: 0.001 };
const s = parameter("s", "压缩量", "s", "—", 0.00001, 0.05, 0.00001);
export default p2Lecture("3.1.6", {
  defaults: p,
  parameters: [P0, gamma, rho, span],
  keyPoints: [
    "状态方程根据热力学过程建立声压与密度逾量的关系，是三个基本方程之二。",
    "在静态密度和指定熵处作泰勒展开；小振幅条件下略去二次及更高阶项。",
    "斜率是等熵体积模量除以静态密度，即声速平方；状态参数和热力学过程必须一致。",
  ],
  formulas: [
    {
      number: "3.1.6-1",
      tex: String.raw`P=P_0(\rho/\rho_0)^\gamma,\quad c_0^2=\left(\frac{\partial P}{\partial\rho}\right)_{s_0}=\frac{\gamma P_0}{\rho_0}`,
      meaning: "理想气体的绝热曲线在平衡点附近可用切线近似。",
    },
    {
      number: "3.1.6-2",
      tex: String.raw`p=c_0^2\rho',\quad\varepsilon=\frac{|P_0[(1+s)^\gamma-1]-\gamma P_0s|}{|P_0[(1+s)^\gamma-1]|}`,
      meaning: "误差按声压扰动计算；不能用巨大静压作分母来掩盖线性化误差。",
    },
  ],
  figures: [
    figure(
      "3.1.6-1",
      "绝热状态曲线、切线与线性化误差",
      (p) => {
        const a = p.span,
          r = p.span * p.rho;
        return [
          graph(
            p,
            0,
            "平衡点附近：绝热曲线与切线",
            "密度余量 (kg/m³)",
            "声压 p (Pa)",
            [-r, r],
            [-1.8 * p.P0 * p.gamma * a, 1.8 * p.P0 * p.gamma * a],
            [
              curve(
                "绝热曲线",
                (s) => p.P0 * ((1 + s / p.rho) ** p.gamma - 1),
                [-r, r],
                "linspace(rr(1),rr(2),401)",
                "P0*((1+x/rho).^gamma-1)",
              ),
              curve(
                "切线",
                (s) => (p.P0 * p.gamma * s) / p.rho,
                [-r, r],
                "linspace(rr(1),rr(2),401)",
                "gamma*P0*x/rho",
                "--",
              ),
              points("平衡点", [[0, 0]], "0", "0", { style: "none", marker: "o" }),
            ],
            "rr=[-span span]*rho;",
            {},
            { xlim: "rr", ylim: "[-1.8 1.8]*P0*gamma*span" },
          ),
          graph(
            p,
            0,
            "线性化相对声压误差",
            "压缩量 ρ′/ρ₀（—）",
            "相对误差 (%)",
            [0, a],
            [
              0,
              Math.max(
                0.0001,
                150 *
                  Math.abs(
                    ((1 + p.span) ** p.gamma - 1 - p.gamma * p.span) /
                      ((1 + p.span) ** p.gamma - 1),
                  ),
              ),
            ],
            [
              curve(
                "误差",
                (s) =>
                  s === 0
                    ? 0
                    : 100 *
                      Math.abs(((1 + s) ** p.gamma - 1 - p.gamma * s) / ((1 + s) ** p.gamma - 1)),
                [0, a],
                "linspace(0,span,401)",
                "100*abs(((1+x).^gamma-1-gamma*x)./max(eps,(1+x).^gamma-1))",
              ),
            ],
            "",
            {},
            {
              xlim: "[0 span]",
              ylim: "[0 max(.0001,150*abs(((1+span)^gamma-1-gamma*span)/((1+span)^gamma-1)))]",
            },
          ),
        ];
      },
      2,
    ),
  ],
  readouts: (p) => [
    ["等熵声速", Math.sqrt((p.gamma * p.P0) / p.rho), "m/s"],
    ["平衡点切线斜率", (p.gamma * p.P0) / p.rho, "m²/s²"],
    [
      "正端点线性化误差",
      100 *
        Math.abs(((1 + p.span) ** p.gamma - 1 - p.gamma * p.span) / ((1 + p.span) ** p.gamma - 1)),
      "%",
    ],
  ],
  readoutModel:
    "[sqrt(gamma*P0/rho) gamma*P0/rho 100*abs(((1+span)^gamma-1-gamma*span)/((1+span)^gamma-1))]",
  examples: [
    example(
      "例题　空气压缩扰动的声压估计",
      "空气静压 101325 Pa，比热比 1.4、静态密度 1.21 kg/m³。给定压缩量 0.001，求线性声压和密度逾量，评估高强度声场测量的状态换算。",
      p,
      [P0, gamma, rho, s],
      [
        ask(
          "pressure",
          "(1) 线性声压",
          "Pa",
          String.raw`p=\gamma P_0s`,
          "gamma*P0*s",
          (p) => p.gamma * p.P0 * p.s,
          (p) => `${p.gamma} × ${p.P0} Pa × ${p.s}`,
        ),
        ask(
          "density",
          "(2) 密度逾量",
          "kg/m³",
          String.raw`\rho'=\rho_0s`,
          "rho*s",
          (p) => p.rho * p.s,
          (p) => `${p.rho} kg/m³ × ${p.s}`,
        ),
      ],
      () => "压缩量小，切线近似有效；应保持静态密度、压强与温度一致。",
      (p) => e316(p),
    ),
  ],
  answers: [
    "在平衡点按密度逾量展开，只保留一阶项。小振幅使二次及更高阶项相对一阶项足够小，得到声压正比于密度逾量。",
  ],
  engineering: engineering(
    "压力传感器把密度扰动转换为声压时，需要介质的正确热力学斜率；温度和静态状态变化后应重新计算。",
  ),
});
