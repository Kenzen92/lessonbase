#!/bin/bash

# VPS Initial Setup Script for Hostinger VPS
# This script sets up Docker, security, and the application environment
# Run with: bash vps-initial-setup.sh

set -e

echo "🚀 Starting VPS Initial Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install essential packages
echo -e "${GREEN}📦 Installing essential packages...${NC}"
apt install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    nano \
    certbot \
    python3-certbot-nginx

# Install Docker
echo -e "${GREEN}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️ Docker is already installed${NC}"
fi

# Install Docker Compose
echo -e "${GREEN}🐳 Installing Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️ Docker Compose is already installed${NC}"
fi

# Create application directory
echo -e "${GREEN}📁 Creating application directory...${NC}"
mkdir -p /opt/kennysolutions
cd /opt/kennysolutions

# Clone repository (you'll need to update this with your actual repo)
echo -e "${GREEN}📥 Cloning repository...${NC}"
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️ Please clone your repository manually:${NC}"
    echo -e "${YELLOW}   git clone https://github.com/yourusername/kennysolutions.git /opt/kennysolutions${NC}"
else
    echo -e "${GREEN}✅ Repository already cloned${NC}"
fi

# Setup firewall
echo -e "${GREEN}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
echo -e "${GREEN}✅ Firewall configured${NC}"

# Setup fail2ban
echo -e "${GREEN}🛡️ Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
EOF
systemctl restart fail2ban
echo -e "${GREEN}✅ Fail2ban configured${NC}"

# Create .env file template
echo -e "${GREEN}📝 Creating .env file template...${NC}"
cat > /opt/kennysolutions/.env.template <<EOF
# Docker Hub Configuration
DOCKER_USERNAME=your_docker_username

# Database Configuration
POSTGRES_DB=kennysolutions_db
POSTGRES_USER=kennysolutions_user
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# Redis Configuration
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD

# Django Configuration
DJANGO_SECRET_KEY=CHANGE_ME_DJANGO_SECRET_KEY
SECRET_KEY=CHANGE_ME_SECRET_KEY

# Frontend/Backend URLs
FRONTEND_URL=https://teach.jkenny.tech
BASE_URL=https://api.teach.jkenny.tech

# External Services
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MongoDB Configuration (if still using)
MONGO_USERNAME=your_mongo_username
MONGO_PASSWORD=your_mongo_password
MONGO_DB_NAME=your_mongo_db_name
MONGO_PORT=27017

# Email Configuration
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_email_app_password

# Environment
ENVIRONMENT=production
EOF

echo -e "${YELLOW}⚠️ Please edit /opt/kennysolutions/.env with your actual credentials${NC}"
echo -e "${YELLOW}   cp /opt/kennysolutions/.env.template /opt/kennysolutions/.env${NC}"
echo -e "${YELLOW}   nano /opt/kennysolutions/.env${NC}"

# Create directories for SSL certificates
echo -e "${GREEN}📁 Creating SSL certificate directories...${NC}"
mkdir -p /opt/kennysolutions/certbot/conf
mkdir -p /opt/kennysolutions/certbot/www

# Print next steps
echo ""
echo -e "${GREEN}✅ Initial setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Clone your repository to /opt/kennysolutions"
echo -e "2. Create and configure .env file:"
echo -e "   ${YELLOW}cp .env.template .env && nano .env${NC}"
echo -e "3. Set up DNS A records:"
echo -e "   ${YELLOW}teach.jkenny.tech -> YOUR_VPS_IP${NC}"
echo -e "   ${YELLOW}api.teach.jkenny.tech -> YOUR_VPS_IP${NC}"
echo -e "4. Obtain SSL certificates (see ssl-setup.sh)"
echo -e "5. Start the application:"
echo -e "   ${YELLOW}cd /opt/kennysolutions && docker compose -f docker-compose.vps.yml up -d${NC}"
echo ""
