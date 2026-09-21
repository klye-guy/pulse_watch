import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { HeartbeatBar } from "@/components/heartbeat-bar";
import { StatusDot, statusLabel } from "@/components/status-dot";
import { Badge } from "@/components/ui/badge";
import { getPublicStatusFn } from "@/lib/server/fns";
import { formatPct } from "@/lib/utils";

export const Route = createFileRoute("/s/$slug")({ component: PublicStatus });

function PublicStatus() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["status", slug],
    queryFn: () => getPublicStatusFn({ data: slug }),
    refetchInterval: 15000,
  });

  if (q.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg">
        <div className="h-40 w-80 animate-pulse rounded-xl bg-surface" />
      </main>
    );
  }
  if (!q.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-4">
        <p className="text-muted">This status page is not published.</p>
      </main>
    );
  }

  const down = q.data.monitors.filter((m) => m.lastStatus === "down").length;
  const headline = down > 0 ? `${down} service${down === 1 ? "" : "s"} disrupted` : "All systems operational";

  return (
    <main className="min-h-screen bg-bg px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-2 text-accent">
          <Activity className="size-4" />
          <span className="text-xs font-medium tracking-[0.2em] uppercase">Pulsewatch</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{q.data.title}</h1>
        {q.data.description && <p className="mt-2 text-muted">{q.data.description}</p>}
        <p className={`mt-4 text-sm ${down ? "text-down" : "text-up"}`}>{headline}</p>

        <ul className="mt-8 space-y-2">
          {q.data.monitors.map((m) => {
            const tone =
              m.lastStatus === "up" ? "up" : m.lastStatus === "down" ? "down" : m.lastStatus === "paused" ? "paused" : "pending";
            return (
              <li key={m.id} className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={m.lastStatus} />
                    <span className="font-medium">{m.name}</span>
                    <Badge tone={tone}>{statusLabel(m.lastStatus)}</Badge>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-muted">{formatPct(m.uptime24h)}</span>
                </div>
                <HeartbeatBar beats={m.beats} className="mt-3 h-6" />
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
