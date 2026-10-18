import { lecture, parameter, fmt, type Values } from "../p1";
import { stringSpeed, stringElement } from "../../physics/chapter2";
import { panel, line, extent, working, arrow, segment } from "../../plot/p1Helpers";
import { sample } from "../../plot/types";
const tension = parameter("T", "张力", "T", "N", 20, 300, 1),
  density = parameter("mu", "线密度", "ρ_l", "kg/m", 0.0001, 0.005, 0.0001),
  length = parameter("L", "弦长", "L", "m", 0.3, 1.5, 0.01);
const defaults = { T: 70, mu: 0.0004, L: 0.65, height: 0.015, F0: 0.05, boundary: 0 };
export default lecture(
  "2.1",
  [
    "小振幅保证弦斜率远小于 1，$\\sin\\theta \\approx \\tan\\theta \\approx \\partial y/\\partial x$、$\\cos\\theta \\approx 1$，张力近似不变且运动主要为横向；超出此条件时横纵向耦合及非线性张力变化不可忽略。",
  ],
  {
    defaults,
    parameters: [
      tension,
      density,
      length,
      parameter("height", "初始挠度", "h", "m", -0.02, 0.02, 0.001),
      parameter("F0", "端点激励力幅值", "F₀", "N", 0.01, 0.2, 0.01),
    ],
    controls: "string-boundary",
    animation: true,
    animationPeriod: (p) => ((p.boundary === 0 ? 2 : 6) * p.L) / stringSpeed(p.T, p.mu),
    boundaryEquations: [
      String.raw`y(0,t)=0,\quad y(L,t)=0`,
      String.raw`y(0,t)=0,\quad T\partial_x y(L,t)=F_0\cos\omega t`,
      String.raw`y(0,t)=0,\quad y(L,t)=h\cos\omega t`,
      String.raw`y(0,t)=0,\quad \partial_t y(L,t)=0.1\cos\omega t\ \mathrm{m/s}`,
    ],
    keyPoints: [
      "张紧柔软弦在小振幅、张力近似恒定条件下作横向振动。",
      "微元两端张力的横向分量之差提供横向加速度，由此得到弦的横振动方程。",
      "横波速度 $c = \\sqrt{T/\\rho_l}$，分离变量后系数由初值和边界确定。",
      "固定、外力、位移、振速激励对应四种不同边界方程。",
    ],
    formulas: [
      {
        number: "2.1-1",
        tex: String.raw`\rho_l\,dx\,\partial_t^2y=T[\partial_xy(x+dx,t)-\partial_xy(x,t)]`,
        meaning: "横向分力差来自弦的曲率，小振幅近似将张力的水平分量视为常数。",
      },
      {
        number: "2.1-2",
        tex: String.raw`\partial_t^2 y=c^2\partial_x^2y,\quad c=\sqrt{T/\rho_l}`,
        meaning: "$\\rho_l$ 是线密度（kg/m），不是体密度。",
      },
      {
        number: "2.1-3",
        tex: String.raw`y(x,t)=\sum_k[A_k\cos kx+B_k\sin kx][C_k\cos\omega_kt+D_k\sin\omega_kt],\quad \omega_k=ck`,
        meaning: "右端边界可切换；非固定边界的演示取 $kL = \\pi/3$，避免共振奇点。",
      },
    ],
    figures: [
      {
        number: "2.1-1",
        title: "弦微元受力（可拖动弦形）",
        rows: 1,
        cols: 1,
        plot: (p, t) => {
          const h = p.height * Math.cos(((Math.PI * stringSpeed(p.T, p.mu)) / p.L) * t),
            e = stringElement(p.T, p.L, h),
            y = (x: number) => h * Math.sin((Math.PI * x) / p.L);
          return [
            panel(
              "微元张力与横向合力（箭头示意）",
              "位置 x (m)",
              "横向位移 y (m)",
              [0, 1.5],
              [-0.1, 0.1],
              [
                { name: "弦形", points: sample(y, 0, p.L) },
                segment("微元 dx", sample(y, 0.4 * p.L, 0.6 * p.L, 21)),
                arrow(
                  "左端张力 T₁",
                  [0.4 * p.L, y(0.4 * p.L)],
                  [0.15 * p.L, y(0.4 * p.L) - e.slopes[0] * 0.25 * p.L],
                  0.1,
                ),
                arrow(
                  "右端张力 T₂",
                  [0.6 * p.L, y(0.6 * p.L)],
                  [0.85 * p.L, y(0.6 * p.L) + e.slopes[1] * 0.25 * p.L],
                  0.1,
                ),
                arrow(
                  "横向合力（放大）",
                  [0.5 * p.L, h],
                  [0.5 * p.L, h + (e.netY / p.T) * 0.2],
                  0.1,
                ),
              ],
            ),
          ];
        },
      },
      {
        number: "2.1-2",
        title: "四种边界条件与对应弦形",
        rows: 1,
        cols: 1,
        plot: (p, t) => {
          const c = stringSpeed(p.T, p.mu),
            k = (p.boundary === 0 ? Math.PI : Math.PI / 3) / p.L,
            w = c * k;
          const y = (x: number) => {
            const r = x / p.L;
            return p.boundary === 0
              ? p.height * Math.sin(Math.PI * r) * Math.cos(w * t)
              : p.boundary === 1
                ? (p.F0 / (p.T * k * Math.cos(k * p.L))) * Math.sin(k * p.L * r) * Math.cos(w * t)
                : p.boundary === 2
                  ? ((p.height * Math.sin(k * p.L * r)) / Math.sin(k * p.L)) * Math.cos(w * t)
                  : (((0.1 / w) * Math.sin(k * p.L * r)) / Math.sin(k * p.L)) * Math.sin(w * t);
          };
          return [
            {
              ...panel(
                [
                  "两端固定",
                  "左端固定，右端力激励",
                  "左端固定，右端位移激励",
                  "左端固定，右端振速激励",
                ][p.boundary],
                "位置 x (m)",
                "横向位移 y (m)",
                [0, 1.5],
                [-0.04, 0.04],
                [
                  { name: "弦形", points: sample(y, 0, p.L) },
                  {
                    name: "Force boundary comparison",
                    style: "--",
                    points: sample(
                      (x) => {
                        const k = Math.PI / (3 * p.L);
                        return (
                          ((p.F0 * Math.sin(k * x)) / (p.T * k * Math.cos(k * p.L))) *
                          Math.cos(c * k * t)
                        );
                      },
                      0,
                      p.L,
                    ),
                  },
                  {
                    name: "端点",
                    points: [
                      [0, 0],
                      [p.L, y(p.L)],
                    ],
                    marker: "o",
                    style: "none",
                  },
                ],
              ),
              legend: false,
            },
          ];
        },
      },
    ],
    readouts: (p) => {
      const e = stringElement(p.T, p.L, p.height);
      return [
        ["横波速度 c", stringSpeed(p.T, p.mu), "m/s"],
        ["初始左端张力横向分量", e.leftY, "N"],
        ["初始右端张力横向分量", e.rightY, "N"],
        ["初始微元横向合力", e.netY, "N"],
        ["最大初始斜率", (Math.abs(p.height) * Math.PI) / p.L, "—"],
      ];
    },
    examples: [
      {
        title: "例题　吉他弦的传播速度与传播时间",
        background:
          "吉他弦张力为 70 N，线密度为 0.0004 kg/m，有效长度为 0.65 m。拨动产生的扰动沿弦传播，求横波速度和单程传播时间，用于估计端点反射何时返回。",
        defaults,
        given: [tension, density, length],
        asks: [
          {
            key: "speed",
            text: "(1) 弦上横波速度",
            unit: "m/s",
            tex: String.raw`c=\sqrt{T/\rho_l}`,
            matlab: "sqrt(T/mu)",
            calc: (p) => stringSpeed(p.T, p.mu),
            sub: (p) => `√[${p.T} N / (${p.mu} kg/m)]`,
          },
          {
            key: "travelTime",
            text: "(2) 单程传播时间",
            unit: "s",
            tex: String.raw`t=L/c=L\sqrt{\rho_l/T}`,
            matlab: "L*sqrt(mu/T)",
            calc: (p) => p.L / stringSpeed(p.T, p.mu),
            sub: (p) => `${p.L} m × √[${p.mu} kg/m / (${p.T} N)]`,
          },
        ],
        hints: [
          "先用张力与线密度求横波速度，再用路程除以波速。",
          "注意线密度单位 kg/m，单程为 L，往返时间应乘 2。",
        ],
        judgment: (p) =>
          `往返反射时间约 ${fmt(((2 * p.L) / stringSpeed(p.T, p.mu)) * 1000)} ms，扰动会很快形成多次反射与驻波。`,
        plot: (p) => {
          const end = extent(p.T * 2),
            A = stringSpeed(end, p.mu);
          return working(
            panel(
              "横波速度随张力变化",
              "张力 T (N)",
              "横波速度 c (m/s)",
              [0, end],
              [0, A * 1.7],
              [line("c = √(T/ρ_l)", (T) => stringSpeed(T, p.mu), end)],
            ),
            p.T,
            stringSpeed(p.T, p.mu),
          );
        },
      },
    ],
    engineering: {
      text: "吉他与古筝调音通过改变张力调整传播速度。推导弦方程前应确认弦足够柔软、横向斜率足够小，并区分固定端与演奏者持续驱动的边界。",
      href: "#/cases?project=music",
      title: "乐器与琴弦设计",
    },
  },
);
