# 声学基础 · 唐胜雨

中国海洋大学声学基础交互学习网站。

**网站：[进入声学实验室](https://shengyu-tang.github.io/acoustics-lab/)**

- 82个知识点入口，LaTeX 核心公式、物理动画和可调参数。
- 工程任务书：项目背景、模型对应、三维工程场景、定量曲线及工程判断。
- 全展开球形知识网络：三维旋转、缩放、平移、学习递进与跨章联系说明。
- 学期月历总览和逐周、逐次课程安排。
- 无需注册登录，无在线评论或后端服务。建议反馈：tangshengyu@ouc.edu.cn。

P0 改版：课程主页为章节目录；知识点页使用可折叠章节树、讲义正文和本页目录。1.2.4、1.2.5 已实现专属图、编号公式、慕课思考题和可判分的船载仪器支架例题。其余讲次保留原有模型与内容，曲线统一通过 `src/plot/` 绘制，可导出 PNG、CSV 和 MATLAB 脚本。绘图组件演示：`#/plot-demo`。

## 本地开发

```sh
npm ci
npm run dev
npm test
node scripts/check-animations.mjs
npm run build
```

`npm run format:check` 检查代码格式。`node scripts/check-browser.mjs` 在本机已安装的 Microsoft Edge 中检查构建产物、交互与两种视口，并更新 `screenshots/p0/`；浏览器配置和下载文件仅写入仓库内的 `outputs/`。`node scripts/generate-thumbnails.mjs` 从共享绘图组件生成课程目录缩略图。

GitHub Actions 自动构建并发布 main 分支到 GitHub Pages。源码见 src/，静态构建产物为 docs/。

教学依据、版本差异、案例假设及历史架构记录统一存放于 [维护文档](MAINTAINER_NOTES.md)，不在教学网页中展示维护备注。历史认证与后端源码已移除，可从 Git 历史追溯。
