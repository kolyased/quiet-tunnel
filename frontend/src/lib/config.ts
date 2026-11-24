import { x25519 } from "@noble/curves/ed25519.js";

export type ConnectionParameters = {
  ipv4_address: string;
  ipv6_address: string | null;
  server_public_key: string;
  endpoint: string;
  port: number;
  dns: string[];
  mtu: number;
  allowed_ips: string[];
  persistent_keepalive: number | null;
  additional_parameters: Record<string, string | number | boolean>;
};

export type AppMode = "mock" | "personal" | "disabled";

const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value));

export function createKeyPair() {
  const privateKey = crypto.getRandomValues(new Uint8Array(32));
  return { privateKey, publicKey: x25519.getPublicKey(privateKey) };
}

export function encodePublicKey(value: Uint8Array): string {
  return encode(value);
}

function endpointHost(host: string): string {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

export function buildConfig(
  privateKey: Uint8Array,
  parameters: ConnectionParameters,
  options: { name: string; platform: string; mtu?: number; mode: AppMode },
): string {
  const name = options.name.replace(/[\r\n]/g, " ").slice(0, 48);
  const addresses = [parameters.ipv4_address, parameters.ipv6_address].filter(Boolean).join(", ");
  const iface = [
    "[Interface]",
    `# Quiet Tunnel / ${name}`,
    `# Client: ${options.platform}`,
    `PrivateKey = ${encode(privateKey)}`,
    `Address = ${addresses}`,
    `DNS = ${parameters.dns.join(", ")}`,
    `MTU = ${options.mtu ?? parameters.mtu}`,
  ];
  for (const [key, value] of Object.entries(parameters.additional_parameters)) {
    if (/^[A-Za-z][A-Za-z0-9]*$/.test(key) && !/[\r\n]/.test(String(value))) iface.push(`${key} = ${value}`);
  }
  const peer = [
    "[Peer]",
    `PublicKey = ${parameters.server_public_key}`,
    `AllowedIPs = ${parameters.allowed_ips.join(", ")}`,
    `Endpoint = ${endpointHost(parameters.endpoint)}:${parameters.port}`,
  ];
  if (parameters.persistent_keepalive !== null) peer.push(`PersistentKeepalive = ${parameters.persistent_keepalive}`);
  const notice = options.mode === "mock"
    ? "# MOCK ONLY — RESERVED TEST-NET PARAMETERS; THIS PROFILE CANNOT CONNECT.\n"
    : "";
  return `${notice}${iface.join("\n")}\n\n${peer.join("\n")}\n`;
}
