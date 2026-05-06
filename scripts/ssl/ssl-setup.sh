#!/bin/bash

# SSL Certificate Setup Script using Certbot
# This script obtains wildcard SSL certificates for *.jkenny.tech
# Run with: bash ssl-setup.sh

set -e

echo "🔐 Starting SSL Certificate Setup..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Variables
DOMAIN="jkenny.tech"
EMAIL="email@example.com"  # Update with your email

echo -e "${YELLOW}📋 Certificate Setup for: *.${DOMAIN}${NC}"
echo -e "${YELLOW}📧 Email: ${EMAIL}${NC}"
echo ""

# Stop nginx if running
echo -e "${GREEN}⏸️ Stopping nginx (if running)...${NC}"
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml stop nginx || true

# Method 1: Using DNS challenge (for wildcard certificates)
echo -e "${GREEN}🔐 Obtaining wildcard SSL certificate...${NC}"
echo -e "${YELLOW}⚠️ This requires DNS verification. You'll need to add a TXT record.${NC}"
echo ""
echo -e "${YELLOW}Choose your method:${NC}"
echo "1. DNS Challenge (Wildcard - *.jkenny.tech) - RECOMMENDED"
echo "2. HTTP Challenge (Individual subdomains)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo -e "${GREEN}Starting DNS challenge for wildcard certificate...${NC}"

    certbot certonly \
        --manual \
        --preferred-challenges dns \
        --email ${EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d "*.${DOMAIN}" \
        -d "${DOMAIN}" \
        --config-dir /opt/kennysolutions/certbot/conf \
        --work-dir /opt/kennysolutions/certbot/work \
        --logs-dir /opt/kennysolutions/certbot/logs

    echo -e "${GREEN}✅ Wildcard certificate obtained!${NC}"

elif [ "$choice" == "2" ]; then
    echo -e "${GREEN}Starting HTTP challenge for individual subdomains...${NC}"

    # Start nginx for HTTP challenge
    docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml up -d nginx

    # Wait for nginx to start
    sleep 5

    # Obtain certificates for each subdomain
    docker run --rm \
        -v /opt/kennysolutions/certbot/conf:/etc/letsencrypt \
        -v /opt/kennysolutions/certbot/www:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email ${EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d teach.${DOMAIN} \
        -d api.teach.${DOMAIN}

    echo -e "${GREEN}✅ Certificates obtained!${NC}"
else
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
fi

# Set proper permissions
echo -e "${GREEN}🔒 Setting certificate permissions...${NC}"
chmod -R 755 /opt/kennysolutions/certbot/conf
chmod -R 755 /opt/kennysolutions/certbot/www

# Verify certificates
echo -e "${GREEN}✅ Verifying certificates...${NC}"
if [ -d "/opt/kennysolutions/certbot/conf/live/${DOMAIN}" ]; then
    ls -la /opt/kennysolutions/certbot/conf/live/${DOMAIN}/
    echo -e "${GREEN}✅ Certificates found!${NC}"
else
    echo -e "${RED}❌ Certificate directory not found${NC}"
    exit 1
fi

# Setup auto-renewal
echo -e "${GREEN}♻️ Setting up auto-renewal...${NC}"
cat > /etc/cron.d/certbot-renewal <<EOF
# Renew SSL certificates twice daily
0 0,12 * * * root docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml run --rm certbot renew --quiet && docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml restart nginx
EOF

echo -e "${GREEN}✅ Auto-renewal configured${NC}"

# Restart nginx with SSL
echo -e "${GREEN}🔄 Restarting nginx with SSL...${NC}"
cd /opt/kennysolutions
docker compose -f deploy/docker/docker-compose.vps.yml up -d nginx

echo ""
echo -e "${GREEN}✅ SSL Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Verify SSL is working:"
echo -e "   ${YELLOW}curl https://teach.jkenny.tech${NC}"
echo -e "   ${YELLOW}curl https://api.teach.jkenny.tech/admin/login/${NC}"
echo "2. Uncomment HSTS header in nginx config for production"
echo "3. Test auto-renewal:"
echo -e "   ${YELLOW}certbot renew --dry-run${NC}"
echo ""
