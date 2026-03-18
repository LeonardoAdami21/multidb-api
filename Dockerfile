# ============================================
# 1. Builder stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack (Yarn managed properly)
RUN corepack enable

# Install deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy configs
COPY tsconfig*.json ./
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY src ./src
RUN yarn build

# ============================================
# 2. Production stage (LEAN)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Only required runtime dependency
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

# Copy ONLY what we need
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Fix permissions safely
RUN chown -R nestjs:nodejs /app

# Proper tmp permissions (important!)
RUN chmod 1777 /tmp

# Switch to non-root
USER nestjs

EXPOSE 7000

CMD ["node", "dist/main.js"]