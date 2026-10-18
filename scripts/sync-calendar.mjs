// Read-only sources; all generated output stays in this clone.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { format } from "prettier";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.resolve(root, "../02-教学安排");
const docx = path.join(source, "课程教学日历（理论课程）-2026秋-稳定版_20261018.docx");
const result = spawnSync(
  "python",
  ["-B", "-X", "utf8", path.join(root, "scripts/read-calendar-docx.py"), docx],
  { encoding: "utf8", windowsHide: true },
);
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr);
const { rows, paragraphs } = JSON.parse(result.stdout);
const topics = new Map(
  JSON.parse(fs.readFileSync(path.join(root, "src/topics.json"), "utf8")).map((t) => [t.id, t]),
);

// Markdown is only a date cross-check, never a source of displayed text.
const md = fs.readFileSync(path.join(source, "剩余学期逐次课进度规划_20261018.md"), "utf8");
const planDates = new Map(
  md
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim());
      return [Number(cells[1]), readDate(cells[3])];
    }),
);
function readDate(text) {
  const match = text.match(/^(\d{1,2})\.(\d{1,2})(?:\s|$)/);
  if (!match) throw new Error(`Invalid calendar date: ${text}`);
  const month = Number(match[1]),
    day = Number(match[2]);
  const year = month === 1 ? 2027 : 2026;
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day)
    throw new Error(`Invalid calendar date: ${text}`);
  return `${year}.${month}.${day}`;
}
function parseContent(content) {
  const sections = [],
    activities = [];
  // Preserve complete prose for the introduction, presentations and revision.
  if (!/^\d+\.\d+/.test(content)) return { sections, activities: [content] };
  for (const entry of content
    .split("；")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const match = entry.match(/^(\d+\.\d+(?:\.\d+)?)(?:—(\d+\.\d+(?:\.\d+)?))?\s+(.+)$/);
    if (!match) {
      if (/^\d+\./.test(entry)) throw new Error(`Malformed MOOC entry: ${entry}`);
      activities.push(entry);
      continue;
    }
    const [, first, last, title] = match;
    const ids = [first];
    if (last) {
      const start = first.split("."),
        end = last.split(".");
      if (
        start.slice(0, -1).join(".") !== end.slice(0, -1).join(".") ||
        Number(end.at(-1)) < Number(start.at(-1))
      )
        throw new Error(`Unsupported MOOC range: ${entry}`);
      for (let n = Number(start.at(-1)) + 1; n <= Number(end.at(-1)); n++)
        ids.push([...start.slice(0, -1), n].join("."));
    }
    for (const id of ids) {
      const topic = topics.get(id);
      if (!topic) throw new Error(`Missing lecture for MOOC section ${id}`);
      // The review requests these two distinct website lecture titles.
      sections.push({ id, title: ["1.1.1", "1.1.2"].includes(id) ? topic.title : title });
    }
  }
  return { sections, activities };
}

if (rows[0]?.[3] !== "教学内容") throw new Error("Unexpected DOCX calendar table");
const lessons = rows.slice(1).map((r, index) => {
  const number = index + 1;
  if (r.length !== 7) throw new Error(`Unexpected columns: lesson ${number}`);
  const heading = r[3].match(/^第(\d+)次\s+([^\n]+)\n([\s\S]+)$/);
  if (!heading || Number(heading[1]) !== number)
    throw new Error(`Unexpected lesson heading: ${r[3]}`);
  const date = readDate(r[1]);
  if (planDates.has(number) && date !== planDates.get(number))
    throw new Error(`Date mismatch: lesson ${number}`);
  const { sections, activities } = parseContent(heading[3].trim());
  return {
    number,
    week: Number(r[0]),
    date,
    hours: Number(r[2]),
    title: heading[2].trim(),
    sections,
    activities,
    discussion: r[5],
    homework: r[6],
    preview: "",
    goals: [],
    experiments: sections.map((s) => s.id),
  };
});
if (lessons.length !== 24) throw new Error("Expected 24 lessons");
for (const number of planDates.keys())
  if (!lessons.some((l) => l.number === number))
    throw new Error(`Unknown planned lesson ${number}`);

// End the requested excerpt before the DOCX's progress-policy details.
const explanation = paragraphs.find((p) => p.startsWith("第1—4次"));
const sentences = explanation?.split("。");
if (!sentences || sentences.length < 2) throw new Error("Missing DOCX calendar explanation");
const note = `${sentences[0]}。${sentences[1].split("，")[0]}。`;
for (const [file, data] of [
  ["calendar.json", lessons],
  ["calendar-info.json", { note }],
]) {
  fs.writeFileSync(
    path.join(root, "src", file),
    await format(JSON.stringify(data), { parser: "json", printWidth: 100 }),
  );
}
console.log(
  "Synced 24 lessons and explanation from read-only stable DOCX; Markdown dates checked.",
);
