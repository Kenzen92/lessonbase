#!/usr/bin/env bash
set -euo pipefail

echo "Starting dev environment..."

# Resolve script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$ROOT_DIR/deploy/docker"
FRONTEND_DIR="$ROOT_DIR/frontend"
STUN_DIR="$ROOT_DIR/backend/stun"
ENV_FILE="$ROOT_DIR/backend/.env"

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

if [ ! -f "$ENV_FILE" ]; then
	echo "Error: environment file not found at $ENV_FILE"
	exit 1
fi

echo "-- Starting backend (docker compose) in $DOCKER_DIR --"
pushd "$DOCKER_DIR" >/dev/null

echo "Running: docker compose --env-file $ENV_FILE up -d --build"
docker compose --env-file "$ENV_FILE" up -d --build

popd >/dev/null

if ! command_exists npm; then
	echo "Error: npm is not installed or not on PATH. Please install Node/npm and try again."
	exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
	echo "Error: frontend folder not found at $FRONTEND_DIR"
	exit 1
fi

if command_exists go; then
	if [ -d "$STUN_DIR" ]; then
		echo "-- Starting STUN server in $STUN_DIR --"
		pushd "$STUN_DIR" >/dev/null
		echo "Running: go run ./cmd (background)"
		go run ./cmd &
		STUN_PID=$!
		popd >/dev/null
		echo "STUN server started (PID: $STUN_PID)"
	else
		echo "Warning: STUN server directory not found at $STUN_DIR, skipping."
	fi
else
	echo "Warning: go is not installed, skipping STUN server."
fi

# Trap to clean up background processes on exit
cleanup() {
	echo ""
	echo "Shutting down..."
	if [ -n "${STUN_PID:-}" ] && kill -0 "$STUN_PID" 2>/dev/null; then
		echo "Stopping STUN server (PID: $STUN_PID)"
		kill "$STUN_PID" 2>/dev/null || true
	fi
}
trap cleanup EXIT INT TERM

echo "-- Starting frontend (Vite dev server) in $FRONTEND_DIR --"
pushd "$FRONTEND_DIR" >/dev/null

echo "Running: npm run dev"
npm run dev

popd >/dev/null
