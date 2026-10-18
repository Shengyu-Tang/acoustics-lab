import { createRoot } from "react-dom/client";
import { lazy, Suspense, useEffect, useState } from "react";
import Home from "./Home";
import Footer from "./Footer";
import catalog from "./content/homeCatalog.json";
import "./style.css";
import "./redesign.css";
const Lab = lazy(() => import("./Lab")),
  Comparisons = lazy(() => import("./Comparisons")),
  Projects = lazy(() => import("./Projects")),
  About = lazy(() => import("./About")),
  Calendar = lazy(() => import("./Calendar")),
  MindMap = lazy(() => import("./MindMap")),
  Feedback = lazy(() => import("./Feedback")),
  PlotDemo = lazy(() => import("./plot/PlotDemo"));
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const update = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const route = hash.split("?")[0];
  useEffect(() => {
    if (route === "#/cases") return; // The case route owns its selected task title.
    const names: Record<string, string> = {
      "#/plot-demo": "绘图组件演示",
      "#/compare": "对照实验",
      "#/cases": "综合案例",
      "#/about": "教师主页",
      "#/calendar": "教学日历",
      "#/map": "课程知识导图",
      "#/feedback": "建议与反馈",
    };
    const topic =
      route === "#/lab"
        ? (catalog.topics.find(
            (t) => t.id === new URLSearchParams(hash.split("?")[1]).get("topic"),
          ) ?? catalog.topics[0])
        : null;
    const title = topic ? `${topic.id} ${topic.title}` : names[route];
    document.title = `${title ? title + " · " : ""}声学基础 · 中国海洋大学`;
  }, [hash, route]);
  return (
    <>
      <Suspense
        fallback={
          <main>
            <p role="status">正在载入课程内容…</p>
          </main>
        }
      >
        {route === "#/plot-demo" ? (
          <PlotDemo />
        ) : route === "#/compare" ? (
          <Comparisons />
        ) : route === "#/cases" ? (
          <Projects />
        ) : route === "#/about" ? (
          <About />
        ) : route === "#/calendar" ? (
          <Calendar />
        ) : route === "#/feedback" ? (
          <Feedback />
        ) : route === "#/map" ? (
          <MindMap />
        ) : route === "#/lab" ? (
          <Lab key={hash} />
        ) : (
          <Home />
        )}
      </Suspense>
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
