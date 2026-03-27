FROM node:20-alpine AS builder
WORKDIR /app

# Railway may build this Dockerfile with repository root as context.
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install
COPY backend ./backend

WORKDIR /app/backend
RUN npm run build

FROM node:20-alpine
WORKDIR /app/backend
ENV NODE_ENV=production

COPY package*.json /app/
COPY backend/package*.json ./
RUN cd /app && npm install --omit=dev

COPY --from=builder /app/backend/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
