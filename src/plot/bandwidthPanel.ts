import { bandwidthExample } from "../content/examples/bandwidth";
import { powerPanel } from "./chapter1Figures";
import { modelsFor } from "./matlabModels";
/** The worksheet and audit/export checks use the same modeled, titled panel. */
export function bandwidthPanel(p: typeof bandwidthExample.defaults) {
  const s = bandwidthExample.solve(p);
  const panel = powerPanel({ M: p.M, D: p.D, Rm: s.Rm, F0: s.force });
  panel.series!.push({
    name: "目标振速工作点",
    points: [[s.f0, s.power]],
    marker: "o",
    style: "none",
  });
  return modelsFor("B-1", { ...p, Rm: s.Rm, F0: s.force }, [panel], [...bandwidthExample.given])[0];
}
