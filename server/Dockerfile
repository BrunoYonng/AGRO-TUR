# syntax=docker/dockerfile:1.7

FROM node:22-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY server .

RUN npm run db:generate \
    && chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3333

USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
