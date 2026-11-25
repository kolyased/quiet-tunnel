# Provider integration guide

This document describes how to add a supported provider without changing the frontend, owner authentication, public generation endpoints, or deployment topology. Do not implement undocumented or prohibited registration flows, impersonate first-party clients, bypass rate limits/CAPTCHA, or proxy VPN traffic through the Quiet Tunnel VPS.

## Architecture

`VPNProvider` (`backend/app/providers/base.py`) is the adapter boundary. `factory.py` selects an adapter from server configuration. `services/generator.py` performs common availability/format checks, invokes registration, validates the returned model, and constructs the API response. FastAPI enforces owner authorization, input validation, rate/concurrency limits and timeout. Browser code creates keys and builds the final profile.

Current adapters:

- `MockVPNProvider`: deterministic test-only connection parameters with reserved documentation IPs. Never usable for real connectivity.
- `CloudflareWarpProvider`: experimental consumer registration adapter. It makes no request unless `WARP_EXPERIMENTAL_ENABLED=true`; the flag defaults to false. The endpoint is undocumented and permission for third-party automation is unconfirmed. Do not enable it in production until Cloudflare provides written authorization or documents this exact API use.
- `disabled`: factory returns no provider and the API refuses generation.

## Provider contract

```python
class VPNProvider(ABC):
    async def availability(self) -> ProviderAvailability: ...
    async def register(self, request: RegistrationRequest) -> ConnectionParameters: ...
```

`RegistrationRequest` contains:

```json
{
  "public_key": "base64-encoded X25519 public key",
  "format": "wireguard",
  "platform": "android"
}
```

Input is strict (`extra=forbid`). There is no private-key or full-profile field. Formats are `wireguard` or `amneziawg`; platforms are `windows`, `macos`, `android`, `ios`, `linux`.

Return `ConnectionParameters`, validated before exposure:

```json
{
  "ipv4_address": "10.0.0.2/32",
  "ipv6_address": "2001:db8::2/128",
  "server_public_key": "base64-encoded key",
  "endpoint": "vpn.example.invalid",
  "port": 51820,
  "dns": ["1.1.1.1"],
  "mtu": 1280,
  "allowed_ips": ["0.0.0.0/0", "::/0"],
  "persistent_keepalive": 25,
  "additional_parameters": {}
}
```

Use actual provider-assigned values only. `additional_parameters` is for documented, non-secret client interface values; never use it to invent server-side features or include credentials/tokens. The browser applies these parameters and the local private key to a standard WireGuard format. Provider adapters must not assemble a `.conf`.

`ProviderAvailability` communicates `available`, `provider`, human-readable `reason`, supported `formats`, and `real_provider`. Only advertise AmneziaWG if the actual peer/server supports the required obfuscation settings. A client accepting a standard WireGuard profile does not make it obfuscated AmneziaWG.

## Configuration

Settings live in `backend/app/core/config.py` and are supplied through environment variables:

- `APP_MODE=mock|personal|disabled`; controls allowed application workflow.
- `VPN_PROVIDER=mock|cloudflare`; selects the adapter when a provider mode is active.
- `WARP_EXPERIMENTAL_ENABLED=false`; separate kill switch for the unsupported Cloudflare consumer API adapter. Keep false in local and production configurations unless the provider permission check is resolved.
- `PROVIDER_TIMEOUT_SECONDS`, `MAX_CONCURRENT_REGISTRATIONS`.
- `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`.
- `ALLOWED_ORIGINS` and owner auth settings `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET`.

Use `.env.example` for safe examples. Secrets belong only in the private runtime environment; never commit them. `personal` is not a promise that a real provider exists: the provider's actual availability is authoritative. In production, keep `APP_MODE=disabled` and the experimental flag false until support and permission are established.

## Errors and validation

Raise typed exceptions from `backend/app/core/exceptions.py`:

- `ProviderUnavailable`: provider disabled, unsupported, or temporarily unavailable.
- `ProviderTimeout`: provider operation exceeded its own timeout.
- `InvalidProviderResponse`: malformed or incomplete provider response.
- `UnsupportedFormat`: format not supported by the actual provider.
- `ProviderError`: safe general provider failure.

Do not put response bodies, access tokens, account identifiers, keys, or request headers in exception text or logs. The API returns standardized public errors and uses 503 for unavailable provider, 504 for timeouts, 502 for invalid provider responses, and 422 for invalid/unsupported requests. HTTPX clients must validate TLS, use explicit timeouts, and call only a provider-approved fixed host. Do not accept a user-supplied API URL.

## Add a provider

1. Review the provider's current official API documentation, terms, client compatibility, and any registration limits. Record evidence and unresolved authorization in `docs/RESEARCH.md`.
2. Add `backend/app/providers/<provider>.py`, subclass `VPNProvider`, and return only typed `ProviderAvailability` and `ConnectionParameters`.
3. Read endpoint/credentials from validated settings in `core/config.py`; never accept them from the browser. Do not make network calls from module constructors.
4. Add the provider to `factory.py` as a configuration choice. Keep existing API and browser code provider-agnostic.
5. Add backend unit tests for availability, one successful registration using a mocked transport, malformed response, timeout, provider error, and proof that the outbound payload contains only the public key. Mock tests must not be represented as real provider integration.
6. Run backend lint/tests, frontend lint/type/unit/build and the full E2E suite. Only use a real provider account for an explicitly permitted, low-volume integration test.
7. Verify that no secret, private key, bearer token, full profile, or provider response is logged or committed. Keep production disabled until code, provider terms, and operational readiness have been reviewed.

To exercise the current mock adapter locally, configure `APP_MODE=mock`, `VPN_PROVIDER=mock` and owner auth environment values, then run FastAPI and Next.js. The mock flow tests UI/API/data handling only; its endpoint is reserved and cannot establish a tunnel.

## Integration test expectations

Unit/integration tests should use a deterministic fake transport and assert adapter behavior without creating external accounts. Keep real-provider checks separate and manually initiated. Never run bulk registration, automatic retries after uncertain registration outcomes, or tests against real endpoints in CI. If real profile import and tunnel establishment are not tested, say so explicitly.

## Security requirements

- Browser uses CSPRNG and a vetted X25519 implementation; never `Math.random`.
- The private key is not part of request schemas or network payloads; do not store it in local/session storage, IndexedDB, cookies, URLs, logs, or analytics.
- Avoid retrying non-idempotent registration without provider guarantees.
- Bound request size, timeout and concurrency; keep TLS verification enabled.
- Do not trust arbitrary forwarded IP headers or accept dynamic destinations (SSRF).
- Keep owner auth, CSRF Origin checks, cookie protections and private API network unchanged.
- Provider credentials, device tokens, and registration identifiers must not enter API response, logs, tests, screenshots, or public repository.
- Never route user VPN packets through this VPS.
