import { bandwidthExperiment, bandwidthSolution } from "../../physics/chapter1";
export const bandwidthExample = {
  id: "bandwidth-B",
  title: "例题 B　振动台的带宽测量与输入功率",
  background:
    "对一台单自由度振动台作恒力幅值扫频，测得平均输入功率降至峰值一半时的两个频率。已知等效质量与弹性系数，需要由带宽识别力阻和品质因数，并估算在谐振处维持指定振速的平均机械输入功率，为驱动器选型提供依据。",
  defaults: bandwidthExperiment,
  solve: bandwidthSolution,
  given: [
    { key: "M", symbol: "M", name: "振动台等效质量", unit: "kg", min: 1, max: 100, step: 1 },
    { key: "D", symbol: "D", name: "弹性系数", unit: "N/m", min: 1000, max: 1000000, step: 1000 },
    {
      key: "f1",
      symbol: "f₁",
      name: "实测下半功率频率",
      unit: "Hz",
      min: 0.1,
      max: 100,
      step: 0.01,
    },
    {
      key: "f2",
      symbol: "f₂",
      name: "实测上半功率频率",
      unit: "Hz",
      min: 0.2,
      max: 150,
      step: 0.01,
    },
    {
      key: "velocity",
      symbol: "vₘ",
      name: "目标振速峰值",
      unit: "m/s",
      min: 0.001,
      max: 2,
      step: 0.001,
    },
  ] as const,
  asks: [
    { key: "Qm", text: "(1) 品质因数 Qₘ", unit: "—" },
    { key: "Rm", text: "(2) 识别力阻 Rₘ", unit: "kg/s" },
    { key: "power", text: "(3) 维持目标振速的平均机械输入功率", unit: "W" },
    { key: "force", text: "(4) 谐振处所需激励力峰值 F₀", unit: "N" },
  ] as const,
  hints: [
    "由 M、D 求 f₀；恒力扫频的半功率带宽为 $\\Delta f = f_2-f_1 = f_0/Q_m = R_m/(2\\pi M)$。",
    "先算 $Q_m = f_0/\\Delta f$ 与 $R_m = 2\\pi M\\Delta f$。振速给的是峰值，用 $\\overline W = R_mv_m^2/2$；在 f₀ 处 $X_m = 0$，故 $F_0 = R_mv_m$。",
  ],
};
