FROM oven/bun:1.4.4-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN bun run build

FROM oven/bun:1.4.4-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/dist ./dist
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD wget -qO- http://localhost:3000/health >/dev/null || exit 1
CMD ["bun", "dist/server.js"]
