import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";

const raw = fs.readFileSync("src/calendar.json", "utf8");
const lessons = JSON.parse(raw);
const topics = new Map(
  JSON.parse(fs.readFileSync("src/topics.json", "utf8")).map((t) => [t.id, t]),
);
const { note } = JSON.parse(fs.readFileSync("src/calendar-info.json", "utf8"));
assert.doesNotMatch(raw, /页|可顺延|机动缓冲约|分钟|已授|课件|教师记录/);
assert.equal(lessons.length, 24);
assert.deepEqual(
  lessons.map((l) => l.number),
  Array.from({ length: 24 }, (_, i) => i + 1),
);
assert.equal(
  lessons.reduce((sum, l) => sum + l.hours, 0),
  48,
);
for (const lesson of lessons) {
  assert.ok(!lesson.extension, `Lesson ${lesson.number}: no planning remarks`);
  assert.ok(lesson.title && lesson.discussion && lesson.homework);
  assert.ok(lesson.sections.length || lesson.activities.length, `Lesson ${lesson.number}: content`);
  for (const section of lesson.sections) {
    assert.match(section.id, /^\d+\.\d+(?:\.\d+)?$/);
    assert.ok(topics.has(section.id), `Lesson ${lesson.number}: existing lecture ${section.id}`);
    assert.ok(section.title);
  }
}
for (const [number, text] of [
  [1, "声在国民生产和生活中的应用；怎样学习振动与声基础"],
  [17, "第3章总结与机动"],
  [22, "主动声呐方程综合案例与机动"],
  [23, "全课程；4组课堂汇报，其余组提交录制讲解及互评"],
  [24, "全课程；保留最终复习与答疑2学时"],
])
  assert.deepEqual(lessons[number - 1].activities, [text]);
for (const id of ["1.1.1", "1.1.2"])
  assert.equal(lessons[1].sections.find((s) => s.id === id).title, topics.get(id).title);
assert.notEqual(lessons[1].sections[0].title, lessons[1].sections[1].title);
assert.equal(
  note,
  "第1—4次按实际进度记录；第5次起按中国大学慕课《振动与声基础》课件小节安排，每次2学时，合计24次。第17次、第22次各留机动时间。",
);

// Verify the rendered calendar emits real lecture links and plain activity items.
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      "export {default as Calendar} from './src/Calendar';export {createElement} from 'react';export {renderToStaticMarkup} from 'react-dom/server';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  outfile: "outputs/calendar-check.cjs",
});
const { Calendar, createElement, renderToStaticMarkup } = createRequire(import.meta.url)(
  "../outputs/calendar-check.cjs",
);
const html = renderToStaticMarkup(createElement(Calendar));
assert.equal((html.match(/<article\b/g) ?? []).length, 24);
const links = [...html.matchAll(/href="#\/lab\?topic=([^"]+)"/g)].map((m) => m[1]);
assert.deepEqual(
  links,
  lessons.flatMap((l) => l.sections.map((s) => s.id)),
);
for (const activity of lessons.flatMap((l) => l.activities))
  assert.ok(html.includes(`<li>${activity}</li>`), `Unlinked activity: ${activity}`);
assert.ok(html.includes(`<p class="calendar-note">${note}</p>`));
assert.doesNotMatch(html, /教学安排备注|可顺延|机动缓冲约|教师记录/);
console.log(
  `PASS: 24 calendar lessons, ${links.length} existing lecture links, DOCX activities and note; no planning remarks.`,
);
