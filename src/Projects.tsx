import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Header from "./Header";
import projects from "./projects.json";
import { experimentForModel } from "./courseCatalog";
import { models } from "./physics";
import { ComparisonLinks } from "./Comparisons";
const LensLab = lazy(() => import("./LensLab"));
export default function Projects() {
  const [selected, setSelected] = useState(
    new URLSearchParams(location.hash.split("?")[1]).get("project") || projects[0].id,
  );
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () =>
      setSelected(
        new URLSearchParams(location.hash.split("?")[1]).get("project") || projects[0].id,
      );
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const current = projects.find((p) => p.id === selected) || projects[0];
  return (
    <>
      <Header />
      <main className="projects-page">
        <h1>综合工程案例</h1>
        <p className="lead">从项目需求出发，串联模型、实验与设计判断。</p>
        <div className="project-cards">
          {projects.map((p, i) => (
            <button
              key={p.id}
              aria-pressed={selected === p.id}
              onClick={() => {
                setSelected(p.id);
                history.replaceState(null, "", "#/cases?project=" + p.id);
                requestAnimationFrame(() =>
                  detail.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                );
              }}
            >
              <span>
                {String(i + 1).padStart(2, "0")} / {p.field}
              </span>
              <h3>{p.title}</h3>
              <small>{p.models.map((m) => models[m].title).join(" → ")}</small>
            </button>
          ))}
        </div>
        <article ref={detail} className="project-brief" aria-live="polite">
          <h2>{current.title}</h2>
          <h3>项目背景与任务</h3>
          <p>{current.background}</p>
          <h3>从真实项目到可计算模型</h3>
          <p>{current.mapping}</p>
          {current.id === "grin-lens" && (
            <Suspense fallback={<p>正在载入梯度透镜实验…</p>}>
              <LensLab />
            </Suspense>
          )}
          <ComparisonLinks models={current.models} />
          <h3>依次打开三个实验，记录你的设计证据</h3>
          <div className="project-steps">
            {current.models.map((m, i) => {
              const topic = experimentForModel(m);
              return (
                <a key={m} href={"#/lab?topic=" + topic.id}>
                  <span>第 {i + 1} 步</span>
                  <h3>{models[m].title}</h3>
                  <p>{models[m].question}</p>
                  <b>进入交互实验</b>
                </a>
              );
            })}
          </div>
          <div className="project-challenge">
            <h3>最终交付：一份有证据的方案比较</h3>
            <p>{current.challenge}</p>
            <p>
              写下两组参数、计算结果与现象，说明你的选择及模型不能回答的问题。可在实验中导出记录，再回到本页比较方案。
            </p>
          </div>
        </article>
        <footer>
          <a href="mailto:tangshengyu@ouc.edu.cn">建议反馈：tangshengyu@ouc.edu.cn</a>
        </footer>
      </main>
    </>
  );
}
