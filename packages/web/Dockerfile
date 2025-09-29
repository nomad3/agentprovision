# syntax=docker/dockerfile:1

FROM node:22-alpine

WORKDIR /app

# Copy package manifest(s). Use wildcard to tolerate missing lockfile.
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]
