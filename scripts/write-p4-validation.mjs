import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { models } from "./p4-models.mjs";
const { lectures, fmt } = await models();
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
const p4 = (id) => /^[4-7]\./.test(id);
const native = [];
for (const batch of ["P4", "P3-2"]) {
  const dir = "specs/redesign/matlab-check/" + batch;
  const manifest = read(dir + "/manifest.json");
  const runtime = read(dir + "/runtime-results.json");
  assert.equal(manifest.runtimeValidated, true);
  assert.deepEqual(read(dir + "/syntax-check.json").unexpected, []);
  const results = manifest.jobs.map((j) => {
    assert.equal(sha(j.file), j.sha256, j.file);
    const r = runtime.results.find((r) => r.file === j.file && r.sha256 === j.sha256 && r.passed);
    assert.ok(r && fs.existsSync(r.png), j.file);
    return r;
  });
  native.push({
    batch,
    scripts: results.length,
    passed: true,
    maxNormalizedError: Math.max(...results.map((r) => r.worst)),
  });
}
const browser = read("specs/redesign/P4-browser-validation.json");
assert.equal(browser.report.length, 34);
assert.deepEqual(browser.errors, []);
const routes = read("outputs/browser-routes-passed.json");
assert.equal(routes.lectures, 82);
assert.deepEqual(routes.errors, []);
write("specs/redesign/P4-all-routes-validation.json", routes);
const sliderSource = read("outputs/slider-check/report.json");
const sliderRows = sliderSource.screenshots.filter((r) => p4(r.id));
assert.equal(sliderRows.length, 106);
assert.equal(new Set(sliderRows.map((r) => r.id)).size, 17);
write("specs/redesign/P4-slider-validation.json", {
  directory: "outputs/slider-check",
  screenshots: sliderRows,
});
const axis = read("specs/redesign/screenshots/P4/manifest.json");
assert.deepEqual(axis.failures, []);
assert.deepEqual(axis.errors, []);
assert.equal(axis.captures.length, 96);
const viewed = read("outputs/P4/viewed-sheets.json");
const visual = [];
for (const mode of ["defaults", "sliders", "matlab", "prerequisites"]) {
  const sheets = read("outputs/P4/visual-review/" + mode + "-manifest.json");
  for (const sheet of sheets) {
    assert.ok(viewed.viewed.includes(sheet.board), "not inspected: " + sheet.board);
    visual.push({
      mode,
      board: "outputs/P4/visual-review/" + sheet.board,
      originals: sheet.originals.map((file) => {
        file = (mode === "sliders" ? "outputs/slider-check/" + file : file).replaceAll("\\", "/");
        return { file, sha256: sha(file) };
      }),
    });
  }
}
write("specs/redesign/P4-visual-review.json", {
  method: "逐张查看接触表；复平面、色条和例题标线另查原尺寸 PNG。",
  inspectedSheets: visual.length,
  sheets: visual,
  extraInspected: viewed.extra,
  corrections: [
    "移动端等比例圆形与真实尺寸",
    "场图图例不遮挡色条",
    "阵列稀疏整数刻度",
    "复平面 MATLAB 图例置于图外",
    "P1–P3 例题答案与标线对应关系",
  ],
});
const logs = [
  ["npm ci --cache outputs/.npm-cache", "npm-ci-final.log", /added \d+ packages/],
  ["npm test", "npm-test-final.log", /PASS P4 physics/],
  ["node scripts/check-animations.mjs", "animations-final.log", /PASS: continuous-field uniforms/],
  ["npm run build", "build-final.log", /GitHub Pages static assets ready/],
  [
    "node scripts/check-browser.mjs",
    "all-routes-final.log",
    /PASS: browser interactions, exports, print and all lecture routes/,
  ],
  ["node scripts/check-p4-browser.mjs", "browser-final.log", /PASS P4 7.3 mobile/],
  [
    "node scripts/check-p4-axes-browser.mjs --capture",
    "axes-final.log",
    /Checked axis labels 7.3 390/,
  ],
];
const checks = logs.map(([command, file, pass]) => {
  const log = "outputs/P4/" + file;
  const bytes = fs.readFileSync(log);
  assert.match(
    bytes.toString(bytes[0] === 0xff && bytes[1] === 0xfe ? "utf16le" : "utf8"),
    pass,
    command,
  );
  return { command, passed: true, log, sha256: sha(log) };
});
const summary = {
  lectureIds: lectures.map((l) => l.id),
  lectures: lectures.length,
  figures: lectures.reduce((n, l) => n + l.figures.length, 0),
  examples: lectures.reduce((n, l) => n + l.examples.length, 0),
  independentAnswers: lectures.reduce(
    (n, l) => n + l.examples.reduce((m, e) => m + e.asks.length, 0),
    0,
  ),
  sourceQuestions: lectures.reduce((n, l) => n + l.questions.length, 0),
  matlab: native,
  checks,
  viewports: routes.viewports,
  routes: routes.lectures,
  sliders: sliderRows.length / 2,
  sliderEndpoints: sliderRows.length,
  inspectedSheets: visual.length,
  pendingMatlab: false,
  dependencyAudit: {
    unchangedLockfile: true,
    high: ["source-map-js", "vite"],
    evidence: "P4-dependency-audit.json",
  },
};
write("specs/redesign/P4-validation.json", summary);
const table = lectures.map(
  (l) =>
    "| " +
    l.id +
    " | " +
    l.figures.map((f) => f.number + "：" + f.title).join("；") +
    " | " +
    l.examples
      .map(
        (e) =>
          e.title +
          "；" +
          e.asks
            .map(
              (a) =>
                a.text.replace(/^\(\d+\)\s*/, "") +
                "=" +
                fmt(a.calc(e.defaults)) +
                (a.unit === "—" ? "" : " " + a.unit),
            )
            .join("；"),
      )
      .join("；") +
    " |",
);
const scope = [
  "4.4.1–4.4.2 用二维圆周及二维格林函数数值演示 Helmholtz 内外场表示；配套给出三维闭合面的原理式，明确维度。求积误差图在 10⁻¹⁵ 数值底限截断，边界附近留缺口。",
  "点源在图中对近源奇点作可见性截断；偶极场明确标注近源颜色饱和。例题使用相应的球源严格解、有限点源叠加或远场近似，条件均写在题目中。",
  "6.1 圆球压力系数使用刚性球解；圆面活塞为瑞利单面负载近似。水声互易性限定于静止线性互易介质与同源强、同电学条件。",
  "7.2 的 Thorp 海水吸收为代表性海水经验式，不替代任意温盐深条件下的精细计算；7.3 的德拉尼—巴兹利模型限定空气高孔隙率纤维材料，显示频段保持 0.01<X<1。",
  "7.3 若半峰带宽上限未在显示频段闭合，明确标注截于显示边界；水声尖劈只作几何与阻抗渐变定性示意。",
];
const text = [
  "# P4 验收记录",
  "",
  "01 的第 4–7 章逐讲清单实际为 17 讲，已全部实现：31 张仿真图、17 个可评分工程例题及独立例题图、41 个答案、54 道原文思考题。00 批次表的 19 讲与逐讲清单计数不一致；没有缺失条目。",
  "",
  "## 逐讲图与例题",
  "",
  "| 讲次 | 仿真图 | 例题及默认答案 |",
  "|---|---|---|",
  ...table,
  "",
  "## 原课件与思考题",
  "",
  "已只读核对原 PDF 总结页及原 DOCX 思考题。第 5 章没有单列总结页，核对末页。逐讲页码与本讲要点覆盖见 [P4-summary-coverage.md](P4-summary-coverage.md)，原文、文件名和 SHA-256 见 [P4-source-notes.json](P4-source-notes.json)。",
  "",
  "## 数值、浏览器与图像",
  "",
  "npm ci、npm test、check-animations、build 全部通过；check-browser 在 1440×900、390×844 遍历全部 82 讲和导航、案例、日历等页面，无控制台错误。P4 额外验证全部评分答案、修改已知条件后的解答、MATLAB 下载、选择器、动画单步和 Np/m↔dB/m 换算。",
  "",
  "物理回归包括脉动球阻抗/声功率、小球附加质量、点源、偶极指向性与功率、Helmholtz 内外表示、活塞指向性/近远场/轴向严格解、瑞利距离、刚性球与软硬圆柱低频极限、接收压力系数、互易性、吸声系数、吸收与衰减。41 个答案由独立 mpmath 45 位精度公式重新计算，误差阈值严格小于 0.5%。",
  "",
  "MATLAB R2024b 首次启动实际成功（300 s 超时约束，67.839 s 完成），无需服务调整。P4 全部 48 图各两组参数，96 个独立进程运行成功；逐条比较曲线、声场、读数和例题答案，最大归一化误差 " +
    native[0].maxNormalizedError.toExponential(5) +
    "。mlint 无非允许诊断。另对本次 P3-2 标题/标线审查涉及的 13 讲例题运行两组参数，共 26 个独立进程，全部通过。",
  "",
  "已查看 59 张接触表，覆盖 96 张 P4 桌面/手机逐图截图、96 张 P4 MATLAB PNG、123 张默认/滑块端点截图和 52 张 P1–P3 复核图。首页及 7.3 完整页面另查；修正后重点原图再次查看。图像逐文件 SHA-256 见 [P4-visual-review.json](P4-visual-review.json)。滑块原图在 outputs/slider-check，P4 的 53 个滑块共 106 个端点；其报告副本见 P4-slider-validation.json。",
  "",
  "脚本、两组参数、mlint 与运行结果、PNG 位于 matlab-check/P4/；桌面/手机截图位于 screenshots/P4/。复现：先生成（export-matlab-check-p4.mjs），再运行（run-matlab-check-p4.mjs），每个脚本一个 MATLAB 进程，单脚本超时 300 s。",
  "",
  "## 已说明的模型边界",
  "",
  ...scope.map((s) => "- " + s),
  "",
  "## 未决项",
  "",
  "无 P4 功能或 MATLAB 运行待验项。计数差异按 01 的全部 17 条执行。npm ci 成功，同时 npm audit 报告既有锁文件中的 source-map-js 与 vite 两项高危依赖告警；作为依赖维护待办记录在 P4-dependency-audit.json，本批锁文件未变。按用户约束未推送，远程 CI 未触发。",
  "",
];
fs.writeFileSync("specs/redesign/P4-validation.md", text.join("\n"));
if (process.argv.includes("--summary")) {
  fs.writeFileSync(
    "PR_SUMMARY.md",
    [
      "# P4：声辐射、散射、接收与吸收",
      "",
      "已完成 01 中第 4–7 章全部 17 讲（4.1–7.3），每讲一个新提交；另附后续图形与验收修正提交。批次总表的 19 讲为计数差异，逐讲清单无遗漏。",
      "",
      "31 张仿真图、17 个可评分工程例题及独立物理情境图；每图含可改参数 MATLAB 模型。例题标题标明所求量和答案，幅值轴匹配当前参数，空间轴固定且保持真实尺寸。全部新增首页缩略图已接入。",
      "",
      "## 每讲图与例题",
      "",
      "| 讲次 | 仿真图 | 例题及默认答案 |",
      "|---|---|---|",
      ...table,
      "",
      "## PPT 总结与思考题",
      "",
      "逐讲对照原 MOOC PDF 总结页（第 5 章核对末页），全部要点覆盖；54 道思考题从原 DOCX 逐字提取。源材料只读。详见 [覆盖表](specs/redesign/P4-summary-coverage.md) 与 [源文件审计](specs/redesign/P4-source-notes.json)。",
      "",
      "## 验证结果",
      "",
      "- npm ci && npm test && node scripts/check-animations.mjs && npm run build：通过。",
      "- check-browser：全部 82 讲及其他页面在 1440×900、390×844 通过；P4 全部 17 讲通过参数敏感性、固定物理轴、分步解答、评分及下载检查。",
      "- 41 个例题答案独立高精度复算，误差 <0.5%。新增辐射、Helmholtz、散射、互易与吸收物理回归已纳入 npm test。",
      "- MATLAB R2024b 实际运行 96/96 组 P4 图脚本并对照网页公式；最大归一化偏差 " +
        native[0].maxNormalizedError.toExponential(5) +
        "，mlint 通过。另有 26/26 组 P1–P3 受本次审查影响的例题复核。每个脚本单独进程，300 s 超时。运行无挂起，无待验 MATLAB 项。",
      "- 53 个滑块两端共 106 张截图及每讲默认图；全部查看。桌面/手机 96 张逐图截图、MATLAB 96 张 PNG 和前序复核图已查看，修正了等比例几何、色条、长图例和整数刻度问题。",
      "- [完整验收记录](specs/redesign/P4-validation.md)、[数值结果](specs/redesign/matlab-check/P4/runtime-results.json)、[图像审查清单](specs/redesign/P4-visual-review.json)、[桌面/手机截图](specs/redesign/screenshots/P4/manifest.json)。滑块原图：outputs/slider-check/。",
      "",
      "## 模型适用范围与未决项",
      "",
      ...scope.map((s) => "- " + s),
      "",
      "无 P4 功能或 MATLAB 本地验收待办。保留 00 与 01 的讲数差异说明。npm ci 成功；npm audit 报告既有 source-map-js、vite 两项高危依赖告警，作为依赖维护待办记录在 specs/redesign/P4-dependency-audit.json，本批锁文件未变。未推送，远程 CI 未触发；仍在 redesign/p4-ch4-7，未改写历史、未操作 stash，父目录材料未修改。PR_SUMMARY.md 按要求保持未提交。",
      "",
    ].join("\n"),
  );
}
console.log("Wrote P4 acceptance record:", summary);
