/**
 * Nitro plugin: log request URL on server errors that bypass document
 * middleware (API / non-HTML / early pipeline failures).
 * Shares dedupe with grok-pwa middleware via SSR_ERROR_LOGGED on the error.
 *
 * Auto-registered because vite.config.ts sets `serverDir: "./server"` —
 * Nitro v3 scans `server/plugins/*` under that directory.
 */
import { logSsrRouteError } from "../ssr-error-log-shared";

type NitroHooks = {
  hook: (
    name: "error",
    handler: (error: unknown, context: { event?: unknown; tags?: string[] }) => void,
  ) => void;
};

type NitroApp = { hooks: NitroHooks };

function requestPathFromEvent(event: unknown): { method?: string; path: string } | null {
  if (!event || typeof event !== "object") return null;
  const e = event as {
    path?: string;
    url?: URL | string;
    req?: { method?: string; url?: string };
    method?: string;
  };

  let path: string | undefined;
  if (typeof e.path === "string" && e.path.length > 0) {
    path = e.path;
  } else if (e.url instanceof URL) {
    path = e.url.pathname + e.url.search;
  } else if (typeof e.url === "string" && e.url.length > 0) {
    path = e.url;
  } else if (typeof e.req?.url === "string" && e.req.url.length > 0) {
    path = e.req.url;
  }

  if (!path) return null;

  const method = (e.req?.method ?? e.method)?.toUpperCase();
  return { method, path };
}

export default function ssrErrorLogPlugin(nitroApp: NitroApp): void {
  nitroApp.hooks.hook("error", (error, { event, tags }) => {
    const req = requestPathFromEvent(event);
    const path = req?.path ?? "(no request url)";
    logSsrRouteError({ method: req?.method, path }, error, "nitro-ssr-error");
    if (tags && tags.length > 0) {
      console.error(JSON.stringify({ tag: "nitro-ssr-error-tags", path, tags }));
    }
  });
}
