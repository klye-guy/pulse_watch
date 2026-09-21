import type { Sql } from "@/lib/db";
import {
  BACKUP_KIND,
  BACKUP_VERSION,
  type BackupChannel,
  type BackupFile,
  type BackupMode,
  type BackupMonitor,
  type BackupStatusPage,
  type BackupUser,
  type RestoreResult,
} from "@/lib/backup-format";
import type { ChannelType, MonitorType, Role } from "@/lib/types";
import { ROLE_RANK } from "@/lib/types";
import { newId } from "@/lib/utils";

export type { BackupFile, BackupMode, RestoreResult } from "@/lib/backup-format";
export { parseBackup } from "@/lib/backup-format";

export async function exportBackup(sql: Sql): Promise<BackupFile> {
  const siteRows = await sql<{ value: string }>`select value from site_settings where key = 'site_name'`;
  const memberRows = await sql<{
    email: string;
    name: string;
    role: Role;
    password: string | null;
  }>`
    select
      u.email,
      u.name,
      m.role,
      (
        select a.password from account a
        where a."userId" = m.user_id and a."providerId" = 'credential'
        limit 1
      ) as password
    from members m
    join "user" u on u.id = m.user_id
    order by u.email
  `;
  const channelRows = await sql<{
    id: string;
    name: string;
    type: ChannelType;
    config: string;
    active: boolean;
  }>`
    select id, name, type, config, active from notification_channels order by name
  `;
  const monitorRows = await sql<{
    id: string;
    name: string;
    type: MonitorType;
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
    tags: string;
    active: boolean;
    max_retries: number;
    retry_interval_sec: number;
    resend_interval_sec: number;
  }>`
    select id, name, type, url, method, keyword, keyword_invert, hostname, port,
           dns_record_type, interval_sec, timeout_sec, accepted_status, tags, active,
           max_retries, retry_interval_sec, resend_interval_sec
    from monitors
    order by name
  `;
  const links = await sql<{ monitor_id: string; channel_id: string }>`
    select monitor_id, channel_id from monitor_channels
  `;
  const channelMap = new Map<string, string[]>();
  for (const link of links) {
    const list = channelMap.get(link.monitor_id) ?? [];
    list.push(link.channel_id);
    channelMap.set(link.monitor_id, list);
  }
  const pageRows = await sql<{
    id: string;
    slug: string;
    title: string;
    description: string;
    published: boolean;
  }>`
    select id, slug, title, description, published from status_pages order by title
  `;
  const pageLinks = await sql<{ page_id: string; monitor_id: string }>`
    select page_id, monitor_id from status_page_monitors order by sort_order
  `;
  const pageMap = new Map<string, string[]>();
  for (const link of pageLinks) {
    const list = pageMap.get(link.page_id) ?? [];
    list.push(link.monitor_id);
    pageMap.set(link.page_id, list);
  }

  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    site: { name: siteRows[0]?.value ?? "Pulsewatch" },
    users: memberRows.map((u) => ({
      email: u.email,
      name: u.name,
      role: u.role,
      passwordHash: u.password,
    })),
    channels: channelRows.map((c) => {
      let config: Record<string, string> = {};
      try {
        const parsed = JSON.parse(c.config) as Record<string, string>;
        if (parsed && typeof parsed === "object") config = parsed;
      } catch {
        config = {};
      }
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        config,
        active: Boolean(c.active),
      };
    }),
    monitors: monitorRows.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      url: m.url,
      method: m.method,
      keyword: m.keyword,
      keywordInvert: Boolean(m.keyword_invert),
      hostname: m.hostname,
      port: m.port,
      dnsRecordType: m.dns_record_type,
      intervalSec: Number(m.interval_sec),
      timeoutSec: Number(m.timeout_sec),
      acceptedStatus: m.accepted_status,
      tags: m.tags ?? "",
      active: Boolean(m.active),
      maxRetries: Number(m.max_retries ?? 2),
      retryIntervalSec: Number(m.retry_interval_sec ?? 20),
      resendIntervalSec: Number(m.resend_interval_sec ?? 0),
      channelIds: channelMap.get(m.id) ?? [],
    })),
    statusPages: pageRows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      published: Boolean(p.published),
      monitorIds: pageMap.get(p.id) ?? [],
    })),
  };
}

export async function restoreBackup(
  sql: Sql,
  backup: BackupFile,
  opts: { mode: BackupMode; actorId: string; actorEmail: string | null },
): Promise<RestoreResult> {
  const siteName = backup.site.name.trim() || "Pulsewatch";
  await sql`
    insert into site_settings (key, value) values ('site_name', ${siteName})
    on conflict (key) do update set value = excluded.value
  `;

  const userCount = await restoreUsers(sql, backup.users, opts.actorId, opts.actorEmail);

  if (opts.mode === "replace") {
    await sql`delete from status_page_monitors`;
    await sql`delete from status_pages`;
    await sql`delete from monitor_channels`;
    await sql`delete from monitors`;
    await sql`delete from notification_channels`;
  }

  for (const channel of backup.channels) {
    await upsertChannel(sql, opts.actorId, channel);
  }

  const monitorIds = new Set<string>();
  for (const monitor of backup.monitors) {
    await upsertMonitorRow(sql, opts.actorId, monitor);
    monitorIds.add(monitor.id);
    await sql`delete from monitor_channels where monitor_id = ${monitor.id}`;
    for (const channelId of monitor.channelIds) {
      const exists = await sql<{ id: string }>`select id from notification_channels where id = ${channelId}`;
      if (!exists[0]) continue;
      await sql`
        insert into monitor_channels (monitor_id, channel_id)
        values (${monitor.id}, ${channelId})
        on conflict do nothing
      `;
    }
  }

  for (const page of backup.statusPages) {
    await upsertPageRow(sql, opts.actorId, page, monitorIds);
  }

  return {
    mode: opts.mode,
    users: userCount,
    monitors: backup.monitors.length,
    channels: backup.channels.length,
    statusPages: backup.statusPages.length,
  };
}

async function restoreUsers(
  sql: Sql,
  users: BackupUser[],
  actorId: string,
  actorEmail: string | null,
): Promise<number> {
  let count = 0;
  for (const user of users) {
    const email = user.email.trim().toLowerCase();
    const name = user.name.trim() || email.split("@")[0] || "User";
    const existing = await sql<{ id: string }>`select id from "user" where email = ${email}`;
    let userId = existing[0]?.id;
    const now = new Date().toISOString();
    if (!userId) {
      userId = newId();
      await sql`
        insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
        values (${userId}, ${name}, ${email}, true, ${now}, ${now})
      `;
    } else {
      await sql`update "user" set name = ${name}, "updatedAt" = ${now} where id = ${userId}`;
    }

    if (user.passwordHash) {
      const acc = await sql<{ id: string }>`
        select id from account where "userId" = ${userId} and "providerId" = 'credential'
      `;
      if (acc[0]) {
        await sql`
          update account set password = ${user.passwordHash}, "updatedAt" = ${now}
          where id = ${acc[0].id}
        `;
      } else {
        await sql`
          insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
          values (${newId()}, ${userId}, 'credential', ${userId}, ${user.passwordHash}, ${now}, ${now})
        `;
      }
    }

    let role = user.role;
    if (actorEmail && email === actorEmail.toLowerCase()) {
      const current = await sql<{ role: Role }>`select role from members where user_id = ${actorId}`;
      const currentRole = current[0]?.role;
      if (currentRole && ROLE_RANK[currentRole] > ROLE_RANK[role]) role = currentRole;
    }
    if (role !== "owner") {
      const target = await sql<{ role: Role }>`select role from members where user_id = ${userId}`;
      if (target[0]?.role === "owner") {
        const owners = await sql<{ n: number }>`select count(*)::int as n from members where role = 'owner'`;
        if (Number(owners[0]?.n ?? 0) <= 1) role = "owner";
      }
    }

    await sql`
      insert into members (user_id, role, created_by)
      values (${userId}, ${role}, ${actorId})
      on conflict (user_id) do update set role = excluded.role
    `;
    count += 1;
  }
  return count;
}

async function upsertChannel(sql: Sql, actorId: string, channel: BackupChannel): Promise<void> {
  const config = JSON.stringify(channel.config ?? {});
  await sql`
    insert into notification_channels (id, name, type, config, active, created_by)
    values (${channel.id}, ${channel.name}, ${channel.type}, ${config}, ${channel.active}, ${actorId})
    on conflict (id) do update set
      name = excluded.name,
      type = excluded.type,
      config = excluded.config,
      active = excluded.active
  `;
}

async function upsertMonitorRow(sql: Sql, actorId: string, monitor: BackupMonitor): Promise<void> {
  await sql`
    insert into monitors (
      id, name, type, url, method, keyword, keyword_invert, hostname, port,
      dns_record_type, interval_sec, timeout_sec, accepted_status, tags, active,
      max_retries, retry_interval_sec, resend_interval_sec, created_by, updated_at
    ) values (
      ${monitor.id}, ${monitor.name}, ${monitor.type}, ${monitor.url}, ${monitor.method},
      ${monitor.keyword}, ${monitor.keywordInvert}, ${monitor.hostname}, ${monitor.port},
      ${monitor.dnsRecordType}, ${monitor.intervalSec}, ${monitor.timeoutSec},
      ${monitor.acceptedStatus}, ${monitor.tags}, ${monitor.active},
      ${monitor.maxRetries}, ${monitor.retryIntervalSec}, ${monitor.resendIntervalSec ?? 0}, ${actorId}, now()
    )
    on conflict (id) do update set
      name = excluded.name,
      type = excluded.type,
      url = excluded.url,
      method = excluded.method,
      keyword = excluded.keyword,
      keyword_invert = excluded.keyword_invert,
      hostname = excluded.hostname,
      port = excluded.port,
      dns_record_type = excluded.dns_record_type,
      interval_sec = excluded.interval_sec,
      timeout_sec = excluded.timeout_sec,
      accepted_status = excluded.accepted_status,
      tags = excluded.tags,
      active = excluded.active,
      max_retries = excluded.max_retries,
      retry_interval_sec = excluded.retry_interval_sec,
      resend_interval_sec = excluded.resend_interval_sec,
      updated_at = now()
  `;
}

async function upsertPageRow(
  sql: Sql,
  actorId: string,
  page: BackupStatusPage,
  knownMonitors: Set<string>,
): Promise<void> {
  const bySlug = await sql<{ id: string }>`select id from status_pages where slug = ${page.slug}`;
  const id = bySlug[0]?.id && bySlug[0].id !== page.id ? bySlug[0].id : page.id;
  const existing = await sql<{ id: string }>`select id from status_pages where id = ${id}`;
  if (existing[0]) {
    await sql`
      update status_pages
      set slug = ${page.slug}, title = ${page.title}, description = ${page.description}, published = ${page.published}
      where id = ${id}
    `;
  } else {
    await sql`
      insert into status_pages (id, slug, title, description, published, created_by)
      values (${id}, ${page.slug}, ${page.title}, ${page.description}, ${page.published}, ${actorId})
    `;
  }
  await sql`delete from status_page_monitors where page_id = ${id}`;
  for (let i = 0; i < page.monitorIds.length; i += 1) {
    const monitorId = page.monitorIds[i];
    if (!knownMonitors.has(monitorId)) {
      const exists = await sql<{ id: string }>`select id from monitors where id = ${monitorId}`;
      if (!exists[0]) continue;
    }
    await sql`
      insert into status_page_monitors (page_id, monitor_id, sort_order)
      values (${id}, ${monitorId}, ${i})
      on conflict do nothing
    `;
  }
}

