#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 Starting release tasks..."
echo "=========================================="

# Navigate to the Django project directory
cd /app/lessonbase

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

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
