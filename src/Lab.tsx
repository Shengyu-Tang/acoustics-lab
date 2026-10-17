import { lazy, Suspense, useState } from "react";
import Header from "./Header";
import topics from "./topics.json";
import { models, defaults, type Values } from "./physics";
import Formula from "./Formula";
import Simulation from "./Simulation";
import EngineeringCase from "./EngineeringCase";
import { ComparisonLinks } from "./Comparisons";
import Parameter from "./Parameter";
import SampleLecture from "./SampleLecture";
import lecture124 from "./content/lectures/1.2.4";
import lecture125 from "./content/lectures/1.2.5";
import { chapters } from "./catalog";
const BeatsLab = lazy(() => import("./BeatsLab"));
const Scene3D = lazy(() => import("./Scene3D"));
export const sections = [
  ["key-points", "本讲要点"],
  ["principle", "原理"],
  ["simulation", "仿真"],
  ["examples", "例题与参考解答"],
  ["questions", "思考题"],
  ["engineering", "工程应用"],
];
export function ChapterTree({ id, onChoose }: { id: string; onChoose: () => void }) {
  const [search, setSearch] = useState("");
  return (
    <>
      <label className="catalog-search">
        查找讲次
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="编号或标题"
        />
      </label>
      {chapters.slice(1).map((name, i) => (
        <details
          key={name}
          open={search ? true : topics.find((t) => t.id === id)?.chapter === i + 1}
        >
          <summary>
            第 {i + 1} 章　{name}
          </summary>
          <ol>
            {topics
              .filter((t) => t.chapter === i + 1 && `${t.id} ${t.title}`.includes(search))
              .map((t) => (
                <li key={t.id}>
                  <a
                    href={`#/lab?topic=${t.id}`}
                    aria-current={id === t.id ? "page" : undefined}
                    onClick={onChoose}
                  >
                    <span>{t.id}</span> {t.title}
                  </a>
                </li>
              ))}
          </ol>
        </details>
      ))}
    </>
  );
}
function LegacyLecture({ topic }: { topic: (typeof topics)[number] }) {
  const model = models[topic.model];
  const [v, setV] = useState<Values>(() => {
    const values = defaults(model),
      q = new URLSearchParams(location.hash.split("?")[1]);
    model.params.forEach((p) => {
      const n = Number(q.get(p.key));
      if (q.has(p.key) && Number.isFinite(n) && n >= p.min && n <= p.max) values[p.key] = n;
    });
    return values;
  });
  return (
    <>
      <section id="key-points">
        <h2>本讲要点</h2>
        <p>{topic.focus}</p>
        <p>{model.meaning}</p>
      </section>
      <section id="principle">
        <h2>原理</h2>
        <Formula kind={topic.model} />
        <p>{model.limit}</p>
      </section>
      <section id="simulation">
        <h2>仿真</h2>
        <Simulation kind={topic.model} v={v} />
        <fieldset className="parameter-panel">
          <legend>模型参数</legend>
          {model.params.map((p) => (
            <Parameter
              key={p.key}
              definition={{
                key: p.key,
                name: p.label,
                symbol: "",
                unit: p.unit,
                min: p.min,
                max: p.max,
                step: p.step,
              }}
              value={v[p.key]}
              onChange={(n) => setV({ ...v, [p.key]: n })}
            />
          ))}
          <button onClick={() => setV(defaults(model))}>恢复默认参数</button>
        </fieldset>
        {topic.model === "undamped" && (
          <Suspense fallback={<p>载入拍现象演示…</p>}>
            <BeatsLab />
          </Suspense>
        )}
      </section>
      <section id="examples">
        <h2>例题与参考解答</h2>
        <EngineeringCase
          topic={topic}
          onLoad={() => setV({ ...defaults(model), ...model.preset })}
        />
      </section>
      <section id="questions">
        <h2>思考题</h2>
        {topic.questions?.map((q) => (
          <p key={q}>{q}</p>
        ))}
        <details>
          <summary>{model.question}（展开模型解释）</summary>
          <p>{model.answer}</p>
        </details>
      </section>
      <section id="engineering">
        <h2>工程应用</h2>
        <p>{model.application}</p>
        <ComparisonLinks models={[topic.model]} />
        <details>
          <summary>展开工程场景示意</summary>
          <Suspense fallback={<p>载入工程场景…</p>}>
            <Scene3D kind={topic.model} v={v} />
          </Suspense>
        </details>
        <a href="#/cases">综合工程案例</a>
      </section>
    </>
  );
}
export default function Lab() {
  const q = new URLSearchParams(location.hash.split("?")[1]),
    topic = topics.find((t) => t.id === q.get("topic")) ?? topics[0];
  const lecture = topic.id === "1.2.4" ? lecture124 : topic.id === "1.2.5" ? lecture125 : null;
  const [open, setOpen] = useState(false),
    index = topics.findIndex((t) => t.id === topic.id);
  return (
    <>
      <Header />
      <div className="lecture-layout">
        <button
          className="catalog-toggle"
          aria-expanded={open}
          aria-controls="chapter-tree"
          onClick={() => setOpen(!open)}
        >
          {open ? "关闭章节目录" : "章节目录"}
        </button>
        <aside
          id="chapter-tree"
          className={`chapter-tree ${open ? "drawer-open" : ""}`}
          aria-label="课程章节目录"
        >
          <ChapterTree id={topic.id} onChoose={() => setOpen(false)} />
        </aside>
        <main className="lecture-body">
          <h1>
            {topic.id} {topic.title}
          </h1>
          <p className="mooc-source">
            对应慕课：{lecture?.moocSource ?? topic.source}
            {lecture ? ` · ${lecture.classNumber}` : ""}
          </p>
          {lecture ? (
            <SampleLecture key={topic.id} lecture={lecture} />
          ) : (
            <LegacyLecture key={topic.id} topic={topic} />
          )}
          <div className="lesson-pagination">
            {index > 0 ? (
              <a href={`#/lab?topic=${topics[index - 1].id}`}>
                上一讲：{topics[index - 1].id} {topics[index - 1].title}
              </a>
            ) : (
              <span />
            )}
            {index < topics.length - 1 && (
              <a href={`#/lab?topic=${topics[index + 1].id}`}>
                下一讲：{topics[index + 1].id} {topics[index + 1].title}
              </a>
            )}
          </div>
        </main>
        <aside className="page-toc" aria-label="本页目录">
          <strong>本页目录</strong>
          {sections.map(([id, title]) => (
            <a
              key={id}
              href={`#/lab?topic=${topic.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
              }}
            >
              {title}
            </a>
          ))}
        </aside>
      </div>
      <footer className="site-footer">声学基础 · 中国海洋大学 · 唐胜雨</footer>
    </>
  );
}
