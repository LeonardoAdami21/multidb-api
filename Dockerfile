# ============================================
# 1. Builder stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY tsconfig*.json ./
COPY prisma ./prisma

RUN chown -R nestjs:nodejs /app && chmod 1777 /tmp

# ✅ CORREÇÃO PRINCIPAL: define cache do Yarn dentro do /app
# onde o usuário nestjs tem permissão de escrita
ENV YARN_CACHE_FOLDER=/app/.yarn-cache

USER nestjs

RUN yarn prisma generate

COPY --chown=nestjs:nodejs src ./src
RUN yarn build

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

RUN chown -R nestjs:nodejs /app && chmod 1777 /tmp

USER nestjs

EXPOSE 7000

CMD ["node", "dist/main.js"]