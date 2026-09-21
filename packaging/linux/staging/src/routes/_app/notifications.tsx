import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteChannelFn, listChannelsFn, listNotifyLogFn, saveChannelFn, testChannelFn } from "@/lib/server/fns";
import type { ChannelType } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({ component: NotificationsPage });

const TYPES: { value: ChannelType; label: string }[] = [
  { value: "email", label: "Email (SMTP)" },
  { value: "webhook", label: "Webhook" },
  { value: "discord", label: "Discord" },
  { value: "slack", label: "Slack" },
  { value: "telegram", label: "Telegram" },
];

function NotificationsPage() {
  const qc = useQueryClient();
  const channels = useQuery({ queryKey: ["channels"], queryFn: () => listChannelsFn() });
  const log = useQuery({ queryKey: ["notify-log"], queryFn: () => listNotifyLogFn(), refetchInterval: 15000 });
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("email");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState("starttls");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applyToAll, setApplyToAll] = useState(true);

  const save = useMutation({
    mutationFn: saveChannelFn,
    onSuccess: () => {
      toast.success("Channel saved");
      setName("");
      setUrl("");
      setToken("");
      setChatId("");
      setHost("");
      setPass("");
      setTo("");
      setUser("");
      setFrom("");
      void qc.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteChannelFn({ data: id }),
    onSuccess: () => {
      toast.success("Channel removed");
      void qc.invalidateQueries({ queryKey: ["channels"] });
    },
  });
  const test = useMutation({
    mutationFn: (id: string) => testChannelFn({ data: id }),
    onSuccess: () => {
      toast.success("Test sent");
      void qc.invalidateQueries({ queryKey: ["notify-log"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Test failed"),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted">
          Email, webhook, Discord, Slack, or Telegram. Alerts fire only after retries confirm a
          monitor is down, and again when it recovers. Attach a channel on the monitor page.
        </p>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="mb-4 text-sm font-medium">New channel</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              data: {
                name,
                type,
                config: { url, token, chatId, host, port, smtpSecure, user, pass, from, to },
                applyToAll,
              },
            });
          }}
        >
          <label className="grid gap-1.5">
            <Label>Name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ops alerts" />
          </label>
          <label className="grid gap-1.5">
            <Label>Type</Label>
            <select
              className="h-10 rounded-md border border-border bg-bg px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as ChannelType)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {type === "email" && (
            <>
              <label className="grid gap-1.5">
                <Label>SMTP host</Label>
                <Input required value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.office365.com" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5">
                  <Label>Port</Label>
                  <Input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric" />
                </label>
                <label className="grid gap-1.5">
                  <Label>Security</Label>
                  <select
                    className="h-10 rounded-md border border-border bg-bg px-3 text-sm"
                    value={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.value)}
                  >
                    <option value="starttls">STARTTLS</option>
                    <option value="tls">TLS</option>
                    <option value="none">None</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1.5">
                <Label>Username</Label>
                <Input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" />
              </label>
              <label className="grid gap-1.5">
                <Label>Password</Label>
                <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
              </label>
              <label className="grid gap-1.5">
                <Label>From</Label>
                <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="alerts@company.com" />
              </label>
              <label className="grid gap-1.5">
                <Label>To</Label>
                <Input
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="ops@company.com, oncall@company.com"
                />
              </label>
            </>
          )}
          {type !== "telegram" && type !== "email" && (
            <label className="grid gap-1.5 sm:col-span-2">
              <Label>{type === "webhook" ? "Webhook URL" : "Incoming webhook URL"}</Label>
              <Input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
            </label>
          )}
          {type === "telegram" && (
            <>
              <label className="grid gap-1.5">
                <Label>Bot token</Label>
                <Input required value={token} onChange={(e) => setToken(e.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <Label>Chat ID</Label>
                <Input required value={chatId} onChange={(e) => setChatId(e.target.value)} />
              </label>
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
            <input
              type="checkbox"
              className="size-4 accent-accent"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
            />
            Attach to every existing monitor
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              Save channel
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        {(channels.data ?? []).map((ch) => (
          <div
            key={ch.id}
            className="flex flex-col gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{ch.name}</p>
              <p className="truncate text-xs uppercase tracking-wide text-subtle">
                {ch.type}
                {ch.type === "email" && ch.config.to ? ` · ${ch.config.to}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant="secondary"
                disabled={test.isPending}
                onClick={() => test.mutate(ch.id)}
              >
                Send test
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(ch.id)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">Recent events</h2>
        <ul className="space-y-2">
          {(log.data ?? []).map((row) => (
            <li key={row.id} className="rounded-xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={
                    row.event === "down" ? "text-down" : row.event === "test" ? "text-muted" : "text-up"
                  }
                >
                  {row.event}
                </span>
                <span className="text-xs text-subtle">{formatRelative(row.createdAt)}</span>
              </div>
              <p className="mt-1 text-muted">
                {row.event === "test" ? "Test" : (row.monitorName ?? "monitor")}
                {row.channelName ? ` → ${row.channelName}` : ""}
              </p>
              {row.detail && <p className="mt-1 text-xs text-subtle">{row.detail}</p>}
            </li>
          ))}
          {(log.data ?? []).length === 0 && <p className="text-sm text-muted">No events yet.</p>}
        </ul>
      </section>
    </div>
  );
}
