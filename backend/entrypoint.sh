#!/usr/bin/env bash
set -e

echo "🚀 Running database migrations..."
uv run python manage.py migrate --noinput

echo "🌐 Starting Django server..."
uv run python manage.py runserver 0.0.0.0:8000
