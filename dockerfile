# Dockerfile for Budget Tracking App Backend
# This uses multi-stage builds for optimized production images

# ===========================================
# Stage 1: Base - Common dependencies
# ===========================================
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --silent

# ===========================================
# Stage 2: Development
# ===========================================
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install --silent

# Copy application code
COPY . .

# Expose application port
EXPOSE 3003
# Set environment to development
ENV NODE_ENV=development

# Start application in development mode with nodemon
CMD ["npm", "run", "dev"]

# ===========================================
# Stage 3: Test - For running tests in CI/CD
# ===========================================
FROM development AS test

# Copy test files
COPY tests/ ./tests/

# Set test environment
ENV NODE_ENV=test

# Run tests
CMD ["npm", "test"]

# ===========================================
# Stage 4: Production Builder
# ===========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for building
RUN npm install --silent

# Copy source code
COPY . .

# If you have a build step (TypeScript, etc.), run it here
# RUN npm run build

# ===========================================
# Stage 5: Production
# ===========================================
FROM node:18-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy application code
COPY --chown=nodejs:nodejs . .

# If you had a build step, copy built files
# COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3003

# Set production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start application
CMD ["node", "app.mjs"]

# ===========================================
# Build Instructions:
# ===========================================
# Development:
#   docker build --target development -t budget-app:dev .
#   docker run -p 3000:3000 -v $(pwd):/app budget-app:dev
#
# Production:
#   docker build --target production -t budget-app:prod .
#   docker run -p 3000:3000 budget-app:prod
#
# Test:
#   docker build --target test -t budget-app:test .
#   docker run budget-app:test