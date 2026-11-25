# Architecture

The Next.js site uses a server-side proxy to validate the owner session before rendering application pages. FastAPI issues an expiring signed HttpOnly cookie after checking the configured scrypt password hash. Generation endpoints independently require the same session. Capabilities are queried from the configured provider at runtime.

Generation flow:

1. Browser creates an X25519 key pair with a cryptographically secure random source.
2. Browser sends only the public key, format, and platform to `POST /api/v1/generate`.
3. Provider adapter returns validated connection parameters using the shared Pydantic model.
4. Browser combines those parameters with its local private key to assemble a standard WireGuard profile, QR code, and downloaded file.
5. Browser clears its private-key byte array after assembly and keeps the resulting profile only in component memory until user clears or leaves the page.

Provider-specific registration stays under `backend/app/providers/`. The generator service, API contract, authentication, and UI depend only on the `VPNProvider` interface and typed models. See [PROVIDER_INTEGRATION.md](PROVIDER_INTEGRATION.md).

The mock provider enables end-to-end testing using reserved documentation addresses; it is intentionally nonfunctional as a VPN. The Cloudflare adapter contains an experimental consumer registration flow guarded by `WARP_EXPERIMENTAL_ENABLED=false` by default. It is technically reported to work, but the consumer API is undocumented and permission for independent registration automation is unconfirmed. Production remains `APP_MODE=disabled`; do not turn the flag on without written provider approval. The VPS hosts only site/API; user VPN packets go directly from the device to Cloudflare.

In Docker Compose, frontend and Nginx use the `quiet` internal network. Backend is attached to `quiet` for application requests and `warp_egress` for the provider HTTPS API. Backend port 8000 has no host port mapping. The dedicated egress network is not shared with the frontend or Nginx.
