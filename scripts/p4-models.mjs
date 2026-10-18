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
        "export * from './src/physics/chapter4';export {matlab} from './src/plot/export';export {fmt} from './src/content/p1';export {scriptParts} from './src/ScriptText';" +
        [
          "1.1.3",
          "1.1.5",
          "1.2.2",
          "2.1",
          "2.2",
          "3.1.1",
          "3.3.3",
          "3.4.2",
          "3.4.3",
          "3.6.10",
          "3.6.11",
          "3.6.12",
          "3.7.1",
        ]
          .map(
            (id, i) =>
              "export {default as review" + i + "} from './src/content/lectures/" + id + "';",
          )
          .join(""),
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: "outputs/P4/models.mjs",
  });
  stop();
  const all = await import("../outputs/P4/models.mjs?" + Date.now());
  return {
    ...all,
    lectures: files.map((_, i) => all["l" + i]),
    reviewLectures: Array.from({ length: 13 }, (_, i) => all["review" + i]),
  };
}
