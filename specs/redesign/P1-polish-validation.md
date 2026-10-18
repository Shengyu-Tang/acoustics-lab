# P1 上线前打磨验收

2026-10-17，在 `redesign/p1-ch1-2` 完成 `codex-P1-polish.md`。全部修改位于本克隆；原始 PDF、DOCX 只读；没有推送、切换分支或改写历史。

## 内容核对

- [x] 从 14 份 PDF 提取末页“总结”，并渲染、目视核对全部总结页。
- [x] 总结页每个概念在对应“本讲要点”出现，含 1.2.4 指定的两项补充和 1.2.5 谐振、正功及平均功率最大值。
- [x] 思考题直接与原 DOCX 逐字比较，14 讲合计 33 题一致；补回 1.1.1 缺漏的第 4 题和参考解释。

逐讲页码、概念与要点编号映射见 [原始资料核对](P1-polish-source-notes.md)。提取文本、原页截图、思考题比较记录及脚本在忽略目录 `outputs/source-audit/`。

## 界面清单

- [x] 数值和搜索输入框高 32px，内边距 4px 8px，字号 14px。
- [x] 参数每行按“标签、数值框、单位、滑块”排列，共享列宽按标签内容确定；手机数值框 88px，可完整显示 395000。
- [x] 例题提交与两个独立提示按钮同行；Qₘ 预设与文字恢复按钮同行。
- [x] 图工具栏为右上角 `PNG · CSV · MATLAB`，12px、#555、无框，悬停为海大蓝；保留下载的无障碍名称。
- [x] 已知条件表单元格上下 6px，数值框 120px，控件 32px。
- [x] 全部讲次增加面包屑；全部路由设置标题；favicon 使用海大蓝底白色声波。
- [x] 全站共用课程、学院、教师与版权页脚，联系邮箱占位留空；桌面单行、手机换行。
- [x] 左侧目录章标题与讲次同为 14px，当前讲高亮，章间仅保留细分隔线并压缩留白。
- [x] 保持普通字号标题、课程目录表和连续正文；收紧公式、参数与表单间距。无阴影、渐变、emoji、胶囊标签或英文眉标，界面强调色为海大蓝，圆角不超过 4px。

## 视觉审查

逐张打开指定的八张视口截图，并额外检查参数面板和例题截图。首轮发现旧样式中的 label 外边距、44px 按钮最小高度和输入框较高优先级规则仍造成稀疏排布；修正后复查，参数与例题密度恢复为常规文档表单。手机避免挤压数值，Qₘ 操作保持同行，公式可横向查看且编号独立换行。缩略图截图等待解码完成，避免将加载时的空白写入证据。

| 页面 | 1440×900 | 390×844 |
|---|---|---|
| 首页 | [桌面](../../screenshots/polish/home-desktop.png) | [手机](../../screenshots/polish/home-mobile.png) |
| 1.1.1 | [桌面](../../screenshots/polish/1.1.1-desktop.png) | [手机](../../screenshots/polish/1.1.1-mobile.png) |
| 1.2.4 | [桌面](../../screenshots/polish/1.2.4-desktop.png) | [手机](../../screenshots/polish/1.2.4-mobile.png) |
| 2.2 | [桌面](../../screenshots/polish/2.2-desktop.png) | [手机](../../screenshots/polish/2.2-mobile.png) |

同时更新 `screenshots/p0/` 的 8 张和 `screenshots/p1/` 的 24 张整页截图。P1 截图现取修改例题、材料、边界等交互之前的默认状态。40 张截图的尺寸和 SHA-256 见 [机器记录](P1-polish-validation.json)。

## 验证结果

- [x] 按顺序运行 `npm ci && npm test && node scripts/check-animations.mjs && npm run build`，全部退出 0。npm 缓存、浏览器临时文件和下载均留在本克隆。
- [x] `node scripts/check-browser.mjs`：82 个讲次、7 个非讲次主页面、9 个案例深链，两种视口均无横向滚动或控制台错误；讲次标题逐一核验。
- [x] P0 / P1 真实下载、判分、两级提示、参考解答重算、打印、动画、边界和材料切换通过。
- [x] 新增浏览器几何检查：输入框高度/字号/内边距、标签与数值相邻、单位和滑块同行、按钮同行、120px 已知量、工具栏字号/颜色/边框、面包屑和唯一全站页脚。
- [x] `npm run format:check` 与 `git diff --check` 通过。
- [x] 本次没有修改导出器、物理函数或图数据，不触发 P1/P0 MATLAB 批量重跑；额外运行 `node scripts/verify-matlab-check-p1.mjs`，现有 51 组脚本、PNG、日志及 12 题计算对照仍通过。

完整日志位于 `outputs/polish-{npm-ci,tests,animations,build,browser}.log`；浏览器测量在 `outputs/browser-report.json`、`outputs/polish-report.json`。安装仍报告现有依赖中的 2 个高等级审计项，构建仍有现有 Three.js 大块提示；本次未变更依赖或锁文件，验收命令均成功。
