import { completeExamples } from "../calculationSteps";
import {
  makeLecture,
  parameter,
  figure,
  ask,
  engineering,
  water,
  graph,
  curve,
  points,
  substitution,
  answer,
  log,
} from "../p4";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "工作频率", "f", "Hz", 100, 20000, 100),
  a = parameter("a", "球半径", "a", "m", 0.01, 0.1, 0.001),
  v = parameter("v", "表面振速峰值", "v₀", "m/s", 0.001, 0.03, 0.001);
const p = { ...water },
  setup = "[Rs,Xs,Prad,Ms]=p4Sphere(a,f,rho,c,v);";
const asks = [
  ask(
    "resistance",
    "(1) 辐射阻",
    "kg/s",
    "R_s=\\rho_0c_0S\\frac{(ka)^2}{1+(ka)^2}",
    "Rs",
    (p) => phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1).z.re,
    substitution,
  ),
  ask(
    "mass",
    "(2) 伴振质量",
    "kg",
    "M_s=X_s/\\omega",
    "Ms",
    (p) => phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1).mass,
    substitution,
  ),
  ask(
    "power",
    "(3) 辐射声功率",
    "W",
    "\\bar W=\\tfrac12v_0^2R_s=4\\pi r^2I(r)",
    "Prad",
    (p) => phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1).power,
    substitution,
  ),
];
const completedLecture = makeLecture("4.2.2", {
  defaults: p,
  parameters: [f, a, v],
  keyPoints: [
    "辐射阻与辐射抗由球表面声压对振速的复比值乘表面积得到。",
    "小球的辐射阻正比于频率平方，辐射抗主要体现伴振质量；低频伴振质量等于排开介质质量的三倍。",
    "大球的归一化辐射阻趋于一，归一化辐射抗趋于零。",
    "由表面阻抗计算的辐射声功率与对任意同心球面的声强积分一致；固定表面振速时低频功率正比于频率平方，高频趋于常数。",
  ],
  formulas: [
    {
      number: "4.2.2-1",
      tex: "Z_s=4\\pi a^2\\rho_0c_0\\frac{jka}{1+jka}",
      meaning: "辐射阻为实部，辐射抗为虚部；两者均为机械阻抗，单位为 kg/s。",
    },
    {
      number: "4.2.2-2",
      tex: "M_s=\\frac{4\\pi\\rho_0a^3}{1+(ka)^2}\\xrightarrow{ka\\ll1}3M_0,\\quad M_0=\\tfrac43\\pi\\rho_0a^3",
      meaning: "伴振质量说明振动时还需加速邻近介质。",
    },
    {
      number: "4.2.2-3",
      tex: "\\bar W=\\tfrac12R_s v_0^2=4\\pi r^2\\frac{|P(r)|^2}{2\\rho_0c_0}",
      meaning: "两种功率算法在无损自由场中相等。",
    },
  ],
  figures: [
    figure(
      "4.2.2-1",
      "脉动球的归一化辐射阻与辐射抗",
      (p) => {
        const ka = phy.kWave(p.f, p.c) * p.a;
        return [
          graph(
            p,
            0,
            "小球、大球的辐射负载比较",
            "无量纲尺寸 ka",
            "归一化机械阻抗",
            [0.001, 100],
            [0, 1],
            [
              points(
                "辐射阻",
                log(0.001, 100).map((x) => [x, (x * x) / (1 + x * x)]),
                "logspace(-3,2,401)",
                "x.^2./(1+x.^2)",
              ),
              points(
                "辐射抗",
                log(0.001, 100).map((x) => [x, x / (1 + x * x)]),
                "logspace(-3,2,401)",
                "x./(1+x.^2)",
              ),
              points("当前尺寸", [[ka, (ka * ka) / (1 + ka * ka)]], "k*a", "(k*a)^2/(1+(k*a)^2)", {
                marker: "o",
                style: "none",
              }),
            ],
            setup,
            { xscale: "log" },
          ),
        ];
      },
      1,
      1,
    ),
    figure("4.2.2-2", "固定表面振速时辐射功率的低频平方律与高频极限", (p) => [
      graph(
        p,
        0,
        "声功率的两种求法完全一致",
        "频率 f (Hz)",
        "平均声功率 (W)",
        [10, 100000],
        [1e-6, 1e3],
        [
          points(
            "由辐射阻计算",
            log(10, 100000).map((f) => [f, phy.sphere(p.a, f, p.rho, p.c, p.v, 1).power]),
            "logspace(1,5,401)",
            ".5*v^2*rho*c*4*pi*a^2*(2*pi*x*a/c).^2./(1+(2*pi*x*a/c).^2)",
          ),
          points(
            "由半径 2 m 处声强积分",
            log(10, 100000).map((f) => [
              f,
              (4 *
                Math.PI *
                4 *
                phy.magnitude(phy.sphere(p.a, f, p.rho, p.c, p.v, 2).pressure) ** 2) /
                (2 * p.rho * p.c),
            ]),
            "logspace(1,5,401)",
            "4*pi*4*abs(p4SphereP(2,a,x,rho,c,v)).^2/(2*rho*c)",
            { style: "--" },
          ),
          points("当前频率", [[p.f, phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1).power]], "f", "Prad", {
            marker: "o",
            style: "none",
          }),
        ],
        setup,
        { xscale: "log", yscale: "log" },
      ),
    ]),
  ],
  answers: [
    "球表面声压与法向振速之比乘以球面积，得机械辐射阻抗。",
    "用 $\\bar W=\\tfrac12R_s|v_0|^2$，或对闭曲面的平均声强积分。",
    "均匀脉动球的平均声强乘以球面面积即为辐射声功率。",
    "固定半径与表面振速时，低频正比于频率平方，高频趋于常数。",
    "固定表面振速、频率时，小球功率正比于半径四次方，大球近似正比于半径平方。",
  ],
  exampleTitle: "例题　水下小球的辐射负载与伴振质量",
  background:
    "半径 50 mm 的球面换能器在水中以 1 kHz 工作，表面振速峰值为 0.01 m/s。求辐射阻、伴振质量及声功率，评估驱动器承受的耗散负载与惯性负载。",
  exampleDefaults: p,
  given: [a, f, v],
  asks,
  judgment: "伴振质量是频率相关的等效量；仅在小球极限才接近排开介质质量的三倍。",
  examplePlot: (p) => {
    const q = phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1),
      S = 4 * Math.PI * p.a ** 2 * p.rho * p.c,
      xs = log(0.001, 100);
    return answer(
      graph(
        p,
        0,
        "同一球源随频率变化的辐射阻抗轨迹",
        "辐射阻 Rₛ (kg/s)",
        "辐射抗 Xₛ (kg/s)",
        [0, S],
        [0, S * 0.55],
        [
          points(
            "辐射阻抗轨迹",
            xs.map((x) => [(S * x * x) / (1 + x * x), (S * x) / (1 + x * x)]),
            "Zs*qr.^2./(1+qr.^2)",
            "Zs*qr./(1+qr.^2)",
          ),
          points("所求辐射负载", [[q.z.re, q.z.im]], "Rs", "Xs", { marker: "o", style: "none" }),
        ],
        setup + "qr=logspace(-3,2,401);Zs=rho*c*4*pi*a^2;",
      ),
      "resistance",
    );
  },
  engineering: engineering(
    "球面换能器匹配网络应同时计入辐射阻和伴振质量。只按电阻损耗设计驱动，会漏掉低频下占主导的无功负载。",
    "sonar",
    "海底观测站主动声呐",
  ),
});

export default completeExamples(completedLecture);
