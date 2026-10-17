import { createRoot } from "react-dom/client";
import { lazy, Suspense, useEffect, useState } from "react";
import Home from "./Home";
import "./style.css";
import "./redesign.css";
const Lab = lazy(() => import("./Lab")),
  Comparisons = lazy(() => import("./Comparisons")),
  Projects = lazy(() => import("./Projects")),
  About = lazy(() => import("./About")),
  Calendar = lazy(() => import("./Calendar")),
  MindMap = lazy(() => import("./MindMap")),
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
  return (
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
      ) : route === "#/map" ? (
        <MindMap />
      ) : route === "#/lab" ? (
        <Lab key={hash} />
      ) : (
        <Home />
      )}
    </Suspense>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
