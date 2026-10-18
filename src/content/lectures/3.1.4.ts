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
import { densityRate } from "../../physics/chapter3";
import { controlVolume } from "../../plot/p2Diagrams";
const left = parameter("left", "左面流速（向右为正）", "u入", "m/s", -0.03, 0.03, 0.001),
  right = parameter("right", "右面流速（向右为正）", "u出", "m/s", -0.03, 0.03, 0.001),
  L = parameter("L", "体元长度", "dx", "m", 0.01, 0.5, 0.01),
  S = parameter("S", "截面积", "S", "m²", 0.001, 0.1, 0.001);
const p = { ...defaults, left: 0.012, right: 0.008, L: 0.1, S: 0.01 };
export default p2Lecture("3.1.4", {
  defaults: p,
  parameters: [left, right, L, S, params.rho],
  animation: true,
  animationPeriod: () => 1,
  keyPoints: [
    "连续性方程来自质量守恒：控制体内质量增加等于各表面净流入质量。",
    "六面体有三对相对表面，分别计算三个坐标方向的质量流入与流出，再求总和。",
    "一阶泰勒展开把中心的质量流密度换算到各表面，得到一个时间段内体元总质量变化。",
  ],
  formulas: [
    {
      number: "3.1.4-1",
      tex: String.raw`\Delta m_x=-\frac{\partial(\rho u_x)}{\partial x}\,dx\,dy\,dz\,dt`,
      meaning: "右表面流出多于左表面流入时，体元质量减少。",
    },
    {
      number: "3.1.4-2",
      tex: String.raw`\frac{\partial\rho}{\partial t}=\frac{\rho_0(u_{\rm in}-u_{\rm out})}{dx},\quad \dot m=\rho_0S(u_{\rm in}-u_{\rm out})`,
      meaning:
        "数值演示只计 x 方向，其余两对面的净流量设为零；箭头按共同静态密度归一化，比较两面质量流，实际流率见读数表。",
    },
  ],
  figures: [
    figure("3.1.4-1", "六面体质量流入、流出与密度变化", (p, t) => [controlVolume(p, t)]),
    figure("3.1.4-2", "净流入与体元内质量积累", (p) => {
      const r = densityRate(p.rho, p.left, p.right, p.L);
      return [
        graph(
          p,
          0,
          "固定控制体：同一时间段内的质量收支",
          "时间 dt (s)",
          "质量变化 Δm (kg)",
          [0, 1],
          [-0.001, 0.001],
          [
            curve(
              "左面流入",
              (t) => p.rho * p.S * p.left * t,
              [0, 1],
              "linspace(0,1,401)",
              "rho*S*left*x",
            ),
            curve(
              "右面流出",
              (t) => p.rho * p.S * p.right * t,
              [0, 1],
              "linspace(0,1,401)",
              "rho*S*right*x",
              "--",
            ),
            curve(
              "体内净积累",
              (t) => r * p.L * p.S * t,
              [0, 1],
              "linspace(0,1,401)",
              "rho*S*(left-right)*x",
            ),
          ],
          "",
          {},
          { ylim: "[-1 1]*max(1e-9,rho*S*max(abs([left right left-right])))*1.5" },
        ),
      ];
    }),
  ],
  readouts: (p) => [
    ["流入质量率", p.rho * p.S * p.left, "kg/s"],
    ["流出质量率", p.rho * p.S * p.right, "kg/s"],
    ["体元体积", p.S * p.L, "m³"],
    ["密度变化率", densityRate(p.rho, p.left, p.right, p.L), "kg/(m³·s)"],
  ],
  readoutModel: "[rho*S*left rho*S*right S*L rho*(left-right)/L]",
  examples: [
    example(
      "例题　小型风道体元的质量收支",
      "长 0.1 m、截面 0.01 m² 的风道体元，两面流速分别为 0.012 和 0.008 m/s。以空气密度 1.21 kg/m³ 求瞬时净流入和密度变化率。",
      p,
      [left, right, L, S, params.rho],
      [
        ask(
          "massRate",
          "(1) 净流入质量率",
          "kg/s",
          String.raw`\dot m=\rho_0S(u_{\rm in}-u_{\rm out})`,
          "rho*S*(left-right)",
          (p) => p.rho * p.S * (p.left - p.right),
          (p) => `${p.rho} kg/m³ × ${p.S} m² × (${p.left}−${p.right}) m/s`,
        ),
        ask(
          "rate",
          "(2) 密度变化率",
          "kg/(m³·s)",
          String.raw`\dot\rho=\dot m/(Sdx)`,
          "massRate/(S*L)",
          (p) => densityRate(p.rho, p.left, p.right, p.L),
          (p) => `${p.rho * p.S * (p.left - p.right)} kg/s ÷ (${p.S} m² × ${p.L} m)`,
        ),
      ],
      (p) =>
        p.left > p.right
          ? "该瞬间净流入，密度增加；长期不能把流速差保持不变而仍称小扰动。"
          : "该瞬间密度不增加，符号与收支方向一致。",
      (p) =>
        answerCurve(
          p,
          "left",
          "左面流速",
          "m/s",
          (q) => densityRate(q.rho, q.left, q.right, q.L),
          "rho*(x-right)/L",
        ),
    ),
  ],
  answers: [
    "封闭系统的总质量不变；开放控制体内质量变化等于边界净流入质量。",
    "对质量流密度在中心作一阶泰勒展开，两侧分别加减半个体元边长乘以相应空间导数。",
  ],
  engineering: engineering(
    "通风管内的局部压缩由净质量流入引起；有限体积离散必须使相邻体元共享表面通量，才能保持质量守恒。",
    "duct",
    "通风管道模态与反射",
  ),
});
