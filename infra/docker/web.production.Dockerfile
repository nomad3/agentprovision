# Stage 1: build Next.js app with standalone output
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN pnpm install --filter web --frozen-lockfile
RUN pnpm --filter web build

# Stage 2: production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable

COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
