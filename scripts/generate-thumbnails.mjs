import fs from "node:fs";
import { build } from "esbuild";
import { format, resolveConfig } from "prettier";
fs.mkdirSync("outputs", { recursive: true });
const topics = JSON.parse(fs.readFileSync("src/topics.json", "utf8"));
fs.writeFileSync(
  "src/content/homeCatalog.json",
  await format(
    JSON.stringify(
      {
        topics: topics.map(({ id, title, chapter }) => ({ id, title, chapter })),
        completed: fs
          .readdirSync("src/content/lectures")
          .filter((f) => f.endsWith(".ts"))
          .map((f) => f.slice(0, -3)),
      },
      null,
      2,
    ),
    { ...(await resolveConfig("src/content/homeCatalog.json")), parser: "json" },
  ),
);
const files = fs
  .readdirSync("src/content/lectures")
  .filter((f) => !["1.2.4.ts", "1.2.5.ts"].includes(f));
const imports = files
  .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
  .join("");
await build({
  stdin: {
    contents:
      imports +
      "export {createElement} from 'react';export {renderToStaticMarkup} from 'react-dom/server';export {ThumbnailAxes as Axes} from './src/plot/Figure';export {frequencyPanels,powerPanel} from './src/plot/chapter1Figures';export {instrument} from './src/physics/chapter1';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  outfile: "outputs/thumbnail-generator.mjs",
});
const {
  createElement: h,
  renderToStaticMarkup,
  Axes,
  frequencyPanels,
  powerPanel,
  instrument,
} = await import("../outputs/thumbnail-generator.mjs");
fs.mkdirSync("public/thumbnails", { recursive: true });
const panels = {};
const lectures = await import("../outputs/thumbnail-generator.mjs");
for (const [key, l] of Object.entries(lectures))
  if (/^l\d+$/.test(key)) panels[l.id] = l.figures[0].plot(l.defaults, 0)[0];
panels["1.2.4"] = frequencyPanels({ ...instrument, Rm: 400 }, false)[0];
panels["1.2.5"] = powerPanel({ ...instrument, Rm: 400 });
for (const [name, original] of Object.entries(panels)) {
  const p = {
    ...original,
    title: "",
    xlabel: "",
    ylabel: "",
    legend: false,
    annotations: [],
    bands: [],
    series: original.series?.map((s) => ({
      ...s,
      points: s.points.filter(
        (_, i) =>
          i === s.points.length - 1 || i % Math.max(1, Math.floor(s.points.length / 60)) === 0,
      ),
    })),
  };
  if (p.field) {
    const f = p.field;
    p.field = {
      ...f,
      x: f.x.filter((_, i) => i % 4 === 0),
      y: f.y.filter((_, i) => i % 4 === 0),
      z: f.z.filter((_, j) => j % 4 === 0).map((r) => r.filter((_, i) => i % 4 === 0)),
    };
  }
  fs.writeFileSync(
    `public/thumbnails/${name}.svg`,
    renderToStaticMarkup(
      h(
        "svg",
        { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 50" },
        h(Axes, { panel: p }),
      ),
    ),
  );
}
console.log(
  `Generated ${Object.keys(panels).length} representative thumbnails through shared Axes.`,
);
