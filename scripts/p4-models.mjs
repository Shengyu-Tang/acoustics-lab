import fs from "node:fs";
import { build, stop } from "esbuild";
export async function models() {
  const files = fs.readdirSync("src/content/lectures").filter((f) => /^[4-7]\./.test(f));
  fs.mkdirSync("outputs/P4", { recursive: true });
  await build({
    stdin: {
      contents:
        files
          .map((f, i) => "export {default as l" + i + "} from './src/content/lectures/" + f + "';")
          .join("\n") +
        "export * from './src/physics/chapter4';export {matlab} from './src/plot/export';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: "outputs/P4/models.mjs",
  });
  stop();
  const all = await import("../outputs/P4/models.mjs?" + Date.now());
  return { ...all, lectures: files.map((_, i) => all["l" + i]) };
}
