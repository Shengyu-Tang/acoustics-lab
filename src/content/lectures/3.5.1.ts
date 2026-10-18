import { completeExamples } from "../calculationSteps";
import { e351 } from "../../plot/p2Examples";
import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  example,
  ask,
  engineering,
} from "../p2";
import { helmholtzField, helmholtzY } from "../../physics/chapter3";
const ratio = parameter("ratio", "切向波数比", "kₓ/k", "—", 0, 1.5, 0.01),
  y = parameter("depth", "法向距离", "y", "m", 0.001, 1, 0.001);
const p = { ...defaults, ratio: 0.6, depth: 0.1 };
const completedLecture = p2Lecture("3.5.1", {
  defaults: p,
  parameters: [ratio, params.f, params.c],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "时谐场将声压波动方程化为仅含空间坐标的亥姆霍兹方程。",
    "直角坐标中分离变量后，每个坐标因子满足常系数二阶常微分方程，三个分离波数平方和等于总波数平方。",
    "实波数分量形成均匀平面波；切向波数大于总波数时，法向波数可为虚数，选择随距离衰减的分支形成非均匀波。",
  ],
  formulas: [
    {
      number: "3.5.1-1",
      tex: String.raw`p=\Re\{P(x,y,z)e^{j\omega t}\},\quad\nabla^2P+k^2P=0,\quad P=XYZ`,
      meaning: "分离变量并不自动确定具体声场，各系数仍由边界条件决定。",
    },
    {
      number: "3.5.1-2",
      tex: String.raw`k_x^2+k_y^2+k_z^2=k^2,\quad X=A_xe^{-jk_xx}+B_xe^{jk_xx}`,
      meaning: "另外两个方向有相同形式的指数解，乘积展开为平面波组合。",
    },
    {
      number: "3.5.1-3",
      tex: String.raw`k_z=0,\quad k_y=-j\alpha,\quad\alpha=\sqrt{k_x^2-k^2},\quad P=e^{-jk_xx}e^{-\alpha y}`,
      meaning: "在正时间因子和负空间因子约定下，法向虚波数必须取负虚部才会向正 y 衰减。",
    },
  ],
  figures: [
    figure("3.5.1-1", "受约束的波数与传播、倏逝二维场", (p, t) => {
      const nx = Math.max(161, Math.ceil(((8 * p.f) / p.c) * Math.max(1, p.ratio)) + 1),
        ny = Math.max(81, Math.ceil((8 * p.f) / p.c) + 1),
        xs = Array.from({ length: nx }, (_, i) => (2 * i) / (nx - 1)),
        ys = Array.from({ length: ny }, (_, i) => (2 * i) / (ny - 1));
      return [
        graph(
          p,
          t,
          p.ratio <= 1 ? "实 k_y：均匀波，等相位线为直线" : "k_y = −jα：沿 y 指数衰减",
          "位置 x (m)",
          "位置 y (m)",
          [0, 2],
          [0, 2],
          [],
          "nx=max(161,ceil(8*f/c*max(1,ratio))+1);ny=max(81,ceil(8*f/c)+1);[XX,YY]=meshgrid(linspace(0,2,nx),linspace(0,2,ny));qr=sqrt(max(0,1-ratio^2));qa=sqrt(max(0,ratio^2-1));Pfield=exp(-k*qa*YY).*cos(tau-k*(ratio*XX+qr*YY));",
          {
            legend: false,
            field: {
              x: xs,
              y: ys,
              z: ys.map((y) =>
                xs.map((x) =>
                  helmholtzField(x, y, (2 * Math.PI * p.f) / p.c, p.ratio, 2 * Math.PI * p.f * t),
                ),
              ),
              limits: [-1, 1],
              map: "RdBu",
              label: "归一化声压 Re{P}（—）",
            },
          },
          {
            field: { x: "linspace(0,2,nx)", y: "linspace(0,2,ny)", z: "Pfield" },
            title: "sprintf('k_x/k = %.3g；大于1时为法向指数衰减',ratio)",
          },
        ),
      ];
    }),
  ],
  readouts: (p) => {
    const k = (2 * Math.PI * p.f) / p.c,
      q = helmholtzY(k, p.ratio * k);
    return [
      ["总波数", k, "rad/m"],
      ["切向波数", p.ratio * k, "rad/m"],
      ["法向波数实部", q.real, "rad/m"],
      ["法向衰减系数", q.decay, "m⁻¹"],
    ];
  },
  readoutModel: "[k ratio*k sqrt(max(0,1-ratio^2))*k sqrt(max(0,ratio^2-1))*k]",
  examples: [
    example(
      "例题　近场空间分量的衰减",
      "声场中一个空间分量在 1 kHz 时有切向波数为总波数的 1.25 倍，空气声速 343 m/s。求法向衰减系数以及距界面 0.1 m 处的相对幅值。",
      { ...p, ratio: 1.25 },
      [{ ...ratio, min: 1.01 }, params.f, params.c, y],
      [
        ask(
          "alpha",
          "(1) 法向衰减系数",
          "m⁻¹",
          String.raw`\alpha=(2\pi f/c_0)\sqrt{(k_x/k)^2-1}`,
          "k*sqrt(ratio^2-1)",
          (p) => ((2 * Math.PI * p.f) / p.c) * Math.sqrt(p.ratio ** 2 - 1),
          (p) => `2π × ${p.f} Hz ÷ ${p.c} m/s × √(${p.ratio}²−1)`,
        ),
        ask(
          "amplitude",
          "(2) 相对幅值",
          "—",
          String.raw`|P(y)|/|P(0)|=e^{-\alpha y}`,
          "exp(-alpha*depth)",
          (p) => Math.exp(((-2 * Math.PI * p.f) / p.c) * Math.sqrt(p.ratio ** 2 - 1) * p.depth),
          (p) =>
            `exp(−${((2 * Math.PI * p.f) / p.c) * Math.sqrt(p.ratio ** 2 - 1)} m⁻¹ × ${p.depth} m)`,
        ),
      ],
      () => "该分量沿界面传播而向法向衰减，需在靠近界面处采集空间细节。",
      (p) => e351(p),
    ),
  ],
  answers: [
    "所有场量以同一个角频率作简谐时间变化，空间复幅值可独立求解。",
    "假设声场为单频谐和形式，时间二阶导数化为负的角频率平方，波动方程化为亥姆霍兹方程。",
    "把多变量空间函数写成各单变量函数的乘积，使偏微分方程分离为若干常微分方程。",
    "等于三个正交坐标二阶偏导数之和。",
  ],
  engineering: engineering(
    "近场声全息中的高空间波数成分随离开测量面快速衰减；测量距离会影响可恢复的空间细节。",
    "lens",
    "声透镜与水下机器人",
  ),
});

export default completeExamples(completedLecture);
