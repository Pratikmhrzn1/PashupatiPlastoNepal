# syntax=docker/dockerfile:1

# Build context is the monorepo root:
#   docker build -f backend/Dockerfile -t pashupati-api .
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

FROM base AS development
RUN npm ci
COPY backend ./backend
WORKDIR /app/backend
CMD ["npm", "run", "start:dev"]

FROM base AS builder
RUN npm ci
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate && npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspace @pashupati/api
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "dist/main.js"]
