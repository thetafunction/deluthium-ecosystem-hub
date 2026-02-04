# CCXT Deluthium Development Environment
# Multi-language support: Python, TypeScript, PHP

FROM node:20-slim AS base

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

# Create entrypoint script
RUN echo '#!/bin/bash\n\
echo "================================="\n\
echo "CCXT Deluthium Development Environment"\n\
echo "================================="\n\
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
echo "Environment variables:"\n\
echo "  DELUTHIUM_JWT - Your JWT token (required)"\n\
echo "  DELUTHIUM_CHAIN_ID - Chain ID (default: 56)"\n\
echo "  DELUTHIUM_SLIPPAGE - Slippage % (default: 0.5)"\n\
echo ""\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]
