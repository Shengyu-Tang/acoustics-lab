import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const roles = {
  prerequisite: "前置知识",
  intuition: "物理直觉",
  distinction: "概念辨析",
  concept: "概念理解",
  formula: "公式与物理意义",
  calculation: "定量计算",
  reasoning: "推导或推理",
  depth: "深度判断",
};
const cell = (s) => String(s).replaceAll("|", "\\|").replaceAll("\n", " ");
const answerText = (q) =>
  q.type === "numeric"
    ? `${q.answer.value} ${q.answer.unit}（相对容差 ±2%）`
    : q.type === "judge"
      ? q.answer
        ? "正确"
        : "错误"
      : Array.isArray(q.answer)
        ? q.answer.join("、")
        : q.answer;

export function loadBanks() {
  const dir = path.join(root, "src/content/quiz");
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const banks = manifest.chapters.flatMap((c) =>
    c.lectures.map((id) => JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), "utf8"))),
  );
  return { manifest, banks };
}

export function renderReview(manifest, banks) {
  const lines = [
    "# 声学基础题库审阅稿",
    "",
    "当前仅完成第1章的内容草案，覆盖10讲、课前30题和课后50题，尚待教师审定。每讲课前依次检查前置知识、物理直觉和概念辨析；课后依次为概念、公式、计算、推理、深度判断。题库未接入网站界面。",
    "",
    "## 结构与复核方法",
    "",
    "共享结构见 [quiz-bank.schema.json](quiz-bank.schema.json)。每讲一个 JSON，concept 为本讲要点原文数组，一道题可覆盖多个要点；coverage 仅统计课后题。manifest.json 只登记已完成的整章草案；后续章节完成时增列整章，不把未起草章节误报为缺题。",
    "",
    "数值答案记录计算式、带单位的输入、结果及相对容差0.02。校验器只使用自身的公式与单位换算，既不执行题库表达式，也不调用网站 physics 代码；答案舍入误差按更严格的0.001%校验，学生作答仍按±2%判分。",
    "",
    "来源中的页码一律指原始单讲 PDF 从1起的物理页序，不是教学设计中的合并授课课件页码。PDF 依原文件名在只读目录 ../04-声学基础课件资料/ 下定位；教学设计位于只读目录 ../02-教学安排/20261018督导版教学设计/。每讲均已阅读原始 PDF、对应教学设计及思考题；每题注明课件页和教学设计目标条目。教学设计是目标对齐依据，题目为重新起草。",
    "",
    "记号以网站为准：时间因子 $e^{j\\omega t}$，质量 $M$、弹性系数 $D$、力阻 $R_m$、衰减率 $\\delta$、品质因数 $Q_m$、阻尼固有角频率 $\\omega_0^\\prime$。选择题的解析按 A—D 分别解释正确依据或错误来源；判断题、数值题给出2—5句解析。",
    "",
    "已人工对照本章网站例题和第2—4次课教学设计，改变提问目标、数据使用方式或推理任务，避免照抄原题。第7—24次课课堂题的已知禁复用例子不属于本章题目；后续章节仍须逐题对照课堂题库。脚本可发现规范化重复题干及仅改数字的相同句式，不能代替教师对语义重复、难度和教学效果的审定。",
    "",
    "运行 `node scripts/quiz-bank-review.mjs --write` 可从题库重建本稿；`npm test` 比较全文，防止 JSON 改动后答案、解析和覆盖表失配。手工审阅意见写入各讲 reviewNotes 后再生成。",
    "",
    "## 完成范围",
    "",
    "| 章 | 状态 | 讲次 | 题数 |",
    "| --- | --- | --- | --- |",
  ];
  for (const c of manifest.chapters) {
    const selected = banks.filter((b) => b.chapter === c.chapter);
    lines.push(
      `| ${c.chapter} | 待教师审定的草案 | ${c.lectures.join("、")} | ${selected.reduce((n, b) => n + b.questions.length, 0)} |`,
    );
  }
  lines.push("", "## 深度题清单", "", "| 讲次 | 题号 | 判断依据 |", "| --- | --- | --- |");
  for (const b of banks)
    for (const q of b.questions.filter((q) => q.role === "depth")) {
      const reason =
        q.type === "single"
          ? q.explanation.find((s) => s.startsWith(`${q.answer}：`))
          : q.explanation[0];
      lines.push(`| ${b.lecture} | ${q.id} | ${cell(reason)} |`);
    }
  for (const b of banks) {
    lines.push("", `## ${b.lecture} ${b.title}`, "", "### 来源与审阅要点", "");
    for (const s of b.sources)
      lines.push(
        s.kind === "pdf"
          ? `- slides：${s.file}，共${s.pageCount}页。`
          : `- ${s.id}：${s.file}，第${s.classNumber}次课。`,
      );
    for (const note of b.reviewNotes) lines.push(`- ${note}`);
    lines.push("", "### 课后要点覆盖表", "", "| 本讲要点原文 | 覆盖题号 |", "| --- | --- |");
    for (const p of b.keyPoints)
      lines.push(
        `| ${cell(p)} | ${b.questions
          .filter((q) => q.kind === "post" && q.concept.includes(p))
          .map((q) => q.id)
          .join("、")} |`,
      );
    lines.push(
      "",
      "### 题目索引",
      "",
      "| 题号 | 阶段与任务 | 类型 | 答案 | 对应要点序号 |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const q of b.questions)
      lines.push(
        `| ${q.id} | ${q.kind === "pre" ? "课前" : "课后"} · ${roles[q.role]} | ${q.type} | ${cell(answerText(q))} | ${q.concept.map((p) => b.keyPoints.indexOf(p) + 1).join("、")} |`,
      );
    lines.push("", "### 逐题题干、答案与解析", "");
    for (const q of b.questions) {
      lines.push(`#### ${q.id} ${roles[q.role]}（${q.level}）`, "", q.stem, "");
      for (const o of q.options ?? []) lines.push(`- ${o.id}．${o.text}`);
      if (q.options) lines.push("");
      lines.push(`答案：${answerText(q)}`, "");
      if (q.type === "numeric") {
        lines.push(
          `计算式：${q.answer.calculation.formula}`,
          "",
          `复算输入：${Object.entries(q.answer.calculation.inputs)
            .map(([k, v]) => `${k} = ${v.value} ${v.unit}`)
            .join("；")}。`,
          "",
        );
      }
      for (const sentence of q.explanation) lines.push(sentence, "");
      lines.push(
        `来源：${q.source.map((s) => (s.pages ? `${s.document} 第${s.pages.join("、")}页` : `${s.document} ${s.section}`)).join("；")}。`,
        "",
      );
    }
  }
  lines.push(
    "## 后续章节接续结构",
    "",
    "后续每章完成时，在范围表与深度题清单增列记录，并按相同的“来源与审阅要点—课后覆盖表—题目索引—逐题题干、答案与解析”结构追加各讲。未完成章节不生成空题目或占位答案。",
    "",
  );
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(" ") !== "--write")
    throw new Error("Usage: node scripts/quiz-bank-review.mjs --write");
  const { manifest, banks } = loadBanks();
  fs.writeFileSync(
    path.join(root, "specs/redesign/quiz-bank-review.md"),
    renderReview(manifest, banks),
  );
  console.log(`Wrote quiz-bank-review.md: ${banks.length} lectures.`);
}
