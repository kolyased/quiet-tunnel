# Deployment

The production site is served at https://quiet-tunnel.duckdns.org. On the target VPS, an existing host Caddy service owns ports 80 and 443, so it remains the TLS edge and automatically obtains/renews the Let's Encrypt certificate. A dated copy of `/etc/caddy/Caddyfile` is made before the dedicated hostname block is added and Caddy is validated and reloaded.

Docker Compose runs a non-root Next.js frontend and FastAPI backend on the isolated `quiet-tunnel` network. A dedicated Nginx container is the only service attached to the separate ingress bridge; it proxies `/api/` to FastAPI and other requests to Next.js. Nginx is published only at `127.0.0.1:18080`, then Caddy proxies the hostname to it. Backend and frontend ports are not published. Docker restart policies and healthchecks keep the stack running across process and host restarts.

## Deploy and operate

Copy `.env.example` to `.env` and preserve `WARP_PROVIDER_MODE=mock` and `WARP_GENERATION_ENABLED=false`. Protect `.env` with mode `0600`. On the production VPS:

```sh
./scripts/deploy.sh
./scripts/status.sh
./scripts/logs.sh
./scripts/update.sh
./scripts/rollback.sh
```

The VPS uses a checkout of `https://github.com/kolyased/quiet-tunnel` at `/opt/quiet-tunnel`; its production `.env` is excluded from Git. `update.sh` fetches `origin/main`, records the previous commit, builds only this Compose project, checks the health endpoint, and restores that commit if deployment fails. `rollback.sh` returns to the recorded commit and rebuilds the project.

Caddy's managed certificate renewal is automatic. To inspect it, use `systemctl status caddy`, `journalctl -u caddy`, and `curl -Iv https://quiet-tunnel.duckdns.org`. To diagnose the app, use the scripts above; the API health endpoint is `https://quiet-tunnel.duckdns.org/api/v1/health`.

Never publish the backend port, run global Docker prune/cleanup commands, or edit another site's Caddy block during Quiet Tunnel maintenance. The production service is demo-only; the API deliberately refuses real provider registration.
