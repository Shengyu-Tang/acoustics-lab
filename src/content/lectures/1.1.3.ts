import { completeExamples } from "../calculationSteps";
import { lecture, mechanics, initial, parameter, fmt, industry, type Values } from "../p1";
import { freeMotion } from "../../physics/p1";
import { panel, line, extent, working, segment } from "../../plot/p1Helpers";
const zeta = parameter("zeta", "阻尼比（大阻尼）", "δ/ω₀", "—", 1.05, 2, 0.05);
const defaults = { M: 5, D: 2000, zeta: 1.5, x0: 0.005, v0: -0.3 };
const motion = (p: Values) => ({ ...p, Rm: 2 * p.zeta * Math.sqrt(p.M * p.D) });
const roots = (p: Values) => {
  const w = Math.sqrt(p.D / p.M),
    d = p.zeta * w;
  return { w, d, s1: (-w * w) / (d + Math.sqrt(d * d - w * w)), s2: -d - Math.sqrt(d * d - w * w) };
};
const curves = (p: Values) => {
  const r = roots(p),
    end = extent(6 / -r.s1),
    data = [
      { name: "(x₀, 0)", x0: p.x0, v0: 0 },
      { name: "(0, −v₀)：先增后减", x0: 0, v0: -p.v0 },
      { name: "(x₀, v₀)", x0: p.x0, v0: p.v0 },
    ],
    series = data.map((d) =>
      line(d.name, (t) => freeMotion({ ...motion(p), x0: d.x0, v0: d.v0 }, t), end),
    ),
    ys = series.flatMap((s) => s.points.map((v) => v[1])),
    lo = Math.min(0, ...ys),
    hi = Math.max(0, ...ys),
    pad = Math.max(1e-5, (hi - lo) * 0.12);
  return panel(
    "大阻尼：三个初始条件",
    "时间 t (s)",
    "位移 x (m)",
    [0, end],
    [lo - pad, hi + pad],
    series,
  );
};
const completedLecture = lecture(
  "1.1.3",
  [
    "特征根为两个不同的负实数，解是两个衰减指数之和，不含周期项，过零不超过一次。物理上阻力很强，惯性不足以维持往复运动。",
  ],
  {
    defaults,
    parameters: [...mechanics, zeta, ...initial],
    keyPoints: [
      "黏滞阻力与速度成正比，方向与速度相反。",
      "阻尼使特征根移入左半平面；$\\delta > \\omega_0$ 时两个根都是负实数。",
      "大阻尼响应是两个指数衰减项之和，系统不发生往复振动；三类初始条件可导致单调或先增后减的运动。",
    ],
    formulas: [
      {
        number: "1.1-7",
        tex: String.raw`M\ddot x+R_m\dot x+Dx=0,\quad \delta=R_m/(2M)`,
        meaning: "牛顿黏滞阻尼模型中 Rₘ 的单位为 kg/s。",
      },
      {
        number: "1.1-8",
        tex: String.raw`s_{1,2}=-\delta\pm\sqrt{\delta^2-\omega_0^2}`,
        meaning: "根轨迹图采用 $s/\\omega_0$ 归一化，同时展示欠阻尼、临界阻尼与过阻尼区域。",
      },
      {
        number: "1.1-9",
        tex: String.raw`x(t)=\frac{v_0-s_2x_0}{s_1-s_2}e^{s_1t}+\frac{s_1x_0-v_0}{s_1-s_2}e^{s_2t}`,
        meaning: "两个不同实指数的线性组合至多过零一次。",
      },
    ],
    figures: [
      {
        number: "1.1.3-1",
        title: "大阻尼三种初始条件下的响应",
        rows: 1,
        cols: 1,
        plot: (p) => [curves(p)],
      },
      {
        number: "1.1.3-2",
        independentOf: ["M", "D", "x0", "v0"],
        dimensionlessComparison: "无量纲特征根比较：采用 $s/\\omega_0$；初始条件不决定特征根。",
        title: "阻尼从 0 到 2ω₀ 的特征根轨迹",
        rows: 1,
        cols: 1,
        plot: (p) => {
          const branch = (sign: number) =>
            Array.from({ length: 801 }, (_, i) => {
              const z = (2 * i) / 800;
              return z < 1
                ? [-z, sign * Math.sqrt(1 - z * z)]
                : [-z + sign * Math.sqrt(z * z - 1), 0];
            }) as [number, number][];
          const r = roots(p);
          return [
            panel(
              "s 平面根轨迹（δ/ω₀ = 0…2）",
              "实部 Re(s)/ω₀ (—)",
              "虚部 Im(s)/ω₀ (—)",
              [-4, 0],
              [-1.5, 1.5],
              [
                segment("根 s₁", branch(1)),
                segment("根 s₂", branch(-1)),
                { name: "临界阻尼", points: [[-1, 0]], marker: "o", style: "none" },
                {
                  name: "当前参数",
                  points: [
                    [r.s1 / r.w, 0],
                    [r.s2 / r.w, 0],
                  ],
                  marker: "x",
                  style: "none",
                },
              ],
            ),
          ];
        },
      },
    ],
    readouts: (p) => {
      const r = roots(p);
      return [
        ["阻尼系数 δ", r.d, "s⁻¹"],
        ["特征根 s₁", r.s1, "s⁻¹"],
        ["特征根 s₂", r.s2, "s⁻¹"],
        ["慢衰减时间常数", -1 / r.s1, "s"],
      ];
    },
    examples: [
      {
        title: "例题　缓冲机构的大阻尼校核",
        background:
          "仪器缓冲机构质量 5 kg、刚度 2000 N/m，设计阻尼比为 1.5。释放后应平稳回到平衡位置。计算所需力阻以及控制回位尾部的慢衰减速率。",
        defaults,
        given: [...mechanics, zeta],
        asks: [
          {
            key: "resistance",
            text: "(1) 所需力阻",
            unit: "kg/s",
            tex: String.raw`R_m=2\zeta\sqrt{MD}`,
            matlab: "2*zeta*sqrt(M*D)",
            calc: (p) => motion(p).Rm,
            sub: (p) => `2 × ${p.zeta} × √[${p.M} kg × ${p.D} N/m]`,
          },
          {
            key: "slowRate",
            text: "(2) 慢衰减速率 |s₁|",
            unit: "s⁻¹",
            tex: String.raw`|s_1|=\omega_0(\zeta-\sqrt{\zeta^2-1})`,
            matlab: "sqrt(D/M)/(zeta+sqrt(zeta^2-1))",
            calc: (p) => -roots(p).s1,
            sub: (p) => `√(${p.D}/${p.M}) / [${p.zeta} + √(${p.zeta}² − 1)] s⁻¹`,
          },
        ],
        hints: [
          "先用阻尼比求力阻；再求两个特征根。",
          "$\\delta = \\zeta\\omega_0$；绝对值较小的负实根控制长时间回位。",
        ],
        judgment: (p) =>
          `阻尼比 ${p.zeta} > 1，响应不持续振荡；慢时间常数为 ${fmt(-1 / roots(p).s1)} s，增大阻尼也可能拖慢回位。`,
        plot: (p) => working(curves(p), 0, p.x0),
      },
    ],
    engineering: industry(
      "缓冲和指针仪表常要求平稳回位。过阻尼可以避免来回振荡，但阻尼过大时慢根靠近零点，回位可能变慢，应同时检查稳定性和响应时间。",
    ),
  },
);

export default completeExamples(completedLecture);
