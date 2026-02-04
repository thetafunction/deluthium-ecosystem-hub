# 1inch Limit Order V4 to Deluthium Adapter
# Production-ready adapter with signer abstraction

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist

# Environment variables
ENV NODE_ENV=production
ENV DELUTHIUM_JWT=""
ENV CHAIN_ID=56
ENV PORT=3000
ENV LOG_LEVEL=info

# For KMS signing (optional)
ENV AWS_REGION=""
ENV AWS_KMS_KEY_ID=""

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE ${PORT}

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Create entrypoint
COPY --chown=nodejs:nodejs <<EOF /entrypoint.sh
#!/bin/sh
echo "========================================"
echo "1inch Limit Order V4 to Deluthium Adapter"
echo "========================================"
echo ""
echo "Chain ID: \${CHAIN_ID}"
echo "Port: \${PORT}"
echo ""

if [ -z "\$DELUTHIUM_JWT" ]; then
    echo "ERROR: DELUTHIUM_JWT is required!"
    exit 1
fi

echo "Starting adapter server..."
exec node dist/index.js
EOF

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
