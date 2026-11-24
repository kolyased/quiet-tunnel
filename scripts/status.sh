#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -p quiet-tunnel -f docker-compose.yml ps
curl -fsS --max-time 5 http://127.0.0.1:18080/api/v1/health
printf '\n'
