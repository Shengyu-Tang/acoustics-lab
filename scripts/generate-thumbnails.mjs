import fs from "node:fs";
import { build } from "esbuild";
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      "export {createElement} from 'react';export {renderToStaticMarkup} from 'react-dom/server';export {Axes} from './src/plot/Figure';export {legacyPanels} from './src/plot/legacyPanels';export {frequencyPanels,powerPanel} from './src/plot/chapter1Figures';export {models,defaults} from './src/physics';export {instrument} from './src/physics/chapter1';",
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
  legacyPanels,
  frequencyPanels,
  powerPanel,
  models,
  defaults,
  instrument,
} = await import("../outputs/thumbnail-generator.mjs");
fs.mkdirSync("public/thumbnails", { recursive: true });
const panels = Object.fromEntries(
  Object.entries(models).map(([kind, m]) => [kind, legacyPanels(kind, defaults(m), 0.15)[0]]),
);
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
      points: s.points.filter((_, i) => i % Math.max(1, Math.floor(s.points.length / 90)) === 0),
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
        { xmlns: "http://www.w3.org/2000/svg", viewBox: "55 26 300 225" },
        h(Axes, { panel: p }),
      ),
    ),
  );
}
console.log(
  `Generated ${Object.keys(panels).length} representative thumbnails through shared Axes.`,
);
