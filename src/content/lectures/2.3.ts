import { lecture, parameter, fmt, type Values } from "../p1";
import { rodSpeed, loadedRodRoots } from "../../physics/chapter2";
import { panel, extent, working, segment, arrow } from "../../plot/p1Helpers";
import { sample, type Panel } from "../../plot/types";
const E = parameter("E", "杨氏模量", "E", "GPa", 1, 250, 1),
  rho = parameter("rho", "体密度", "ρ", "kg/m³", 1000, 10000, 10),
  L = parameter("L", "棒长", "L", "m", 0.2, 2, 0.01),
  S = parameter("S", "截面积", "S", "m²", 0.00001, 0.001, 0.00001),
  mass = parameter("tipMass", "端点负载质量", "M", "kg", 0.05, 5, 0.01);
const materials = [
  { name: "钢", E: 200, rho: 7850 },
  { name: "铝", E: 70, rho: 2700 },
  { name: "黄铜", E: 100, rho: 8500 },
  { name: "玻璃", E: 65, rho: 2500 },
  { name: "有机玻璃", E: 3, rho: 1180 },
];
const defaults = {
  E: 200,
  rho: 7850,
  L: 1,
  S: 0.0001,
  tipMass: 0.785,
  sigma: 1,
  gradient: 0.4,
  boundary: 2,
  material: 0,
};
const roots = (p: Values) => loadedRodRoots(p.rho, p.S, p.L, p.tipMass);
const graph = (p: Values): Panel => {
  const alpha = (p.rho * p.S * p.L) / p.tipMass,
    qs = sample((x) => x, 0, 8, 4001).map(([x]) => x);
  for (let n = 0; (n + 0.5) * Math.PI < 8; n++) {
    const pole = (n + 0.5) * Math.PI;
    qs.push(pole - 1e-6, pole, pole + 1e-6);
  }
  qs.sort((a, b) => a - b);
  return {
    ...panel(
      "频率方程：蓝 tan(q)，橙 ρSL/(Mq)，圆点为交点",
      "无量纲波数 q = kL (—)",
      "频率方程两侧 (—)",
      [0, 8],
      [-6, 450],
      [
        {
          name: "tan(q)",
          points: qs.map((q) => [q, Math.abs(Math.cos(q)) < 1e-12 ? NaN : Math.tan(q)]),
        },
        { name: "ρSL/(Mq)", points: qs.map((q) => [q, q === 0 ? NaN : alpha / q]) },
        {
          name: "前三阶固有频率",
          points: roots(p).map((q) => [q, Math.tan(q)]),
          style: "none",
          marker: "o",
        },
      ],
    ),
    legend: false,
  };
};
export default lecture(
  "2.3",
  [
    "均匀指材料参数和截面沿棒长不变；细棒指截面最大线度远小于纵波波长。该近似使同一截面纵向振动状态相同，并可忽略横向振动和其他应力分量。",
  ],
  {
    defaults,
    parameters: [
      E,
      rho,
      L,
      S,
      mass,
      parameter("sigma", "左截面初始应力", "σ₁", "MPa", 0.1, 5, 0.1),
      parameter("gradient", "初始应力梯度", "∂σ/∂z", "MPa/m", -1, 1, 0.1),
    ],
    materials,
    controls: "rod-boundary",
    animation: true,
    animationPeriod: (p) => (2 * p.L) / rodSpeed(p.E * 1e9, p.rho),
    boundaryEquations: [
      String.raw`\zeta(L,t)=0`,
      String.raw`\partial_z\zeta(L,t)=0`,
      String.raw`ES\partial_z\zeta(L,t)=-M\partial_t^2\zeta(L,t)`,
      String.raw`ES\partial_z\zeta(L,t)=F(t)`,
    ],
    keyPoints: [
      "均匀细棒近似要求材料、截面均匀，截面最大线度远小于纵波波长。",
      "由截面应力差与胡克定律得到一维纵振动方程，波速为 $\\sqrt{E/\\rho}$。",
      "形式解还需要初始位移、初始速度与边界条件才能确定。",
      "固定、自由、质量负载与力激励对应不同的端点条件；图解采用左端固定、右端质量负载。",
    ],
    formulas: [
      {
        number: "2.3-1",
        tex: String.raw`\rho S\,dz\,\partial_t^2\zeta=S[\sigma(z+dz)-\sigma(z)],\quad \sigma=E\partial_z\zeta`,
        meaning: "课件应力符号 $T_{zz}$ 在此图中写作 σ，避免与弦张力混淆；纵向位移使用课件的 ζ。",
      },
      {
        number: "2.3-2",
        tex: String.raw`\partial_t^2\zeta=c^2\partial_z^2\zeta,\quad c=\sqrt{E/\rho},\quad \zeta(z,t)=\sum_k[A_k\cos kz+B_k\sin kz][C_k\cos\omega_kt+D_k\sin\omega_kt]`,
        meaning:
          "相应初值是 $\\zeta(z,0) = f(z)$、$\\partial_t\\zeta(z,0) = g(z)$。材料预设是演示用近似参数，可编辑，不作为材料检验证书。",
      },
      {
        number: "2.3-3",
        tex: String.raw`\zeta(0,t)=0,\quad ES\partial_z\zeta(L,t)=-M\partial_t^2\zeta(L,t)\ \Longrightarrow\ \tan q=\frac{\rho SL}{Mq},\quad q=kL`,
        meaning:
          "频率方程图固定采用右端质量负载，边界选择器展示四类边界方程；交点 qₙ 对应 $f_n = q_nc/(2\\pi L)$。",
      },
    ],
    figures: [
      {
        number: "2.3-1",
        title: "体元两截面应力差与轴向合力",
        rows: 1,
        cols: 1,
        plot: (p, t) => {
          const C = Math.cos(((Math.PI * rodSpeed(p.E * 1e9, p.rho)) / p.L) * t),
            a = p.sigma * C,
            b = (p.sigma + p.gradient * 0.2 * p.L) * C,
            scale = 6;
          return [
            panel(
              `纵向微元受力；右端边界：${["固定", "自由", "质量负载", "激励力"][p.boundary]}`,
              "Axial position z (m)",
              "Cross-section coordinate (m)",
              [0, 2],
              [-0.04, 0.04],
              [
                {
                  ...segment("Rod extent", [
                    [0, -Math.sqrt(p.S) / 2],
                    [p.L, -Math.sqrt(p.S) / 2],
                    [p.L, Math.sqrt(p.S) / 2],
                    [0, Math.sqrt(p.S) / 2],
                    [0, -Math.sqrt(p.S) / 2],
                  ]),
                  geometry: { key: "L", axis: "x" },
                },
                segment("微元 S dz", [
                  [0.4 * p.L, -Math.sqrt(p.S) / 2],
                  [0.6 * p.L, -Math.sqrt(p.S) / 2],
                  [0.6 * p.L, Math.sqrt(p.S) / 2],
                  [0.4 * p.L, Math.sqrt(p.S) / 2],
                  [0.4 * p.L, -Math.sqrt(p.S) / 2],
                ]),
                arrow("左截面力 −Sσ₁", [0.4 * p.L, 0], [0.4 * p.L - (0.22 * a) / scale, 0]),
                arrow("右截面力 Sσ₂", [0.6 * p.L, 0], [0.6 * p.L + (0.22 * b) / scale, 0]),
                arrow(
                  "轴向合力（放大）",
                  [0.5 * p.L, 0.025],
                  [0.5 * p.L + (0.6 * (b - a)) / scale, 0.025],
                ),
              ],
            ),
          ];
        },
      },
      {
        number: "2.3-2",
        title: "常见材料的纵波声速比较",
        rows: 1,
        cols: 1,
        plot: (p) => [
          {
            ...panel(
              "材料演示参数的纵波速度",
              "材料（可用预设选取）",
              "细棒纵波速度 c (m/s)",
              [0, 7],
              [0, 18000],
              [
                {
                  name: "纵波速度",
                  kind: "bar",
                  points: [
                    ...materials.map(
                      (m, i) => [i + 1, rodSpeed(m.E * 1e9, m.rho)] as [number, number],
                    ),
                    [6, rodSpeed(p.E * 1e9, p.rho)],
                  ],
                },
              ],
            ),
            legend: false,
            xtickLabels: Array.from({ length: 8 }, (_, i) => ({
              value: i,
              label: i === 0 || i === 7 ? "" : i === 6 ? "Current" : materials[i - 1].name,
            })),
          },
        ],
      },
      {
        number: "2.3-3",
        independentOf: ["E", "sigma", "gradient"],
        dimensionlessComparison:
          "Dimensionless frequency-equation comparison q=kL; elastic modulus converts roots to Hz in the readouts.",
        title: "固定—质量负载边界的固有频率图解",
        rows: 1,
        cols: 1,
        plot: (p) => [graph(p)],
      },
    ],
    readouts: (p) => {
      const c = rodSpeed(p.E * 1e9, p.rho),
        dx = 0.2 * p.L;
      return [
        ["当前细棒波速", c, "m/s"],
        ["t=0 左截面力", p.sigma * 1e6 * p.S, "N"],
        ["t=0 右截面力", (p.sigma + p.gradient * dx) * 1e6 * p.S, "N"],
        ["t=0 体元加速度", (p.gradient * 1e6) / p.rho, "m/s²"],
        ...roots(p).map(
          (q, i) =>
            [`质量负载第 ${i + 1} 阶频率`, (q * c) / (2 * Math.PI * p.L), "Hz"] as [
              string,
              number,
              string,
            ],
        ),
      ];
    },
    examples: [
      {
        title: "例题　带端部传感器质量的钢棒",
        background:
          "钢棒长 1 m、截面积 1 cm²，演示参数 E = 200 GPa、ρ = 7850 kg/m³。左端固定，右端安装 0.785 kg 传感器。求波速与第一阶特征根、固有频率，评估附加质量的影响。",
        defaults,
        given: [E, rho, L, S, mass],
        asks: [
          {
            key: "speed",
            text: "(1) 纵波速度",
            unit: "m/s",
            tex: String.raw`c=\sqrt{E/\rho}`,
            matlab: "sqrt(E*1e9/rho)",
            calc: (p) => rodSpeed(p.E * 1e9, p.rho),
            sub: (p) => `√[${p.E}×10⁹ Pa / (${p.rho} kg/m³)]`,
          },
          {
            key: "q1",
            text: "(2) 第一阶无量纲根",
            unit: "—",
            tex: String.raw`q_1\tan q_1=\rho SL/M,\quad 0<q_1<\pi/2`,
            matlab: "fzero(@(q)q*tan(q)-rho*S*L/tipMass,[eps pi/2-1e-8])",
            calc: (p) => roots(p)[0],
            sub: (p) => `q₁ tan q₁ = ${p.rho} × ${p.S} × ${p.L} / ${p.tipMass}`,
          },
          {
            key: "frequency",
            text: "(3) 第一阶固有频率",
            unit: "Hz",
            tex: String.raw`f_1=q_1c/(2\pi L)`,
            matlab: "q1*speed/(2*pi*L)",
            calc: (p) => (roots(p)[0] * rodSpeed(p.E * 1e9, p.rho)) / (2 * Math.PI * p.L),
            sub: (p) => `${fmt(roots(p)[0])} × √(${p.E}×10⁹/${p.rho}) / (2π×${p.L}) Hz`,
          },
        ],
        hints: [
          "先求细棒波速；端点质量改变了频率方程，不能直接用四分之一波长公式。",
          "在 0 < q < $\\pi/2$ 解 $q\\tan q = \\rho SL/M$，再将 q 换成频率。",
        ],
        judgment: (p) =>
          `负载使第一阶频率低于无端部质量的 ${fmt(rodSpeed(p.E * 1e9, p.rho) / (4 * p.L))} Hz；安装传感器的质量不应忽略。`,
        plot: (p) => working(graph(p), roots(p)[0], Math.tan(roots(p)[0])),
      },
    ],
    engineering: {
      text: "测量探头或端部配重会改变细棒的边界条件和固有频率。使用细棒近似时还应检查截面尺寸相对波长足够小，避免将三维体波速度直接用于一维棒模型。",
      href: "#/cases?project=ultrasound",
      title: "超声无损检测",
    },
  },
);
