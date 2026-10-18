import type { Lecture } from "../types";
import { instantaneousPanels, powerPanel } from "../../plot/chapter1Figures";
import { example } from "../examples/instrument";
const lecture: Lecture = {
  id: "1.2.5",
  title: "强迫振动的稳态振动（2）",
  moocSource: "1.2.5 强迫振动的稳态振动（2）PPT.pdf",
  classNumber: "第 4 次课",
  keyPoints: [
    "瞬时输入功率是实数外力与实数振速的乘积，可能在一个周期内改变符号。",
    "稳态时平均输入功率等于阻尼耗散的平均功率。",
    "机械平均功率与振速在固有频率处达到最大值。",
    "半功率点定义带宽，Δf = f₀/Qm；品质因数越高，带宽越窄。",
  ],
  formulas: [
    {
      number: "1.2-5",
      tex: String.raw`p(t)=F_0\cos\omega t\;v_m\cos(\omega t+\varphi_v)`,
      meaning: "力与速度取实部后相乘，不可将两个复幅值直接相乘当作瞬时功率。",
    },
    {
      number: "1.2-6",
      tex: String.raw`\overline W=\frac12F_0v_m\cos\varphi_v=\frac12R_mv_m^2=\frac{F_0^2R_m}{2[R_m^2+(\omega M-D/\omega)^2]}`,
      meaning: "周期内储能的净变化为零，平均输入恰好补偿阻尼耗散；峰值 Wmax = F₀²/(2Rm)。",
    },
    {
      number: "1.2-7",
      tex: String.raw`\omega_{1,2}=\sqrt{\omega_0^2+\delta^2}\mp\delta,\quad\delta=\frac{R_m}{2M},\quad\Delta f=f_2-f_1=\frac{R_m}{2\pi M}=\frac{f_0}{Q_m}`,
      meaning: "半功率点满足 |Xm| = Rm。带宽关系是该黏性阻尼模型的精确结果；f₀ 是两点的几何平均。",
    },
  ],
  figures: [
    {
      number: "1.2.5-1",
      title: "共振前、共振处和共振后的瞬时输入功率",
      plot: (p) => instantaneousPanels(p),
      rows: 3,
      cols: 1,
      parameters: example.given.slice(0, 4),
      readouts: ["mean input", "mean dissipation"],
    },
    {
      number: "1.2.5-2",
      title: "平均机械功率与半功率带宽",
      plot: (p) => [powerPanel(p)],
      rows: 1,
      cols: 1,
      parameters: example.given.slice(0, 4),
      readouts: ["f1", "f2", "bandwidth", "maximum power"],
    },
  ],
  examples: ["bandwidth-B"],
  questions: [
    {
      text: "1、谐振频率与系统固有频率的关系？",
      answer:
        "机械谐振条件为 Xm = ωM − D/ω = 0，所以谐振频率等于无阻尼固有频率 f₀ = √(D/M)/(2π)，不等于欠阻尼自由振动的频率。",
    },
    {
      text: "2、谐振频率与共振频率的关系？",
      answer:
        "在本模型中，谐振频率也是振速和平均功率共振频率；位移、加速度的共振峰则受阻尼影响而偏离该频率。",
    },
    {
      text: "3、半功率点带宽和机械品质因数的关系？",
      answer:
        "先找最大平均功率及其频率 f₀，再找功率降到峰值一半时的 f₁、f₂，计算 Qm = f₀/(f₂−f₁)。半功率对应振速幅值为峰值的 1/√2。",
    },
  ],
  engineering: {
    text: "仪器支架既要限制位移，又要考虑持续振动带来的耗散与发热。利用半功率带宽判断转频是否落在共振区，并用增加阻尼后的曲线核对改进方案。",
    href: "#/cases?project=industry",
    title: "精密车间设备振动治理",
  },
};
export default lecture;
