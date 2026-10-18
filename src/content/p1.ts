import topics from "../topics.json";
import type { ParameterDefinition } from "../Parameter";
import type { Panel } from "../plot/types";
export type Values = Record<string, number>;
export type Ask = {
  key: string;
  text: string;
  unit: string;
  tex: string;
  matlab: string;
  calc: (p: Values) => number;
  sub: (p: Values) => string;
};
export type P1Example = {
  title: string;
  background: string;
  defaults: Values;
  given: ParameterDefinition[];
  asks: Ask[];
  hints: string[];
  judgment: (p: Values) => string;
  plot: (p: Values) => Panel;
};
export type P1Lecture = {
  id: string;
  title: string;
  moocSource: string;
  classNumber: string;
  keyPoints: string[];
  formulas: { number: string; tex: string; meaning: string }[];
  defaults: Values;
  parameters: ParameterDefinition[];
  figures: {
    number: string;
    title: string;
    rows: number;
    cols: number;
    plot: (p: Values, t: number) => Panel[];
  }[];
  readouts: (p: Values) => [string, number, string][];
  questions: { text: string; answer: string }[];
  engineering: { text: string; href: string; title: string };
  examples: P1Example[];
  animation?: boolean;
  animationPeriod?: (p: Values) => number;
  controls?: "damping" | "string-boundary" | "rod-boundary" | "materials" | "pluck";
  boundaryEquations?: string[];
};
export function lecture(
  id: string,
  answers: string[],
  data: Omit<P1Lecture, "id" | "title" | "moocSource" | "questions" | "classNumber">,
): P1Lecture {
  const topic = topics.find((t) => t.id === id)!;
  if (answers.length !== topic.questions!.length)
    throw new Error(`Missing original questions: ${id}`);
  return {
    id,
    title: topic.title,
    moocSource: topic.source,
    classNumber: id.startsWith("2.")
      ? "第 4、5 次课"
      : id.startsWith("1.1")
        ? "第 1、2 次课"
        : "第 3 次课",
    questions: topic.questions!.map((text, i) => ({ text, answer: answers[i] })),
    ...data,
  };
}
export const parameter = (
  key: string,
  name: string,
  symbol: string,
  unit: string,
  min: number,
  max: number,
  step: number,
): ParameterDefinition => ({ key, name, symbol, unit, min, max, step });
export const fmt = (n: number) => Number(n.toPrecision(4)).toString();
export const mechanics = [
  parameter("M", "质量", "M", "kg", 0.1, 50, 0.1),
  parameter("D", "弹性系数", "D", "N/m", 100, 1000000, 100),
];
export const initial = [
  parameter("x0", "初始位移", "x₀", "m", -0.02, 0.02, 0.001),
  parameter("v0", "初始速度", "v₀", "m/s", -1, 1, 0.01),
];
export const damping = parameter("Rm", "力阻", "Rₘ", "kg/s", 1, 10000, 1);
export const force = parameter("F0", "激励力幅值", "F₀", "N", 1, 200, 1);
export const ratio = parameter("ratio", "激励频率比", "ω/ω₀", "—", 0.5, 1.5, 0.01);
export const industry = (text: string) => ({
  text,
  href: "#/cases?project=industry",
  title: "精密车间设备振动治理",
});
