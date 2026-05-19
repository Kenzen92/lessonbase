#!/usr/bin/env bash
set -e

# Navigate to the Django project directory
cd /app/lessonbase

echo "=========================================="
echo "🌐 Starting Django with Daphne (ASGI)..."
echo "=========================================="
echo "Environment: ${ENVIRONMENT:-development}"
echo "Port: ${PORT:-8000}"
echo "=========================================="

# Start Daphne ASGI server with comprehensive logging
exec daphne \
    config.asgi:application \
    --bind 0.0.0.0 \
    --port "${PORT:-8000}" \
    --verbosity 2 \
    --access-log - \
    --proxy-headers

