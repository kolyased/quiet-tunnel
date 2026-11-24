# Architecture

Next.js renders the site. Browser code uses Web Crypto randomness plus audited `@noble/curves` X25519 to create a demonstration keypair, formats a local .conf, and creates QR data locally. No generated configuration is sent to the backend. The API exposes health/capabilities and a fail-closed registration endpoint, with an in-memory per-client rate limit. Production reverse proxy terminates TLS and keeps the API's host-published port on loopback.

Real WARP provider registration is intentionally not implemented until an official supported API and permission for this use case can be established. The demo profile uses `.invalid` and must not be represented as a VPN connection.
