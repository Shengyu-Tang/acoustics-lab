import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { gzipSync } from "node:zlib";
const data = await import("../outputs/p3-check.mjs");
const lectures = Object.entries(data)
  .filter(([k]) => /^l\d+$/.test(k))
  .map(([, v]) => v)
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
const sources = JSON.parse(fs.readFileSync("specs/redesign/P3-source-notes.json", "utf8"));
const slides = JSON.parse(
  fs.readFileSync("outputs/slider-check/report.json", "utf8"),
).screenshots.filter((r) => /^3\.(6|7|8|9|10)\./.test(r.id));
const browser = JSON.parse(fs.readFileSync("specs/redesign/P3-browser-validation.json", "utf8"));
const axis = JSON.parse(fs.readFileSync("outputs/fixed-axes.json", "utf8"));
const sensitivity = JSON.parse(fs.readFileSync("outputs/parameter-sensitivity.json", "utf8"));
const sizes = (folder) => {
  const out = {};
  for (const name of fs.readdirSync(folder).filter((f) => /^index-.*\.(js|css)$/.test(f))) {
    const b = fs.readFileSync(path.join(folder, name));
    out[name.endsWith(".js") ? "js" : "css"] = { bytes: b.length, gzip: gzipSync(b).length };
  }
  return out;
};
const performance = {
  baseline: sizes("outputs/p3-baseline/docs/assets"),
  current: sizes("docs/assets"),
};
const folder = "specs/redesign/matlab-check/P3";
const jobs = JSON.parse(fs.readFileSync("outputs/matlab-models-P3/expected.json", "utf8"));
const manifest = jobs.map((j) => ({
  name: j.name,
  set: j.set,
  filename: j.filename,
  parameters: j.parameters,
  expectedAnswers: j.answers,
  expectedReadouts: j.readouts,
  sha256: crypto
    .createHash("sha256")
    .update(fs.readFileSync(`${folder}/${j.filename}.m`))
    .digest("hex"),
  runtimeVerified: false,
}));
fs.writeFileSync(
  `${folder}/manifest.json`,
  JSON.stringify(
    {
      executable: "C:/Program Files/MATLAB/R2024b/bin/matlab.exe",
      processPolicy: "One independent -batch process per script; never a shared MATLAB session.",
      status: "Standard MATLAB startup times out; -nojvm does not support figures.",
      jobs: manifest,
    },
    null,
    2,
  ) + "\n",
);
const perLecture = lectures.map((l) => ({
  id: l.id,
  title: l.title,
  figures: l.figures.map((f) => ({ number: f.number, title: f.title })),
  examples: l.examples.map((e) => ({
    title: e.title,
    answers: e.asks.map((a) => ({ quantity: a.text, value: a.calc(e.defaults), unit: a.unit })),
    figureTitle: e.plot(e.defaults).title,
  })),
  summaryPages: sources[l.id].summary.map(([p]) => p),
  summaryImageOnly: l.id === "3.8.4",
  keyPoints: l.keyPoints,
  questionCount: l.questions.length,
}));
const validation = {
  status: "Implementation and local web checks complete; MATLAB runtime/PNG acceptance blocked.",
  lectures: lectures.length,
  figures: perLecture.reduce((s, l) => s + l.figures.length, 0),
  examples: lectures.length,
  independentAnswers: perLecture.reduce((s, l) => s + l.examples[0].answers.length, 0),
  originalQuestions: perLecture.reduce((s, l) => s + l.questionCount, 0),
  axisFailures: axis.failures,
  sensitivityFailures: sensitivity.failures,
  P3BrowserRoutes: browser.report.length,
  browserErrors: browser.errors,
  sliderEndpoints: slides.length,
  defaultScreenshots: 27,
  desktopMobilePngs: fs
    .readdirSync("specs/redesign/screenshots/P3")
    .filter((f) => f.endsWith(".png")).length,
  matlab: {
    scripts: manifest.length,
    pngs: fs.readdirSync(folder).filter((f) => f.endsWith(".png")).length,
    complete: false,
  },
  performance,
  perLecture,
};
fs.writeFileSync("specs/redesign/P3-validation.json", JSON.stringify(validation, null, 2) + "\n");
let md =
  "# P3 原始 PPT 总结覆盖核对\n\n原始 PDF 和思考题文档只读；文件 SHA-256 与逐字原题见 `P3-source-notes.json`。已查看全部总结页图像；3.8.4 第 8 页为图片，总结为“声能流、声强”。\n\n";
for (const l of perLecture) {
  md +=
    `## ${l.id} ${l.title}\n\n总结页：${l.summaryPages.join("、")}。${l.summaryImageOnly ? "本页以图像核对。" : ""}\n\n` +
    l.keyPoints.map((p) => "- " + p).join("\n") +
    `\n\n思考题：${l.questionCount} 道，按原文保留。\n\n`;
}
fs.writeFileSync("specs/redesign/P3-summary-coverage.md", md);
let pr =
  "# P3：第 3 章下半部\n\n分支 `redesign/p3-ch3b`；27 讲（3.6.1–3.10.5），41 幅专属仿真图、27 道判分例题、56 个独立参考数值。每讲一个新提交；没有推送、改写历史或操作 stash；所有写入均在本仓库。\n\n## 逐讲图与例题\n\n| 讲次 | 仿真图 | 例题所求量及默认答案 | PPT 总结页 |\n|---|---|---|---|\n";
for (const l of perLecture)
  pr += `| ${l.id} | ${l.figures.map((f) => f.number + " " + f.title).join("；")} | ${l.examples[0].answers.map((a) => a.quantity.replace(/^\(\d+\)\s*/, "") + " = " + Number(a.value.toPrecision(5)) + " " + a.unit).join("；")} | ${l.summaryPages.join("、")}${l.summaryImageOnly ? "（图片）" : ""} |\n`;
pr +=
  "\n## 内容与网页验证\n\n- 已逐讲查看原始 PPT 总结页并核对本讲要点，见 `specs/redesign/P3-summary-coverage.md`；原题及源文件哈希见 `P3-source-notes.json`。\n- 新图均带可编辑参数的 `matlabModel`，通过共享绘图组件；例题标题包含所求量和当前数值，给定条件、判分、提示与分步解答联动。球面幅度常数采用 Pa·m；几何、位置和时间轴采用物理单位。\n- `npm ci`、`npm test`、`node scripts/check-animations.mjs`、`npm run build` 通过。新增校验覆盖法向/斜入射边界与能量守恒、Snell 定律、临界角和全内反射、球面/柱面关系、贝塞尔 Wronskian、波导截止与模态、相速度与群速度乘积，以及例题误差 <0.5%。\n- P3 每个参数的灵敏度测试通过；波导层厚、镜像源深度、圆墙半径有几何范围契约。位置/时间轴固定，幅值按当前参数周期包络取范围，离散谱零起点且不截断。例题曲线也检查幅值占比与坐标覆盖。\n- `check-browser` 的全部 82 个讲次及辅助路由通过 1440×900、390×844 检查；P3 另逐讲验证判分、重算、MATLAB 下载、选择器与单步。控制台错误为零。\n- 桌面/手机证据位于 `specs/redesign/screenshots/P3/`；27 张默认图与 232 张真实滑块端点截图位于 `outputs/slider-check/`，已逐讲查看对照图。300 张页面/图/解答截图已按讲查看。\n- 端点复核发现并修复了回音壁近径向发射的误差累积；网页与 MATLAB 每次反射都重新归一化圆周点及方向，并以反射定律和圆周约束校验。\n";
pr += `\n首页首包对比（同机、同工具构建当前初始基线 32225fb）：JS ${performance.baseline.js.bytes} → ${performance.current.js.bytes} 字节，gzip ${performance.baseline.js.gzip} → ${performance.current.js.gzip} 字节；CSS gzip ${performance.baseline.css.gzip} → ${performance.current.css.gzip} 字节。首页简介去掉重复学习说明，保留课程范围与讲义索引；新讲义随实验室路由加载。\n`;
pr +=
  "\n## MATLAB 结果与未完成项\n\n**MATLAB 运行验收未通过，不能宣称本批全部验收完成。**\n\n已生成 136 个两参数组脚本，目录 `specs/redesign/matlab-check/P3/`；`manifest.json` 保存当前参数、预期读数/答案与脚本哈希。R2024b `mlint.exe -id` 已逐文件分析，只有建议类诊断，结果见 `syntax-check.json`。这不替代运行或 PNG 核对。\n\n标准 `matlab.exe -batch` 在进入脚本前超时：两进程分别等待 120 秒仍未进入；随后单进程等待 300 秒也未进入。`-nojvm` 探测有一次进入脚本，但在 `figure` 处明确报“不支持此功能”，无法生成图形。因此当前没有本批 MATLAB PNG，也没有完成双参数组的实际数值与轴限比对；不能进行缺失 PNG 的视觉检查。没有改动仓库外的 MATLAB 设置或 Windows 服务。\n\n启动恢复后运行：\n\n```powershell\nnode scripts/check-matlab-models.mjs --batch=P3 --workers=1 --timeout-ms=300000\nnode scripts/check-p3-matlab-syntax.mjs\n```\n\n每个脚本一个独立 MATLAB 进程，两个参数组只修改参数块；脚本将比对曲线、场、轴限、读数和例题答案。成功后必须逐张查看新生成的 PNG。远端 GitHub Actions 未触发，遵守“不推送”约束。\n";
fs.writeFileSync("PR_SUMMARY.md", pr);
console.log(
  `Wrote per-lecture coverage, evidence manifest and uncommitted PR_SUMMARY.md (${lectures.length} lectures).`,
);
