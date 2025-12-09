# VPS Migration Checklist

Complete checklist for migrating from fly.io + Vercel to Hostinger VPS.

## Pre-Migration Preparation

### ✅ Local Setup
- [ ] Review all created files and configurations
- [ ] Update GitHub repository URL in scripts if needed
- [ ] Commit and push all changes to GitHub
- [ ] Create Docker Hub account (if not already)
- [ ] Create Docker Hub repositories:
  - [ ] `<username>/kennysolutions-frontend`
  - [ ] `<username>/kennysolutions-backend`

### ✅ Domain & DNS
- [ ] Access jkenny.tech DNS management panel
- [ ] Create A record: `teach.jkenny.tech` → VPS IP
- [ ] Create A record: `api.teach.jkenny.tech` → VPS IP
- [ ] Wait for DNS propagation (verify with `dig` or online tools)

### ✅ Credentials & Secrets
Prepare these values (keep secure):
- [ ] Docker Hub username
- [ ] Docker Hub access token
- [ ] VPS IP address
- [ ] Strong PostgreSQL password
- [ ] Strong Redis password
- [ ] Django secret key
- [ ] OpenAI API key
- [ ] Google OAuth credentials
- [ ] Gmail app password for emails
- [ ] MongoDB credentials (if applicable)

---

## VPS Setup Phase

### ✅ Initial Server Configuration
- [ ] SSH into VPS: `ssh root@<VPS_IP>`
- [ ] Clone repository: `git clone <repo> /opt/kennysolutions`
- [ ] Run setup script: `bash /opt/kennysolutions/scripts/vps-initial-setup.sh`
- [ ] Create `.env` file: `cp .env.vps.example .env`
- [ ] Fill in all environment variables in `.env`
- [ ] Verify firewall: `ufw status`
- [ ] Verify Docker: `docker --version && docker compose version`

### ✅ SSL Certificate Setup
- [ ] Ensure DNS records are propagated
- [ ] Run SSL setup: `bash /opt/kennysolutions/scripts/ssl-setup.sh`
- [ ] Choose wildcard certificate (Option 1) or individual (Option 2)
- [ ] Follow DNS challenge instructions (if wildcard)
- [ ] Verify certificates exist in `/opt/kennysolutions/certbot/conf/`

### ✅ Application Deployment
- [ ] Build images: `docker compose -f deploy/docker/docker-compose.vps.yml build`
- [ ] Start services: `docker compose -f deploy/docker/docker-compose.vps.yml up -d`
- [ ] Check containers: `docker ps` (all should be running)
- [ ] Run migrations: `docker compose -f deploy/docker/docker-compose.vps.yml exec backend /app/migrate.sh`
- [ ] Create superuser: `docker compose -f deploy/docker/docker-compose.vps.yml exec backend python /app/lessonbase/manage.py createsuperuser`
- [ ] Test frontend: `curl https://teach.jkenny.tech`
- [ ] Test backend: `curl https://api.teach.jkenny.tech/admin/login/`

---

## CI/CD Setup Phase

### ✅ GitHub Secrets Configuration
Go to: GitHub Repo → Settings → Secrets and variables → Actions

Add these secrets:
- [ ] `DOCKER_USERNAME` - Your Docker Hub username
- [ ] `DOCKER_PASSWORD` - Docker Hub access token
- [ ] `VPS_HOST` - VPS IP address
- [ ] `VPS_USER` - Usually `root`
- [ ] `VPS_SSH_KEY` - Private SSH key (see documentation)

### ✅ SSH Key for GitHub Actions
On VPS:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy -N ""
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_deploy  # Copy this to VPS_SSH_KEY secret
```

- [ ] Generate SSH key on VPS
- [ ] Add public key to authorized_keys
- [ ] Copy private key to GitHub Secrets as `VPS_SSH_KEY`

### ✅ Test CI/CD Pipeline
- [ ] Make a small change to codebase
- [ ] Commit and push to `main` branch
- [ ] Monitor GitHub Actions workflow
- [ ] Verify build and push to Docker Hub
- [ ] Verify deployment to VPS
- [ ] Check health checks pass

---

## Data Migration Phase

### ✅ Backup fly.io Data
- [ ] Install flyctl locally: `curl -L https://fly.io/install.sh | sh`
- [ ] Login: `flyctl auth login`
- [ ] Export database from fly.io (see VPS-DEPLOYMENT.md Part 8)
- [ ] Download backup file locally

### ✅ Restore to VPS
- [ ] Copy backup to VPS: `scp backup.sql.gz root@<VPS_IP>:/opt/kennysolutions/backups/`
- [ ] SSH to VPS
- [ ] Run restore: `bash scripts/restore-database.sh /opt/kennysolutions/backups/backup.sql.gz`
- [ ] Verify data in database
- [ ] Test application functionality

---

## Testing Phase

### ✅ Frontend Testing
- [ ] Access https://teach.jkenny.tech
- [ ] Test user login
- [ ] Test Google OAuth login
- [ ] Navigate through all pages
- [ ] Test responsive design
- [ ] Check browser console for errors

### ✅ Backend Testing
- [ ] Access https://api.teach.jkenny.tech/admin/
- [ ] Login to Django admin
- [ ] Test API endpoints
- [ ] Test WebSocket connections (if applicable)
- [ ] Verify file uploads work
- [ ] Check email sending works

### ✅ Performance Testing
- [ ] Test page load speeds
- [ ] Check SSL certificate: https://www.ssllabs.com/ssltest/
- [ ] Test from different devices
- [ ] Monitor server resources: `htop`

---

## Security & Maintenance Setup

### ✅ Backups
- [ ] Test manual backup: `bash /opt/kennysolutions/scripts/backup-database.sh`
- [ ] Verify backup file created
- [ ] Setup automated backups: `crontab -e`
- [ ] Add: `0 2 * * * /opt/kennysolutions/scripts/backup-database.sh`
- [ ] Test restore process

### ✅ Monitoring
- [ ] Setup uptime monitoring (e.g., UptimeRobot, free tier)
- [ ] Configure email/Slack alerts
- [ ] Monitor disk space: `df -h`
- [ ] Check Docker logs regularly

### ✅ Security Hardening
- [ ] Verify fail2ban is running: `systemctl status fail2ban`
- [ ] Check firewall rules: `ufw status verbose`
- [ ] Review fail2ban logs: `fail2ban-client status sshd`
- [ ] Test SSL auto-renewal: `certbot renew --dry-run`
- [ ] Uncomment HSTS header in nginx after testing (nginx/conf.d/*.conf)

---

## Decommission Old Infrastructure

### ✅ Verify Everything Works on VPS
- [ ] All features working
- [ ] No errors in logs
- [ ] Data migrated successfully
- [ ] CI/CD pipeline working
- [ ] Backups configured
- [ ] Monitoring setup

### ✅ Shutdown fly.io
- [ ] Remove DNS records pointing to fly.io (if any)
- [ ] Scale down fly.io app: `flyctl scale count 0`
- [ ] Delete fly.io app: `flyctl apps destroy <app-name>`
- [ ] Cancel fly.io subscription/billing

### ✅ Shutdown Vercel
- [ ] Remove custom domain from Vercel project
- [ ] Delete Vercel project or mark as inactive
- [ ] Cancel Vercel subscription (if applicable)

---

## Post-Migration Tasks

### ✅ Documentation Updates
- [ ] Update README.md with new deployment info
- [ ] Update any API documentation
- [ ] Document any configuration changes
- [ ] Share VPS access with team (if applicable)

### ✅ Optimization
- [ ] Review and optimize Docker images
- [ ] Setup log rotation
- [ ] Configure Docker resource limits
- [ ] Optimize database indexes
- [ ] Setup CDN for static assets (optional)

### ✅ Long-term Maintenance
- [ ] Schedule regular system updates
- [ ] Review and rotate credentials every 90 days
- [ ] Monitor disk usage and set alerts
- [ ] Review backups monthly
- [ ] Update dependencies regularly

---

## Emergency Rollback Plan

If something goes wrong:

1. **Keep fly.io/Vercel running** until VPS is fully tested
2. **DNS rollback**: Change A records back to old infrastructure
3. **Access backups**: Use restore script to rollback VPS database
4. **Contact**: Keep VPS provider support info handy

---

## Success Criteria ✨

You've successfully migrated when:
- ✅ Both subdomains work with valid SSL
- ✅ Users can access and use all features
- ✅ CI/CD pipeline deploys automatically
- ✅ Backups run daily without issues
- ✅ No errors in application logs
- ✅ Old infrastructure is decommissioned

---

## Support Resources

- **VPS Deployment Guide**: [docs/VPS-DEPLOYMENT.md](docs/VPS-DEPLOYMENT.md)
- **Docker Documentation**: https://docs.docker.com
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/

---

**Estimated Total Time**: 4-8 hours (depending on experience and data size)

**Good luck with your migration! 🚀**
