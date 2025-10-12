# Stage 1: build Next.js app with standalone output
FROM node:20-alpine AS builder
WORKDIR /app/apps/web

COPY apps/web/package*.json ./
RUN npm install --production=false

COPY apps/web ./
RUN npm run build

# Stage 2: production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
