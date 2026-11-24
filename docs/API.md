# API v1

Generation requires the owner session cookie. The browser sends its public key only; private keys and completed configuration files are rejected as extra fields.

- `GET /api/v1/health`: process liveness check.
- `GET /api/v1/capabilities`: configured app mode and the selected provider's runtime availability and supported formats. It does not register a device.
- `POST /api/v1/auth/login`: validates the password against `AUTH_PASSWORD_HASH` and issues a time-limited signed HttpOnly cookie. Failed attempts are rate-limited.
- `GET /api/v1/auth/session`: returns an authentication boolean only.
- `POST /api/v1/auth/logout`: clears the session cookie.
- `POST /api/v1/generate`: authenticated provider registration; currently available only with local `mock` configuration, returning reserved test parameters.
- `POST /api/v1/warp/register`: compatibility alias for `/generate`; same authentication and schema.

Example request:

```json
{"public_key":"base64-X25519-public-key","format":"wireguard","platform":"android"}
```

The response contains validated provider parameters only. The browser adds its local private key and creates the `.conf`. `APP_MODE=disabled` returns no provider and generation fails closed. State-changing requests require an allowed Origin. API responses are marked `no-store`; login/generation limits are in-memory and reset when the process restarts. See [provider integration](PROVIDER_INTEGRATION.md) for the typed response schema and error mapping.
