/**
 * Shared structured SSR error logging for middleware + Nitro error hook.
 * Kept free of Vite virtual/?raw imports so plugins can import it safely.
 */

/** Marks an error already journaled so middleware + Nitro do not double-log. */
export const SSR_ERROR_LOGGED = Symbol.for("pulsewatch.ssrErrorLogged");

export function walkCauseChain(err) {
  const messages = [];
  let current = err;
  const seen = new Set();
  while (current != null && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const label = [current.name, current.message].filter(Boolean).join(": ");
    messages.push(label || String(current));
    current = current.cause;
  }
  if (current != null && messages.length === 0) {
    messages.push(String(current));
  }
  return messages;
}

function pickStatusUnhandled(err) {
  let current = err;
  const seen = new Set();
  let status;
  let unhandled;
  while (current != null && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (status === undefined && typeof current.status === "number") status = current.status;
    if (unhandled === undefined && typeof current.unhandled === "boolean") {
      unhandled = current.unhandled;
    }
    if (status !== undefined && unhandled !== undefined) break;
    current = current.cause;
  }
  return { status, unhandled };
}

function collectStacks(err) {
  const parts = [];
  let current = err;
  const seen = new Set();
  while (current != null && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (typeof current.stack === "string" && current.stack.length > 0) {
      parts.push(current.stack);
    }
    current = current.cause;
  }
  return parts.join("\n");
}

/**
 * TanStack Start throws a generic "Internal Server Error" in production when a
 * route handler returns no Response (`throwRouteHandlerError`). Do not treat
 * every ISE as that case — require the TanStack frames or the explicit dev message.
 */
export function isNoResponseRouteError(err) {
  const messages = walkCauseChain(err);
  if (
    messages.some((m) =>
      /forgot to return a response from your server route handler/i.test(m),
    )
  ) {
    return true;
  }
  const stacks = collectStacks(err);
  return /throwRouteHandlerError(?:\s|\)|$)|getFinalResponse/.test(stacks);
}

export function markSsrErrorLogged(err) {
  if (err != null && typeof err === "object") {
    try {
      Object.defineProperty(err, SSR_ERROR_LOGGED, {
        value: true,
        enumerable: false,
        configurable: true,
      });
    } catch {
      // ignore non-extensible errors
    }
  }
}

export function wasSsrErrorLogged(err) {
  // h3 wraps thrown Errors in a fresh HTTPError before the Nitro "error" hook,
  // so the SSR_ERROR_LOGGED mark on the original must still count via .cause.
  let current = err;
  const seen = new Set();
  while (current != null && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (Boolean(current[SSR_ERROR_LOGGED])) return true;
    current = current.cause;
  }
  return false;
}

/** Structured journal line for opaque SSR 500s (path + cause chain). */
export function logSsrRouteError(event, err, tag = "ssr-error") {
  if (wasSsrErrorLogged(err)) return;
  markSsrErrorLogged(err);

  const e = err && typeof err === "object" ? err : {};
  const { status, unhandled } = pickStatusUnhandled(err);
  const payload = {
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
