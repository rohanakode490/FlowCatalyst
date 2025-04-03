# # ==# ====== Python Base ======
FROM python:3.11-slim AS python-base

# Install system dependencies including build essentials
 RUN apt-get update && apt-get install -y gcc python3-dev libffi-dev musl-dev


RUN pip install --upgrade pip
COPY apps/hooks/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# Create and activate virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies
WORKDIR /app
COPY apps/hooks/requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -r requirements.txt

# ====== Node Base ======
FROM node:20-alpine AS base

# ====== Builder Stage ======
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install Turbo
RUN npm install -g turbo@^2.1.3

# Copy package files
COPY package.json package-lock.json turbo.json .npmrc* ./

# Copy source files
COPY apps/hooks ./apps/hooks
COPY packages ./packages

# Prune workspace
RUN turbo prune --scope=@flowcatalyst/hooks --docker

# ====== Installer Stage ======
FROM base AS installer
WORKDIR /app

# Copy pruned files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/package-lock.json .

# Install dependencies
RUN npm install -g turbo@^2.1.3
RUN npm install --omit=dev --ignore-scripts

# Copy full workspace
COPY --from=builder /app/out/full/ .

# Copy Python virtual environment
COPY --from=python-base /opt/venv /opt/venv

# Set Python environment variables
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the app
RUN turbo run build --filter=@flowcatalyst/hooks...

# ====== Runner Stage ======
FROM base AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl python3

# Copy Python virtual environment
COPY --from=installer --chown=node:node /opt/venv /opt/venv

# Set Python environment variables
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy built files and Python scraper
COPY --from=installer --chown=node:node /app/apps/hooks/dist ./dist
COPY --from=installer --chown=node:node /app/apps/hooks/src/scraper.py ./dist/
COPY --from=installer --chown=node:node /app/node_modules ./node_modules

# Copy Prisma schema
COPY --from=installer --chown=node:node /app/packages/database ./packages/database

# Switch to non-root user
USER node

EXPOSE 5000
CMD ["node", "dist/index.js"]

# ==== Python Base ======
# FROM python:3.11-slim AS python-base
# RUN apt-get update && apt-get install -y gcc python3-dev libffi-dev musl-dev
# RUN pip install --upgrade pip
# COPY apps/hooks/requirements.txt .
# RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# # RUN pip install -r requirements.txt
#
# # ====== Node Base ======
# FROM node:20-alpine AS base
#
# # ====== Builder Stage ======
# FROM base AS builder
# RUN apk add --no-cache libc6-compat openssl
# WORKDIR /app
#
# # Install Turbo globally FIRST
# RUN npm install -g turbo@^2.1.3
#
# # Copy ALL required root files
# COPY package.json package-lock.json turbo.json .npmrc* ./
#
# # Now copy the rest
# COPY apps/hooks ./apps/hooks
# COPY packages ./packages
#
# # Prune the workspace
# RUN turbo prune --scope=@flowcatalyst/hooks --docker
#
# # ====== Installer Stage ======
# FROM base AS installer
# WORKDIR /app
#
# # Copy pruned package.json and lockfile
# COPY --from=builder /app/out/json/ .
# COPY --from=builder /app/package-lock.json .
#
# # Install production dependencies
# RUN npm install -g turbo@^2.1.3
# RUN npm install --omit=dev --ignore-scripts
#
# # Copy pruned workspace
# COPY --from=builder /app/out/full/ .
#
# # Copy Python dependencies
# COPY --from=python-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
# COPY --from=python-base /usr/local/bin /usr/local/bin
#
# # Generate Prisma Client
# RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
#
# # Build the app
# RUN turbo run build --filter=@flowcatalyst/hooks...
#
# # ====== Runner Stage ======
# FROM base AS runner
# WORKDIR /app
#
# # Install OpenSSL (required for Prisma)
# RUN apk add --no-cache openssl
#
# # Create a non-root user
# RUN addgroup --system --gid 1001 expressjs && adduser --system --uid 1001 expressjs
# USER expressjs
#
# # Copy built files
# COPY --from=installer --chown=expressjs:expressjs /app/apps/hooks/dist ./dist
# COPY --from=installer --chown=expressjs:expressjs /app/node_modules ./node_modules
# COPY --from=installer --chown=expressjs:expressjs /app/apps/hooks/src/scraper.py ./src/scraper.py
#
# # Copy Prisma schema and migrations
# COPY --from=installer --chown=expressjs:expressjs /app/packages/database ./packages/database
#
# # Expose port
# EXPOSE 5000
#
# # Start the app
# CMD ["node", "dist/index.js"]
#
