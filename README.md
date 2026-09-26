# 声学基础 · 交互学习实验室

唐胜雨 · 中国海洋大学。公开网页和全部项目源码由 GitHub 托管，不依赖 ChatGPT 登录或托管。

## 功能

- 82 个知识点入口、核心公式、参数动画与工程案例；相邻知识点共用对应物理模型。
- 知识导图按课程 / 章节 / 知识点逐级展开，支持搜索、惯性拖动、鼠标滚轮、双指缩放和旋转、按钮及键盘操作。
- 24 次课教学日历与个人教学主页。
- 本站用户名和密码注册；恢复码找回密码；评论必须审核后公开。
- 仅 GitHub 数字 ID `155556685`（Shengyu-Tang）可成为所有者。所有者可任命、撤销本站协助管理员，协助管理员仅管理评论。

## 项目结构

`src/` 前端与教学模型；`backend/` Cloudflare Worker 和 D1 数据结构；`docs/` 已编译的 GitHub Pages 网页；`scripts/` 构建与验证脚本。

## 本地运行

Node.js 22.13+。执行 `npm ci`、`npm run dev`。`npm run build` 生成 `docs/`。GitHub Pages 使用 main 分支的 `/docs` 目录。所有路由采用 hash，手机直接打开深层链接或刷新不会返回 404。

## 后端部署（网站所有者名下）

1. 在 Cloudflare 创建 D1 数据库 `acoustics-lab`，将数据库 ID 填入 `backend/wrangler.jsonc`。
2. `npx wrangler d1 execute acoustics-lab --remote --file backend/schema.sql --config backend/wrangler.jsonc`。
3. 在 GitHub Settings → Developer settings → OAuth Apps 创建应用。Homepage URL 使用 GitHub Pages 网址；Authorization callback URL 使用 `https://<Worker域名>/api/auth/github/callback`。不申请仓库或邮箱权限。
4. 把 Client ID 填入 Worker 配置，通过 `npx wrangler secret put GITHUB_CLIENT_SECRET --config backend/wrangler.jsonc` 设置 secret，禁止提交到源码。
5. `npm run api:deploy`。将 `public/config.json` 的 `apiBase` 设置为 Worker HTTPS 地址，重新构建并提交。

后端未接入时，网页明确显示账号和讨论服务未接入，实验与导图仍可用；不会假装注册成功或在浏览器本地伪造审核。

## 安全与维护

- 密码采用独立随机盐及 WebCrypto PBKDF2-SHA256（100,000 次，适配 Workers WebCrypto 上限），最少 12 字符；不保存明文密码。若扩大到大规模或敏感场景，迁至支持 Argon2id 的专用认证后端。
- 随机会话 token 仅在当前标签页的 sessionStorage 保存；服务端仅存 SHA-256 摘要，学生 8 小时、所有者 2 小时过期。退出与恢复密码会撤销会话。站点禁用第三方脚本，评论只渲染纯文本。
- 采用 Bearer 会话而非跨站第三方 Cookie，兼容移动 Safari 的第三方 Cookie 限制。GitHub OAuth 使用 state cookie、PKCE，以及绑定前端 verifier 的一次性 60 秒交换票据。GitHub token 不持久存储。
- CORS 限定网站域名；写请求校验 Origin、JSON 内容类型和大小；认证及评论限流；SQL 参数化；角色每次请求从服务端读取。撤销管理员权限立即生效。
- 恢复码只有一次显示，服务端保存摘要；恢复后更换恢复码。无邮箱/手机号账号不能通过邮件找回。
- 不包含原课件 PDF、学生名单、成绩或试卷。本站只提供辅助教学，不自动生成正式成绩。

## 手机验收

覆盖 320、390、768、1440 像素宽度。重点检查导航展开、实验滑块、知识点切换、横屏/竖屏、导图手势、登录表单与审核操作。桌面响应式模拟不能代替实际 iOS / Android 设备和校园网络验收。

旧 ChatGPT 托管站暂时保留以免旧链接失效；本仓库的后端不共用旧站账号或数据库。
