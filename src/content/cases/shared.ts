import type { P1Example, Values, Ask } from "../p1";
import { example, parameter, ask, fmt } from "../p2";
import { physical, line, dot, xmark, ymark, value } from "../../plot/physicalExample";
export { parameter, ask, fmt, physical, line, dot, xmark, ymark, value };
export type { Values, Ask };
export type EngineeringProblem = P1Example & {
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
    plot: (p) => {
      const panel = e.plot(p);
      panel.matlabModel!.parameters = panel.matlabModel!.parameters.filter(
        (d) => d.key !== "tView",
      );
      return panel;
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
