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
// "1" is the internal dimensional-analysis marker, never a displayed unit.
export const quantityText = (value, unit, precision) =>
  `${precision ? value.toPrecision(precision) : value}${unit === "1" ? "" : ` ${unit}`}`;
const answerText = (q) =>
  q.type === "numeric"
    ? `${quantityText(q.answer.value, q.answer.unit, 4)}（相对容差 ±2%，判分保留完整值）`
    : q.type === "short"
      ? "简答，按评分要点自查"
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
  const optionalCount = banks.flatMap((b) => b.questions).filter((q) => q.optional).length;
  const lines = [
    "# 声学基础题库审阅稿",
    "",
    `当前草案范围：${manifest.chapters.map((c) => `第${c.chapter}章全部正式讲次`).join("；")}。覆盖${banks.length}讲、课前${banks.length * 3}题、课后必答${banks.length * 5}题及可选${optionalCount}题，尚待教师审定。每讲课前依次检查前置知识、物理直觉和概念辨析；课后post-01至post-05依次为概念、公式、计算、推理、深度简答，post-06为可选深度选择题。题库未接入网站界面。`,
    "",
    "## 结构与复核方法",
    "",
    "共享结构见 [quiz-bank.schema.json](quiz-bank.schema.json)。每讲一个 JSON，concept 为本讲要点原文数组，一道题可覆盖多个要点；coverage 只以课后必答题作为完整性依据。manifest.json 登记已完成的整章草案；第三章3.1.1—3.10.5共48讲已齐，按3.1—3.10分成十个提交。完整性检查排除3.S1、3.S2等补充专题，它们不属于本轮正式讲次。",
    "",
    "数值答案记录计算式、带单位的输入、完整精度结果及相对容差0.02，审阅稿显示4位有效数字；无量纲答案和输入不显示单位，内部单位标识1仅用于量纲校验。校验器只使用自身的公式与单位换算，既不执行题库表达式，也不调用网站 physics 代码；完整值误差按更严格的0.001%校验，学生作答仍按±2%判分。每讲post-05为简答，列2—3条评分要点及参考答案；post-06为关联知识点的可选选择题，第三至六章另设具体情境并保留两个有部分正确前提的干扰项。全章选择题正确字母（含可选题，多选按各正确字母计数）任一字母占比不得超过40%。",
    "",
    "来源中的页码一律指原始单讲 PDF 从1起的物理页序，不是教学设计中的合并授课课件页码。PDF 依原文件名在只读目录 ../04-声学基础课件资料/ 下定位；教学设计位于只读目录 ../02-教学安排/20261018督导版教学设计/。每讲均已阅读原始 PDF、对应教学设计及思考题；每题注明课件页和教学设计目标条目。教学设计是目标对齐依据，题目为重新起草。schema中sources和source均标记为teacherOnly，来源只用于教师核对；本审阅稿供教师使用。",
    "",
    "记号以网站为准：时间因子 $e^{j\\omega t}$，质量 $M$、弹性系数 $D$、力阻 $R_m$、衰减率 $\\delta$、品质因数 $Q_m$、阻尼固有角频率 $\\omega_0^\\prime$；弦张力 $T$、线密度 $\\rho_l$、横位移 $y$，棒体密度 $\\rho$、杨氏模量 $E$、截面积 $S$、纵位移 $\\zeta$、轴向应力 $\\sigma$。第二章课件中的线密度ρ、应力T_zz按网站分别记为 $\\rho_l$、$\\sigma$。选择题的解析按 A—D 分别解释正确依据或错误来源；判断题、数值题给出2—5句解析。",
    "",
    "第三章采用负梯度速度势与正时间导数压力约定；3.2.2随页面写 $\\Psi$，其他讲的 $\\Phi$、$\\phi$ 在题干中分别说明。压力反射/透射系数为 $R_p,D_p$，声强与功率系数分开。柱函数第二实解按网站记 $Y_n$（原课件也记N），正时间因子下外向柱面支为 $H_n^{(2)}$。全内反射的法向坐标在题干中明确，均取远离界面衰减支。原课件或教学设计中的热过程频段、零储能、群速和声线表述均保留适用条件，具体见各讲审阅要点。",
    "",
    "可选题单问句、与简答题分设情境两项要求已应用于第三章48讲、第四章9讲、第五章3讲和第六章2讲；其post-06均为独立情境，脚本检查一个问号及与post-05的去数字三元字串相似度。该检查不能替代语义审阅。本轮仅起草第六章，第一至五章题目保持原有版本；第一、二章的跨章改写另待处理。无量纲显示检查继续覆盖所有已起草章节。",
    "",
    "第一、二章保留原有审阅结论。第三章按讲核对第6—17次课教学设计第八部分、只读的雨课堂前测后测题库（第7—24次课，含复习课）及网站例题；逐题差异记录在各讲reviewNotes中。相同知识点可以再测，课堂题的情境、求解任务或仅换数字的同类题不复用。脚本可发现规范化重复题干及仅改数字的相同句式，不能代替教师对语义重复、难度和教学效果的审定。",
    "",
    "第四章4.1—4.4.4共9讲已齐，新增课前27题、课后必答45题、可选9题。逐讲读取原始PDF、原始思考题及第18—20次课督导版教学设计，并对照雨课堂第7—24次课题目，尤其第18—20次课和复习题；各题的任务差异在reviewNotes中记录。两讲边界积分随网站用压力及归一化格林核，原课件的速度势形式换算见逐讲说明。瑞利距离按课件最大线度定义，圆活塞用直径平方除波长；最远轴向极大和课堂近场量级另行区分。",
    "",
    "第四章9道数值题逐题独立复算；双点源用实虚部分别叠加检验相位，偶极功率份额用立体角数值积分检验解析式，轴向节点代回原路径差核验。边界采样题给定相位步进标准，仅估计分辨率；入向残差题给定精确径向模型，仅诊断该模型中的来波分量。两者是由边界表示延伸的应用题，未将其当作原课件已有例题。",
    "",
    "第五章5.1、5.2、5.3共3讲已齐，新增课前9题、课后必答15题、可选3题。逐页阅读三份原始PDF（8、10、10页）、第20—21次课督导版教学设计及对应思考题，逐题对照雨课堂第7—24次课题库与网站例题；除课堂软硬边界与四次方律的直接题外，还核查教学设计第八部分作业和复习题，具体差异见各题reviewNotes。",
    "",
    "第五章3道数值题分别检验有限阻抗的复数边界驱动、刚性小球后向圆锥的功率份额、软圆柱两阶模型的单位长度散射宽度。后两题分别按立体角和周向数值积分独立核验，未调用网站物理实现。深度简答要求说明全表面匹配与唯一性、同尺寸参数的缩尺相似关系、有限长目标与无限长柱面模型的取舍；可选题另用规定运动、角向近似零点和斜入射情境。圆柱方向函数按网站归一化，三维截面与二维宽度的量纲分开。",
    "",
    "第六章6.1、6.2共2讲已齐，新增课前6题、课后必答10题、可选2题。逐页阅读原始PDF（11、13页）、第21次课督导版教学设计全文及对应思考题，逐题对照雨课堂第7—24次课题库和网站例题。题库采用表面平均压力系数、复阻抗相加与实际体积源强归一化，题目来源和禁复用核查逐题列出。",
    "",
    "第六章两道数值题分别求两频接收振速比和复传递函数的互易残差：前者用完整复传递函数的倒数独立核验，后者分别对两次声压除以各自发射源强再比较复数差；残差以百分数显示，内部按无量纲比例换算。深度简答分别检查三频相位能否对应统一延时、两条电学链路增益如何影响互易实验；可选题改用阻尼取舍和双元阵列模式，避免复用简答情境。6.2网站交叉乘积公式的源强下标问题见该讲审阅要点，本轮没有改动网站讲义或其他章节。",
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
  lines.push(
    "",
    "## 选择题正确字母分布（含可选题）",
    "",
    "| 章 | A | B | C | D |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const c of manifest.chapters) {
    const letters = banks
      .filter((b) => b.chapter === c.chapter)
      .flatMap((b) => b.questions)
      .flatMap((q) => (q.type === "single" ? [q.answer] : q.type === "multi" ? q.answer : []));
    const counts = ["A", "B", "C", "D"].map((letter) => {
      const count = letters.filter((answer) => answer === letter).length;
      return `${count}（${(letters.length ? (100 * count) / letters.length : 0).toFixed(1)}%）`;
    });
    lines.push(`| ${c.chapter} | ${counts.join(" | ")} |`);
  }
  lines.push("", "## 深度题清单", "", "| 讲次 | 题号 | 判断依据 |", "| --- | --- | --- |");
  for (const b of banks)
    for (const q of b.questions.filter((q) => q.role === "depth" && !q.optional)) {
      const reason =
        q.type === "short"
          ? q.answer.rubric.map((s) => s.replace(/[。；]$/u, "")).join("；")
          : q.type === "single"
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
        `| ${q.id} | ${q.kind === "pre" ? "课前" : "课后"} · ${roles[q.role]}${q.optional ? "（可选）" : ""} | ${q.type} | ${cell(answerText(q))} | ${q.concept.map((p) => b.keyPoints.indexOf(p) + 1).join("、")} |`,
      );
    lines.push("", "### 逐题题干、答案与解析", "");
    for (const q of b.questions) {
      lines.push(
        `#### ${q.id} ${roles[q.role]}（${q.level}${q.optional ? "，可选" : ""}）`,
        "",
        q.stem,
        "",
      );
      for (const o of q.options ?? []) lines.push(`- ${o.id}．${o.text}`);
      if (q.options) lines.push("");
      lines.push(`答案：${answerText(q)}`, "");
      if (q.type === "short") {
        lines.push("评分要点（每条1分，学生作答后自行对照）：", "");
        for (const point of q.answer.rubric) lines.push(`- ${point}`);
        lines.push("", `参考答案：${q.answer.reference}`, "");
      }
      if (q.type === "numeric") {
        lines.push(
          `计算式：${q.answer.calculation.formula}`,
          "",
          `复算输入：${Object.entries(q.answer.calculation.inputs)
            .map(([k, v]) => `${k} = ${quantityText(v.value, v.unit)}`)
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
