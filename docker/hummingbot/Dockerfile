# Hummingbot with Deluthium Connector
# Based on official Hummingbot image with Deluthium configuration

# Pin to specific version for reproducibility
# Check https://hub.docker.com/r/hummingbot/hummingbot/tags for latest version
FROM hummingbot/hummingbot:1.28.0

# Set labels
LABEL maintainer="Deluthium Team"
LABEL description="Hummingbot with Deluthium DEX connector pre-configured"

# Environment variables
ENV DELUTHIUM_JWT=""
ENV DELUTHIUM_CHAIN_ID=56
ENV DELUTHIUM_WALLET_ADDRESS=""

# Create Deluthium configuration directory
RUN mkdir -p /conf/connectors

# Create Deluthium connector configuration template
RUN echo 'template_version: 1\n\
\n\
# Deluthium DEX Connector Configuration\n\
# This file is auto-generated. Modify as needed.\n\
\n\
deluthium_api_key: ${DELUTHIUM_JWT}\n\
deluthium_chain_id: ${DELUTHIUM_CHAIN_ID}\n\
deluthium_wallet_address: ${DELUTHIUM_WALLET_ADDRESS}\n\
deluthium_slippage: 0.5\n\
' > /conf/connectors/deluthium.yml

# Create startup script
RUN echo '#!/bin/bash\n\
\n\
echo "========================================"\n\
echo "Hummingbot with Deluthium Connector"\n\
echo "========================================"\n\
echo ""\n\
\n\
# Check for required environment variables\n\
if [ -z "$DELUTHIUM_JWT" ]; then\n\
    echo "WARNING: DELUTHIUM_JWT is not set!"\n\
    echo "Set it with: export DELUTHIUM_JWT=your-token"\n\
fi\n\
\n\
if [ -z "$DELUTHIUM_WALLET_ADDRESS" ]; then\n\
    echo "WARNING: DELUTHIUM_WALLET_ADDRESS is not set!"\n\
    echo "Set it with: export DELUTHIUM_WALLET_ADDRESS=0x..."\n\
fi\n\
\n\
echo ""\n\
echo "Chain ID: ${DELUTHIUM_CHAIN_ID:-56}"\n\
echo ""\n\
echo "Starting Hummingbot..."\n\
echo ""\n\
\n\
# Update configuration with environment variables\n\
envsubst < /conf/connectors/deluthium.yml > /conf/connectors/deluthium_configured.yml\n\
mv /conf/connectors/deluthium_configured.yml /conf/connectors/deluthium.yml\n\
\n\
# Start Hummingbot\n\
exec /opt/conda/envs/hummingbot/bin/python /home/hummingbot/hummingbot/bin/hummingbot.py\n\
' > /start.sh && chmod +x /start.sh

# Volumes for persistence
VOLUME ["/conf", "/logs", "/data", "/scripts"]

# Set working directory
WORKDIR /home/hummingbot

# Default command
ENTRYPOINT ["/start.sh"]
