import type { Sql } from "@/lib/db";
import type { Beat, HeartbeatStatus, MonitorSummary, MonitorType } from "@/lib/types";
import { newId } from "@/lib/utils";
import { assertSafeTargetInput } from "@/lib/monitor/safe-target";

type MonitorRow = {
  id: string;
  name: string;
  type: MonitorType;
  url: string | null;
  hostname: string | null;
  port: number | null;
  method: string;
  interval_sec: number;
  timeout_sec: number;
  accepted_status: string;
  keyword: string | null;
  keyword_invert: boolean;
  dns_record_type: string;
  tags: string;
  active: boolean;
  max_retries: number;
  retry_interval_sec: number;
  fail_streak: number;
  last_checked_at: string | Date | null;
  last_status: HeartbeatStatus | null;
  last_ping: number | null;
  last_msg: string | null;
  resend_interval_sec: number;
};

type BeatRow = {
  monitor_id: string;
  status: HeartbeatStatus;
  ping: number | null;
  msg: string | null;
  checked_at: string;
};

function toIso(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  return v.toISOString();
}

function toSummary(m: MonitorRow, recent: Beat[], st?: { uptime_24h: number | null; uptime_30d: number | null }): MonitorSummary {
  const latest = recent[recent.length - 1];
  const storedStatus = m.last_status === "up" || m.last_status === "down" || m.last_status === "pending" ? m.last_status : null;
  return {
    id: m.id,
    name: m.name,
    type: m.type,
    url: m.url,
    hostname: m.hostname,
    port: m.port,
    method: m.method,
    intervalSec: m.interval_sec,
    timeoutSec: m.timeout_sec,
    acceptedStatus: m.accepted_status,
    keyword: m.keyword,
    keywordInvert: Boolean(m.keyword_invert),
    dnsRecordType: m.dns_record_type,
    tags: m.tags ?? "",
    active: Boolean(m.active),
    maxRetries: Number(m.max_retries ?? 2),
    retryIntervalSec: Number(m.retry_interval_sec ?? 20),
    resendIntervalSec: Number(m.resend_interval_sec ?? 0),
    failStreak: Number(m.fail_streak ?? 0),
    lastStatus: m.active ? (storedStatus ?? latest?.status ?? "pending") : "paused",
    lastPing: m.last_ping ?? latest?.ping ?? null,
    lastMsg: m.last_msg ?? latest?.msg ?? null,
    lastCheckedAt: toIso(m.last_checked_at) ?? latest?.checkedAt ?? null,
    uptime24h: st?.uptime_24h ?? null,
    uptime30d: st?.uptime_30d ?? null,
    beats: recent,
  };
}

export async function listMonitorSummaries(sql: Sql): Promise<MonitorSummary[]> {
  const monitors = await sql<MonitorRow>`
    select id, name, type, url, hostname, port, method, interval_sec, timeout_sec,
           accepted_status, keyword, keyword_invert, dns_record_type, tags, active,
           max_retries, retry_interval_sec, resend_interval_sec, fail_streak, last_checked_at, last_status,
           last_ping, last_msg
    from monitors
    order by name asc
  `;
  if (monitors.length === 0) return [];

  const beats = await sql<BeatRow>`
    select monitor_id, status, ping, msg, checked_at from (
      select h.monitor_id, h.status, h.ping, h.msg, h.checked_at,
             row_number() over (partition by h.monitor_id order by h.checked_at desc) as rn
      from heartbeats h
      where h.checked_at > now() - interval '2 hours'
    ) ranked
    where rn <= 24
  `;

  const stats = await sql<{ monitor_id: string; uptime_24h: number | null; uptime_30d: number | null }>`
    select
      monitor_id,
      (sum(up_count) filter (where hour_ts >= now() - interval '24 hours') * 100.0
        / nullif(sum(up_count + down_count) filter (where hour_ts >= now() - interval '24 hours'), 0))::float as uptime_24h,
      (sum(up_count) * 100.0 / nullif(sum(up_count + down_count), 0))::float as uptime_30d
    from monitor_hour_stats
    where hour_ts >= now() - interval '30 days'
    group by monitor_id
  `;
  const statsMap = new Map(stats.map((s) => [s.monitor_id, s]));
  const beatMap = new Map<string, Beat[]>();
  for (const b of beats) {
    const list = beatMap.get(b.monitor_id) ?? [];
    list.push({
      status: b.status,
      ping: b.ping,
      msg: null,
      checkedAt: toIso(b.checked_at) ?? new Date().toISOString(),
    });
    beatMap.set(b.monitor_id, list);
  }

  return monitors.map((m) => {
    const recent = (beatMap.get(m.id) ?? []).slice().reverse();
    return toSummary(m, recent, statsMap.get(m.id));
  });
}

export async function getMonitor(sql: Sql, id: string): Promise<MonitorSummary | null> {
  const monitors = await sql<MonitorRow>`
    select id, name, type, url, hostname, port, method, interval_sec, timeout_sec,
           accepted_status, keyword, keyword_invert, dns_record_type, tags, active,
           max_retries, retry_interval_sec, resend_interval_sec, fail_streak, last_checked_at, last_status,
           last_ping, last_msg
    from monitors
    where id = ${id}
  `;
  const m = monitors[0];
  if (!m) return null;
  const beats = await sql<BeatRow>`
    select monitor_id, status, ping, msg, checked_at
    from heartbeats
    where monitor_id = ${id}
    order by checked_at desc
    limit 100
  `;
  const stats = await sql<{ uptime_24h: number | null; uptime_30d: number | null }>`
    select
      (sum(up_count) filter (where hour_ts >= now() - interval '24 hours') * 100.0
        / nullif(sum(up_count + down_count) filter (where hour_ts >= now() - interval '24 hours'), 0))::float as uptime_24h,
      (sum(up_count) * 100.0 / nullif(sum(up_count + down_count), 0))::float as uptime_30d
    from monitor_hour_stats
    where monitor_id = ${id} and hour_ts >= now() - interval '30 days'
  `;
  const recent = beats
    .slice()
    .reverse()
    .map((b) => ({
      status: b.status,
      ping: b.ping,
      msg: b.msg,
      checkedAt: toIso(b.checked_at) ?? new Date().toISOString(),
    }));
  return toSummary(m, recent, stats[0]);
}

export async function upsertMonitor(
  sql: Sql,
  userId: string,
  input: {
    id?: string;
    name: string;
    type: MonitorType;
    url?: string;
    method?: string;
    keyword?: string;
    keywordInvert?: boolean;
    hostname?: string;
    port?: number;
    dnsRecordType?: string;
    intervalSec: number;
    timeoutSec: number;
    acceptedStatus?: string;
    tags?: string;
    active?: boolean;
    maxRetries?: number;
    retryIntervalSec?: number;
    resendIntervalSec?: number;
  },
): Promise<string> {
  const id = input.id ?? newId();
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  assertSafeTargetInput({
    type: input.type,
    url: input.url,
    hostname: input.hostname,
  });
  const maxRetries = Math.max(0, Math.min(10, Math.floor(input.maxRetries ?? 2)));
  const retryIntervalSec = Math.max(5, Math.min(300, Math.floor(input.retryIntervalSec ?? 20)));
  const resendIntervalSec = Math.max(0, Math.min(86_400, Math.floor(input.resendIntervalSec ?? 0)));
  if (input.id) {
    await sql`
      update monitors set
        name = ${name},
        type = ${input.type},
        url = ${input.url?.trim() || null},
        method = ${input.method || "GET"},
        keyword = ${input.keyword?.trim() || null},
        keyword_invert = ${Boolean(input.keywordInvert)},
        hostname = ${input.hostname?.trim() || null},
        port = ${input.port ?? null},
        dns_record_type = ${input.dnsRecordType || "A"},
        interval_sec = ${input.intervalSec},
        timeout_sec = ${input.timeoutSec},
        accepted_status = ${input.acceptedStatus || "200-299"},
        tags = ${input.tags ?? ""},
        active = ${input.active ?? true},
        max_retries = ${maxRetries},
        retry_interval_sec = ${retryIntervalSec},
        resend_interval_sec = ${resendIntervalSec},
        updated_at = now()
      where id = ${id}
    `;
  } else {
    await sql`
      insert into monitors (
        id, name, type, url, method, keyword, keyword_invert, hostname, port,
        dns_record_type, interval_sec, timeout_sec, accepted_status, tags, active,
        max_retries, retry_interval_sec, resend_interval_sec, created_by
      ) values (
        ${id}, ${name}, ${input.type}, ${input.url?.trim() || null}, ${input.method || "GET"},
        ${input.keyword?.trim() || null}, ${Boolean(input.keywordInvert)},
        ${input.hostname?.trim() || null}, ${input.port ?? null}, ${input.dnsRecordType || "A"},
        ${input.intervalSec}, ${input.timeoutSec}, ${input.acceptedStatus || "200-299"},
        ${input.tags ?? ""}, ${input.active ?? true}, ${maxRetries}, ${retryIntervalSec},
        ${resendIntervalSec}, ${userId}
      )
    `;
  }
  return id;
}

export async function deleteMonitor(sql: Sql, id: string): Promise<void> {
  await sql`delete from monitors where id = ${id}`;
}

export async function setMonitorActive(sql: Sql, id: string, active: boolean): Promise<void> {
  await sql`update monitors set active = ${active}, updated_at = now() where id = ${id}`;
}

export async function listHeartbeats(sql: Sql, monitorId: string, limit = 200): Promise<Beat[]> {
  const rows = await sql<BeatRow>`
    select monitor_id, status, ping, msg, checked_at
    from heartbeats
    where monitor_id = ${monitorId}
    order by checked_at desc
    limit ${limit}
  `;
  return rows.map((b) => ({
    status: b.status,
    ping: b.ping,
    msg: b.msg,
    checkedAt: toIso(b.checked_at) ?? new Date().toISOString(),
  }));
}
