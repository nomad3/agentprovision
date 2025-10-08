FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/web/package.json apps/web/

RUN pnpm install --ignore-scripts

COPY . .

RUN pnpm build --filter web...

EXPOSE 3000

CMD ["pnpm", "dev", "--filter", "web"]
