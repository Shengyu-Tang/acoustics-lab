import { models, freeX, pistonD, reflection, result, type Values } from "../physics";
import { forcedTrace } from "../animationPhysics";
import { dopplerFronts, interfacePressure } from "../fieldPhysics";
import { sample, type Panel, type Series } from "./types";
const pi = Math.PI;
/** Shared plot descriptions for the existing model library; lecture-specific additions follow in P1–P4. */
export function legacyPanels(kind: string, v: Values, time: number): Panel[] {
  const base: Panel = {
    title: models[kind].title,
    xlabel: "位置 x (m)",
    ylabel: "归一化响应 (1)",
    xlim: [0, 1],
    ylim: [-1.2, 1.2],
    series: [],
  };
  const line = (name: string, fn: (x: number) => number, min = 0, max = 1): Series => ({
    name,
    points: sample(fn, min, max, 601),
  });
  const field = (xmax: number, ymax: number, fn: (x: number, y: number) => number): Panel => {
    const x = Array.from({ length: 64 }, (_, i) => ((i + 0.5) * xmax) / 64),
      y = Array.from({ length: 32 }, (_, i) => ((i + 0.5) * ymax) / 32);
    return {
      ...base,
      xlim: [0, xmax],
      ylim: [0, ymax],
      ylabel: "位置 y (m)",
      field: {
        x,
        y,
        z: y.map((b) => x.map((a) => fn(a, b))),
        label: "声压 p/p₀ (1)",
        map: "RdBu",
        limits: [-2, 2],
      },
    };
  };
  if (["free", "energy", "damp", "quality", "forced", "undamped"].includes(kind)) {
    const forced = ["forced", "undamped"].includes(kind),
      trace = forced ? forcedTrace(v) : [],
      omega = Math.sqrt(v.k / v.m),
      amp = forced ? Math.max(0.01, ...trace.map(Math.abs)) : 0.01;
    const fn = (t: number) =>
      forced
        ? (trace[Math.min(trace.length - 1, Math.round(t / 0.002))] ?? 0)
        : freeX(v, t, kind === "damp" || kind === "quality");
    const p: Panel = {
      ...base,
      xlabel: "时间 t (s)",
      ylabel: "位移 x (m)",
      xlim: [0, 8],
      ylim: [-amp * 1.15, amp * 1.15],
      series: [line("位移", fn, 0, 8)],
      annotations: [{ axis: "x", value: time % 8, label: "当前时刻" }],
    };
    if (kind === "energy")
      return [
        p,
        {
          ...base,
          title: "机械能交换",
          xlabel: "时间 t (s)",
          ylabel: "能量 E (J)",
          xlim: [0, 8],
          ylim: [0, 0.5 * v.k * 0.01 ** 2 * 1.15],
          series: [
            line("势能", (t) => 0.5 * v.k * (0.01 * Math.cos(omega * t)) ** 2, 0, 8),
            line("动能", (t) => 0.5 * v.m * (omega * 0.01 * Math.sin(omega * t)) ** 2, 0, 8),
            line("总能量", () => 0.5 * v.k * 0.01 ** 2, 0, 8),
          ],
        },
      ];
    return [p];
  }
  if (kind === "resonance" || kind === "receiver") {
    const a = (r: number) => 1 / Math.hypot(1 - r * r, 2 * v.z * r),
      factor = kind === "receiver" ? v.M : 1;
    return [
      {
        ...base,
        xlabel: "频率比 f/f₀ (1)",
        ylabel: kind === "receiver" ? "输出电压 (mV)" : "位移 / 静位移 (1)",
        xlim: [0, 3],
        ylim: [0, factor * (1 + 1 / (2 * v.z))],
        series: [
          line("幅频响应", (r) => factor * a(r), 0, 3),
          { name: "工作点", points: [[v.ratio, factor * a(v.ratio)]], marker: "o" },
        ],
      },
    ];
  }
  if (kind === "beats")
    return [
      {
        ...base,
        xlabel: "时间 t (s)",
        xlim: [0, 0.15],
        series: [
          line(
            "合成波 / 2",
            (t) => 0.5 * (Math.cos(2 * pi * v.f1 * t) + Math.cos(2 * pi * v.f2 * t)),
            0,
            0.15,
          ),
          line("正包络", (t) => Math.abs(Math.cos(pi * (v.f1 - v.f2) * t)), 0, 0.15),
          line("负包络", (t) => -Math.abs(Math.cos(pi * (v.f1 - v.f2) * t)), 0, 0.15),
        ],
        annotations: [{ axis: "x", value: (time / 20) % 0.15, label: "当前时刻" }],
      },
    ];
  if (kind === "string" || kind === "rod") {
    const n = kind === "rod" ? v.n - 0.5 : v.n,
      frequency =
        kind === "string"
          ? (v.n * Math.sqrt(v.T / v.mu)) / (2 * v.L)
          : ((2 * v.n - 1) * Math.sqrt((v.E * 1e9) / v.rho)) / (4 * v.L),
      phase = (time * 2 * pi * frequency) / (kind === "string" ? 160 : 5000);
    return [
      {
        ...base,
        xlabel: "位置 x/L (1)",
        series: [
          line("瞬时振型", (x) => Math.sin(n * pi * x) * Math.cos(phase)),
          { ...line("振型包络", (x) => Math.sin(n * pi * x)), style: "--" },
        ],
      },
    ];
  }
  if (["wave", "continuity", "intensity", "speed"].includes(kind)) {
    const c = kind === "speed" ? Math.sqrt((v.B * 1e9) / v.rho) : v.c,
      pressure = v.P ?? 1,
      ph = (time * 2 * pi * v.f) / 500;
    return [
      {
        ...base,
        xlim: [0, 6],
        ylabel: "声压 p (Pa)",
        ylim: [-1.2 * pressure, 1.2 * pressure],
        series: [line("行波声压", (x) => pressure * Math.cos(ph - ((2 * pi * v.f) / c) * x), 0, 6)],
      },
    ];
  }
  if (kind === "levels") {
    const total = result(kind, v)[0][1];
    return [
      {
        ...base,
        xlabel: "声源序号 (1)",
        ylabel: "声压级 L (dB)",
        xlim: [0.5, 3.5],
        ylim: [0, 160],
        series: [
          {
            name: "声源1/2/合成",
            points: [
              [1, v.L1],
              [2, v.L2],
              [3, total],
            ],
            marker: "s",
          },
        ],
      },
    ];
  }
  if (kind === "interference")
    return [
      {
        ...base,
        title: `干涉：相位差 ${v.phase}°`,
        xlabel: "归一化位置 (1)",
        ylim: [-2.5, 2.5],
        series: [
          line("参考声源", (x) => Math.cos(4 * pi * x - time * 2)),
          line("第二声源", (x) => v.P2 * Math.cos(4 * pi * x - time * 2 + (v.phase * pi) / 180)),
          line(
            "合成声压",
            (x) =>
              Math.cos(4 * pi * x - time * 2) +
              v.P2 * Math.cos(4 * pi * x - time * 2 + (v.phase * pi) / 180),
          ),
        ],
      },
    ];
  if (kind === "reflection" || kind === "standing") {
    let re = 0,
      im = 0;
    if (kind === "reflection") re = reflection(v.q).r;
    else {
      const den = (v.R + 1) ** 2 + v.X * v.X;
      re = (v.R * v.R + v.X * v.X - 1) / den;
      im = (2 * v.X) / den;
    }
    return [
      {
        ...base,
        xlabel: "位置 x/λ (1)",
        xlim: [-1.5, 0.5],
        ylim: [-2.2, 2.2],
        series: [
          line(
            "合成声压",
            (x) =>
              x <= 0
                ? Math.cos(time * 3 - 4 * pi * x) +
                  re * Math.cos(time * 3 + 4 * pi * x) -
                  im * Math.sin(time * 3 + 4 * pi * x)
                : kind === "reflection"
                  ? (1 + re) * Math.cos(time * 3 - 4 * pi * x)
                  : NaN,
            -1.5,
            0.5,
          ),
        ],
        annotations: [{ axis: "x", value: 0, label: "分界面" }],
      },
    ];
  }
  if (kind === "helmholtz") {
    const k = (2 * pi * v.f) / 1500,
      a = (v.angle * pi) / 180;
    return [
      field(6, 3, (x, y) =>
        Math.cos(k * (x * Math.cos(a) + y * Math.sin(a)) - (time * 2 * pi * v.f) / 500),
      ),
    ];
  }
  if (kind === "guide") {
    const k = (2 * pi * v.f) / 1500,
      b = (v.n * pi) / v.H,
      axial = Math.sqrt(Math.abs(k * k - b * b)),
      ph = (time * 2 * pi * v.f) / 80;
    return [
      field(
        100,
        v.H,
        (x, y) =>
          Math.cos(b * y) *
          (k >= b ? Math.cos(axial * x - ph) : Math.exp(-axial * x) * Math.cos(ph)),
      ),
    ];
  }
  if (kind === "oblique") {
    const p = field(8, 6, (x, y) => interfacePressure(x - 4, y - 3, time * 2, v));
    p.xlabel = "法向坐标 x (归一化)";
    p.ylabel = "切向坐标 y (归一化)";
    return [p];
  }
  if (kind === "cylinder")
    return [
      {
        ...base,
        xlabel: "周向角 θ (rad)",
        xlim: [0, 2 * pi],
        series: [
          line("入射声压", (a) => Math.cos(time * 2 - v.ka * Math.cos(a)), 0, 2 * pi),
          line("散射声压", (a) => -Math.cos(time * 2 - v.ka * Math.cos(a)), 0, 2 * pi),
          line("边界总声压", () => 0, 0, 2 * pi),
        ],
      },
    ];
  if (["monopole", "dipole", "piston", "scatter"].includes(kind)) {
    const ka = (2 * pi * v.f * v.a) / 1500,
      max = kind === "piston" ? pi / 2 : 2 * pi;
    const fn = (a: number) =>
      kind === "dipole"
        ? Math.abs(Math.cos(a))
        : kind === "piston"
          ? Math.abs(pistonD(ka * Math.sin(a)))
          : kind === "scatter"
            ? Math.abs(0.5 * Math.cos(a) - 1 / 3) / (5 / 6)
            : 1;
    return [
      {
        ...base,
        kind: "polar",
        xlabel: "方位角 θ (°)",
        ylabel: "归一化幅值 (1)",
        ylim: [0, 1],
        series: [
          line("指向性", fn, kind === "piston" ? -pi / 2 : 0, max),
          ...(Number.isFinite(v.angle)
            ? [
                {
                  name: "观察方向",
                  points: [[(v.angle * pi) / 180, fn((v.angle * pi) / 180)] as [number, number]],
                  marker: "o" as const,
                },
              ]
            : []),
        ],
      },
    ];
  }
  if (kind === "nearfield")
    return [
      {
        ...base,
        xlabel: "轴向距离 z (m)",
        ylabel: "声压 |p|/(ρcU) (1)",
        xlim: [0.01, 3],
        ylim: [0, 2.2],
        series: [
          line(
            "轴向声压",
            (z) => 2 * Math.abs(Math.sin(((pi * v.f) / 1500) * (Math.hypot(z, v.a) - z))),
            0.01,
            3,
          ),
        ],
        annotations: [{ axis: "x", value: v.r, label: "测量点" }],
      },
    ];
  if (kind === "image")
    return [
      {
        ...base,
        xlim: [10, 100],
        ylim: [-0.3, 0.3],
        series: [
          line(
            "直达 + 镜像",
            (x) => {
              const r1 = Math.hypot(x, 10 - v.depth),
                r2 = Math.hypot(x, 10 + v.depth),
                k = (2 * pi * v.f) / 1500;
              return Math.cos(k * r1 - time * 2) / r1 + (v.sign * Math.cos(k * r2 - time * 2)) / r2;
            },
            10,
            100,
          ),
        ],
      },
    ];
  if (kind === "echo") {
    const a = (v.angle * pi) / 180;
    return [
      {
        ...base,
        xlabel: "水平位置 x (m)",
        ylabel: "水平位置 y (m)",
        xlim: [-v.R * 1.3, v.R * 1.3],
        ylim: [-v.R * 1.3, v.R * 1.3],
        series: [
          {
            name: "围墙",
            points: sample((t) => t, 0, 2 * pi).map(([a]) => [
              v.R * Math.cos(a),
              v.R * Math.sin(a),
            ]),
          },
          {
            name: "沿壁路径",
            points: sample((t) => t, 0, a).map(([a]) => [v.R * Math.cos(a), v.R * Math.sin(a)]),
          },
          {
            name: "直达路径",
            points: [
              [v.R, 0],
              [v.R * Math.cos(a), v.R * Math.sin(a)],
            ],
          },
        ],
      },
    ];
  }
  if (kind === "doppler") {
    const d = dopplerFronts(v.f, v.v, time / 500);
    return [
      {
        ...base,
        xlabel: "位置 x (m)",
        ylabel: "位置 y (m)",
        xlim: [-12, 12],
        ylim: [-12, 12],
        legend: false,
        series: d.fronts.map((f) => ({
          name: "波前",
          points: sample((t) => t, 0, 2 * pi, 81).map(([a]) => [
            f.center + f.radius * Math.cos(a),
            f.radius * Math.sin(a),
          ]),
        })),
      },
    ];
  }
  if (kind === "reciprocity")
    return [
      {
        ...base,
        xlabel: "传播距离 r (m)",
        ylabel: "归一化传递幅值 (1/m)",
        xlim: [1, 50],
        ylim: [0, 1.1],
        series: [
          line("A → B", (r) => 1 / r, 1, 50),
          { ...line("B → A", (r) => 1 / r, 1, 50), style: "--" },
        ],
        annotations: [{ axis: "x", value: v.r, label: "当前距离" }],
      },
    ];
  if (kind === "sonar")
    return [
      {
        ...base,
        xlabel: "距离 r (m)",
        ylabel: "信号余量 SE (dB)",
        xlim: [100, 10000],
        ylim: [-100, 100],
        series: [line("信号余量", (r) => result(kind, { ...v, r })[1][1], 100, 10000)],
        annotations: [
          { axis: "y", value: 0, label: "检测阈值" },
          { axis: "x", value: v.r, label: "当前距离" },
        ],
      },
    ];
  const spherical = kind === "spherical",
    cylindrical = kind === "cylindrical",
    min = spherical ? 1 : cylindrical ? 10 : 0,
    max = spherical ? 100 : cylindrical ? 1000 : kind === "mechanism" ? 100 : 1000;
  const alpha =
    kind === "mechanism"
      ? 0.001 * (v.ratio ** 2 + (v.beta * v.ratio ** 2) / (1 + v.ratio ** 2))
      : (v.alpha ?? 0);
  const env = (x: number) =>
    spherical ? 1 / x : cylindrical ? Math.sqrt(10 / x) : Math.exp(-alpha * x);
  return [
    {
      ...base,
      xlim: [min, max],
      series: [
        line(
          "声压",
          (x) =>
            env(x) *
            Math.cos(
              (spherical ? (2 * pi * v.f * x) / 1500 : (x / max) * 10 * pi) -
                time * (spherical ? (2 * pi * v.f) / 500 : 3),
            ),
          min,
          max,
        ),
        { ...line("正包络", env, min, max), style: "--" },
        { ...line("负包络", (x) => -env(x), min, max), style: "--" },
      ],
      annotations: Number.isFinite(v.r) ? [{ axis: "x", value: v.r, label: "接收位置" }] : [],
    },
  ];
}
