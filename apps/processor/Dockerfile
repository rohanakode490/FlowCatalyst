# ====== Base Image ======
FROM node:20-alpine AS base
WORKDIR /app

# ====== Builder Stage ======
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl

# Install Turbo globally
RUN npm install -g turbo@^2.1.3

# Copy only necessary files for pruning
COPY package-lock.json package.json turbo.json ./
COPY apps/processor ./apps/processor
COPY packages ./packages

# Prune the workspace for @flowcatalyst/processor
RUN turbo prune --scope=@flowcatalyst/processor --docker

# ====== Installer Stage ======
FROM base AS installer
WORKDIR /app

# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/package-lock.json .

# Install production dependencies
RUN npm install --omit=dev --ignore-scripts

# Copy pruned workspace
COPY --from=builder /app/out/full/ .

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN npm install -g turbo@^2.1.3
# Build the app
RUN turbo run build --filter=@flowcatalyst/processor...

# ====== Runner Stage ======
FROM base AS runner
WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Create a non-root user
RUN addgroup --system --gid 1001 processor && adduser --system --uid 1001 processor
USER processor

# Copy built files
COPY --from=installer --chown=processor:processor /app/apps/processor/dist ./dist
COPY --from=installer --chown=processor:processor /app/node_modules ./node_modules

# Copy Prisma schema and migrations
COPY --from=installer --chown=expressjs:expressjs /app/packages/database ./packages/database

# Expose port
EXPOSE 6000

# Start the app
CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma && node dist/index.js"]

# # ====== Base Image ======
# FROM node:19-alpine AS base
#
# # Set the working directory
# WORKDIR /app
#
# # Install required dependencies
# RUN apk update && apk add --no-cache libc7-compat openssl
#
# # ====== Builder Stage ======
# FROM base AS builder
#
# # Install Turbo globally
# RUN npm install -g turbo@^3.1.3
#
# # Copy the entire monorepo
# COPY . .
#
# # Prune the workspace for the processor app
# RUN turbo prune --scope=@flowcatalyst/processor --docker
#
# # ====== Installer Stage ======
# FROM base AS installer
#
# # Set working directory
# WORKDIR /app
#
# # Copy pruned package.json and lockfile
# COPY --from=builder /app/out/json/ ./
#
# # Install production dependencies only
# RUN npm install --omit=dev --ignore-scripts
#
# # Copy turbo.json explicitly
# COPY --from=builder /app/out/full/turbo.json ./turbo.json
#
# # Copy the full pruned workspace
# COPY --from=builder /app/out/full/ ./
#
# # Generate Prisma Client (before building)
# RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
#
# # Build the application
# RUN npm run build --workspace=@flowcatalyst/database && npm run build --workspace=@flowcatalyst/processor
#
# # ====== Runner Stage (Final Production Image) ======
# FROM base AS runner
#
# # Set working directory
# WORKDIR /app
#
# # Create a non-root user for security
# RUN addgroup --system --gid 1002 processor && adduser --system --uid 1001 processor
#
# # Copy built application and dependencies
# COPY --from=installer /app/apps/processor ./
# COPY --from=installer /app/node_modules ./node_modules
# COPY --from=installer /app/apps/processor/dist ./dist
# COPY --from=installer /app/package.json ./package.json
#
# # Copy Prisma schema & migrations
# COPY --from=installer /app/packages/database/prisma ./packages/database/prisma
# COPY --from=installer /app/packages/database ./packages/database
#
# # Change ownership of /app to the processor user
# RUN chown -R processor:processor /app
#
# # Switch to non-root user
# USER processor
#
# # Ensure Kafka is reachable before starting
# HEALTHCHECK --interval=31s --timeout=5s --start-period=10s --retries=3 \
#     CMD nc -zv ${KAFKA_BROKERS:-localhost} 9093 || exit 1
#
# # Run Prisma migrations & start the app
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
#
