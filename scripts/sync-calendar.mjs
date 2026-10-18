// The two authoritative files are opened read-only; output stays in this clone.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { format } from "prettier";
const source = path.resolve("../02-教学安排");
const md = fs.readFileSync(path.join(source, "剩余学期逐次课进度规划_20261018.md"), "utf8");
const docx = path.join(source, "课程教学日历（理论课程）-2026秋-稳定版_20261018.docx");
const result = spawnSync(
  "python",
  [
    "-X",
    "utf8",
    "-c",
    `import sys,zipfile,json,xml.etree.ElementTree as E
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(sys.argv[1]) as z: root=E.fromstring(z.read('word/document.xml'))
def text(p): return ''.join((n.text or '') if n.tag.endswith('}t') else '\\n' if n.tag.endswith('}br') else '' for n in p.iter())
rows=[['\\n'.join(text(p) for p in c.findall('w:p',ns)) for c in r.findall('w:tc',ns)] for r in root.findall('.//w:tr',ns)]
print(json.dumps(rows,ensure_ascii=False))`,
    docx,
  ],
  { encoding: "utf8", windowsHide: true },
);
if (result.status !== 0) throw new Error(result.stderr);
const rows = JSON.parse(result.stdout).slice(1);
const plan = new Map(
  md
    .split(/\r?\n/)
    .filter((s) => /^\| \d+ \|/.test(s))
    .map((s) => {
      const c = s
        .split("|")
        .slice(1, -1)
        .map((v) => v.trim());
      return [Number(c[0]), c];
    }),
);
const lessons = rows.map((r, index) => {
  const number = index + 1,
    p = plan.get(number);
  const date = (p?.[2] ?? r[1]).match(/(\d+)\.(\d+)/);
  const month = Number(date[1]),
    day = Number(date[2]);
  const body = r[3].replace(/^第\d+次\s*/, "");
  const split = body.search(/\d+\.\d+/);
  const title = (p?.[3] ?? (split < 0 ? body.split("\n")[0] : body.slice(0, split))).trim();
  const moocText = split < 0 ? "" : body.slice(split).replaceAll("\n", "");
  const sections = [
    ...moocText.matchAll(/(\d+\.\d+(?:\.\d+)?)(?:—(\d+\.\d+(?:\.\d+)?))?\s+([^；]+)/g),
  ].flatMap((m) => {
    const ids = [m[1]];
    if (m[2]) {
      const first = m[1].split("."),
        last = m[2].split(".");
      if (first.slice(0, -1).join(".") !== last.slice(0, -1).join("."))
        throw new Error("Unsupported range");
      for (let n = Number(first.at(-1)) + 1; n <= Number(last.at(-1)); n++)
        ids.push([...first.slice(0, -1), n].join("."));
    }
    return ids.map((id) => ({ id, title: m[3] }));
  });
  if (p && Number(p[1]) !== Number(r[0])) throw new Error(`Week mismatch: ${number}`);
  if (p && date[0] !== r[1].match(/\d+\.\d+/)[0]) throw new Error(`Date mismatch: ${number}`);
  if (p && p[4] !== "—" && p[4].split("、").join(",") !== sections.map((s) => s.id).join(","))
    throw new Error(`MOOC mismatch: ${number}`);
  return {
    number,
    week: Number(r[0]),
    date: `${month === 1 ? 2027 : 2026}.${month}.${day}`,
    hours: Number(r[2]),
    title,
    sections,
    discussion: p?.[6] ?? r[5],
    homework: r[6],
    extension: p?.[7] ?? "",
    preview: "",
    goals: [],
    experiments: sections.map((s) => s.id),
  };
});
if (lessons.length !== 24) throw new Error("Expected 24 lessons");
fs.writeFileSync(
  "src/calendar.json",
  await format(JSON.stringify(lessons), { parser: "json", printWidth: 100 }),
);
console.log("Synced 24 lessons from read-only DOCX + Markdown.");
