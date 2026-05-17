# syntax=docker/dockerfile:1.7

# ---- base ----
FROM oven/bun:1.3-alpine AS base
WORKDIR /usr/src/app

# ---- install: production deps only ----
FROM base AS install
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# ---- release: minimal runtime ----
FROM base AS release
ENV NODE_ENV=production

COPY --from=install --chown=bun:bun /usr/src/app/node_modules ./node_modules
COPY --chown=bun:bun . .

RUN mkdir -p data && chown bun:bun data

LABEL org.opencontainers.image.source="https://github.com/shard-hq/shard"
LABEL org.opencontainers.image.licenses="AGPL-3.0-or-later"
LABEL org.opencontainers.image.description="Shard — self-hostable Discord bot"

USER bun
CMD ["bun", "run", "start"]
