# Security

- The deployed UI is single-owner and fails closed if its backend auth check is unavailable. Set `AUTH_PASSWORD_HASH` and a random 32-byte-plus `AUTH_SESSION_SECRET`; without both login cannot issue a session.
- Password verification uses scrypt. Sessions are signed, time-limited HttpOnly cookies; production also sets Secure and SameSite=Strict. There is no user database or public signup.
- Login failures and generation requests are rate-limited in process memory. Limits reset on process restart; put the site behind the existing trusted reverse proxy.
- Generation API endpoints require an authenticated cookie, allowed Origin, strict request schema, bounded body, provider timeout and concurrency limit. API validation errors do not echo rejected input.
- Browser-generated private keys are not in API schemas. Provider adapters receive only the public key; the browser forms the final config and QR in memory. Runtime memory is not guaranteed to be physically zeroized.
- Provider adapters must use TLS verification, fixed provider destinations and bounded timeouts. Never log response bodies, provider credentials, tokens, public/private keys, or completed profiles. No provider secrets are currently configured.
- Mock output uses reserved test endpoints and cannot establish a VPN. Cloudflare adapter performs no network requests. Production generation is disabled.
- Nginx/Caddy security headers, `robots.txt`, and noindex metadata reduce exposure; authentication remains the access control. Public source alone does not prove the deployed JavaScript corresponds to reviewed code.

Create a password hash with `python3 scripts/hash_password.py`; store it and the session secret only in the private environment file. Rotate the hash to change the password; rotate the session secret to revoke sessions. Report vulnerabilities privately to the repository owner. Do not include passwords, keys, provider responses, or `.conf` files in issues.
