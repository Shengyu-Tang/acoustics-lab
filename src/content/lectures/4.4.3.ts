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
} from "../p4";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "工作频率", "f", "Hz", 40000, 80000, 1000),
  a = parameter("a", "活塞半径", "a", "m", 0.025, 0.08, 0.001);
const p = { ...water, f: 50000 },
  setup = "ka=k*a;half=asind(1.616339948310703/ka);null=asind(3.831705970207513/ka);";
const asks = [
  ask("wavelength", "(1) 波长", "m", "\\lambda=c_0/f", "c/f", (p) => p.c / p.f, substitution),
  ask(
    "size",
    "(2) 无量纲尺寸",
    "—",
    "ka=2\\pi af/c_0",
    "k*a",
    (p) => phy.kWave(p.f, p.c) * p.a,
    substitution,
  ),
  ask(
    "nullAngle",
    "(3) 第一零点半角",
    "°",
    "\\theta_0=\\arcsin(3.831706/ka)",
    "null",
    (p) => phy.pistonNullAngle(p.a, p.f, p.c),
    substitution,
  ),
  ask(
    "beamwidth",
    "(4) 半功率全波束宽度",
    "°",
    "B_{-3\\mathrm{dB}}=2\\arcsin(1.616340/ka)",
    "2*half",
    (p) => 2 * phy.pistonHalfAngle(p.a, p.f, p.c),
    substitution,
  ),
];
export default makeLecture("4.4.3", {
  defaults: p,
  parameters: [f, a],
  keyPoints: [
    "瑞利积分将无限刚性障板上辐射面的振速分布叠加为半空间声场。",
    "均匀圆面活塞的远场指向性由一阶贝塞尔函数给出，轴线上取极限一。",
    "尺寸越大、频率越高，主瓣越窄；第一零点与半功率角由不同的方程确定。",
    "本讲默认水声活塞的无量纲尺寸约为 10.47，对应第一零点半角约 21.5°、半功率全宽约 17.8°。",
  ],
  formulas: [
    {
      number: "4.4.3-1",
      tex: "P(M)=\\frac{j\\rho_0\\omega}{2\\pi}\\int_Sv_n(Q)\\frac{e^{-jkr}}r\\,\\mathrm dS",
      meaning: "刚性障板的镜像作用使瑞利积分的系数为自由空间点源系数的两倍。",
    },
    {
      number: "4.4.3-2",
      tex: "D(\\theta)=\\frac{2J_1(ka\\sin\\theta)}{ka\\sin\\theta},\\quad D(0)=1",
      meaning: "远场声压等于轴向远场幅值乘方向函数；只考虑障板前方的半空间。",
    },
  ],
  figures: [
    figure("4.4.3-1", "圆面活塞远场指向性（分贝刻度）及特征角", (p) => {
      const half = (phy.pistonHalfAngle(p.a, p.f, p.c) * Math.PI) / 180,
        zero = (phy.pistonNullAngle(p.a, p.f, p.c) * Math.PI) / 180,
        ka = phy.kWave(p.f, p.c) * p.a;
      return [
        graph(
          p,
          0,
          "活塞前半空间的相对声压级",
          "方向角",
          "相对声压级 (dB)",
          [-Math.PI / 2, Math.PI / 2],
          [0, 40],
          [
            curve(
              "圆面活塞",
              (th) =>
                40 +
                Math.max(
                  -40,
                  20 * Math.log10(Math.max(1e-20, Math.abs(phy.pistonD(ka * Math.sin(th))))),
                ),
              [-Math.PI / 2, Math.PI / 2],
              "linspace(-pi/2,pi/2,401)",
              "40+max(-40,20*log10(max(1e-20,abs(p4PistonD(ka*sin(x))))))",
            ),
            points(
              "半功率半角 " + ((half * 180) / Math.PI).toPrecision(3) + "°",
              [
                [-half, 40 + 20 * Math.log10(1 / Math.sqrt(2))],
                [half, 40 + 20 * Math.log10(1 / Math.sqrt(2))],
              ],
              "[-half half]*pi/180",
              "(40+20*log10(1/sqrt(2)))*[1 1]",
              { marker: "o", style: "none" },
            ),
            points(
              "第一零点半角 " + ((zero * 180) / Math.PI).toPrecision(3) + "°",
              [
                [zero, 0],
                [zero, 40],
              ],
              "null*pi/180*[1 1]",
              "[0 40]",
              { style: "--" },
            ),
          ],
          setup,
          {
            kind: "polar",
            polarAngleLimits: [-90, 90],
            ytickLabels: [
              { value: 10, label: "−30 dB" },
              { value: 20, label: "−20 dB" },
              { value: 30, label: "−10 dB" },
              { value: 40, label: "0 dB" },
            ],
          },
          {
            legendNames: [
              "'圆面活塞'",
              "sprintf('半功率半角 %.3g°',half)",
              "sprintf('第一零点半角 %.3g°',null)",
            ],
          },
        ),
      ];
    }),
    figure(
      "4.4.3-2",
      "活塞方向函数的通用贝塞尔核",
      (p) => [
        graph(
          p,
          0,
          "方向函数的第一零点与旁瓣",
          "贝塞尔函数自变量",
          "方向函数幅值",
          [0, 20],
          [-0.2, 1],
          [
            curve(
              "圆面活塞核",
              (x) => phy.pistonD(x),
              [0, 20],
              "linspace(0,20,401)",
              "p4PistonD(x)",
            ),
          ],
          setup,
        ),
      ],
      1,
      1,
    ),
  ],
  answers: [
    "由半空间格林函数得到的面振速积分式，用于无限刚性障板上的辐射器。",
    "远场方向函数为 $2J_1(ka\\sin\\theta)/(ka\\sin\\theta)$，圆对称，尺寸或频率增大时主瓣变窄并出现旁瓣。",
  ],
  exampleTitle: "例题　海底观测站换能器的波束宽度",
  background:
    "障板圆面活塞半径 0.05 m、工作频率 50 kHz，水中声速 1500 m/s。求波长、无量纲尺寸、第一零点半角及半功率全波束宽度，为接收器角向扫描确定范围。",
  exampleDefaults: p,
  given: [a, f],
  asks,
  judgment: "半功率全宽约 17.8°，第一零点全宽约 42.9°；两者不能混作同一个波束宽度指标。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "换能器角向校准：半功率宽度与第一零点",
        "偏离轴线角度 θ (°)",
        "相对声压级 (dB)",
        [-90, 90],
        [-40, 0],
        [
          curve(
            "扫描得到的远场主瓣与旁瓣",
            (x) =>
              Math.max(
                -40,
                20 *
                  Math.log10(
                    Math.max(
                      1e-20,
                      Math.abs(
                        phy.pistonD(phy.kWave(p.f, p.c) * p.a * Math.sin((x * Math.PI) / 180)),
                      ),
                    ),
                  ),
              ),
            [-90, 90],
            "linspace(-90,90,401)",
            "max(-40,20*log10(max(1e-20,abs(p4PistonD(ka*sind(x))))))",
          ),
          points(
            "半功率两侧边界",
            [
              [-phy.pistonHalfAngle(p.a, p.f, p.c), -3.01029995664],
              [phy.pistonHalfAngle(p.a, p.f, p.c), -3.01029995664],
            ],
            "[-half half]",
            "20*log10(1/sqrt(2))*[1 1]",
            { marker: "o", style: "none" },
          ),
        ],
        setup,
        {
          annotations: [
            { axis: "y", value: -3.01029995664, label: "半功率声压级" },
            { axis: "x", value: phy.pistonNullAngle(p.a, p.f, p.c), label: "第一零点" },
          ],
        },
        { annotations: ["20*log10(1/sqrt(2))", "null"] },
      ),
      "beamwidth",
    ),
  engineering: engineering(
    "主动声呐的孔径与频率共同决定波束宽度。增大尺寸能提高方向分辨率，但需同时校核近场长度及可用校准距离。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
