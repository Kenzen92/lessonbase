#!/bin/bash

# Build and Push Docker Images to Docker Hub
# Make sure Docker is running before executing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Building and Pushing Docker Images${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

DOCKER_USERNAME="kenzen92"
BACKEND_IMAGE="${DOCKER_USERNAME}/lessonbase-backend"
FRONTEND_IMAGE="${DOCKER_USERNAME}/lessonbase-frontend"

echo -e "${YELLOW}Docker Username:${NC} ${DOCKER_USERNAME}"
echo -e "${YELLOW}Backend Image:${NC} ${BACKEND_IMAGE}:latest"
echo -e "${YELLOW}Frontend Image:${NC} ${FRONTEND_IMAGE}:latest"
echo ""

# Check if Docker is running
if ! docker version &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Login to Docker Hub
echo -e "${GREEN}[1/6] Logging into Docker Hub...${NC}"
docker login
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Docker login failed${NC}"
    exit 1
fi

# Build backend image
echo ""
echo -e "${GREEN}[2/6] Building backend image...${NC}"
cd backend
docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile .
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Backend build failed${NC}"
    exit 1
fi
cd ..

# Push backend image
echo ""
echo -e "${GREEN}[3/6] Pushing backend image to Docker Hub...${NC}"
docker push ${BACKEND_IMAGE}:latest
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Backend push failed${NC}"
    exit 1
fi

# Build frontend image
echo ""
echo -e "${GREEN}[4/6] Building frontend image...${NC}"
cd frontend
docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile .
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Frontend build failed${NC}"
    exit 1
fi
cd ..

# Push frontend image
echo ""
echo -e "${GREEN}[5/6] Pushing frontend image to Docker Hub...${NC}"
docker push ${FRONTEND_IMAGE}:latest
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Frontend push failed${NC}"
    exit 1
fi

# Verify images
echo ""
echo -e "${GREEN}[6/6] Verifying images...${NC}"
docker images | grep lessonbase

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}SUCCESS! Images pushed to Docker Hub${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${YELLOW}Backend:${NC} https://hub.docker.com/r/${DOCKER_USERNAME}/lessonbase-backend"
echo -e "${YELLOW}Frontend:${NC} https://hub.docker.com/r/${DOCKER_USERNAME}/lessonbase-frontend"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your .env file on VPS with DOCKER_USERNAME=kenzen92"
echo "2. Deploy to VPS using docker-compose.vps.yml"
echo ""
