import type { Sql } from "@/lib/db";
import type { ChannelRow, ChannelType, NotifyLogRow } from "@/lib/types";
import { newId } from "@/lib/utils";

type ChannelDb = {
  id: string;
  name: string;
  type: ChannelType;
  config: string;
  active: boolean;
  created_at: string;
};

function parseConfig(raw: string): Record<string, string> {
  try {
    const v = JSON.parse(raw) as Record<string, string>;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export async function listChannels(sql: Sql): Promise<ChannelRow[]> {
  const rows = await sql<ChannelDb>`
    select id, name, type, config, active, created_at
    from notification_channels
    order by name
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    config: redactSecrets(r.type, parseConfig(r.config)),
    active: Boolean(r.active),
    createdAt: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
  }));
}

function redactSecrets(type: ChannelType, config: Record<string, string>): Record<string, string> {
  const next = { ...config };
  if (next.pass) next.pass = "";
  if (type === "telegram" && next.token) next.token = next.token.length > 6 ? `${next.token.slice(0, 4)}…` : "";
  return next;
}

export async function upsertChannel(
  sql: Sql,
  userId: string,
  input: {
    id?: string;
    name: string;
    type: ChannelType;
    config: Record<string, string>;
    active?: boolean;
    applyToAll?: boolean;
  },
): Promise<string> {
  const id = input.id ?? newId();
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  const nextConfig = { ...(input.config ?? {}) };
  if (input.id) {
    const existing = await sql<{ config: string }>`
      select config from notification_channels where id = ${id}
    `;
    const prev = parseConfig(existing[0]?.config ?? "{}");
    if (!nextConfig.pass && prev.pass) nextConfig.pass = prev.pass;
    if (!nextConfig.token && prev.token) nextConfig.token = prev.token;
  }
  const config = JSON.stringify(nextConfig);
  if (input.id) {
    await sql`
      update notification_channels
      set name = ${name}, type = ${input.type}, config = ${config}, active = ${input.active ?? true}
      where id = ${id}
    `;
  } else {
    await sql`
      insert into notification_channels (id, name, type, config, active, created_by)
      values (${id}, ${name}, ${input.type}, ${config}, ${input.active ?? true}, ${userId})
    `;
  }
  if (input.applyToAll) {
    const monitors = await sql<{ id: string }>`select id from monitors`;
    for (const monitor of monitors) {
      await sql`
        insert into monitor_channels (monitor_id, channel_id)
        values (${monitor.id}, ${id})
        on conflict do nothing
      `;
    }
  }
  return id;
}

export async function deleteChannel(sql: Sql, id: string): Promise<void> {
  await sql`delete from notification_channels where id = ${id}`;
}

export async function setMonitorChannels(sql: Sql, monitorId: string, channelIds: string[]): Promise<void> {
  await sql`delete from monitor_channels where monitor_id = ${monitorId}`;
  for (const channelId of channelIds) {
    await sql`
      insert into monitor_channels (monitor_id, channel_id)
      values (${monitorId}, ${channelId})
      on conflict do nothing
    `;
  }
}

export async function getMonitorChannelIds(sql: Sql, monitorId: string): Promise<string[]> {
  const rows = await sql<{ channel_id: string }>`
    select channel_id from monitor_channels where monitor_id = ${monitorId}
  `;
  return rows.map((r) => r.channel_id);
}

export async function listNotifyLog(sql: Sql, limit = 40): Promise<NotifyLogRow[]> {
  const rows = await sql<{
    id: number;
    event: string;
    detail: string | null;
    ok: boolean;
    created_at: string;
    monitor_name: string | null;
    channel_name: string | null;
  }>`
    select
      l.id, l.event, l.detail, l.ok, l.created_at,
      m.name as monitor_name,
      c.name as channel_name
    from notification_log l
    left join monitors m on m.id = l.monitor_id
    left join notification_channels c on c.id = l.channel_id
    order by l.created_at desc
    limit ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    event: r.event,
    detail: r.detail,
    ok: Boolean(r.ok),
    createdAt: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
    monitorName: r.monitor_name,
    channelName: r.channel_name,
  }));
}
