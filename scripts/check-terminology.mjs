import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// The water/steel interface problem uses an immersion probe. Historical review
// quotations under specs/ are evidence, not site copy, and remain unchanged.
const canonical = "水浸超声探头的界面透射、分辨率与校准距离";
const projects = JSON.parse(fs.readFileSync("src/projects.json", "utf8"));
assert.equal(projects.find((p) => p.id === "ultrasound").title, canonical);
assert.ok(fs.readFileSync("src/content/cases/ultrasound.ts", "utf8").includes(canonical));
let checked = 0;
for (const root of ["src", "public"]) {
  for (const relative of fs.readdirSync(root, { recursive: true })) {
    const file = path.join(root, relative);
    if (!fs.statSync(file).isFile() || !/\.(?:tsx?|json|html|md|m|txt|csv|svg)$/.test(file))
      continue;
    assert.doesNotMatch(
      fs.readFileSync(file, "utf8"),
      /水源\s*超声/,
      `${file}: immersion terminology`,
    );
    checked++;
  }
}
console.log(`PASS: consistent immersion-probe terminology in ${checked} site source/assets`);
