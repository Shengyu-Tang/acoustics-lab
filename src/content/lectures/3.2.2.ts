import { completeExamples } from "../calculationSteps";
import { e322 } from "../../plot/p2Examples";
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
import { potential } from "../../physics/chapter3";
const p = { ...defaults, spherical: 0 };
const completedLecture = p2Lecture("3.2.2", {
  defaults: p,
  parameters: [params.pa, params.f, params.rho, params.c],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  interactive: {
    selectors: [
      {
        key: "spherical",
        label: "速度势解",
        options: ["平面行波", "球面行波（1 m 处为给定压力峰值）"],
      },
    ],
  },
  keyPoints: [
    "无旋运动可由一个标量速度势表示，质点振速等于其负梯度。",
    "由运动方程可得声压等于静态密度乘速度势的时间导数，时间常数取入静态基准。",
    "速度势与声压满足相同形式的波动方程；均匀介质中密度逾量和压缩量也满足该方程。",
  ],
  formulas: [
    {
      number: "3.2.2-1",
      tex: String.raw`\mathbf u=-\nabla\Psi,\quad p=\rho_0\partial_t\Psi`,
      meaning: "本页用 PPT 的符号 Ψ 表示速度势；它是标量而速度是矢量。",
    },
    {
      number: "3.2.2-2",
      tex: String.raw`\nabla^2q-c_0^{-2}\partial_t^2q=0,\quad q\in\{\Psi,\rho',s\}`,
      meaning: "三个量在均匀静止的小振幅条件下具有相同的线性传播算子。",
    },
    {
      number: "3.2.2-3",
      tex: String.raw`\Psi_{\rm plane}=\frac{p_a}{\rho_0\omega}\sin(\omega t-kr),\quad\Psi_{\rm sphere}=\frac{p_a r_0}{\rho_0\omega r}\sin(\omega t-kr),\quad r_0=1\,\mathrm m`,
      meaning: "球面解在原点之外成立，空间微分时必须同时微分振幅中的半径。",
    },
  ],
  figures: [
    figure(
      "3.2.2-1",
      "由速度势同时求出声压和振速",
      (p, t) => {
        const scalars = [
          (p.pa / (p.rho * 2 * Math.PI * p.f)) * (1 + p.spherical),
          p.pa * (1 + p.spherical),
          (p.pa / (p.rho * p.c)) *
            (1 + p.spherical) *
            Math.sqrt(1 + p.spherical * (p.c / (Math.PI * p.f)) ** 2),
        ];
        return ["phi", "p", "u"].map((key, i) =>
          graph(
            p,
            t,
            ["速度势 Ψ", "声压 p", "径向振速 u_r"][i],
            "距离 r (m)",
            ["速度势 (m²/s)", "声压 (Pa)", "振速 (m/s)"][i],
            [0.5, 2.5],
            [-1.6 * scalars[i], 1.6 * scalars[i]],
            [
              curve(
                ["Ψ", "p = ρ₀ ∂Ψ/∂t", "u_r = −∂Ψ/∂r"][i],
                (r) =>
                  potential(r, t, p.pa, p.f, p.rho, p.c, Boolean(p.spherical))[
                    key as "phi" | "p" | "u"
                  ],
                [0.5, 2.5],
                "linspace(.5,2.5,401)",
                [
                  "pa/(rho*w)*x.^(-spherical).*sin(tau-k*x)",
                  "pa*x.^(-spherical).*cos(tau-k*x)",
                  "pa/(rho*w)*x.^(-spherical).*(k*cos(tau-k*x)+spherical*sin(tau-k*x)./x)",
                ][i],
              ),
            ],
            "",
            { legend: false },
            {
              ylim: [
                "[-1.6 1.6]*pa/(rho*w)*(1+spherical)",
                "[-1.6 1.6]*pa*(1+spherical)",
                "[-1.6 1.6]*pa/Z*(1+spherical)*sqrt(1+spherical*(2/k)^2)",
              ][i],
            },
          ),
        );
      },
      3,
    ),
  ],
  readouts: (p) => {
    const v = potential(1, 0, p.pa, p.f, p.rho, p.c, Boolean(p.spherical));
    return [
      ["1 m 处速度势", v.phi, "m²/s"],
      ["1 m 处声压", v.p, "Pa"],
      ["1 m 处径向振速", v.u, "m/s"],
    ];
  },
  readoutModel: "[pa/(rho*w)*sin(-k) pa*cos(-k) pa/(rho*w)*(k*cos(-k)+spherical*sin(-k))]",
  examples: [
    example(
      "例题　由水声平面波速度势求量程",
      "水中 2 kHz 平面波的声压峰值为 100 Pa，密度 1000 kg/m³、声速 1500 m/s。计算速度势幅值和振速峰值，为数值声场的变量归一化选择尺度。",
      { ...p, pa: 100, f: 2000, rho: 1000, c: 1500 },
      [params.pa, params.f, params.rho, params.c],
      [
        ask(
          "phiAmplitude",
          "(1) 速度势幅值",
          "m²/s",
          String.raw`\Psi_a=p_a/(\rho_0\omega)`,
          "pa/(rho*w)",
          (p) => p.pa / (p.rho * 2 * Math.PI * p.f),
          (p) => `${p.pa} Pa ÷ (${p.rho} kg/m³ × 2π × ${p.f} Hz)`,
        ),
        ask(
          "velocity",
          "(2) 振速峰值",
          "m/s",
          String.raw`u_a=k\Psi_a`,
          "k*phiAmplitude",
          (p) => p.pa / (p.rho * p.c),
          (p) => `${(2 * Math.PI * p.f) / p.c} rad/m × ${p.pa / (p.rho * 2 * Math.PI * p.f)} m²/s`,
        ),
      ],
      () => "求导时保留相位；若改成球面波，还需要近场的半径导数项。",
      (p) => e322(p),
    ),
  ],
  answers: [
    "标量函数，其梯度给出矢量振速。",
    "在理想均匀静止小振幅条件下，三者具有相同形式的波动方程，但物理单位和初始、边界条件不同。",
    "对时间求导再乘静态密度得到声压；取负空间梯度得到质点振速。",
  ],
  engineering: engineering(
    "用一个速度势标量可简化无旋声场计算，但球面近场的速度不能仅用声压除以特性阻抗求出。",
    "sonar",
    "海底观测站主动声呐",
  ),
});

export default completeExamples(completedLecture);
