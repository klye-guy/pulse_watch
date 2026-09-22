import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyTrustedClientIpHeader,
  defaultTrustedProxies,
  isTrustedProxyPeer,
  resolveClientIpForBetterAuth,
  trustedProxiesFromEnv,
} from "./client-ip.server.ts";

describe("trustedProxiesFromEnv", () => {
  it("always includes loopback", () => {
    const list = trustedProxiesFromEnv("");
    assert.deepEqual(list, defaultTrustedProxies());
  });

  it("merges extra proxies from env", () => {
    const list = trustedProxiesFromEnv("10.0.0.2, 192.0.2.10");
    assert.ok(list.includes("10.0.0.2"));
    assert.ok(list.includes("192.0.2.10"));
    assert.ok(list.includes("127.0.0.1"));
  });
});

describe("isTrustedProxyPeer", () => {
  const trusted = defaultTrustedProxies();

  it("trusts loopback forms", () => {
    assert.equal(isTrustedProxyPeer("127.0.0.1", trusted), true);
    assert.equal(isTrustedProxyPeer("::1", trusted), true);
    assert.equal(isTrustedProxyPeer("::ffff:127.0.0.1", trusted), true);
  });

  it("rejects arbitrary clients", () => {
    assert.equal(isTrustedProxyPeer("203.0.113.9", trusted), false);
  });
});

describe("resolveClientIpForBetterAuth", () => {
  const trusted = defaultTrustedProxies();

  it("uses peer when the client hits the origin directly", () => {
    assert.equal(
      resolveClientIpForBetterAuth({
        peerAddress: "203.0.113.9",
        xRealIp: "198.51.100.1",
        xForwardedFor: "198.51.100.1",
        trustedProxies: trusted,
      }),
      "203.0.113.9",
    );
  });

  it("honors X-Real-IP when peer is the package reverse proxy", () => {
    assert.equal(
      resolveClientIpForBetterAuth({
        peerAddress: "127.0.0.1",
        xRealIp: "203.0.113.9",
        xForwardedFor: "198.51.100.1, 203.0.113.9",
        trustedProxies: trusted,
      }),
      "203.0.113.9",
    );
  });

  it("falls back to X-Forwarded-For first hop when X-Real-IP is missing", () => {
    assert.equal(
      resolveClientIpForBetterAuth({
        peerAddress: "::1",
        xRealIp: null,
        xForwardedFor: "203.0.113.9, 127.0.0.1",
        trustedProxies: trusted,
      }),
      "203.0.113.9",
    );
  });

  it("does not trust forwarded headers without a peer", () => {
    assert.equal(
      resolveClientIpForBetterAuth({
        peerAddress: null,
        xRealIp: "203.0.113.9",
        xForwardedFor: "203.0.113.9",
        trustedProxies: trusted,
      }),
      null,
    );
  });
});

describe("applyTrustedClientIpHeader", () => {
  it("overwrites spoofed X-Real-IP on direct connections", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.1",
      "x-forwarded-for": "198.51.100.1",
    });
    const req = {
      ip: "203.0.113.9",
      headers,
      runtime: { node: { req: { socket: { remoteAddress: "203.0.113.9" } } } },
    };
    assert.equal(applyTrustedClientIpHeader(req, defaultTrustedProxies()), "203.0.113.9");
    assert.equal(headers.get("x-real-ip"), "203.0.113.9");
  });
});
