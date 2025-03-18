# ====== Python Base ======
FROM python:3.11-slim AS python-base
RUN apt-get update && apt-get install -y gcc python3-dev libffi-dev musl-dev
RUN pip install --upgrade pip
COPY apps/hooks/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# RUN pip install -r requirements.txt

# ====== Node Base ======
FROM node:20-alpine AS base

# ====== Builder Stage ======
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install Turbo globally FIRST
RUN npm install -g turbo@^2.1.3

# Copy ALL required root files
COPY package.json package-lock.json turbo.json .npmrc* ./

# Now copy the rest
COPY apps/hooks ./apps/hooks
COPY packages ./packages

# Prune the workspace
RUN turbo prune --scope=@flowcatalyst/hooks --docker

# ====== Installer Stage ======
FROM base AS installer
WORKDIR /app

# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/package-lock.json .

# Install production dependencies
RUN npm install -g turbo@^2.1.3
RUN npm install --omit=dev --ignore-scripts

# Copy pruned workspace
COPY --from=builder /app/out/full/ .

# Copy Python dependencies
COPY --from=python-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-base /usr/local/bin /usr/local/bin

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the app
RUN turbo run build --filter=@flowcatalyst/hooks...

# ====== Runner Stage ======
FROM base AS runner
WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Create a non-root user
RUN addgroup --system --gid 1001 expressjs && adduser --system --uid 1001 expressjs
USER expressjs

# Copy built files
COPY --from=installer --chown=expressjs:expressjs /app/apps/hooks/dist ./dist
COPY --from=installer --chown=expressjs:expressjs /app/node_modules ./node_modules
COPY --from=installer --chown=expressjs:expressjs /app/apps/hooks/src/scraper.py ./src/scraper.py

# Copy Prisma schema and migrations
COPY --from=installer --chown=expressjs:expressjs /app/packages/database ./packages/database

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "dist/index.js"]

# # ====== Base Image ======
# FROM node:18-alpine AS base
#
# # Set the working directory
# WORKDIR /app
#
# # Install required dependencies
# RUN apk update && apk add --no-cache libc6-compat openssl
#
# # ====== Builder Stage ======
# FROM base AS builder
#
# # Install Turbo globally
# RUN npm install -g turbo@^2.1.3
#
# # Copy the entire monorepo
# COPY . .
#
# # Prune the workspace for the hooks app
# RUN turbo prune --scope=@flowcatalyst/hooks --docker
#
# # ====== Installer Stage ======
# FROM base AS installer
# RUN apk update && apk add --no-cache libc6-compat openssl
#
# # Set working directory
# WORKDIR /app
#
# # Copy pruned package.json and lockfile
# COPY --from=builder /app/out/json/ ./
#
# # Install dependencies **without devDependencies** for production
# RUN npm install --omit=dev --ignore-scripts
#
# # Install Turbo before installing dependencies
# RUN npm install -g turbo@^2.1.3
#
# # Install all dependencies (including devDependencies for Prisma)
# RUN npm install --ignore-scripts
#
# # Manually install Prisma globally
# RUN npm install -g prisma
#
# # Copy turbo.json explicitly (important for Turbo commands)
# COPY --from=builder /app/out/full/turbo.json ./turbo.json
#
# # Copy the full pruned workspace
# COPY --from=builder /app/out/full/ ./
#
# # Generate Prisma Client before building
# RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
#
# # Run build (compiles `database` first)
# RUN npm run build --workspace=@flowcatalyst/database && npm run build --workspace=@flowcatalyst/hooks
#
# # ====== Runner Stage (Final Production Image) ======
# FROM base AS runner
#
# # Set working directory
# WORKDIR /app
#
# # Create a non-root user for security
# RUN addgroup --system --gid 1001 expressjs
# RUN adduser --system --uid 1001 expressjs
#
# # Copy built application and dependencies as root (to be fixed later)
# COPY --from=installer /app/apps/hooks ./
# COPY --from=installer /app/node_modules ./node_modules
# COPY --from=installer /app/apps/hooks/dist ./dist
# COPY --from=installer /app/package.json ./package.json
#
# # Ensure Prisma migrations are applied
# COPY --from=installer /app/packages/database/prisma ./packages/database/prisma
# COPY --from=installer /app/packages/database ./packages/database
#
# # Change ownership of /app to the expressjs user
# RUN chown -R expressjs:expressjs /app
#
# # Switch to non-root user
# USER expressjs
#
# # Reinstall dependencies to fix permissions issue
# RUN npm rebuild --omit=dev --ignore-scripts
#
# # Expose the port the app runs on
# EXPOSE 5000
#
# # Start the app
# CMD ["node", "dist/index.js"]
