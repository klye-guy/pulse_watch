/** Redact secret-bearing channel config fields (Kevin AppSec #7). */
export function redactSecrets(type, config) {
  const next = { ...config };
  if (next.pass) next.pass = "";
  if (type === "telegram" && next.token) {
    next.token = next.token.length > 6 ? `${next.token.slice(0, 4)}…` : "";
  }
  if ((type === "webhook" || type === "discord" || type === "slack") && next.url) {
    next.url = next.url.length > 12 ? `${next.url.slice(0, 8)}…` : "";
  }
  return next;
}
