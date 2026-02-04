#!/bin/bash
# Deluthium Ecosystem Hub - One-Click Setup Script
# Usage: curl -sSL https://raw.githubusercontent.com/thetafunction/deluthium-Ecosystem-Hub/main/scripts/setup.sh | bash

set -e

echo "========================================"
echo "Deluthium Ecosystem Hub - Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}ERROR: Docker is not installed.${NC}"
        echo "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Docker found"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}ERROR: Docker Compose is not installed.${NC}"
        echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Docker Compose found"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}ERROR: Git is not installed.${NC}"
        echo "Please install Git first: https://git-scm.com/downloads"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Git found"
    
    echo ""
}

# Clone repository
clone_repo() {
    REPO_URL="https://github.com/thetafunction/deluthium-Ecosystem-Hub.git"
    TARGET_DIR="deluthium-Ecosystem-Hub"
    
    if [ -d "$TARGET_DIR" ]; then
        echo -e "${YELLOW}Directory $TARGET_DIR already exists.${NC}"
        read -p "Do you want to update it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$TARGET_DIR"
            git pull
            cd ..
        fi
    else
        echo "Cloning repository..."
        git clone "$REPO_URL"
    fi
    
    cd "$TARGET_DIR"
    echo -e "${GREEN}✓${NC} Repository ready"
    echo ""
}

# Configure environment
configure_env() {
    if [ ! -f ".env" ]; then
        echo "Creating environment configuration..."
        cp .env.example .env
        
        echo -e "${YELLOW}Please edit .env file with your JWT token:${NC}"
        echo "  nano .env"
        echo ""
        echo "Or set it directly:"
        echo "  export DELUTHIUM_JWT='your-jwt-token'"
        echo ""
        
        read -p "Do you have a JWT token to set now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter your JWT token: " jwt_token
            sed -i "s/DELUTHIUM_JWT=.*/DELUTHIUM_JWT=$jwt_token/" .env
            echo -e "${GREEN}✓${NC} JWT token configured"
        fi
    else
        echo -e "${GREEN}✓${NC} Environment file already exists"
    fi
    echo ""
}

# Create data directories
create_directories() {
    echo "Creating data directories..."
    mkdir -p data/hummingbot/{conf,logs,data,scripts}
    mkdir -p data/mm-example/configs
    mkdir -p examples/ccxt
    echo -e "${GREEN}✓${NC} Directories created"
    echo ""
}

# Select services to start
select_services() {
    echo "Which services would you like to start?"
    echo ""
    echo "  1) All services (Portal + Adapters + Databases)"
    echo "  2) Portal only (Dashboard)"
    echo "  3) CCXT development environment"
    echo "  4) Hummingbot trading bot"
    echo "  5) 0x and 1inch adapters"
    echo "  6) Market Maker example (Go)"
    echo "  7) None (I'll start manually)"
    echo ""
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            echo "Starting all services..."
            docker-compose up -d
            ;;
        2)
            echo "Starting Portal and dependencies..."
            docker-compose up -d portal api-monitor redis postgres
            ;;
        3)
            echo "Starting CCXT environment..."
            docker-compose up -d ccxt
            ;;
        4)
            echo "Starting Hummingbot..."
            docker-compose up -d hummingbot
            ;;
        5)
            echo "Starting adapters..."
            docker-compose up -d 0x-adapter 1inch-adapter
            ;;
        6)
            echo "Starting MM example..."
            docker-compose up -d mm-example
            ;;
        7)
            echo "Skipping service startup."
            ;;
        *)
            echo "Invalid choice. Skipping service startup."
            ;;
    esac
    echo ""
}

# Print summary
print_summary() {
    echo "========================================"
    echo "Setup Complete!"
    echo "========================================"
    echo ""
    echo "Useful commands:"
    echo ""
    echo "  # Start all services"
    echo "  docker-compose up -d"
    echo ""
    echo "  # View logs"
    echo "  docker-compose logs -f"
    echo ""
    echo "  # Stop all services"
    echo "  docker-compose down"
    echo ""
    echo "  # Enter CCXT shell"
    echo "  docker-compose exec ccxt bash"
    echo ""
    echo "  # Enter Hummingbot"
    echo "  docker-compose exec -it hummingbot bash"
    echo ""
    
    if docker-compose ps | grep -q "portal"; then
        echo -e "${GREEN}Portal is running at: http://localhost:3000${NC}"
    fi
    
    echo ""
    echo "Documentation: https://github.com/thetafunction/deluthium-Ecosystem-Hub"
    echo ""
}

# Main
main() {
    check_prerequisites
    clone_repo
    configure_env
    create_directories
    select_services
    print_summary
}

main
