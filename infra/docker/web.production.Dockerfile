# Stage 1: build Next.js app with standalone output
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/web/package*.json ./
RUN npm install

COPY apps/web ./
RUN npm run build

# Stage 2: production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
