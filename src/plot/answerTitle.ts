import type { Panel } from "./types";
import type { Ask, Values } from "../content/p1";
import { fmt } from "../content/p1";

/** Keep the visible answer and the editable MATLAB title tied to the same quantity. */
export function answerTitle(panel: Panel, asks: Ask[], p: Values): Panel {
  const marker = panel.series?.find((s) => s.marker === "o")?.points[0]?.[1];
  const a =
    asks.find(
      (a) =>
        marker !== undefined && Math.abs(a.calc(p) - marker) < 1e-9 * Math.max(1, Math.abs(marker)),
    ) ?? asks[0];
  const label = a.text.replace(/^\(\d+\)\s*/, "");
  const unit = a.unit === "—" ? "" : ` ${a.unit}`;
  panel.responseNote ??= panel.title;
  panel.title = `${label} = ${fmt(a.calc(p))}${unit}`;
  panel.matlabModel!.title = `sprintf('${label.replaceAll("'", "''")} = %s${unit.replaceAll("%", "%%")}',answerNumber(${a.key}))`;
  return panel;
}
