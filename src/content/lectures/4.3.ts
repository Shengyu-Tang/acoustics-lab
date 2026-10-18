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
  comparison,
  log,
} from "../p4";
import { imagePanel } from "../../plot/p4Fields";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "频率", "f", "Hz", 500, 3000, 100),
  d = parameter("d", "两源间距", "d", "m", 0.002, 0.04, 0.001),
  Q = parameter("Q", "单源体积速度", "Q", "m³/s", 1e-6, 3e-5, 1e-6);
const p = { ...water, d: 0.02, Q: 1e-5, r: 10, theta: 30 };
const asks = [
  ask(
    "ratio",
    "(1) 偶极与单极功率比",
    "—",
    "\\bar W_d/\\bar W_m=(kd)^2/3",
    "(k*d)^2/3",
    (p) => phy.dipoleRatio(p.f, p.d, p.c),
    substitution,
  ),
  ask(
    "pressure",
    "(2) 三十度方向声压峰值",
    "Pa",
    "|P_d|\\simeq\\frac{\\rho_0\\omega Q}{4\\pi r}kd|\\cos\\theta|",
    "rho*f*Q/(2*r)*k*d*abs(cosd(theta))",
    (p) =>
      ((p.rho * p.f * p.Q) / (2 * p.r)) *
      phy.kWave(p.f, p.c) *
      p.d *
      Math.abs(Math.cos((p.theta * Math.PI) / 180)),
    substitution,
  ),
];
export default makeLecture("4.3", {
  defaults: p,
  parameters: [f, d, Q],
  keyPoints: [
    "声偶极子由两个间距远小于波长、等强反相的点源组成，不能看成单个各向同性点源。",
    "远场指向性函数为余弦绝对值，偶极轴方向最强，赤道平面为零；三维指向性为双瓣。",
    "远场声强按距离平方衰减，但相对同强度单极子，偶极子的总辐射功率多一个小尺寸平方因子。",
  ],
  formulas: [
    {
      number: "4.3-1",
      tex: "P_d\\simeq-\\frac{\\rho_0\\omega Qkd}{4\\pi r}\\cos\\theta\\,e^{-jkr},\\quad kd\\ll1,\\ r\\gg d",
      meaning: "两点源作相反体积运动；远场相消使低频辐射效率较低。",
    },
    {
      number: "4.3-2",
      tex: "D(\\theta)=|\\cos\\theta|,\\quad I\\propto r^{-2},\\quad\\frac{\\bar W_d}{\\bar W_m}=\\frac{(kd)^2}{3}",
      meaning: "功率比以组成偶极子的一个点源的声功率为分母。",
    },
  ],
  figures: [
    figure("4.3-1", "两个反相点源形成的偶极辐射声场", (p) => [
      imagePanel(
        p,
        0,
        "四分之一周期的偶极声场（近源颜色饱和）",
        [-0.5, 0.5],
        [-0.5, 0.5],
        (x, y) => -phy.dipolePressure(x, y, p.d, p.Q, p.f, p.rho, p.c).im,
        "-imag(p4Dipole(XX,YY,d,Q,f,rho,c))",
        "",
        [
          points(
            "反相点源对",
            [
              [-p.d / 2, 0],
              [p.d / 2, 0],
            ],
            "[-d/2 d/2]",
            "[0 0]",
            { marker: "o", style: "none", geometry: { key: "d", axis: "x" } },
          ),
        ],
        [
          -p.rho * p.f * p.Q * phy.kWave(p.f, p.c) * p.d,
          p.rho * p.f * p.Q * phy.kWave(p.f, p.c) * p.d,
        ],
        "声压 (Pa)",
        "[-1 1]*rho*f*Q*k*d",
      ),
    ]),
    comparison(
      figure(
        "4.3-2",
        "小间距偶极子的二维及三维指向性",
        (p) => [
          graph(
            p,
            0,
            "偶极子的二维指向性",
            "方向角",
            "幅值指向性",
            [0, 2 * Math.PI],
            [0, 1],
            [
              curve(
                "余弦绝对值",
                (x) => Math.abs(Math.cos(x)),
                [0, 2 * Math.PI],
                "linspace(0,2*pi,401)",
                "abs(cos(x))",
              ),
            ],
            "",
            { kind: "polar" },
          ),
          graph(
            p,
            0,
            "三维双瓣指向性的经线投影",
            "横向投影",
            "轴向投影",
            [-1, 1],
            [-1, 1],
            Array.from({ length: 7 }, (_, j) => {
              const phi = (j * Math.PI) / 6;
              return points(
                "方位角 " + Math.round((phi * 180) / Math.PI) + "°",
                Array.from({ length: 181 }, (_, i) => {
                  const th = (i * Math.PI) / 180,
                    r = Math.abs(Math.cos(th));
                  return [r * Math.sin(th) * Math.cos(phi), r * Math.cos(th)];
                }),
                "abs(cos(qth)).*sin(qth)*cos(" + phi + ")",
                "abs(cos(qth)).*cos(qth)",
                { legend: false },
              );
            }),
            "qth=linspace(0,pi,181);",
            { equalAspect: true, legend: false },
          ),
        ],
        2,
        1,
      ),
      ["f", "d", "Q"],
      "本图单独比较小间距、远场极限的无量纲方向函数；尺度与频率对绝对声场和功率的影响见另两图。",
    ),
    figure("4.3-3", "偶极辐射的低频功率劣势", (p) => [
      graph(
        p,
        0,
        "小间距近似的总声功率比",
        "无量纲间距 kd",
        "偶极与单极功率比",
        [0.001, 1],
        [1e-7, 1],
        [
          points(
            "小间距平方律",
            log(0.001, 1).map((x) => [x, (x * x) / 3]),
            "logspace(-3,0,401)",
            "x.^2/3",
          ),
          points(
            "当前声源间距",
            [[phy.kWave(p.f, p.c) * p.d, asks[0].calc(p)]],
            "k*d",
            "(k*d)^2/3",
            { marker: "o", style: "none" },
          ),
        ],
        "",
        { xscale: "log", yscale: "log" },
      ),
    ]),
  ],
  answers: [
    "两个等强反相且间距远小于波长的点源组成声偶极子。",
    "不能等效为一个各向同性点源，因为其远场有明显方向性和零辐射方向。",
    "声辐射或接收幅值随方向变化的性质。",
    "以某方向的远场声压幅值除以参考方向的最大声压幅值。",
    "远场呈余弦型双瓣指向性，声强按距离平方衰减，低频总功率受到小间距平方因子的抑制。",
  ],
  exampleTitle: "例题　反相水声源对的低频辐射",
  background:
    "两只间距 20 mm 的点源在水中以 1 kHz 等强反相工作，单源体积速度峰值为 $10^{-5}\\ \\mathrm{m^3/s}$。求相对于一个单极子的总功率比，并求 10 m 处与偶极轴成 30° 方向的声压峰值。",
  exampleDefaults: p,
  given: [d, f, Q],
  asks,
  judgment: "功率比远小于一，说明小间距反相源对在低频下声辐射相消显著；赤道方向为声压零点。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "10 m 处偶极声压随极角变化及三十度接收点",
        "极角 θ (°)",
        "声压峰值 (Pa)",
        [0, 180],
        [0, 1],
        [
          curve(
            "远场偶极声压",
            (x) =>
              ((p.rho * p.f * p.Q) / (2 * p.r)) *
              phy.kWave(p.f, p.c) *
              p.d *
              Math.abs(Math.cos((x * Math.PI) / 180)),
            [0, 180],
            "linspace(0,180,401)",
            "rho*f*Q/(2*r)*k*d*abs(cosd(x))",
          ),
          points("三十度接收方向", [[p.theta, asks[1].calc(p)]], "theta", "pressure", {
            marker: "o",
            style: "none",
          }),
        ],
      ),
      "pressure",
    ),
  engineering: engineering(
    "小型振动结构的相反表面运动常形成偶极辐射。减小两侧声程差会加强低频相消，障板则可减少前后声场的相消。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
