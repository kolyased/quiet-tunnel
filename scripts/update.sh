#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
previous=$(git rev-parse HEAD)
printf '%s\n' "$previous" > .previous_rev
if ! git fetch --prune origin || ! git checkout main || ! git pull --ff-only origin main || ! ./scripts/deploy.sh; then
  echo "Update failed; restoring $previous" >&2
  git checkout --detach "$previous"
  docker compose -p quiet-tunnel -f docker-compose.yml up -d --build
  exit 1
fi
