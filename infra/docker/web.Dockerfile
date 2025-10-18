FROM node:20-alpine

RUN corepack enable \
  && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web/

EXPOSE 3000

CMD ["pnpm", "run", "start"]
