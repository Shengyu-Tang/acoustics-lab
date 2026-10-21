import { useState } from "react";
import { grade } from "./physics/chapter1";
import { NumberField } from "./Parameter";
import MathText, { MathProse } from "./Math";
import Figure from "./plot/Figure";
import type { Panel } from "./plot/types";
type Given = {
  integer?: boolean;
  key: string;
  symbol: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};
export type ExampleSpec = {
  id: string;
  title: string;
  background: string;
  given: readonly Given[];
  asks: readonly { key: string; text: string; unit: string }[];
  hints: readonly string[];
};
export type SolutionStep = { tex: string; sub: string; value: string };
export default function ExampleWorksheet({
  example,
  p,
  setParameter,
  solution,
  steps,
  judgment,
  note,
  panel,
  additionalPanels = [],
  caption,
  exportScript,
}: {
  example: ExampleSpec;
  p: Record<string, number>;
  setParameter: (key: string, value: number) => void;
  solution: Record<string, unknown>;
  steps: SolutionStep[];
  judgment: string;
  note: string;
  panel: Panel;
  additionalPanels?: Panel[];
  caption: string;
  exportScript: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({}),
    [submitted, setSubmitted] = useState(false),
    [hint, setHint] = useState(0);
  const guideCaption = (q: Panel) =>
    [
      ...(q.annotations ?? []).filter((a) => a.axis === "x").map((a) => a.label),
      ...(q.bands ?? []).map((b) => b.label),
    ].join("；");
  return (
    <article className="calculation-example">
      <h3>
        <MathProse text={example.title} />
      </h3>
      <p>
        <MathProse text={example.background} />
      </p>
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
              <td>
                <MathProse text={d.symbol} />
              </td>
              <td>{d.name}</td>
              <td>
                <NumberField
                  label={`例题${d.name}`}
                  value={p[d.key]}
                  onChange={(n) => {
                    setParameter(d.key, d.integer ? Math.round(n) : n);
                    setSubmitted(false);
                  }}
                  min={d.min}
                  max={d.max}
                  step={d.step}
                />
              </td>
              <td>
                <MathProse text={d.unit} />
              </td>
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
        <div className="student-answers">
          {example.asks.map((a) => (
            <label className="student-answer" key={a.key}>
              <span>
                <MathProse text={a.text} />
              </span>
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
              <span>
                <MathProse text={a.unit} />
              </span>
              {submitted && (
                <output>
                  {answers[a.key]?.trim()
                    ? grade(Number(answers[a.key]), Number(solution[a.key]))
                    : "尚未作答"}
                </output>
              )}
            </label>
          ))}
        </div>
        <div className="example-actions">
          <button type="submit">提交答案</button>
          <button
            type="button"
            aria-label="提示 1：选择公式"
            aria-expanded={hint >= 1}
            onClick={() => setHint(Math.max(1, hint))}
          >
            提示 1
          </button>
          <button
            type="button"
            aria-label="提示 2：代入步骤"
            aria-expanded={hint >= 2}
            onClick={() => setHint(2)}
          >
            提示 2
          </button>
        </div>
        <div role="status">{submitted ? "判分已更新，请查看每一问的反馈。" : ""}</div>
      </form>
      <div className="example-hints">
        {example.hints.slice(0, hint).map((h) => (
          <p key={h}>
            <MathProse text={h} />
          </p>
        ))}
      </div>
      <details className="reference-solution">
        <summary>展开分步参考解答（随已知条件重算）</summary>
        <div className="solution-content">
          {steps.map((step, i) => (
            <section key={i}>
              <h4>第 {i + 1} 步</h4>
              <MathText tex={step.tex} />
              <p>
                <MathProse text={step.sub} />
              </p>
              <p>
                <strong>
                  <MathProse text={step.value} />
                </strong>
              </p>
            </section>
          ))}
          <p>
            <strong>工程判断：</strong>
            <MathProse text={judgment} />
          </p>
          <p>
            <MathProse text={note} />
          </p>
        </div>
      </details>
      <Figure
        panels={[{ ...panel, annotationHeader: false, annotationLabelsInCaption: true }]}
        caption={`${caption.split("　")[0]}　${panel.title}${guideCaption(panel) ? `；${guideCaption(panel)}` : ""}`}
        name={example.id}
      />
      {additionalPanels.map((q, i) => (
        <Figure
          key={i}
          panels={[{ ...q, annotationHeader: false, annotationLabelsInCaption: true }]}
          caption={`图 ${example.id}-${i + 2}　${q.title}${guideCaption(q) ? `；${guideCaption(q)}` : ""}`}
          name={`${example.id}-${i + 2}`}
        />
      ))}
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
