# Security notes

Private keys and demo configuration are held only in browser component state; they are never sent to the API or persisted to browser storage. JavaScript cannot guarantee physical zeroization of memory. QR generation is local. Do not use this demo to connect to a server. The published site's JavaScript remains a trust dependency; inspect/rebuild from source if this matters to you.

The backend rejects extra fields and is configured fail-closed. Do not enable real provider registration without a documented supported API, terms review, security review, and integration tests. Report vulnerabilities privately to the repository owner; do not include keys or credentials in public issues.
