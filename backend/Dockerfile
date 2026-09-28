# Build stage
FROM node:20-alpine AS builder

# Prisma's query engine needs OpenSSL on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# prisma CLI is a runtime dependency so `migrate deploy` uses the pinned version
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3000

# Apply pending migrations, then start. Seed separately: `npm run db:seed:prod`
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
