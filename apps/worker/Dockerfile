# ====== Base Image ======
FROM node:20-alpine AS base

# ====== Builder Stage ======
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Install Turbo globally
RUN npm install -g turbo@^2.1.3

# Copy the entire monorepo
COPY package-lock.json package.json turbo.json .npmrc* ./
COPY apps/worker ./apps/worker
COPY packages ./packages

# Prune the workspace for the worker app
RUN turbo prune --scope=@flowcatalyst/worker --docker

# ====== Installer Stage ======
FROM base AS installer

# Set working directory
WORKDIR /app

# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ ./
COPY --from=builder /app/package-lock.json .

# Install production dependencies only
RUN npm install -g turbo@^2.1.3
RUN npm install --omit=dev 
RUN npm install -g dotenv 
RUN npm install dotenv-extended
RUN npm install googleapis@^155.0.0
# Copy turbo.json explicitly
# COPY --from=builder /app/out/full/turbo.json ./turbo.json

# Copy the full pruned workspace
COPY --from=builder /app/out/full/ ./

# Generate Prisma Client (before building)
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the application
RUN turbo run build --filter=@flowcatalyst/worker...
# RUN npm run build --workspace=@flowcatalyst/database && npm run build --workspace=@flowcatalyst/worker
# RUN ls -la node_modules | grep dotenv

# Verify dependencies
RUN ls -la node_modules | grep -E "dotenv|dotenv-extended|googleapis"

# ====== Runner Stage (Final Production Image) ======
FROM base AS runner

# Set working directory
WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Create a non-root user for security
RUN addgroup --system --gid 1001 worker && adduser --system --uid 1001 worker

# Switch to non-root user
USER worker

# Copy built application and dependencies
# COPY --from=installer /app/apps/worker ./
COPY --from=installer --chown=worker:worker /app/apps/worker/dist ./dist
COPY --from=installer --chown=worker:worker /app/node_modules ./node_modules
# COPY --from=installer /app/package.json ./package.json

# Copy Prisma schema & migrations
# COPY --from=installer /app/packages/database/prisma ./packages/database/prisma
COPY --from=installer --chown=worker:worker /app/packages/database ./packages/database

# Change ownership of /app to the worker user
# RUN chown -R worker:worker /app

# Run Prisma migrations & start the app
CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma && node dist/index.js"]

