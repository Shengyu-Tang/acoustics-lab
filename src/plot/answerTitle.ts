import type { Panel } from "./types";
import type { Ask, Values } from "../content/p1";
import { fmt } from "../content/p1";

/** Keep the visible answer and the editable MATLAB title tied to the same quantity. */
export function answerTitle(panel: Panel, asks: Ask[], p: Values): Panel {
  const marker = panel.series?.find((s) => s.marker === "o")?.points[0]?.[1];
  const a =
    asks.find((a) => a.key === panel.answerKey) ??
    asks.find(
      (a) =>
        marker !== undefined && Math.abs(a.calc(p) - marker) < 1e-9 * Math.max(1, Math.abs(marker)),
    ) ??
    asks[0];
  const label = a.text.replace(/^\(\d+\)\s*/, "").replace(/（[^）]*）/g, "");
  const value = a.calc(p);
  const divisor =
    a.unit === "Hz" ? (Math.abs(value) >= 1e6 ? 1e6 : Math.abs(value) >= 1e3 ? 1e3 : 1) : 1;
  const displayUnit = divisor === 1e6 ? "MHz" : divisor === 1e3 ? "kHz" : a.unit;
  const unit = displayUnit === "—" ? "" : ` ${displayUnit}`;
  const conclusion = /选定频率/.test(label)
    ? value > 0
      ? "：波束与损失同时满足"
      : "：当前约束下无可行方案"
    : "";
  panel.responseNote ??= panel.title;
  panel.title = `${label} = ${fmt(value / divisor)}${unit}${conclusion}`;
  const m = panel.matlabModel!;
  if (a.unit === "Hz") {
    m.setup += `\nqa_title_value=${a.key};qa_title_unit='Hz';if abs(qa_title_value)>=1e6,qa_title_value=qa_title_value/1e6;qa_title_unit='MHz';elseif abs(qa_title_value)>=1e3,qa_title_value=qa_title_value/1e3;qa_title_unit='kHz';end;`;
    m.title = `sprintf('${label.replaceAll("'", "''")} = %s %s',answerNumber(qa_title_value),qa_title_unit)`;
    if (/选定频率/.test(label)) {
      m.setup += `qa_title_result='：当前约束下无可行方案';if ${a.key}>0,qa_title_result='：波束与损失同时满足';end;`;
      m.title = `sprintf('${label.replaceAll("'", "''")} = %s %s%s',answerNumber(qa_title_value),qa_title_unit,qa_title_result)`;
    }
  } else
    m.title = `sprintf('${label.replaceAll("'", "''")} = %s${unit.replaceAll("%", "%%")}',answerNumber(${a.key}))`;
  return panel;
}
