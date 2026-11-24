import { describe, expect, it } from "vitest";
import { buildConfig, createKeyPair, encodePublicKey, type ConnectionParameters } from "./config";

const parameters: ConnectionParameters = {
  ipv4_address: "172.16.0.2/32",
  ipv6_address: "2606:4700:110:8f7a::2/128",
  server_public_key: "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=",
  endpoint: "198.51.100.1",
  port: 51820,
  dns: ["1.1.1.1", "2606:4700:4700::1111"],
  mtu: 1280,
  allowed_ips: ["0.0.0.0/0", "::/0"],
  persistent_keepalive: 25,
  additional_parameters: {},
};

describe("WireGuard configuration builder", () => {
  it("derives an X25519 public key locally", () => {
    const pair = createKeyPair();
    expect(pair.privateKey).toHaveLength(32);
    expect(pair.publicKey).toHaveLength(32);
    expect(encodePublicKey(pair.publicKey)).toMatch(/^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/);
  });

  it("assembles the profile from provider parameters and a local private key", () => {
    const pair = createKeyPair();
    const config = buildConfig(pair.privateKey, parameters, { name: "Test", platform: "Linux", mode: "mock" });
    expect(config).toContain("MOCK ONLY");
    expect(config).toContain("Endpoint = 198.51.100.1:51820");
    expect(config).toContain("Address = 172.16.0.2/32, 2606:4700:110:8f7a::2/128");
    expect(config).toContain(`PrivateKey = ${btoa(String.fromCharCode(...pair.privateKey))}`);
    expect(config).not.toContain("demo.invalid");
    pair.privateKey.fill(0);
  });
});
