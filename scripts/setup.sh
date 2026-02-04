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

# Securely update a value in .env file
secure_env_update() {
    local key="$1"
    local value="$2"
    local env_file=".env"
    local tmp_file
    tmp_file=$(mktemp)
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ "$line" =~ ^${key}= ]]; then
            echo "${key}=${value}" >> "$tmp_file"
        else
            echo "$line" >> "$tmp_file"
        fi
    done < "$env_file"
    
    mv "$tmp_file" "$env_file"
    chmod 600 "$env_file"
}

# Configure environment
configure_env() {
    if [ ! -f ".env" ]; then
        echo "Creating environment configuration..."
        cp .env.example .env
        chmod 600 .env
        
        # Generate secure PostgreSQL password
        echo "Generating secure database password..."
        if command -v openssl &> /dev/null; then
            POSTGRES_PASSWORD=$(openssl rand -base64 24)
        else
            POSTGRES_PASSWORD=$(head -c 24 /dev/urandom | base64)
        fi
        secure_env_update "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
        echo -e "${GREEN}✓${NC} Database password generated"
        
        # Generate API monitor key
        if command -v openssl &> /dev/null; then
            API_MONITOR_KEY=$(openssl rand -hex 16)
        else
            API_MONITOR_KEY=$(head -c 16 /dev/urandom | xxd -p)
        fi
        secure_env_update "API_MONITOR_KEY" "$API_MONITOR_KEY"
        echo -e "${GREEN}✓${NC} API monitor key generated"
        
        # Optionally generate Redis password
        read -p "Generate Redis password? (recommended for production) (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v openssl &> /dev/null; then
                REDIS_PASSWORD=$(openssl rand -base64 16)
            else
                REDIS_PASSWORD=$(head -c 16 /dev/urandom | base64)
            fi
            secure_env_update "REDIS_PASSWORD" "$REDIS_PASSWORD"
            echo -e "${GREEN}✓${NC} Redis password generated"
        fi
        
        echo ""
        echo -e "${YELLOW}Please configure your JWT token:${NC}"
        echo ""
        
        read -p "Do you have a JWT token to set now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Silent input for security
            echo -n "Enter your JWT token (input hidden): "
            read -s jwt_token
            echo  # Newline after silent input
            
            # Basic JWT format validation (3 parts separated by dots)
            if [[ ! "$jwt_token" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
                echo -e "${YELLOW}WARNING: Token doesn't match typical JWT format (xxx.yyy.zzz).${NC}"
                echo -e "${YELLOW}Proceeding anyway - this may be intentional.${NC}"
            fi
            
            # Securely update the .env file
            secure_env_update "DELUTHIUM_JWT" "$jwt_token"
            
            # Clear token from shell memory
            unset jwt_token
            
            echo -e "${GREEN}✓${NC} JWT token configured"
        else
            echo -e "${YELLOW}Remember to set DELUTHIUM_JWT in .env before starting services${NC}"
        fi
    else
        echo -e "${YELLOW}Existing .env found.${NC}"
        read -p "Keep existing config? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            # Backup existing config
            backup_file=".env.backup.$(date +%Y%m%d%H%M%S)"
            cp .env "$backup_file"
            echo "Backed up old config to $backup_file"
            cp .env.example .env
            chmod 600 .env
            echo "Created fresh .env - please reconfigure"
        fi
        echo -e "${GREEN}✓${NC} Environment file ready"
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
