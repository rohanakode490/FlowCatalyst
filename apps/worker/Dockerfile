# ====== Base Image ======
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app

# Install required dependencies
RUN apk update && apk add --no-cache libc6-compat openssl

# ====== Builder Stage ======
FROM base AS builder

# Install Turbo globally
RUN npm install -g turbo@^2.1.3

# Copy the entire monorepo
COPY . .

# Prune the workspace for the worker app
RUN turbo prune --scope=@flowcatalyst/worker --docker

# ====== Installer Stage ======
FROM base AS installer

# Set working directory
WORKDIR /app

# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ ./

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts

# Copy turbo.json explicitly
COPY --from=builder /app/out/full/turbo.json ./turbo.json

# Copy the full pruned workspace
COPY --from=builder /app/out/full/ ./

# Generate Prisma Client (before building)
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the application
RUN npm run build --workspace=@flowcatalyst/database && npm run build --workspace=@flowcatalyst/worker

# ====== Runner Stage (Final Production Image) ======
FROM base AS runner

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 worker && adduser --system --uid 1001 worker

# Copy built application and dependencies
COPY --from=installer /app/apps/worker ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/worker/dist ./dist
COPY --from=installer /app/package.json ./package.json

# Copy Prisma schema & migrations
COPY --from=installer /app/packages/database/prisma ./packages/database/prisma
COPY --from=installer /app/packages/database ./packages/database

# Change ownership of /app to the worker user
RUN chown -R worker:worker /app

# Switch to non-root user
USER worker

# Ensure Kafka is reachable before starting
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD nc -zv ${KAFKA_BROKERS:-localhost} 9092 || exit 1

# Run Prisma migrations & start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

