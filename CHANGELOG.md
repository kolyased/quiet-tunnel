# Changelog

## 0.3.0 — 2026-11-25

- Added a disabled-by-default experimental Cloudflare consumer registration adapter with strict response validation and sanitized failures.
- Kept provider egress isolated to the backend and preserved the internal-only application network; no VPN traffic is routed through the VPS.
- Documented that Cloudflare has not confirmed permission for this undocumented registration flow; production enablement remains off.
- Isolated Playwright E2E ports from existing local services and fixed test-runner discovery of generated reports.
- Updated provider research, environment examples, and release documentation.
- Follow-up: include `frontend/public` in standalone containers and local production start so the noindex `robots.txt` is served.

## 0.2.0 — 2026-11-25

- Added a provider-neutral contract, runtime factory, typed connection parameters, generator service, no-network Cloudflare template and non-connectable mock adapter.
- Added browser-local X25519 generation and WireGuard profile/QR/file creation; backend receives only the public key.
- Added closed owner login, expiring HttpOnly sessions, login limiting and authenticated generation endpoints.
- Added runtime capability reporting, mock/disabled/personal modes, E2E coverage, and provider implementation documentation.
- Kept real Cloudflare registration unavailable and production generation disabled.

## 0.1.0 — 2026-11-25

- Initial Russian/English UI, browser-local demo configuration, FastAPI fail-closed API, deployment skeleton, and research/security docs.
- Real Cloudflare WARP registration disabled.
