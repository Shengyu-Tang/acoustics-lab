import fs from "node:fs";
import crypto from "node:crypto";
import { models } from "./p5-models.mjs";
import { secondSet } from "./p5-parameter-sets.mjs";
const all = await models();
const folder = "specs/redesign/matlab-check/P6";
fs.mkdirSync(folder, { recursive: true });
fs.mkdirSync("outputs/P6", { recursive: true });
const changed = new Set([
  "1.1.1-E1",
  "1.1.4-E1",
  "2.3-E1",
  "3.10.1-E1",
  "3.10.3-E1",
  "3.10.4-E1",
  "ocean",
  "building",
  "transport",
]);
const entries = [
  ...all.lectures
    .filter((l) => l.defaults)
    .flatMap((l) =>
      l.examples.map((e, i) => ({
        name: l.id + "-E" + (i + 1),
        e,
        plot: (p) => [e.plot(p)],
        rows: 1,
        cols: 1,
      })),
    ),
  ...all.engineeringCases.map((e) => ({
    name: e.id,
    e,
    plot: (p) => [e.plot(p), ...(e.additionalPlots?.(p) ?? [])],
    cols: 1,
  })),
].filter(({ name }) => changed.has(name));
for (const id of ["2.3-1", "3.3.2-1", "3.3.2-2", "6.2-1"]) {
  const l = all.lectures.find((l) => id.startsWith(l.id + "-"));
  const f = l.figures.find((f) => f.number === id);
  entries.push({
    name: id,
    e: { defaults: l.defaults, given: l.parameters },
    plot: (p) => f.plot(p, 0),
    rows: f.rows,
    cols: f.cols,
    readouts: (p) => l.readouts(p).map((r) => r[1]),
  });
}
const jobs = [];
for (const { name, e, plot, rows, cols, readouts } of entries)
  for (const [set, p] of [e.defaults, secondSet(e)].entries()) {
    const panels = plot(p),
      base = "fig_" + name.replaceAll(".", "_").replaceAll("-", "_") + "_set" + set;
    const file = folder + "/" + base + ".m";
    const source =
      "set(groot,'defaultFigureVisible','off');\n" +
      all.matlab(panels, rows ?? panels.length, cols ?? 1, name);
    fs.writeFileSync(file, source);
    const expectedFile = "outputs/P6/" + base + "-web.json";
    fs.writeFileSync(
      expectedFile,
      JSON.stringify({
        panels: panels.map((q) => ({
          x: q.series?.map((s) => s.points.map((p) => p[0])) ?? [],
          y: q.series?.map((s) => s.points.map((p) => p[1])) ?? [],
          field: q.field ? { x: q.field.x, y: q.field.y, z: q.field.z } : null,
        })),
        readouts: readouts?.(p),
        answers: e.asks?.map((a) => (a.calc ? a.calc(p) : e.solve(p)[a.key])),
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
console.log(`Exported ${entries.length} changed figures, ${jobs.length} scripts (two sets).`);
