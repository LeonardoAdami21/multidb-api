# ============================================
# 1. Builder stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

# Tudo como root, sem troca de usuário no builder
RUN yarn install --frozen-lockfile
RUN npx prisma generate
RUN npx nest build

# ============================================
# 2. Production stage (LEAN)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 7000

CMD ["node", "dist/main.js"]