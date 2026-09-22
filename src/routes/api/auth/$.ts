import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import {
  applyTrustedClientIpHeader,
  type PeerCapableRequest,
} from "@/lib/auth/client-ip.server";

/**
 * Better Auth rate limits read IP from headers only. Nitro middleware may see
 * the srvx Request, but TanStack Start can pass a distinct `request` into this
 * handler — apply the trusted client IP on the object BA actually receives.
 */
function withTrustedClientIp(request: Request): Request {
  if (process.env.PULSEWATCH_SELFHOST !== "1") return request;
  try {
    applyTrustedClientIpHeader(request as PeerCapableRequest);
  } catch {
    // Never block auth if header mutation fails.
  }
  return request;
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(withTrustedClientIp(request)),
      POST: ({ request }) => auth.handler(withTrustedClientIp(request)),
    },
  },
});
