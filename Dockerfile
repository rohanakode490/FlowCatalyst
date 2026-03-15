# Use Node.js base image
FROM node:20-slim AS base

# Install Python and other necessary tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Turbo globally
RUN npm install -g turbo@^2.1.3

# ====== Builder Stage ======
FROM base AS builder
# Copy package files for pruning
COPY . .
RUN turbo prune --scope=@flowcatalyst/server --docker

# ====== Installer Stage ======
FROM base AS installer
WORKDIR /app

# Copy pruned package.json and lockfile from builder
COPY --from=builder /app/out/json/ .

# Install dependencies
RUN npm ci

# Copy pruned workspace
COPY --from=builder /app/out/full/ .

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the app
RUN npx turbo run build --filter=@flowcatalyst/server...

# Remove devDependencies to keep image small
# RUN npm prune --omit=dev

# ====== Python Environment Setup ======
# Create a virtual environment for the scrapers
RUN python3 -m venv /app/apps/server/venv
ENV VIRTUAL_ENV=/app/apps/server/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies
RUN pip install python-jobspy python-dotenv httpx beautifulsoup4 lxml

# ====== Runner Stage ======
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV VIRTUAL_ENV=/app/apps/server/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Expose port (7860 is required for Hugging Face Spaces)
EXPOSE 7860
ENV PORT=7860

# Use the existing 'node' user (UID 1000 is default for Hugging Face and node image)
USER node

# Copy built files and dependencies
# We copy from /app of the installer which contains the pruned structure + node_modules
COPY --from=installer --chown=node:node /app ./

# Start the app
# Point directly to the server entry point
CMD ["node", "apps/server/dist/index.js"]
