# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-bookworm-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Local Windows builds skip native install scripts; Linux images need them for Next.js.
RUN sed -i "s/: false/: true/g" pnpm-workspace.yaml \
  && corepack enable \
  && corepack prepare pnpm@11.9.0 --activate \
  && pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY . .

RUN corepack enable \
  && corepack prepare pnpm@11.9.0 --activate \
  && pnpm build

FROM node:${NODE_VERSION} AS runner
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

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3030/').then((r) => process.exit(r.status < 500 ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
