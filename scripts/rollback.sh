#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -s .previous_rev ]] || { echo "No previous revision recorded" >&2; exit 1; }
previous=$(cat .previous_rev)
git cat-file -e "$previous^{commit}"
git checkout --detach "$previous"
docker compose -p quiet-tunnel -f docker-compose.yml up -d --build
curl -fsS --max-time 20 http://127.0.0.1:18080/api/v1/health
