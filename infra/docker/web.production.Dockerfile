# 1. Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# 2. Deps stage: Install all dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# 3. Builder stage: Build the web application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter web

# 4. Runner stage: Create the final, small production image
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable

# Copy only the necessary production assets from the builder stage
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/public ./apps/web/public

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "start"]