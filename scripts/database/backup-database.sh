#!/bin/bash

# PostgreSQL Backup Script
# Creates daily backups of the PostgreSQL database
# Add to crontab: 0 2 * * * /opt/kennysolutions/scripts/database/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/opt/kennysolutions/backups"
COMPOSE_FILE="/opt/kennysolutions/deploy/docker/docker-compose.vps.yml"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kennysolutions_backup_${DATE}.sql.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🗄️ Starting PostgreSQL backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Get database credentials from .env
source /opt/kennysolutions/.env

# Create backup
echo -e "${GREEN}📦 Creating backup: ${BACKUP_FILE}${NC}"

docker compose -f ${COMPOSE_FILE} exec -T db pg_dump \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    --no-owner \
    --no-acl \
    | gzip > ${BACKUP_DIR}/${BACKUP_FILE}

# Check if backup was successful
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h ${BACKUP_DIR}/${BACKUP_FILE} | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Delete old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
find ${BACKUP_DIR} -name "kennysolutions_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# List current backups
echo -e "${GREEN}📋 Current backups:${NC}"
ls -lh ${BACKUP_DIR}/kennysolutions_backup_*.sql.gz 2>/dev/null || echo "No backups found"

# Optional: Upload to cloud storage (uncomment and configure)
# echo -e "${GREEN}☁️ Uploading to cloud storage...${NC}"
# aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE} s3://your-backup-bucket/kennysolutions/
# Or use rclone: rclone copy ${BACKUP_DIR}/${BACKUP_FILE} remote:kennysolutions/

echo -e "${GREEN}✅ Backup process completed!${NC}"
