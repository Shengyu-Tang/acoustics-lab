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
const f = parameter("f", "频率", "f", "Hz", 1000, 10000, 100),
  a = parameter("a", "软圆柱半径", "a", "m", 0.02, 0.08, 0.001),
  pa = parameter("pa", "入射声压峰值", "pₐ", "Pa", 0.1, 10, 0.1);
const p = { ...water, f: 5000, pa: 1, r: 5, theta: 180 },
  setup = "ka=k*a;Cback=p4CylFar(ka,theta*pi/180,1);";
const coefficient = (p: Record<string, number>) =>
  phy.magnitude(phy.cylinderFar(phy.kWave(p.f, p.c) * p.a, (p.theta * Math.PI) / 180, true));
const asks = [
  ask(
    "pressure",
    "(1) 后向散射声压峰值",
    "Pa",
    "|P_s|\\simeq p_a\\sqrt{\\frac{2}{\\pi kr}}|C(\\theta)|",
    "pa*sqrt(2/(pi*k*r))*abs(p4CylFar(k*a,theta*pi/180,1))",
    (p) => p.pa * Math.sqrt(2 / (Math.PI * phy.kWave(p.f, p.c) * p.r)) * coefficient(p),
    substitution,
  ),
  ask(
    "intensity",
    "(2) 后向平均散射声强",
    "W/m²",
    "I_s=|P_s|^2/(2\\rho_0c_0)",
    "pressure^2/(2*rho*c)",
    (p) =>
      (((p.pa ** 2 / (2 * p.rho * p.c)) * 2) / (Math.PI * phy.kWave(p.f, p.c) * p.r)) *
      coefficient(p) ** 2,
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
    "压力释放圆柱：总场表面声压为零",
    [-0.3, 0.3],
    [-0.3, 0.3],
    (x, y) => p.pa * phy.cylinderField(x, y, p.a, p.f, p.c, true).total.re,
    "pa*real(p4Cyl(XX,YY,a,f,c,1,2))",
    "",
    boundary,
    [-2 * p.pa, 2 * p.pa],
    "声压 (Pa)",
    "[-2 2]*pa",
  );
  if (cache.size > 8) cache.clear();
  cache.set(key, q);
  return structuredClone(q);
}
export default makeLecture("5.3", {
  defaults: p,
  parameters: [a, f, pa],
  keyPoints: [
    "绝对软无限长圆柱要求总声压在圆柱表面为零，散射场抵消入射场在边界上的声压。",
    "柱坐标展开使用普通贝塞尔函数与向外传播的第二类汉克尔函数，散射系数由软边界确定。",
    "远处散射声压按距离平方根衰减，散射声强按距离一次方衰减；它属于二维柱面扩展而非三维球面扩展。",
  ],
  formulas: [
    {
      number: "5.3-1",
      tex: "P_s=-p_a\\sum_{n=0}^\\infty\\epsilon_n(-j)^n\\frac{J_n(ka)}{H_n^{(2)}(ka)}H_n^{(2)}(kr)\\cos n\\theta,\\quad\\epsilon_0=1,\\ \\epsilon_{n>0}=2",
      meaning: "入射平面波与散射柱面波相加后，在绝对软表面声压为零。",
    },
    {
      number: "5.3-2",
      tex: "I_s\\simeq I_i\\frac{2}{\\pi kr}|C(\\theta)|^2,\\quad C(\\theta)=-\\sum_n\\epsilon_n\\frac{J_n(ka)}{H_n^{(2)}(ka)}\\cos n\\theta",
      meaning: "在远场按方向系数计算平均散射声强；这里的距离扩展为柱面扩展。",
    },
  ],
  figures: [
    figure("5.3-1", "绝对软圆柱的远场散射指向性", (p) => {
      const ka = phy.kWave(p.f, p.c) * p.a,
        ths = Array.from({ length: 361 }, (_, i) => (2 * Math.PI * i) / 360),
        vals = ths.map((th) => phy.magnitude(phy.cylinderFar(ka, th, true))),
        peak = Math.max(...vals);
      return [
        graph(
          p,
          0,
          "压力释放圆柱的相对散射幅值",
          "方向角",
          "归一化散射幅值",
          [0, 2 * Math.PI],
          [0, 1],
          [
            points(
              "软圆柱方向函数",
              ths.map((th, i) => [th, vals[i] / peak]),
              "linspace(0,2*pi,361)",
              "abs(p4CylFar(ka,x,1))/peak",
            ),
          ],
          "ka=k*a;qth=linspace(0,2*pi,361);peak=max(abs(p4CylFar(ka,qth,1)));",
          { kind: "polar" },
        ),
      ];
    }),
    figure("5.3-2", "软圆柱的总声场与零声压边界", (p) => [field(p)]),
  ],
  answers: ["散射场满足无源亥姆霍兹方程，圆柱表面有 $P_s=-P_i$，无穷远处满足向外柱面辐射条件。"],
  exampleTitle: "例题　长软圆柱的后向散射回波",
  background:
    "将长软圆柱近似为无限长压力释放圆柱，半径 50 mm，受 5 kHz、峰值 1 Pa 的平面波照射。接收器位于入射反方向 5 m，求远场散射声压与声强，并考察接收距离的影响。",
  exampleDefaults: p,
  given: [a, f, pa],
  asks,
  judgment:
    "无限长圆柱采用二维散射模型，后向远场声强按距离一次方衰减；真实有限圆柱在足够远处会转为三维扩展。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "后向回波沿接收距离的柱面扩展衰减",
        "后向接收距离 r (m)",
        "平均散射声强 (W/m²)",
        [0.5, 10],
        [0, 1],
        [
          curve(
            "软圆柱后向远场回波",
            (r) =>
              (((p.pa ** 2 / (2 * p.rho * p.c)) * 2) / (Math.PI * phy.kWave(p.f, p.c) * r)) *
              coefficient(p) ** 2,
            [0.5, 10],
            "linspace(.5,10,401)",
            "pa^2/(2*rho*c)*2./(pi*k*x)*abs(Cback)^2",
          ),
          points("五米接收器", [[p.r, asks[1].calc(p)]], "r", "intensity", {
            marker: "o",
            style: "none",
          }),
        ],
        setup,
      ),
      "intensity",
    ),
  engineering: engineering(
    "长管状目标和近似压力释放表面的二维散射可帮助估算方向相关的回波。模型适用性需按目标长度、波长和接收距离判断。",
    "sonar",
    "海底观测站主动声呐",
  ),
});
