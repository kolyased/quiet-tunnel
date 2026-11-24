import { x25519 } from "@noble/curves/ed25519.js";

const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value));

export function createKeyPair() {
  const privateKey = crypto.getRandomValues(new Uint8Array(32));
  return { privateKey, publicKey: x25519.getPublicKey(privateKey) };
}

export function buildDemoConfig(privateKey: Uint8Array, publicKey: Uint8Array, options: { name: string; format: string; platform: string; mtu: number }) {
  return `# DEMO ONLY — NOT A WORKING VPN PROFILE\n# Quiet Tunnel / ${options.name.replace(/[\r\n]/g, " ")}\n# Format: ${options.format}; client: ${options.platform}\n# Client public key (local): ${encode(publicKey)}\n# Private key was generated locally. Server parameters below are fictional.\n\n[Interface]\nPrivateKey = ${encode(privateKey)}\nAddress = 172.16.0.2/32\nDNS = 1.1.1.1\nMTU = ${options.mtu}\n\n[Peer]\nPublicKey = ${encode(new Uint8Array(32).fill(7))}\nAllowedIPs = 0.0.0.0/0, ::/0\nEndpoint = demo.invalid:51820\nPersistentKeepalive = 25\n`;
}
