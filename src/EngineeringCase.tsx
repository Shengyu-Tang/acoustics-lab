import { useState } from "react";
import ExampleWorksheet from "./ExampleWorksheet";
import type { EngineeringProblem } from "./content/cases/shared";
import { fmt } from "./content/p1";
import { download, matlab } from "./plot/export";
import caseLinks from "./cases.json";
export function EngineeringWorksheet({ problem: e }: { problem: EngineeringProblem }) {
  const [p, setP] = useState({ ...e.defaults });
  const solution = Object.fromEntries(e.asks.map((a) => [a.key, a.calc(p)]));
  const panel = e.plot(p);
  const additionalPanels = e.additionalPlots?.(p) ?? [];
  return (
    <ExampleWorksheet
      example={e}
      p={p}
      setParameter={(key, value) => setP({ ...p, [key]: value })}
      solution={solution}
      steps={e.asks.map((a) => ({
        tex: a.tex,
        sub: a.sub(p),
        value: `${a.text} = ${fmt(solution[a.key])}${a.unit === "—" ? "" : " " + a.unit}`,
      }))}
      judgment={e.judgment(p)}
      note={e.assumptions}
      panel={panel}
      additionalPanels={additionalPanels}
      caption={`图 ${e.id}-1　${panel.title}`}
      exportScript={() =>
        download(
          matlab([panel, ...additionalPanels], 1 + additionalPanels.length, 1, e.title),
          `design_${e.id}.m`,
          "text/plain;charset=utf-8",
        )
      }
    />
  );
}
export default function EngineeringCase({
  topic,
}: {
  topic: { model: string };
  onLoad?: () => void;
}) {
  const id = (caseLinks as Record<string, string>)[topic.model] ?? "ocean";
  return (
    <section className="engineering-case">
      <h3>工程设计计算</h3>
      <p>将本讲模型用于多步计算、指标校核与方案选择。</p>
      <a href={`#/cases?project=${id}`}>打开相关综合案例</a>
    </section>
  );
}
