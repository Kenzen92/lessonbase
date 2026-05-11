#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

pushd "$ROOT_DIR/deploy/docker" >/dev/null
docker compose -f docker-compose.test.yml up -d --build --wait db redis backend
popd >/dev/null

pushd "$ROOT_DIR/frontend" >/dev/null
E2E_API_BASE_URL="http://127.0.0.1:8010" npm run test:e2e:chat
popd >/dev/null