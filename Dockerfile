# Stage 1: Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies (ignoring legacy script dependencies)
RUN npm ci --ignore-scripts

# Copy source files
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Stage 2: Production runtime stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create persistent storage directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 3000

# Health check against Fastify /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/app.js"]
