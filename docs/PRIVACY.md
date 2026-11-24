# Privacy

Quiet Tunnel is a single-owner tool with no public registration, analytics, tracking, advertising, profile database, or browser-storage persistence for private keys/configurations. The backend stores only environment-provided password hash and cookie signing secret. It does not log request bodies.

The browser creates the X25519 private key and sends only the public key to the backend. The provider response contains connection parameters; the full profile and QR are formed locally. The private key buffer is overwritten after config generation, but JavaScript/browser runtimes do not promise physical memory erasure. The profile stays in component memory until cleared or the page is closed. A QR contains the full profile including the private key.

The mock adapter is for local development/testing only. Production is configured with generation disabled; no real provider is active. If a real provider is integrated later, its API will receive the public key and registration metadata, and its own privacy terms will apply. The user's VPN traffic goes from their device to the provider endpoint directly, never through the Quiet Tunnel VPS.

Users must trust the JavaScript served by the website. A public repository alone cannot establish that the deployed bundle matches the reviewed source. Normal hosting, network, browser, and reverse-proxy operators may process connection metadata. The site is protected by owner login and does not claim absolute anonymity.
