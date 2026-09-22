import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  assertSafeHostnameSyntax,
  assertSafeTargetInput,
  isDangerousHostnameArg,
  isPrivateOrReservedIp,
  privateTargetsAllowed,
} from "../src/lib/monitor/safe-target.mjs";

describe("isPrivateOrReservedIp", () => {
  it("blocks loopback and RFC1918", () => {
    assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("10.1.2.3"), true);
    assert.equal(isPrivateOrReservedIp("172.16.0.1"), true);
    assert.equal(isPrivateOrReservedIp("192.168.1.1"), true);
  });

  it("blocks link-local and metadata", () => {
    assert.equal(isPrivateOrReservedIp("169.254.169.254"), true);
  });

  it("allows public v4", () => {
    assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
  });

  it("blocks IPv6 loopback and ULA/link-local", () => {
    assert.equal(isPrivateOrReservedIp("::1"), true);
    assert.equal(isPrivateOrReservedIp("fc00::1"), true);
    assert.equal(isPrivateOrReservedIp("fe80::1"), true);
  });
});

describe("hostname argv safety", () => {
  it("rejects flag-like hostnames", () => {
    assert.equal(isDangerousHostnameArg("-c"), true);
    assert.equal(isDangerousHostnameArg("example.com"), false);
    assert.throws(() => assertSafeHostnameSyntax("-W"), /CLI flag/);
  });
});

describe("assertSafeTargetInput", () => {
  const prev = process.env.PULSEWATCH_ALLOW_PRIVATE_TARGETS;
  afterEach(() => {
    if (prev === undefined) delete process.env.PULSEWATCH_ALLOW_PRIVATE_TARGETS;
    else process.env.PULSEWATCH_ALLOW_PRIVATE_TARGETS = prev;
  });

  it("requires http(s) and blocks private literals", () => {
    assert.throws(
      () => assertSafeTargetInput({ type: "http", url: "file:///etc/passwd" }),
      /http and https/,
    );
    assert.throws(
      () => assertSafeTargetInput({ type: "http", url: "http://127.0.0.1/" }),
      /Private or reserved/,
    );
    assert.doesNotThrow(() =>
      assertSafeTargetInput({ type: "http", url: "https://example.com/status" }),
    );
  });

  it("allows private targets when opted in", () => {
    process.env.PULSEWATCH_ALLOW_PRIVATE_TARGETS = "1";
    assert.equal(privateTargetsAllowed(), true);
    assert.doesNotThrow(() =>
      assertSafeTargetInput({ type: "http", url: "http://192.168.1.10/health" }),
    );
  });

  it("rejects ping hosts that look like flags", () => {
    assert.throws(() => assertSafeTargetInput({ type: "ping", hostname: "-c" }), /CLI flag/);
  });
});
