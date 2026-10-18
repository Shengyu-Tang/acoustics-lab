import { e343 } from "../../plot/p2Examples";
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
export default p2Lecture("3.4.3", {
  defaults: p,
  parameters: [params.pa, params.f, params.rho, params.c],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "正向谐和平面行波的声压和质点振速具有相同波形并且同相，二者比值是特性阻抗。",
    "等相位面与波阵面描述相同的相位几何；平面行波的等相位面为平面。",
    "声压和质点振速的等相位面具有相同的相速度，等于波的传播速度；质点自身振速一般远小于它。",
  ],
  formulas: [
    {
      number: "3.4.3-1",
      tex: String.raw`u(x,t)=\frac{p_a}{\rho_0c_0}\cos(\omega t-kx),\quad p/u=\rho_0c_0`,
      meaning: "声压以 Pa、振速以 m/s 表示，分别使用固定的左右纵轴；空间和时间轴使用 m 和 s。",
    },
    {
      number: "3.4.3-2",
      tex: String.raw`v_{\rm ph}=\left.\frac{dx}{dt}\right|_{\omega t-kx}=\frac\omega k=c_0`,
      meaning: "固定相位的面向前走，而介质质点只局部振动。",
    },
  ],
  figures: [
    figure(
      "3.4.3-1",
      "三个时刻的声压与振速空间分布",
      (p, t) =>
        [0, 0.2, 0.4].map((dt, i) =>
          graph(
            p,
            t,
            `t${i + 1} = 当前时间 + ${dt}T`,
            "位置 x (m)",
            "声压 p (Pa)",
            [0, 2],
            [-320, 320],
            [
              curve(
                "声压 p",
                (x) => p.pa * Math.cos(2 * Math.PI * (p.f * t + dt - (p.f * x) / p.c)),
                [0, 2],
                "linspace(0,2,401)",
                `pa*cos(tau+2*pi*${dt}-k*x)`,
              ),
              {
                ...curve(
                  "振速 u",
                  (x) =>
                    (p.pa / (p.rho * p.c)) *
                    Math.cos(2 * Math.PI * (p.f * t + dt - (p.f * x) / p.c)),
                  [0, 2],
                  "linspace(0,2,401)",
                  `pa/Z*cos(tau+2*pi*${dt}-k*x)`,
                  "--",
                ),
                axis: "right",
              },
            ],
            "",
            { rightLabel: "振速 u (m/s)", rightLim: [-2, 2] },
            { rightLim: "[-2 2]" },
          ),
        ),
      3,
    ),
    figure(
      "3.4.3-2",
      "三个位置的声压与振速时间波形",
      (p) =>
        [0, 0.25, 0.5].map((loc, i) =>
          graph(
            p,
            0,
            `位置 x${i + 1} = ${loc} m`,
            "时间 t (s)",
            "声压 p (Pa)",
            [0, 0.002],
            [-320, 320],
            [
              curve(
                "声压 p",
                (x) => p.pa * Math.cos(2 * Math.PI * (p.f * x - (p.f * loc) / p.c)),
                [0, 0.002],
                "linspace(0,.002,401)",
                `pa*cos(w*x-k*${loc})`,
              ),
              {
                ...curve(
                  "振速 u",
                  (x) =>
                    (p.pa / (p.rho * p.c)) * Math.cos(2 * Math.PI * (p.f * x - (p.f * loc) / p.c)),
                  [0, 0.002],
                  "linspace(0,.002,401)",
                  `pa/Z*cos(w*x-k*${loc})`,
                  "--",
                ),
                axis: "right",
              },
            ],
            "",
            { rightLabel: "振速 u (m/s)", rightLim: [-2, 2] },
            { rightLim: "[-2 2]" },
          ),
        ),
      3,
    ),
  ],
  readouts: (p) => [
    ["声压峰值", p.pa, "Pa"],
    ["质点振速峰值", p.pa / (p.rho * p.c), "m/s"],
    ["p/u（特性阻抗）", p.rho * p.c, "Pa·s/m"],
    ["共同相速度", p.c, "m/s"],
  ],
  readoutModel: "[pa pa/Z Z c]",
  examples: [
    example(
      "例题　水听器与振速探头的互校",
      "水中平面行波声压峰值 100 Pa，密度 1000 kg/m³、声速 1500 m/s，频率 2 kHz。由声压求振速峰值与传播一个周期的距离，比较局部运动和波前运动。",
      { ...p, pa: 100, rho: 1000, c: 1500, f: 2000 },
      [params.pa, params.rho, params.c, params.f],
      [
        ask(
          "velocity",
          "(1) 振速峰值",
          "m/s",
          String.raw`u_a=p_a/(\rho_0c_0)`,
          "pa/(rho*c)",
          (p) => p.pa / (p.rho * p.c),
          (p) => `${p.pa} Pa ÷ (${p.rho} kg/m³ × ${p.c} m/s)`,
        ),
        ask(
          "travel",
          "(2) 波前一周期传播距离",
          "m",
          String.raw`d=c_0T=c_0/f`,
          "c/f",
          (p) => p.c / p.f,
          (p) => `${p.c} m/s ÷ ${p.f} Hz`,
        ),
      ],
      () => "局部振速很小，等相位面仍按介质声速传播；校准还须确认无明显反向波。",
      (p) => e343(p),
    ),
  ],
  answers: [
    "同一时刻具有相同相位的点所构成的面。",
    "对本课的谐和行波，均指等相位面；更一般的瞬态波前需另作定义。",
    "保持相位不变的几何面沿法向移动的速度。",
    "垂直于传播方向的平面。",
    "令相位微分为零，得到沿传播方向的位置变化率等于角频率除以波数。",
    "二者相同，都等于介质中该平面行波的传播速度。",
  ],
  engineering: engineering(
    "互校压力与振速传感器时，必须检查局部场是否接近平面行波，以及两通道相位和幅值标定是否一致。",
    "receiver",
    "水下监听接收器选型",
  ),
});
