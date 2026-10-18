import { lazy, Suspense, useState } from "react";
import Header from "./Header";
const KnowledgeGraph = lazy(() => import("./KnowledgeGraph"));
import CourseTree from "./CourseTree";
export default function MindMap() {
  const [view, setView] = useState("tree");
  return (
    <>
      <Header />
      <main className="map-page">
        <h1>课程知识导图</h1>
        <div className="atlas-switch" role="group" aria-label="导图展示方式">
          <button aria-pressed={view === "tree"} onClick={() => setView("tree")}>
            <b>课程思维导图</b>
          </button>
          <button aria-pressed={view === "graph"} onClick={() => setView("graph")}>
            <b>知识图谱</b>
          </button>
        </div>
        <Suspense fallback={<p role="status">正在载入知识图谱…</p>}>
          {view === "tree" ? <CourseTree /> : <KnowledgeGraph />}
        </Suspense>
      </main>
    </>
  );
}
