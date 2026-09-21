import { getSql, type Sql } from "@/lib/db";
import {
  checkConcurrency,
  checkTimeoutSec,
  decideRetry,
  hostConcurrency,
  isMonitorDue,
  shouldResend,
  type ConfirmedStatus,
} from "./retry";
import { runCheck } from "./checkers";
import { dispatchStatusChange } from "./notify";

type MonitorRow = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  method: string;
  keyword: string | null;
  keyword_invert: boolean;
  hostname: string | null;
  port: number | null;
  dns_record_type: string;
  interval_sec: number;
  timeout_sec: number;
  accepted_status: string;
  max_retries: number;
  retry_interval_sec: number;
  resend_interval_sec: number;
  fail_streak: number;
  confirmed_status: ConfirmedStatus;
  last_checked_at: string | Date | null;
  last_notified_at: string | Date | null;
  active: boolean;
};

type CheckOutcome = {
  monitor: MonitorRow;
  status: "up" | "down";
  ping: number | null;
  msg: string;
};

const HEARTBEATS_KEPT = 48;

const globalRef = globalThis as typeof globalThis & {
  __pulsewatchEngine__?: {
    timer?: ReturnType<typeof setInterval>;
    running?: Promise<{ checked: number }>;
    lastPrune?: number;
    startedAt?: number;
    hostInFlight?: Map<string, number>;
  };
};

function state() {
  globalRef.__pulsewatchEngine__ ??= { hostInFlight: new Map(), startedAt: Date.now() };
  globalRef.__pulsewatchEngine__.hostInFlight ??= new Map();
  globalRef.__pulsewatchEngine__.startedAt ??= Date.now();
  return globalRef.__pulsewatchEngine__;
}

export async function runDueChecks(): Promise<{ checked: number }> {
  const slot = state();
  if (slot.running) return slot.running;
  const work = actuallyRunDueChecks().finally(() => {
    if (slot.running === work) slot.running = undefined;
  });
  slot.running = work;
  return work;
}

export function kickDueChecks(): void {
  startEngine();
  void runDueChecks();
}

async function actuallyRunDueChecks(): Promise<{ checked: number }> {
  try {
    return await runDueChecksInner();
  } catch (err) {
    console.error("[pulsewatch] engine tick failed", err);
    return { checked: 0 };
  }
}

async function runDueChecksInner(): Promise<{ checked: number }> {
  const sql = await getSql();
  const enabled = await sql<{ value: string }>`
    select value from site_settings where key = 'check_enabled'
  `;
  if (enabled[0] && enabled[0].value === "false") return { checked: 0 };

  const monitors = await sql<MonitorRow>`
    select id, name, type, url, method, keyword, keyword_invert, hostname, port,
           dns_record_type, interval_sec, timeout_sec, accepted_status,
           max_retries, retry_interval_sec, resend_interval_sec, fail_streak, confirmed_status,
           last_checked_at, last_notified_at, active
    from monitors
    where active = true
  `;
  if (monitors.length === 0) return { checked: 0 };

  const slot = state();
  const now = Date.now();
  const due = monitors.filter((m) =>
    isMonitorDue({
      id: m.id,
      lastCheckedAt: m.last_checked_at,
      intervalSec: Number(m.interval_sec),
      retryIntervalSec: Number(m.retry_interval_sec),
      failStreak: Number(m.fail_streak),
      maxRetries: Number(m.max_retries),
      nowMs: now,
      engineStartedAtMs: slot.startedAt,
    }),
  );
  if (due.length === 0) return { checked: 0 };

  const results: CheckOutcome[] = [];
  const perHost = hostConcurrency(process.env.CHECK_HOST_CONCURRENCY);
  await runPool(due, checkConcurrency(process.env.CHECK_CONCURRENCY), async (monitor) => {
    const host = hostKey(monitor);
    await acquireHost(host, perHost);
    try {
      const result = await runCheck({
        type: monitor.type,
        url: monitor.url,
        method: monitor.method,
        keyword: monitor.keyword,
        keywordInvert: Boolean(monitor.keyword_invert),
        hostname: monitor.hostname,
        port: monitor.port,
        dnsRecordType: monitor.dns_record_type,
        timeoutSec: checkTimeoutSec(Number(monitor.timeout_sec)),
        acceptedStatus: monitor.accepted_status,
      });
      results.push({ monitor, status: result.status, ping: result.ping, msg: result.msg });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      results.push({ monitor, status: "down", ping: null, msg });
    } finally {
      releaseHost(host);
    }
  });

  // Persist one monitor at a time so a 48-wide check pool cannot exhaust the
  // Postgres client pool the way Kuma does (false downs from "pool is full").
  const notifies: Array<{ monitor: MonitorRow; from: string; to: "up" | "down"; msg: string }> = [];
  for (const outcome of results) {
    try {
      const notify = await recordHeartbeat(sql, outcome.monitor, outcome.status, outcome.ping, outcome.msg);
      if (notify) notifies.push(notify);
    } catch (err) {
      console.error("[pulsewatch] persist failed", outcome.monitor.id, err);
    }
  }

  for (const n of notifies) {
    void dispatchStatusChange(sql, n.monitor, n.from, n.to, n.msg).catch((err) => {
      console.error("[pulsewatch] notify failed", n.monitor.id, err);
    });
  }

  if (results.length > 0 && now - (slot.lastPrune ?? 0) > 5 * 60_000) {
    slot.lastPrune = now;
    try {
      await pruneHeartbeats(sql);
    } catch (err) {
      console.error("[pulsewatch] prune failed", err);
    }
  }
  return { checked: results.length };
}

async function recordHeartbeat(
  sql: Sql,
  monitor: MonitorRow,
  checkStatus: "up" | "down",
  ping: number | null,
  msg: string,
): Promise<{ monitor: MonitorRow; from: string; to: "up" | "down"; msg: string } | null> {
  const decision = decideRetry({
    checkStatus,
    failStreak: Number(monitor.fail_streak),
    maxRetries: Number(monitor.max_retries),
    confirmed: monitor.confirmed_status,
  });
  const resend = shouldResend({
    heartbeatStatus: decision.heartbeatStatus,
    confirmed: decision.confirmed,
    notify: decision.notify,
    resendIntervalSec: Number(monitor.resend_interval_sec ?? 0),
    lastNotifiedAt: monitor.last_notified_at,
  });
  const notify = decision.notify ?? (resend ? "down" : null);
  const detail = decision.messagePrefix ? `${decision.messagePrefix}: ${msg}` : msg;
  await sql`
    update monitors
    set fail_streak = ${decision.nextStreak},
        confirmed_status = ${decision.confirmed},
        last_checked_at = now(),
        last_status = ${decision.heartbeatStatus},
        last_ping = ${ping},
        last_msg = ${detail},
        last_notified_at = case when ${notify ? 1 : 0} = 1 then now() else last_notified_at end,
        updated_at = now()
    where id = ${monitor.id}
  `;
  await sql`
    insert into heartbeats (monitor_id, status, ping, msg)
    values (${monitor.id}, ${decision.heartbeatStatus}, ${ping}, ${detail})
  `;
  const up = decision.heartbeatStatus === "up" ? 1 : 0;
  const down = decision.heartbeatStatus === "down" ? 1 : 0;
  const pending = decision.heartbeatStatus === "pending" ? 1 : 0;
  const pingSum = ping ?? 0;
  const pingN = ping == null ? 0 : 1;
  try {
    await sql`
      insert into monitor_hour_stats (monitor_id, hour_ts, up_count, down_count, pending_count, ping_sum, ping_n)
      values (${monitor.id}, date_trunc('hour', now()), ${up}, ${down}, ${pending}, ${pingSum}, ${pingN})
      on conflict (monitor_id, hour_ts) do update set
        up_count = monitor_hour_stats.up_count + excluded.up_count,
        down_count = monitor_hour_stats.down_count + excluded.down_count,
        pending_count = monitor_hour_stats.pending_count + excluded.pending_count,
        ping_sum = monitor_hour_stats.ping_sum + excluded.ping_sum,
        ping_n = monitor_hour_stats.ping_n + excluded.ping_n
    `;
  } catch (err) {
    console.error("[pulsewatch] hour stats failed", monitor.id, err);
  }
  monitor.fail_streak = decision.nextStreak;
  monitor.confirmed_status = decision.confirmed;
  if (!notify) return null;
  return {
    monitor,
    from: notify === "down" ? "up" : "down",
    to: notify,
    msg: detail,
  };
}

async function pruneHeartbeats(sql: Sql) {
  await sql`
    delete from heartbeats
    where id in (
      select id from (
        select id, row_number() over (partition by monitor_id order by checked_at desc) as rn
        from heartbeats
      ) ranked
      where rn > ${HEARTBEATS_KEPT}
    )
  `;
  await sql`delete from monitor_hour_stats where hour_ts < now() - interval '35 days'`;
}

function hostKey(monitor: MonitorRow): string {
  const host = monitor.hostname?.trim();
  if (host) return host.toLowerCase();
  if (monitor.url) {
    try {
      return new URL(monitor.url).hostname.toLowerCase();
    } catch {
      /* ignore */
    }
  }
  return monitor.id;
}

async function acquireHost(host: string, limit: number): Promise<void> {
  const map = state().hostInFlight!;
  while ((map.get(host) ?? 0) >= limit) {
    await sleep(25);
  }
  map.set(host, (map.get(host) ?? 0) + 1);
}

function releaseHost(host: string): void {
  const map = state().hostInFlight!;
  const n = (map.get(host) ?? 1) - 1;
  if (n <= 0) map.delete(host);
  else map.set(host, n);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  if (items.length === 0) return;
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next;
      next += 1;
      if (i >= items.length) return;
      try {
        await fn(items[i]);
      } catch (err) {
        console.error("[pulsewatch] check worker failed", err);
      }
    }
  });
  await Promise.all(workers);
}

export function startEngine(): void {
  const slot = state();
  if (slot.timer) return;
  void runDueChecks();
  slot.timer = setInterval(() => {
    void runDueChecks();
  }, 5_000);
}

if (typeof window === "undefined" && process.env.PULSEWATCH_SELFHOST === "1") {
  startEngine();
}
