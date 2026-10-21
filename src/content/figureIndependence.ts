// Formula-based independence, shared by the lecture factories and shown below
// each figure. These are separate experiments, not missing parameter handlers.
export const figureIndependence: Record<
  string,
  { independentOf: string[]; dimensionlessComparison: string }
> = {
  "1.2.1-2": {
    independentOf: ["ratio"],
    dimensionlessComparison: "本图固定采用精确共振 ω = ω₀，与上图可调的激励频率比无关。",
  },
  "1.2.3-1": {
    independentOf: ["ratio", "pulseCycles", "gapCycles"],
    dimensionlessComparison: "本图采用连续共振激励，比较起振过程；脉冲宽度和间隔仅用于脉冲响应图。",
  },
  "1.2.3-2": {
    independentOf: ["pulseCycles", "gapCycles"],
    dimensionlessComparison: "本图采用连续近共振激励，比较衰减拍；脉冲时序仅用于脉冲响应图。",
  },
  "2.1-1": {
    independentOf: ["F0"],
    dimensionlessComparison: "本图为给定初始弦形的微元受力；端部外力只用于下一张边界激励图。",
  },
  "2.2-1": {
    independentOf: ["pluck", "F0"],
    dimensionlessComparison: "本图比较单个自由振型；拨弦位置决定模态权重，端部外力用于受迫响应。",
  },
  "2.2-2": {
    independentOf: ["F0"],
    dimensionlessComparison: "本图是三角形拨弦初值的自由响应，没有端部外力。",
  },
  "2.2-3": {
    independentOf: ["pluck", "height"],
    dimensionlessComparison: "本图为端部力的稳态幅频响应，与自由响应的初始拨弦位置无关。",
  },
  "2.3-1": {
    independentOf: ["tipMass"],
    dimensionlessComparison: "本图展示局部应力差产生的轴向合力；端部质量用于固有频率方程图。",
  },
  "2.3-2": {
    independentOf: ["L", "S", "tipMass", "sigma", "gradient"],
    dimensionlessComparison:
      "细棒纵波声速 c = √(E/ρ) 只由材料决定，与棒尺寸、端部负载和所加应力无关。",
  },
  "3.1.3-2": {
    independentOf: ["pa", "rho", "c", "distortion"],
    dimensionlessComparison:
      "本图展示三条物理定律的推导路线，几何路径由假设开关决定，不是数值波形。",
  },
  "3.1.3-3": {
    independentOf: ["distortion"],
    dimensionlessComparison: "本图比较线性近似的幅值指标 p/(ρc²)，不采用非线性示意波形的畸变参数。",
  },
  "3.1.4-2": {
    independentOf: ["L"],
    dimensionlessComparison:
      "质量流率为 $\\rho S u$；已给定两面振速时，同一时间内的质量收支不依赖控制体长度。",
  },
  "3.1.5-1": {
    independentOf: ["rho"],
    dimensionlessComparison:
      "给定声压后，连续性方程两侧的 ρ 与振速中的 1/ρ 抵消，密度变化率幅值为 pₐω/c²。",
  },
  "3.1.5-2": {
    independentOf: ["pa", "f"],
    dimensionlessComparison:
      "本图横轴扫过声压峰值范围；正弦平面行波的项幅值比为 pₐ/(ρc²)，频率因子抵消。",
  },
  "3.1.8-1": {
    independentOf: ["rho"],
    dimensionlessComparison: "本图绘制给定声压及其空间梯度；密度只在由力密度换算质团加速度时出现。",
  },
  "3.1.8-2": {
    independentOf: ["pa", "f"],
    dimensionlessComparison:
      "本图横轴扫过声压级范围；迁移项幅值比和声学马赫数依赖声压级与 ρc²，频率因子抵消。",
  },
  "3.2.1-2": {
    independentOf: ["pa", "f", "c"],
    dimensionlessComparison: "本图是坐标系与拉普拉斯算符的几何示意，仅随坐标系选择改变。",
  },
  "3.3.2-2": {
    independentOf: ["L"],
    dimensionlessComparison:
      "给定两面的声能流密度时，净输入能量为 (w左 − w右)SΔt，不依赖控制体长度。",
  },
  "3.4.1-1": {
    independentOf: ["rho"],
    dimensionlessComparison: "给定正反向声压幅值后，声压叠加不需要密度；密度影响下一图的质点振速。",
  },
  "3.4.4-1": {
    independentOf: ["pa", "rho", "c", "f"],
    dimensionlessComparison: "本图比较列出的固定示例材料值；当前介质参数用于后面的传播与能流图。",
  },
  "3.4.6-1": {
    independentOf: ["n", "sourceLevel", "rho", "c"],
    dimensionlessComparison: "本图列出固定空气声压级的示意量级，不是当前声源的计算结果。",
  },
  "3.4.6-2": {
    independentOf: ["rho", "c"],
    dimensionlessComparison: "非相干声压级叠加直接使用 L₁ + 10 lg n，不需要介质阻抗。",
  },
  "3.4.6-3": {
    independentOf: ["n", "sourceLevel"],
    dimensionlessComparison:
      "本图比较整个声压级范围与声强级的换算关系，不使用当前声源数量或单声源声级。",
  },
  "3.5.2-2": {
    independentOf: ["azimuth", "elevation"],
    dimensionlessComparison:
      "本图各平面波使用独立的方位角 φ₁…φ₄；单列波的方位角和俯仰角用于上一张三维图。",
  },
};
