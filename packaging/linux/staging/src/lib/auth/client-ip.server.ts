/**
 * Self-host client IP for Better Auth rate limits.
 *
 * Better Auth only reads IP from headers (`advanced.ipAddress`). Nitro/node
 * knows the TCP peer, but that never reaches Better Auth unless we bridge it.
 *
 * Rules (same idea as srvx `trustProxy: "loopback"`):
 * - Peer is a trusted reverse proxy (loopback by default, plus
 *   `PULSEWATCH_TRUSTED_PROXIES`) → honor nginx's `X-Real-IP` (preferred) or a
 *   single-value `X-Forwarded-For`.
 * - Peer is a direct client → use the socket address and ignore client-supplied
 *   forwarded headers (they are spoofable when :3000 is reachable).
 */

const LOOPBACK_TRUSTED = ["127.0.0.1", "::1", "::ffff:127.0.0.1"] as const;

/** Header Better Auth is configured to read (single value, set by us or nginx). */
export const CLIENT_IP_HEADER = "x-real-ip";

export function defaultTrustedProxies(): string[] {
  return [...LOOPBACK_TRUSTED];
}

/** Parse `PULSEWATCH_TRUSTED_PROXIES` (comma/whitespace-separated) + loopback. */
export function trustedProxiesFromEnv(
  envValue: string | undefined = process.env.PULSEWATCH_TRUSTED_PROXIES,
): string[] {
  const extras = (envValue ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...defaultTrustedProxies(), ...extras])];
}

function stripIpv4Mapped(ip: string): string {
  const lower = ip.toLowerCase();
  if (lower.startsWith("::ffff:") && lower.includes(".")) {
    return ip.slice(ip.toLowerCase().indexOf("::ffff:") + 7);
  }
  return ip;
}

export function isLoopbackAddress(ip: string): boolean {
  const v = stripIpv4Mapped(ip.trim());
  return v === "::1" || v.startsWith("127.");
}

export function isTrustedProxyPeer(peer: string, trustedProxies: string[]): boolean {
  const raw = peer.trim();
  if (!raw) return false;
  if (isLoopbackAddress(raw) && trustedProxies.some(isLoopbackAddress)) return true;
  const normalized = stripIpv4Mapped(raw);
  for (const entry of trustedProxies) {
    if (entry === raw || entry === normalized) return true;
    if (stripIpv4Mapped(entry) === normalized) return true;
  }
  return false;
}

function firstForwardedHop(value: string | null | undefined): string | null {
  if (!value) return null;
  const hop = value.split(",")[0]?.trim();
  return hop || null;
}

/**
 * Resolve the client IP that should be published as `X-Real-IP` for Better Auth.
 * Returns null only when we have no peer and no trustworthy proxy header.
 */
export function resolveClientIpForBetterAuth(input: {
  peerAddress: string | null | undefined;
  xRealIp: string | null | undefined;
  xForwardedFor: string | null | undefined;
  trustedProxies: string[];
}): string | null {
  const peer = input.peerAddress?.trim() || null;

  if (peer && isTrustedProxyPeer(peer, input.trustedProxies)) {
    const real = firstForwardedHop(input.xRealIp);
    if (real) return stripIpv4Mapped(real);
    const xff = firstForwardedHop(input.xForwardedFor);
    if (xff) return stripIpv4Mapped(xff);
    // Proxy hop without forwarded headers — rate-limit by the proxy itself.
    return stripIpv4Mapped(peer);
  }

  if (peer) {
    return stripIpv4Mapped(peer);
  }

  // No socket peer (some edge runtimes). Do not trust client-supplied headers.
  return null;
}

/** Node/srvx request shape used by Nitro middleware. */
export type PeerCapableRequest = {
  ip?: string;
  headers: Headers;
  runtime?: { node?: { req?: { socket?: { remoteAddress?: string } } } };
  context?: { clientAddress?: string };
};

/** Prefer TCP remoteAddress so trustProxy-resolved `req.ip` cannot confuse us. */
export function socketPeerAddress(req: PeerCapableRequest): string | null {
  const fromSocket = req.runtime?.node?.req?.socket?.remoteAddress?.trim();
  if (fromSocket) return fromSocket;
  const fromCtx = req.context?.clientAddress?.trim();
  if (fromCtx) return fromCtx;
  const fromIp = req.ip?.trim();
  return fromIp || null;
}

/**
 * Mutate request headers so Better Auth sees a single trustworthy `x-real-ip`.
 * Safe when not behind a proxy: overwrites spoofed forwarded headers with peer.
 */
export function applyTrustedClientIpHeader(
  req: PeerCapableRequest,
  trustedProxies: string[] = trustedProxiesFromEnv(),
): string | null {
  const ip = resolveClientIpForBetterAuth({
    peerAddress: socketPeerAddress(req),
    xRealIp: req.headers.get("x-real-ip"),
    xForwardedFor: req.headers.get("x-forwarded-for"),
    trustedProxies,
  });
  if (!ip) return null;
  req.headers.set(CLIENT_IP_HEADER, ip);
  return ip;
}
