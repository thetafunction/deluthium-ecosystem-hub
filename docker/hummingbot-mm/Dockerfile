# Deluthium Hummingbot Market Maker
# WebSocket connector for quote provision

FROM python:3.11-slim AS base

# Set labels
LABEL maintainer="Deluthium Team"
LABEL description="Hummingbot WebSocket Market Maker for Deluthium DEX"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create directories for config and logs
RUN mkdir -p /conf/strategies /logs

# Copy default configuration
COPY conf/ /conf/

# Environment variables
ENV DELUTHIUM_JWT=""
ENV MM_SIGNER_KEY=""
ENV DELUTHIUM_CHAIN_ID=56
ENV WS_URL="wss://mmhub.deluthium.ai/ws"
ENV PYTHONUNBUFFERED=1

# Health check - verify process is running
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
    CMD pgrep -f "python.*main.py" || exit 1

# Volumes
VOLUME ["/conf", "/logs"]

# Create validation and entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Colors\n\
RED="\\033[0;31m"\n\
GREEN="\\033[0;32m"\n\
YELLOW="\\033[1;33m"\n\
NC="\\033[0m"\n\
\n\
echo "========================================"\n\
echo "Deluthium Hummingbot Market Maker"\n\
echo "========================================"\n\
echo ""\n\
\n\
# Validate required environment variables\n\
ERRORS=0\n\
\n\
if [ -z "$DELUTHIUM_JWT" ]; then\n\
    echo -e "${RED}ERROR: DELUTHIUM_JWT is required${NC}"\n\
    ERRORS=$((ERRORS + 1))\n\
else\n\
    echo -e "${GREEN}✓${NC} DELUTHIUM_JWT is set"\n\
fi\n\
\n\
if [ -z "$MM_SIGNER_KEY" ]; then\n\
    echo -e "${RED}ERROR: MM_SIGNER_KEY is required${NC}"\n\
    echo "  This is the private key for signing quotes."\n\
    ERRORS=$((ERRORS + 1))\n\
else\n\
    echo -e "${GREEN}✓${NC} MM_SIGNER_KEY is set"\n\
fi\n\
\n\
echo ""\n\
echo "Chain ID: ${DELUTHIUM_CHAIN_ID}"\n\
echo "WebSocket: ${WS_URL}"\n\
echo ""\n\
\n\
if [ $ERRORS -gt 0 ]; then\n\
    echo -e "${RED}Environment validation failed with $ERRORS error(s).${NC}"\n\
    exit 1\n\
fi\n\
\n\
# Check config file\n\
CONFIG_PATH="${CONFIG_PATH:-/conf/strategies/deluthium_mm.yml}"\n\
if [ ! -f "$CONFIG_PATH" ]; then\n\
    echo -e "${YELLOW}WARNING: Config file not found: $CONFIG_PATH${NC}"\n\
    echo "Using default configuration..."\n\
fi\n\
\n\
echo "Starting Market Maker..."\n\
echo ""\n\
exec python /app/src/main.py --config "$CONFIG_PATH"\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

# Security: Run as non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser && \
    chown -R appuser:appgroup /app /conf /logs
USER appuser

ENTRYPOINT ["/entrypoint.sh"]
