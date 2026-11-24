# WARP research (25 November 2026)

## Findings

Cloudflare's official WARP docs describe the consumer client and its supported OSes/modes, not a public endpoint for registering arbitrary third-party WireGuard profiles. The official quick-start flow directs users to install and activate Cloudflare's own client. The reviewed official docs do not establish permission for an unaffiliated public service to automate consumer account registrations. This project therefore does not implement or enable real registrations. The UI and API stay in an explicit demo mode.

The reference `bash-warp-generator` is not executed or copied. No legacy local Python generator was present in this workspace. There is no claim that demo endpoint/key parameters connect to Cloudflare.

WireGuard uses X25519 public/private key pairs and its documented configuration format. The client currently uses `@noble/curves` X25519 and Web Crypto's CSPRNG. AmneziaWG is WireGuard-compatible at the configuration level, but obfuscation requires server-side support and parameters. The demo contains no obfuscation parameters and is not a functional AWG profile.

## API, terms, constraints

- Official WARP client docs describe client installation and usage, not a supported public registration API for this use case.
- Since API authorization and Cloudflare terms for automated public registrations could not be established, real integration is disabled by default and the API deliberately rejects registration.
- No CAPTCHA, quota, or provider restriction is bypassed. No bulk registration logic exists.
- A local demonstration config is marked non-functional and uses `demo.invalid`.

## Sources

- [Cloudflare WARP client](https://developers.cloudflare.com/warp-client/)
- [Cloudflare Get started](https://developers.cloudflare.com/warp-client/get-started/)
- [AmneziaWG documentation](https://docs.amnezia.org/ru/documentation/amnezia-wg/)
- [WireGuard](https://www.wireguard.com/)
- [Reference generator (inspection only)](https://github.com/ImMALWARE/bash-warp-generator)

This is an evidence boundary, not a legal conclusion. Revisit official docs and terms before enabling any real integration.
