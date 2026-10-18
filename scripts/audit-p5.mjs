import fs from "node:fs";
import { models } from "./p5-models.mjs";
const all = await models();
const audit = all.lectures.map((l) => ({
  lecture: l.id,
  case: l.engineering.href,
  examples: (l.defaults ? l.examples : [l.id === "1.2.4" ? all.instrument : all.bandwidth]).map(
    (e) => ({
      title: e.title,
      editableGivens: e.given.length,
      gradedQuestions: e.asks.length,
      hints: e.hints.length,
      answers: Object.fromEntries(
        e.asks.map((a) => [a.key, a.calc ? a.calc(e.defaults) : e.solve(e.defaults)[a.key]]),
      ),
      substitutions: l.defaults ? e.asks.map((a) => a.sub(e.defaults)) : undefined,
      stepsSource: l.defaults
        ? undefined
        : l.id === "1.2.4"
          ? "src/InstrumentExample.tsx"
          : "src/BandwidthExample.tsx",
      figure: (
        e.plot?.(e.defaults) ??
        (l.id === "1.2.4" ? all.instrumentPanel(e.defaults) : all.bandwidthPanel(e.defaults))
      ).title,
      matlabModel: Boolean(
        (
          e.plot?.(e.defaults) ??
          (l.id === "1.2.4" ? all.instrumentPanel(e.defaults) : all.bandwidthPanel(e.defaults))
        ).matlabModel,
      ),
    }),
  ),
}));
fs.writeFileSync("outputs/P5/lecture-audit.json", JSON.stringify(audit, null, 2));
fs.writeFileSync("specs/redesign/P5-lecture-audit.json", JSON.stringify(audit, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      lectures: audit.length,
      examples: audit.reduce((n, l) => n + l.examples.length, 0),
      missing: audit.filter((l) => !l.examples.length),
      cases: [...new Set(audit.map((l) => l.case))],
      sample: audit.filter((l) => ["3.6.5", "7.3"].includes(l.lecture)),
    },
    null,
    2,
  ),
);
