# CCXT Deluthium Development Environment
# Multi-language support: Python, TypeScript, PHP

FROM node:20.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    php-cli \
    php-curl \
    php-mbstring \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for Python
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install CCXT
RUN pip install --no-cache-dir ccxt
RUN npm install -g ccxt

WORKDIR /app

# Create example scripts directory
RUN mkdir -p examples

# Copy example scripts
COPY examples/ examples/

# Default environment variables
ENV DELUTHIUM_JWT=""
ENV DELUTHIUM_CHAIN_ID=56
ENV DELUTHIUM_SLIPPAGE=0.5

# Create validation and entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Colors for output\n\
RED="\\033[0;31m"\n\
YELLOW="\\033[1;33m"\n\
GREEN="\\033[0;32m"\n\
NC="\\033[0m"\n\
\n\
echo "================================="\n\
echo "CCXT Deluthium Development Environment"\n\
echo "================================="\n\
echo ""\n\
\n\
# Environment validation\n\
WARNINGS=0\n\
ERRORS=0\n\
\n\
# Check required: DELUTHIUM_JWT\n\
if [ -z "$DELUTHIUM_JWT" ]; then\n\
    echo -e "${YELLOW}WARNING: DELUTHIUM_JWT is not set!${NC}"\n\
    echo "  Set it with: docker run -e DELUTHIUM_JWT=your-token ..."\n\
    echo "  Most API operations will fail without a valid JWT."\n\
    WARNINGS=$((WARNINGS + 1))\n\
else\n\
    # Basic JWT format validation (3 parts separated by dots)\n\
    if [[ ! "$DELUTHIUM_JWT" =~ ^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$ ]]; then\n\
        echo -e "${YELLOW}WARNING: DELUTHIUM_JWT does not match typical JWT format${NC}"\n\
        echo "  Expected format: xxxxx.yyyyy.zzzzz"\n\
        WARNINGS=$((WARNINGS + 1))\n\
    else\n\
        echo -e "${GREEN}✓${NC} DELUTHIUM_JWT is set"\n\
    fi\n\
fi\n\
\n\
# Validate CHAIN_ID is a valid number\n\
if ! [[ "$DELUTHIUM_CHAIN_ID" =~ ^[0-9]+$ ]]; then\n\
    echo -e "${RED}ERROR: DELUTHIUM_CHAIN_ID must be a number (got: $DELUTHIUM_CHAIN_ID)${NC}"\n\
    ERRORS=$((ERRORS + 1))\n\
else\n\
    # Check for known chain IDs\n\
    case "$DELUTHIUM_CHAIN_ID" in\n\
        1|56|137|42161|10|43114|8453)\n\
            echo -e "${GREEN}✓${NC} Chain ID: $DELUTHIUM_CHAIN_ID"\n\
            ;;\n\
        *)\n\
            echo -e "${YELLOW}NOTE: Non-standard chain ID: $DELUTHIUM_CHAIN_ID${NC}"\n\
            ;;\n\
    esac\n\
fi\n\
\n\
# Validate SLIPPAGE is a valid number\n\
if ! [[ "$DELUTHIUM_SLIPPAGE" =~ ^[0-9]*\\.?[0-9]+$ ]]; then\n\
    echo -e "${RED}ERROR: DELUTHIUM_SLIPPAGE must be a number (got: $DELUTHIUM_SLIPPAGE)${NC}"\n\
    ERRORS=$((ERRORS + 1))\n\
fi\n\
\n\
echo ""\n\
\n\
# Exit if critical errors\n\
if [ $ERRORS -gt 0 ]; then\n\
    echo -e "${RED}Environment validation failed with $ERRORS error(s).${NC}"\n\
    exit 1\n\
fi\n\
\n\
if [ $WARNINGS -gt 0 ]; then\n\
    echo -e "${YELLOW}Environment has $WARNINGS warning(s).${NC}"\n\
fi\n\
\n\
echo ""\n\
echo "Available languages:"\n\
echo "  - Python 3: python3"\n\
echo "  - Node.js:  node"\n\
echo "  - PHP:      php"\n\
echo ""\n\
echo "CCXT is pre-installed in all languages."\n\
echo ""\n\
echo "Example usage:"\n\
echo "  python3 examples/fetch_markets.py"\n\
echo "  node examples/fetch_ticker.js"\n\
echo ""\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]
