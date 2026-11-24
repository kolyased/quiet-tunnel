#!/usr/bin/env bash
set -euo pipefail
file=/etc/caddy/Caddyfile
domain=quiet-tunnel.duckdns.org
[[ -f "$file" ]] || { echo "Expected existing Caddy config is missing" >&2; exit 1; }
if grep -Fq "$domain {" "$file"; then echo "Quiet Tunnel vhost already exists"; exit 0; fi
backup="${file}.quiet-tunnel.$(date -u +%Y%m%dT%H%M%SZ).bak"
cp -a "$file" "$backup"
cat >> "$file" <<'CADDY'

quiet-tunnel.duckdns.org {
    tls {
        protocols tls1.2 tls1.3
    }
    encode zstd gzip
    reverse_proxy 127.0.0.1:18080
}
CADDY
if ! caddy validate --config "$file" || ! systemctl reload caddy; then
  cp -a "$backup" "$file"
  systemctl reload caddy || true
  echo "Caddy validation/reload failed; restored $backup" >&2
  exit 1
fi
echo "Caddy site enabled; config backup: $backup"
