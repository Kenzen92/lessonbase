# Environment Configuration Templates

This directory contains environment variable templates for different deployment scenarios.

## Files

- **.env.backend.example** - Backend Django application environment variables
- **.env.frontend.example** - Frontend React application environment variables
- **.env.vps.example** - Full VPS deployment with all services

## Usage

### Backend Development

```bash
cp deploy/env/.env.backend.example backend/.env
# Edit backend/.env with your local values
```

### Frontend Development

```bash
cp deploy/env/.env.frontend.example frontend/.env.production
# Edit frontend/.env.production with your values
```

### VPS Deployment

```bash
cp deploy/env/.env.vps.example .env
# Edit .env with your production values
```

## Security Notes

- **NEVER** commit actual `.env` files to version control
- All `.env` files are gitignored except `.example` templates
- Use strong, unique values for all secrets in production
- Rotate secrets regularly
