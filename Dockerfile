FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN yarn

COPY prisma ./prisma
RUN yarn prisma generate

COPY . .
RUN yarn build


FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 7000

CMD ["node", "dist/main.js"]