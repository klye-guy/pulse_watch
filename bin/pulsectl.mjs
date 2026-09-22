#!/usr/bin/env node
/**
 * Pulsewatch CLI — manage established users against the same Postgres
 * the web UI uses. Reads DATABASE_URL from the environment or
 * /etc/pulsewatch/pulsewatch.env.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(join(rootDir, "node_modules", "pg"))) {
  console.error("pulsectl: the Node 'pg' package is not installed. First-boot setup did not finish.");
  console.error("On Rocky/RHEL, PostgreSQL is usually not initialized yet. Run:");
  console.error("  sudo dnf install -y postgresql-server postgresql");
  console.error("  sudo bash /opt/pulsewatch/packaging/linux/configure-instance.sh");
  console.error("Log: sudo tail -n 80 /var/log/pulsewatch-install.log");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const pg = require("pg");
const { hashPassword } = await import("better-auth/crypto");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile("/etc/pulsewatch/pulsewatch.env");
loadEnvFile(new URL("../.pulsewatch.env", import.meta.url).pathname);

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("pulsectl: DATABASE_URL is not set (expected in /etc/pulsewatch/pulsewatch.env)");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });
const newId = () => randomUUID().replaceAll("-", "");

function usage() {
  console.log(`Pulsewatch CLI

Usage:
  pulsectl user add <email> [--name NAME] [--password PASS] [--role ROLE]
  pulsectl user list
  pulsectl user role <email> <owner|admin|editor|viewer>
  pulsectl user passwd <email> [--password PASS]
  pulsectl user delete <email>
  pulsectl backup [file]
  pulsectl restore <file> [--replace]
  pulsectl status

Roles: owner, admin, editor, viewer

Backup is a JSON file of users, monitors, notification channels, status pages,
and the instance name. Restore merges by default. --replace wipes monitors,
channels, and status pages first. Users are always merged.
`);
}

function arg(flag, argv) {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  return argv[i + 1];
}

async function promptHidden(label) {
  const rl = createInterface({ input, output });
  const pass = await rl.question(label);
  rl.close();
  return pass;
}

async function findUser(email) {
  const { rows } = await pool.query(`select id, name, email from "user" where email = $1`, [
    email.toLowerCase(),
  ]);
  return rows[0] ?? null;
}

async function cmdUserAdd(email, argv) {
  if (!email) throw new Error("email required");
  const name = arg("--name", argv) || email.split("@")[0];
  let password = arg("--password", argv);
  const role = arg("--role", argv) || "editor";
  if (!["owner", "admin", "editor", "viewer"].includes(role)) {
    throw new Error("role must be owner, admin, editor, or viewer");
  }
  if (!password) password = await promptHidden("Password (min 8): ");
  if (!password || password.length < 8) throw new Error("password must be at least 8 characters");

  const existing = await findUser(email);
  let userId = existing?.id;
  const now = new Date();
  if (!userId) {
    userId = newId();
    await pool.query(
      `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       values ($1, $2, $3, true, $4, $4)`,
      [userId, name, email.toLowerCase(), now],
    );
    const hash = await hashPassword(password);
    await pool.query(
      `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       values ($1, $2, 'credential', $2, $3, $4, $4)`,
      [newId(), userId, hash, now],
    );
  } else {
    const hash = await hashPassword(password);
    const acc = await pool.query(
      `select id from account where "userId" = $1 and "providerId" = 'credential'`,
      [userId],
    );
    if (acc.rows[0]) {
      await pool.query(`update account set password = $1, "updatedAt" = $2 where id = $3`, [
        hash,
        now,
        acc.rows[0].id,
      ]);
    } else {
      await pool.query(
        `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         values ($1, $2, 'credential', $2, $3, $4, $4)`,
        [newId(), userId, hash, now],
      );
    }
  }
  await pool.query(
    `insert into members (user_id, role, created_by) values ($1, $2, $1)
     on conflict (user_id) do update set role = excluded.role`,
    [userId, role],
  );
  console.log(`added ${email.toLowerCase()} as ${role}`);
}

async function cmdUserList() {
  const { rows } = await pool.query(
    `select u.email, u.name, m.role, m.created_at
     from members m join "user" u on u.id = m.user_id
     order by m.role, u.email`,
  );
  if (rows.length === 0) {
    console.log("(no members)");
    return;
  }
  for (const row of rows) {
    console.log(`${row.role.padEnd(8)} ${row.email.padEnd(32)} ${row.name}`);
  }
}

async function cmdUserRole(email, role) {
  if (!["owner", "admin", "editor", "viewer"].includes(role)) {
    throw new Error("invalid role");
  }
  const user = await findUser(email);
  if (!user) throw new Error("user not found");
  const { rowCount } = await pool.query(`update members set role = $1 where user_id = $2`, [
    role,
    user.id,
  ]);
  if (!rowCount) throw new Error("user is not a member");
  console.log(`${email} → ${role}`);
}

async function cmdUserPasswd(email, argv) {
  const user = await findUser(email);
  if (!user) throw new Error("user not found");
  let password = arg("--password", argv);
  if (!password) password = await promptHidden("New password: ");
  if (!password || password.length < 8) throw new Error("password must be at least 8 characters");
  const hash = await hashPassword(password);
  const now = new Date();
  const acc = await pool.query(
    `select id from account where "userId" = $1 and "providerId" = 'credential'`,
    [user.id],
  );
  if (acc.rows[0]) {
    await pool.query(`update account set password = $1, "updatedAt" = $2 where id = $3`, [
      hash,
      now,
      acc.rows[0].id,
    ]);
  } else {
    await pool.query(
      `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       values ($1, $2, 'credential', $2, $3, $4, $4)`,
      [newId(), user.id, hash, now],
    );
  }
  console.log(`password updated for ${email}`);
}

async function cmdUserDelete(email) {
  const user = await findUser(email);
  if (!user) throw new Error("user not found");
  const mem = await pool.query(`select role from members where user_id = $1`, [user.id]);
  if (mem.rows[0]?.role === "owner") {
    const owners = await pool.query(`select count(*)::int as n from members where role = 'owner'`);
    if (owners.rows[0].n <= 1) throw new Error("refusing to delete the last owner");
  }
  await pool.query(`delete from members where user_id = $1`, [user.id]);
  console.log(`removed ${email} from Pulsewatch`);
}

async function cmdStatus() {
  const monitors = await pool.query(
    `select m.name, m.type, m.active,
            (select h.status from heartbeats h where h.monitor_id = m.id order by checked_at desc limit 1) as status
     from monitors m order by name`,
  );
  for (const row of monitors.rows) {
    const st = row.active ? row.status || "pending" : "paused";
    console.log(`${String(st).padEnd(8)} ${row.type.padEnd(8)} ${row.name}`);
  }
}

const BACKUP_KIND = "pulsewatch.backup";
const BACKUP_VERSION = 1;
const ROLES = new Set(["owner", "admin", "editor", "viewer"]);
const MONITOR_TYPES = new Set(["http", "keyword", "tcp", "ping", "dns"]);
const CHANNEL_TYPES = new Set(["webhook", "discord", "slack", "telegram", "email"]);

function asRecord(v, label) {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(`${label} is invalid`);
  return v;
}
function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function asString(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function asBool(v, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}
function asNum(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asIdList(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.length > 0);
}

function parseBackup(raw) {
  const o = asRecord(raw, "Backup file");
  if (o.kind !== BACKUP_KIND) throw new Error("Not a Pulsewatch backup file");
  if (o.version !== BACKUP_VERSION) throw new Error(`Unsupported backup version: ${String(o.version)}`);
  const site = o.site && typeof o.site === "object" ? o.site : {};
  const users = [];
  for (const item of asArray(o.users)) {
    const u = asRecord(item, "User");
    const email = asString(u.email).trim().toLowerCase();
    if (!email.includes("@")) continue;
    users.push({
      email,
      name: asString(u.name).trim() || email.split("@")[0] || "User",
      role: ROLES.has(u.role) ? u.role : "viewer",
      passwordHash: typeof u.passwordHash === "string" && u.passwordHash.length > 0 ? u.passwordHash : null,
    });
  }
  const channels = [];
  for (const item of asArray(o.channels)) {
    const c = asRecord(item, "Channel");
    const id = asString(c.id).trim();
    const name = asString(c.name).trim();
    if (!id || !name) continue;
    const config =
      c.config && typeof c.config === "object" && !Array.isArray(c.config)
        ? Object.fromEntries(Object.entries(c.config).filter(([, val]) => typeof val === "string"))
        : {};
    channels.push({
      id,
      name,
      type: CHANNEL_TYPES.has(c.type) ? c.type : "webhook",
      config,
      active: asBool(c.active, true),
    });
  }
  const monitors = [];
  for (const item of asArray(o.monitors)) {
    const m = asRecord(item, "Monitor");
    const id = asString(m.id).trim();
    const name = asString(m.name).trim();
    if (!id || !name) continue;
    monitors.push({
      id,
      name,
      type: MONITOR_TYPES.has(m.type) ? m.type : "http",
      url: asString(m.url).trim() || null,
      method: asString(m.method, "GET") || "GET",
      keyword: asString(m.keyword).trim() || null,
      keywordInvert: asBool(m.keywordInvert),
      hostname: asString(m.hostname).trim() || null,
      port: m.port == null ? null : asNum(m.port, 0) || null,
      dnsRecordType: asString(m.dnsRecordType, "A") || "A",
      intervalSec: asNum(m.intervalSec, 60),
      timeoutSec: asNum(m.timeoutSec, 16),
      acceptedStatus: asString(m.acceptedStatus, "200-299") || "200-299",
      tags: asString(m.tags),
      active: asBool(m.active, true),
      maxRetries: asNum(m.maxRetries, 2),
      retryIntervalSec: asNum(m.retryIntervalSec, 20),
      resendIntervalSec: asNum(m.resendIntervalSec, 0),
      channelIds: asIdList(m.channelIds),
    });
  }
  const statusPages = [];
  for (const item of asArray(o.statusPages)) {
    const p = asRecord(item, "Status page");
    const id = asString(p.id).trim();
    const slug = asString(p.slug)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    const title = asString(p.title).trim();
    if (!id || !slug || !title) continue;
    statusPages.push({
      id,
      slug,
      title,
      description: asString(p.description),
      published: asBool(p.published, true),
      monitorIds: asIdList(p.monitorIds),
    });
  }
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: asString(o.exportedAt, new Date().toISOString()),
    site: { name: asString(site.name).trim() || "Pulsewatch" },
    users,
    channels,
    monitors,
    statusPages,
  };
}

async function exportBackup() {
  const site = await pool.query(`select value from site_settings where key = 'site_name'`);
  const members = await pool.query(
    `select u.email, u.name, m.role,
            (select a.password from account a
             where a."userId" = m.user_id and a."providerId" = 'credential' limit 1) as password
     from members m join "user" u on u.id = m.user_id
     order by u.email`,
  );
  const channels = await pool.query(
    `select id, name, type, config, active from notification_channels order by name`,
  );
  const monitors = await pool.query(
    `select id, name, type, url, method, keyword, keyword_invert, hostname, port,
            dns_record_type, interval_sec, timeout_sec, accepted_status, tags, active,
            max_retries, retry_interval_sec, resend_interval_sec
     from monitors order by name`,
  );
  const links = await pool.query(`select monitor_id, channel_id from monitor_channels`);
  const channelMap = new Map();
  for (const link of links.rows) {
    const list = channelMap.get(link.monitor_id) ?? [];
    list.push(link.channel_id);
    channelMap.set(link.monitor_id, list);
  }
  const pages = await pool.query(
    `select id, slug, title, description, published from status_pages order by title`,
  );
  const pageLinks = await pool.query(
    `select page_id, monitor_id from status_page_monitors order by sort_order`,
  );
  const pageMap = new Map();
  for (const link of pageLinks.rows) {
    const list = pageMap.get(link.page_id) ?? [];
    list.push(link.monitor_id);
    pageMap.set(link.page_id, list);
  }
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    site: { name: site.rows[0]?.value ?? "Pulsewatch" },
    users: members.rows.map((u) => ({
      email: u.email,
      name: u.name,
      role: u.role,
      passwordHash: u.password ?? null,
    })),
    channels: channels.rows.map((c) => {
      let config = {};
      try {
        const parsed = JSON.parse(c.config);
        if (parsed && typeof parsed === "object") config = parsed;
      } catch {
        config = {};
      }
      return { id: c.id, name: c.name, type: c.type, config, active: Boolean(c.active) };
    }),
    monitors: monitors.rows.map((m) => ({
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
    statusPages: pages.rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      published: Boolean(p.published),
      monitorIds: pageMap.get(p.id) ?? [],
    })),
  };
}

async function restoreBackup(backup, replace) {
  const siteName = backup.site.name.trim() || "Pulsewatch";
  await pool.query(
    `insert into site_settings (key, value) values ('site_name', $1)
     on conflict (key) do update set value = excluded.value`,
    [siteName],
  );

  for (const user of backup.users) {
    const existing = await findUser(user.email);
    let userId = existing?.id;
    const now = new Date();
    if (!userId) {
      userId = newId();
      await pool.query(
        `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         values ($1, $2, $3, true, $4, $4)`,
        [userId, user.name, user.email, now],
      );
    } else {
      await pool.query(`update "user" set name = $1, "updatedAt" = $2 where id = $3`, [
        user.name,
        now,
        userId,
      ]);
    }
    if (user.passwordHash) {
      const acc = await pool.query(
        `select id from account where "userId" = $1 and "providerId" = 'credential'`,
        [userId],
      );
      if (acc.rows[0]) {
        await pool.query(`update account set password = $1, "updatedAt" = $2 where id = $3`, [
          user.passwordHash,
          now,
          acc.rows[0].id,
        ]);
      } else {
        await pool.query(
          `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
           values ($1, $2, 'credential', $2, $3, $4, $4)`,
          [newId(), userId, user.passwordHash, now],
        );
      }
    }
    let role = user.role;
    if (role !== "owner") {
      const mem = await pool.query(`select role from members where user_id = $1`, [userId]);
      if (mem.rows[0]?.role === "owner") {
        const owners = await pool.query(`select count(*)::int as n from members where role = 'owner'`);
        if (Number(owners.rows[0]?.n ?? 0) <= 1) role = "owner";
      }
    }
    await pool.query(
      `insert into members (user_id, role, created_by) values ($1, $2, $1)
       on conflict (user_id) do update set role = excluded.role`,
      [userId, role],
    );
  }

  if (replace) {
    await pool.query(`delete from status_page_monitors`);
    await pool.query(`delete from status_pages`);
    await pool.query(`delete from monitor_channels`);
    await pool.query(`delete from monitors`);
    await pool.query(`delete from notification_channels`);
  }

  const actor = await pool.query(`select user_id from members where role = 'owner' limit 1`);
  const actorId = actor.rows[0]?.user_id ?? newId();

  for (const channel of backup.channels) {
    await pool.query(
      `insert into notification_channels (id, name, type, config, active, created_by)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         name = excluded.name, type = excluded.type, config = excluded.config, active = excluded.active`,
      [channel.id, channel.name, channel.type, JSON.stringify(channel.config ?? {}), channel.active, actorId],
    );
  }

  const knownMonitors = new Set(backup.monitors.map((m) => m.id));
  for (const monitor of backup.monitors) {
    await pool.query(
      `insert into monitors (
         id, name, type, url, method, keyword, keyword_invert, hostname, port,
         dns_record_type, interval_sec, timeout_sec, accepted_status, tags, active,
         max_retries, retry_interval_sec, resend_interval_sec, created_by, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, now())
       on conflict (id) do update set
         name = excluded.name, type = excluded.type, url = excluded.url, method = excluded.method,
         keyword = excluded.keyword, keyword_invert = excluded.keyword_invert, hostname = excluded.hostname,
         port = excluded.port, dns_record_type = excluded.dns_record_type, interval_sec = excluded.interval_sec,
         timeout_sec = excluded.timeout_sec, accepted_status = excluded.accepted_status, tags = excluded.tags,
         active = excluded.active, max_retries = excluded.max_retries,
         retry_interval_sec = excluded.retry_interval_sec,
         resend_interval_sec = excluded.resend_interval_sec, updated_at = now()`,
      [
        monitor.id,
        monitor.name,
        monitor.type,
        monitor.url,
        monitor.method,
        monitor.keyword,
        monitor.keywordInvert,
        monitor.hostname,
        monitor.port,
        monitor.dnsRecordType,
        monitor.intervalSec,
        monitor.timeoutSec,
        monitor.acceptedStatus,
        monitor.tags,
        monitor.active,
        monitor.maxRetries ?? 2,
        monitor.retryIntervalSec ?? 20,
        monitor.resendIntervalSec ?? 0,
        actorId,
      ],
    );
    await pool.query(`delete from monitor_channels where monitor_id = $1`, [monitor.id]);
    for (const channelId of monitor.channelIds) {
      const exists = await pool.query(`select id from notification_channels where id = $1`, [channelId]);
      if (!exists.rows[0]) continue;
      await pool.query(
        `insert into monitor_channels (monitor_id, channel_id) values ($1, $2) on conflict do nothing`,
        [monitor.id, channelId],
      );
    }
  }

  for (const page of backup.statusPages) {
    const bySlug = await pool.query(`select id from status_pages where slug = $1`, [page.slug]);
    const id = bySlug.rows[0]?.id && bySlug.rows[0].id !== page.id ? bySlug.rows[0].id : page.id;
    const existing = await pool.query(`select id from status_pages where id = $1`, [id]);
    if (existing.rows[0]) {
      await pool.query(
        `update status_pages set slug = $1, title = $2, description = $3, published = $4 where id = $5`,
        [page.slug, page.title, page.description, page.published, id],
      );
    } else {
      await pool.query(
        `insert into status_pages (id, slug, title, description, published, created_by)
         values ($1,$2,$3,$4,$5,$6)`,
        [id, page.slug, page.title, page.description, page.published, actorId],
      );
    }
    await pool.query(`delete from status_page_monitors where page_id = $1`, [id]);
    for (let i = 0; i < page.monitorIds.length; i += 1) {
      const monitorId = page.monitorIds[i];
      if (!knownMonitors.has(monitorId)) {
        const exists = await pool.query(`select id from monitors where id = $1`, [monitorId]);
        if (!exists.rows[0]) continue;
      }
      await pool.query(
        `insert into status_page_monitors (page_id, monitor_id, sort_order) values ($1,$2,$3) on conflict do nothing`,
        [id, monitorId, i],
      );
    }
  }
}

async function cmdBackup(file) {
  const data = await exportBackup();
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (!file || file === "-") {
    process.stdout.write(json);
    return;
  }
  writeFileSync(file, json);
  console.log(
    `wrote ${file} (${data.users.length} users, ${data.monitors.length} monitors, ${data.channels.length} channels)`,
  );
}

function kickCheckEngineBestEffort() {
  // pulsectl is a separate process from the Nitro server, so it cannot call
  // startEngine() in-process. Restarting the unit re-runs the Nitro boot
  // plugin which starts the engine and immediately runs due checks.
  try {
    const { spawnSync } = require("node:child_process");
    const active = spawnSync("systemctl", ["is-active", "pulsewatch"], { encoding: "utf8" });
    if (String(active.stdout || "").trim() !== "active") return;
    const restarted = spawnSync("systemctl", ["try-restart", "pulsewatch"], { encoding: "utf8" });
    if (restarted.status === 0) {
      console.log("kicked check engine (restarted pulsewatch.service)");
    }
  } catch {
    /* non-root / no systemd — engine starts on next service boot via Nitro plugin */
  }
}

async function cmdRestore(file, argv) {
  if (!file) throw new Error("backup file required");
  const replace = argv.includes("--replace");
  const text = file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
  const backup = parseBackup(JSON.parse(text));
  await restoreBackup(backup, replace);
  console.log(
    `${replace ? "replaced" : "merged"} ${backup.users.length} users, ${backup.monitors.length} monitors, ${backup.channels.length} channels, ${backup.statusPages.length} status pages`,
  );
  kickCheckEngineBestEffort();
}

const [cmd, sub, ...rest] = process.argv.slice(2);

try {
  if (cmd === "user" && sub === "add") await cmdUserAdd(rest[0], rest);
  else if (cmd === "user" && sub === "list") await cmdUserList();
  else if (cmd === "user" && sub === "role") await cmdUserRole(rest[0], rest[1]);
  else if (cmd === "user" && sub === "passwd") await cmdUserPasswd(rest[0], rest);
  else if (cmd === "user" && sub === "delete") await cmdUserDelete(rest[0]);
  else if (cmd === "status") await cmdStatus();
  else if (cmd === "backup") await cmdBackup(sub);
  else if (cmd === "restore") await cmdRestore(sub, rest);
  else usage();
} catch (err) {
  console.error(`pulsectl: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
