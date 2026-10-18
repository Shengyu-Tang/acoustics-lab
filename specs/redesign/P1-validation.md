# P1 本地验收记录

分支：`redesign/p1-ch1-2`；P0 基线 `dc09c76` 是当前分支祖先。12 讲各有独立提交，另有收尾验收提交。未推送、未改写历史。

| 验收项 | 结果与证据 |
|---|---|
| 7.1 慕课内容 | 12 讲逐项完成；总结页和约定见 [课件核对记录](P1-source-notes.md)。思考题与 `topics.json` 逐字比较；公式编号无冲突。 |
| 7.1 专属图 | 25 张讲义图及 12 张例题配图；无共享占位模型。每讲数据文件独立定义图、参数、读数、例题及工程应用。 |
| 7.1 物理计算 | 自由振动周期、δ、τ、对数衰减率；受迫解析解及填充脉冲与独立 RK4；弦频率及拨弦系数数值积分；细棒两类边界频率、质量负载根、共振反算 E；全部加入 `npm test`。 |
| 7.1 例题 | 12 道均支持可编辑已知量、±2% 判分、两级提示、重算分步解答、工作点、打印及 MATLAB 计算脚本。12 份 MATLAB 计算输出与参考值误差 <0.5%。 |
| 7.2 统一组件 | 使用 P0 的 Figure、Parameter、ExampleWorksheet 和版式；扩展柱状图、材料刻度及通用讲次字段。PNG、CSV、MATLAB 下载和打印均经过浏览器实际操作。 |
| 7.2 动画 | 1.1.1、1.1.2 与第 2 章提供播放、暂停、单步、复位；固定坐标范围有自动比较。2.2 同时显示对向行波与驻波合成。 |
| 7.2 图形质量 | 51 张 MATLAB PNG 均逐张打开；修正图例、极点采样、箭头比例及 P0 下标碰撞。详见 [逐图记录](matlab-check/P1/REVIEW.md)。网页另检查真实 SVG 曲线与图例矩形不相交。 |
| 7.2 参数边界 | 数值输入及滑块沿用范围校验；新图覆盖参数端点和四种边界选择。连续函数数据覆盖完整 xlim，nice limits 等于首尾刻度；几何轨迹、箭头及离散柱状图按其几何意义检查。零初值不产生虚构能量。 |
| 7.3 必需命令 | `npm ci`、`npm test`、`check-animations`、`npm run build`、`check-browser` 全部通过。另通过格式、diff、MATLAB 输出核验及首屏资源对比。 |
| 7.3 视口与控制台 | 82 个讲次、全部主路由及 9 个综合案例入口，在 1440×900 和 390×844 下无横向滚动、无控制台报错。P1 的判分、提示、重算、动画、拖弦、边界及材料切换通过。 |
| 7.3 首屏资源 | 读取全部目录缩略图后，桌面原始资源 307844 → 291624 B，gzip 90863 → 89087 B；手机 307639 → 291419 B，gzip 90685 → 88909 B。对照同环境构建的 `dc09c76`；gzip 为各文件独立压缩估算，非线上网络测速。 |
| 7.3 纯静态 | 未新增运行时依赖；首页只加载目录字段，完整讲义保持按路由加载。14 张真实缩略图使用共享绘图线条生成。 |
| 远端 CI | 未触发 GitHub Actions，遵守“不推送”的约束；本地验收日志与产物已保存。 |

截图：[`screenshots/p1/`](../../screenshots/p1/)，每讲各有桌面和手机整页图。完整机器记录见 [P1-validation.json](P1-validation.json)，MATLAB 脚本、PNG、尺寸和哈希见 [`matlab-check/P1/artifacts.json`](matlab-check/P1/artifacts.json)。

复现顺序：

```powershell
npm ci --cache .npm-cache
npm test
node scripts/check-animations.mjs
npm run build
node scripts/check-browser.mjs
node scripts/export-matlab-check-p1.mjs
node scripts/verify-matlab-check-p1.mjs
```

单讲复查示例：`node scripts/export-matlab-check-p1.mjs --lecture=2.2`。首次 P0 回归导出：`node scripts/export-matlab-check-p1.mjs --lecture=1.2.5 --figure=1.2.5-2,B-1`。所有临时目录、浏览器 profile、下载、MATLAB preferences 和日志均定位在本克隆 `outputs/` 中；PNG 和 `.m` 保存到 `specs/redesign/matlab-check/P1/`。

首屏对比先将 `dc09c76` 只读归档到 `outputs/p0-baseline/` 并在该目录构建，再运行 `node scripts/check-home-resources.mjs`；该检查将全部缩略图计入，避免依赖浏览器懒加载时机。
