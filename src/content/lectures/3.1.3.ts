import { completeExamples } from "../calculationSteps";
import { e313 } from "../../plot/p2Examples";
import {
  p2Lecture,
  defaults,
  params,
  parameter,
  figure,
  graph,
  curve,
  points,
  example,
  ask,
  engineering,
} from "../p2";
const p = {
  ...defaults,
  ideal: 1,
  continuous: 1,
  compressible: 1,
  uniform: 1,
  small: 1,
  distortion: 0.35,
};
const distortion = parameter("distortion", "非线性示意强度", "ε", "—", 0, 0.45, 0.01);
const completedLecture = p2Lecture("3.1.3", {
  defaults: p,
  parameters: [params.pa, params.rho, params.c, distortion],
  interactive: {
    toggles: [
      { key: "ideal", label: "理想（无黏性、无热耗散）" },
      { key: "continuous", label: "连续介质" },
      { key: "compressible", label: "可压缩" },
      { key: "uniform", label: "均匀、静止" },
      { key: "small", label: "小振幅" },
    ],
    links: [
      { text: "质量守恒 → 连续性方程", href: "#/lab?topic=3.1.4" },
      { text: "热力学 → 状态方程", href: "#/lab?topic=3.1.6" },
      { text: "牛顿定律 → 运动方程", href: "#/lab?topic=3.1.8" },
      { text: "三方程消元 → 波动方程", href: "#/lab?topic=3.2.1" },
    ],
  },
  keyPoints: [
    "理想流体：略去黏性和热传导耗散；连续介质：物理量可定义为空间连续场。",
    "可压缩性提供体积形变与恢复力；均匀、静止使静态参数不随位置变化且没有背景流动。",
    "小振幅要求压缩量和声学马赫数远小于一，略去扰动乘积等二阶量。",
    "质量守恒、热力学状态关系、牛顿第二定律分别给出连续性、状态与运动方程。",
  ],
  formulas: [
    {
      number: "3.1.3-1",
      tex: String.raw`|s|=|\rho'|/\rho_0\ll1,\quad |u|/c_0\ll1,\quad |p|\ll\rho_0c_0^2`,
      meaning:
        "取消假设后的图是对比示意，不应当作通用的非线性或非均匀介质求解器。取消“小振幅”后，调节示意强度可观察波形逐渐变陡。",
    },
  ],
  figures: [
    figure("3.1.3-3", "小振幅近似的适用范围", (p) => [
      graph(
        p,
        0,
        "声学马赫数与压缩量",
        "声压幅值 (Pa)",
        "相对压缩量 p/(ρc²)",
        [0, 200],
        [0, 0.011],
        [
          curve(
            "压缩量等于声学马赫数",
            (x) => x / (p.rho * p.c ** 2),
            [0, 200],
            "linspace(0,200,401)",
            "x/(rho*c^2)",
          ),
          points("当前声压", [[p.pa, p.pa / (p.rho * p.c ** 2)]], "pa", "pa/(rho*c^2)", {
            style: "none",
            marker: "o",
          }),
        ],
      ),
    ]),
    {
      ...figure(
        "3.1.3-1",
        "逐项取消假设后的对比示意",
        (p) =>
          [
            graph(
              p,
              0,
              p.small ? "小振幅：正弦波" : "非线性示意：波形变陡",
              "相位坐标（—）",
              "归一化声压（—）",
              [0, 2],
              [-1.5, 1.5],
              [
                curve(
                  "线性基准",
                  (x) => Math.sin(2 * Math.PI * x),
                  [0, 2],
                  "linspace(0,2,401)",
                  "sin(2*pi*x)",
                  "--",
                ),
                curve(
                  "当前假设",
                  (x) =>
                    Math.sin(2 * Math.PI * x) +
                    (1 - p.small) * p.distortion * Math.sin(4 * Math.PI * x),
                  [0, 2],
                  "linspace(0,2,401)",
                  "sin(2*pi*x)+(1-small)*distortion*sin(4*pi*x)",
                ),
              ],
            ),
            graph(
              p,
              0,
              p.ideal ? "无耗散：振幅不变" : "有耗散示意：振幅衰减",
              "传播距离（示意）",
              "归一化振幅（—）",
              [0, 2],
              [0, 1.5],
              [
                curve(
                  "振幅包络",
                  (x) => Math.exp(-(1 - p.ideal) * x),
                  [0, 2],
                  "linspace(0,2,401)",
                  "exp(-(1-ideal)*x)",
                ),
              ],
            ),
            graph(
              p,
              0,
              p.uniform ? "均匀静止：直声线" : "非均匀介质示意：声线弯曲",
              "水平位置（示意）",
              "垂直位置（示意）",
              [0, 2],
              [0, 1.5],
              [
                curve(
                  "声线",
                  (x) => 0.2 + ((1 - p.uniform) * x * x) / 4,
                  [0, 2],
                  "linspace(0,2,401)",
                  ".2+(1-uniform)*x.^2/4",
                ),
              ],
            ),
            graph(
              p,
              0,
              p.continuous ? "连续场：可取空间导数" : "微观示意：连续场描述失效",
              "空间坐标（示意）",
              "扰动（示意）",
              [0, 2],
              [-1.5, 1.5],
              [
                curve(
                  "介质描述",
                  (x) => Math.sin(2 * Math.PI * x),
                  [0, 2],
                  "linspace(0,2,401*continuous+17*(1-continuous))",
                  "sin(2*pi*x)",
                  p.continuous ? "-" : "none",
                  p.continuous ? 401 : 17,
                ),
              ].map((s) => ({ ...s, marker: p.continuous ? undefined : "o" })),
            ),
            graph(
              p,
              0,
              p.compressible ? "有限可压缩性：有限声速" : "不可压缩极限：本模型无有限速压缩波",
              "静态密度比（—）",
              "声压扰动（归一化）",
              [0.9, 1.1],
              [-1.5, 1.5],
              [
                curve(
                  "状态斜率",
                  (x) =>
                    p.compressible ? 10 * (x - 1) : Math.max(-1.5, Math.min(1.5, 10000 * (x - 1))),
                  [0.9, 1.1],
                  "linspace(.9,1.1,401)",
                  "min(1.5,max(-1.5,(10*compressible+10000*(1-compressible))*(x-1)))",
                ),
              ],
            ),
          ].map((panel, i) => {
            const choices = [
              ["small", "非线性示意：波形变陡", "小振幅：正弦波"],
              ["ideal", "有耗散示意：振幅衰减", "无耗散：振幅不变"],
              ["uniform", "非均匀介质示意：声线弯曲", "均匀静止：直声线"],
              ["continuous", "微观示意：连续场描述失效", "连续场：可取空间导数"],
              ["compressible", "不可压缩极限：无有限速压缩波", "有限可压缩性：有限声速"],
            ][i];
            panel.matlabModel!.setup += `mtitles={'${choices[1]}','${choices[2]}'};`;
            panel.matlabModel!.title = `mtitles{1+${choices[0]}}`;
            return panel;
          }),
        3,
        2,
      ),
      independentOf: ["pa", "rho", "c"],
      dimensionlessComparison: "模型假设的无量纲比较；小振幅近似的物理适用范围另图展示。",
    },
    figure("3.1.3-2", "三定律到波动方程的推导路线", (p) => [
      graph(
        p,
        0,
        "质量守恒 / 热力学 / 牛顿定律 → 三方程 → 消元",
        "推导阶段（—）",
        "三条物理路径（—）",
        [0, 3],
        [0, 4],
        [
          ...[1, 2, 3].map((y) =>
            points(
              ["连续性", "状态关系", "运动方程"][y - 1],
              [
                [0, y],
                [1, y],
                [2, 2],
                [3, 2],
              ],
              "[0 1 2 3]",
              `[${y} ${y} 2 2]`,
            ),
          ),
        ],
        "",
        {
          integerX: true,
          legend: false,
          textLabels: [
            { x: 0.5, y: 3.3, text: "三定律" },
            { x: 1.5, y: 3.3, text: "三方程" },
            { x: 2.5, y: 2.3, text: "波动方程" },
          ],
        },
      ),
    ]),
  ],
  readouts: (p) => [
    ["声学马赫数", p.pa / (p.rho * p.c * p.c), "—"],
    ["压缩量峰值", p.pa / (p.rho * p.c * p.c), "—"],
  ],
  readoutModel: "[pa/(rho*c^2) pa/(rho*c^2)]",
  examples: [
    example(
      "例题　工业噪声的小振幅条件",
      "一台设备附近测得声压峰值 20 Pa，空气密度 1.21 kg/m³、声速 343 m/s。以声学马赫数和压缩量检查采用线性方程是否合理。",
      { ...p, pa: 20 },
      [params.pa, params.rho, params.c],
      [
        ask(
          "mach",
          "(1) 声学马赫数",
          "—",
          String.raw`M_a=u_a/c_0=p_a/(\rho_0c_0^2)`,
          "pa/(rho*c^2)",
          (p) => p.pa / (p.rho * p.c * p.c),
          (p) => `${p.pa} Pa ÷ (${p.rho} kg/m³ × (${p.c} m/s)²)`,
        ),
        ask(
          "density",
          "(2) 密度逾量峰值",
          "kg/m³",
          String.raw`\rho'_a=p_a/c_0^2`,
          "pa/c^2",
          (p) => p.pa / p.c ** 2,
          (p) => `${p.pa} Pa ÷ (${p.c} m/s)²`,
        ),
      ],
      (p) =>
        p.pa / (p.rho * p.c ** 2) < 0.01
          ? "局部扰动比例很小，线性近似适用；长距离累积非线性与耗散仍需另外检查。"
          : "扰动不够小，应重新检查线性近似。",
      (p) => e313(p),
    ),
  ],
  answers: [
    "声学中的理想流体在忽略黏性、热传导的同时必须可压缩；流体力学有时还采用不可压缩近似。",
    "不可压缩极限体积形变为零，对应无限体积模量，不能支持本课讨论的有限传播速度压缩声波。",
  ],
  engineering: engineering(
    "工业噪声的线性计算需要先核对声压与静态体积模量的比值；气流、温度梯度和边界耗散可能需要额外模型。",
  ),
});

export default completeExamples(completedLecture);
