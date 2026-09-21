import { useState, type ReactNode } from "react";
import { INTERVAL_OPTIONS, RESEND_INTERVAL_OPTIONS, RETRY_COUNT_OPTIONS, RETRY_INTERVAL_OPTIONS, type MonitorInput, type MonitorType } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const TYPES: { value: MonitorType; label: string; hint: string }[] = [
  { value: "http", label: "HTTP(s)", hint: "Status code of a URL" },
  { value: "keyword", label: "Keyword", hint: "HTTP body contains a string" },
  { value: "tcp", label: "TCP", hint: "Port is accepting connections" },
  { value: "ping", label: "Ping", hint: "ICMP, falling back to TCP" },
  { value: "dns", label: "DNS", hint: "Hostname resolves" },
];

export function MonitorForm({
  initial,
  submitting,
  onSubmit,
}: {
  initial?: Partial<MonitorInput>;
  submitting?: boolean;
  onSubmit: (input: MonitorInput) => void;
}) {
  const [type, setType] = useState<MonitorType>(initial?.type ?? "http");
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [method, setMethod] = useState(initial?.method ?? "GET");
  const [keyword, setKeyword] = useState(initial?.keyword ?? "");
  const [keywordInvert, setKeywordInvert] = useState(initial?.keywordInvert ?? false);
  const [hostname, setHostname] = useState(initial?.hostname ?? "");
  const [port, setPort] = useState(String(initial?.port ?? 443));
  const [dnsRecordType, setDnsRecordType] = useState(initial?.dnsRecordType ?? "A");
  const [intervalSec, setIntervalSec] = useState(initial?.intervalSec ?? 60);
  const [timeoutSec, setTimeoutSec] = useState(initial?.timeoutSec ?? 10);
  const [acceptedStatus, setAcceptedStatus] = useState(initial?.acceptedStatus ?? "200-299");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [maxRetries, setMaxRetries] = useState(initial?.maxRetries ?? 2);
  const [retryIntervalSec, setRetryIntervalSec] = useState(initial?.retryIntervalSec ?? 20);
  const [resendIntervalSec, setResendIntervalSec] = useState(initial?.resendIntervalSec ?? 0);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          id: initial?.id,
          name,
          type,
          url,
          method,
          keyword,
          keywordInvert,
          hostname,
          port: Number(port) || undefined,
          dnsRecordType,
          intervalSec,
          timeoutSec,
          acceptedStatus,
          tags,
          active: initial?.active ?? true,
          maxRetries,
          retryIntervalSec,
          resendIntervalSec,
        });
      }}
    >
      <Field label="Name">
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Production API" />
      </Field>

      <div className="grid gap-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={
                type === t.value
                  ? "rounded-md bg-elevated px-3 py-2 text-left shadow-[var(--shadow-border-hover)]"
                  : "rounded-md border border-border px-3 py-2 text-left text-muted hover:text-fg"
              }
            >
              <span className="block text-sm font-medium text-fg">{t.label}</span>
              <span className="mt-0.5 block text-xs text-subtle">{t.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {(type === "http" || type === "keyword") && (
        <>
          <Field label="URL">
            <Input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://status.example.com/health"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Method">
              <select
                className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {["GET", "HEAD", "POST", "PUT"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Accepted status">
              <Input value={acceptedStatus} onChange={(e) => setAcceptedStatus(e.target.value)} placeholder="200-299" />
            </Field>
          </div>
        </>
      )}

      {type === "keyword" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Keyword">
            <Input required value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder='"ok":true' />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={keywordInvert}
              onChange={(e) => setKeywordInvert(e.target.checked)}
              className="size-4 accent-accent"
            />
            Invert (fail if present)
          </label>
        </div>
      )}

      {(type === "tcp" || type === "ping" || type === "dns") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hostname">
            <Input required value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="db.internal" />
          </Field>
          {type === "tcp" && (
            <Field label="Port">
              <Input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric" />
            </Field>
          )}
          {type === "dns" && (
            <Field label="Record type">
              <select
                className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
                value={dnsRecordType}
                onChange={(e) => setDnsRecordType(e.target.value)}
              >
                {["A", "AAAA", "CNAME", "MX", "TXT", "NS"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Heartbeat">
          <select
            className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Timeout (sec)">
          <Input
            type="number"
            min={1}
            max={60}
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(Number(e.target.value))}
          />
        </Field>
        <Field label="Tags">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="prod, api" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Retries before alert">
          <select
            className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
            value={maxRetries}
            onChange={(e) => setMaxRetries(Number(e.target.value))}
          >
            {RETRY_COUNT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Wait between retries">
          <select
            className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
            value={retryIntervalSec}
            onChange={(e) => setRetryIntervalSec(Number(e.target.value))}
          >
            {RETRY_INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Resend while down">
          <select
            className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
            value={resendIntervalSec}
            onChange={(e) => setResendIntervalSec(Number(e.target.value))}
          >
            {RESEND_INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="text-xs text-subtle">
        Alerts fire only after retries confirm down. Recoveries notify immediately. Resend repeats the down
        alert on a long outage so a missed page is not silent.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initial?.id ? "Save monitor" : "Create monitor"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
