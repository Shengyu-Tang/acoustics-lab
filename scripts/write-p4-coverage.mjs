import fs from "node:fs";
import { models } from "./p4-models.mjs";
const { lectures } = await models();
const notes = JSON.parse(fs.readFileSync("specs/redesign/P4-source-notes.json", "utf8"));
const rows = [
  "# P4 原始课件总结页与本讲要点覆盖",
  "",
  "逐讲清单与原始课件对应 17 讲。总纲批次表写作 19 讲，为计数差异；本批覆盖 01 清单的全部条目。",
  "",
  "已查看原 PDF 总结页；第 5 章没有单列总结标题，核对其末页的定解问题、瑞利定律与散射声强。思考题按原 DOCX 逐字提取，共 54 题。源文件只读。",
  "",
  "| 讲次 | PDF 总结页或末页 | 原思考题数 | 本讲要点覆盖 |",
  "|---|---|---:|---|",
];
for (const l of lectures) {
  const n = notes[l.id];
  rows.push(
    "| " +
      l.id +
      " | " +
      n.summary.map((s) => s[0]).join("、") +
      " | " +
      n.questions.length +
      " | " +
      l.keyPoints.join("；") +
      " |",
  );
}
rows.push(
  "",
  "逐页提取、来源文件名与 SHA-256 见 P4-source-notes.json；重核命令：python -X utf8 scripts/check-p4-sources.py --verify。",
);
fs.writeFileSync("specs/redesign/P4-summary-coverage.md", rows.join("\n") + "\n");
console.log("Wrote summary coverage for " + lectures.length + " lectures.");
