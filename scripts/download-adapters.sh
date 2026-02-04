#!/bin/bash
# Deluthium - Download Individual Adapters
# Downloads adapter source code for local development

set -e

echo "========================================"
echo "Deluthium Adapter Downloader"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

# Create adapters directory
mkdir -p adapters
cd adapters

download_adapter() {
    name=$1
    repo=$2
    
    if [ -d "$name" ]; then
        echo "Updating $name..."
        cd "$name"
        git pull
        cd ..
    else
        echo "Downloading $name..."
        git clone "$repo" "$name"
    fi
    echo -e "${GREEN}✓${NC} $name ready"
}

echo "Select adapters to download:"
echo ""
echo "  1) All adapters"
echo "  2) 0x Protocol Adapter"
echo "  3) 1inch Limit Order Adapter"
echo "  4) CCXT (full library)"
echo "  5) Hummingbot (full framework)"
echo "  6) Market Maker Example (Go)"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        download_adapter "0x-deluthium-adapter" "https://github.com/thetafunction/0x-deluthium-adapter.git"
        download_adapter "1inch-deluthium-adapter" "https://github.com/thetafunction/1inch-deluthium-adapter.git"
        download_adapter "ccxt" "https://github.com/ccxt/ccxt.git"
        download_adapter "hummingbot" "https://github.com/hummingbot/hummingbot.git"
        download_adapter "DarkPool-Market-Maker-Example" "https://github.com/thetafunction/DarkPool-Market-Maker-Example.git"
        ;;
    2)
        download_adapter "0x-deluthium-adapter" "https://github.com/thetafunction/0x-deluthium-adapter.git"
        ;;
    3)
        download_adapter "1inch-deluthium-adapter" "https://github.com/thetafunction/1inch-deluthium-adapter.git"
        ;;
    4)
        download_adapter "ccxt" "https://github.com/ccxt/ccxt.git"
        ;;
    5)
        download_adapter "hummingbot" "https://github.com/hummingbot/hummingbot.git"
        ;;
    6)
        download_adapter "DarkPool-Market-Maker-Example" "https://github.com/thetafunction/DarkPool-Market-Maker-Example.git"
        ;;
    *)
        echo "Invalid choice."
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "Download Complete!"
echo "========================================"
echo ""
echo "Adapters are available in: ./adapters/"
echo ""
ls -la
