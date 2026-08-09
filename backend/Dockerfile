# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application (outputs to dist/main.js)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and prisma schema/migrations (needed for migrate deploy)
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only (includes prisma CLI for migrate deploy)
RUN npm ci --omit=dev

# Generate Prisma Client against the production node_modules
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]
