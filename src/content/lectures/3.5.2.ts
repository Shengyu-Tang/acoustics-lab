import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  points,
  example,
  ask,
  answerCurve,
  engineering,
} from "../p2";
import { waveVector } from "../../physics/chapter3";
import { arrow } from "../../plot/p1Helpers";
const azimuth = parameter("azimuth", "方位角", "φ", "°", -180, 180, 1),
  elevation = parameter("elevation", "俯仰角", "θ", "°", -80, 80, 1),
  wavecount = parameter("wavecount", "平面波列数", "N", "—", 2, 4, 1);
const angles = [1, 2, 3, 4].map((i) =>
  parameter(`a${i}`, `第 ${i} 列波方位角`, `φ${i}`, "°", -180, 180, 1),
);
const p = {
  ...defaults,
  azimuth: 60,
  elevation: 25,
  wavecount: 3,
  a1: 0,
  a2: 60,
  a3: 120,
  a4: -45,
};
const projection = (v: number[]): [number, number] => [v[0] + 0.45 * v[1], v[2] + 0.3 * v[1]];
export default p2Lecture("3.5.2", {
  defaults: p,
  parameters: [params.f, params.c, azimuth, elevation, { ...wavecount, integer: true }, ...angles],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "矢量波数由三个坐标分量组成，实矢量的模等于总波数，方向是均匀平面波的传播方向。",
    "任意方向谐和平面波的相位由波数矢量与位置矢量的内积决定，等相位面垂直于波数矢量。",
    "直角坐标形式解可以写成不同方向平面波的叠加；传播波和必要的倏逝分量共同描述更一般的声场。",
  ],
  formulas: [
    {
      number: "3.5.2-1",
      tex: String.raw`\mathbf k=(k_x,k_y,k_z),\quad |\mathbf k|=\omega/c_0,\quad p=\Re\{P_0e^{j(\omega t-\mathbf k\cdot\mathbf r)}\}`,
      meaning: "这里的方向角定义为方位角与相对水平面的俯仰角。",
    },
    {
      number: "3.5.2-2",
      tex: String.raw`\mathbf k=k(\cos\theta\cos\varphi,\cos\theta\sin\varphi,\sin\theta),\quad P(\mathbf r)=\sum_n A_ne^{-j\mathbf k_n\cdot\mathbf r}`,
      meaning: "二维叠加示例令每列波幅度为一，方向分别独立可调。",
    },
  ],
  figures: [
    {
      ...figure("3.5.2-1", "三维波数矢量与垂直等相位面（正交投影）", (p) => {
        const a = (p.azimuth * Math.PI) / 180,
          e = (p.elevation * Math.PI) / 180,
          n = waveVector(1, p.azimuth, p.elevation),
          u = [-Math.sin(a), Math.cos(a), 0],
          v = [-Math.sin(e) * Math.cos(a), -Math.sin(e) * Math.sin(a), Math.cos(e)];
        const ar = arrow("k/k", [0, 0], projection(n));
        const setup =
          "nn=[cosd(elevation)*cosd(azimuth) cosd(elevation)*sind(azimuth) sind(elevation)];uu=[-sind(azimuth) cosd(azimuth) 0];vv=[-sind(elevation)*cosd(azimuth) -sind(elevation)*sind(azimuth) cosd(elevation)];proj=[1 0;.45 .3;0 1];kk=arrowPoints([0 0],nn*proj,1);";
        return [
          graph(
            p,
            0,
            "三维正交投影：平面法向与 k 相同",
            "x + 0.45y（示意）",
            "z + 0.30y（示意）",
            [-1.5, 1.5],
            [-1.5, 1.5],
            [
              ...[-0.45, 0.45].map((s, i) => {
                const corners = [
                  [-0.5, -0.5],
                  [0.5, -0.5],
                  [0.5, 0.5],
                  [-0.5, 0.5],
                  [-0.5, -0.5],
                ];
                const xyz = corners.map(([a, b]) =>
                  projection(n.map((q, j) => s * q + a * u[j] + b * v[j])),
                );
                return points(
                  `等相位面 ${i + 1}`,
                  xyz,
                  `plane${i + 1}(:,1)'`,
                  `plane${i + 1}(:,2)'`,
                  { color: "#777777", legend: i === 0 },
                );
              }),
              points("波数矢量 k/k", ar.points, "kk(:,1)'", "kk(:,2)'"),
              points(
                "x、y、z 轴",
                [
                  [0, 0],
                  [1.2, 0],
                  [0, 0],
                  [0.54, 0.36],
                  [0, 0],
                  [0, 1.2],
                ],
                "[0 1.2 0 .54 0 0]",
                "[0 0 0 .36 0 1.2]",
                { color: "#777777", style: ":" },
              ),
            ],
            setup +
              [-0.45, 0.45]
                .map(
                  (s, i) =>
                    `plane${i + 1}=(${s}*ones(5,1)*nn+[-.5 -.5;.5 -.5;.5 .5;-.5 .5;-.5 -.5]*[uu;vv])*proj;`,
                )
                .join(""),
            {
              textLabels: [
                { x: 1.3, y: 0, text: "x" },
                { x: 0.6, y: 0.4, text: "y" },
                { x: 0, y: 1.3, text: "z" },
              ],
            },
          ),
        ];
      }),
      independentOf: ["f", "c", "wavecount", "a1", "a2", "a3", "a4"],
      dimensionlessComparison:
        "单位方向比较：采用 $\\mathbf{k}/|\\mathbf{k}|$；下图展示实际声场。",
    },
    figure("3.5.2-2", "二至四列不同方向的平面波叠加", (p, t) => {
      const nx = Math.max(161, Math.ceil((8 * p.f) / p.c) + 1),
        ny = Math.max(81, Math.ceil((8 * p.f) / p.c) + 1),
        xs = Array.from({ length: nx }, (_, i) => -1 + (2 * i) / (nx - 1)),
        ys = Array.from({ length: ny }, (_, i) => -1 + (2 * i) / (ny - 1));
      const z = ys.map((y) =>
        xs.map((x) =>
          Array.from({ length: p.wavecount }, (_, i) => {
            const a = (p[`a${i + 1}`] * Math.PI) / 180;
            return Math.cos(
              2 * Math.PI * (p.f * t - (p.f / p.c) * (x * Math.cos(a) + y * Math.sin(a))),
            );
          }).reduce((a, b) => a + b, 0),
        ),
      );
      return [
        graph(
          p,
          t,
          "每列波具有独立方向；场为线性叠加",
          "位置 x (m)",
          "位置 y (m)",
          [-1, 1],
          [-1, 1],
          [],
          "nx=max(161,ceil(8*f/c)+1);ny=max(81,ceil(8*f/c)+1);[XX,YY]=meshgrid(linspace(-1,1,nx),linspace(-1,1,ny));AA=[a1 a2 a3 a4];Pfield=zeros(size(XX));for jj=1:wavecount,Pfield=Pfield+cos(tau-k*(XX*cosd(AA(jj))+YY*sind(AA(jj))));end;",
          {
            legend: false,
            field: { x: xs, y: ys, z, limits: [-4, 4], map: "RdBu", label: "合成归一化声压（—）" },
          },
          { field: { x: "linspace(-1,1,nx)", y: "linspace(-1,1,ny)", z: "Pfield" } },
        ),
      ];
    }),
  ],
  readouts: (p) => {
    const k = (2 * Math.PI * p.f) / p.c,
      v = waveVector(k, p.azimuth, p.elevation);
    return [
      ["总波数", k, "rad/m"],
      ["kₓ", v[0], "rad/m"],
      ["k_y", v[1], "rad/m"],
      ["k_z", v[2], "rad/m"],
    ];
  },
  readoutModel:
    "[k k*cosd(elevation)*cosd(azimuth) k*cosd(elevation)*sind(azimuth) k*sind(elevation)]",
  examples: [
    example(
      "例题　平面波在阵列轴向的波数分量",
      "水中 2 kHz 平面波沿方位角 30°、俯仰角 25° 入射，声速 1500 m/s。求总波数和 x 轴投影，用于线阵相位补偿。",
      { ...p, c: 1500, f: 2000, azimuth: 30, elevation: 25 },
      [params.f, params.c, azimuth, elevation],
      [
        ask(
          "waveNumber",
          "(1) 总波数",
          "rad/m",
          String.raw`k=2\pi f/c_0`,
          "2*pi*f/c",
          (p) => (2 * Math.PI * p.f) / p.c,
          (p) => `2π × ${p.f} Hz ÷ ${p.c} m/s`,
        ),
        ask(
          "kx",
          "(2) x 轴波数分量",
          "rad/m",
          String.raw`k_x=k\cos\theta\cos\varphi`,
          "waveNumber*cosd(elevation)*cosd(azimuth)",
          (p) => waveVector((2 * Math.PI * p.f) / p.c, p.azimuth, p.elevation)[0],
          (p) => `${(2 * Math.PI * p.f) / p.c} rad/m × cos(${p.elevation}°) × cos(${p.azimuth}°)`,
        ),
      ],
      () => "线阵相邻传感器的相位差取决于轴向投影，应同时明确角度定义与坐标轴。",
      (p) =>
        answerCurve(
          p,
          "f",
          "频率",
          "Hz",
          (q) => waveVector((2 * Math.PI * q.f) / q.c, q.azimuth, q.elevation)[0],
          "2*pi*x/c*cosd(elevation)*cosd(azimuth)",
        ),
    ),
  ],
  answers: [
    "由各方向空间相位变化率组成的矢量，其模为波数，实矢量方向是均匀行波传播方向。",
    "对正时间因子，负的空间相位表示沿正轴传播，正的空间相位表示沿负轴传播。",
    "均匀平面波的传播方向与实波数矢量方向相同；非均匀波还需区分相位方向和幅值衰减方向。",
  ],
  engineering: engineering(
    "波束形成通过各传感器位置与波数矢量的内积补偿相位；近场重建还可能需要倏逝分量。",
    "lens",
    "声透镜与水下机器人",
  ),
});
