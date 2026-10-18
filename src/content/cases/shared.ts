import type { P1Example, Values, Ask } from "../p1";
import { example, parameter, ask, fmt } from "../p2";
import { physical, line, dot, xmark, ymark, value } from "../../plot/physicalExample";
import type { Panel } from "../../plot/types";
import { axisTicks } from "../../plot/ticks";
export { parameter, ask, fmt, physical, line, dot, xmark, ymark, value };
export type { Values, Ask };
export type EngineeringProblem = P1Example & {
  additionalPlots?: (p: Values) => import("../../plot/types").Panel[];
  id: string;
  lectures: string[];
  criterion: string;
  assumptions: string;
  sources?: { title: string; href: string }[];
};
export function problem(data: EngineeringProblem): EngineeringProblem {
  const e = example(
    data.title,
    data.background,
    data.defaults,
    data.given,
    data.asks,
    data.judgment,
    data.plot,
  );
  return {
    ...data,
    ...e,
    hints: data.hints,
    plot: (p) => casePanel(e.plot(p)),
    additionalPlots: data.additionalPlots
      ? (p) => data.additionalPlots!(p).map(casePanel)
      : undefined,
  };
}
function casePanel(q: Panel): Panel {
  let lane = 0;
  const ylim = q.coordinateY ? axisTicks(q.ylim).limits : q.ylim;
  return {
    ...q,
    ylim,
    staggeredAnnotations: true,
    matlabModel: {
      ...q.matlabModel!,
      ...(q.coordinateY ? { ylim: `[${ylim.join(" ")}]` } : {}),
      figureHeight: 640,
      annotationLanes: q.annotations?.map((a) => (a.axis === "x" ? lane++ / 2 : 0)),
      annotationLabelAlignments: q.annotations?.map((a) =>
        (a.value - q.xlim[0]) / (q.xlim[1] - q.xlim[0]) < 0.5 ? "right" : "left",
      ),
    },
  };
}
export const question = (
  key: string,
  text: string,
  unit: string,
  tex: string,
  matlab: string,
  calc: Ask["calc"],
  sub: Ask["sub"],
) => ask(key, text, unit, tex, matlab, calc, sub);
export const si = (n: number, unit: string) => `${fmt(n)} ${unit}`;
