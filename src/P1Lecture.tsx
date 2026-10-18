import { useEffect, useState } from "react";
import type { P1Lecture as Lecture, Values } from "./content/p1";
import { fmt } from "./content/p1";
import Parameter, { NumberField } from "./Parameter";
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
      caption={`图 ${id}　${plot.title}`}
      exportScript={() =>
        download(
          matlab([plot], 1, 1, e.title),
          `calculation_${id.replace(/\W/g, "_")}.m`,
          "text/plain;charset=utf-8",
        )
      }
    />
  );
}
function plotPosition(host: HTMLDivElement, clientX: number, clientY: number, index = 0) {
  const area = host.querySelectorAll<SVGRectElement>("[data-plot-area]")[index];
  const r = area.getBoundingClientRect();
  return {
    x:
      Number(area.dataset.xMin) +
      ((clientX - r.left) / r.width) * (Number(area.dataset.xMax) - Number(area.dataset.xMin)),
    y:
      Number(area.dataset.yMax) -
      ((clientY - r.top) / r.height) * (Number(area.dataset.yMax) - Number(area.dataset.yMin)),
  };
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
        {l.interactive?.presets && (
          <div className="parameter-actions">
            {l.interactive.presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setP((p) => ({ ...p, ...preset.values }));
                  setT(0);
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
        {l.interactive?.levels && (
          <fieldset className="parameter-panel">
            <legend>声级双向换算（修改任一侧，另一侧重算）</legend>
            {[
              {
                key: "pRms",
                name: "声压有效值",
                unit: "Pa",
                factor: 20,
                ref: p.medium ? 1e-6 : 20e-6,
              },
              { key: "intensity", name: "声强", unit: "W/m²", factor: 10, ref: 1e-12 },
              { key: "power", name: "声功率", unit: "W", factor: 10, ref: 1e-12 },
            ].map((s) => (
              <label key={s.key} className="p2-converter">
                {s.name}
                <NumberField
                  label={`${s.name}线性值`}
                  value={p[s.key]}
                  min={1e-15}
                  max={1e9}
                  step={1e-6}
                  onChange={(v) => setParameter(s.key, v)}
                />
                <span>
                  <MathProse text={s.unit} />
                </span>
                <NumberField
                  label={`${s.name}级`}
                  value={s.factor * Math.log10(p[s.key] / s.ref)}
                  min={-100}
                  max={300}
                  step={0.1}
                  onChange={(v) => setParameter(s.key, s.ref * 10 ** (v / s.factor))}
                />
                dB
              </label>
            ))}
          </fieldset>
        )}
        {l.id === "7.1" && (
          <fieldset className="parameter-panel">
            <legend>幅值吸收系数双向换算</legend>
            <label className="p2-converter">
              奈贝与分贝
              <NumberField
                label="吸收系数奈贝每米"
                value={p.alpha}
                min={0.00001}
                max={0.2}
                step={0.00001}
                onChange={(v) => setParameter("alpha", v)}
              />
              Np/m
              <NumberField
                label="吸收系数分贝每米"
                value={(20 / Math.LN10) * p.alpha}
                min={(20 / Math.LN10) * 0.00001}
                max={(20 / Math.LN10) * 0.2}
                step={0.0001}
                onChange={(v) => setParameter("alpha", (v * Math.LN10) / 20)}
              />
              dB/m
            </label>
          </fieldset>
        )}
        {l.interactive?.selectors?.map((s) => (
          <label key={s.key} className="p2-choice">
            {s.label}{" "}
            <select
              aria-label={s.label}
              value={p[s.key]}
              onChange={(e) => setParameter(s.key, Number(e.target.value))}
            >
              {s.options.map((text, i) => (
                <option key={text} value={i}>
                  {text}
                </option>
              ))}
            </select>
          </label>
        ))}
        {l.interactive?.toggles?.map((s) => (
          <label key={s.key} className="p2-choice">
            <input
              type="checkbox"
              checked={Boolean(p[s.key])}
              onChange={(e) => setParameter(s.key, Number(e.target.checked))}
            />
            {s.label}
          </label>
        ))}
        {l.interactive?.steps && (
          <div className="p2-derivation">
            <button
              onClick={() =>
                setParameter("step", Math.min(l.interactive!.steps!.length - 1, (p.step ?? 0) + 1))
              }
            >
              下一步
            </button>{" "}
            <button onClick={() => setParameter("step", 0)}>从头推导</button>
            {l.interactive.steps.slice(0, (p.step ?? 0) + 1).map((s, i) => (
              <div key={i} aria-current={i === p.step ? "step" : undefined}>
                <MathText tex={s.tex} />
                <p>
                  <MathProse text={s.text} />
                </p>
              </div>
            ))}
          </div>
        )}
        {l.interactive?.links && (
          <nav className="p2-route" aria-label="推导路线">
            {l.interactive.links.map((s) => (
              <a key={s.href} href={s.href}>
                {s.text}
              </a>
            ))}
          </nav>
        )}
        {l.interactive?.sketch && (
          <p>选择“手绘”后，在第一张图中拖动绘制初始波形；九个采样点之间作线性插值，再点击播放。</p>
        )}
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
        <div className="simulation-layout">
          <div className="simulation-plots">
            {l.figures.map((f, index) => (
              <div
                key={f.number}
                style={{
                  userSelect: l.interactive?.sketch || l.id === "3.4.2" ? "none" : undefined,
                  touchAction:
                    (l.id === "2.1" || l.id === "3.4.2" || l.interactive?.sketch) && index === 0
                      ? "none"
                      : undefined,
                }}
                onPointerDown={
                  l.id === "3.4.2" && index === 0
                    ? (event) => {
                        if ((event.target as HTMLElement).closest("button")) return;
                        event.preventDefault();
                        const point = plotPosition(
                          event.currentTarget,
                          event.clientX,
                          event.clientY,
                          1,
                        );
                        setParameter("obs", Math.max(0, Math.min(2, point.x)));
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }
                    : l.interactive?.sketch && p.shape === 2 && index === 0
                      ? (event) => {
                          if ((event.target as HTMLElement).closest("button")) return;
                          event.preventDefault();
                          const point = plotPosition(
                            event.currentTarget,
                            event.clientX,
                            event.clientY,
                          );
                          const i = Math.max(
                            0,
                            Math.min(8, Math.round(((point.x * p.f) / p.c) * 4)),
                          );
                          const value = Math.max(-1, Math.min(1, point.y));
                          setPlaying(false);
                          setT(0);
                          setP((p) => ({ ...p, [`h${i}`]: value }));
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }
                      : l.id === "2.1" && index === 0
                        ? (event) => {
                            if ((event.target as HTMLElement).closest("button")) return;
                            setPlaying(false);
                            event.currentTarget.setPointerCapture(event.pointerId);
                            const box = event.currentTarget.getBoundingClientRect();
                            setParameter(
                              "height",
                              Math.max(
                                -0.02,
                                Math.min(
                                  0.02,
                                  (0.5 - (event.clientY - box.top) / box.height) * 0.08,
                                ),
                              ),
                            );
                          }
                        : undefined
                }
                onPointerMove={
                  l.id === "3.4.2" && index === 0
                    ? (event) => {
                        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                        const point = plotPosition(
                          event.currentTarget,
                          event.clientX,
                          event.clientY,
                          1,
                        );
                        setParameter("obs", Math.max(0, Math.min(2, point.x)));
                      }
                    : l.interactive?.sketch && p.shape === 2 && index === 0
                      ? (event) => {
                          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                          const point = plotPosition(
                            event.currentTarget,
                            event.clientX,
                            event.clientY,
                          );
                          const i = Math.max(
                            0,
                            Math.min(8, Math.round(((point.x * p.f) / p.c) * 4)),
                          );
                          setP((p) => ({
                            ...p,
                            [`h${i}`]: Math.max(-1, Math.min(1, point.y)),
                          }));
                        }
                      : l.id === "2.1" && index === 0
                        ? (event) => {
                            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                            const box = event.currentTarget.getBoundingClientRect();
                            setParameter(
                              "height",
                              Math.max(
                                -0.02,
                                Math.min(
                                  0.02,
                                  (0.5 - (event.clientY - box.top) / box.height) * 0.08,
                                ),
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
                {f.dimensionlessComparison && (
                  <p className="figure-independence">
                    <MathProse text={f.dimensionlessComparison} />
                    <MathProse
                      text={
                        f.independentOf?.length
                          ? `；本图与 ${f.independentOf.map((key) => l.parameters.find((d) => d.key === key)?.symbol ?? key).join("、")} 无关`
                          : ""
                      }
                    />
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="simulation-sidebar">
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
                    <button onClick={() => setP({ ...p, T: 70, mu: 0.0004, L: 0.65 })}>
                      吉他弦
                    </button>
                    <button onClick={() => setP({ ...p, T: 180, mu: 0.002, L: 1.2 })}>
                      古筝弦
                    </button>
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
          </div>
        </div>
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
