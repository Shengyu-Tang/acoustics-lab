# P2 第三轮实现与验收记录

网页实现及 Node、浏览器验收已完成。**最终验收尚未完成：MATLAB 独立进程启动挂起，全量两组参数复验仍待完成。** 不以旧轮次的 MATLAB 结果代替本轮结果。

## 先测试，后修复

测试提交 `5427171` 在修改绘图代码前完成。绘图相关源码与 `5142669` 相同，`git diff 5142669 HEAD -- src/plot src/content/lectures src/content/p1.ts src/content/p2.ts` 无差异。基线见 [P2-3-baseline.json](P2-3-baseline.json)：新检查报告了 1.1.3-1、1.2.2-1、3.4.1-1/2、2.2-2、3.3.2-1 等图的问题，并检出英文图标题、坐标标签、图例。

修复覆盖全部 35 个 P1/P2 讲次，包括 1.2.4、1.2.5 的共用绘图函数。

- 几何和时间观察窗继续固定；幅值轴以当前参数的数据取 nice 范围。
- 动画按当前参数采样完整周期的 128 个相位，保留余量，缓存只随参数变化更新；左右纵轴分别计算。
- 幅值参数的敏感性允许用实际刻度值或读数变化证明；其余参数仍检查绘图数据及几何尺寸变化。
- 柱图由零起算；2.2 显示明确标注的系数幅值 `|b_n|`，重构仍使用带符号系数。空气/水及阻抗柱图也改用从零开始的线性纵轴。
- 3.1.4、3.3.2 保留固定物理坐标总览，并增加有明确标签的体元局部放大图；顶点文字放在放大图中。
- 2.3 的轴向合力箭头加大；图标题、标签、图例及无量纲比较说明改为中文。
- 图例及频率读数置于浏览器绘图区上方，避免收紧纵轴后覆盖曲线。
- 无阻尼共振和 `tan(q)` 极点不存在有限包络：2.2-3、2.4-2 按当前静位移的四倍显示，2.3-3 围绕当前交点显示，并在图中明确说明超窗部分省略。完整解析数据仍可导出。
- MATLAB 导出随参数块重算相同的范围；验证器增加数值轴限比对、单脚本独立进程、两进程并发、超时后回收该脚本进程树，以及仓库内独立输出目录。

## 已通过

`npm ci`、`npm test`、`node scripts/check-animations.mjs`、`npm run build` 均成功。

`check-fixed-axes`：1003 项幅值/状态测量，无失败；默认参数与每个滑块两端均覆盖，另检查动画中的纵轴、右轴及色标稳定性。

| 默认状态 | 纵向占比（动画取整周期） | 当前纵轴 |
| --- | --- | --- |
| 1.1.3-1 | 67.2% | −0.002 … 0.006 m |
| 1.2.2-1 三子图 | 70.8%、84.6%、77.1% | ±0.003、±0.003、±0.004 m |
| 3.4.1-1 | 70.0% | ±2 Pa |
| 3.4.1-2 | 84.3% | ±0.004 m/s |
| 2.2-2 系数幅值柱图 | 无截断，零起点 | 0 … 0.004 m |

动画某一相位可因驻波相消、零交叉或长波长而近乎平坦；检查整周期包络，避免纵轴随帧跳动。

`node scripts/check-browser.mjs`：82 个讲次路由及所有辅助路由，在 1440×900、390×844 两种视口通过；包括布局、图例/标注不遮挡、导出、打印、交互及控制台检查，控制台错误为零。

`node scripts/check-slider-endpoints.mjs`：35 张默认截图、304 张真实拖动滑块端点截图。逐讲查看了默认图及全部端点的对照图；2.2、2.3、2.4 的极点显示改进后重新捕获并查看。另复验物理观察点点击和手绘采样位置。五张指定默认图保存于 [screenshots/P2-3](screenshots/P2-3/)。

机器可读结果见 [P2-3-validation.json](P2-3-validation.json)。原始默认/端点图及对照图保存在本仓库的 `outputs/slider-check/`、`outputs/P2-3-visual-review/`。

## MATLAB 尚未完成

初期有部分独立脚本运行成功，已查看其 PNG（包括 1.1.3、1.2.2、2.3）。随后主机内存耗尽并出现 MATLAB Java 分配失败；内存恢复后，新 MATLAB 进程仍停在启动阶段。单独执行 `-batch "disp('QA_PROBE_READY')"` 也没有进入语句。仓库内全新偏好目录、全新应用数据目录、显式指定已有许可证、软件 OpenGL 的探测均未恢复启动。Windows CIM/WMI 查询也同时挂起，但尚不能据此确定因果关系。

未修改 Windows 服务或仓库外的 MATLAB 设置。已将部分新结果保存在 `outputs/P2-3-matlab-partial/`，并恢复原有历史验收文件，避免把未完成的新运行混入旧证据。当前有限超时重试记录在 `outputs/P2-3-matlab-retry.log`：1.1.3-1 的两组独立进程均未进入脚本，60 秒后按失败处理。

已生成本轮全部 128 个两参数组图形脚本，保存在 `outputs/matlab-P2-3/P1/`、`outputs/matlab-P2-3/P2/`。另用 R2024b 的 `mlint.exe -id` 静态分析这 128 个脚本及两个重试脚本；仅报告 `NASGU`、`NOSEMI`、`AGROW`、`DEFNU`、`ALIGN`、`NBRAK2`、`CAXIS` 等建议，没有语法诊断。这不能替代 MATLAB 运行及数值比对。

MATLAB 启动恢复后执行以下两条命令，逐脚本各启动一个 R2024b `-batch` 进程，完成每幅图的两组参数数值与轴限比对，再逐张查看新生成 PNG：

```powershell
node scripts/check-matlab-models.mjs --figures-only --out=specs/redesign/matlab-check/P2-3/P1
node scripts/check-matlab-models.mjs --batch=P2 --figures-only --out=specs/redesign/matlab-check/P2-3/P2
```

启动诊断参考 MathWorks 的 [启动问题排查说明](https://www.mathworks.com/help/matlab/matlab_env/resolve-startup-issues.html)。本轮仅采用了可在仓库内隔离的诊断方法。

全程保持 `redesign/p3-ch3b`，没有推送、修改历史或操作 stash；相邻教学资料目录只读。
