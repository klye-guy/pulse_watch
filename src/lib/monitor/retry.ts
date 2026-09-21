export type ConfirmedStatus = "up" | "down" | "pending";
export type HeartbeatRecord = "up" | "down" | "pending";

export type RetryDecision = {
  nextStreak: number;
  heartbeatStatus: HeartbeatRecord;
  confirmed: ConfirmedStatus;
  notify: "up" | "down" | null;
  messagePrefix: string | null;
};

export function decideRetry(input: {
  checkStatus: "up" | "down";
  failStreak: number;
  maxRetries: number;
  confirmed: ConfirmedStatus;
}): RetryDecision {
  const maxRetries = Math.max(0, Math.min(10, Math.floor(input.maxRetries)));
  const failStreak = Math.max(0, Math.floor(input.failStreak));
  const confirmed: ConfirmedStatus = input.confirmed === "down" || input.confirmed === "up" ? input.confirmed : "pending";

  if (input.checkStatus === "up") {
    return {
      nextStreak: 0,
      heartbeatStatus: "up",
      confirmed: "up",
      notify: confirmed === "down" ? "up" : null,
      messagePrefix: null,
    };
  }

  const nextStreak = failStreak + 1;
  if (nextStreak <= maxRetries) {
    return {
      nextStreak,
      heartbeatStatus: "pending",
      confirmed,
      notify: null,
      messagePrefix: `Retry ${nextStreak}/${maxRetries}`,
    };
  }

  return {
    nextStreak,
    heartbeatStatus: "down",
    confirmed: "down",
    notify: confirmed === "down" ? null : "down",
    messagePrefix: null,
  };
}

export function shouldResend(input: {
  heartbeatStatus: HeartbeatRecord;
  confirmed: ConfirmedStatus;
  notify: "up" | "down" | null;
  resendIntervalSec: number;
  lastNotifiedAt: string | Date | null | undefined;
  nowMs?: number;
}): boolean {
  if (input.notify) return false;
  if (input.heartbeatStatus !== "down" || input.confirmed !== "down") return false;
  const interval = Math.max(0, Math.floor(input.resendIntervalSec));
  if (interval <= 0) return false;
  if (!input.lastNotifiedAt) return true;
  const last =
    typeof input.lastNotifiedAt === "string" ? Date.parse(input.lastNotifiedAt) : input.lastNotifiedAt.getTime();
  if (!Number.isFinite(last)) return true;
  return (input.nowMs ?? Date.now()) - last >= interval * 1000;
}

export function dueIntervalSec(input: {
  intervalSec: number;
  retryIntervalSec: number;
  failStreak: number;
  maxRetries: number;
}): number {
  const interval = Math.max(10, input.intervalSec);
  const retry = Math.max(5, input.retryIntervalSec);
  if (input.failStreak > 0 && input.failStreak <= input.maxRetries) return retry;
  return interval;
}

export function spreadDelayMs(id: string, intervalSec: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const window = Math.min(Math.max(10, intervalSec), 90) * 1000;
  return (h >>> 0) % window;
}

export function isMonitorDue(input: {
  id?: string;
  lastCheckedAt: string | Date | null | undefined;
  intervalSec: number;
  retryIntervalSec: number;
  failStreak: number;
  maxRetries: number;
  nowMs?: number;
  engineStartedAtMs?: number;
}): boolean {
  const now = input.nowMs ?? Date.now();
  if (!input.lastCheckedAt) {
    if (input.id && input.engineStartedAtMs != null) {
      return now - input.engineStartedAtMs >= spreadDelayMs(input.id, input.intervalSec);
    }
    return true;
  }
  const last = typeof input.lastCheckedAt === "string" ? Date.parse(input.lastCheckedAt) : input.lastCheckedAt.getTime();
  if (!Number.isFinite(last)) return true;
  const interval = dueIntervalSec(input);
  return now - last >= interval * 1000 - 400;
}

export function checkTimeoutSec(timeoutSec: number): number {
  return Math.max(1, Math.min(20, Math.floor(timeoutSec || 10)));
}

export function checkConcurrency(raw?: string): number {
  const n = Number(raw ?? 48);
  if (!Number.isFinite(n)) return 48;
  return Math.max(8, Math.min(128, Math.floor(n)));
}

export function hostConcurrency(raw?: string): number {
  const n = Number(raw ?? 6);
  if (!Number.isFinite(n)) return 6;
  return Math.max(2, Math.min(16, Math.floor(n)));
}
