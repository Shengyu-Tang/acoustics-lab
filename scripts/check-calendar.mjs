import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";

const raw = fs.readFileSync("src/calendar.json", "utf8");
const lessons = JSON.parse(raw);
const topics = new Map(
  JSON.parse(fs.readFileSync("src/topics.json", "utf8")).map((t) => [t.id, t]),
);
const forbidden = /慕课|达成证据|支撑\s*C/;
assert.doesNotMatch(raw, forbidden);
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
  assert.ok(lesson.goals.length >= 3, `Lesson ${lesson.number}: at least three goals`);
  for (const goal of lesson.goals)
    assert.match(goal, /^(知识|能力|素养)｜\S/, `Lesson ${lesson.number}: goal category`);
  if (lesson.number >= 5) {
    assert.equal(lesson.goals.length, 5, `Lesson ${lesson.number}: preserve all five goals`);
    assert.deepEqual(
      lesson.goals.map((g) => g.split("｜")[0]),
      ["知识", "知识", "能力", "能力", "素养"],
    );
  }
  for (const task of [lesson.homework, lesson.preview])
    for (const [id] of task.matchAll(/\d+\.\d+(?:\.\d+)?/g))
      assert.ok(topics.has(id), `Lesson ${lesson.number}: existing task lecture ${id}`);
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
assert.deepEqual(lessons[5].goals, [
  "知识｜解释声传播条件，区分声压、质点振速、密度逾量与声速。",
  "知识｜列出五项建模假设，判断线性化时保留与略去的项。",
  "能力｜从固定体积元质量收支写出一般及线性连续性方程。",
  "能力｜用速度散度计算密度变化率，判断压缩或膨胀。",
  "素养｜用质量守恒、量纲及适用条件检查声学结论。",
]);
assert.ok(lessons[1].homework.includes("思考：1.1.1、1.1.4 节思考题。"));
assert.ok(lessons[1].homework.includes("预习：1.1.5、1.2.1—1.2.3。"));
assert.ok(lessons[6].homework.includes("预习：3.3.1、3.3.2、3.3.3。"));

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
  lessons.flatMap((l) => [
    ...l.sections.map((s) => s.id),
    ...[...l.homework.matchAll(/\d+\.\d+(?:\.\d+)?/g)].map((m) => m[0]),
    ...[...l.preview.matchAll(/\d+\.\d+(?:\.\d+)?/g)].map((m) => m[0]),
  ]),
);
for (const activity of lessons.flatMap((l) => l.activities))
  assert.ok(html.includes(`<li>${activity}</li>`), `Unlinked activity: ${activity}`);
for (const goal of lessons.flatMap((l) => l.goals))
  assert.ok(html.includes(`<li>${goal}</li>`), `Rendered goal: ${goal}`);
assert.doesNotMatch(html, forbidden);
assert.doesNotMatch(html, /calendar-note|从振动规律走向海洋声学应用|第1—4次按实际进度记录/);
assert.doesNotMatch(html, /教学安排备注|可顺延|机动缓冲约|教师记录/);
console.log(
  `PASS: 24 calendar lessons with goals, ${links.length} existing content/task lecture links; no source labels or assessment notes.`,
);
