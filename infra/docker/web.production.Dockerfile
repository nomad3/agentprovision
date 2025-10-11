# Stage 1: install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
# Copy over the package.json files for all packages
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# Stage 2: build application
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY . .
# Re-install to link local workspaces like `lib`
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter web...

# Stage 3: production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/tsconfig.json
RUN pnpm install --prod --filter web --no-frozen-lockfile --ignore-scripts
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
