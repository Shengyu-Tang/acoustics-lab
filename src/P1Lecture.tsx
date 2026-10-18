import { useEffect, useState } from "react";
import type { P1Lecture as Lecture, Values } from "./content/p1";
import { fmt } from "./content/p1";
import Parameter from "./Parameter";
import MathText, { MathProse } from "./Math";
import Figure from "./plot/Figure";
import { download, matlab } from "./plot/export";
import ExampleWorksheet from "./ExampleWorksheet";
function Example({ example: e, id }: { example: Lecture["examples"][number]; id: string }) {
  const [p, setP] = useState({ ...e.defaults });
  const solution = Object.fromEntries(e.asks.map((a) => [a.key, a.calc(p)]));
  const plot = e.plot(p);
  return (
    <ExampleWorksheet
      example={{ ...e, id }}
      p={p}
      setParameter={(key, value) => setP({ ...p, [key]: value })}
      solution={solution}
      steps={e.asks.map((a) => ({
        tex: a.tex,
        sub: a.sub(p),
        value: `${a.text} = ${fmt(solution[a.key])} ${a.unit}`,
      }))}
      judgment={e.judgment(p)}
      note="采用 SI 单位，内部计算不对中间结果取整。"
      panel={plot}
      caption={`图 ${id}　例题工作点`}
      exportScript={() =>
        download(
          [
            `% ${e.title}`,
            ...Object.entries(p).map(([k, v]) => `${k}=${v};`),
            ...e.asks.map((a) => `${a.key}=${a.matlab}; fprintf('${a.key} = %.10g\\n',${a.key});`),
            matlab([plot], 1, 1, e.title),
          ].join("\n"),
          `${id}-calculation.m`,
          "text/plain;charset=utf-8",
        )
      }
    />
  );
}
export default function P1Lecture({ lecture: l }: { lecture: Lecture }) {
  const [p, setP] = useState({ ...l.defaults }),
    [t, setT] = useState(0),
    [playing, setPlaying] = useState(false);
  const period = l.animationPeriod?.(p) ?? 1;
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const handle = window.setInterval(() => {
      const now = performance.now();
      setT((t) => (t + (((now - last) / 1000) * period) / 3) % (period * 2));
      last = now;
    }, 40);
    return () => clearInterval(handle);
  }, [playing, period]);
  const setParameter = (key: string, value: number) => {
    setP((p) => ({ ...p, [key]: value }));
    setT(0);
  };
  return (
    <>
      <section id="key-points">
        <h2>本讲要点</h2>
        <ul>
          {l.keyPoints.map((s) => (
            <li key={s}>
              <MathProse text={s} />
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
        {l.animation && (
          <div className="animation-controls">
            <button onClick={() => setPlaying(!playing)}>{playing ? "暂停" : "播放"}</button>
            <button
              onClick={() => {
                setPlaying(false);
                setT((t) => (t + period / 40) % (period * 2));
              }}
            >
              单步
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setT(0);
              }}
            >
              复位时间
            </button>
            <output>时间 t = {fmt(t)} s（慢放，坐标固定）</output>
          </div>
        )}
        {l.boundaryEquations && (
          <p>
            <MathText tex={l.boundaryEquations[p.boundary]} />
          </p>
        )}
        {l.id === "2.1" && (
          <p>
            拖动第一张图的弦形可改变初始挠度；也可使用数值框或滑块。箭头为张力方向示意，分力数值见读数表。
          </p>
        )}
        {l.figures.map((f, index) => (
          <div
            key={f.number}
            style={{ touchAction: l.id === "2.1" && index === 0 ? "none" : undefined }}
            onPointerDown={
              l.id === "2.1" && index === 0
                ? (event) => {
                    if ((event.target as HTMLElement).closest("button")) return;
                    setPlaying(false);
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const box = event.currentTarget.getBoundingClientRect();
                    setParameter(
                      "height",
                      Math.max(
                        -0.02,
                        Math.min(0.02, (0.5 - (event.clientY - box.top) / box.height) * 0.08),
                      ),
                    );
                  }
                : undefined
            }
            onPointerMove={
              l.id === "2.1" && index === 0
                ? (event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                    const box = event.currentTarget.getBoundingClientRect();
                    setParameter(
                      "height",
                      Math.max(
                        -0.02,
                        Math.min(0.02, (0.5 - (event.clientY - box.top) / box.height) * 0.08),
                      ),
                    );
                  }
                : undefined
            }
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
            }}
          >
            <Figure
              key={f.number}
              name={f.number}
              caption={`图 ${f.number}　${f.title}`}
              rows={f.rows}
              cols={f.cols}
              panels={f.plot(p, t)}
            />
          </div>
        ))}
        <fieldset className="parameter-panel">
          <legend>图形参数（SI 单位，作用于本讲全部图）</legend>
          {l.materials && (
            <label>
              材料预设
              <select
                aria-label="材料预设"
                value={p.material}
                onChange={(e) => {
                  const i = Number(e.target.value),
                    m = l.materials![i];
                  setP({ ...p, material: i, E: m.E, rho: m.rho });
                  setT(0);
                }}
              >
                {l.materials.map((m, i) => (
                  <option key={m.name} value={i}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {l.parameters.map((original) => {
            const d =
              l.controls === "damping" && original.key === "value"
                ? {
                    ...original,
                    symbol: ["Rₘ", "δ", "Qₘ"][p.input],
                    unit: ["kg/s", "s⁻¹", "—"][p.input],
                  }
                : original;
            return (
              <Parameter
                key={d.key}
                definition={d}
                value={p[d.key]}
                onChange={(v) => setParameter(d.key, v)}
              />
            );
          })}
          {l.controls === "damping" && (
            <label>
              阻尼输入方式
              <select
                aria-label="阻尼输入方式"
                value={p.input ?? 0}
                onChange={(e) => setParameter("input", Number(e.target.value))}
              >
                <option value="0">力阻</option>
                <option value="1">阻尼系数</option>
                <option value="2">品质因数</option>
              </select>
            </label>
          )}
          {(l.controls === "string-boundary" || l.controls === "rod-boundary") && (
            <label>
              右端边界条件
              <select
                aria-label="右端边界条件"
                value={p.boundary}
                onChange={(e) => setParameter("boundary", Number(e.target.value))}
              >
                {(l.controls === "string-boundary"
                  ? ["固定", "外力激励", "位移激励", "振速激励"]
                  : ["固定", "自由", "质量负载", "激励力"]
                ).map((s, i) => (
                  <option key={s} value={i}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="parameter-actions">
            {(l.controls === "pluck" || l.controls === "string-boundary") && (
              <>
                <button onClick={() => setP({ ...p, T: 70, mu: 0.0004, L: 0.65 })}>吉他弦</button>
                <button onClick={() => setP({ ...p, T: 180, mu: 0.002, L: 1.2 })}>古筝弦</button>
              </>
            )}
            <button
              className="text-button"
              onClick={() => {
                setP({ ...l.defaults });
                setT(0);
                setPlaying(false);
              }}
            >
              恢复默认参数
            </button>
          </div>
        </fieldset>
        <table className="readouts">
          <caption>当前参数关键读数</caption>
          <thead>
            <tr>
              <th>量</th>
              <th>数值</th>
              <th>单位</th>
            </tr>
          </thead>
          <tbody>
            {l.readouts(p).map(([label, value, unit]) => (
              <tr key={label}>
                <td>
                  <MathProse text={String(label)} />
                </td>
                <td>{Number.isFinite(value) ? fmt(value) : "不适用"}</td>
                <td>
                  <MathProse text={unit} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section id="examples">
        <h2>例题与参考解答</h2>
        {l.examples.map((e, i) => (
          <Example key={i} example={e} id={`${l.id}-E${i + 1}`} />
        ))}
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
