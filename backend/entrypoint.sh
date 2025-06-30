#!/bin/bash
set -e

echo "🛠 Environment: $ENVIRONMENT"

# Run migrations
poetry run python manage.py migrate

# Collect static files in production
if [ "$ENVIRONMENT" = "production" ]; then
  poetry run python manage.py collectstatic --noinput
  echo "🚀 Starting Gunicorn..."
  exec poetry run gunicorn kennysolutions.wsgi:application --bind 0.0.0.0:8000
else
  echo "🚀 Starting Django development server..."
  exec poetry run python manage.py runserver 0.0.0.0:8000
fi
