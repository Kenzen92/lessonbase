# VPS Deployment Guide - Hostinger to jkenny.tech

Complete guide for deploying Kenny Solutions (Teaching Management Platform) to a Hostinger VPS with CI/CD.

## Architecture Overview

```
Internet
   ↓
[DNS: teach.jkenny.tech & api.teach.jkenny.tech]
   ↓
[Hostinger VPS - Nginx on :80/:443]
   ├─ teach.jkenny.tech → Frontend Container (React/Vite)
   └─ api.teach.jkenny.tech → Backend Container (Django)
        ├─ PostgreSQL Container
        └─ Redis Container
```

## Prerequisites

- Hostinger VPS with root access
- Domain: jkenny.tech with DNS access
- GitHub account with repository access
- Docker Hub account

---

## Part 1: DNS Configuration

### 1. Add A Records

In your domain registrar (jkenny.tech DNS settings):

```
Type    Name            Value               TTL
A       teach           <YOUR_VPS_IP>       Auto
A       api.teach       <YOUR_VPS_IP>       Auto
```

**Verify DNS propagation** (may take 5-60 minutes):

```bash
dig teach.jkenny.tech
dig api.teach.jkenny.tech
```

---

## Part 2: VPS Initial Setup

### 1. Connect to Your VPS

```bash
ssh root@<YOUR_VPS_IP>
```

### 2. Run Initial Setup Script

```bash
# Clone the repository
git clone https://github.com/yourusername/kennysolutions.git /opt/kennysolutions
cd /opt/kennysolutions

# Make scripts executable
chmod +x scripts/**/*.sh

# Run initial setup
sudo bash scripts/deploy/vps-initial-setup.sh
```

This script will:

- Update system packages
- Install Docker & Docker Compose
- Configure firewall (UFW)
- Setup fail2ban for security
- Create application directories

### 3. Configure Environment Variables

```bash
cd /opt/kennysolutions
cp deploy/env/.env.vps.example .env
nano .env
```

**Required environment variables:**

```bash
# Docker Hub
DOCKER_USERNAME=your_docker_hub_username

# Database
POSTGRES_DB=kennysolutions_db
POSTGRES_USER=kennysolutions_user
POSTGRES_PASSWORD=<generate-strong-password>

# Redis
REDIS_PASSWORD=<generate-strong-password>

# Django
DJANGO_SECRET_KEY=<generate-secret-key>
SECRET_KEY=<same-as-above>

# URLs
FRONTEND_URL=https://teach.jkenny.tech
BASE_URL=https://api.teach.jkenny.tech

# External APIs
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret

# Cloudflare R2 storage
R2_BUCKET_NAME=lessonbase
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_ACCESS_SECRET=your_r2_secret_access_key
R2_S3_API=https://<your-account-id>.r2.cloudflarestorage.com

# Email
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password

# Environment
ENVIRONMENT=production
```

**Generate secure passwords:**

```bash
# Generate Django secret key
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Generate random passwords
openssl rand -base64 32
```

---

## Part 3: SSL Certificate Setup

### Option A: Wildcard Certificate (Recommended)

```bash
sudo bash scripts/ssl/ssl-setup.sh
# Select option 1 (DNS Challenge)
```

Follow the prompts to add a TXT record to your DNS:

```
Type    Name                    Value
TXT     _acme-challenge         <provided-by-certbot>
```

Wait for DNS propagation, then press Enter to continue.

### Option B: Individual Certificates

```bash
sudo bash scripts/ssl/ssl-setup.sh
# Select option 2 (HTTP Challenge)
```

This will automatically obtain certificates for `teach.jkenny.tech` and `api.teach.jkenny.tech`.

---

## Part 4: Initial Deployment

### 1. Build and Start Services

```bash
cd /opt/kennysolutions

# Pull images from Docker Hub (if built via CI/CD)
docker compose -f deploy/docker/docker-compose.vps.yml pull

# Or build locally
docker compose -f deploy/docker/docker-compose.vps.yml build

# Start all services
docker compose -f deploy/docker/docker-compose.vps.yml up -d
```

### 2. Run Database Migrations

```bash
docker compose -f deploy/docker/docker-compose.vps.yml exec backend /app/migrate.sh
```

### 3. Create Django Superuser

```bash
docker compose -f deploy/docker/docker-compose.vps.yml exec backend python /app/lessonbase/manage.py createsuperuser
```

### 4. Verify Deployment

```bash
# Check all containers are running
docker ps

# Check logs
docker compose -f deploy/docker/docker-compose.vps.yml logs -f

# Test endpoints
curl https://teach.jkenny.tech
curl https://api.teach.jkenny.tech/admin/login/
```

---

## Part 5: GitHub Actions CI/CD Setup

### 1. Create Docker Hub Repositories

Go to [Docker Hub](https://hub.docker.com/) and create:

- `<username>/kennysolutions-frontend`
- `<username>/kennysolutions-backend`

### 2. Add GitHub Secrets

In your GitHub repository: **Settings → Secrets and variables → Actions**

Add the following secrets:

| Secret Name       | Value                | Description                 |
| ----------------- | -------------------- | --------------------------- |
| `DOCKER_USERNAME` | your_docker_username | Docker Hub username         |
| `DOCKER_PASSWORD` | your_docker_token    | Docker Hub access token     |
| `VPS_HOST`        | your.vps.ip.address  | VPS IP address              |
| `VPS_USER`        | root                 | SSH user (usually root)     |
| `VPS_SSH_KEY`     | `<private-key>`      | SSH private key (see below) |

### 3. Generate SSH Key for GitHub Actions

On your VPS:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy -N ""

# Add public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Display private key to copy
cat ~/.ssh/github_actions_deploy
```

Copy the **entire private key** (including `-----BEGIN` and `-----END` lines) and add it as `VPS_SSH_KEY` in GitHub Secrets.

### 4. Test CI/CD Pipeline

```bash
# Push to main branch
git add .
git commit -m "Deploy to VPS"
git push origin main
```

GitHub Actions will:

1. Build Docker images
2. Push to Docker Hub
3. SSH into VPS
4. Pull latest images
5. Run migrations
6. Restart services
7. Verify health checks

---

## Part 6: Database Backups

### 1. Setup Automated Backups

```bash
# Make backup script executable
chmod +x /opt/kennysolutions/scripts/database/backup-database.sh

# Test backup
sudo bash /opt/kennysolutions/scripts/database/backup-database.sh

# Add to crontab for daily backups at 2 AM
crontab -e
```

Add this line:

```bash
0 2 * * * /opt/kennysolutions/scripts/database/backup-database.sh >> /var/log/kennysolutions-backup.log 2>&1
```

### 2. Restore from Backup

```bash
# List available backups
ls -lh /opt/kennysolutions/backups/

# Restore a backup
sudo bash /opt/kennysolutions/scripts/database/restore-database.sh /opt/kennysolutions/backups/kennysolutions_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## Part 7: Monitoring & Maintenance

### View Logs

```bash
# All services
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml logs -f

# Specific service
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml logs -f backend
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml logs -f frontend
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml logs -f nginx
```

### Check Service Status

```bash
docker ps
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml ps
```

### Restart Services

```bash
# All services
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml restart

# Specific service
docker compose -f /opt/kennysolutions/deploy/docker/docker-compose.vps.yml restart backend
```

### Update Application

```bash
cd /opt/kennysolutions
git pull origin main
docker compose -f deploy/docker/docker-compose.vps.yml up -d --build
```

### SSL Certificate Renewal

Certificates auto-renew via cron. Test renewal:

```bash
certbot renew --dry-run
```

---

## Part 8: Migrating Data from fly.io

### 1. Backup fly.io Database

```bash
# Install flyctl locally
curl -L https://fly.io/install.sh | sh

# Login to fly.io
flyctl auth login

# Connect to fly.io postgres
flyctl postgres connect -a <your-postgres-app-name>

# Export data
pg_dump -U postgres -d <database_name> --no-owner --no-acl | gzip > fly_backup_$(date +%Y%m%d).sql.gz

# Exit fly.io shell
exit
```

### 2. Restore to VPS

```bash
# Copy backup to VPS
scp fly_backup_*.sql.gz root@<VPS_IP>:/opt/kennysolutions/backups/

# SSH to VPS
ssh root@<VPS_IP>

# Restore using restore script
cd /opt/kennysolutions
bash scripts/database/restore-database.sh /opt/kennysolutions/backups/fly_backup_*.sql.gz
```

---

## Troubleshooting

### Issue: SSL Certificate Error

**Solution:**

```bash
# Check certificate files
ls -la /opt/kennysolutions/certbot/conf/live/jkenny.tech/

# Restart nginx
docker compose -f docker-compose.vps.yml restart nginx
```

### Issue: Backend Not Responding

**Solution:**

```bash
# Check backend logs
docker compose -f deploy/docker/docker-compose.vps.yml logs backend

# Restart backend
docker compose -f deploy/docker/docker-compose.vps.yml restart backend

# Run migrations
docker compose -f deploy/docker/docker-compose.vps.yml exec backend /app/migrate.sh
```

### Issue: Frontend Not Loading

**Solution:**

```bash
# Check nginx logs
docker compose -f deploy/docker/docker-compose.vps.yml logs nginx

# Verify frontend container
docker compose -f deploy/docker/docker-compose.vps.yml exec frontend ls /usr/share/nginx/html

# Rebuild frontend
docker compose -f deploy/docker/docker-compose.vps.yml up -d --build frontend
```

### Issue: Database Connection Error

**Solution:**

```bash
# Check database is running
docker compose -f deploy/docker/docker-compose.vps.yml ps db

# Check environment variables
docker compose -f deploy/docker/docker-compose.vps.yml exec backend env | grep POSTGRES

# Restart database
docker compose -f deploy/docker/docker-compose.vps.yml restart db
```

---

## Security Best Practices

1. **Keep system updated:**

   ```bash
   apt update && apt upgrade -y
   ```

2. **Monitor fail2ban:**

   ```bash
   fail2ban-client status sshd
   ```

3. **Review firewall rules:**

   ```bash
   ufw status verbose
   ```

4. **Rotate credentials regularly**

5. **Monitor disk space:**

   ```bash
   df -h
   docker system df
   ```

6. **Clean up Docker:**
   ```bash
   docker system prune -a --volumes
   ```

---

## Useful Commands Cheat Sheet

```bash
# View all containers
docker ps -a

# View container resource usage
docker stats

# Execute commands in containers
docker compose -f deploy/docker/docker-compose.vps.yml exec backend python /app/lessonbase/manage.py shell

# View nginx configuration
docker compose -f deploy/docker/docker-compose.vps.yml exec nginx cat /etc/nginx/nginx.conf

# Test nginx configuration
docker compose -f deploy/docker/docker-compose.vps.yml exec nginx nginx -t

# Reload nginx without downtime
docker compose -f deploy/docker/docker-compose.vps.yml exec nginx nginx -s reload

# Access database CLI
docker compose -f deploy/docker/docker-compose.vps.yml exec db psql -U kennysolutions_user -d kennysolutions_db

# Access Redis CLI
docker compose -f deploy/docker/docker-compose.vps.yml exec redis redis-cli -a <REDIS_PASSWORD>
```

---

## Support & Resources

- **GitHub Repository**: https://github.com/yourusername/kennysolutions
- **Docker Documentation**: https://docs.docker.com
- **Let's Encrypt**: https://letsencrypt.org
- **Django Documentation**: https://docs.djangoproject.com

---

## Next Steps After Deployment

1. ✅ Verify all services are running
2. ✅ Test frontend at https://teach.jkenny.tech
3. ✅ Test backend at https://api.teach.jkenny.tech/admin/
4. ✅ Configure automated backups
5. ✅ Set up monitoring (optional)
6. ✅ Update DNS TTL to longer values (3600+)
7. ✅ Uncomment HSTS header in nginx config after testing
8. ✅ Shut down fly.io and Vercel deployments

**Congratulations! Your application is now deployed on your VPS! 🎉**
