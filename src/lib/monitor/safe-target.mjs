/**
 * SSRF / unsafe-target guards (shared ESM for tests + TS re-export).
 */
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export class UnsafeTargetError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnsafeTargetError";
  }
}

export function privateTargetsAllowed() {
  return process.env.PULSEWATCH_ALLOW_PRIVATE_TARGETS?.trim() === "1";
}

export function isDangerousHostnameArg(host) {
  return /^\s*-/.test(host);
}

function stripIpv6Brackets(host) {
  if (host.startsWith("[") && host.endsWith("]")) return host.slice(1, -1);
  return host;
}

function normalizeIp(ip) {
  const v = stripIpv6Brackets(ip.trim()).toLowerCase();
  if (v.startsWith("::ffff:")) {
    const mapped = v.slice("::ffff:".length);
    if (isIP(mapped) === 4) return mapped;
  }
  return v;
}

export function isPrivateOrReservedIp(ip) {
  const addr = normalizeIp(ip);
  const ver = isIP(addr);
  if (ver === 4) {
    const parts = addr.split(".").map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return true;
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (ver === 6) {
    if (addr === "::" || addr === "::1") return true;
    if (addr.startsWith("fc") || addr.startsWith("fd")) return true;
    if (
      addr.startsWith("fe8") ||
      addr.startsWith("fe9") ||
      addr.startsWith("fea") ||
      addr.startsWith("feb")
    ) {
      return true;
    }
    return false;
  }
  return true;
}

export function assertSafeHostnameSyntax(host) {
  const h = stripIpv6Brackets(host.trim());
  if (!h) throw new UnsafeTargetError("Hostname is required");
  if (isDangerousHostnameArg(h)) {
    throw new UnsafeTargetError("Hostname must not look like a CLI flag");
  }
  if (/[\s\\]/.test(h) || h.includes("\0")) {
    throw new UnsafeTargetError("Hostname contains invalid characters");
  }
}

export async function assertSafeHostname(host) {
  assertSafeHostnameSyntax(host);
  if (privateTargetsAllowed()) return;

  const h = stripIpv6Brackets(host.trim());
  if (isIP(h)) {
    if (isPrivateOrReservedIp(h)) {
      throw new UnsafeTargetError("Private or reserved IP targets are blocked");
    }
    return;
  }

  let records;
  try {
    records = await lookup(h, { all: true });
  } catch {
    throw new UnsafeTargetError("Hostname could not be resolved");
  }
  if (!records.length) throw new UnsafeTargetError("Hostname could not be resolved");
  for (const rec of records) {
    if (isPrivateOrReservedIp(rec.address)) {
      throw new UnsafeTargetError("Hostname resolves to a private or reserved address");
    }
  }
}

export async function assertSafeHttpUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeTargetError("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsafeTargetError("Only http and https URLs are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeTargetError("URLs with embedded credentials are not allowed");
  }
  await assertSafeHostname(parsed.hostname);
  return parsed;
}

export function assertSafeTargetInput(input) {
  const type = input.type;
  if (type === "http" || type === "keyword") {
    const url = input.url?.trim();
    if (!url) throw new UnsafeTargetError("URL is required");
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new UnsafeTargetError("Invalid URL");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new UnsafeTargetError("Only http and https URLs are allowed");
    }
    if (parsed.username || parsed.password) {
      throw new UnsafeTargetError("URLs with embedded credentials are not allowed");
    }
    assertSafeHostnameSyntax(parsed.hostname);
    if (
      !privateTargetsAllowed() &&
      isIP(stripIpv6Brackets(parsed.hostname)) &&
      isPrivateOrReservedIp(parsed.hostname)
    ) {
      throw new UnsafeTargetError("Private or reserved IP targets are blocked");
    }
    return;
  }

  const host = (input.hostname?.trim() || (input.url ? tryHost(input.url) : null)) ?? "";
  if (!host) throw new UnsafeTargetError("Hostname is required");
  assertSafeHostnameSyntax(host);
  if (!privateTargetsAllowed() && isIP(stripIpv6Brackets(host)) && isPrivateOrReservedIp(host)) {
    throw new UnsafeTargetError("Private or reserved IP targets are blocked");
  }
}

function tryHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    const bare = url.replace(/^https?:\/\//, "").split("/")[0];
    return bare || null;
  }
}
