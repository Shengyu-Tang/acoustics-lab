import { e3611 } from "../../plot/p3Examples";
import {
  makeLecture,
  parameter,
  params,
  Z1,
  Z2,
  c2,
  theta,
  figure,
  comparison,
  ask,
  engineering,
} from "../p3";
import * as phy from "../../physics/chapter3b";
import { normalFigure, obliqueFigure } from "../../plot/p3Interfaces";
const radius = { ...parameter("radius", "围墙半径", "a", "m", 10, 40, 0.1), geometry: true };
const source = parameter("source", "声源径向比例", "rₛ/a", "—", 0.1, 0.99, 0.01);
const launch = parameter("launch", "出射方向角", "γ", "°", 5, 175, 1);
const lectureFrequency = parameter("f", "频率", "f", "Hz", 20, 2000, 10);
const p = {
  rho: 1000,
  c: 1500,
  c2: 343,
  f: 1000,
  pa: 1,
  Z1: 1500000.0,
  Z2: 415,
  theta: 30,
  radius: 32.5,
  source: 0.95,
  launch: 80,
};
const asks = [
  ask(
    "circumference",
    "(1) 围墙周长",
    "m",
    "L=2\\pi a",
    "2*pi*radius",
    (p) => 2 * Math.PI * p.radius,
    (p) => [radius, source, launch].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
  ask(
    "chord",
    "(2) 首次撞墙传播距离",
    "m",
    "\\ell=-r_s\\cos\\gamma+\\sqrt{a^2-r_s^2\\sin^2\\gamma}",
    "-radius*source*cosd(launch)+sqrt(radius^2-(radius*source*sind(launch))^2)",
    (p) =>
      -p.radius * p.source * Math.cos((p.launch * Math.PI) / 180) +
      Math.sqrt(p.radius ** 2 - (p.radius * p.source * Math.sin((p.launch * Math.PI) / 180)) ** 2),
    (p) => [radius, source, launch].map((d) => `${d.symbol} = ${p[d.key]} ${d.unit}`).join("，"),
  ),
];
export default makeLecture("3.6.11", {
  defaults: p,
  parameters: [radius, source, launch],

  keyPoints: [
    "回音壁与私语走廊利用圆环形、光滑墙面的连续掠射反射传声。",
    "声波以大入射角撞击墙面，反射系数模值接近一。",
    "无论是否存在全透射角和临界角，接近掠射时都趋于强反射；几何声线模型忽略衍射和吸收。",
  ],
  formulas: [
    ...["\\lim_{\\theta_i\\to\\pi/2}|R_p|=1\\quad\\text{（非完全匹配的两种介质）}"].map(
      (tex, i) => ({
        number: `3.6.11-${i + 1}`,
        tex,
        meaning: "时间因子统一采用 $e^{jωt}$；声压与振速均指对应复幅值或明确标出的实值。",
      }),
    ),
    ...asks.map((a, i) => ({
      number: `3.6.11-${i + 1 + 1}`,
      tex: a.tex,
      meaning: i === 0 ? "先由介质和边界条件建立关系。" : "代入已知条件并核对结果的物理单位。",
    })),
  ],
  figures: [
    figure(
      "3.6.11-1",
      "回音壁的圆墙与多次掠射声线",
      (p, t) => obliqueFigure("3.6.11-1", p, t),
      1,
      1,
    ),
    comparison(
      figure(
        "3.6.11-2",
        "四种介质条件的反射模值与相角",
        (p, t) => obliqueFigure("3.6.11-2", p, t),
        2,
        2,
      ),
      ["radius", "source", "launch"],
      "此图用于单独比较对应物理关系；所列参数在本图公式中不出现，相关影响见其他图。",
    ),
  ],
  answers: [
    "声音沿圆形墙面多次反射，使远处低声讲话仍可听见。",
    "围墙近似圆环且表面光滑，声线大角度掠射，反射损失较小。",
  ],
  animation: false,
  animationPeriod: (p) => 1 / p.f,
  exampleTitle:
    "例题　半径 32.5 m 的圆形围墙内，声源距圆心为半径的 0.95 倍，出射方向与径向夹角 80°",
  background:
    "半径 32.5 m 的圆形围墙内，声源距圆心为半径的 0.95 倍，出射方向与径向夹角 80°。求墙周长与首次撞墙距离。",
  exampleDefaults: { ...p, ...{} },
  given: [radius, source, launch],
  asks,
  judgment: "声线在光滑圆墙上多次掠射；实际可听距离还受墙面吸收和粗糙度限制。",
  examplePlot: (p) => e3611(p),
  engineering: engineering(
    "圆形展厅和环廊中可能出现远处低语异常清晰的现象。平滑墙面的连续掠射是主要机制，可通过改变墙面形状或增加吸声减轻聚声。",
    "hall",
    "交通枢纽语音清晰度",
  ),
});
