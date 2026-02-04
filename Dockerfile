# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and config files
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/

# Build the application
RUN npm run build

# Verify build output exists
RUN ls -la dist/

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Verify dist exists
RUN ls -la dist/

# Expose port
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/src/main.js"]
