import { completeExamples } from "../calculationSteps";
import {
  makeLecture,
  parameter,
  figure,
  ask,
  engineering,
  water,
  graph,
  points,
  substitution,
  answer,
} from "../p4";
import { imagePanel, fieldBoundary } from "../../plot/p4Fields";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "频率", "f", "Hz", 200, 1500, 100),
  a = parameter("a", "积分圆半径", "a", "m", 0.3, 1, 0.05),
  N = { ...parameter("N", "边界离散点数", "N", "—", 8, 128, 8), integer: true };
const p = { ...water, a: 0.5, N: 16, xobs: 0.25, yobs: 0.1 },
  Ns = [1, 8, 16, 24, 32, 48, 64, 96, 128, 150];
const reconstruction = (p: Record<string, number>, n = p.N) =>
  phy.helmholtz(p.xobs, p.yobs, p.a, p.f, p.c, n);
const error = (p: Record<string, number>, n = p.N) =>
  100 *
  phy.magnitude(
    phy.add(reconstruction(p, n), phy.scale(phy.phase(-phy.kWave(p.f, p.c) * p.xobs), -1)),
  );
const asks = [
  ask(
    "realPressure",
    "(1) 重建声压实部",
    "Pa",
    "\\Re P_N(M)=\\Re\\sum_s(G\\partial_np-P\\partial_nG)\\Delta s",
    "real(p4Helm(xobs,yobs,a,f,c,N,0))",
    (p) => reconstruction(p).re,
    substitution,
  ),
  ask(
    "errorPercent",
    "(2) 重建相对误差",
    "%",
    "\\epsilon_N=|P_N-P_{\\text{精确}}|/|P_{\\text{精确}}|",
    "100*abs(p4Helm(xobs,yobs,a,f,c,N,0)-exp(-1i*k*xobs))",
    (p) => error(p),
    substitution,
  ),
];
const cache = new Map<string, ReturnType<typeof imagePanel>[]>();
function fields(p: Record<string, number>) {
  const key = JSON.stringify(p);
  if (cache.has(key)) return structuredClone(cache.get(key)!);
  const boundary = fieldBoundary(p);
  const exact = imagePanel(
    p,
    0,
    "圆内平面波精确声场",
    [-1.2, 1.2],
    [-1.2, 1.2],
    (x, y) => (Math.hypot(x, y) < 0.9 * p.a * (1 - 1e-12) ? Math.cos(phy.kWave(p.f, p.c) * x) : 0),
    "cos(k*XX).*(hypot(XX,YY)<.9*a*(1-1e-12))",
    "",
    boundary,
    [-1, 1],
  );
  const numeric = imagePanel(
    p,
    0,
    "圆周边界重建圆内声场（显示半径小于 0.9a）",
    [-1.2, 1.2],
    [-1.2, 1.2],
    (x, y) =>
      Math.hypot(x, y) < 0.9 * p.a * (1 - 1e-12) ? phy.helmholtz(x, y, p.a, p.f, p.c, p.N).re : 0,
    "real(p4Helm(XX,YY,a,f,c,N,0)).*(hypot(XX,YY)<.9*a*(1-1e-12))",
    "",
    boundary,
    [-1, 1],
  );
  if (cache.size > 8) cache.clear();
  cache.set(key, [exact, numeric]);
  return structuredClone([exact, numeric]);
}
const completedLecture = makeLecture("4.4.1", {
  defaults: p,
  parameters: [f, a, N],
  keyPoints: [
    "声源位于闭曲面外时，曲面内无源区的声场可由边界声压及其法向导数重建。",
    "由第二格林恒等式与亥姆霍兹方程可推得积分表示；取包围场点的小球并令半径趋零得到场点值。",
    "外法向的方向与格林函数的向外传播约定必须一致；对闭曲面外的场点，该内域表示积分为零。",
    "二维演示采用圆周与向外传播的柱面格林函数；它说明积分结构，不把二维圆积分误作三维球面积分。",
  ],
  formulas: [
    {
      number: "4.4.1-1",
      tex: "P(M)=\\int_S\\left(G\\frac{\\partial P}{\\partial n}-P\\frac{\\partial G}{\\partial n}\\right)\\mathrm dS,\\quad G=\\frac{e^{-jkr}}{4\\pi r}",
      meaning: "适用于面内无源区；积分面法向指向几何外部，时间因子为 $e^{j\\omega t}$。",
    },
    {
      number: "4.4.1-2",
      tex: "G_{2D}=-\\frac j4H_0^{(2)}(kr),\\quad P_N=\\sum_s(G\\partial_nP-P\\partial_nG)\\Delta s",
      meaning: "演示图使用二维格林函数与圆周求积；离散点增加时重建误差下降。",
    },
  ],
  figures: [
    figure(
      "4.4.1-1",
      "闭合圆周的次级源重建平面波与离散误差",
      (p) => [
        ...fields(p),
        graph(
          p,
          0,
          "固定内场点处的求积误差随边界点数下降",
          "边界离散点数 N",
          "相对误差 (%)",
          [0, 150],
          [1e-13, 100],
          [
            points(
              "内域重建误差",
              Ns.map((n) => [n, Math.max(1e-13, error(p, n))]),
              "[1 8 16 24 32 48 64 96 128 150]",
              "max(1e-13,100*abs(arrayfun(@(nn)p4Helm(xobs,yobs,a,f,c,nn,0),x)-exp(-1i*k*xobs)))",
              { marker: "o" },
            ),
          ],
          "",
          { yscale: "log", integerX: true },
        ),
      ],
      3,
      1,
    ),
  ],
  answers: [
    "用闭曲面上的声压及其法向导数重建曲面内无源区的声场。",
    "对场与格林函数应用第二格林恒等式，挖去场点附近小球，再令小球半径趋零。",
    "可求内部无源区；同一内域积分在外部场点处为零。",
  ],
  exampleTitle: "例题　声全息圆周采样的重建误差",
  background:
    "用半径 0.5 m 的圆周阵列记录 1 kHz、峰值 1 Pa 的平面波，采用 16 个等间距边界点重建坐标 (0.25 m, 0.10 m) 处的复声压。求实部与相对误差，并考察增加采样点的效果。",
  exampleDefaults: p,
  given: [a, f, N],
  asks,
  judgment: "误差由求积离散引起；靠近边界时需更多点，极小误差到达浮点精度后不再单调下降。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "固定接收点的离散重建精度与采样成本",
        "圆周采样点数 N",
        "重建相对误差 (%)",
        [0, 150],
        [1e-13, 100],
        [
          points(
            "该测点的重建误差",
            Ns.map((n) => [n, Math.max(1e-13, error(p, n))]),
            "[1 8 16 24 32 48 64 96 128 150]",
            "max(1e-13,100*abs(arrayfun(@(nn)p4Helm(xobs,yobs,a,f,c,nn,0),x)-exp(-1i*k*xobs)))",
            { marker: "s" },
          ),
          points("本题采样数", [[p.N, Math.max(1e-13, error(p))]], "N", "max(1e-13,errorPercent)", {
            marker: "o",
            style: "none",
          }),
        ],
        "",
        { yscale: "log", integerX: true },
      ),
      "errorPercent",
    ),
  engineering: engineering(
    "声全息测量使用闭合测量面重建其内部无源区。实际采样须同时满足空间采样精度和边界数据的测量精度。",
    "receiver",
    "水下监听接收器选型",
  ),
});

export default completeExamples(completedLecture);
