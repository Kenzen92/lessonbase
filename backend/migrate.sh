#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 Starting release tasks..."
echo "=========================================="

# Navigate to the Django project directory
cd /app/lessonbase

# Verify database configuration is set (either POSTGRES_DB or DATABASE_URL)
if [ -z "$POSTGRES_DB" ] && [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: Database configuration is not set!"
    echo "   Please set either POSTGRES_DB (with POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST)"
    echo "   or DATABASE_URL environment variable."
    exit 1
fi

if [ -n "$POSTGRES_DB" ]; then
    echo "✅ Database configured via POSTGRES_* environment variables"
    echo "   Host: ${POSTGRES_HOST:-db}, Database: $POSTGRES_DB"
else
    echo "✅ Database configured via DATABASE_URL"
fi

# Check database connectivity before proceeding
echo "📡 Checking database connectivity..."
if ! python manage.py check --database default 2>&1; then
    echo "❌ Database connectivity check failed!"
    exit 1
fi
echo "✅ Database is accessible"

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear
echo "✅ Static files collected"

# Run database migrations
echo "🔄 Running database migrations..."
python manage.py migrate --noinput

echo "=========================================="
echo "✅ All release tasks completed successfully!"
echo "=========================================="
exit 0
