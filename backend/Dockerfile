# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install necessary packages and security updates
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    tzdata \
    && apk upgrade

# Set timezone
ENV TZ=UTC

WORKDIR /app

# Copy package files
COPY package*.json ./

# Builder stage
FROM base AS builder

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy prisma schema and source code
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
# ESLint config is not needed for production build
# COPY .eslintrc.js ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production dependencies stage
FROM base AS deps

# Install only production dependencies
RUN npm ci --only=production --no-optional

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application and schemas
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy package.json for npm scripts
COPY package*.json ./

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Expose port
EXPOSE ${PORT:-10000}

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-10000}/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Graceful shutdown handling
STOPSIGNAL SIGTERM

# Start script with proper error handling
CMD ["sh", "-c", "set -e && npx prisma migrate deploy --accept-data-loss && node dist/index.js"]