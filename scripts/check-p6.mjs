import fs from "node:fs";
import assert from "node:assert/strict";
import { models } from "./p5-models.mjs";
const { lectures, engineeringCases } = await models();
assert.ok(fs.statSync("src/profile-photo.jpg").size < 60000, "portrait below 60 kB");
const catalog = JSON.parse(fs.readFileSync("src/content/homeCatalog.json", "utf8"));
assert.equal(catalog.completed.length, 79);
for (const id of catalog.completed)
  assert.ok(
    fs.statSync(`public/thumbnails/${id}.svg`).size > 100 &&
      fs.statSync(`public/thumbnails/${id}.svg`).size < 12000,
    `${id}: compact real thumbnail`,
  );
const source = (f) => fs.readFileSync("src/" + f, "utf8");
assert.ok(source("Header.tsx").includes('href="#/feedback"'));
assert.ok(!source("Lab.tsx").includes("p1Registry"), "no eager lecture registry in the route");
assert.ok(source("Lab.tsx").includes("import.meta.glob"));
const rod = lectures.find((l) => l.id === "2.3");
const force = rod.figures[0].plot(rod.defaults, 0)[0].series.find((s) => /轴向合力/.test(s.name));
assert.equal(force.points[0][1], 0, "resultant attached to the rod centre");
assert.equal(force.points[1][1], 0);
const volume = lectures.find((l) => l.id === "3.3.2");
const q = volume.figures[0].plot(volume.defaults, 0)[0];
const xs = q.series.filter((s) => s.geometry).flatMap((s) => s.points.map((p) => p[0]));
assert.ok(
  (Math.max(...xs) - Math.min(...xs)) / (q.xlim[1] - q.xlim[0]) >= 0.25,
  "readable physical overview",
);
const reciprocity = lectures.find((l) => l.id === "6.2");
const signal = reciprocity.figures[0].plot(reciprocity.defaults, 0)[1];
assert.ok(signal.blackAxes);
const cycles = reciprocity.defaults.f * (signal.xlim[1] - signal.xlim[0]);
assert.ok(cycles >= 3 && cycles <= 5, "three to five default periods");
const reviewed = [];
for (const e of [
  ...lectures.filter((l) => l.defaults).flatMap((l) => l.examples),
  ...engineeringCases,
]) {
  const q = e.plot(e.defaults);
  assert.ok(!/填\s*0|无解填|不通过填/.test(q.title), q.title);
  if (/选定频率/.test(q.title)) assert.match(q.title, /kHz.*波束与损失同时满足/);
  reviewed.push(q.title);
}
fs.mkdirSync("outputs/P6", { recursive: true });
fs.writeFileSync(
  "outputs/P6/contracts.json",
  JSON.stringify(
    { cycles, portraitBytes: fs.statSync("src/profile-photo.jpg").size, reviewed },
    null,
    2,
  ),
);
console.log(
  "PASS P6: 79 thumbnails, feedback route, lazy lectures, attached resultant, readable volume, four-period reciprocity and conclusion titles.",
);
