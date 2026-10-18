import { fieldBoundary } from "../../plot/p4Fields";
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
const f = parameter("f", "频率", "f", "Hz", 500, 10000, 100),
  a = parameter("a", "球半径", "a", "m", 0.01, 0.1, 0.001),
  v = parameter("v", "表面振速峰值", "v₀", "m/s", 0.001, 0.03, 0.001),
  r = parameter("r", "测量距离", "r", "m", 0.2, 5, 0.1);
const p = { ...water, f: 5000, r: 2 };
const setup = "[Rs,Xs,Prad,Ms]=p4Sphere(a,f,rho,c,v);";
const asks = [
  ask(
    "pressure",
    "(1) 测点声压峰值",
    "Pa",
    "|P(r)|=\\frac{\\rho_0c_0v_0ka^2}{r\\sqrt{1+(ka)^2}}",
    "abs(p4SphereP(r,a,f,rho,c,v))",
    (p) => phy.magnitude(phy.sphere(p.a, p.f, p.rho, p.c, p.v, p.r).pressure),
    substitution,
  ),
  ask(
    "intensity",
    "(2) 测点平均声强",
    "W/m²",
    "I=|P|^2/(2\\rho_0c_0)",
    "pressure^2/(2*rho*c)",
    (p) =>
      phy.magnitude(phy.sphere(p.a, p.f, p.rho, p.c, p.v, p.r).pressure) ** 2 / (2 * p.rho * p.c),
    substitution,
  ),
];
function field(p: Record<string, number>, t: number) {
  const xs = Array.from({ length: 161 }, (_, i) => -0.5 + i / 160),
    ys = Array.from({ length: 81 }, (_, i) => -0.5 + i / 80),
    amp = phy.magnitude(phy.sphere(p.a, p.f, p.rho, p.c, p.v, p.a).pressure);
  return graph(
    p,
    t,
    "均匀脉动球向外辐射（球内留白）",
    "位置 x (m)",
    "示意坐标 y (m)",
    [-0.5, 0.5],
    [-0.5, 0.5],
    fieldBoundary(p),
    setup +
      "[XX,YY]=meshgrid(linspace(-.5,.5,161),linspace(-.5,.5,81));RR=hypot(XX,YY);ZZ=real(p4SphereP(max(a,RR),a,f,rho,c,v)*exp(1i*w*tView));ZZ(RR<a*(1+1e-12))=0;",
    {
      equalAspect: true,
      legend: false,
      field: {
        x: xs,
        y: ys,
        z: ys.map((y) =>
          xs.map((x) => {
            const r = Math.hypot(x, y);
            if (r < p.a * (1 + 1e-12)) return 0;
            const z = phy.sphere(p.a, p.f, p.rho, p.c, p.v, r).pressure;
            return z.re * Math.cos(2 * Math.PI * p.f * t) - z.im * Math.sin(2 * Math.PI * p.f * t);
          }),
        ),
        label: "声压 (Pa)",
        limits: [-amp, amp],
        map: "RdBu",
      },
    },
    {
      field: { x: "linspace(-.5,.5,161)", y: "linspace(-.5,.5,81)", z: "ZZ" },
      fieldLimits: "[-1 1]*abs(p4SphereP(a,a,f,rho,c,v))",
    },
  );
}
export default makeLecture("4.2.1", {
  defaults: p,
  parameters: [f, a, v],
  animation: true,
  animationPeriod: (p) => 1 / p.f,
  keyPoints: [
    "均匀脉动球的表面各处沿法向作同幅同相振动，辐射场具有球对称性。",
    "相同球半径、表面振速与观察距离下，频率升高使辐射声压增大，并逐渐接近高频极限。",
    "相同频率与表面振速下，球半径越大，辐射声压越大；讨论大小球时必须说明保持不变的量。",
  ],
  formulas: [
    {
      number: "4.2.1-1",
      tex: "P(r)=\\rho_0c_0v_0\\frac{jka^2}{(1+jka)r}e^{-jk(r-a)}",
      meaning: "由球表面振速边界条件求得向外扩张的球面波，时间因子为 $e^{j\\omega t}$。",
    },
    {
      number: "4.2.1-2",
      tex: "|P(r)|=\\rho_0c_0v_0\\frac{ka^2}{r\\sqrt{1+(ka)^2}}",
      meaning: "固定表面振速、观察距离时，该式直接显示频率与球尺寸的影响。",
    },
  ],
  figures: [
    figure("4.2.1-1", "均匀脉动球的辐射声场动画", (p, t) => [field(p, t)]),
    figure("4.2.1-2", "固定距离 2 m 处不同半径的声压频率曲线", (p) => [
      graph(
        p,
        0,
        "相同表面振速下大球更利于辐射",
        "频率 f (Hz)",
        "声压峰值 (Pa)",
        [100, 10000],
        [1, 1000],
        [
          ...[0.02, 0.05, 0.1].map((radius) =>
            points(
              "半径 " + radius + " m",
              log(100, 10000).map((f) => [
                f,
                phy.magnitude(phy.sphere(radius, f, p.rho, p.c, p.v, 2).pressure),
              ]),
              "logspace(2,4,401)",
              "abs(p4SphereP(2," + radius + ",x,rho,c,v))",
            ),
          ),
          points(
            "当前球源",
            [[p.f, phy.magnitude(phy.sphere(p.a, p.f, p.rho, p.c, p.v, 2).pressure)]],
            "f",
            "abs(p4SphereP(2,a,f,rho,c,v))",
            { marker: "o", style: "none" },
          ),
        ],
        setup,
        { xscale: "log", yscale: "log" },
      ),
    ]),
  ],
  answers: [
    "球面上各点沿法向作同相、同幅振动的理想声源。",
    "保持表面振速、频率和观察距离相同，大球的辐射声压较大。保持体积速度不变时结论需另行讨论。",
  ],
  exampleTitle: "例题　水下球面发射器的声压校准",
  background:
    "半径 50 mm 的球面发射器以 1 kHz、0.01 m/s 的表面振速峰值工作，水听器位于球心外 2 m。求声压峰值及平均声强；采用水的密度 1000 kg/m³、声速 1500 m/s。",
  exampleDefaults: { ...p, f: 1000 },
  given: [a, f, v, r],
  asks,
  judgment:
    "球面波的声压按距离一次方衰减，平均声强按距离平方衰减；近场不能将振速直接写成声压除以特性阻抗。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "水听器沿球源径向移动时的声压包络",
        "距球心距离 r (m)",
        "声压峰值 (Pa)",
        [0.1, 5],
        [0, 1],
        [
          curve(
            "严格球面辐射包络",
            (r) => phy.magnitude(phy.sphere(p.a, p.f, p.rho, p.c, p.v, r).pressure),
            [0.1, 5],
            "linspace(.1,5,401)",
            "abs(p4SphereP(x,a,f,rho,c,v))",
          ),
          points("水听器测点", [[p.r, asks[0].calc(p)]], "r", "pressure", {
            marker: "o",
            style: "none",
          }),
          points(
            "球心至测点",
            [
              [0, 0],
              [p.r, 0],
            ],
            "[0 r]",
            "[0 0]",
            { geometry: { key: "r", axis: "x" }, style: "--" },
          ),
        ],
        setup,
      ),
      "pressure",
    ),
  engineering: engineering(
    "球面换能器在水池中校准时，先由几何扩展估算水听器位置的声压，再判断传感器量程。近距离校准还需考虑振速的近场分量。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
