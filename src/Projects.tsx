import { useEffect, useState } from "react";
import Header from "./Header";
import { engineeringCases } from "./content/cases";
import { EngineeringWorksheet } from "./EngineeringCase";
import topics from "./topics.json";
import { MathProse } from "./Math";
import { ComparisonLinks } from "./ComparisonLinks";
import projects from "./projects.json";
export default function Projects() {
  const selection = () =>
    new URLSearchParams(location.hash.split("?")[1]).get("project") ?? "ocean";
  const [selected, setSelected] = useState(selection);
  useEffect(() => {
    const update = () => setSelected(selection());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const current = engineeringCases.find((p) => p.id === selected) ?? engineeringCases[0];
  useEffect(() => {
    document.title = `${current.title} · 声学基础 · 中国海洋大学`;
  }, [current]);
  return (
    <>
      <Header />
      <main className="projects-page engineering-problems">
        <h1>综合工程案例</h1>
        <nav className="case-index" aria-label="综合案例目录">
          <ol>
            {engineeringCases.map((p) => (
              <li key={p.id}>
                <a
                  href={`#/cases?project=${p.id}`}
                  aria-current={p.id === current.id ? "page" : undefined}
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <section className="case-problem" aria-label={current.title}>
          <h2>设计任务与验收指标</h2>
          <p>
            <MathProse text={current.criterion} />
          </p>
          <p>
            <strong>使用讲次：</strong>
            {current.lectures.map((id, i) => (
              <span key={id}>
                {i > 0 ? "；" : ""}
                <a href={`#/lab?topic=${id}`}>
                  {id} {topics.find((t) => t.id === id)?.title}
                </a>
              </span>
            ))}
          </p>
          <EngineeringWorksheet key={current.id} problem={current} />
          <ComparisonLinks models={projects.find((p) => p.id === current.id)!.models} />
          <h2>模型条件与来源</h2>
          <p>
            <MathProse text={current.assumptions} />
          </p>
          {current.sources?.map((s) => (
            <p key={s.href}>
              <a href={s.href}>{s.title}</a>
            </p>
          ))}
        </section>
      </main>
    </>
  );
}
