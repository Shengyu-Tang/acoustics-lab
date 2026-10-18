import type { Values, Ask } from "./p1";
import type { Panel } from "../plot/types";
import { graph, points, curve } from "./p2";
import { amplitudeLimits, geometryY } from "../plot/fixedAxes";
export { parameter, figure, ask, engineering } from "./p2";
import { makeLecture as buildLecture } from "./p3";
export { comparison, lin, log } from "./p3";
const independent: Record<string, [string[], string]> = {
  "4.2.2-1": [["v"], "归一化阻抗不含表面振速；振速对绝对辐射功率的影响见下一图。"],
  "4.3-3": [["Q"], "两种辐射功率均正比于单源强度平方，取比值后强度消去；绝对声场见第一图。"],
  "4.4.3-2": [
    ["f", "a"],
    "此图是自变量 ka sinθ 的通用贝塞尔核，不依赖单独的频率或半径；实际孔径与频率对方向性的影响见上一图。",
  ],
  "5.3-1": [["pa"], "方向函数已按最大散射幅值归一化，入射幅值消去；绝对总场见下一图。"],
  "6.2-2": [
    ["xB", "yB", "Q"],
    "本图比较同一固定孔径的收发方向函数；两个点的位置与源强只影响上一图的传播信号。",
  ],
  "7.1-2": [
    ["f", "pa"],
    "给定本讲幅值吸收系数后，传播损失比值不含初始声压与载波相位频率；二者影响上一图的瞬时声压。",
  ],
  "7.2-2": [
    ["relaxTime", "A", "B"],
    "海水经验式具有自己的拟合系数，不使用上一图用于机制演示的单弛豫与古典吸收参数。",
  ],
  "7.3-1": [
    ["d", "sigma", "f"],
    "该等值线直接比较给定表面阻抗实虚部；材料厚度、流阻率和频率用于下一图的多孔层预测。",
  ],
  "7.3-2": [["res", "react"], "本图的表面阻抗由空气多孔层模型计算，不采用上一图手动给定的阻抗。"],
  "7.3-3": [
    ["res", "react", "sigma", "f"],
    "本图仅显示尖劈几何与定性的阻抗过渡，不能由空气多孔层参数定量预测水声结构。",
  ],
};
export function makeLecture(id: string, data: Parameters<typeof buildLecture>[1]) {
  return buildLecture(id, {
    ...data,
    figures: data.figures.map((f) =>
      independent[f.number]
        ? {
            ...f,
            independentOf: independent[f.number][0],
            dimensionlessComparison: independent[f.number][1],
          }
        : f,
    ),
  });
}
export { fmt } from "./p1";
export { graph, points, curve };
export const water = { rho: 1000, c: 1500, f: 1000, a: 0.05, v: 0.01 };
const units: Record<string, string> = {
  rho: "kg/m^3",
  c: "m/s",
  f: "Hz",
  a: "m",
  v: "m/s",
  Rm: "kg/s",
  M: "kg",
  D: "N/m",
  r: "m",
  d: "m",
  Q: "m^3/s",
  theta: "deg",
  xobs: "m",
  yobs: "m",
  xB: "m",
  yB: "m",
  pa: "Pa",
  zobs: "m",
  alpha: "Np/m",
  relaxTime: "s",
  A: "s/m",
  B: "s^2/m",
  sigma: "Pa\\cdot s/m^2",
  SL: "dB",
};
export const substitution = (p: Values) =>
  Object.entries(p)
    .map(([k, v]) => {
      const number = Number(v.toPrecision(4))
        .toString()
        .replace(/e([+-]?\d+)/, "\\times10^{$1}");
      return `${k}：$${number}${units[k] ? "\\,\\mathrm{" + units[k] + "}" : ""}$`;
    })
    .join("；");
/** The figure author chooses the answer explicitly; no coordinate guessing. */
export function answer(panel: Panel, key: Ask["key"]) {
  if (!geometryY(panel) && !panel.equalAspect && !panel.field && panel.kind !== "polar") {
    panel.ylim = amplitudeLimits(
      (panel.series ?? [])
        .filter((s) => s.axis !== "right")
        .flatMap((s) => s.points.map((p) => p[1])),
      panel.series?.some((s) => s.kind === "bar"),
      panel.yscale === "log",
    );
    panel.matlabModel!.amplitudeAxes = true;
    panel.matlabModel!.ylim = undefined;
  }
  return { ...panel, answerKey: key };
}
