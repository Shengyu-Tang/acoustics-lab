import { useState } from "react";
import type { Lecture } from "./content/types";
import { characteristics, instrument, response } from "./physics/chapter1";
import Parameter from "./Parameter";
import MathText, { MathProse } from "./Math";
import Figure from "./plot/Figure";
import InstrumentExample from "./InstrumentExample";
import BandwidthExample from "./BandwidthExample";
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
            <li key={t}>
              <MathProse text={t} />
            </li>
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
            <p>
              <MathProse text={f.meaning} />
            </p>
          </div>
        ))}
      </section>
      <section id="simulation">
        <h2>仿真</h2>
        <div className="simulation-layout">
          <div className="simulation-plots">
            <Figure
              rows={l.figures[0].rows}
              cols={l.figures[0].cols}
              panels={panels}
              caption={`图 ${l.figures[0].number}　${l.figures[0].title}`}
              name={l.figures[0].number}
            />
            <Figure
              panels={l.figures[1].plot(p)}
              caption={`图 ${l.figures[1].number}　${l.figures[1].title}`}
              name={l.figures[1].number}
            />
            {l.figures[1].dimensionlessComparison && (
              <p className="figure-independence">
                <MathProse text={l.figures[1].dimensionlessComparison} />
              </p>
            )}
          </div>
          <div className="simulation-sidebar">
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
                    <MathProse text="叠画 $Q_m = 1.7, 5, 10$（此时各曲线用 $Q_m$ 换算 $R_m$）" />
                  </label>
                </>
              )}
              <div className="parameter-actions">
                {first &&
                  [1.7, 5, 10].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setCompare(false);
                        setP({ ...p, Rm: (c.omega0 * p.M) / q });
                      }}
                    >
                      <MathProse text="Qₘ" /> = {q}
                    </button>
                  ))}
                <button
                  className="text-button"
                  onClick={() => {
                    setP({ ...instrument, Rm: 400 });
                    setCompare(false);
                  }}
                >
                  恢复默认参数
                </button>
              </div>
            </fieldset>
            <table className="readouts">
              <caption>
                <MathProse
                  text={`当前力阻 Rₘ 对应的关键读数${compare ? "（叠画曲线的 Qₘ 见图例）" : ""}`}
                />
              </caption>
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
                      ["品质因数 Qₘ", c.Qm, "—"],
                      ["位移共振 f_x", c.fx, "Hz"],
                      ["速度共振 f_v", c.fv, "Hz"],
                      ["加速度共振 f_a", c.fa, "Hz"],
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
                    <td>
                      <MathProse text={String(label)} />
                    </td>
                    <td>
                      {value === null
                        ? "无有限频率共振峰"
                        : typeof value === "number"
                          ? Number(value.toPrecision(4)).toString()
                          : value}
                    </td>
                    <td>
                      <MathProse text={String(unit)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p>
          <MathProse
            text={
              first
                ? "机械电抗在 $f_0$ 处过零。相频曲线以激励力为相位基准；阻抗图从 $0.001f_0$ 开始以避开零频弹抗奇点。"
                : "三种激励频率分别为 $0.8f_0$、$f_0$、$1.2f_0$，图中使用同一时间轴和功率轴。灰色频带标出 $\\Delta f$，虚线标出峰值及半功率点。"
            }
          />
        </p>
      </section>
      <section id="examples">
        <h2>例题与参考解答</h2>
        {first ? <InstrumentExample /> : <BandwidthExample />}
      </section>
      <section id="questions">
        <h2>思考题</h2>
        {l.questions.map((q) => (
          <details key={q.text}>
            <summary>
              <MathProse text={q.text} />
            </summary>
            <p>
              <MathProse text={q.answer} />
            </p>
          </details>
        ))}
      </section>
      <section id="engineering">
        <h2>工程应用</h2>
        <p>
          <MathProse text={l.engineering.text} />
        </p>
        <a href={l.engineering.href}>{l.engineering.title}</a>
      </section>
    </>
  );
}
