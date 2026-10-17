import { useState } from "react";
import { example } from "./content/examples/instrument";
import { grade } from "./physics/chapter1";
import { NumberField } from "./Parameter";
import MathText from "./Math";
import Figure from "./plot/Figure";
import { instrumentPanel } from "./plot/chapter1Figures";
import { download, matlab } from "./plot/export";
const fmt = (v: number) => Number(v.toPrecision(4)).toString();
export default function InstrumentExample() {
  const [p, setP] = useState(example.defaults),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [submitted, setSubmitted] = useState(false),
    [hint, setHint] = useState(0);
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
      sub: `Rm,min = √max{0, [${p.F0} N ÷ (${fmt(2 * Math.PI * s.f)} rad/s × ${p.limit / 1000} m)]² − (${fmt(s.reactance)} kg/s)²}`,
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
    <article className="calculation-example">
      <h3>{example.title}</h3>
      <p>{example.background}</p>
      <h4>已知条件（可修改）</h4>
      <table>
        <thead>
          <tr>
            <th>符号</th>
            <th>名称</th>
            <th>数值</th>
            <th>单位</th>
          </tr>
        </thead>
        <tbody>
          {example.given.map((d) => (
            <tr key={d.key}>
              <td>{d.symbol}</td>
              <td>{d.name}</td>
              <td>
                <NumberField
                  label={`例题${d.name}`}
                  value={p[d.key]}
                  onChange={(n) => {
                    setP({ ...p, [d.key]: n });
                    setSubmitted(false);
                  }}
                  {...d}
                />
              </td>
              <td>{d.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <h4>求与学生作答</h4>
        <p>按相对误差 ±2% 判分，内部计算保留完整精度。</p>
        {example.asks.map((a) => (
          <label className="student-answer" key={a.key}>
            <span>{a.text}</span>
            <input
              type="number"
              step="any"
              aria-label={a.text}
              value={answers[a.key] ?? ""}
              onChange={(e) => {
                setAnswers({ ...answers, [a.key]: e.target.value });
                setSubmitted(false);
              }}
            />
            <span>{a.unit}</span>
            {submitted && (
              <output>
                {answers[a.key]?.trim() ? grade(Number(answers[a.key]), s[a.key]) : "尚未作答"}
              </output>
            )}
          </label>
        ))}
        <button type="submit">提交答案</button>
        <div role="status">{submitted ? "判分已更新，请查看每一问的反馈。" : ""}</div>
      </form>
      <div className="example-hints">
        <button disabled={hint === 2} onClick={() => setHint(Math.min(2, hint + 1))}>
          {hint === 0 ? "提示 1：选择公式" : hint === 1 ? "提示 2：代入步骤" : "已显示两级提示"}
        </button>
        {example.hints.slice(0, hint).map((h) => (
          <p key={h}>{h}</p>
        ))}
      </div>
      <details className="reference-solution">
        <summary>展开分步参考解答（随已知条件重算）</summary>
        <div className="solution-content">
          {steps.map((step, i) => (
            <section key={i}>
              <h4>第 {i + 1} 步</h4>
              <MathText tex={step.tex} />
              <p>{step.sub}</p>
              <p>
                <strong>{step.value}</strong>
              </p>
            </section>
          ))}
          <p>
            <strong>工程判断：</strong>
            {judgment}
          </p>
          <p>
            注：这里反解的是当前工作点的精确力阻阈值；接近谐振时可用 Rₘ ≈ F₀/(ωx限)
            估算。线性、单自由度、黏性阻尼模型忽略船体多模态耦合。
          </p>
        </div>
      </details>
      <Figure
        panels={[panel]}
        caption="图 A-1　仪器支架位移幅频曲线、泵转频范围与当前工作点"
        name="instrument-A"
      />
      <div className="example-export">
        <button
          onClick={(event) => {
            const solution = event.currentTarget
              .closest("article")!
              .querySelector<HTMLDetailsElement>(".reference-solution")!;
            const wasOpen = solution.open;
            solution.open = true;
            document.body.classList.add("printing-example");
            const done = () => {
              solution.open = wasOpen;
              document.body.classList.remove("printing-example");
              window.removeEventListener("afterprint", done);
            };
            window.addEventListener("afterprint", done);
            window.print();
          }}
        >
          打印本题
        </button>
        <button onClick={exportScript}>导出 MATLAB 计算脚本</button>
      </div>
    </article>
  );
}
