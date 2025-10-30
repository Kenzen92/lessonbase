#!/usr/bin/env bash
set -euo pipefail

echo "Starting dev environment..."

# Resolve script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

echo "Project root: $ROOT_DIR"

if ! command_exists docker; then
	echo "Error: docker is not installed or not on PATH. Please install Docker and try again."
	exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
	echo "Error: backend folder not found at $BACKEND_DIR"
	exit 1
fi

echo "-- Starting backend (docker compose) in $BACKEND_DIR --"
pushd "$BACKEND_DIR" >/dev/null

echo "Running: docker compose -f docker-compose.dev.yml up -d --build"
docker compose -f docker-compose.dev.yml up -d --build

popd >/dev/null

if ! command_exists npm; then
	echo "Error: npm is not installed or not on PATH. Please install Node/npm and try again."
	exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
	echo "Error: frontend folder not found at $FRONTEND_DIR"
	exit 1
fi

echo "-- Starting frontend (Vite dev server) in $FRONTEND_DIR --"
pushd "$FRONTEND_DIR" >/dev/null

echo "Running: npm run dev"
# Use exec so the script process is replaced by the dev server (Ctrl+C stops it)
exec npm run dev

popd >/dev/null
