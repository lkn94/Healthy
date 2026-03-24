# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
RUN apk add --no-cache openssl
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache openssl
ENV DB_URL="file:../data/app.db"
COPY backend/package*.json ./
RUN npm install
COPY backend ./
COPY --from=frontend-builder /app/frontend/dist ./public
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/public ./public
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
