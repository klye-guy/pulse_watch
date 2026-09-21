import { a as newId } from "./utils-DcJqOWe7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/monitors-B6YO37jz.js
function toIso(v) {
	if (!v) return null;
	if (typeof v === "string") return v;
	return v.toISOString();
}
function toSummary(m, recent, st) {
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
		lastStatus: m.active ? storedStatus ?? latest?.status ?? "pending" : "paused",
		lastPing: m.last_ping ?? latest?.ping ?? null,
		lastMsg: m.last_msg ?? latest?.msg ?? null,
		lastCheckedAt: toIso(m.last_checked_at) ?? latest?.checkedAt ?? null,
		uptime24h: st?.uptime_24h ?? null,
		uptime30d: st?.uptime_30d ?? null,
		beats: recent
	};
}
async function listMonitorSummaries(sql) {
	const monitors = await sql`
    select id, name, type, url, hostname, port, method, interval_sec, timeout_sec,
           accepted_status, keyword, keyword_invert, dns_record_type, tags, active,
           max_retries, retry_interval_sec, resend_interval_sec, fail_streak, last_checked_at, last_status,
           last_ping, last_msg
    from monitors
    order by name asc
  `;
	if (monitors.length === 0) return [];
	const beats = await sql`
    select monitor_id, status, ping, msg, checked_at from (
      select h.monitor_id, h.status, h.ping, h.msg, h.checked_at,
             row_number() over (partition by h.monitor_id order by h.checked_at desc) as rn
      from heartbeats h
      where h.checked_at > now() - interval '2 hours'
    ) ranked
    where rn <= 24
  `;
	const stats = await sql`
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
	const beatMap = /* @__PURE__ */ new Map();
	for (const b of beats) {
		const list = beatMap.get(b.monitor_id) ?? [];
		list.push({
			status: b.status,
			ping: b.ping,
			msg: null,
			checkedAt: toIso(b.checked_at) ?? (/* @__PURE__ */ new Date()).toISOString()
		});
		beatMap.set(b.monitor_id, list);
	}
	return monitors.map((m) => {
		return toSummary(m, (beatMap.get(m.id) ?? []).slice().reverse(), statsMap.get(m.id));
	});
}
async function getMonitor(sql, id) {
	const m = (await sql`
    select id, name, type, url, hostname, port, method, interval_sec, timeout_sec,
           accepted_status, keyword, keyword_invert, dns_record_type, tags, active,
           max_retries, retry_interval_sec, resend_interval_sec, fail_streak, last_checked_at, last_status,
           last_ping, last_msg
    from monitors
    where id = ${id}
  `)[0];
	if (!m) return null;
	const beats = await sql`
    select monitor_id, status, ping, msg, checked_at
    from heartbeats
    where monitor_id = ${id}
    order by checked_at desc
    limit 100
  `;
	const stats = await sql`
    select
      (sum(up_count) filter (where hour_ts >= now() - interval '24 hours') * 100.0
        / nullif(sum(up_count + down_count) filter (where hour_ts >= now() - interval '24 hours'), 0))::float as uptime_24h,
      (sum(up_count) * 100.0 / nullif(sum(up_count + down_count), 0))::float as uptime_30d
    from monitor_hour_stats
    where monitor_id = ${id} and hour_ts >= now() - interval '30 days'
  `;
	return toSummary(m, beats.slice().reverse().map((b) => ({
		status: b.status,
		ping: b.ping,
		msg: b.msg,
		checkedAt: toIso(b.checked_at) ?? (/* @__PURE__ */ new Date()).toISOString()
	})), stats[0]);
}
async function upsertMonitor(sql, userId, input) {
	const id = input.id ?? newId();
	const name = input.name.trim();
	if (!name) throw new Error("Name is required");
	const maxRetries = Math.max(0, Math.min(10, Math.floor(input.maxRetries ?? 2)));
	const retryIntervalSec = Math.max(5, Math.min(300, Math.floor(input.retryIntervalSec ?? 20)));
	const resendIntervalSec = Math.max(0, Math.min(86400, Math.floor(input.resendIntervalSec ?? 0)));
	if (input.id) await sql`
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
	else await sql`
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
	return id;
}
async function deleteMonitor(sql, id) {
	await sql`delete from monitors where id = ${id}`;
}
async function setMonitorActive(sql, id, active) {
	await sql`update monitors set active = ${active}, updated_at = now() where id = ${id}`;
}
//#endregion
export { deleteMonitor, getMonitor, listMonitorSummaries, setMonitorActive, upsertMonitor };
