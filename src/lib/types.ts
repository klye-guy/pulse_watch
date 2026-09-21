export type Role = "owner" | "admin" | "editor" | "viewer";

export type MonitorType = "http" | "keyword" | "tcp" | "ping" | "dns";

export type HeartbeatStatus = "up" | "down" | "pending";

export type ChannelType = "webhook" | "discord" | "slack" | "telegram" | "email";

export type AccessState =
  | { status: "ok"; role: Role; userId: string; email: string | null; name: string | null }
  | { status: "denied"; userId: string; email: string | null; name: string | null };

export type Beat = {
  status: HeartbeatStatus;
  ping: number | null;
  msg: string | null;
  checkedAt: string;
};

export type MonitorSummary = {
  id: string;
  name: string;
  type: MonitorType;
  url: string | null;
  hostname: string | null;
  port: number | null;
  method: string;
  intervalSec: number;
  timeoutSec: number;
  acceptedStatus: string;
  keyword: string | null;
  keywordInvert: boolean;
  dnsRecordType: string;
  tags: string;
  active: boolean;
  maxRetries: number;
  retryIntervalSec: number;
  resendIntervalSec: number;
  failStreak: number;
  lastStatus: HeartbeatStatus | "paused";
  lastPing: number | null;
  lastMsg: string | null;
  lastCheckedAt: string | null;
  uptime24h: number | null;
  uptime30d: number | null;
  beats: Beat[];
};

export type MonitorInput = {
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
};

export type MemberRow = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  hasPassword: boolean;
};

export type ChannelRow = {
  id: string;
  name: string;
  type: ChannelType;
  config: Record<string, string>;
  active: boolean;
  createdAt: string;
};

export type StatusPageRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  monitorIds: string[];
  createdAt: string;
};

export type PublicStatusMonitor = {
  id: string;
  name: string;
  lastStatus: HeartbeatStatus | "paused";
  uptime24h: number | null;
  lastPing: number | null;
  beats: Beat[];
};

export type NotifyLogRow = {
  id: number;
  event: string;
  detail: string | null;
  ok: boolean;
  createdAt: string;
  monitorName: string | null;
  channelName: string | null;
};

export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

export const INTERVAL_OPTIONS = [
  { label: "20 seconds", value: 20 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
] as const;

export const RETRY_COUNT_OPTIONS = [
  { label: "Alert immediately", value: 0 },
  { label: "1 retry", value: 1 },
  { label: "2 retries", value: 2 },
  { label: "3 retries", value: 3 },
  { label: "5 retries", value: 5 },
] as const;

export const RETRY_INTERVAL_OPTIONS = [
  { label: "10 seconds", value: 10 },
  { label: "20 seconds", value: 20 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
] as const;

export const RESEND_INTERVAL_OPTIONS = [
  { label: "Don't repeat", value: 0 },
  { label: "Every 5 minutes", value: 300 },
  { label: "Every 10 minutes", value: 600 },
  { label: "Every 30 minutes", value: 1800 },
  { label: "Every hour", value: 3600 },
] as const;
