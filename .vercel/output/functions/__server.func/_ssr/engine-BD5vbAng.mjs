import { i as getSql } from "./db-BFEHevtK.mjs";
import { dispatchStatusChange } from "./notify-pRe8RVhC.mjs";
import { execFile } from "node:child_process";
import { setDefaultResultOrder } from "node:dns";
import { lookup, resolve } from "node:dns/promises";
import { connect } from "node:net";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-BD5vbAng.js
function decideRetry(input) {
	const maxRetries = Math.max(0, Math.min(10, Math.floor(input.maxRetries)));
	const failStreak = Math.max(0, Math.floor(input.failStreak));
	const confirmed = input.confirmed === "down" || input.confirmed === "up" ? input.confirmed : "pending";
	if (input.checkStatus === "up") return {
		nextStreak: 0,
		heartbeatStatus: "up",
		confirmed: "up",
		notify: confirmed === "down" ? "up" : null,
		messagePrefix: null
	};
	const nextStreak = failStreak + 1;
	if (nextStreak <= maxRetries) return {
		nextStreak,
		heartbeatStatus: "pending",
		confirmed,
		notify: null,
		messagePrefix: `Retry ${nextStreak}/${maxRetries}`
	};
	return {
		nextStreak,
		heartbeatStatus: "down",
		confirmed: "down",
		notify: confirmed === "down" ? null : "down",
		messagePrefix: null
	};
}
function shouldResend(input) {
	if (input.notify) return false;
	if (input.heartbeatStatus !== "down" || input.confirmed !== "down") return false;
	const interval = Math.max(0, Math.floor(input.resendIntervalSec));
	if (interval <= 0) return false;
	if (!input.lastNotifiedAt) return true;
	const last = typeof input.lastNotifiedAt === "string" ? Date.parse(input.lastNotifiedAt) : input.lastNotifiedAt.getTime();
	if (!Number.isFinite(last)) return true;
	return (input.nowMs ?? Date.now()) - last >= interval * 1e3;
}
function dueIntervalSec(input) {
	const interval = Math.max(10, input.intervalSec);
	const retry = Math.max(5, input.retryIntervalSec);
	if (input.failStreak > 0 && input.failStreak <= input.maxRetries) return retry;
	return interval;
}
function spreadDelayMs(id, intervalSec) {
	let h = 2166136261;
	for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
	const window = Math.min(Math.max(10, intervalSec), 90) * 1e3;
	return (h >>> 0) % window;
}
function isMonitorDue(input) {
	const now = input.nowMs ?? Date.now();
	if (!input.lastCheckedAt) {
		if (input.id && input.engineStartedAtMs != null) return now - input.engineStartedAtMs >= spreadDelayMs(input.id, input.intervalSec);
		return true;
	}
	const last = typeof input.lastCheckedAt === "string" ? Date.parse(input.lastCheckedAt) : input.lastCheckedAt.getTime();
	if (!Number.isFinite(last)) return true;
	const interval = dueIntervalSec(input);
	return now - last >= interval * 1e3 - 400;
}
function checkTimeoutSec(timeoutSec) {
	return Math.max(1, Math.min(20, Math.floor(timeoutSec || 10)));
}
function checkConcurrency(raw) {
	const n = Number(raw ?? 48);
	if (!Number.isFinite(n)) return 48;
	return Math.max(8, Math.min(128, Math.floor(n)));
}
function hostConcurrency(raw) {
	const n = Number(raw ?? 6);
	if (!Number.isFinite(n)) return 6;
	return Math.max(2, Math.min(16, Math.floor(n)));
}
try {
	setDefaultResultOrder("ipv4first");
} catch {}
var execFileAsync = promisify(execFile);
var KEYWORD_BODY_LIMIT = 524288;
var Gate = class {
	max;
	n = 0;
	constructor(max) {
		this.max = max;
	}
	async run(fn) {
		while (this.n >= this.max) await new Promise((r) => setTimeout(r, 25));
		this.n += 1;
		try {
			return await fn();
		} finally {
			this.n -= 1;
		}
	}
};
var pingGate = new Gate(8);
function elapsed(start) {
	return Math.max(0, Date.now() - start);
}
function fail(start, msg) {
	return {
		status: "down",
		ping: elapsed(start),
		msg
	};
}
function parseAccepted(spec) {
	const parts = spec.split(",").map((s) => s.trim()).filter(Boolean);
	const ranges = [];
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
async function withTimeout(ms, fn) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), Math.max(500, ms));
	try {
		return await fn(controller.signal);
	} finally {
		clearTimeout(timer);
	}
}
async function raceTimeout(ms, promise) {
	let timer;
	try {
		return await Promise.race([promise, new Promise((_, reject) => {
			timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Timed out")), Math.max(500, ms));
		})]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
async function readLimitedText(res, limit) {
	if (!res.body) return "";
	const reader = res.body.getReader();
	const chunks = [];
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
			} catch {}
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
async function checkHttp(target, start) {
	const url = target.url?.trim();
	if (!url) return fail(start, "No URL configured");
	try {
		const res = await withTimeout(target.timeoutSec * 1e3, (signal) => fetch(url, {
			method: (target.method || "GET").toUpperCase(),
			redirect: "follow",
			signal,
			headers: { "user-agent": "Pulsewatch/1.0" }
		}));
		const ping = elapsed(start);
		if (!parseAccepted(target.acceptedStatus)(res.status)) {
			try {
				await res.body?.cancel();
			} catch {}
			return {
				status: "down",
				ping,
				msg: `HTTP ${res.status}`
			};
		}
		if (target.type === "keyword") {
			const body = await readLimitedText(res, KEYWORD_BODY_LIMIT);
			const needle = target.keyword ?? "";
			if ((needle.length > 0 && body.includes(needle)) !== !target.keywordInvert) return {
				status: "down",
				ping,
				msg: target.keywordInvert ? "Keyword present" : "Keyword missing"
			};
		} else try {
			await res.body?.cancel();
		} catch {}
		return {
			status: "up",
			ping,
			msg: `HTTP ${res.status}`
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Request failed";
		if (msg.toLowerCase().includes("abort")) return fail(start, "Timed out");
		return fail(start, msg);
	}
}
function checkTcp(target, start) {
	const host = target.hostname?.trim() || tryHostFromUrl(target.url);
	const port = target.port ?? 80;
	if (!host) return Promise.resolve(fail(start, "No hostname configured"));
	return new Promise((resolveResult) => {
		const socket = connect({
			host,
			port,
			timeout: target.timeoutSec * 1e3
		});
		let settled = false;
		const killer = setTimeout(() => done(fail(start, "Timed out")), target.timeoutSec * 1e3 + 500);
		const done = (result) => {
			if (settled) return;
			settled = true;
			clearTimeout(killer);
			socket.removeAllListeners();
			socket.destroy();
			resolveResult(result);
		};
		socket.once("connect", () => done({
			status: "up",
			ping: elapsed(start),
			msg: `TCP ${host}:${port}`
		}));
		socket.once("timeout", () => done(fail(start, "Timed out")));
		socket.once("error", (err) => done(fail(start, err.message)));
	});
}
async function checkDns(target, start) {
	const host = target.hostname?.trim() || tryHostFromUrl(target.url);
	if (!host) return fail(start, "No hostname configured");
	try {
		const type = (target.dnsRecordType || "A").toUpperCase();
		const records = type === "A" || type === "AAAA" ? await raceTimeout(target.timeoutSec * 1e3, lookup(host, { all: true })) : await raceTimeout(target.timeoutSec * 1e3, resolve(host, type));
		const count = Array.isArray(records) ? records.length : 1;
		if (count === 0) return fail(start, `No ${type} records`);
		return {
			status: "up",
			ping: elapsed(start),
			msg: `${count} ${type} record${count === 1 ? "" : "s"}`
		};
	} catch (err) {
		return fail(start, err instanceof Error ? err.message : "DNS failed");
	}
}
async function checkPing(target, start) {
	const host = target.hostname?.trim() || tryHostFromUrl(target.url);
	if (!host) return fail(start, "No hostname configured");
	return pingGate.run(async () => {
		try {
			const { stdout } = await execFileAsync("ping", [
				"-c",
				"1",
				"-W",
				String(Math.max(1, target.timeoutSec)),
				host
			], { timeout: (target.timeoutSec + 1) * 1e3 });
			const match = stdout.match(/time[=<]([\d.]+)\s*ms/i);
			return {
				status: "up",
				ping: match ? Math.round(Number(match[1])) : elapsed(start),
				msg: "ICMP reply"
			};
		} catch {
			const https = await checkTcp({
				...target,
				hostname: host,
				port: 443
			}, start);
			if (https.status === "up") return {
				status: "up",
				ping: https.ping,
				msg: "TCP 443 (ICMP unavailable)"
			};
			return checkTcp({
				...target,
				hostname: host,
				port: 80
			}, start);
		}
	});
}
function tryHostFromUrl(url) {
	if (!url) return null;
	try {
		return new URL(url).hostname;
	} catch {
		return url.replace(/^https?:\/\//, "").split("/")[0] ?? null;
	}
}
async function runCheck(target) {
	const start = Date.now();
	switch (target.type) {
		case "tcp": return checkTcp(target, start);
		case "dns": return checkDns(target, start);
		case "ping": return checkPing(target, start);
		default: return checkHttp(target, start);
	}
}
var HEARTBEATS_KEPT = 48;
var globalRef = globalThis;
function state() {
	globalRef.__pulsewatchEngine__ ??= {
		hostInFlight: /* @__PURE__ */ new Map(),
		startedAt: Date.now()
	};
	globalRef.__pulsewatchEngine__.hostInFlight ??= /* @__PURE__ */ new Map();
	globalRef.__pulsewatchEngine__.startedAt ??= Date.now();
	return globalRef.__pulsewatchEngine__;
}
async function runDueChecks() {
	const slot = state();
	if (slot.running) return slot.running;
	const work = actuallyRunDueChecks().finally(() => {
		if (slot.running === work) slot.running = void 0;
	});
	slot.running = work;
	return work;
}
function kickDueChecks() {
	startEngine();
	runDueChecks();
}
async function actuallyRunDueChecks() {
	try {
		return await runDueChecksInner();
	} catch (err) {
		console.error("[pulsewatch] engine tick failed", err);
		return { checked: 0 };
	}
}
async function runDueChecksInner() {
	const sql = await getSql();
	const enabled = await sql`
    select value from site_settings where key = 'check_enabled'
  `;
	if (enabled[0] && enabled[0].value === "false") return { checked: 0 };
	const monitors = await sql`
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
	const due = monitors.filter((m) => isMonitorDue({
		id: m.id,
		lastCheckedAt: m.last_checked_at,
		intervalSec: Number(m.interval_sec),
		retryIntervalSec: Number(m.retry_interval_sec),
		failStreak: Number(m.fail_streak),
		maxRetries: Number(m.max_retries),
		nowMs: now,
		engineStartedAtMs: slot.startedAt
	}));
	if (due.length === 0) return { checked: 0 };
	const results = [];
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
				acceptedStatus: monitor.accepted_status
			});
			results.push({
				monitor,
				status: result.status,
				ping: result.ping,
				msg: result.msg
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Check failed";
			results.push({
				monitor,
				status: "down",
				ping: null,
				msg
			});
		} finally {
			releaseHost(host);
		}
	});
	const notifies = [];
	for (const outcome of results) try {
		const notify = await recordHeartbeat(sql, outcome.monitor, outcome.status, outcome.ping, outcome.msg);
		if (notify) notifies.push(notify);
	} catch (err) {
		console.error("[pulsewatch] persist failed", outcome.monitor.id, err);
	}
	for (const n of notifies) dispatchStatusChange(sql, n.monitor, n.from, n.to, n.msg).catch((err) => {
		console.error("[pulsewatch] notify failed", n.monitor.id, err);
	});
	if (results.length > 0 && now - (slot.lastPrune ?? 0) > 3e5) {
		slot.lastPrune = now;
		try {
			await pruneHeartbeats(sql);
		} catch (err) {
			console.error("[pulsewatch] prune failed", err);
		}
	}
	return { checked: results.length };
}
async function recordHeartbeat(sql, monitor, checkStatus, ping, msg) {
	const decision = decideRetry({
		checkStatus,
		failStreak: Number(monitor.fail_streak),
		maxRetries: Number(monitor.max_retries),
		confirmed: monitor.confirmed_status
	});
	const resend = shouldResend({
		heartbeatStatus: decision.heartbeatStatus,
		confirmed: decision.confirmed,
		notify: decision.notify,
		resendIntervalSec: Number(monitor.resend_interval_sec ?? 0),
		lastNotifiedAt: monitor.last_notified_at
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
		msg: detail
	};
}
async function pruneHeartbeats(sql) {
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
function hostKey(monitor) {
	const host = monitor.hostname?.trim();
	if (host) return host.toLowerCase();
	if (monitor.url) try {
		return new URL(monitor.url).hostname.toLowerCase();
	} catch {}
	return monitor.id;
}
async function acquireHost(host, limit) {
	const map = state().hostInFlight;
	while ((map.get(host) ?? 0) >= limit) await sleep(25);
	map.set(host, (map.get(host) ?? 0) + 1);
}
function releaseHost(host) {
	const map = state().hostInFlight;
	const n = (map.get(host) ?? 1) - 1;
	if (n <= 0) map.delete(host);
	else map.set(host, n);
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
async function runPool(items, limit, fn) {
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
function startEngine() {
	const slot = state();
	if (slot.timer) return;
	runDueChecks();
	slot.timer = setInterval(() => {
		runDueChecks();
	}, 5e3);
}
if (typeof window === "undefined" && process.env.PULSEWATCH_SELFHOST === "1") startEngine();
//#endregion
export { kickDueChecks, runDueChecks };
