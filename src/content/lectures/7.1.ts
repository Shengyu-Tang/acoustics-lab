import {
  makeLecture,
  parameter,
  figure,
  ask,
  engineering,
  graph,
  curve,
  points,
  substitution,
  answer,
} from "../p4";
const alpha = parameter("alpha", "幅值吸收系数", "α", "Np/m", 0.00001, 0.2, 0.00001),
  f = parameter("f", "频率", "f", "Hz", 200, 2000, 100),
  pa = parameter("pa", "初始声压峰值", "p₀", "Pa", 0.1, 10, 0.1);
const p = { rho: 1.21, c: 343, f: 500, pa: 1, alpha: 0.05, r: 1000 };
const asks = [
  ask(
    "dbPerM",
    "(1) 分贝吸收系数",
    "dB/m",
    "\\alpha'=20\\alpha/\\ln10",
    "20/log(10)*alpha",
    (p) => (20 / Math.LN10) * p.alpha,
    substitution,
  ),
  ask(
    "loss",
    "(2) 总传播损失",
    "dB",
    "TL=20\\lg(r/r_0)+\\alpha'r,\\quad r_0=1\\ \\mathrm m",
    "20*log10(r)+20/log(10)*alpha*r",
    (p) => 20 * Math.log10(p.r) + (20 / Math.LN10) * p.alpha * p.r,
    substitution,
  ),
  ask(
    "pressure",
    "(3) 接收声压峰值",
    "Pa",
    "|P(r)|=p_0(r_0/r)e^{-\\alpha r}",
    "pa/r*exp(-alpha*r)",
    (p) => (p.pa / p.r) * Math.exp(-p.alpha * p.r),
    substitution,
  ),
];
export default makeLecture("7.1", {
  defaults: p,
  parameters: [alpha, f, pa],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "传播衰减包括几何扩展、散射与介质吸收三种原因；只有吸收将声能不可逆地转为其他形式的能量。",
    "幅值吸收系数表示声压包络按传播距离指数衰减的速率，单位为奈贝每米。",
    "分贝每米的幅值损失系数等于奈贝每米系数的约 8.686 倍；强度按两倍指数衰减，但分贝损失相同。",
    "采用正时间因子时，复波数的实部表示传播相位变化，负虚部表示正向传播幅值衰减。",
  ],
  formulas: [
    {
      number: "7.1-1",
      tex: "p(x,t)=p_0e^{-\\alpha x}\\cos(\\omega t-kx),\\quad\\widetilde k=k-j\\alpha",
      meaning: "正向波的相位因子为 $e^{-j\\widetilde kx}$；吸收系数不是材料表面的无量纲吸声系数。",
    },
    {
      number: "7.1-2",
      tex: "\\alpha'=\\frac{20}{\\ln10}\\alpha,\\quad TL(r)=20\\lg\\frac r{r_0}+\\alpha'r,\\quad r_0=1\\ \\mathrm m",
      meaning: "源强采用一米无吸收参考幅值，吸收路径长度从声源算起。",
    },
  ],
  figures: [
    figure("7.1-1", "吸收介质中平面波的传播与指数包络", (p, t) => [
      graph(
        p,
        t,
        "平面波幅值沿传播距离指数衰减",
        "传播距离 x (m)",
        "声压 (Pa)",
        [0, 20],
        [-1, 1],
        [
          curve(
            "吸收平面波",
            (x) =>
              p.pa *
              Math.exp(-p.alpha * x) *
              Math.cos(2 * Math.PI * p.f * t - ((2 * Math.PI * p.f) / p.c) * x),
            [0, 20],
            "linspace(0,20,1601)",
            "pa*exp(-alpha*x).*cos(w*tView-k*x)",
            "-",
            1601,
          ),
          curve(
            "正包络",
            (x) => p.pa * Math.exp(-p.alpha * x),
            [0, 20],
            "linspace(0,20,401)",
            "pa*exp(-alpha*x)",
            "--",
          ),
          curve(
            "负包络",
            (x) => -p.pa * Math.exp(-p.alpha * x),
            [0, 20],
            "linspace(0,20,401)",
            "-pa*exp(-alpha*x)",
            "--",
          ),
        ],
      ),
    ]),
    figure("7.1-2", "球面扩展与吸收分别构成的传播损失", (p) => [
      graph(
        p,
        0,
        "把几何扩展与介质吸收分开核算",
        "传播距离 r (m)",
        "传播损失 (dB)",
        [1, 100],
        [0, 1],
        [
          curve(
            "球面扩展",
            (r) => 20 * Math.log10(r),
            [1, 100],
            "linspace(1,100,401)",
            "20*log10(x)",
          ),
          curve(
            "介质吸收",
            (r) => (20 / Math.LN10) * p.alpha * r,
            [1, 100],
            "linspace(1,100,401)",
            "20/log(10)*alpha*x",
          ),
          curve(
            "总损失",
            (r) => 20 * Math.log10(r) + (20 / Math.LN10) * p.alpha * r,
            [1, 100],
            "linspace(1,100,401)",
            "20*log10(x)+20/log(10)*alpha*x",
          ),
        ],
      ),
    ]),
  ],
  answers: [
    "几何扩展、散射和吸收。",
    "使正向传播的声压幅值按 $e^{-\\alpha x}$ 变化的比例系数，单位为奈贝每米。",
    "实部决定相位随距离的变化，按本页时间约定负虚部对应幅值随距离衰减。",
  ],
  exampleTitle: "例题　一千米水声链路的扩展与吸收预算",
  background:
    "水下声源的一米无吸收参考声压峰值为 1 Pa，幅值吸收系数为 $10^{-4}\\ \\mathrm{Np/m}$，接收器距声源 1 km。求分贝每米吸收系数、总传播损失与接收声压峰值，区分两类损失来源。",
  exampleDefaults: { ...p, rho: 1000, c: 1500, alpha: 0.0001 },
  given: [alpha, pa],
  asks,
  judgment:
    "默认一千米几何扩展损失为 60 dB，吸收约 0.869 dB；几何扩展占主导。传播预算应避免把幅值奈贝系数与强度奈贝系数混用。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "一千米接收链路的传播损失分项预算",
        "损失组成",
        "传播损失 (dB)",
        [0.5, 3.5],
        [0, 1],
        [
          points(
            "几何扩展、吸收及总和",
            [
              [1, 20 * Math.log10(p.r)],
              [2, (20 / Math.LN10) * p.alpha * p.r],
              [3, asks[1].calc(p)],
            ],
            "[1 2 3]",
            "[20*log10(r) 20/log(10)*alpha*r loss]",
            { kind: "bar" },
          ),
        ],
        "",
        {
          xtickLabels: [
            { value: 1, label: "球面扩展" },
            { value: 2, label: "介质吸收" },
            { value: 3, label: "合计" },
          ],
        },
      ),
      "loss",
    ),
  engineering: engineering(
    "主动声呐链路中，声源到目标及回波返回均会经历传播损失。必须先区分几何扩展和吸收，再与目标散射及接收器灵敏度组合。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
