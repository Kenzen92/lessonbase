#!/bin/bash

# Quick Deployment Script for VPS
# This script performs a quick update and restart of the application
# Usage: bash quick-deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/opt/kennysolutions"
COMPOSE_FILE="docker-compose.vps.yml"

echo -e "${GREEN}🚀 Starting quick deployment...${NC}"

# Check if running from correct directory
if [ ! -f "$PROJECT_DIR/$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Error: Must be run from $PROJECT_DIR${NC}"
    exit 1
fi

cd $PROJECT_DIR

# Pull latest code
echo -e "${GREEN}📥 Pulling latest code from Git...${NC}"
git pull origin main

# Pull latest Docker images
echo -e "${GREEN}📦 Pulling latest Docker images...${NC}"
docker compose -f $COMPOSE_FILE pull

# Run migrations
echo -e "${GREEN}🗄️ Running database migrations...${NC}"
docker compose -f $COMPOSE_FILE exec backend /app/migrate.sh || echo -e "${YELLOW}⚠️ Migrations may have failed${NC}"

# Restart services
echo -e "${GREEN}♻️ Restarting services...${NC}"
docker compose -f $COMPOSE_FILE up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Health checks
echo -e "${GREEN}🏥 Running health checks...${NC}"

# Check backend
if curl -f -s https://api.teach.jkenny.tech/admin/login/ > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker compose -f $COMPOSE_FILE logs backend --tail=50
    exit 1
fi

# Check frontend
if curl -f -s https://teach.jkenny.tech > /dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker compose -f $COMPOSE_FILE logs frontend --tail=50
    exit 1
fi

# Show running containers
echo -e "${GREEN}📊 Running containers:${NC}"
docker compose -f $COMPOSE_FILE ps

# Cleanup old images
echo -e "${GREEN}🧹 Cleaning up old Docker images...${NC}"
docker image prune -af --filter "until=72h" || true

echo ""
echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Check logs with: docker compose -f $COMPOSE_FILE logs -f${NC}"
