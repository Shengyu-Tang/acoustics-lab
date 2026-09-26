# 声学基础 · 唐胜雨

中国海洋大学声学基础交互学习网站。

**网站：[进入声学实验室](https://shengyu-tang.github.io/acoustics-lab/)**

- 82个知识点入口，LaTeX 核心公式、物理动画和可调参数。
- 工程任务书：项目背景、模型对应、三维工程场景、定量曲线及工程判断。
- 全展开球形知识网络：三维旋转、缩放、平移、学习递进与跨章联系说明。
- 学期月历总览和逐周、逐次课程安排。
- 无需注册登录，无在线评论或后端服务。建议反馈：tangshengyu@ouc.edu.cn。

## 本地开发

```sh
npm ci
npm run dev
npm test
node scripts/check-animations.mjs
npm run build
```

GitHub Actions 自动构建并发布 main 分支到 GitHub Pages。源码见 src/，静态构建产物为 docs/。

教学依据、版本差异、案例假设及历史架构记录统一存放于 [维护文档](MAINTAINER_NOTES.md)，不在教学网页中展示维护备注。旧认证源码仅作历史保留，不进入当前网站应用。
