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

`pnpm dev` 会连接本地 Chat Agent：`http://localhost:9998`。请先启动该地址上的后端。

## 环境变量

```dotenv
API_URL=http://localhost:9998
```

该变量只在 Next.js 服务端读取。浏览器请求 `/api/chat`，由 Route Handler 转发到 Go 后端，避免暴露真实后端地址并减少跨域配置。

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

前端可单独启动。后端容器名为 `chat-agent`，共用网络 `chat-agent_default`（前端 compose 会自行创建）。后端起来后若还不在该网络上：

```bash
docker network connect chat-agent_default chat-agent
```

```dotenv
API_URL=http://chat-agent:9998
```

调用链：`浏览器 / Nginx → 127.0.0.1:3030 前端容器 → chat-agent:9998 后端容器`。

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
