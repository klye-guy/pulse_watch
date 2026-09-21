import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { HeartbeatBar } from "@/components/heartbeat-bar";
import { StatusDot, statusLabel } from "@/components/status-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMonitorFn, listMonitorsFn, setMonitorActiveFn } from "@/lib/server/fns";
import type { HeartbeatStatus, MonitorSummary } from "@/lib/types";
import { formatDuration, formatPct, formatRelative, targetOf } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

type Filter = "all" | HeartbeatStatus | "paused";

function Dashboard() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const q = useQuery({
    queryKey: ["monitors"],
    queryFn: () => listMonitorsFn(),
    refetchInterval: 8000,
  });
  const pause = useMutation({
    mutationFn: setMonitorActiveFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteMonitorFn({ data: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  });

  const monitors = q.data ?? [];
  const up = monitors.filter((m) => m.lastStatus === "up").length;
  const down = monitors.filter((m) => m.lastStatus === "down").length;
  const pending = monitors.filter((m) => m.lastStatus === "pending").length;
  const paused = monitors.filter((m) => m.lastStatus === "paused").length;
  const avgUptime =
    monitors.length === 0
      ? null
      : monitors.reduce((acc, m) => acc + (m.uptime24h ?? 0), 0) / monitors.length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rank = (s: MonitorSummary["lastStatus"]) =>
      s === "down" ? 0 : s === "pending" ? 1 : s === "paused" ? 2 : 3;
    return monitors
      .filter((m) => (filter === "all" ? true : m.lastStatus === filter))
      .filter((m) => {
        if (!needle) return true;
        return (
          m.name.toLowerCase().includes(needle) ||
          targetOf(m).toLowerCase().includes(needle) ||
          m.tags.toLowerCase().includes(needle) ||
          m.type.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => rank(a.lastStatus) - rank(b.lastStatus) || a.name.localeCompare(b.name));
  }, [monitors, query, filter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {monitors.length} monitor{monitors.length === 1 ? "" : "s"}. Down and retrying stay at the top.
          </p>
        </div>
        <Button asChild>
          <Link to="/monitors/new">
            <Plus className="size-4" />
            New monitor
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Up" value={String(up)} tone="up" />
        <Stat label="Down" value={String(down)} tone="down" />
        <Stat label="Retrying" value={String(pending)} tone="pending" />
        <Stat label="Paused" value={String(paused)} tone="paused" />
        <Stat label="24h uptime" value={formatPct(avgUptime)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, URL, or tag"
            className="pl-9"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "All"],
              ["down", "Down"],
              ["pending", "Retrying"],
              ["up", "Up"],
              ["paused", "Paused"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                filter === value
                  ? "h-10 rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border-hover)]"
                  : "h-10 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {q.isPending && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}

      {!q.isPending && monitors.length === 0 && (
        <div className="rounded-xl bg-surface px-6 py-16 text-center shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted">No monitors yet. Add an HTTP, TCP, ping, or DNS check.</p>
          <Button asChild className="mt-4">
            <Link to="/monitors/new">Create the first monitor</Link>
          </Button>
        </div>
      )}

      {!q.isPending && monitors.length > 0 && visible.length === 0 && (
        <p className="text-sm text-muted">No monitors match that filter.</p>
      )}

      <ul className="space-y-2">
        {visible.map((m) => (
          <MonitorRow
            key={m.id}
            monitor={m}
            onPause={() => pause.mutate({ data: { id: m.id, active: !m.active } })}
            onDelete={() => {
              if (window.confirm(`Delete ${m.name}?`)) remove.mutate(m.id);
            }}
          />
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "paused" | "pending";
}) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={
          tone === "up"
            ? "mt-1 font-mono text-2xl tabular-nums text-up"
            : tone === "down"
              ? "mt-1 font-mono text-2xl tabular-nums text-down"
              : tone === "paused"
                ? "mt-1 font-mono text-2xl tabular-nums text-paused"
                : tone === "pending"
                  ? "mt-1 font-mono text-2xl tabular-nums text-pending"
                  : "mt-1 font-mono text-2xl tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}

function MonitorRow({
  monitor: m,
  onPause,
  onDelete,
}: {
  monitor: MonitorSummary;
  onPause: () => void;
  onDelete: () => void;
}) {
  const tone = m.lastStatus === "up" ? "up" : m.lastStatus === "down" ? "down" : m.lastStatus === "paused" ? "paused" : "pending";
  return (
    <li className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Link to="/monitors/$monitorId" params={{ monitorId: m.id }} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusDot status={m.lastStatus} />
            <span className="truncate font-medium">{m.name}</span>
            <Badge tone={tone}>{statusLabel(m.lastStatus, { failStreak: m.failStreak, maxRetries: m.maxRetries })}</Badge>
            <span className="hidden text-xs uppercase tracking-wide text-subtle sm:inline">{m.type}</span>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-subtle">{targetOf(m)}</p>
        </Link>
        <div className="w-full min-w-0 lg:w-64">
          <HeartbeatBar beats={m.beats} />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="min-w-16">
            <p className="text-xs text-subtle">24h</p>
            <p className="font-mono tabular-nums">{formatPct(m.uptime24h)}</p>
          </div>
          <div className="min-w-16">
            <p className="text-xs text-subtle">Ping</p>
            <p className="font-mono tabular-nums">{formatDuration(m.lastPing)}</p>
          </div>
          <div className="hidden min-w-20 sm:block">
            <p className="text-xs text-subtle">Checked</p>
            <p className="text-muted">{formatRelative(m.lastCheckedAt)}</p>
          </div>
          <div className="ml-auto flex">
            <Button variant="ghost" size="icon" onClick={onPause} aria-label={m.active ? "Pause" : "Resume"}>
              {m.active ? <Pause /> : <Play />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
