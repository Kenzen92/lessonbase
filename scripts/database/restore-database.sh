#!/bin/bash

# PostgreSQL Restore Script
# Restores database from a backup file
# Usage: bash restore-database.sh <backup_file>

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}❌ Usage: bash restore-database.sh <backup_file>${NC}"
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh /opt/kennysolutions/backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1
COMPOSE_FILE="/opt/kennysolutions/deploy/docker/docker-compose.vps.yml"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️ WARNING: This will OVERWRITE the current database!${NC}"
echo -e "${YELLOW}📁 Backup file: ${BACKUP_FILE}${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}❌ Restore cancelled${NC}"
    exit 1
fi

# Get database credentials
source /opt/kennysolutions/.env

echo -e "${GREEN}🗄️ Starting database restore...${NC}"

# Stop backend to prevent connections
echo -e "${YELLOW}⏸️ Stopping backend...${NC}"
docker compose -f ${COMPOSE_FILE} stop backend

# Drop and recreate database
echo -e "${YELLOW}🗑️ Dropping existing database...${NC}"
docker compose -f ${COMPOSE_FILE} exec -T db psql -U ${POSTGRES_USER} -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
docker compose -f ${COMPOSE_FILE} exec -T db psql -U ${POSTGRES_USER} -d postgres -c "CREATE DATABASE ${POSTGRES_DB};"

# Restore backup
echo -e "${GREEN}📥 Restoring backup...${NC}"
gunzip -c ${BACKUP_FILE} | docker compose -f ${COMPOSE_FILE} exec -T db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

# Restart backend
echo -e "${GREEN}▶️ Starting backend...${NC}"
docker compose -f ${COMPOSE_FILE} up -d backend

echo -e "${GREEN}✅ Database restored successfully!${NC}"
echo -e "${YELLOW}⚠️ You may need to run migrations: docker compose -f ${COMPOSE_FILE} exec backend python lessonbase/manage.py migrate${NC}"
