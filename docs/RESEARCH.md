# Cloudflare WARP research

Reviewed 25 November 2026 for a single-owner personal tool. The referenced repositories were examined as text source only; no third-party scripts/binaries were run. No API call was made.

## What the code shows

### Key generation

`wgcf` creates a WireGuard private key locally (or accepts a user-provided one) and derives the public key with Curve25519. See [`register.go`](https://github.com/ViRb3/wgcf/blob/master/cmd/register/register.go). `bash-warp-generator` obtains keys from the local `wg` utility before making a request. Neither source sends a private key in the registration payload: registration sends the public key.

### Registration and connection parameters

`wgcf` calls its `Register` method with the public key and a model, asks for user acceptance of Cloudflare terms, receives a device ID and bearer token, and stores device credentials locally. It later retrieves that device's config and reads interface addresses, peer public key, and endpoint. See [`cloudflare/api.go`](https://github.com/ViRb3/wgcf/blob/master/cloudflare/api.go), [`register.go`](https://github.com/ViRb3/wgcf/blob/master/cmd/register/register.go), and [`generate.go`](https://github.com/ViRb3/wgcf/blob/master/cmd/generate/generate.go).

The inspected current `wgcf` source also pins a specific Android ClientHello/TLS fingerprint and Android-like request headers to talk to the undocumented consumer endpoint. That is explicitly designed to resemble the official client. Quiet Tunnel will not reproduce that fingerprinting: it could evade provider-side client restrictions, and the requestor has instructed us not to bypass protection mechanisms. No credentials, tokens, or registration results were requested.

`bash-warp-generator` statically shows a POST to an undocumented `api.cloudflareclient.com` registration path and an authenticated PATCH to enable WARP. The observed response fields supply addresses and a peer key. This establishes that a technically plausible flow has existed; it does not confirm current compatibility, authorization, or a working tunnel.

### WireGuard config

`wgcf` writes a standard `[Interface]` / `[Peer]` profile, using the local private key, assigned address, provider peer key, endpoint, DNS, and full-tunnel routes. See [`profile.go`](https://github.com/ViRb3/wgcf/blob/master/wireguard/profile.go). This is protocol-level format knowledge; it does not show that any arbitrary or newly registered profile is accepted today.

The bash script adds AmneziaWG-specific junk packet/handshake fields and a static `I1` payload. These are not negotiated in the WireGuard registration response. The repository is not evidence that Cloudflare's current WARP endpoint supports AmneziaWG obfuscation or those constants. Quiet Tunnel will not generate such values. A conventional WireGuard profile may parse in an AmneziaWG client, but that adds no obfuscation.

## Personal-use Terms assessment

Cloudflare's official [WARP docs](https://developers.cloudflare.com/warp-client/) and [consumer setup docs](https://developers.cloudflare.com/warp-client/get-started/) direct the user to install and use Cloudflare's app. They do not document a third-party profile-registration API. A lack of public API docs is not proof the endpoint is technically absent.

The [Cloudflare Application Terms](https://www.cloudflare.com/application/terms/) dated 18 October 2024 grant a personal, revocable, non-transferable license for use on a device the user owns or controls (section 2); they say not to modify, decompile, reverse engineer, or create derivative works of the Application (section 2); reserve the ability to impose service limits or block use (section 5); and prohibit interfering with, disrupting, altering, modifying, or creating an undue burden on the Application/services (section 6). The [Website and Online Services Terms](https://www.cloudflare.com/policies/terms/) dated 1 August 2025 apply to the named public services; section 7 bars circumventing API limits and obtaining information by means not intentionally made available. The terms do not specifically name `wgcf`, a one-owner profile-export tool, or this exact consumer registration flow.

So the specific third-party one-owner integration is **not expressly permitted in the reviewed docs and not unambiguously called out as prohibited by name**. The protocol is undocumented, and current `wgcf`'s Android fingerprint matching appears intended to make a non-official client look like the official app. That crosses the requested boundary against bypassing provider restrictions. Quiet Tunnel therefore will not automate consumer registrations or impersonate the first-party client. This is a conservative product decision under ambiguous authorization, not a legal opinion or a claim of technical impossibility.

Cloudflare One managed-device registration documents apply to enrolled organizational clients and service-token workflows; they do not authorize consumer WARP profile export. This would be a different product and would still use Cloudflare's official client, not give a generic consumer WireGuard profile.

## Current provider implementation

The application now follows a provider-neutral generation architecture. The browser creates a keypair, sends only the public key, and assembles a profile locally from a typed provider response. The mock adapter exercises this entire flow with reserved test ranges. The Cloudflare adapter is a no-network template that reports unavailable. There is no profile-import editor.

`APP_MODE=mock` is for local development and E2E only. Production uses `APP_MODE=disabled`. `APP_MODE=personal` does not make Cloudflare available by itself: the selected provider's runtime response is authoritative, and this Cloudflare template stays unavailable. The architecture intentionally does not issue new Cloudflare consumer WARP registrations until an integration is both supported and permissible without imitating or bypassing first-party restrictions.

For a real standalone `.conf`, choose a provider that offers documented user-exportable WireGuard configurations or a supported API for managing a personal account. The provider must permit this use, allow the account's device/configuration limits, and provide the actual server-side peer parameters. Importing the provider's own configuration into an app is distinct from Quiet Tunnel creating a new provider registration.

## Status / limits

- Production `APP_MODE=disabled`; mock is only for local tests and is explicitly fictional. The personal Cloudflare adapter remains unavailable and performs no request.
- No real WARP registration, profile, client import, or VPN connection was tested. No real provider response/error exists to report.
- Private key generation is browser-local; generation APIs never accept a private key or config.
- Personal owner authentication protects the site and registration endpoint. It does not change Cloudflare's API permission status.

## Sources

- [wgcf](https://github.com/ViRb3/wgcf) (MIT; static review)
- [`wgcf` registration](https://github.com/ViRb3/wgcf/blob/master/cmd/register/register.go)
- [`wgcf` API](https://github.com/ViRb3/wgcf/blob/master/cloudflare/api.go)
- [`wgcf` profile formatter](https://github.com/ViRb3/wgcf/blob/master/wireguard/profile.go)
- [bash-warp-generator](https://github.com/ImMALWARE/bash-warp-generator) (MIT; static review only)
- [Cloudflare WARP docs](https://developers.cloudflare.com/warp-client/)
- [Cloudflare WARP setup](https://developers.cloudflare.com/warp-client/get-started/)
- [Cloudflare Application Terms](https://www.cloudflare.com/application/terms/)
- [Cloudflare Website and Online Services Terms](https://www.cloudflare.com/policies/terms/)
- [Cloudflare One client managed-device registration](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/deployment/mdm-deployment/)
- [WireGuard](https://www.wireguard.com/)
- [AmneziaWG documentation](https://docs.amnezia.org/ru/documentation/amnezia-wg/)
