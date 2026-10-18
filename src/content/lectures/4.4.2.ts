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
  circle,
  substitution,
  answer,
} from "../p4";
import { imagePanel } from "../../plot/p4Fields";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "频率", "f", "Hz", 200, 1500, 100),
  a = parameter("a", "积分圆半径", "a", "m", 0.3, 1, 0.05),
  N = { ...parameter("N", "边界离散点数", "N", "—", 8, 128, 8), integer: true };
const p = { ...water, a: 0.5, N: 32, r: 1.5 };
const asks = [
  ask("wavelength", "(1) 介质波长", "m", "\\lambda=c_0/f", "c/f", (p) => p.c / p.f, substitution),
  ask(
    "pressure",
    "(2) 外场重建幅值",
    "—",
    "P_N=-\\sum_s(G\\partial_nP-P\\partial_nG)\\Delta s",
    "abs(p4Helm(r,0,a,f,c,N,1))",
    (p) => phy.magnitude(phy.helmholtz(p.r, 0, p.a, p.f, p.c, p.N, true)),
    substitution,
  ),
];
const cache = new Map<string, ReturnType<typeof imagePanel>>();
function field(p: Record<string, number>) {
  const key = JSON.stringify(p);
  if (cache.has(key)) return structuredClone(cache.get(key)!);
  const boundary = circle(p).series!.map((s) => ({
    ...s,
    mx: "a*cos(linspace(0,2*pi,181))",
    my: "a*sin(linspace(0,2*pi,181))",
  }));
  const q = imagePanel(
    p,
    0,
    "外域积分：圆内为零，圆外重建柱面点源场",
    [-2, 2],
    [-2, 2],
    (x, y) =>
      Math.abs(Math.hypot(x, y) - p.a) > 0.04
        ? phy.helmholtz(x, y, p.a, p.f, p.c, p.N, true).re
        : 0,
    "real(p4Helm(XX,YY,a,f,c,N,1)).*(abs(hypot(XX,YY)-a)>.04)",
    "",
    boundary,
    [-0.3, 0.3],
    "归一化声压实部",
  );
  if (cache.size > 8) cache.clear();
  cache.set(key, q);
  return structuredClone(q);
}
export default makeLecture("4.4.2", {
  defaults: p,
  parameters: [f, a, N],
  keyPoints: [
    "声源位于闭曲面内部时，已知边界数据并施加无穷远向外辐射条件，可重建曲面外部声场。",
    "以几何外法向写外域表示时，积分符号与内域表示相反；若改用求解域外法向，应同步改变法向定义。",
    "边界上的声压与法向振速共同决定无源域声场，可等效为单层与双层次级源分布。",
    "积分具有区域选择性：外域表示在曲面内的非边界场点处为零；演示采用二维圆周及柱面格林函数。",
  ],
  formulas: [
    {
      number: "4.4.2-1",
      tex: "P(M)=\\int_S\\left(P\\partial_nG-G\\partial_nP\\right)\\mathrm dS,\\quad M\\text{ 在面外}",
      meaning: "本式的法向指向几何外部；无穷远积分因辐射条件而消失。",
    },
    {
      number: "4.4.2-2",
      tex: "\\lim_{r\\to\\infty}r(\\partial_rP+jkP)=0,\\quad G_{2D}=-jH_0^{(2)}(kr)/4",
      meaning: "第一式是三维远辐射条件；二维图采用相应的柱面向外辐射解。",
    },
  ],
  figures: [
    figure(
      "4.4.2-1",
      "由圆周边界重建外部点源场及内部零值验证",
      (p) => [
        field(p),
        graph(
          p,
          0,
          "外域表示的区域选择性（边界附近留缺口）",
          "场点至圆心距离 r (m)",
          "归一化声压幅值",
          [0, 3],
          [0, 0.5],
          [
            curve(
              "圆内积分应为零",
              (x) => phy.magnitude(phy.helmholtz(x, 0, p.a, p.f, p.c, p.N, true)),
              [0, 0.8 * p.a],
              "linspace(0,.8*a,401)",
              "abs(p4Helm(x,zeros(size(x)),a,f,c,N,1))",
            ),
            curve(
              "圆外重建",
              (x) => phy.magnitude(phy.helmholtz(x, 0, p.a, p.f, p.c, p.N, true)),
              [1.2 * p.a, 3],
              "linspace(1.2*a,3,401)",
              "abs(p4Helm(x,zeros(size(x)),a,f,c,N,1))",
            ),
            curve(
              "圆外精确解",
              (x) => phy.magnitude(phy.green2(phy.kWave(p.f, p.c), x)),
              [1.2 * p.a, 3],
              "linspace(1.2*a,3,401)",
              "abs(p4Green(k,x))",
              "--",
            ),
          ],
        ),
      ],
      2,
      1,
    ),
  ],
  answers: ["求闭曲面外部的无源区声场，须同时满足无穷远辐射条件。"],
  exampleTitle: "例题　封闭测量边界外的二维声场外推",
  background:
    "半径 0.5 m 的闭合测量圆内有一二维点源，以单位格林函数作为归一化声压。频率为 1 kHz，用 32 个边界点外推到圆心外 1.5 m。求波长及重建幅值，并与柱面向外传播解比较。",
  exampleDefaults: p,
  given: [a, f, N],
  asks,
  judgment:
    "二维点源代表无限长线源的截面，不能将其远场幅值衰减规律当作三维球面扩展；圆内积分零值也不代表圆内真实源场为零。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "闭合边界外推场与源的真实外场对照",
        "径向距离 r (m)",
        "归一化声压幅值",
        [0, 3],
        [0, 0.5],
        [
          curve(
            "外推积分（圆内为零）",
            (x) =>
              Math.abs(x - p.a) < 0.04
                ? 0
                : phy.magnitude(phy.helmholtz(x, 0, p.a, p.f, p.c, p.N, true)),
            [0, 3],
            "linspace(0,3,401)",
            "abs(p4Helm(x,zeros(size(x)),a,f,c,N,1)).*(abs(x-a)>.04)",
          ),
          curve(
            "解析外场",
            (x) => (x > p.a + 0.04 ? phy.magnitude(phy.green2(phy.kWave(p.f, p.c), x)) : 0),
            [0, 3],
            "linspace(0,3,401)",
            "abs(p4Green(k,max(x,a+.04))).*(x>a+.04)",
            "--",
          ),
          points("外推接收位置", [[p.r, asks[1].calc(p)]], "r", "pressure", {
            marker: "o",
            style: "none",
          }),
        ],
      ),
      "pressure",
    ),
  engineering: engineering(
    "封闭扫描面可把复杂振源的辐射外推到远处，以减少大水池测量空间；测量面的闭合性、采样精度及法向符号必须一致。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
