FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages ./packages

RUN pnpm install --filter web --frozen-lockfile

COPY . .

RUN pnpm --filter web build

RUN pnpm --filter web install --prod --frozen-lockfile --no-optional

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
