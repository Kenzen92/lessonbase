#!/usr/bin/env bash
set -e

echo "ðŸ›  Environment: $ENVIRONMENT"

cd /app/kennysolutions

# Run migrations
poetry run python manage.py migrate

# Collect static files in production
if [ "$ENVIRONMENT" = "production" ]; then
  poetry run python manage.py collectstatic --noinput
  echo "ðŸš€ Starting Gunicorn..."
  exec poetry run gunicorn kennysolutions.wsgi:application --bind 0.0.0.0:8000
else
  echo "ðŸš€ Starting Django development server..."
  exec poetry run python manage.py runserver 0.0.0.0:8000
fi

