import { useState } from "react";
import { example } from "./content/examples/instrument";
import ExampleWorksheet from "./ExampleWorksheet";
import { instrumentPanel } from "./plot/chapter1Figures";
import { download, matlab } from "./plot/export";
const fmt = (v: number) => Number(v.toPrecision(4)).toString();
export default function InstrumentExample() {
  const [p, setP] = useState(example.defaults);
  const s = example.solve(p),
    panel = instrumentPanel(p);
  const steps = [
    {
      tex: String.raw`\omega_0=\sqrt{D/M},\quad f_0=\omega_0/(2\pi)`,
      sub: `ω₀ = √(${p.D} N/m ÷ ${p.M} kg) = ${fmt(s.omega0)} rad/s；f₀ = ${fmt(s.omega0)} rad/s ÷ 2π`,
      value: `f₀ = ${fmt(s.f0)} Hz`,
    },
    {
      tex: String.raw`Q_m=\omega_0M/R_m,\quad\Delta f=f_0/Q_m,\quad\tau_0=\ln20/\delta`,
      sub: `Qₘ = ${fmt(s.omega0)} rad/s × ${p.M} kg ÷ ${p.Rm} kg/s；Δf = ${fmt(s.f0)} Hz ÷ ${fmt(s.Qm)}`,
      value: `Qₘ = ${fmt(s.Qm)}；Δf = ${fmt(s.bandwidth)} Hz；δ = ${fmt(s.delta)} s⁻¹；τ₀ = ${fmt(s.transition)} s`,
    },
    {
      tex: String.raw`f=n/60,\quad X_m=\omega M-D/\omega,\quad v_m=F_0/|Z_m|,\quad x_m=v_m/\omega`,
      sub: `f = ${p.n} r/min ÷ 60 = ${fmt(s.f)} Hz；Xₘ = ${fmt(2 * Math.PI * s.f)} rad/s × ${p.M} kg − ${p.D} N/m ÷ ${fmt(2 * Math.PI * s.f)} rad/s；vₘ = ${p.F0} N ÷ ${fmt(s.impedance)} kg/s`,
      value: `Xₘ = ${fmt(s.reactance)} kg/s；|Zₘ| = ${fmt(s.impedance)} kg/s；vₘ = ${fmt(s.v)} m/s；xₘ = ${fmt(s.xMm)} mm`,
    },
    {
      tex: String.raw`R_{m,\min}=\sqrt{\max\!\left[0,\left(\frac{F_0}{\omega x_{\rm lim}}\right)^2-X_m^2\right]}`,
      sub: `R_{m,min} = √max{0, [${p.F0} N ÷ (${fmt(2 * Math.PI * s.f)} rad/s × ${p.limit / 1000} m)]² − (${fmt(s.reactance)} kg/s)²}`,
      value: `力阻应大于 ${fmt(s.minimumRm)} kg/s；取 400 kg/s 时 xₘ = ${fmt(s.improvedMm)} mm。${s.minimumRm === 0 ? "该工作频率已在位移上限以下，正力阻即可。" : "等于阈值仅恰好达到上限，严格小于要求留出裕量。"}`,
    },
  ];
  const judgment = `当前转频${s.inBand ? "落在" : "不在"}半功率带宽内；位移${s.safe ? "满足" : "超过"} ${p.limit} mm 限值。${s.safe ? "当前工作点满足要求，仍需检查整个转速范围。" : "需增加力阻或调整弹性系数移频。"} 对 M = ${p.M} kg，令 f₀ < 25 Hz 或 f₀ > 40 Hz，对应 D < ${fmt(p.M * (2 * Math.PI * 25) ** 2)} N/m 或 D > ${fmt(p.M * (2 * Math.PI * 40) ** 2)} N/m；移频后还须重新核对整段转速的位移。`;
  function exportScript() {
    const code =
      `% Instrument support; current editable givens, SI units\nM=${p.M}; D=${p.D}; Rm=${p.Rm}; F0=${p.F0}; n=${p.n}; xlim_m=${p.limit / 1000};\nw0=sqrt(D/M); f0=w0/(2*pi); Qm=w0*M/Rm; bandwidth=f0/Qm;\nf=n/60; w=2*pi*f; Xm=w*M-D/w; Zm=hypot(Rm,Xm); vm=F0/Zm; xm=vm/w;\nRm_min=sqrt(max(0,(F0/(w*xlim_m))^2-Xm^2));\nfprintf('f0=%.6g Hz; Qm=%.6g; bandwidth=%.6g Hz; xm=%.6g mm; Rm threshold=%.6g kg/s\\n',f0,Qm,bandwidth,xm*1000,Rm_min);\n` +
      matlab([panel], 1, 1, example.title);
    download(code, "instrument-A.m", "text/plain;charset=utf-8");
  }
  return (
    <ExampleWorksheet
      example={example}
      p={p}
      setParameter={(key, value) => setP({ ...p, [key]: value })}
      solution={s}
      steps={steps}
      judgment={judgment}
      note="这里反解当前工作点的精确力阻阈值；接近谐振时可用 $R_m \\approx F_0/(\\omega x_{\\rm lim})$ 估算。线性、单自由度、黏性阻尼模型忽略船体多模态耦合。"
      panel={panel}
      caption="图 A-1　仪器支架位移幅频曲线、泵转频范围与当前工作点"
      exportScript={exportScript}
    />
  );
}
