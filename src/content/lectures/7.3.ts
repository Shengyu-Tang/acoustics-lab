import { completeExamples } from "../calculationSteps";
import { imagePanel } from "../../plot/p4Fields";
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
  fmt,
} from "../p4";
import * as phy from "../../physics/chapter4";
const res = parameter("res", "归一化阻抗实部", "Re Zₙ/ρc", "—", 0.1, 4, 0.1),
  react = parameter("react", "归一化阻抗虚部", "Im Zₙ/ρc", "—", -3, 3, 0.1),
  d = parameter("d", "材料厚度", "d", "m", 0.02, 0.15, 0.005),
  sigma = parameter("sigma", "流阻率", "σ", "Pa·s/m²", 5000, 20000, 500),
  f = parameter("f", "测量频率", "f", "Hz", 500, 3500, 100);
const p = { rho: 1.21, c: 343, f: 1000, res: 1, react: 0, d: 0.05, sigma: 10000 },
  setup = "[alphaDB,Zdb]=p4Porous(f,d,sigma,rho,c);Rp=(Zdb-1)/(Zdb+1);";
const asks = [
  ask(
    "reflection",
    "(1) 声压反射系数模值",
    "—",
    "R_p=(Z_n-\\rho_0c_0)/(Z_n+\\rho_0c_0)",
    "abs(Rp)",
    (p) => {
      const z = phy.porous(p.f, p.d, p.sigma, p.rho, p.c).z;
      return phy.magnitude(phy.div(phy.add(z, phy.C(-1)), phy.add(z, phy.C(1))));
    },
    substitution,
  ),
  ask(
    "absorption",
    "(2) 正入射吸声系数",
    "—",
    "\\alpha=1-|R_p|^2",
    "alphaDB",
    (p) => phy.porous(p.f, p.d, p.sigma, p.rho, p.c).alpha,
    substitution,
  ),
];
function contour(p: Record<string, number>, levels = [0.2, 0.4, 0.6, 0.8, 0.95]) {
  return levels.map((level) => {
    const center = 2 / level - 1,
      radius = (2 * Math.sqrt(1 - level)) / level;
    return points(
      "吸声系数 " + level,
      Array.from({ length: 721 }, (_, i) => [
        center + radius * Math.cos((2 * Math.PI * i) / 720),
        radius * Math.sin((2 * Math.PI * i) / 720),
      ]),
      String(center) + "+" + radius + "*cos(linspace(0,2*pi,721))",
      String(radius) + "*sin(linspace(0,2*pi,721))",
    );
  });
}
function metrics(p: Record<string, number>) {
  const fs = Array.from({ length: 401 }, (_, i) => 400 + (3600 * i) / 400),
    ys = fs.map((f) => phy.porous(f, p.d, p.sigma, p.rho, p.c).alpha),
    max = Math.max(...ys),
    index = ys.indexOf(max),
    inside = ys.map((v, i) => (v >= max / 2 ? i : -1)).filter((i) => i >= 0);
  return { frequency: fs[index], maximum: max, low: fs[inside[0]], high: fs[inside.at(-1)!] };
}
const completedLecture = makeLecture("7.3", {
  defaults: p,
  parameters: [res, react, d, sigma, f],
  keyPoints: [
    "吸声系数为被材料或结构吸收的声能与入射声能之比；正入射时由声压反射系数模值求得。",
    "有损均匀弹性材料通过内部摩擦与黏弹性迟滞耗能，多孔材料主要通过孔隙中的粘滞与热交换耗能；最大吸声频率与有效吸声带宽共同描述频率选择性。",
    "空气多孔层中粘滞与热交换造成耗散；本页采用刚性背衬的德拉尼—巴兹利模型，明确限制于空气中高孔隙率纤维材料。",
    "水声常用谐振型吸声结构及阻抗过渡型尖劈结构；阻抗渐变能减小入口反射，最终吸收仍需依靠材料内部损耗。",
  ],
  formulas: [
    {
      number: "7.3-1",
      tex: "\\alpha=1-|R_p|^2=\\frac{4r}{(1+r)^2+x^2},\\quad r+jx=Z_n/(\\rho_0c_0)",
      meaning: "无源局部作用表面有非负阻抗实部；完全匹配时吸声系数为一。",
    },
    {
      number: "7.3-2",
      tex: "Z_n=-jZ_c\\cot(k_cd),\\quad X=\\rho_0f/\\sigma,\\quad0.01<X<1",
      meaning:
        "刚性背衬层以复特性阻抗和复波数计算；曲线频带保持在经验模型的典型适用范围内，来源见链接。",
    },
  ],
  interactive: {
    links: [
      {
        text: "德拉尼—巴兹利模型的原始系数、时间约定与有效范围",
        href: "https://matelys.com/apmr/PropagationModels/MotionlessSkeleton/DelanyBazleyModel.html",
      },
      {
        text: "多孔等效流体模型与空气适用限制",
        href: "https://doc.comsol.com/6.3/doc/com.comsol.help.aco/aco_ug_pressure.05.005.html",
      },
    ],
  },
  measurements: [
    {
      name: "阻抗表面的吸声系数",
      unit: "—",
      matlab: "4*res/((res+1)^2+react^2)",
      calc: (p) => phy.absorption(p.res, p.react),
    },
    {
      name: "当前频率多孔层吸声系数",
      unit: "—",
      matlab: "p4Porous(f,d,sigma,rho,c)",
      calc: (p) => phy.porous(p.f, p.d, p.sigma, p.rho, p.c).alpha,
    },
    {
      name: "显示频带内最大吸声频率",
      unit: "Hz",
      matlab: "p4PorousPeak(d,sigma,rho,c)",
      calc: (p) => metrics(p).frequency,
    },
    {
      name: "半峰值以上的显示带宽",
      unit: "Hz",
      matlab: "p4PorousWidth(d,sigma,rho,c)",
      calc: (p) => metrics(p).high - metrics(p).low,
    },
  ],
  figures: [
    figure("7.3-1", "正入射吸声系数在归一化阻抗平面内的等值线", (p) => [
      graph(
        p,
        0,
        "阻抗匹配附近吸声系数最大",
        "归一化阻抗实部",
        "归一化阻抗虚部",
        [0, 4],
        [-3, 3],
        [
          ...contour(p),
          points("当前阻抗", [[p.res, p.react]], "res", "react", { marker: "o", style: "none" }),
        ],
        setup,
        { equalAspect: true, coordinateY: true },
      ),
    ]),
    figure("7.3-2", "刚性背衬空气多孔层的吸声频响、峰值与显示带宽", (p) => {
      const q = metrics(p);
      return [
        graph(
          p,
          0,
          "多孔层厚度影响吸声峰值和有效频带",
          "频率 f (Hz)",
          "正入射吸声系数",
          [400, 4000],
          [0, 1],
          [
            curve(
              "空气多孔层",
              (f) => phy.porous(f, p.d, p.sigma, p.rho, p.c).alpha,
              [400, 4000],
              "linspace(400,4000,401)",
              "p4Porous(x,d,sigma,rho,c)",
            ),
            points(
              "本题测量频率",
              [[p.f, phy.porous(p.f, p.d, p.sigma, p.rho, p.c).alpha]],
              "f",
              "alphaDB",
              { marker: "o", style: "none" },
            ),
          ],
          setup +
            "fp=p4PorousPeak(d,sigma,rho,c);bw=p4PorousWidth(d,sigma,rho,c);ff=linspace(400,4000,401);aa=p4Porous(ff,d,sigma,rho,c);lo=ff(find(aa>=max(aa)/2,1,'first'));hi=ff(find(aa>=max(aa)/2,1,'last'));",
          {
            annotations: [
              { axis: "x", value: q.frequency, label: "显示频带内峰值" },
              { axis: "x", value: q.low, label: "半峰值下限" },
              {
                axis: "x",
                value: q.high,
                label: q.high === 4000 ? "上限未闭合，截于显示边界" : "半峰值上限",
              },
            ],
          },
          { annotations: ["fp", "lo", "hi"] },
        ),
      ];
    }),
    figure(
      "7.3-3",
      "水声尖劈的阻抗过渡结构（定性示意）",
      (p) => [
        imagePanel(
          p,
          0,
          "渐变尖劈与定性阻抗分布（介质参考值为 1）",
          [0, 0.15],
          [-0.03, 0.03],
          (x, y) =>
            x <= p.d * (1 + 1e-12) && Math.abs(y) <= (0.025 * x) / p.d + 1e-12
              ? 1 + 9 * (x / p.d) ** 2
              : 1,
          "1+9*(XX/d).^2.*(XX<=d*(1+1e-12) & abs(YY)<=.025*XX/d+1e-12)",
          setup,
          [
            points(
              "吸声尖劈外形",
              [
                [0, 0],
                [p.d, 0.025],
                [p.d, -0.025],
                [0, 0],
              ],
              "[0 d d 0]",
              "[0 .025 -.025 0]",
              { geometry: { key: "d", axis: "x" } },
            ),
          ],
          [1, 10],
          "定性归一化等效阻抗",
          "[1 10]",
        ),
        graph(
          p,
          0,
          "阻抗渐变示意（不作为材料定量预测）",
          "结构深度 x (m)",
          "归一化等效阻抗",
          [0, 0.15],
          [1, 10],
          [
            curve(
              "从介质逐渐过渡到吸声材料",
              (x) => 1 + 9 * (x / p.d) ** 2,
              [0, p.d],
              "linspace(0,d,401)",
              "1+9*(x/d).^2",
            ),
          ],
          setup,
        ),
      ],
      2,
      1,
    ),
  ],
  answers: [
    "降低声反射，将声能通过内部耗散转为热等其他形式，抑制回声与混响。",
    "吸声系数、最大吸声频率及吸声带宽等。",
    "谐振型吸声结构与阻抗过渡型吸声结构，如尖劈。",
  ],
  exampleTitle: "例题　五厘米空气多孔吸声层的阻抗匹配",
  background:
    "空气中刚性背衬纤维吸声层厚 50 mm、流阻率 $10000\\ \\mathrm{Pa\\cdot s/m^2}$，在 1 kHz 正入射。采用德拉尼—巴兹利模型求反射系数模值与吸声系数，并将表面阻抗放到匹配等值线上检验。",
  exampleDefaults: p,
  given: [d, sigma, f],
  asks,
  judgment: "该结果仅适用于本题的空气纤维层与经验模型范围；不能直接作为水声橡胶或尖劈的材料参数。",
  examplePlot: (p) => {
    const z = phy.porous(p.f, p.d, p.sigma, p.rho, p.c).z;
    return answer(
      graph(
        p,
        0,
        "空气吸声层频率变化时的表面阻抗轨迹与匹配区",
        "表面阻抗实部与特性阻抗之比",
        "表面阻抗虚部与特性阻抗之比",
        [0, 4],
        [-3, 3],
        [
          ...contour(p, [0.5, 0.8, 0.95]),
          points(
            "四百至四千赫表面阻抗轨迹",
            Array.from({ length: 401 }, (_, i) => {
              const q = phy.porous(400 + 9 * i, p.d, p.sigma, p.rho, p.c).z;
              return [q.re, q.im];
            }),
            "p4PorousRe(ff,d,sigma,rho,c)",
            "p4PorousIm(ff,d,sigma,rho,c)",
          ),
          points(
            "当前阻抗，吸声系数 " + fmt(asks[1].calc(p)),
            [[z.re, z.im]],
            "real(Zdb)",
            "imag(Zdb)",
            { marker: "o", style: "none" },
          ),
        ],
        setup + "ff=linspace(400,4000,401);",
        { equalAspect: true },
      ),
      "absorption",
    );
  },
  engineering: engineering(
    "房间中多孔层用于中高频混响控制；水声吸声结构则常结合弹性损耗、局部共振和阻抗过渡。设计时应先选择与介质和材料相符的模型。",
    "hall",
    "交通枢纽语音清晰度",
  ),
});

export default completeExamples(completedLecture);
