#!/usr/bin/env bash
# Exit immediately on errors, undefined vars are errors, and pipelines fail if any part fails
set -euo pipefail

# Simple logging helper
log() { printf "%s %s\n" "[$(date -u +%Y-%m-%dT%H:%M:%SZ)]" "$*"; }

# Trap errors to emit a helpful message before exiting
on_error() {
  local rc=$?
  log "ERROR: entrypoint failed with exit code $rc"
  exit $rc
}
trap on_error ERR

log "Environment: ${ENVIRONMENT:-unset}"

cd /app/kennysolutions

# Run migrations (will exit non-zero on failure)
log "Running database migrations..."
poetry run python manage.py migrate

# Collect static files in production and start the appropriate server
if [ "${ENVIRONMENT:-development}" = "production" ]; then
  log "Collecting static files..."
  poetry run python manage.py collectstatic --noinput
  log "Starting Gunicorn..."
  # exec replaces the shell with the server process so PID 1 is the server
  exec poetry run gunicorn kennysolutions.wsgi:application --bind 0.0.0.0:8000
else
  log "Starting Django development server..."
  exec poetry run python manage.py runserver 0.0.0.0:8000
fi

