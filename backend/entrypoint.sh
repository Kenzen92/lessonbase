#!/bin/sh
set -e

# Ensure we use the venv created at build time. The venv lives at /opt/venv
export PATH="/opt/venv/bin:$PATH"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

log "Environment: ${ENVIRONMENT:-unset}"

# Move into the Django project directory
cd /app/kennysolutions || exit 1

log "Running database migrations..."
# Call the venv python directly to avoid uv creating a project venv at /app/.venv
uv run manage.py migrate

if [ "${ENVIRONMENT:-development}" = "production" ]; then
  log "Collecting static files..."
  uv run manage.py collectstatic --noinput
  log "Starting Gunicorn..."
  exec gunicorn kennysolutions.wsgi:application --bind 0.0.0.0:8000
else
  log "Starting Django development server..."
  exec uv run manage.py runserver 0.0.0.0:8000
fi
