# Base image to avoid redundant downloads
FROM node:18-alpine AS base

# ====== Builder Stage ======
FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Install Turbo globally using npm
RUN npm install -g turbo@^2.1.3

# Copy the entire monorepo
COPY . .

# Prune the workspace to keep only what's necessary for @flowcatalyst/frontend
RUN turbo prune --scope=@flowcatalyst/frontend --docker

# ====== Installer Stage ======
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ .

# Install Turbo before installing dependencies
RUN npm install -g turbo@^2.1.3

# Install only necessary dependencies
RUN npm install --omit=dev --ignore-scripts

# Copy turbo.json explicitly (important for Turbo commands)
COPY --from=builder /app/out/full/turbo.json ./turbo.json

# Copy the pruned workspace and build it
COPY --from=builder /app/out/full/ .
RUN turbo run build --filter=@flowcatalyst/frontend...

# ====== Runner Stage (Final Production Image) ======
FROM base AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy only the built Next.js standalone files
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

# Expose Next.js default port
EXPOSE 3000

# Start the Next.js app in standalone mode
CMD ["node", "apps/frontend/server.js"]
