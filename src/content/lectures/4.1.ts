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
const f = parameter("f", "工作频率", "f", "Hz", 100, 10000, 100),
  a = parameter("a", "球半径", "a", "m", 0.01, 0.1, 0.001),
  Rm = parameter("Rm", "内部力阻", "Rₘ", "kg/s", 20, 2000, 10),
  v = parameter("v", "表面振速峰值", "v₀", "m/s", 0.001, 0.03, 0.001);
const p = { ...water, Rm: 200, M: 0.1, D: 1e5 };
const state = (p: typeof water & { Rm: number }) => phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1);
const asks = [
  ask(
    "efficiency",
    "(1) 辐射效率",
    "%",
    "\\eta=R_s/(R_s+R_m)",
    "100*Rs/(Rs+Rm)",
    (p) => {
      const q = phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1);
      return (100 * q.z.re) / (q.z.re + p.Rm);
    },
    substitution,
  ),
  ask(
    "radiated",
    "(2) 辐射声功率",
    "W",
    "\\bar W=\\tfrac12R_sv_0^2",
    "Prad",
    (p) => phy.sphere(p.a, p.f, p.rho, p.c, p.v, 1).power,
    substitution,
  ),
];
const setup = "[Rs,Xs,Prad,Ms]=p4Sphere(a,f,rho,c,v);";
export default makeLecture("4.1", {
  defaults: p,
  parameters: [f, a, Rm, v],
  keyPoints: [
    "辐射器推动介质，介质的惯性与弹性使振动传播到远处，形成声辐射。",
    "辐射定解问题包括亥姆霍兹方程、振源表面的法向振速条件与无穷远辐射条件。",
    "辐射阻抗是介质反作用力与振速之比；辐射阻耗能，辐射抗储能。",
    "辐射声功率可由表面力与振速或声强通量积分求得；效率由辐射阻与内部力阻共同决定。",
  ],
  formulas: [
    {
      number: "4.1-1",
      tex: "\\nabla^2P+k^2P=0,\\quad \\partial_nP=-j\\omega\\rho_0v_n,\\quad \\lim_{r\\to\\infty}r(\\partial_rP+jkP)=0",
      meaning: "时间因子采用 $e^{j\\omega t}$；末式选取向外传播的声场。",
    },
    {
      number: "4.1-2",
      tex: "Z_s=R_s+jX_s,\\quad\\bar W=\\tfrac12 R_s|v_0|^2,\\quad\\eta=\\frac{R_s}{R_s+R_m}",
      meaning: "辐射阻决定净输出功率，辐射抗对应周期内交换的储能。",
    },
  ],
  figures: [
    figure(
      "4.1-1",
      "力—电压类比中的机械与辐射阻抗串联",
      (p) => [
        graph(
          p,
          0,
          "内阻耗散与向介质辐射的串联模型",
          "电路示意位置",
          "示意坐标",
          [0, 10],
          [0, 3],
          [
            points(
              "串联支路",
              [
                [0, 1],
                [1, 1],
                [1, 2],
                [2, 2],
                [2, 1],
                [3, 1],
                [3, 2],
                [4, 2],
                [4, 1],
                [5, 1],
                [5, 2],
                [6, 2],
                [6, 1],
                [7, 1],
                [7, 2],
                [8, 2],
                [8, 1],
                [10, 1],
              ],
              "[0 1 1 2 2 3 3 4 4 5 5 6 6 7 7 8 8 10]",
              "[1 1 2 2 1 1 2 2 1 1 2 2 1 1 2 2 1 1]",
            ),
          ],
          setup,
          {
            legend: false,
            textLabels: [
              { x: 1.5, y: 2.5, text: "质量 M" },
              { x: 3.5, y: 2.5, text: "弹性 D" },
              { x: 5.5, y: 2.5, text: "内阻 Rₘ" },
              { x: 7.5, y: 2.5, text: "辐射 Rₛ+jXₛ" },
            ],
          },
        ),
        graph(
          p,
          0,
          "球面振源的真实截面",
          "位置 x (m)",
          "示意坐标 y (m)",
          [-0.1, 0.1],
          [-0.1, 0.1],
          [
            points(
              "球面",
              Array.from({ length: 181 }, (_, i) => [
                p.a * Math.cos((i * Math.PI) / 90),
                p.a * Math.sin((i * Math.PI) / 90),
              ]),
              "a*cos(linspace(0,2*pi,181))",
              "a*sin(linspace(0,2*pi,181))",
              { geometry: { key: "a", axis: "x" } },
            ),
          ],
          "",
          { equalAspect: true, legend: false },
        ),
      ],
      2,
      1,
    ),
    figure("4.1-2", "均匀脉动球的机声转换效率", (p) => {
      const q = state(p as typeof water & { Rm: number });
      return [
        graph(
          p,
          0,
          "辐射效率随频率增大而提高",
          "频率 f (Hz)",
          "辐射效率 (%)",
          [0, 10000],
          [0, 100],
          [
            curve(
              "辐射效率",
              (x) => {
                const r = state({ ...p, f: x } as typeof water & { Rm: number }).z.re;
                return (100 * r) / (r + p.Rm);
              },
              [0, 10000],
              "linspace(0,10000,401)",
              "100*(rho*c*4*pi*a^2*(2*pi*x*a/c).^2./(1+(2*pi*x*a/c).^2))./(rho*c*4*pi*a^2*(2*pi*x*a/c).^2./(1+(2*pi*x*a/c).^2)+Rm)",
            ),
            points("当前频率", [[p.f, (100 * q.z.re) / (q.z.re + p.Rm)]], "f", "100*Rs/(Rs+Rm)", {
              marker: "o",
              style: "none",
            }),
          ],
          setup,
        ),
      ];
    }),
  ],
  answers: [
    "振动表面向周围介质输送声能，形成向外传播的声场。",
    "介质具有惯性和弹性。",
    "给出亥姆霍兹方程、振源边界的法向振速条件与无穷远辐射条件。",
    "介质反作用力与振源振速的复比值，分为辐射阻与辐射抗。",
    "辐射阻是耗能元件，辐射抗是储能元件。",
    "单位时间向介质输送的时间平均声能。",
    "可算 $\\tfrac12\\Re(Fv^*)$，也可对闭曲面的平均声强取通量积分。",
  ],
  exampleTitle: "例题　水下脉动球的输入功率分配",
  background:
    "小型水下发射器的球面半径为 50 mm，表面振速峰值为 0.01 m/s，内部力阻为 200 kg/s。工作于 1 kHz，求辐射效率及输出声功率，判断电机输入功率主要消耗在哪里。",
  exampleDefaults: p,
  given: [a, f, Rm, v],
  asks,
  judgment: "辐射阻随频率改变；相同振速下，内阻损耗与输出声功率应分别核算。不能把辐射抗当作耗散。",
  examplePlot: (p) => {
    const q = state(p as typeof water & { Rm: number });
    return answer(
      graph(
        p,
        0,
        "输入平均功率分为内阻耗散与声辐射",
        "功率去向",
        "平均功率 (W)",
        [0.5, 2.5],
        [0, 1],
        [
          points(
            "内阻损耗与辐射功率",
            [
              [1, 0.5 * p.Rm * p.v ** 2],
              [2, q.power],
            ],
            "[1 2]",
            ".5*v^2*[Rm Rs]",
            { kind: "bar" },
          ),
        ],
        setup,
        {
          xtickLabels: [
            { value: 1, label: "内阻损耗" },
            { value: 2, label: "声辐射" },
          ],
        },
      ),
      "radiated",
    );
  },
  engineering: engineering(
    "水下发射换能器设计需同时控制机械损耗、辐射负载和驱动能力。提高辐射效率不等于在任意频率都能维持同一振速。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
