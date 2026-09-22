/**
 * Nitro plugin: start the monitor check engine on self-host boot.
 *
 * Production Nitro does not load route/serverFn modules until first request,
 * so the `PULSEWATCH_SELFHOST` side-effect in `src/lib/monitor/engine.ts` never
 * runs until something like listMonitorsFn imports the engine. Dev is fine
 * because vite.config.ts SSR-loads the engine in configureServer.
 *
 * Auto-registered because vite.config.ts sets `serverDir: "./server"` —
 * Nitro v3 scans `server/plugins/*` under that directory.
 *
 * Guarded to self-host only so Vercel/serverless deploys never start a timer.
 * Uses kickDueChecks() (exported, single-start safe) so the timer starts and
 * due monitors run immediately without waiting for a dashboard hit.
 */
type NitroApp = { hooks?: unknown };

function isSelfHostPackaged(): boolean {
  return process.env.PULSEWATCH_SELFHOST === "1";
}

export default function startEnginePlugin(_nitroApp?: NitroApp): void {
  if (!isSelfHostPackaged()) return;

  void import("../../src/lib/monitor/engine")
    .then((mod) => {
      mod.kickDueChecks();
    })
    .catch((err) => {
      console.error("[pulsewatch] monitor engine failed to start on boot:", err);
    });
}
