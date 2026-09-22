/**
 * Shared structured SSR error logging for middleware + Nitro error hook.
 * Kept free of Vite virtual/?raw imports so plugins can import it safely.
 */

export type RouteError = {
  message?: string;
  name?: string;
  status?: number;
  unhandled?: boolean;
  cause?: unknown;
};

export function walkCauseChain(err: unknown): string[] {
  const messages: string[] = [];
  let current: unknown = err;
  const seen = new Set<unknown>();
  while (current != null && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const e = current as RouteError;
    const label = [e.name, e.message].filter(Boolean).join(": ");
    messages.push(label || String(current));
    current = e.cause;
  }
  if (current != null && messages.length === 0) {
    messages.push(String(current));
  }
  return messages;
}

function pickStatusUnhandled(err: unknown): { status?: number; unhandled?: boolean } {
  let current: unknown = err;
  const seen = new Set<unknown>();
  let status: number | undefined;
  let unhandled: boolean | undefined;
  while (current != null && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const e = current as RouteError;
    if (status === undefined && typeof e.status === "number") status = e.status;
    if (unhandled === undefined && typeof e.unhandled === "boolean") unhandled = e.unhandled;
    if (status !== undefined && unhandled !== undefined) break;
    current = e.cause;
  }
  return { status, unhandled };
}

export function isNoResponseRouteError(err: unknown): boolean {
  const messages = walkCauseChain(err);
  return messages.some(
    (m) =>
      m === "Internal Server Error" ||
      m.endsWith(": Internal Server Error") ||
      /forgot to return a response from your server route handler/i.test(m),
  );
}

/** Structured journal line for opaque SSR 500s (path + cause chain). */
export function logSsrRouteError(
  event: { method?: string; path: string },
  err: unknown,
  tag = "ssr-error",
): void {
  const e = (err && typeof err === "object" ? err : {}) as RouteError;
  const { status, unhandled } = pickStatusUnhandled(err);
  const payload: Record<string, unknown> = {
    tag,
    method: event.method ?? "GET",
    path: event.path,
    name: e.name,
    message: e.message ?? String(err),
    status,
    unhandled,
    causes: walkCauseChain(err),
  };
  if (isNoResponseRouteError(err)) {
    payload.note = "likely: route handler returned no Response";
  }
  console.error(JSON.stringify(payload));
}
