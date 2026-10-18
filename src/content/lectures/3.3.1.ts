import {
  p2Lecture,
  defaults,
  params,
  figure,
  graph,
  curve,
  example,
  ask,
  answerCurve,
  engineering,
} from "../p2";
import { acousticEnergy, planeQuantities } from "../../physics/chapter3";
const p = { ...defaults, standing: 0 };
export default p2Lecture("3.3.1", {
  defaults: p,
  parameters: [params.pa, params.rho, params.c, params.f],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  interactive: {
    selectors: [
      {
        key: "standing",
        label: "波场类型",
        options: ["单向行波", "等幅双向驻波（每列波具有给定峰值）"],
      },
    ],
  },
  keyPoints: [
    "声能量密度是声场单位体积介质所具有的机械能，单位 $\\mathrm{J/m^3}$。",
    "质点运动产生声动能，介质压缩形变产生声势能，两者之和是总声能量密度。",
    "单向平面行波的声动能与声势能逐点相等；驻波中二者随位置和时间此消彼长，局部能量还可流动。",
  ],
  formulas: [
    {
      number: "3.3.1-1",
      tex: String.raw`E_k=\frac12\rho_0u^2,\quad E_p=\frac{p^2}{2\rho_0c_0^2},\quad E_0=E_k+E_p`,
      meaning: "使用实际瞬时声压与振速，不对复数直接平方。",
    },
    {
      number: "3.3.1-2",
      tex: String.raw`\overline E_0=\frac{p_a^2}{2\rho_0c_0^2}=\frac{p_{\rm rms}^2}{\rho_0c_0^2}\quad\text{（单向行波）}`,
      meaning: "时间平均总能量与峰值声压的平方成正比。",
    },
  ],
  figures: [
    figure("3.3.1-1", "行波与驻波的动能、势能和总能量", (p, t) => {
      const energies = (r: number) => {
        const a = 2 * Math.PI * p.f * t,
          b = 2 * Math.PI * r;
        return acousticEnergy(
          p.standing ? 2 * p.pa * Math.cos(b) * Math.cos(a) : p.pa * Math.cos(a - b),
          p.standing
            ? ((2 * p.pa) / (p.rho * p.c)) * Math.sin(b) * Math.sin(a)
            : (p.pa / (p.rho * p.c)) * Math.cos(a - b),
          p.rho,
          p.c,
        );
      };
      const max = ((1 + p.standing) * p.pa * p.pa) / (p.rho * p.c * p.c);
      return [
        graph(
          p,
          t,
          "瞬时能量分布；同一峰值刻度比较两种波场",
          "位置 x/λ（—）",
          "能量密度 (J/m³)",
          [0, 2],
          [0, max * 1.4],
          [
            ...(["kinetic", "potential", "total"] as const).map((key, i) =>
              curve(
                ["声动能 Eₖ", "声势能 Eₚ", "总能量 E₀"][i],
                (r) => {
                  const e = energies(r);
                  return key === "total" ? e.kinetic + e.potential : e[key];
                },
                [0, 2],
                "linspace(0,2,401)",
                ["rho*uv.^2/2", "pv.^2/(2*rho*c^2)", "rho*uv.^2/2+pv.^2/(2*rho*c^2)"][i],
                i === 1 ? "--" : "-",
              ),
            ),
          ],
          "r=linspace(0,2,401);pv=(1-standing)*pa*cos(tau-2*pi*r)+standing*2*pa*cos(2*pi*r)*cos(tau);uv=(1-standing)*pa/Z*cos(tau-2*pi*r)+standing*2*pa/Z*sin(2*pi*r)*sin(tau);",
          {},
          { ylim: "[0 (1+standing)*1.4*pa^2/(rho*c^2)]" },
        ),
      ];
    }),
  ],
  readouts: (p) => [
    ["单列行波平均总能量", planeQuantities(p.pa, p.f, p.rho, p.c).energy, "J/m³"],
    ["当前波场声强", p.standing ? 0 : p.pa ** 2 / (2 * p.rho * p.c), "W/m²"],
  ],
  readoutModel: "[pa^2/(2*rho*c^2) (1-standing)*pa^2/(2*Z)]",
  examples: [
    example(
      "例题　舱内平面行波的储能",
      "舱内局部近似为空气平面行波，声压峰值为 2 Pa，密度 1.21 kg/m³、声速 343 m/s。计算时间平均动能密度和总能量密度，估计局部储能水平。",
      { ...p, pa: 2 },
      [params.pa, params.rho, params.c],
      [
        ask(
          "kinetic",
          "(1) 平均动能密度",
          "J/m³",
          String.raw`\overline E_k=p_a^2/(4\rho_0c_0^2)`,
          "pa^2/(4*rho*c^2)",
          (p) => p.pa ** 2 / (4 * p.rho * p.c ** 2),
          (p) => `${p.pa}² Pa² ÷ (4 × ${p.rho} kg/m³ × ${p.c}² m²/s²)`,
        ),
        ask(
          "total",
          "(2) 平均总能量密度",
          "J/m³",
          String.raw`\overline E_0=2\overline E_k`,
          "2*kinetic",
          (p) => p.pa ** 2 / (2 * p.rho * p.c ** 2),
          (p) => `2 × ${p.pa ** 2 / (4 * p.rho * p.c ** 2)} J/m³`,
        ),
      ],
      () => "储能与净传能是不同量，驻波也可储能而平均声强为零。",
      (p) =>
        answerCurve(
          p,
          "pa",
          "声压峰值",
          "Pa",
          (q) => q.pa ** 2 / (2 * q.rho * q.c ** 2),
          "x.^2/(2*rho*c^2)",
        ),
    ),
  ],
  answers: ["称声动能，来自介质质点的局部运动。", "称声势能，来自介质压缩和膨胀所储存的弹性能。"],
  engineering: engineering(
    "封闭舱室中的强驻波可有高声压和储能；降噪评估不能只依据穿过某个截面的净声强。",
  ),
});
