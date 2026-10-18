import fs from "node:fs";
const chapter = process.argv[2];
for (const f of fs
  .readdirSync("src/content/lectures")
  .filter((f) => f.startsWith(chapter + ".") && f.endsWith(".ts"))) {
  if (["1.2.4.ts", "1.2.5.ts"].includes(f)) continue; // authored multi-step sample worksheets
  const file = "src/content/lectures/" + f;
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("completeExamples")) continue;
  s = 'import { completeExamples } from "../calculationSteps";\n' + s;
  s = s.replace(/export default (lecture|p2Lecture|makeLecture)\(/, "const completedLecture = $1(");
  s += "\nexport default completeExamples(completedLecture);\n";
  fs.writeFileSync(file, s);
}
