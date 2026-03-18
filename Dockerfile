# ============================================
# Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY prisma ./prisma

RUN npx prisma generate --schema ./prisma/schema.prisma

COPY src ./src
RUN yarn build

# ============================================
# Produção
# ============================================
FROM node:20-alpine AS production

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

# Cria grupo e usuário sem privilégios
RUN addgroup --system --gid 1001 nestjs && \
    adduser  --system --uid 1001 --ingroup nestjs nestjs

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean

COPY --from=builder /usr/src/app/dist         ./dist
COPY --from=builder /usr/src/app/prisma       ./prisma
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Permissões restritas na pasta da aplicação
RUN chown -R nestjs:nestjs /usr/src/app && \
    chmod -R 550 /usr/src/app

# Limita /tmp — monta como tmpfs somente para o processo
# (no docker-compose ou k8s use tmpfs mount, aqui limpamos e restringimos)
RUN rm -rf /tmp/* && \
    chmod 700 /tmp

EXPOSE 7000

USER nestjs

CMD ["node", "dist/main.js"]