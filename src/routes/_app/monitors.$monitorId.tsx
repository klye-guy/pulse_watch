import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { HeartbeatBar } from "@/components/heartbeat-bar";
import { MonitorForm } from "@/components/monitor-form";
import { StatusDot, statusLabel } from "@/components/status-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteMonitorFn,
  getMonitorChannelsFn,
  getMonitorFn,
  listChannelsFn,
  saveMonitorFn,
  setMonitorActiveFn,
  setMonitorChannelsFn,
} from "@/lib/server/fns";
import { formatDuration, formatPct, formatRelative, targetOf } from "@/lib/utils";

export const Route = createFileRoute("/_app/monitors/$monitorId")({ component: MonitorDetail });

function MonitorDetail() {
  const { monitorId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const monitor = useQuery({
    queryKey: ["monitor", monitorId],
    queryFn: () => getMonitorFn({ data: monitorId }),
    refetchInterval: 8000,
  });
  const channels = useQuery({ queryKey: ["channels"], queryFn: () => listChannelsFn() });
  const linked = useQuery({
    queryKey: ["monitor-channels", monitorId],
    queryFn: () => getMonitorChannelsFn({ data: monitorId }),
  });

  const save = useMutation({
    mutationFn: saveMonitorFn,
    onSuccess: () => {
      toast.success("Saved");
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ["monitor", monitorId] });
      void qc.invalidateQueries({ queryKey: ["monitors"] });
    },
  });
  const pause = useMutation({
    mutationFn: setMonitorActiveFn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["monitor", monitorId] });
      void qc.invalidateQueries({ queryKey: ["monitors"] });
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteMonitorFn({ data: monitorId }),
    onSuccess: () => {
      toast.success("Deleted");
      void navigate({ to: "/" });
    },
  });
  const link = useMutation({
    mutationFn: (channelIds: string[]) => setMonitorChannelsFn({ data: { monitorId, channelIds } }),
    onSuccess: () => {
      toast.success("Notifications updated");
      void qc.invalidateQueries({ queryKey: ["monitor-channels", monitorId] });
    },
  });

  const m = monitor.data;
  const chart = useMemo(
    () =>
      (m?.beats ?? [])
        .filter((b) => b.ping != null)
        .map((b) => ({
          t: new Date(b.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          ping: b.ping,
        })),
    [m],
  );

  if (monitor.isPending) {
    return <div className="mx-auto h-64 max-w-5xl animate-pulse rounded-xl bg-surface" />;
  }
  if (!m) {
    return <p className="text-muted">Monitor not found.</p>;
  }

  const tone = m.lastStatus === "up" ? "up" : m.lastStatus === "down" ? "down" : m.lastStatus === "paused" ? "paused" : "pending";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusDot status={m.lastStatus} />
            <h1 className="text-2xl font-semibold tracking-tight">{m.name}</h1>
            <Badge tone={tone}>{statusLabel(m.lastStatus, { failStreak: m.failStreak, maxRetries: m.maxRetries })}</Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-muted">{targetOf(m)}</p>
          {m.lastMsg && <p className="mt-1 text-sm text-subtle">{m.lastMsg}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close editor" : "Edit"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => pause.mutate({ data: { id: m.id, active: !m.active } })}
          >
            {m.active ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm("Delete this monitor and its heartbeats?")) remove.mutate();
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Mini label="24h uptime" value={formatPct(m.uptime24h)} />
        <Mini label="30d uptime" value={formatPct(m.uptime30d)} />
        <Mini label="Last ping" value={formatDuration(m.lastPing)} />
        <Mini label="Last check" value={formatRelative(m.lastCheckedAt)} />
      </div>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="mb-3 text-sm font-medium">Heartbeat</h2>
        <HeartbeatBar beats={m.beats} className="h-10" />
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="mb-3 text-sm font-medium">Response time</h2>
        {chart.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Waiting for the first successful checks.</p>
        ) : (
          <div className="h-56 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <XAxis dataKey="t" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-fg)",
                  }}
                />
                <Area type="monotone" dataKey="ping" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="mb-3 text-sm font-medium">Notify on status change</h2>
        {channels.data && channels.data.length === 0 && (
          <p className="text-sm text-muted">No channels yet. Add one under Notifications.</p>
        )}
        <div className="flex flex-col gap-2">
          {(channels.data ?? []).map((ch) => {
            const checked = linked.data?.includes(ch.id) ?? false;
            return (
              <label key={ch.id} className="flex h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={checked}
                  onChange={() => {
                    const next = new Set(linked.data ?? []);
                    if (checked) next.delete(ch.id);
                    else next.add(ch.id);
                    link.mutate([...next]);
                  }}
                />
                {ch.name}
                <span className="text-xs uppercase text-subtle">{ch.type}</span>
              </label>
            );
          })}
        </div>
      </section>

      {editing && (
        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="mb-4 text-sm font-medium">Edit monitor</h2>
          <MonitorForm
            initial={{
              id: m.id,
              name: m.name,
              type: m.type,
              url: m.url ?? "",
              hostname: m.hostname ?? "",
              port: m.port ?? undefined,
              method: m.method,
              keyword: m.keyword ?? "",
              keywordInvert: m.keywordInvert,
              dnsRecordType: m.dnsRecordType,
              intervalSec: m.intervalSec,
              timeoutSec: m.timeoutSec,
              acceptedStatus: m.acceptedStatus,
              tags: m.tags,
              active: m.active,
              maxRetries: m.maxRetries,
              retryIntervalSec: m.retryIntervalSec,
              resendIntervalSec: m.resendIntervalSec,
            }}
            submitting={save.isPending}
            onSubmit={(input) => save.mutate({ data: input })}
          />
        </section>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}
