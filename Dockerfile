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
RUN npm ci --omit=dev && npm install tsx
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.node.json ./tsconfig.node.json

# Copy drizzle migrations if they exist (generated via npm run db:generate)
RUN mkdir -p ./drizzle

EXPOSE 3001

# Create artifact storage directory (Railway Volume mounts here)
RUN mkdir -p /data/artifacts
ENV STORAGE_PATH=/data/artifacts

# Start server (migrations run if DATABASE_URL + drizzle dir present)
CMD ["sh", "-c", "npx tsx server/index.ts"]
