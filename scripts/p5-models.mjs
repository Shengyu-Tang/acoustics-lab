import fs from "node:fs";
import { build, stop } from "esbuild";
export async function models() {
  fs.mkdirSync("outputs/P5", { recursive: true });
  const files = fs.readdirSync("src/content/lectures").filter((f) => /^[1-7]\./.test(f));
  await build({
    stdin: {
      contents:
        files
          .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
          .join("\n") +
        "export {example as instrument} from './src/content/examples/instrument';export {bandwidthExample as bandwidth} from './src/content/examples/bandwidth';export {matlab} from './src/plot/export';" +
        (fs.existsSync("src/content/cases/index.ts")
          ? "export {engineeringCases} from './src/content/cases/index';"
          : ""),
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: "outputs/P5/models.mjs",
  });
  stop();
  const all = await import("../outputs/P5/models.mjs?" + Date.now());
  return { ...all, lectures: files.map((_, i) => all[`l${i}`]) };
}
