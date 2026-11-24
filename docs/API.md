# API v1

- `GET /api/v1/health`: process health only.
- `GET /api/v1/capabilities`: states demo mode and disabled real registration.
- `POST /api/v1/warp/register`: strictly validates a public key, format, and consent, then fail-closes with `501 GENERATION_DISABLED`. No provider request is made and no private key is accepted.

Responses are `no-store`; requests are limited in memory per observed client address. The rate limit is process-local and resets on restart. The production service does not claim distributed abuse protection.
