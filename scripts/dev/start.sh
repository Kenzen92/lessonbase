#!/usr/bin/env bash
set -euo pipefail

echo "Starting dev environment..."

# Resolve script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$ROOT_DIR/deploy/docker"
FRONTEND_DIR="$ROOT_DIR/frontend"

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

echo "Project root: $ROOT_DIR"

if ! command_exists docker; then
	echo "Error: docker is not installed or not on PATH. Please install Docker and try again."
	exit 1
fi

if [ ! -d "$DOCKER_DIR" ]; then
	echo "Error: docker folder not found at $DOCKER_DIR"
	exit 1
fi

echo "-- Starting backend (docker compose) in $DOCKER_DIR --"
pushd "$DOCKER_DIR" >/dev/null

echo "Running: docker-compose up -d --build"
docker-compose up -d --build

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
