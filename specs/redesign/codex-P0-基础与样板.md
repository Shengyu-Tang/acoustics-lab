# Codex 任务 P0：基础改造与两讲样板

你在仓库 `acoustics-lab`（React 19 + Vite + TypeScript，GitHub Pages 静态站）中工作。完整需求见同目录的 `00-总体需求与验收标准.md`、`01-逐讲知识点与仿真清单.md`、`02-工程计算案例规范.md`，请先通读这三个文件。本批只做 P0，不要提前做其他批次。

## 本批要完成的事

1. **代码整理**
   - 引入 Prettier（默认配置，printWidth 100），格式化 `src/`、`scripts/`；格式化单独成一个 commit，方便审查。
   - 删除未被引用的历史代码：`backend/`、`src/Account.tsx`、`src/Admin.tsx`、`src/Comments.tsx`、`src/Queue.tsx`、`src/api.ts`、`scripts/check-auth.mjs`，同步更新 README 与 MAINTAINER_NOTES 中的描述。
2. **MATLAB 风格绘图组件** `src/plot/`：严格按 00 文件第 4 节实现（坐标框、网格、刻度朝内、MATLAB 默认线色顺序、semilogx/loglog/polarplot/imagesc+colorbar/subplot、legend、xline/yline 标注、数据提示框、导出 PNG / CSV / `.m` 脚本）。为组件写一个演示页 `#/plot-demo`（不放进导航），列出每种图各一例。
3. **新的设计系统与全站布局**：严格按 00 文件第 3 节。删除 hero 标题区、英文眉标、统计数字、卡片阴影、深色面板、↗ 箭头。实现顶部导航、知识点页三栏布局（左章节目录树、中正文、右本页目录）、新的课程主页。
4. **两讲样板**：按 01 文件完整实现 **1.2.4** 和 **1.2.5**（本讲要点、编号公式、全部指定图、参数面板、读数、思考题），并按 02 文件实现**样题 A** 作为这两讲的例题（作答判分、两级提示、分步参考解答随参数重算、配图标工作点）。其余 77 讲暂时保留旧内容，但要套进新布局，不能报错。
5. **测试**：为新的物理函数补充校验脚本（1.2.4 三种共振频率、1.2.5 半功率带宽 = f₀/Q_m、样题 A 各问数值与 02 文件一致，误差 < 0.5%），加入 `npm test`。

## 约束

- 保持纯静态、无登录、无后端；不新增运行时依赖，除非确有必要并在 PR 描述中说明（Prettier 是开发依赖，可以加）。
- 不改动 `.github/workflows/pages.yml` 的发布逻辑。
- 完成后必须通过：`npm ci && npm test && node scripts/check-animations.mjs && npm run build`。
- 在 1440×900 和 390×844 两种视口下截图首页、1.2.4、1.2.5、`#/plot-demo`，放进 PR 描述。
- PR 描述列出：已完成项、对照 00 文件第 7 节的自查结果、未完成项。
