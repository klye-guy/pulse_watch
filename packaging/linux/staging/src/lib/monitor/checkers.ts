import { execFile } from "node:child_process";
import { setDefaultResultOrder } from "node:dns";
import { lookup, resolve } from "node:dns/promises";
import { connect } from "node:net";
import { promisify } from "node:util";

try {
  setDefaultResultOrder("ipv4first");
} catch {
  /* older Node */
}

const execFileAsync = promisify(execFile);
const KEYWORD_BODY_LIMIT = 512 * 1024;

class Gate {
  private n = 0;
  constructor(private readonly max: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.n >= this.max) {
      await new Promise((r) => setTimeout(r, 25));
    }
    this.n += 1;
    try {
      return await fn();
    } finally {
      this.n -= 1;
    }
  }
}

const pingGate = new Gate(8);

export type CheckResult = {
  status: "up" | "down";
  ping: number;
  msg: string;
};

export type CheckTarget = {
  type: string;
  url: string | null;
  method: string;
  keyword: string | null;
  keywordInvert: boolean;
  hostname: string | null;
  port: number | null;
  dnsRecordType: string;
  timeoutSec: number;
  acceptedStatus: string;
};

function elapsed(start: number): number {
  return Math.max(0, Date.now() - start);
}

function fail(start: number, msg: string): CheckResult {
  return { status: "down", ping: elapsed(start), msg };
}

function parseAccepted(spec: string): (code: number) => boolean {
  const parts = spec
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ranges: Array<[number, number]> = [];
  for (const part of parts) {
    const m = part.match(/^(\d{3})-(\d{3})$/);
    if (m) {
      ranges.push([Number(m[1]), Number(m[2])]);
      continue;
    }
    const n = Number(part);
    if (Number.isFinite(n)) ranges.push([n, n]);
  }
  if (ranges.length === 0) ranges.push([200, 299]);
  return (code) => ranges.some(([a, b]) => code >= a && code <= b);
}

async function withTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(500, ms));
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function raceTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Timed out")), Math.max(500, ms));
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readLimitedText(res: Response, limit: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    size += value.byteLength;
    if (size > limit) {
      chunks.push(value.subarray(0, Math.max(0, value.byteLength - (size - limit))));
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(Math.min(size, limit));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(out);
}

async function checkHttp(target: CheckTarget, start: number): Promise<CheckResult> {
  const url = target.url?.trim();
  if (!url) return fail(start, "No URL configured");
  try {
    const res = await withTimeout(target.timeoutSec * 1000, (signal) =>
      fetch(url, {
        method: (target.method || "GET").toUpperCase(),
        redirect: "follow",
        signal,
        headers: { "user-agent": "Pulsewatch/1.0" },
      }),
    );
    const ping = elapsed(start);
    const okStatus = parseAccepted(target.acceptedStatus)(res.status);
    if (!okStatus) {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      return { status: "down", ping, msg: `HTTP ${res.status}` };
    }
    if (target.type === "keyword") {
      const body = await readLimitedText(res, KEYWORD_BODY_LIMIT);
      const needle = target.keyword ?? "";
      const found = needle.length > 0 && body.includes(needle);
      const expectFound = !target.keywordInvert;
      if (found !== expectFound) {
        return {
          status: "down",
          ping,
          msg: target.keywordInvert ? "Keyword present" : "Keyword missing",
        };
      }
    } else {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
    }
    return { status: "up", ping, msg: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    if (msg.toLowerCase().includes("abort")) return fail(start, "Timed out");
    return fail(start, msg);
  }
}

function checkTcp(target: CheckTarget, start: number): Promise<CheckResult> {
  const host = target.hostname?.trim() || tryHostFromUrl(target.url);
  const port = target.port ?? 80;
  if (!host) return Promise.resolve(fail(start, "No hostname configured"));
  return new Promise((resolveResult) => {
    const socket = connect({ host, port, timeout: target.timeoutSec * 1000 });
    let settled = false;
    const killer = setTimeout(
      () => done(fail(start, "Timed out")),
      target.timeoutSec * 1000 + 500,
    );
    const done = (result: CheckResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(killer);
      socket.removeAllListeners();
      socket.destroy();
      resolveResult(result);
    };
    socket.once("connect", () => done({ status: "up", ping: elapsed(start), msg: `TCP ${host}:${port}` }));
    socket.once("timeout", () => done(fail(start, "Timed out")));
    socket.once("error", (err) => done(fail(start, err.message)));
  });
}

async function checkDns(target: CheckTarget, start: number): Promise<CheckResult> {
  const host = target.hostname?.trim() || tryHostFromUrl(target.url);
  if (!host) return fail(start, "No hostname configured");
  try {
    const type = (target.dnsRecordType || "A").toUpperCase();
    const records =
      type === "A" || type === "AAAA"
        ? await raceTimeout(target.timeoutSec * 1000, lookup(host, { all: true }))
        : await raceTimeout(
            target.timeoutSec * 1000,
            resolve(host, type as "MX" | "TXT" | "CNAME" | "NS") as Promise<unknown>,
          );
    const count = Array.isArray(records) ? records.length : 1;
    if (count === 0) return fail(start, `No ${type} records`);
    return { status: "up", ping: elapsed(start), msg: `${count} ${type} record${count === 1 ? "" : "s"}` };
  } catch (err) {
    return fail(start, err instanceof Error ? err.message : "DNS failed");
  }
}

async function checkPing(target: CheckTarget, start: number): Promise<CheckResult> {
  const host = target.hostname?.trim() || tryHostFromUrl(target.url);
  if (!host) return fail(start, "No hostname configured");
  return pingGate.run(async () => {
    try {
      const { stdout } = await execFileAsync("ping", ["-c", "1", "-W", String(Math.max(1, target.timeoutSec)), host], {
        timeout: (target.timeoutSec + 1) * 1000,
      });
      const match = stdout.match(/time[=<]([\d.]+)\s*ms/i);
      const ping = match ? Math.round(Number(match[1])) : elapsed(start);
      return { status: "up" as const, ping, msg: "ICMP reply" };
    } catch {
      const https = await checkTcp({ ...target, hostname: host, port: 443 }, start);
      if (https.status === "up") return { status: "up" as const, ping: https.ping, msg: "TCP 443 (ICMP unavailable)" };
      return checkTcp({ ...target, hostname: host, port: 80 }, start);
    }
  });
}

function tryHostFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? null;
  }
}

export async function runCheck(target: CheckTarget): Promise<CheckResult> {
  const start = Date.now();
  switch (target.type) {
    case "tcp":
      return checkTcp(target, start);
    case "dns":
      return checkDns(target, start);
    case "ping":
      return checkPing(target, start);
    case "http":
    case "keyword":
    default:
      return checkHttp(target, start);
  }
}
