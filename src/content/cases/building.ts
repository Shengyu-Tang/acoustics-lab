import { problem, parameter, question, physical, line, dot, ymark, fmt } from "./shared";
import { porous } from "../../physics/chapter4";
import { absorberThickness, bandAbsorption } from "../../physics/engineering";
const p = { rho: 1.21, c: 343, f: 1000, d: 0.05, sigma: 10000, minimum: 0.6, maximum: 0.15 };
const design = (p: Record<string, number>) =>
  absorberThickness(p.sigma, p.rho, p.c, p.minimum, p.maximum);
const setup =
  "ff=500:10:2000; selectedD=0;for mm=20:floor(maximum*1000+1e-9), if min(p4Porous(ff,mm/1000,sigma,rho,c))>minimum,selectedD=mm/1000;break;end;end; plotD=selectedD;if plotD==0,plotD=maximum;end;[a500,z500]=p4Porous(500,d,sigma,rho,c);";
export default problem({
  id: "building",
  title: "交通枢纽广播区的吸声层厚度设计",
  lectures: ["3.4.6", "3.7.2", "7.3"],
  background:
    "候车厅广播区拟在刚性墙面铺设空气纤维吸声层。施工方先报出 50 mm 厚度，需要核算低频吸声是否足够。用阻抗管所对应的正入射模型检查 500–2000 Hz 频带，并从毫米级厚度中选出满足指标的最薄方案；现场仍需另行测量混响与语音传输指标。",
  criterion:
    "在 20 mm 至施工厚度上限内，以 1 mm 为步长，要求 500:10:2000 Hz 每个校核频率的正入射吸声系数严格大于给定限值，选择最薄方案；无可行厚度填 0。",
  assumptions:
    "空气、刚性背衬、高孔隙率纤维材料，采用德拉尼—巴兹利经验式与时间因子 e^{jωt}。当前流阻率范围使整个频带的 ρf/σ 保持在 0.01–1 内。离散频带设计应在实物阻抗管试验中复核，不能直接保证整厅语音清晰度。",
  sources: [
    {
      title: "德拉尼—巴兹利模型、系数及有效范围",
      href: "https://matelys.com/apmr/PropagationModels/MotionlessSkeleton/DelanyBazleyModel.html",
    },
  ],
  defaults: p,
  given: [
    parameter("d", "初始铺设厚度", "d", "m", 0.02, 0.15, 0.001),
    parameter("sigma", "空气纤维流阻率", "σ", "Pa·s/m²", 5000, 20000, 100),
    parameter("minimum", "频带吸声系数下限", "α_{lim}", "—", 0.4, 0.9, 0.01),
    parameter("maximum", "施工厚度上限", "d_{max}", "m", 0.04, 0.15, 0.001),
  ],
  asks: [
    question(
      "reflection500",
      "(1) 初始层在 500 Hz 的反射系数模值",
      "—",
      String.raw`|R_p|=\left|\frac{Z_n/(\rho c)-1}{Z_n/(\rho c)+1}\right|,\quad Z_n=-jZ_c\cot(k_cd)`,
      "abs((z500-1)/(z500+1))",
      (p) => Math.sqrt(1 - porous(500, p.d, p.sigma, p.rho, p.c).alpha),
      (p) => {
        const z = porous(500, p.d, p.sigma, p.rho, p.c).z;
        return `d = ${p.d} m、σ = ${p.sigma} Pa·s/m²，归一化表面阻抗 ${fmt(z.re)} + j(${fmt(z.im)})；取 |(Z−1)/(Z+1)|。`;
      },
    ),
    question(
      "alpha500",
      "(2) 初始层在 500 Hz 的吸声系数",
      "—",
      String.raw`\alpha_{500}=1-|R_p(500)|^2`,
      "a500",
      (p) => porous(500, p.d, p.sigma, p.rho, p.c).alpha,
      (p) => `1 − (${fmt(Math.sqrt(1 - porous(500, p.d, p.sigma, p.rho, p.c).alpha))})²。`,
    ),
    question(
      "alpha2000",
      "(3) 初始层在 2000 Hz 的吸声系数",
      "—",
      String.raw`\alpha_{2000}=1-|R_p(2000)|^2`,
      "p4Porous(2000,d,sigma,rho,c)",
      (p) => porous(2000, p.d, p.sigma, p.rho, p.c).alpha,
      (p) => {
        const z = porous(2000, p.d, p.sigma, p.rho, p.c).z;
        return `以 2000 Hz 重算阻抗 ${fmt(z.re)} + j(${fmt(z.im)})，再求 1−|(Z−1)/(Z+1)|²。`;
      },
    ),
    question(
      "thickness",
      "(4) 最薄合格厚度（无解填 0）",
      "m",
      String.raw`d_* = \min\{d:\min_{f=500:10:2000}\alpha(f,d)>\alpha_{lim}\}`,
      "selectedD",
      design,
      (p) =>
        `从 0.020 m 每次增加 0.001 m，至 ${p.maximum} m；逐个频率与 ${p.minimum} 比较。${design(p) ? `所选厚度的频带最小值 ${fmt(bandAbsorption(design(p), p.sigma, p.rho, p.c))}。` : "该厚度范围无解。"}`,
    ),
  ],
  hints: [
    "先按复特性阻抗和复波数计算刚性背衬层的表面阻抗，再由反射系数求吸声系数。",
    "不能只看 1 kHz 的峰值。每个毫米候选都要扫描 500–2000 Hz 的全部校核频率，第一项合格厚度就是设计答案。",
  ],
  judgment: (p) =>
    design(p)
      ? `选 ${fmt(design(p) * 1000)} mm；频带最小吸声系数 ${fmt(bandAbsorption(design(p), p.sigma, p.rho, p.c))}，通过正入射材料指标。`
      : "施工厚度范围内没有合格方案，应改变材料或允许的厚度。",
  plot: (p) =>
    physical(
      p,
      "初始层与最薄合格层的吸声频响",
      "频率 f (Hz)",
      "正入射吸声系数",
      [500, 2000],
      "[500 2000]",
      [
        line(
          "初始铺设厚度",
          (f) => porous(f, p.d, p.sigma, p.rho, p.c).alpha,
          [500, 2000],
          "p4Porous(x,d,sigma,rho,c)",
        ),
        line(
          "设计层（无解时显示厚度上限）",
          (f) => porous(f, design(p) || p.maximum, p.sigma, p.rho, p.c).alpha,
          [500, 2000],
          "p4Porous(x,plotD,sigma,rho,c)",
        ),
        dot("初始层低频校核", 500, porous(500, p.d, p.sigma, p.rho, p.c).alpha, "500", "a500"),
      ],
      setup,
      { answerKey: "thickness", annotations: [ymark(p.minimum, "频带吸声系数下限")] },
      { annotations: ["minimum"] },
    ),
});
