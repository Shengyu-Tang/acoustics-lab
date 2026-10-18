import topics from "../topics.json";
import calendar from "../calendar.json";
import type { P1Lecture, Values, P1Example, Ask } from "./p1";
import type { Panel, Series, MatlabModel } from "../plot/types";
import { sample } from "../plot/types";
import { parameter } from "./p1";
export { parameter, fmt } from "./p1";
export const defaults = { rho: 1.21, c: 343, f: 1000, pa: 1 };
export const params = {
  rho: parameter("rho", "静态密度", "ρ₀", "kg/m³", 0.5, 8000, 0.01),
  c: parameter("c", "介质声速", "c₀", "m/s", 200, 6000, 1),
  f: parameter("f", "频率", "f", "Hz", 20, 20000, 10),
  pa: parameter("pa", "声压峰值", "pₐ", "Pa", 0.01, 200, 0.01),
};
export const commonSetup = "w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;";
export type Curve = Series & { mx: string; my: string };
export function curve(
  name: string,
  fn: (x: number) => number,
  range: [number, number],
  mx: string,
  my: string,
  style: Series["style"] = "-",
  n = 401,
): Curve {
  return { name, points: sample(fn, ...range, n), mx, my, style };
}
export function points(
  name: string,
  data: [number, number][],
  mx: string,
  my: string,
  extra: Partial<Series> = {},
): Curve {
  return { name, points: data, mx, my, ...extra };
}
export const vector = (v: number[]) => `[${v.join(" ")}]`;
export function graph(
  p: Values,
  t: number,
  title: string,
  xlabel: string,
  ylabel: string,
  xlim: [number, number],
  ylim: [number, number],
  curves: Curve[],
  setup = "",
  extra: Partial<Panel> = {},
  model: Partial<MatlabModel> = {},
): Panel {
  return {
    title,
    xlabel,
    ylabel,
    xlim,
    ylim,
    series: curves.map(({ mx, my, ...s }) => s),
    ...extra,
    matlabModel: {
      parameters: Object.entries({ ...p, tView: t }).map(([key, value]) => ({
        key,
        value,
        comment: params[key as keyof typeof params]
          ? `${params[key as keyof typeof params].name} (${params[key as keyof typeof params].unit})`
          : `${key}（见网页参数表；SI 单位或无量纲选择）`,
      })),
      setup: commonSetup + setup,
      series: curves.map((s) => ({ x: s.mx, y: s.my })),
      xlim: vector(xlim),
      ylim: vector(ylim),
      ...model,
    },
  };
}
export function figure(
  number: string,
  title: string,
  plot: (p: Values, t: number) => Panel[],
  rows = 1,
  cols = 1,
): P1Lecture["figures"][number] {
  return {
    number,
    title,
    plot,
    rows,
    cols,
    matlabModel: (_id, p, _panels, _definitions, t = 0) => plot(p, t),
  };
}
export function p2Lecture(
  id: string,
  data: Omit<P1Lecture, "id" | "title" | "moocSource" | "classNumber" | "questions"> & {
    answers: string[];
    readoutModel: string;
  },
): P1Lecture {
  const topic = topics.find((t) => t.id === id)!;
  if (data.answers.length !== topic.questions!.length)
    throw new Error(`P2 original questions missing: ${id}`);
  return {
    id,
    title: topic.title,
    moocSource: topic.source,
    classNumber: `第 ${calendar.find((d) => d.sections.some((s) => s.id === id))!.number} 次课`,
    ...data,
    figures: data.figures.map((f) => ({
      ...f,
      plot: (p, t) =>
        f.plot(p, t).map((panel) => {
          panel.matlabModel!.setup += `\nlecture_readouts=${data.readoutModel};`;
          panel.matlabModel!.parameters.forEach((q) => {
            const d = data.parameters.find((d) => d.key === q.key);
            if (d) q.comment = `${d.name} (${d.unit})`;
          });
          return panel;
        }),
    })),
    questions: topic.questions!.map((text, i) => ({ text, answer: data.answers[i] })),
  };
}
export const ask = (
  key: string,
  text: string,
  unit: string,
  tex: string,
  matlab: string,
  calc: Ask["calc"],
  sub: Ask["sub"],
): Ask => ({ key, text, unit, tex, matlab, calc, sub });
export function example(
  title: string,
  background: string,
  p: Values,
  given: P1Example["given"],
  asks: Ask[],
  judgment: P1Example["judgment"],
  plot: P1Example["plot"],
): P1Example {
  return {
    title,
    background,
    defaults: p,
    given,
    asks,
    judgment,
    hints: [
      `先辨别峰值、有效值及介质条件，用 $${asks[0].tex}$ 求第一问。`,
      `将当前已知条件统一为 SI 单位；第二问采用 $${asks[1].tex}$，保留未舍入的中间结果。`,
    ],
    plot: (p) => {
      const panel = plot(p);
      const marker = panel.series?.find((s) => s.marker === "o")?.points[0]?.[1];
      const answer = asks.find(
        (a) =>
          marker !== undefined &&
          Math.abs(a.calc(p) - marker) < 1e-10 * Math.max(1, Math.abs(marker)),
      );
      if (answer) panel.ylabel = `${answer.text.replace(/^\(\d+\)\s*/, "")} (${answer.unit})`;
      panel.matlabModel!.parameters.forEach((q) => {
        const d = given.find((d) => d.key === q.key);
        if (d) q.comment = `${d.name} (${d.unit})`;
      });
      panel.matlabModel!.setup +=
        "\n" +
        asks.map((a) => `${a.key}=${a.matlab};`).join("\n") +
        `\nworksheet_answers=[${asks.map((a) => a.key).join(" ")}];`;
      return panel;
    },
  };
}
export function answerCurve(
  p: Values,
  key: string,
  label: string,
  unit: string,
  fn: (p: Values) => number,
  expr: string,
): Panel {
  const end = p[key] * 2,
    low = Math.min(0, end),
    high = end === 0 ? 0.02 : Math.max(0, end),
    value = fn(p),
    samples = sample((x) => fn({ ...p, [key]: x }), low, high, 401).map((v) => v[1]);
  return graph(
    p,
    0,
    "例题答案与当前工作点",
    `${label} (${unit})`,
    "计算结果（见题目单位）",
    [low, high],
    [Math.min(0, ...samples), Math.max(1e-12, ...samples) * 1.3],
    [
      curve(
        "参考解",
        (x) => fn({ ...p, [key]: x }),
        [low, high],
        "linspace(qaRange(1),qaRange(2),401)",
        expr,
      ),
      points("本题答案", [[p[key], value]], key, expr.replace(/\bx\b/g, key), {
        style: "none",
        marker: "o",
      }),
    ],
    `qaRange=[min(0,2*${key}) max(0,2*${key})];if qaRange(1)==qaRange(2),qaRange(2)=.02;end;`,
    {},
    { xlim: "qaRange", ylim: "[min(0,min(model_y{1,1})) max(1e-12,max(model_y{1,1}))*1.3]" },
  );
}
export const engineering = (text: string, project = "hall", title = "交通枢纽语音清晰度") => ({
  text,
  href: `#/cases?project=${({ hall: "building", sonar: "ocean", receiver: "measurement", lens: "grin-lens" } as Record<string, string>)[project] ?? project}`,
  title,
});
