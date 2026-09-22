/**
 * Self-host: publish a trustworthy client IP for Better Auth rate limits.
 *
 * Auto-registered via vite `serverDir: "./server"`. Only active when
 * `PULSEWATCH_SELFHOST=1`. Sets `X-Real-IP` from the TCP peer, or from nginx's
 * forwarded headers when the peer is a trusted reverse proxy (loopback /
 * `PULSEWATCH_TRUSTED_PROXIES`). See `src/lib/auth/client-ip.server.ts`.
 */
import {
  applyTrustedClientIpHeader,
  type PeerCapableRequest,
} from "../../src/lib/auth/client-ip.server";

type ClientIpEvent = {
  req: PeerCapableRequest;
};

function isSelfHostPackaged(): boolean {
  return process.env.PULSEWATCH_SELFHOST === "1";
}

export default async function clientIpMiddleware(
  event: ClientIpEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  if (isSelfHostPackaged()) {
    try {
      applyTrustedClientIpHeader(event.req);
    } catch {
      // Never block the request if header mutation fails.
    }
  }
  return next();
}
