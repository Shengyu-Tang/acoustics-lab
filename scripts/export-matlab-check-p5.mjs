import fs from "node:fs";
import crypto from "node:crypto";
import { models } from "./p5-models.mjs";
import { secondSet } from "./p5-parameter-sets.mjs";
const all = await models();
const folder = "specs/redesign/matlab-check/P5";
fs.mkdirSync(folder, { recursive: true });
const jobs = [];
const entries = [
  { name: "1.2.5-E1", e: all.bandwidth, plot: (p) => [all.bandwidthPanel(p)] },
  ...all.engineeringCases.map((e) => ({
    name: e.id,
    e,
    plot: (p) => [e.plot(p), ...(e.additionalPlots?.(p) ?? [])],
  })),
  ...all.lectures
    .filter((l) => ["3.1.3", "3.1.5", "3.1.8", "3.6.8"].includes(l.id))
    .map((l) => ({ name: l.id + "-E1", e: l.examples[0], plot: (p) => [l.examples[0].plot(p)] })),
];
for (const { name, e, plot } of entries)
  for (const [set, p] of [e.defaults, secondSet(e)].entries()) {
    const panels = plot(p),
      base = "fig_" + name.replaceAll(".", "_").replaceAll("-", "_") + "_set" + set,
      file = folder + "/" + base + ".m";
    const source =
      "set(groot,'defaultFigureVisible','off');\n" + all.matlab(panels, panels.length, 1, e.title);
    fs.writeFileSync(file, source);
    const expectedFile = "outputs/P5/" + base + "-web.json";
    fs.writeFileSync(
      expectedFile,
      JSON.stringify({
        panels: panels.map((q) => ({
          x: q.series.map((s) => s.points.map((p) => p[0])),
          y: q.series.map((s) => s.points.map((p) => p[1])),
        })),
        answers: e.asks.map((a) => (a.calc ? a.calc(p) : e.solve(p)[a.key])),
      }),
    );
    jobs.push({
      name,
      set,
      file,
      expectedFile,
      parameters: p,
      sha256: crypto.createHash("sha256").update(source).digest("hex"),
    });
  }
fs.writeFileSync(
  folder + "/manifest.json",
  JSON.stringify({ runtimeValidated: false, jobs }, null, 2) + "\n",
);
console.log(`Exported ${jobs.length} editable scripts with web curve/answer snapshots.`);
