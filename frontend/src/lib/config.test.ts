import { describe, expect, it } from "vitest";
import { buildDemoConfig, createKeyPair } from "./config";

describe("local configuration", () => {
  it("derives the WireGuard public key from a random private key", () => {
    const pair = createKeyPair();
    expect(pair.privateKey).toHaveLength(32);
    expect(pair.publicKey).toHaveLength(32);
    expect(Array.from(pair.privateKey)).not.toEqual(Array.from(pair.publicKey));
  });
  it("marks generated sample as non-functional", () => {
    const pair = createKeyPair();
    const config = buildDemoConfig(pair.privateKey, pair.publicKey, { name: "Test", format: "wireguard", platform: "Linux", mtu: 1280 });
    expect(config).toContain("DEMO ONLY — NOT A WORKING VPN PROFILE");
    expect(config).toContain("Endpoint = demo.invalid:51820");
    expect(config).toContain("PrivateKey = ");
  });
});
