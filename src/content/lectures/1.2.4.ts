import { modelsFor } from "../../plot/matlabModels";
import type { Lecture } from "../types";
import { frequencyPanels, impedancePanel } from "../../plot/chapter1Figures";
import { example } from "../examples/instrument";
const lecture: Lecture = {
  id: "1.2.4",
  title: "强迫振动的稳态振动（1）",
  moocSource: "1.2.4 强迫振动的稳态振动（1）PPT.pdf",
  classNumber: "第 3、4 次课",
  keyPoints: [
    "稳态振动与外力同频；机械阻抗由力阻与机械电抗组成。",
    "稳态解是工程中主要关心的部分，暂态分量随时间衰减为零。",
    "机械阻抗的绝对值等于产生单位振速幅值所需的力，单位 kg/s（力欧姆）。",
    "位移、振速和加速度的频率特性曲线包括幅频特性与相频特性，三者各不相同。",
    "位移、速度、加速度的共振频率一般不相同；速度在固有频率处共振。",
    "品质因数越高，共振峰越尖，频率选择性越强。",
  ],
  formulas: [
    {
      number: "1.2-1",
      tex: String.raw`Z_m=\frac{\tilde F}{\tilde v}=R_m+j\left(\omega M-\frac D\omega\right)=R_m+jX_m`,
      meaning:
        "机械阻耗散能量，机械电抗表示惯性与弹性对储能的共同作用。时间因子采用 $e^{j\\omega t}$。",
    },
    {
      number: "1.2-2",
      tex: String.raw`v_m=\frac{F_0}{|Z_m|},\quad x_m=\frac{v_m}{\omega},\quad a_m=\omega v_m,\quad\varphi_v=-\arg Z_m,\quad\varphi_x=\varphi_v-\frac\pi2,\quad\varphi_a=\varphi_v+\frac\pi2`,
      meaning:
        "相位均相对激励力 $F_0\\cos(\\omega t)$；振速超前位移 $\\pi/2$，加速度超前振速 $\\pi/2$。",
    },
    {
      number: "1.2-3",
      tex: String.raw`\omega_0=\sqrt{D/M},\quad\zeta=\frac{R_m}{2\sqrt{MD}},\quad Q_m=\frac{\omega_0M}{R_m}`,
      meaning: "质量与弹性系数决定固有频率，力阻决定品质因数。",
    },
    {
      number: "1.2-4",
      tex: String.raw`f_x=f_0\sqrt{1-2\zeta^2},\qquad f_v=f_0,\qquad f_a=\frac{f_0}{\sqrt{1-2\zeta^2}}`,
      meaning:
        "位移与加速度的有限频率共振峰要求 $\\zeta < 1/\\sqrt{2}$；阻尼更大时不应标出虚假的峰。",
    },
  ],
  figures: [
    {
      number: "1.2.4-1",
      title: "位移、振速、加速度的幅频与相频特性",
      plot: (p, compare = false) => frequencyPanels(p, compare),
      rows: 2,
      cols: 3,
      parameters: example.given.slice(0, 4),
      readouts: ["fx", "fv", "fa", "Qm"],
    },
    {
      number: "1.2.4-2",
      independentOf: ["F0"],
      dimensionlessComparison:
        "机械阻抗 Zₘ = Rₘ + j(ωM − D/ω) 只由系统参数和频率决定，与激励力幅值无关。",
      title: "机械阻抗的模、力阻与电抗",
      plot: (p) => [impedancePanel(p)],
      rows: 1,
      cols: 1,
      parameters: example.given.slice(0, 4),
      readouts: ["f0", "impedance", "reactance"],
    },
  ],
  examples: ["instrument-A"],
  questions: [
    {
      text: "1、怎样求某响应的共振频率？",
      answer:
        "写出稳态幅值关于 ω 的函数，对 ω 求导并令其为零，检查极值和端点。位移与加速度存在有限峰值需要 $\\zeta < 1/\\sqrt{2}$；速度峰值始终在 f₀。",
    },
    {
      text: "2、为什么不同响应的共振频率不同。",
      answer:
        "对 $\\zeta < 1/\\sqrt{2}$，有 $f_x < f_0 = f_v < f_a$，三式见 (1.2-4)。$\\zeta \\to 0$ 时三者趋近 f₀。位移、速度、加速度的频率因子不同，所以峰值位置不同。",
    },
    {
      text: "3、怎样测量振动系统的频响曲线？",
      answer:
        "保持激励力幅值不变，逐点扫频，等待暂态衰减后测稳态响应的幅值与相对外力的相位。在峰附近加密频率采样，避免将暂态或扫频过快造成的误差当作稳态特征。",
    },
  ],
  engineering: {
    text: "船载精密仪器的支架可能受到水泵周期激励。先比较转频与固有频率，再由实际力幅值计算位移，不能只凭归一化峰高判断安全。",
    href: "#/cases?project=industry",
    title: "精密车间设备振动治理",
  },
};
lecture.figures.forEach((f) => (f.matlabModel = modelsFor));
export default lecture;
