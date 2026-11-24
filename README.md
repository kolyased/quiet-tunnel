# Quiet Tunnel

**Personal VPN Configuration Generator** for a single owner. The source repository is public; the deployed application is password protected.

**Site:** https://quiet-tunnel.duckdns.org

Quiet Tunnel is independent and is not a Cloudflare, WireGuard, or Amnezia product.

## Status

The modular generation flow is implemented: the browser creates an X25519 key pair, sends only the public key to the backend, receives typed provider parameters, and assembles a WireGuard `.conf`, QR code, and downloadable file locally. The project includes a mock provider, a no-network Cloudflare adapter template, and a disabled mode.

Mock parameters use reserved test ranges and **cannot connect to a VPN**. The Cloudflare integration is not implemented and production generation is disabled. AmneziaWG output is disabled because no configured provider confirms support for the server-side obfuscation parameters it requires.

## Features

- Single-owner login using an scrypt password hash and expiring HttpOnly session cookie.
- Browser-local X25519 key generation; the private key is not sent in API requests.
- Browser-local configuration assembly, QR generation, download, copy, and clearing.
- Runtime capabilities from the backend; themes, RU/EN, responsive UI, and connection guides.
- Replaceable VPN provider adapters with a typed contract.

## Local development

Requirements: Python 3.12+, Node.js 24+, and npm.

1. Generate an owner password hash with `python3 scripts/hash_password.py`.
2. Generate a session secret with `openssl rand -hex 32`.
3. Configure backend environment: `APP_MODE=mock`, `VPN_PROVIDER=mock`, `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET`, `APP_ENV=development`, `ALLOWED_ORIGINS=http://127.0.0.1:3000`.
4. From `backend/`, install `requirements.lock` and run `uvicorn app.main:app --port 8000`.
5. In another terminal run `cd frontend && npm ci && BACKEND_INTERNAL_URL=http://127.0.0.1:8000 npm run dev`.

Sign in, acknowledge the mock warning, and generate a fictional profile. Use `APP_MODE=disabled` to test the unavailable state.

## Checks

```sh
cd frontend && npm ci && npm run lint && npx tsc --noEmit && npm test && npm run build
cd ../backend && pip install -r requirements.lock && ruff check app tests && pytest
```

Run browser E2E with `npm run e2e` from `frontend/`; it starts the mock backend and frontend.

## Deployment

The production deployment is in `/opt/quiet-tunnel`; existing Caddy/Nginx/Docker Compose routing is preserved. The VPS hosts the website and backend only. User VPN traffic is not routed through the VPS.

Set `APP_MODE=disabled`, configure an owner password hash and session secret, and protect `.env` (`chmod 600 .env`). Do not expose the backend port publicly. Start with `docker compose up -d --build`.

Manage the deployed project with `scripts/update.sh`, `scripts/status.sh`, `scripts/logs.sh`, and `scripts/rollback.sh`.

See [provider integration](docs/PROVIDER_INTEGRATION.md), [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [privacy](docs/PRIVACY.md), [deployment](docs/DEPLOYMENT.md), and the [WARP research](docs/RESEARCH.md).

## Privacy and limitations

The backend never receives the private key or complete profile. Users must trust the JavaScript served by the website; a public source repository alone does not prove the deployed bundle matches it. A QR code contains the private key. There is no profile database or analytics. Login and generation attempts are rate limited.

No real provider registration, client import, tunnel establishment, or end-to-end VPN traffic has been tested. Mock generation tests only the application flow.

MIT licensed. See [LICENSE](LICENSE).
