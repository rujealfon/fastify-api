FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g @nubjs/nub

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN nub install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN nub run build

FROM node:22-alpine AS production
WORKDIR /app
RUN npm install -g @nubjs/nub
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN nub install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
EXPOSE 8000
CMD ["node", "dist/server.js"]
