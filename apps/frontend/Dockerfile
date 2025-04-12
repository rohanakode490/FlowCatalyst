# # Use the official Node.js image
# FROM node:18-alpine AS builder
#
# # Set the working directory
# WORKDIR /app
#
# # Copy the root package.json and package-lock.json
# COPY package.json package-lock.json turbo.json ./
#
# # Install turbo globally using npm
# RUN npm install -g turbo@^2.1.3
#
# # Copy the pruned workspace
# COPY . .
#
# # Prune the workspace for the frontend app 
# RUN turbo prune @flowcatalyst/frontend --docker
#
# # Install dependencies using npm
# RUN npm install --frozen-lockfile
#
# # Build the Next.js app
# RUN npm run build --workspace=@flowcatalyst/frontend
#
# # Use a smaller image for production
# FROM node:18-alpine AS runner
# WORKDIR /app
#
# # Copy only necessary files from the builder stage
# COPY --from=builder /app/package.json /app/package-lock.json ./
# COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
# COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
# COPY --from=builder /app/node_modules ./node_modules
#
# # Set the working directory to the frontend app
# WORKDIR /app/apps/frontend
#
# # Expose the port the app runs on
# EXPOSE 3000
#
# # Start the app using the frontend's package.json
# CMD ["npm", "start"]

# Base image to avoid redundant downloads
FROM node:18-alpine AS base

# ====== Builder Stage ======
FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Install Turbo globally
RUN npm install -g turbo@^2

# Copy the entire monorepo
# COPY . .

# Copy package.json, package-lock.json, and turbo.json
COPY package.json package-lock.json turbo.json ./

# Copy the frontend app
COPY apps/frontend ./apps/frontend

# Prune the workspace to keep only what's necessary for @flowcatalyst/frontend
RUN turbo prune --scope=@flowcatalyst/frontend --docker

# ====== Installer Stage ======
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/package-lock.json .

# Install only necessary dependencies
# RUN yarn install --frozen-lockfile
RUN npm install -g turbo@^2.1.3
RUN npm install --omit=dev

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

# # Expose the port the app runs on
EXPOSE 3000

# Start the Next.js app in standalone mode
CMD node apps/frontend/server.js
