#!/usr/bin/env bash
set -e

echo "🌐 Starting Django server with Gunicorn..."
uv run gunicorn kennysolutions.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
