#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then install -m 600 .env.example .env; fi
docker compose -p quiet-tunnel -f docker-compose.yml config -q
docker compose -p quiet-tunnel -f docker-compose.yml up -d --build --remove-orphans
for _ in {1..30}; do
  if curl -fsS --max-time 3 http://127.0.0.1:18080/api/v1/health >/dev/null; then exit 0; fi
  sleep 2
done
echo "Quiet Tunnel health check failed" >&2
docker compose -p quiet-tunnel -f docker-compose.yml ps >&2
exit 1
