#!/usr/bin/env bash
set -e

echo "🚀 Running database migrations..."
# Set environment to disable async/channels during migration
DJANGO_SETTINGS_MODULE=lessonbase.settings uv run python manage.py migrate --noinput --run-syncdb

echo "✅ Migrations complete, exiting..."
exit 0
