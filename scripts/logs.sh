#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -p quiet-tunnel -f docker-compose.yml logs --tail=100 -f "$@"
