import type { Panel } from "./types";
import type { Ask, Values } from "../content/p1";

/** Keep the visible answer and the editable MATLAB title tied to the same quantity. */
export function answerTitle(panel: Panel, asks: Ask[], p: Values): Panel {
  const marker = panel.series?.find((s) => s.marker === "o")?.points[0]?.[1];
  const a =
    asks.find(
      (a) =>
        marker !== undefined && Math.abs(a.calc(p) - marker) < 1e-9 * Math.max(1, Math.abs(marker)),
    ) ?? asks[0];
  const label = a.text.replace(/^\(\d+\)\s*/, "");
  panel.title = `${label} = ${Number(a.calc(p).toPrecision(4))} ${a.unit}`;
  panel.matlabModel!.title = `sprintf('${label.replaceAll("'", "''")} = %.4g ${a.unit.replaceAll("%", "%%")}',${a.key})`;
  return panel;
}
