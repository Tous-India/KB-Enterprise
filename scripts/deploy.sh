#!/bin/bash
# ============================================
# KB CRM - VPS Deployment Script
# Run on Hostinger VPS for initial setup
# ============================================
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Environment variables:
#   DOCKERHUB_USERNAME - Docker Hub username (required)
#   DOMAIN - Your domain name (default: your-domain.com)
#
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${APP_DIR:-/home/$USER/kb-crm}"
DOMAIN="${DOMAIN:-your-domain.com}"

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}KB CRM - VPS Deployment Script${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check required environment variable
if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo -e "${RED}Error: DOCKERHUB_USERNAME environment variable is required${NC}"
    echo "Usage: DOCKERHUB_USERNAME=yourusername ./deploy.sh"
    exit 1
fi

# ----------------------------------------
# Step 1: Install Docker (if not installed)
# ----------------------------------------
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${GREEN}Docker is already installed${NC}"
fi

# ----------------------------------------
# Step 2: Install Docker Compose (if not installed)
# ----------------------------------------
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}Docker Compose is already installed${NC}"
fi

# ----------------------------------------
# Step 3: Create app directory structure
# ----------------------------------------
echo -e "${YELLOW}Setting up application directory...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/nginx/ssl
mkdir -p $APP_DIR/nginx/conf.d
mkdir -p $APP_DIR/backend

# ----------------------------------------
# Step 4: Check for .env file
# ----------------------------------------
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env template...${NC}"
    cat > $APP_DIR/backend/.env << 'EOF'
# ============================================
# KB CRM - Production Environment Variables
# ============================================

# Server
NODE_ENV=production
PORT=5000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kb_crm

# JWT
JWT_SECRET=your-production-secret-min-32-chars
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-domain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=KB Enterprises
EMAIL_FROM_ADDRESS=noreply@kbenterprises.com

# Frontend URL
FRONTEND_URL=https://your-domain.com
EOF
    echo -e "${YELLOW}Please edit $APP_DIR/backend/.env with your production values${NC}"
    echo -e "${RED}Deployment paused. Edit .env file and run script again.${NC}"
    exit 0
fi

# ----------------------------------------
# Step 5: Create docker-compose.production.yml if not exists
# ----------------------------------------
if [ ! -f "$APP_DIR/docker-compose.production.yml" ]; then
    echo -e "${YELLOW}Creating docker-compose.production.yml...${NC}"
    cat > $APP_DIR/docker-compose.production.yml << EOF
version: '3.8'

services:
  backend:
    image: \${DOCKERHUB_USERNAME}/kb-crm-backend:latest
    container_name: kb-crm-backend
    restart: unless-stopped
    expose:
      - "5000"
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
    networks:
      - kb-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
    mem_limit: 512m
    cpus: 1.0

  frontend:
    image: \${DOCKERHUB_USERNAME}/kb-crm-frontend:latest
    container_name: kb-crm-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - kb-network
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    mem_limit: 128m
    cpus: 0.5

networks:
  kb-network:
    driver: bridge
    name: kb-crm-network
EOF
fi

# ----------------------------------------
# Step 6: Pull Docker images
# ----------------------------------------
echo -e "${YELLOW}Pulling Docker images...${NC}"
docker pull ${DOCKERHUB_USERNAME}/kb-crm-backend:latest
docker pull ${DOCKERHUB_USERNAME}/kb-crm-frontend:latest

# ----------------------------------------
# Step 7: Stop existing containers
# ----------------------------------------
echo -e "${YELLOW}Stopping existing containers...${NC}"
cd $APP_DIR
export DOCKERHUB_USERNAME=$DOCKERHUB_USERNAME
docker compose -f docker-compose.production.yml down || true

# ----------------------------------------
# Step 8: Start containers
# ----------------------------------------
echo -e "${YELLOW}Starting containers...${NC}"
docker compose -f docker-compose.production.yml up -d

# ----------------------------------------
# Step 9: Health check
# ----------------------------------------
echo -e "${YELLOW}Running health check...${NC}"
sleep 15

if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    docker compose -f docker-compose.production.yml logs backend
    exit 1
fi

if curl -sf http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Frontend check - may need SSL setup${NC}"
fi

# ----------------------------------------
# Step 10: Show container status
# ----------------------------------------
echo ""
echo -e "${BLUE}Container Status:${NC}"
docker compose -f docker-compose.production.yml ps

# ----------------------------------------
# Step 11: Cleanup
# ----------------------------------------
echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Setup SSL: certbot certonly --standalone -d $DOMAIN"
echo "2. Copy certs: cp /etc/letsencrypt/live/$DOMAIN/*.pem $APP_DIR/nginx/ssl/"
echo "3. Configure: Edit $APP_DIR/nginx/conf.d/ssl.conf"
echo ""
