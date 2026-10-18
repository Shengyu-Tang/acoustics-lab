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
} from "../p4";
import { imagePanel, fieldBoundary } from "../../plot/p4Fields";
import * as phy from "../../physics/chapter4";
const f = parameter("f", "频率", "f", "Hz", 1000, 10000, 100),
  a = parameter("a", "圆柱半径", "a", "m", 0.02, 0.08, 0.001),
  pa = parameter("pa", "入射声压峰值", "pₐ", "Pa", 0.1, 10, 0.1);
const p = { ...water, f: 3000, pa: 1 };
const asks = [
  ask(
    "frontPressure",
    "(1) 迎声面总声压峰值",
    "Pa",
    "P=P_i+P_s,\\quad\\partial_nP=0",
    "pa*abs(p4Cyl(-a,0,a,f,c,0,2))",
    (p) => p.pa * phy.magnitude(phy.cylinderField(-p.a, 0, p.a, p.f, p.c).total),
    substitution,
  ),
  ask(
    "gain",
    "(2) 迎声面声压增益",
    "—",
    "g=|P(-a,0)|/p_a",
    "frontPressure/pa",
    (p) => phy.magnitude(phy.cylinderField(-p.a, 0, p.a, p.f, p.c).total),
    substitution,
  ),
];
const cache = new Map<string, ReturnType<typeof imagePanel>[]>();
function field(p: Record<string, number>) {
  const key = JSON.stringify(p);
  if (cache.has(key)) return structuredClone(cache.get(key)!);
  const xs = Array.from({ length: 161 }, (_, i) => -0.3 + (0.6 * i) / 160),
    ys = Array.from({ length: 81 }, (_, i) => -0.3 + (0.6 * i) / 80),
    states = ys.map((y) => xs.map((x) => phy.cylinderField(x, y, p.a, p.f, p.c)));
  const boundary = fieldBoundary(p);
  const q = (["incident", "scattered", "total"] as const).map((part, index) =>
    imagePanel(
      p,
      0,
      ["入射场：假设尚未放入圆柱", "散射场：满足刚性边界的补偿场", "总场：入射场与散射场相加"][
        index
      ],
      [-0.3, 0.3],
      [-0.3, 0.3],
      (x, y) =>
        p.pa *
        (part === "incident"
          ? Math.cos(phy.kWave(p.f, p.c) * x)
          : states[Math.round(((y + 0.3) / 0.6) * 80)][Math.round(((x + 0.3) / 0.6) * 160)][part]
              .re),
      "pa*real(p4Cyl(XX,YY,a,f,c,0," + index + "))",
      "",
      boundary,
      [-2 * p.pa, 2 * p.pa],
      "声压 (Pa)",
      "[-2 2]*pa",
    ),
  );
  if (cache.size > 8) cache.clear();
  cache.set(key, q);
  return structuredClone(q);
}
const completedLecture = makeLecture("5.1", {
  defaults: p,
  parameters: [a, f, pa],
  keyPoints: [
    "入射波遇到物体后激发散射场，总场等于入射场与散射场的复数叠加。",
    "辐射问题由振源主动运动驱动，散射问题由已有入射场在物体边界上的不满足量驱动；二者均需满足无源区方程及向外辐射条件。",
    "刚性边界使总场法向振速为零，故散射场法向导数与入射场法向导数相反。",
    "一般阻抗边界把总声压与总法向振速联系起来，可化为对散射场的非齐次边界条件。",
  ],
  formulas: [
    {
      number: "5.1-1",
      tex: "P=P_i+P_s,\\quad(\\nabla^2+k^2)P_s=0,\\quad\\partial_nP_s=-\\partial_nP_i\\ \\text{（刚性）}",
      meaning: "散射场补偿入射场在边界上的法向振速，使物体表面满足实际条件。",
    },
    {
      number: "5.1-2",
      tex: "P_s+\\frac{Z_n}{j\\omega\\rho_0}\\partial_nP_s=-P_i-\\frac{Z_n}{j\\omega\\rho_0}\\partial_nP_i",
      meaning: "法向指向物体外的介质；总场满足阻抗边界，散射场满足远处向外传播条件。",
    },
  ],
  figures: [figure("5.1-1", "刚性圆柱的入射场、散射场与总场", (p) => field(p), 3, 1)],
  answers: [
    "声波遇到物体后，由物体边界重新产生向外传播声场的过程。",
    "均需求解波动方程并施加边界与辐射条件；辐射由振源主动运动驱动，散射由已有入射场在物体处的边界失配驱动。",
    "散射场满足无源亥姆霍兹方程、非齐次散射边界条件和无穷远向外辐射条件。",
  ],
  exampleTitle: "例题　水中刚性圆柱迎声面的压力放大",
  background:
    "半径 50 mm 的刚性圆柱置于 3 kHz、峰值 1 Pa 的平面波中。入射波沿正横轴传播，求迎声面总声压及相对于入射场的增益，评估安装物体对水听器测量的影响。",
  exampleDefaults: p,
  given: [a, f, pa],
  asks,
  judgment:
    "刚性圆柱表面总法向振速为零，但表面声压通常不等于自由场声压；传感器安装误差应按总场计算。",
  examplePlot: (p) =>
    answer(
      graph(
        p,
        0,
        "刚性圆柱表面不同周向位置的总声压",
        "圆柱周向角 θ (°)",
        "表面总声压峰值 (Pa)",
        [0, 360],
        [0, 1],
        [
          curve(
            "刚性圆柱表面压力",
            (x) =>
              p.pa *
              phy.magnitude(
                phy.cylinderField(
                  p.a * Math.cos((x * Math.PI) / 180),
                  p.a * Math.sin((x * Math.PI) / 180),
                  p.a,
                  p.f,
                  p.c,
                ).total,
              ),
            [0, 360],
            "linspace(0,360,401)",
            "pa*abs(p4Cyl(a*cosd(x),a*sind(x),a,f,c,0,2))",
          ),
          points("迎声面", [[180, asks[0].calc(p)]], "180", "frontPressure", {
            marker: "o",
            style: "none",
          }),
        ],
      ),
      "frontPressure",
    ),
  engineering: engineering(
    "把接收器装在壳体或支柱上会改变当地声场。用入射、散射与总场分开计算，才能区分自由场响应和安装结构引起的偏差。",
    "receiver",
    "水下监听接收器选型",
  ),
});

export default completeExamples(completedLecture);
