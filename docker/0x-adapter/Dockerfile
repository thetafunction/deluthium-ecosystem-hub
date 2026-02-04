# 0x Protocol to Deluthium Adapter
# Translates 0x v4 RFQ orders to DarkPool format

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Environment variables
ENV NODE_ENV=production
ENV DELUTHIUM_JWT=""
ENV CHAIN_ID=56
ENV PORT=3000
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE ${PORT}

# Create entrypoint
RUN echo '#!/bin/sh\n\
echo "================================"\n\
echo "0x Protocol to Deluthium Adapter"\n\
echo "================================"\n\
echo ""\n\
echo "Chain ID: ${CHAIN_ID}"\n\
echo "Port: ${PORT}"\n\
echo ""\n\
\n\
if [ -z "$DELUTHIUM_JWT" ]; then\n\
    echo "ERROR: DELUTHIUM_JWT is required!"\n\
    exit 1\n\
fi\n\
\n\
echo "Starting adapter server..."\n\
exec node dist/index.js\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
