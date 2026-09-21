import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkConcurrency,
  checkTimeoutSec,
  decideRetry,
  dueIntervalSec,
  hostConcurrency,
  isMonitorDue,
  shouldResend,
  spreadDelayMs,
} from "./retry.ts";

test("first failure stays pending and does not notify when retries remain", () => {
  const d = decideRetry({ checkStatus: "down", failStreak: 0, maxRetries: 2, confirmed: "up" });
  assert.equal(d.heartbeatStatus, "pending");
  assert.equal(d.notify, null);
  assert.equal(d.nextStreak, 1);
  assert.equal(d.confirmed, "up");
});

test("exhausting retries confirms down and notifies once", () => {
  const d = decideRetry({ checkStatus: "down", failStreak: 2, maxRetries: 2, confirmed: "up" });
  assert.equal(d.heartbeatStatus, "down");
  assert.equal(d.notify, "down");
  assert.equal(d.confirmed, "down");
});

test("already-down failures do not re-notify", () => {
  const d = decideRetry({ checkStatus: "down", failStreak: 5, maxRetries: 2, confirmed: "down" });
  assert.equal(d.notify, null);
  assert.equal(d.heartbeatStatus, "down");
});

test("recovery from confirmed down notifies up and clears the streak", () => {
  const d = decideRetry({ checkStatus: "up", failStreak: 4, maxRetries: 2, confirmed: "down" });
  assert.equal(d.heartbeatStatus, "up");
  assert.equal(d.notify, "up");
  assert.equal(d.nextStreak, 0);
});

test("zero retries alerts on the first failure", () => {
  const d = decideRetry({ checkStatus: "down", failStreak: 0, maxRetries: 0, confirmed: "up" });
  assert.equal(d.heartbeatStatus, "down");
  assert.equal(d.notify, "down");
});

test("retry interval is used while a streak is open", () => {
  assert.equal(dueIntervalSec({ intervalSec: 60, retryIntervalSec: 20, failStreak: 1, maxRetries: 2 }), 20);
  assert.equal(dueIntervalSec({ intervalSec: 60, retryIntervalSec: 20, failStreak: 0, maxRetries: 2 }), 60);
  assert.equal(dueIntervalSec({ intervalSec: 60, retryIntervalSec: 20, failStreak: 3, maxRetries: 2 }), 60);
});

test("due checks use last_checked_at instead of scanning heartbeats", () => {
  const now = Date.parse("2026-09-19T20:00:00.000Z");
  assert.equal(
    isMonitorDue({
      lastCheckedAt: null,
      intervalSec: 60,
      retryIntervalSec: 20,
      failStreak: 0,
      maxRetries: 2,
      nowMs: now,
    }),
    true,
  );
  assert.equal(
    isMonitorDue({
      lastCheckedAt: "2026-09-19T19:59:50.000Z",
      intervalSec: 60,
      retryIntervalSec: 20,
      failStreak: 0,
      maxRetries: 2,
      nowMs: now,
    }),
    false,
  );
  assert.equal(
    isMonitorDue({
      lastCheckedAt: "2026-09-19T19:59:39.000Z",
      intervalSec: 60,
      retryIntervalSec: 20,
      failStreak: 1,
      maxRetries: 2,
      nowMs: now,
    }),
    true,
  );
});

test("first checks after a restart are spread across the interval", () => {
  const started = Date.parse("2026-09-19T20:00:00.000Z");
  const delay = spreadDelayMs("monitor-a", 60);
  assert.ok(delay >= 0 && delay < 60_000);
  assert.equal(
    isMonitorDue({
      id: "monitor-a",
      lastCheckedAt: null,
      intervalSec: 60,
      retryIntervalSec: 20,
      failStreak: 0,
      maxRetries: 2,
      nowMs: started + delay - 1,
      engineStartedAtMs: started,
    }),
    false,
  );
  assert.equal(
    isMonitorDue({
      id: "monitor-a",
      lastCheckedAt: null,
      intervalSec: 60,
      retryIntervalSec: 20,
      failStreak: 0,
      maxRetries: 2,
      nowMs: started + delay,
      engineStartedAtMs: started,
    }),
    true,
  );
});

test("resend while down respects the interval and skips when already notifying", () => {
  const now = Date.parse("2026-09-19T20:00:00.000Z");
  assert.equal(
    shouldResend({
      heartbeatStatus: "down",
      confirmed: "down",
      notify: null,
      resendIntervalSec: 300,
      lastNotifiedAt: "2026-09-19T19:54:00.000Z",
      nowMs: now,
    }),
    true,
  );
  assert.equal(
    shouldResend({
      heartbeatStatus: "down",
      confirmed: "down",
      notify: null,
      resendIntervalSec: 300,
      lastNotifiedAt: "2026-09-19T19:56:00.000Z",
      nowMs: now,
    }),
    false,
  );
  assert.equal(
    shouldResend({
      heartbeatStatus: "down",
      confirmed: "down",
      notify: "down",
      resendIntervalSec: 300,
      lastNotifiedAt: "2026-09-19T19:00:00.000Z",
      nowMs: now,
    }),
    false,
  );
  assert.equal(
    shouldResend({
      heartbeatStatus: "down",
      confirmed: "down",
      notify: null,
      resendIntervalSec: 0,
      lastNotifiedAt: "2026-09-19T19:00:00.000Z",
      nowMs: now,
    }),
    false,
  );
});

test("concurrency and timeout stay inside safe bounds", () => {
  assert.equal(checkConcurrency(undefined), 48);
  assert.equal(checkConcurrency("64"), 64);
  assert.equal(checkConcurrency("999"), 128);
  assert.equal(checkConcurrency("1"), 8);
  assert.equal(checkTimeoutSec(60), 20);
  assert.equal(checkTimeoutSec(0), 10);
  assert.equal(hostConcurrency(undefined), 6);
  assert.equal(hostConcurrency("40"), 16);
});
