#!/bin/sh
set -e

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

log "Environment: ${ENVIRONMENT:-unset}"

cd /app/kennysolutions

log "Running database migrations..."
poetry run python manage.py migrate

if [ "${ENVIRONMENT:-development}" = "production" ]; then
  log "Collecting static files..."
  poetry run python manage.py collectstatic --noinput
  log "Starting Gunicorn..."
  exec poetry run gunicorn kennysolutions.wsgi:application --bind 0.0.0.0:8000
else
  log "Starting Django development server..."
  exec poetry run python manage.py runserver 0.0.0.0:8000
fi

