# Project Structure Analysis

## Current Issues Identified

### 1. **Duplicate manage.py** (CRITICAL)
- **Issue**: `backend/manage.py/` exists as an EMPTY DIRECTORY
- **Expected**: `backend/lessonbase/manage.py` is the actual file
- **Action**: DELETE the empty directory

### 2. **Nested lessonbase Structure**
Current: `backend/lessonbase/lessonbase/` (confusing double nesting)
- This is actually correct for Django projects (outer = project root, inner = settings package)
- No change needed

### 3. **Scattered Docker Compose Files**
- ~~`backend/docker-compose.dev.yml`~~ → MOVED to `deploy/docker/`
- ~~`backend/docker-compose.prod.yml`~~ → MOVED to `deploy/docker/`
- ~~`docker-compose.vps.yml`~~ → MOVED to `deploy/docker/`
- **Action**: Delete old files after verification

### 4. **Root-level node_modules**
- **Issue**: `./node_modules/` at project root (from old package.json)
- **Size**: Small/legacy
- **Action**: DELETE - frontend has its own node_modules

### 5. **Scattered .env files**
- `backend/.env` ✓ (correct location)
- `backend/.env.example` ✓ (correct location)
- `.env.vps.example` (at root)
- `frontend/.env.development`
- `frontend/.env.production`
- `frontend/.env.production.example`
- `frontend/.env.template`
- **Action**: Consolidate examples into `deploy/` directory

### 6. **Migration Checklist at Root**
- `MIGRATION-CHECKLIST.md` seems outdated/temporary
- **Action**: Review and move to `docs/` or delete

### 7. **Scripts Organization**
Current scripts are well organized but could be categorized:
- Deployment: `build-and-push.*`, `quick-deploy.sh`, `vps-initial-setup.sh`
- Database: `backup-database.sh`, `restore-database.sh`
- SSL: `ssl-setup.sh`
- Development: `start.sh`, `start.ps1`

## Recommended Structure

```
kennysolutions/
├── .github/
│   └── workflows/
├── backend/
│   ├── lessonbase/           # Django project
│   │   ├── apps/             # Django apps
│   │   ├── backend/          # Backend-specific code
│   │   ├── lessonbase/       # Django settings package
│   │   └── manage.py         # Django management script
│   ├── .dockerignore
│   ├── .env                  # Local env (gitignored)
│   ├── .env.example          # Template
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── migrate.sh
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.development      # Dev env
│   ├── .env.production       # Prod env (gitignored)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
├── deploy/
│   ├── docker/               # Docker compose configs
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.override.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── docker-compose.vps.yml
│   │   └── README.md
│   └── env/                  # Environment templates
│       ├── .env.backend.example
│       ├── .env.frontend.example
│       └── .env.vps.example
├── nginx/
│   ├── conf.d/
│   └── nginx.conf
├── scripts/
│   ├── deploy/               # Deployment scripts
│   ├── database/             # Database scripts
│   ├── ssl/                  # SSL scripts
│   └── dev/                  # Development scripts
├── docs/
│   ├── features/
│   ├── README.md
│   └── VPS-DEPLOYMENT.md
├── .gitignore
├── README.md
└── package.json              # Root scripts only

```

## Files to Delete

1. `backend/manage.py/` (empty directory)
2. `node_modules/` (at root)
3. `package-lock.json` (at root, if not needed)
4. `backend/docker-compose.dev.yml` (moved)
5. `backend/docker-compose.prod.yml` (moved)
6. `docker-compose.vps.yml` (moved)
7. `backend/fly.toml` (if not using Fly.io)

## Files to Move

1. `MIGRATION-CHECKLIST.md` → `docs/` or delete
2. `.env.vps.example` → `deploy/env/`
3. `frontend/.env.*.example` → `deploy/env/`

## Clean Structure Benefits

- Clear separation of concerns
- Easy to find configuration files
- Organized deployment scripts
- Single source of truth for Docker configs
- Better for CI/CD automation
