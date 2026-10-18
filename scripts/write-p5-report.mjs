import fs from "node:fs";
import { models } from "./p5-models.mjs";
const all = await models(),
  runtime = JSON.parse(
    fs.readFileSync("specs/redesign/matlab-check/P5/runtime-results.json", "utf8"),
  );
const f = (n) => Number(n.toPrecision(4)).toString();
const lines = [
  "# P5 工程计算批次",
  "",
  "分支：`redesign/p5-cases`。仅追加本地提交；未推送，未改写历史，未操作 stash。所有写入均在 acoustics-redesign 内。",
  "",
  "## 综合案例与默认参考答案",
  "",
  "每个案例有可编辑已知条件表、逐问 ±2% 判分、两级提示、随参数重算的三行分步解答、指标判断、中文答案配图、打印与可改参数 MATLAB 脚本，并链接 3–4 讲。九个案例分别提交。",
  "",
];
for (const e of all.engineeringCases) {
  lines.push(
    `### ${e.title}`,
    "",
    `讲次：${e.lectures.join("、")}。`,
    "",
    "| 小问 | 默认参考答案 |",
    "|---|---|",
  );
  for (const a of e.asks)
    lines.push(`| ${a.text} | ${f(a.calc(e.defaults))}${a.unit === "—" ? "" : " " + a.unit} |`);
  lines.push("", `设计判据：${e.criterion}`, "", `默认工程判断：${e.judgment(e.defaults)}`, "");
}
lines.push(
  "## 逐讲审计与补齐",
  "",
  "79 讲原来均有例题，本批没有新增凑数题。逐讲审计见 `specs/redesign/P5-lecture-audit.json`。按第 1–7 章分别提交了代入步骤的补齐。",
  "",
  "- 补齐带单位的数值代入算式、先前小问形成的中间量及工程背景；保留原有专属物理配图和计算函数。",
  "- 1.2.5：网页原来只保留功率图的通用标题，现采用重算的“平均输入功率 = … W”，与 MATLAB 一致。",
  "- 3.1.3、3.1.5、3.1.8：分别补密度逾量、一阶密度变化率和压力梯度答案标线。",
  "- 3.6.8：明确反射声压幅值标线，并让标题对应反射系数模值。",
  "- 3.6.9、3.10.4：参考解答改为反正弦角度表达式，避免把正弦值当作角度答案。",
  "- 6.2：补上实际声压峰值公式，不再以声压/源强传递比充当声压的代入公式。",
  "- 管道案例：按距终端向外为正坐标和 $e^{j\\omega t}$ 约定修正驻波相位，并以独立干涉公式检验非零声抗下的波腹位置。",
  "- 修正负数参考答案在超过容差时的“偏大/偏小”反馈；保留量级错误检测。",
  "- 每讲工程应用均链接到有效的综合案例；3.8.4 增加交通退距应用入口。",
  "- 长代入式在参考解答段内横向滚动；79 讲均展开解答，在两种视口下检查页面宽度。",
  "",
  "## 验证",
  "",
  "- `npm ci`、`npm test`、`node scripts/check-animations.mjs`、`npm run build` 均通过。",
  "- npm test 覆盖 79 讲有题、九案例至少三问、Python 标准库独立计算两组参数（每问相对误差 <0.5%）、70 个案例参数端点灵敏度、固定几何轴、默认幅值占比、中文图文和符号。",
  "- `node scripts/check-browser.mjs`：82 个讲次及所有其他路由，1440×900 与 390×844，无横向页面滚动及控制台错误。",
  "- `node scripts/check-p5-browser.mjs`：九案例两视口、两组作答判分、提示、解答重算、清除过期判分、打印、当前参数 MATLAB 下载，全部通过。",
  "- `node scripts/check-p5-lecture-browser.mjs`：79 讲 × 两视口展开参考解答，问题数量、数值步骤、KaTeX 与页面宽度通过。",
  "",
  "## MATLAB 与图像复核",
  "",
  `MATLAB R2024b：${runtime.jobs} 份脚本（九案例与五张改动的例题图，各两组参数），全部运行成功。比较每条曲线的横纵坐标及全部作答答案，最大曲线归一化差异 ${Math.max(...runtime.results.map((r) => r.worst ?? 0)).toExponential(3)}；逐问答案相对误差小于 0.5%。`,
  "",
  "- 原始 .m、PNG、参数、SHA-256 和运行结果：`specs/redesign/matlab-check/P5/`。",
  "- 九案例桌面/手机完整页面、配图、已知条件表以及五张改动例题截图：`specs/redesign/screenshots/P5/`。",
  "- 已逐张查看 MATLAB 两组参数 PNG、九案例桌面/手机页面与配图；拼版在 `screenshots/P5/review-boards/`，复核记录在 `P5-visual-review.json`。",
  "- 修正了竖线标注在坐标区外、MATLAB 长标签越过左边界及行距过大的问题；未添加仅几何轮廓的子图，案例默认物理曲线相对变化均超过 5%。",
  "",
  "## 未解决及边界",
  "",
  "- 无 P5 阻断项。材料设计使用 500:10:2000 Hz 离散频点及 1 mm 厚度步长；声呐为单程预算，超声为正入射标量近似，透镜为薄平凸近轴模型，均已在题目中标明适用条件。",
  "- `npm ci` 仍报告 2 项高危依赖审计提示；依赖与锁文件未在 P5 中升级。",
  "- 未推送，故本批尚未触发远端 GitHub Actions 或创建远端 PR。",
  "- 原有未跟踪 `specs/redesign/review-P3-2.md` 保持原样，未纳入提交。",
  "",
  "本文件按要求保持未提交。",
  "",
);
fs.writeFileSync("PR_SUMMARY.md", lines.join("\n"));
