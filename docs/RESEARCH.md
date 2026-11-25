# Cloudflare WARP research

Reviewed 25 November 2026 for a single-owner personal tool. The referenced repositories were examined as text source only; no third-party scripts/binaries were run and no registration request was made during this review.

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

So the specific third-party one-owner integration is **not expressly permitted in the reviewed docs and not unambiguously called out as prohibited by name**. The protocol is undocumented, and current `wgcf`'s Android fingerprint matching appears intended to make a non-official client look like the official app. Quiet Tunnel does not reproduce that fingerprint. The branch's plain HTTP client is technically simpler, but public documentation does not establish that Cloudflare intentionally makes this registration API available to third-party clients. This is a conservative product decision under ambiguous authorization, not a legal opinion or a claim of technical impossibility.

Cloudflare One managed-device registration documents apply to enrolled organizational clients and service-token workflows; they do not authorize consumer WARP profile export. This would be a different product and would still use Cloudflare's official client, not give a generic consumer WireGuard profile.

## Current provider implementation and permission assessment

The experiment adds an adapter for Cloudflare's undocumented consumer registration flow: it POSTs a public key to `api.cloudflareclient.com`, receives registration credentials, PATCHes the registration to enable WARP, and maps returned peer parameters into a WireGuard profile. It does not send the private key, imitate a Cloudflare client fingerprint, disable TLS checks, follow redirects, retry registration, or log response bodies/tokens. The owner reports that this flow produced a configuration and a working tunnel; this repository audit did not repeat that real registration or tunnel test.

The adapter is an unsupported consumer flow, not the documented Cloudflare API. The official Cloudflare API docs currently document Zero Trust registration management operations such as list/get/delete, and describe WARP registrations as account/device records; they do not document this consumer POST/PATCH creation flow. This is a distinction between a technically functional endpoint and a provider-supported API.

The current [Application Terms](https://www.cloudflare.com/application/terms/) (last updated 18 October 2024) license the Application for personal use on a device the user owns/controls (§2), prohibit modifying, decompiling, reverse engineering, or making derivative works of the Application (§2), and prohibit disrupting/altering the Application or creating an undue burden (§6). The current [Website and Online Services Terms](https://www.cloudflare.com/policies/terms/) prohibit exceeding/circumventing API limitations and obtaining information by means not intentionally made available (§7). The adapter does not patch or impersonate the official application, but Cloudflare's public docs do not say the consumer registration endpoint is intended for independent clients or third-party registration automation. The official docs therefore do not establish permission for this exact operation. Personal single-owner use is not expressly named as prohibited in those documents either.

**Conclusion:** technical feasibility is demonstrated by the owner's reported successful tunnel, but permission for this undocumented consumer API is **unconfirmed**. We must not enable it in production on the evidence currently available. A user checkbox accepting the Application Terms does not grant permission to automate an undocumented API. Enablement requires written confirmation from Cloudflare, or a documented supported API that covers this exact use. This is a conservative deployment decision, not a legal opinion or a claim of technical impossibility.

The supported Cloudflare alternative is to use the official client and documented enrollment/MDM workflows for Cloudflare One. The official registration-management API is account scoped; it does not, in the reviewed docs, offer consumer WARP profile creation and export.

`APP_MODE=mock` is for local development and E2E only. Production uses `APP_MODE=disabled` and `WARP_EXPERIMENTAL_ENABLED=false`. `APP_MODE=personal` alone does not activate the adapter. The Cloudflare code remains explicitly experimental and the runtime flag defaults off.

For a supported standalone `.conf`, use a provider that offers documented user-exportable WireGuard configurations or a supported API for managing a personal account. The provider must permit this use, allow the account's device/configuration limits, and provide the actual server-side peer parameters.

## Status / limits

- Production `APP_MODE=disabled`; `WARP_EXPERIMENTAL_ENABLED=false`. Mock is only for local tests and is explicitly fictional.
- The owner reports a successful real registration/config/tunnel test on the experimental branch. This audit made no Cloudflare API request and did not independently verify that result.
- Production activation is blocked until provider permission is confirmed. No new provider response/error was obtained during this review.
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
- [Cloudflare API: WARP device registrations](https://developers.cloudflare.com/api/resources/zero_trust/subresources/devices/subresources/registrations/)
- [WireGuard](https://www.wireguard.com/)
- [AmneziaWG documentation](https://docs.amnezia.org/ru/documentation/amnezia-wg/)
