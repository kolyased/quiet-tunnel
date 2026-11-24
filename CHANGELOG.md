# Changelog

## 0.2.0 — 2026-11-25

- Added a provider-neutral contract, runtime factory, typed connection parameters, generator service, no-network Cloudflare template and non-connectable mock adapter.
- Added browser-local X25519 generation and WireGuard profile/QR/file creation; backend receives only the public key.
- Added closed owner login, expiring HttpOnly sessions, login limiting and authenticated generation endpoints.
- Added runtime capability reporting, mock/disabled/personal modes, E2E coverage, and provider implementation documentation.
- Kept real Cloudflare registration unavailable and production generation disabled.

## 0.1.0 — 2026-11-25

- Initial Russian/English UI, browser-local demo configuration, FastAPI fail-closed API, deployment skeleton, and research/security docs.
- Real Cloudflare WARP registration disabled.
