# ====== Base Image ======
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install required dependencies
RUN apk update && apk add --no-cache libc6-compat openssl

# ====== Builder Stage ======
FROM base AS builder

# Install Turbo globally
RUN npm install -g turbo@^2.1.3

# Copy the entire monorepo
COPY . .

# Prune the workspace to only include necessary files for `primary-backend`
RUN turbo prune --scope=@flowcatalyst/primary-backend --docker

# ====== Installer Stage ======
FROM base AS installer
# RUN apk update && apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ ./

# Install dependencies **without devDependencies** for production
RUN npm install --omit=dev --ignore-scripts

# # Install Turbo before installing dependencies
# RUN npm install -g turbo@^2.1.3
#
# # Install all dependencies (including devDependencies for Prisma)
# RUN npm install --ignore-scripts
#
# # Manually install Prisma globally
# RUN npm install -g prisma

# Copy turbo.json explicitly (important for Turbo commands)
COPY --from=builder /app/out/full/turbo.json ./turbo.json

# Copy the full pruned workspace
COPY --from=builder /app/out/full/ ./

# Generate Prisma Client before building
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Run build (compiles `database` first)
RUN npm run build --workspace=@flowcatalyst/database && npm run build --workspace=@flowcatalyst/primary-backend

# ====== Runner Stage (Final Production Image) ======
FROM base AS runner

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs

# Copy built application and dependencies as root (to be fixed later)
COPY --from=installer /app/apps/primary-backend ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/primary-backend/dist ./dist
COPY --from=installer /app/package.json ./package.json

# Ensure Prisma migrations are applied
COPY --from=installer /app/packages/database/prisma ./packages/database/prisma
COPY --from=installer /app/packages/database ./packages/database

# Change ownership of /app to the expressjs user
RUN chown -R expressjs:expressjs /app

# Switch to non-root user
USER expressjs

# Reinstall dependencies to fix permissions issue
RUN npm rebuild --omit=dev --ignore-scripts

# Expose the port the app will run on
EXPOSE 4000

# Start the app with Prisma migrations
CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma && node dist/index.js"]

# Start the app
# CMD ["node", "dist/index.js"]
# CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma && node dist/index.js"]

