import type { Oscillator } from "../physics/chapter1";
import type { Panel } from "../plot/types";
import type { ParameterDefinition } from "../Parameter";
export type Lecture = {
  id: string;
  title: string;
  moocSource: string;
  classNumber: string;
  keyPoints: string[];
  formulas: { number: string; tex: string; meaning: string }[];
  figures: {
    matlabModel?: typeof import("../plot/matlabModels").modelsFor;
    number: string;
    title: string;
    plot: (parameters: Oscillator, compare?: boolean) => Panel[];
    rows: number;
    cols: number;
    parameters: ParameterDefinition[];
    readouts: string[];
  }[];
  examples: string[];
  questions: { text: string; answer: string }[];
  engineering: { text: string; href: string; title: string };
};
