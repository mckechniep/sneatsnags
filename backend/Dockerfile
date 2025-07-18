# Multi-stage build for production
FROM node:20-alpine AS builder

# Install necessary packages
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install necessary packages
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Create non-root user first
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p /app/uploads

# Change ownership of the app directory BEFORE switching user
RUN chown -R nodejs:nodejs /app
RUN chown -R nodejs:nodejs /app/node_modules

# Switch to non-root user
USER nodejs

# Generate Prisma client for production (as nodejs user)
RUN npx prisma generate

# Expose port (Render uses PORT environment variable)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:10000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]