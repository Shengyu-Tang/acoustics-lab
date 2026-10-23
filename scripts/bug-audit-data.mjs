import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build, stop } from "esbuild";

export async function auditData() {
  const out = path.resolve("outputs/bug-audit-1");
  fs.mkdirSync(out, { recursive: true });
  const files = fs.readdirSync("src/content/lectures").filter((f) => f.endsWith(".ts"));
  const bundle = path.join(out, `data-${process.pid}.mjs`);
  await build({
    stdin: {
      contents:
        files
          .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
          .join("\n") +
        "\nexport {engineeringCases} from './src/content/cases';" +
        "\nexport {example as instrumentExample} from './src/content/examples/instrument';" +
        "\nexport {bandwidthExample} from './src/content/examples/bandwidth';" +
        "\nexport {grade,instrument} from './src/physics/chapter1';" +
        "\nexport {matlab} from './src/plot/export';" +
        "\nexport {axisTicks} from './src/plot/ticks';" +
        "\nexport {geometryY} from './src/plot/fixedAxes';" +
        "\nexport {instrumentPanel} from './src/plot/chapter1Figures';" +
        "\nexport {bandwidthPanel} from './src/plot/bandwidthPanel';" +
        "\nexport {legacyPanels} from './src/plot/legacyPanels';" +
        "\nexport {models as legacyModels,defaults as legacyDefaults} from './src/physics';" +
        "\nexport {default as topics} from './src/topics.json';" +
        "\nexport {default as ExampleWorksheet} from './src/ExampleWorksheet';" +
        "\nexport {default as Figure} from './src/plot/Figure';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    external: ["react", "react-dom"],
    loader: { ".css": "empty" },
    outfile: bundle,
  });
  stop();
  const data = await import(pathToFileURL(bundle).href + `?t=${Date.now()}`);
  return { ...data, lectures: files.map((_, i) => data[`l${i}`]) };
}
