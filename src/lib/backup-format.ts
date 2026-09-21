import type { ChannelType, MonitorType, Role } from "@/lib/types";

export const BACKUP_KIND = "pulsewatch.backup";
export const BACKUP_VERSION = 1;

export type BackupMode = "merge" | "replace";

export type BackupUser = {
  email: string;
  name: string;
  role: Role;
  passwordHash: string | null;
};

export type BackupChannel = {
  id: string;
  name: string;
  type: ChannelType;
  config: Record<string, string>;
  active: boolean;
};

export type BackupMonitor = {
  id: string;
  name: string;
  type: MonitorType;
  url: string | null;
  method: string;
  keyword: string | null;
  keywordInvert: boolean;
  hostname: string | null;
  port: number | null;
  dnsRecordType: string;
  intervalSec: number;
  timeoutSec: number;
  acceptedStatus: string;
  tags: string;
  active: boolean;
  maxRetries: number;
  retryIntervalSec: number;
  resendIntervalSec: number;
  channelIds: string[];
};

export type BackupStatusPage = {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  monitorIds: string[];
};

export type BackupFile = {
  kind: typeof BACKUP_KIND;
  version: number;
  exportedAt: string;
  site: { name: string };
  users: BackupUser[];
  channels: BackupChannel[];
  monitors: BackupMonitor[];
  statusPages: BackupStatusPage[];
};

export type RestoreResult = {
  mode: BackupMode;
  users: number;
  monitors: number;
  channels: number;
  statusPages: number;
};

const ROLES = new Set<Role>(["owner", "admin", "editor", "viewer"]);
const MONITOR_TYPES = new Set<MonitorType>(["http", "keyword", "tcp", "ping", "dns"]);
const CHANNEL_TYPES = new Set<ChannelType>(["webhook", "discord", "slack", "telegram", "email"]);

function asRecord(v: unknown, label: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(`${label} is invalid`);
  return v as Record<string, unknown>;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asNum(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asRole(v: unknown): Role {
  return typeof v === "string" && ROLES.has(v as Role) ? (v as Role) : "viewer";
}

function asMonitorType(v: unknown): MonitorType {
  return typeof v === "string" && MONITOR_TYPES.has(v as MonitorType) ? (v as MonitorType) : "http";
}

function asChannelType(v: unknown): ChannelType {
  return typeof v === "string" && CHANNEL_TYPES.has(v as ChannelType) ? (v as ChannelType) : "webhook";
}

function asStringMap(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = val;
  }
  return out;
}

function asIdList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

export function parseBackup(raw: unknown): BackupFile {
  const o = asRecord(raw, "Backup file");
  if (o.kind !== BACKUP_KIND) throw new Error("Not a Pulsewatch backup file");
  if (o.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${String(o.version)}`);
  }
  const site = o.site && typeof o.site === "object" ? (o.site as Record<string, unknown>) : {};
  const users: BackupUser[] = [];
  for (const item of asArray(o.users)) {
    const u = asRecord(item, "User");
    const email = asString(u.email).trim().toLowerCase();
    if (!email.includes("@")) continue;
    users.push({
      email,
      name: asString(u.name).trim() || email.split("@")[0] || "User",
      role: asRole(u.role),
      passwordHash: typeof u.passwordHash === "string" && u.passwordHash.length > 0 ? u.passwordHash : null,
    });
  }
  const channels: BackupChannel[] = [];
  for (const item of asArray(o.channels)) {
    const c = asRecord(item, "Channel");
    const id = asString(c.id).trim();
    const name = asString(c.name).trim();
    if (!id || !name) continue;
    channels.push({
      id,
      name,
      type: asChannelType(c.type),
      config: asStringMap(c.config),
      active: asBool(c.active, true),
    });
  }
  const monitors: BackupMonitor[] = [];
  for (const item of asArray(o.monitors)) {
    const m = asRecord(item, "Monitor");
    const id = asString(m.id).trim();
    const name = asString(m.name).trim();
    if (!id || !name) continue;
    const port = m.port == null ? null : asNum(m.port, 0) || null;
    monitors.push({
      id,
      name,
      type: asMonitorType(m.type),
      url: asString(m.url).trim() || null,
      method: asString(m.method, "GET") || "GET",
      keyword: asString(m.keyword).trim() || null,
      keywordInvert: asBool(m.keywordInvert),
      hostname: asString(m.hostname).trim() || null,
      port,
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
  const statusPages: BackupStatusPage[] = [];
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

export function backupFilename(exportedAt?: string | Date): string {
  const iso = exportedAt
    ? typeof exportedAt === "string"
      ? exportedAt
      : exportedAt.toISOString()
    : new Date().toISOString();
  const stamp = iso.slice(0, 19).replace(/[:T]/g, "-");
  return `pulsewatch-backup-${stamp}.json`;
}
