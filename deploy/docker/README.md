# Docker Compose Configuration

This directory contains all Docker Compose configurations for the Lessonbase project.

## Files

- **docker-compose.yml** - Base configuration shared across all environments
- **docker-compose.override.yml** - Development overrides (auto-loaded in dev)
- **docker-compose.prod.yml** - Production overrides for backend-only deployment
- **docker-compose.vps.yml** - Full VPS stack with nginx, SSL, frontend, and backend

## Usage

### Development (Local)

```bash
# From project root
cd deploy/docker
docker-compose up

# Or from project root directly
docker-compose -f deploy/docker/docker-compose.yml up
```

The override file is automatically loaded, providing:
- Exposed PostgreSQL (5432) and Redis (6379) ports
- Hot-reloading with source code volume mounts
- Django development server
- DEBUG mode enabled

### Production (Backend Only)

```bash
# From deploy/docker directory
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or from project root
docker-compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.prod.yml up -d
```

### VPS Production (Full Stack)

```bash
# From project root
docker-compose -f deploy/docker/docker-compose.vps.yml up -d
```

This includes:
- PostgreSQL database
- Redis cache
- Django backend API
- React frontend
- Nginx reverse proxy
- Certbot for SSL certificates

## Environment Variables

Ensure you have a `.env` file in the `backend/` directory with required variables:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DJANGO_SECRET_KEY`
- `REDIS_PASSWORD` (for VPS)
- Other app-specific variables

## Notes

- Base configuration uses healthchecks for proper service startup ordering
- Development mounts source code for hot-reloading
- Production builds code into the image (no volume mounts)
- VPS configuration includes SSL/TLS with Let's Encrypt
