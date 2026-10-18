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
const { rows } = JSON.parse(result.stdout);
const goalResult = spawnSync(
  "python",
  ["-B", "-X", "utf8", path.join(root, "scripts/read-teaching-goals.py"), source],
  { encoding: "utf8", windowsHide: true },
);
if (goalResult.error) throw goalResult.error;
if (goalResult.status !== 0) throw new Error(goalResult.stderr);
const teachingGoals = JSON.parse(goalResult.stdout);
// Used only if neither read-only teaching-design collection contains the session.
const fallbackGoals = {
  1: [
    "知识｜说明声的产生、传播与接收过程及典型应用。",
    "能力｜将水下信息传输需求转化为声学问题。",
    "素养｜注明资料来源，依据模型条件讨论工程结论。",
  ],
  2: [
    "知识｜区分无阻尼、欠阻尼、临界阻尼与过阻尼响应。",
    "能力｜由受力关系和初始条件求解单自由度自由振动。",
    "素养｜用量纲和能量交换检验振动模型。",
  ],
  3: [
    "知识｜说明阻尼量、品质因数和机械阻抗的定义及关系。",
    "能力｜区分强迫响应的过渡过程与稳态并估算过渡时间。",
    "素养｜结合脉冲需求说明高品质因数的适用条件。",
  ],
  4: [
    "知识｜区分位移共振、速度共振及半功率带宽。",
    "能力｜计算频率响应、平均输入功率与品质因数。",
    "素养｜结合起振时间与带宽约束评价换能器参数。",
  ],
};
// The earlier collection has three uncategorized objectives per session.
// Add display categories without changing any of their original wording.
const earlyCategories = {
  1: ["知识", "能力", "素养"],
  2: ["能力", "能力", "知识"],
  3: ["知识", "知识", "能力"],
  4: ["知识", "能力", "能力"],
};
const newlyWritten = [];
function goalsFor(number) {
  const design = teachingGoals[number];
  if (!design) {
    if (!fallbackGoals[number]) throw new Error(`Missing teaching design: lesson ${number}`);
    newlyWritten.push(number);
    return fallbackGoals[number];
  }
  const goals = design.goals.map((goal, index) => {
    const labeled = goal.match(/^(知识|能力|素养)\s*[12一二]?\s*[｜:：]?\s*(.+)$/);
    if (labeled) return `${labeled[1]}｜${labeled[2]}`;
    const category = earlyCategories[number]?.[index];
    if (!category) throw new Error(`Missing objective category: lesson ${number}, ${goal}`);
    return `${category}｜${goal}`;
  });
  if (
    number >= 5 &&
    (goals.length !== 5 || goals.map((g) => g.split("｜")[0]).join() !== "知识,知识,能力,能力,素养")
  )
    throw new Error(`Expected five original objectives: lesson ${number}`);
  if (goals.length < 3) throw new Error(`Too few objectives: lesson ${number}`);
  return goals;
}
const topics = new Map(
  JSON.parse(fs.readFileSync(path.join(root, "src/topics.json"), "utf8")).map((t) => [t.id, t]),
);
function taskText(text) {
  return text
    .replaceAll("慕课", "")
    .replace(/(\d+\.\d+(?:\.\d+)?)(?=思考题)/g, "$1 节")
    .replace(/\d+\.\d+(?:\.\d+)?/g, (id) => {
      if (topics.has(id)) return id;
      // A chapter subsection such as 3.3 has multiple individual lecture pages.
      const children = [...topics.keys()].filter((key) => key.startsWith(`${id}.`));
      if (!children.length) throw new Error(`Missing task lecture: ${id}`);
      return children.join("、");
    });
}

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
    homework: taskText(r[6]),
    preview: "",
    goals: goalsFor(number),
    experiments: sections.map((s) => s.id),
  };
});
if (lessons.length !== 24) throw new Error("Expected 24 lessons");
for (const number of planDates.keys())
  if (!lessons.some((l) => l.number === number))
    throw new Error(`Unknown planned lesson ${number}`);

if (/慕课|达成证据|支撑\s*C/.test(JSON.stringify(lessons)))
  throw new Error("Internal source or assessment wording in calendar data");
fs.writeFileSync(
  path.join(root, "src/calendar.json"),
  await format(JSON.stringify(lessons), { parser: "json", printWidth: 100 }),
);
console.log(
  "Synced 24 lessons and teaching objectives from read-only DOCX; Markdown dates checked.",
);
console.log(`Newly written goals for sessions: ${newlyWritten.join(", ") || "none"}.`);
