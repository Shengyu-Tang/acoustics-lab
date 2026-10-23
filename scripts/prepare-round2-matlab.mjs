// The exact plotting/export functions used by the website, at two explicit sets.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { auditData } from "./bug-audit-data.mjs";
import { secondSet } from "./p5-parameter-sets.mjs";
const data = await auditData();
const allFigures = process.argv.includes("--all-figures");
const legacyOnly = process.argv.includes("--legacy-only");
const root = process.env.MATLAB_AUDIT_ROOT ?? "outputs/bug-audit-1/round2-matlab";
if (!path.resolve(root).startsWith(path.resolve(".") + path.sep))
  throw new Error("MATLAB audit output must stay inside the repository");
fs.mkdirSync(`${root}/exports`, { recursive: true });
const exports = [];
function write(name, panels, rows, cols, metadata) {
  const file = `${root}/exports/${name}.m`;
  const code = data.matlab(panels, rows, cols, name);
  fs.writeFileSync(file, code);
  exports.push({
    ...metadata,
    file,
    kind: "m",
    sha256: crypto.createHash("sha256").update(code).digest("hex"),
  });
}
// All nine cases and all lecture worksheets share the changed caption layout.
const sheets = [
  ...data.engineeringCases.map((e) => ({
    e,
    route: `#/cases?project=${e.id}`,
    worksheet: 0,
    plot: e.plot,
  })),
  ...data.lectures
    .filter((l) => l.defaults)
    .flatMap((l) =>
      l.examples.map((e, worksheet) => ({
        e,
        route: `#/lab?topic=${l.id}`,
        worksheet,
        plot: e.plot,
      })),
    ),
  {
    e: data.instrumentExample,
    route: "#/lab?topic=1.2.4",
    worksheet: 0,
    plot: data.instrumentPanel,
  },
  { e: data.bandwidthExample, route: "#/lab?topic=1.2.5", worksheet: 0, plot: data.bandwidthPanel },
];
for (const { e, route, worksheet, plot } of legacyOnly ? [] : sheets) {
  const variant = secondSet(e);
  if (route === "#/lab?topic=1.1.3") variant.zeta = 1.05;
  if (route === "#/lab?topic=3.6.5") variant.Z2 = variant.Z1;
  for (const [set, parameters] of [e.defaults, variant].entries()) {
    const panels = [plot(parameters), ...(e.additionalPlots?.(parameters) ?? [])];
    // Worksheet figure exports and computation exports use the same model;
    // preserve the MATLAB interior annotation policy used by the download.
    write(
      `${route.replace(/\W/g, "_")}-worksheet-${worksheet}-set${set + 1}`,
      panels,
      panels.length,
      1,
      {
        route,
        worksheet,
        set: set + 1,
        parameters,
        category: set ? "calculation" : "calculation-default",
      },
    );
  }
}
const reviewed = new Set([
  "1.1.2-2",
  "3.1.3-1",
  "3.1.3-2",
  "3.2.1-2",
  "3.4.4-1",
  "3.4.6-1",
  "3.5.2-2",
  "3.6.11-2",
  "3.9.1-1",
  "4.3-2",
  "4.3-3",
  "4.4.3-2",
  "5.2-1",
  "6.2-2",
  "7.3-1",
  "3.6.10-2",
]);
if (legacyOnly) reviewed.clear();
for (const l of data.lectures) {
  for (const [figure, f] of l.figures.entries()) {
    if (!allFigures && !reviewed.has(f.number)) continue;
    const defaults = l.defaults ?? { ...data.instrument, Rm: 400 };
    const variant = secondSet({ defaults, given: l.parameters ?? f.parameters });
    if (l.id === "3.6.10") Object.assign(variant, { c: 6000, c2: 1500 });
    for (const [set, parameters] of [defaults, variant].entries())
      write(`${f.number}-set${set + 1}`, f.plot(parameters, 0), f.rows, f.cols, {
        route: `#/lab?topic=${l.id}`,
        figure,
        number: f.number,
        set: set + 1,
        parameters,
        category: "figure",
      });
    reviewed.delete(f.number);
  }
}
if (reviewed.size) throw new Error(`Missing figures: ${[...reviewed]}`);
if (allFigures || legacyOnly) {
  for (const topic of data.topics.filter((t) => ["3.S1", "3.S2", "8.1"].includes(t.id))) {
    const model = data.legacyModels[topic.model];
    const defaults = data.legacyDefaults(model);
    const variant = secondSet({ defaults, given: model.params });
    for (const [set, parameters] of [defaults, variant].entries()) {
      const panels = data.legacyPanels(topic.model, parameters, 0);
      write(`${topic.id}-legacy-set${set + 1}`, panels, panels.length, 1, {
        route: `#/lab?topic=${topic.id}`,
        figure: 0,
        number: topic.id,
        set: set + 1,
        parameters,
        category: "figure",
      });
    }
  }
}
fs.writeFileSync(
  `${root}/browser.json`,
  JSON.stringify({ source: "website export functions", exports }, null, 2),
);
console.log(
  `Prepared ${exports.length} scripts: ${legacyOnly ? 0 : sheets.length} worksheets and ${exports.length / 2 - (legacyOnly ? 0 : sheets.length)} figures, two sets each, under ${path.resolve(root)}`,
);
