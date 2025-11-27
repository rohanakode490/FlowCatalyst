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
COPY --from=installer --chown=processor:processor /app/packages/database ./packages/database

# Start the app
CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma && node dist/index.js"]
