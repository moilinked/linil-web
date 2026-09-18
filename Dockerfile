ARG NODE_IMAGE=docker.m.daocloud.io/library/node:22-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_NPM_REGISTRY=https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN corepack enable \
  && corepack prepare pnpm@11.9.0 --activate \
  && printf '%s\n' \
       'registry=https://registry.npmmirror.com' \
       'node-linker=hoisted' \
       > .npmrc \
  && pnpm install --frozen-lockfile

FROM ${NODE_IMAGE} AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN ./node_modules/.bin/next build --webpack

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Asia/Shanghai \
    PORT=3030 \
    HOSTNAME=0.0.0.0

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3030

CMD ["node", "server.js"]
