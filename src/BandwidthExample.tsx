import { useState } from "react";
import { bandwidthExample as example } from "./content/examples/bandwidth";
import ExampleWorksheet from "./ExampleWorksheet";
import { powerPanel } from "./plot/chapter1Figures";
import { download, matlab } from "./plot/export";
const fmt = (n: number) => Number(n.toPrecision(4)).toString();
export default function BandwidthExample() {
  const [p, setP] = useState(example.defaults),
    s = example.solve(p);
  const panel = powerPanel({ M: p.M, D: p.D, Rm: s.Rm, F0: s.force });
  panel.series!.push({
    name: "目标振速工作点",
    points: [[s.f0, s.power]],
    marker: "o",
    style: "none",
  });
  const steps = [
    {
      tex: String.raw`f_0=\frac{1}{2\pi}\sqrt{D/M},\quad\Delta f=f_2-f_1,\quad Q_m=\frac{f_0}{\Delta f}`,
      sub: `f₀ = √(${p.D} N/m ÷ ${p.M} kg)/(2π)；Δf = ${fmt(p.f2)} − ${fmt(p.f1)} Hz`,
      value: `f₀ = ${fmt(s.f0)} Hz；Δf = ${fmt(s.bandwidth)} Hz；Qₘ = ${fmt(s.Qm)}`,
    },
    {
      tex: String.raw`R_m=2\pi M\Delta f`,
      sub: `Rₘ = 2π × ${p.M} kg × ${fmt(s.bandwidth)} Hz`,
      value: `Rₘ = ${fmt(s.Rm)} kg/s`,
    },
    {
      tex: String.raw`\overline W=\frac12R_mv_m^2`,
      sub: `W̄ = ½ × ${fmt(s.Rm)} kg/s × (${p.velocity} m/s)²`,
      value: `平均机械输入功率 W̄ = ${fmt(s.power)} W`,
    },
    {
      tex: String.raw`X_m(f_0)=0,\quad F_0=R_mv_m`,
      sub: `F₀ = ${fmt(s.Rm)} kg/s × ${p.velocity} m/s`,
      value: `所需激励力峰值 F₀ = ${fmt(s.force)} N`,
    },
  ];
  const judgment = `驱动器至少需提供 ${fmt(s.power)} W 平均机械功率及 ${fmt(s.force)} N 激励力峰值，并留出裕量。电功率还需考虑效率。实测几何中心 √(f₁f₂) = ${fmt(s.measuredF0)} Hz，与 M、D 计算值偏差 ${(100 * s.mismatch).toFixed(2)}%。${s.mismatch > 0.02 ? "偏差超过 2%，应复核测试条件和单自由度模型，当前识别结果仅作估算。" : "测量中心与模型基本一致。"}`;
  function exportScript() {
    download(
      `% Constant-force half-power sweep; velocity is peak, SI units\nM=${p.M}; D=${p.D}; f1=${p.f1}; f2=${p.f2}; vm=${p.velocity};\nf0=sqrt(D/M)/(2*pi); df=f2-f1; Qm=f0/df; Rm=2*pi*M*df; Wavg=Rm*vm^2/2; F0=Rm*vm;\nfprintf('Qm=%.6g; Rm=%.6g kg/s; Wavg=%.6g W; F0=%.6g N\\n',Qm,Rm,Wavg,F0);\n` +
        matlab([panel], 1, 1, example.title),
      "bandwidth-B.m",
      "text/plain;charset=utf-8",
    );
  }
  return (
    <ExampleWorksheet
      example={example}
      p={p}
      setParameter={(key, value) =>
        setP((old) => {
          const next = { ...old, [key]: value };
          // Keep the measured interval ordered when either frequency is edited.
          if (key === "f1" && next.f1 >= next.f2) next.f2 = next.f1 + 0.1;
          if (key === "f2" && next.f2 <= next.f1) next.f1 = Math.max(0.1, next.f2 - 0.1);
          return next;
        })
      }
      solution={s}
      steps={steps}
      judgment={judgment}
      note="采用线性黏性阻尼单自由度模型，扫频时激励力幅值保持不变。图为识别模型在所需恒力下的功率曲线；半功率标线为模型值，测量不一致时不会强行把实测端点画在模型曲线上。"
      panel={panel}
      caption="图 B-1　识别模型的平均输入功率、目标振速工作点与半功率带宽"
      exportScript={exportScript}
    />
  );
}
