import { useState } from "react";
import type { Lecture } from "./content/types";
import { characteristics, instrument, response } from "./physics/chapter1";
import Parameter from "./Parameter";
import MathText from "./Math";
import Figure from "./plot/Figure";
import InstrumentExample from "./InstrumentExample";
export default function SampleLecture({ lecture: l }: { lecture: Lecture }) {
  const [p, setP] = useState({ ...instrument, Rm: 400 }),
    [compare, setCompare] = useState(false),
    c = characteristics(p),
    r = response(p, c.f0),
    first = l.id === "1.2.4";
  const panels = l.figures[0].plot(p, compare);
  return (
    <>
      <section id="key-points">
        <h2>本讲要点</h2>
        <ul>
          {l.keyPoints.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section id="principle">
        <h2>原理</h2>
        {l.formulas.map((f) => (
          <div className="numbered-formula" key={f.number}>
            <div className="formula-line">
              <MathText tex={f.tex} />
              <span>({f.number})</span>
            </div>
            <p>{f.meaning}</p>
          </div>
        ))}
      </section>
      <section id="simulation">
        <h2>仿真</h2>
        <Figure
          rows={l.figures[0].rows}
          cols={l.figures[0].cols}
          panels={panels}
          caption={`图 ${l.figures[0].number}　${l.figures[0].title}`}
          name={l.figures[0].number}
        />
        <fieldset className="parameter-panel">
          <legend>图形参数（SI 单位）</legend>
          {l.figures[0].parameters.map((d) => (
            <Parameter
              key={d.key}
              definition={d}
              value={p[d.key as keyof typeof p]}
              onChange={(n) => setP({ ...p, [d.key]: n })}
            />
          ))}
          {first && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={compare}
                  onChange={(e) => setCompare(e.target.checked)}
                />{" "}
                叠画 Qₘ = 1.7 / 5 / 10（此时各曲线用 Qₘ 换算 Rₘ）
              </label>
              <div className="preset-buttons">
                {[1.7, 5, 10].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setCompare(false);
                      setP({ ...p, Rm: (c.omega0 * p.M) / q });
                    }}
                  >
                    Qₘ = {q}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => {
              setP({ ...instrument, Rm: 400 });
              setCompare(false);
            }}
          >
            恢复默认参数
          </button>
        </fieldset>
        <table className="readouts">
          <caption>当前力阻 Rₘ 对应的关键读数{compare ? "（叠画曲线的 Qₘ 见图例）" : ""}</caption>
          <thead>
            <tr>
              <th>量</th>
              <th>数值</th>
              <th>单位</th>
            </tr>
          </thead>
          <tbody>
            {(first
              ? [
                  ["固有频率 f₀", c.f0, "Hz"],
                  ["品质因数 Qₘ", c.Qm, "1"],
                  ["位移共振 fx", c.fx, "Hz"],
                  ["速度共振 fv", c.fv, "Hz"],
                  ["加速度共振 fa", c.fa, "Hz"],
                  ["f₀ 处 |Zₘ|", r.impedance, "kg/s"],
                  ["f₀ 处 Xₘ", r.reactance, "kg/s"],
                ]
              : [
                  ["半功率点 f₁", c.f1, "Hz"],
                  ["半功率点 f₂", c.f2, "Hz"],
                  ["带宽 Δf", c.bandwidth, "Hz"],
                  ["f₀/Qₘ", c.f0 / c.Qm, "Hz"],
                  ["最大平均功率", p.F0 ** 2 / (2 * p.Rm), "W"],
                  ["f₀ 处平均输入功率", r.power, "W"],
                  ["f₀ 处平均阻尼耗散", 0.5 * p.Rm * r.v * r.v, "W"],
                ]
            ).map(([label, value, unit]) => (
              <tr key={String(label)}>
                <td>{label}</td>
                <td>
                  {value === null
                    ? "无有限频率共振峰"
                    : typeof value === "number"
                      ? Number(value.toPrecision(4)).toString()
                      : value}
                </td>
                <td>{unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Figure
          panels={l.figures[1].plot(p)}
          caption={`图 ${l.figures[1].number}　${l.figures[1].title}`}
          name={l.figures[1].number}
        />
        <p>
          {first
            ? "机械电抗在 f₀ 处过零。相频曲线以激励力为相位基准；阻抗图从 0.15f₀ 开始以避开零频弹抗奇点。"
            : "三种激励频率分别为 0.8f₀、f₀、1.2f₀，图中使用同一时间轴和功率轴。灰色频带标出 Δf，虚线标出峰值及半功率点。"}
        </p>
      </section>
      <section id="examples">
        <h2>例题与参考解答</h2>
        <InstrumentExample />
      </section>
      <section id="questions">
        <h2>思考题</h2>
        {l.questions.map((q) => (
          <details key={q.text}>
            <summary>{q.text}</summary>
            <p>{q.answer}</p>
          </details>
        ))}
      </section>
      <section id="engineering">
        <h2>工程应用</h2>
        <p>{l.engineering.text}</p>
        <a href={l.engineering.href}>{l.engineering.title}</a>
      </section>
    </>
  );
}
