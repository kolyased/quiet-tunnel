# Deployment

Production runs at https://quiet-tunnel.duckdns.org from `/opt/quiet-tunnel`. The existing host Caddy service owns ports 80/443 and manages HTTPS. The Docker Compose project runs Next.js, FastAPI, and an isolated Nginx ingress container. Only Nginx is bound to host loopback (`127.0.0.1:18080`); frontend and backend ports are private. The user VPN traffic is never routed through this VPS.

## Configuration

Create a private root `.env` from `.env.example`, set:

```dotenv
APP_ENV=production
APP_URL=https://quiet-tunnel.duckdns.org
APP_MODE=disabled
VPN_PROVIDER=cloudflare
WARP_EXPERIMENTAL_ENABLED=false
AUTH_PASSWORD_HASH=<output from scripts/hash_password.py>
AUTH_SESSION_SECRET=<random value from openssl rand -hex 32>
ALLOWED_ORIGINS=https://quiet-tunnel.duckdns.org
LOG_LEVEL=INFO
```

The branch contains an experimental Cloudflare consumer API adapter, but its use is not documented or confirmed as permitted by Cloudflare. Keep `APP_MODE=disabled` and `WARP_EXPERIMENTAL_ENABLED=false`; do not enable it for the live site until written provider approval or supported API documentation covers this exact flow. Restrict the environment file with `chmod 600 .env`; keep it out of Git. Restart backend and frontend after auth changes. Rotating `AUTH_SESSION_SECRET` invalidates existing sessions.

## Operations

The deployment and rollback scripts operate only on this Compose project:

```sh
./scripts/deploy.sh
./scripts/status.sh
./scripts/logs.sh
./scripts/update.sh
./scripts/rollback.sh
```

`update.sh` records the current revision, fetches `origin/main`, builds this Compose project and checks health; it restores the previous revision if checks fail. Rollback rebuilds the recorded revision. Avoid global Docker cleanup.

## Diagnostics

- Check `./scripts/status.sh` and `./scripts/logs.sh`.
- Public health endpoint: `https://quiet-tunnel.duckdns.org/api/v1/health`.
- Validate host Caddy configuration before reload; do not modify other virtual hosts.
- Verify HTTPS externally with `curl -Iv https://quiet-tunnel.duckdns.org`.
- `GET /api/v1/capabilities` reports actual backend mode and provider availability; the application page itself requires owner login.

Compose healthchecks and `restart: unless-stopped` keep services available after container or host restart. Login and generation rate counters are process-local and reset on restart. Backend has no host-published port. Do not install a VPN server or route VPN traffic through this VPS.
