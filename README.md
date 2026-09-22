# Chat Agent Web

`chat-agent` 的配套前端，使用 Next.js App Router、React、TypeScript、Tailwind CSS 和 shadcn/ui。

项目分为 Chat、Notes 和 Works 三个模块。当前已提供 Chat 页面与 Go API 代理，Notes 和 Works 可继续接入 MDX、数据库或 Headless CMS。

## 技术栈

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- pnpm

## 本地开发

```powershell
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

访问 `http://localhost:3000`，根路径会跳转到 `/chat`。

`pnpm dev` 会连接两个本地后端：Chat Agent 负责对话，站点服务负责登录和账号。请先启动这两个后端。地址写在环境变量里，不在这里列出。

## 环境变量

`CHAT_API_URL` 指向 chat 后端，`SITE_API_URL` 指向 site 后端。具体地址放在 `.env.development` 或部署用的 `.env` 中，只在 Next.js 服务端读取。浏览器仍请求本站 `/api/*`，由 Route Handler 按路径转发：登录和账号走 site，对话和会话走 chat。这样不会把真实后端地址暴露给浏览器，也不需要为浏览器配置跨域。未设置 `CHAT_API_URL` 时仍兼容旧变量 `API_URL`。

## 项目结构

```text
src/
├── app/
│   ├── (site)/
│   │   ├── chat/
│   │   ├── login/
│   │   ├── notes/
│   │   └── works/
│   └── api/
│       ├── auth/
│       └── chat/
├── components/
│   ├── content/
│   ├── layout/
│   └── ui/
├── config/
├── features/
│   ├── auth/
│   └── chat/
└── lib/
```

- `app`：路由、页面、布局和服务端 Route Handler。
- `features`：按业务功能组织交互逻辑、类型和组件。
- `components/ui`：shadcn/ui 基础组件。
- `components/layout`：站点级布局组件。
- `components/content`：Notes 与 Works 可复用的内容展示组件。
- `config`：站点名称、导航等静态配置。

## Docker 部署

本机打包：

```powershell
pnpm docker:pack
```

### 第一次

上传 `dist/chat-agent-web-<version>-<timestamp>.zip`，在服务器解压后：

```bash
cp env.example .env
bash load-and-up.sh
```

`docker-compose.yml`、`.env` 留在服务器目录，以后不用再传。

### 以后更新

只上传 `dist/chat-agent-web.tar`，覆盖服务器上同名文件，然后在该目录：

```bash
docker load -i chat-agent-web.tar
docker compose up -d --force-recreate
```

或直接 `bash load-and-up.sh`。

网络 `backend-chat-agent` 里的容器是 `chat-agent`，网络 `backend-site` 里的容器是 `site`。`CHAT_API_URL` 和 `SITE_API_URL` 用容器名，`CHAT_AGENT_NETWORK` 和 `SITE_NETWORK` 用网络名。前端 compose 只加入这两张已有网络。

调用链：`浏览器 / Nginx → 127.0.0.1:3030 前端容器 → chat 或 site 后端容器`。

## 验证

```powershell
pnpm lint
pnpm build
```

## 后续演进

- 对接后端 `POST /api/chat`
- 增加流式响应和会话管理
- 为 Notes 和 Works 选择 MDX、数据库或 CMS
- 增加内容索引、标签、搜索和 SEO 元数据
