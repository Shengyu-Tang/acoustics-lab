import { completeExamples } from "../calculationSteps";
import { lecture, mechanics, initial, fmt, industry, type Values } from "../p1";
import { decay, freeMotion } from "../../physics/p1";
import { panel, line, extent, working, segment } from "../../plot/p1Helpers";
const defaults = { M: 2, D: 800, Rm: 0, x0: 0.005, v0: 0.08 };
const curves = (p: Values) => {
  const c = decay(p),
    end = extent(3 * c.T),
    A = Math.hypot(p.x0, p.v0 / c.w0);
  return panel(
    "初始位移与初始速度的叠加",
    "时间 t (s)",
    "位移 x (m)",
    [0, end],
    [-A * 1.8, A * 1.8],
    [
      line("初始位移分量", (t) => p.x0 * Math.cos(c.w0 * t), end, "--"),
      line("初始速度分量", (t) => (p.v0 / c.w0) * Math.sin(c.w0 * t), end, ":"),
      line("合成位移", (t) => freeMotion(p, t), end),
    ],
  );
};
const completedLecture = lecture(
  "1.1.1",
  [
    "位移是时间的正弦或余弦函数；加速度与位移成正比并反向。",
    "相同。在线性小振幅模型下，改变初始位移的正负或初始速度只改变振幅和初相，不改变由质量与弹性系数决定的固有频率。",
    "撤去外力后系统自由振动的频率称为固有频率，本模型中 $f_0 = \\sqrt{D/M}/(2\\pi)$。",
    "变慢。附加质量使总质量 M 增大，弹性系数 D 不变，固有频率 $f_0 = \\sqrt{D/M}/(2\\pi)$ 减小。",
  ],
  {
    defaults,
    parameters: [...mechanics, ...initial],
    animation: true,
    animationPeriod: (p) => decay(p).T,
    keyPoints: [
      "用质量 M、弹性系数 D 和柔顺系数 $C_M = 1/D$ 描述单自由度弹簧振子。",
      "胡克定律与牛顿定律给出自由振动方程；无阻尼自由振动是简谐振动。",
      "初始位移、初始速度确定振幅和初相；固有频率只由 M、D 决定。",
    ],
    formulas: [
      {
        number: "1.1-1",
        tex: String.raw`F_s=-Dx,\quad C_M=1/D,\quad M\ddot x+Dx=0`,
        meaning: "位移从静平衡位置计量，重力已包含在静变形中。",
      },
      {
        number: "1.1-2",
        tex: String.raw`\omega_0=\sqrt{D/M},\quad f_0=\omega_0/(2\pi),\quad T=2\pi/\omega_0`,
        meaning: "线性模型中频率不依赖振幅。",
      },
      {
        number: "1.1-3",
        tex: String.raw`x=x_0\cos\omega_0t+\frac{v_0}{\omega_0}\sin\omega_0t=A\cos(\omega_0t+\varphi),\quad A=\sqrt{x_0^2+(v_0/\omega_0)^2},\quad\varphi=\operatorname{atan2}(-v_0/\omega_0,x_0)`,
        meaning: "初相采用余弦表示，时间因子为 $e^{j\\omega t}$。",
      },
    ],
    figures: [
      {
        number: "1.1.1-1",
        title: "弹簧振子与初始条件的叠加",
        rows: 1,
        cols: 2,
        plot: (p, t) => {
          const c = decay(p),
            A = Math.max(0.001, Math.hypot(p.x0, p.v0 / c.w0)),
            pos = 1 + freeMotion(p, t);
          return [
            panel(
              "弹簧振子示意（慢放）",
              "水平示意坐标 (m)",
              "竖直示意坐标 (m)",
              [0, 2],
              [-1, 1],
              [
                segment("固定端", [
                  [0.1, -0.5],
                  [0.1, 0.5],
                ]),
                segment(
                  "弹簧 D",
                  Array.from({ length: 17 }, (_, i) => [
                    0.1 + ((pos - 0.3) * i) / 16,
                    i === 0 || i === 16 ? 0 : i % 2 ? 0.12 : -0.12,
                  ]),
                ),
                segment("质量 M", [
                  [pos - 0.2, -0.2],
                  [pos + 0.2, -0.2],
                  [pos + 0.2, 0.2],
                  [pos - 0.2, 0.2],
                  [pos - 0.2, -0.2],
                ]),
              ],
            ),
            curves(p),
          ];
        },
      },
    ],
    readouts: (p) => {
      const c = decay(p);
      return [
        ["固有频率 f₀", c.f0, "Hz"],
        ["周期 T", c.T, "s"],
        ["振幅 A", Math.hypot(p.x0, p.v0 / c.w0), "m"],
        ["初相 φ", Math.atan2(-p.v0 / c.w0, p.x0), "rad"],
      ];
    },
    examples: [
      {
        title: "例题　仪器支架释放后的振动",
        background:
          "支架等效质量为 2 kg，静平衡附近弹性系数为 800 N/m。释放时有 5 mm 位移和 0.08 m/s 速度。确定固有频率与最大行程，供安装间隙校核。",
        defaults,
        given: [...mechanics, ...initial],
        asks: [
          {
            key: "f0",
            text: "(1) 固有频率",
            unit: "Hz",
            tex: String.raw`f_0=\frac{1}{2\pi}\sqrt{D/M}`,
            matlab: "sqrt(D/M)/(2*pi)",
            calc: (p) => decay(p).f0,
            sub: (p) => `√(${p.D}/${p.M})/(2π) Hz`,
          },
          {
            key: "amplitude",
            text: "(2) 位移振幅",
            unit: "m",
            tex: String.raw`A=\sqrt{x_0^2+Mv_0^2/D}`,
            matlab: "sqrt(x0^2+M*v0^2/D)",
            calc: (p) => Math.hypot(p.x0, p.v0 / decay(p).w0),
            sub: (p) => `√[(${p.x0} m)² + (${p.v0} m/s)² × ${p.M} kg / (${p.D} N/m)]`,
          },
        ],
        hints: [
          "先用 M、D 求固有角频率；用两项正交初始分量求振幅。",
          "将毫米换为米，再计算 $A^2 = x_0^2 + Mv_0^2/D$。",
        ],
        judgment: (p) =>
          `最大单边行程 ${fmt(Math.hypot(p.x0, p.v0 / decay(p).w0) * 1000)} mm，安装间隙应留有余量。`,
        plot: (p) => working(curves(p), 0, p.x0),
      },
    ],
    engineering: industry(
      "精密仪器支架受到一次碰撞后自由振动。先由质量与刚度估算频率，再由实际释放条件估算行程，可用于确定传感器量程与机械限位间隙。",
    ),
  },
);

export default completeExamples(completedLecture);
