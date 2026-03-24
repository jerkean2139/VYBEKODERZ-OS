# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Create artifact storage directory (Railway Volume mounts here)
RUN mkdir -p /data/artifacts
ENV STORAGE_PATH=/data/artifacts
ENV NODE_ENV=production

# Start pre-compiled server (no tsx needed at runtime)
CMD ["node", "dist-server/index.mjs"]
