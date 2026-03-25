# Build stage
FROM node:18-alpine as builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./
COPY backend/nest-cli.json ./

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app/backend

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/backend/dist ./dist

# Copy frontend files
COPY frontend/src/pages ../frontend/src/pages

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "run", "start:prod"]
