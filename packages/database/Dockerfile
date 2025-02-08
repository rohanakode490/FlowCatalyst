# Use the official Node.js image
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy the root package.json and package-lock.json
COPY package.json package-lock.json turbo.json ./

# Install turbo globally using npm
RUN npm install -g turbo

# Prune the workspace for the database package
RUN turbo prune --scope=@flowcatalyst/database --docker

# Copy the pruned workspace
COPY . .

# Install dependencies using npm
RUN npm install --frozen-lockfile

# Generate the Prisma client
RUN npx prisma generate

# Use a smaller image for production
FROM node:18-alpine AS runner
WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database

# Set the working directory to the database package
WORKDIR /app/packages/database

# Apply Prisma migrations
RUN npx prisma migrate deploy

# Expose the port (optional, since this is a database package)
EXPOSE 5432

# Start the app (optional, if you need to run a script)
CMD ["node", "dist/index.js"]
