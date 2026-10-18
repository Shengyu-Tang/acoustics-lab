import fs from "node:fs";
import { build, stop } from "esbuild";
const id = process.argv[2];
await build({
  entryPoints: ["src/content/cases/" + id + ".ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/P5/register.mjs",
});
stop();
const { default: e } = await import("../outputs/P5/register.mjs?" + Date.now());
const projects = JSON.parse(fs.readFileSync("src/projects.json", "utf8"));
Object.assign(
  projects.find((p) => p.id === id),
  {
    title: e.title,
    background: e.background,
    mapping: e.assumptions,
    challenge: e.criterion,
    lectures: e.lectures,
  },
);
fs.writeFileSync("src/projects.json", JSON.stringify(projects, null, 2) + "\n");
let index = fs.readFileSync("src/content/cases/index.ts", "utf8");
if (!index.includes(`import ${id} `)) {
  index = `import ${id} from "./${id}";\n` + index;
  index = index.replace(/engineeringCases = \[/, `engineeringCases = [${id}, `);
}
fs.writeFileSync("src/content/cases/index.ts", index);
