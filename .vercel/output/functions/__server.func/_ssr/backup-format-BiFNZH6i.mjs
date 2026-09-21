//#region node_modules/.nitro/vite/services/ssr/assets/backup-format-BiFNZH6i.js
var BACKUP_KIND = "pulsewatch.backup";
var ROLES = /* @__PURE__ */ new Set([
	"owner",
	"admin",
	"editor",
	"viewer"
]);
var MONITOR_TYPES = /* @__PURE__ */ new Set([
	"http",
	"keyword",
	"tcp",
	"ping",
	"dns"
]);
var CHANNEL_TYPES = /* @__PURE__ */ new Set([
	"webhook",
	"discord",
	"slack",
	"telegram",
	"email"
]);
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
function asRole(v) {
	return typeof v === "string" && ROLES.has(v) ? v : "viewer";
}
function asMonitorType(v) {
	return typeof v === "string" && MONITOR_TYPES.has(v) ? v : "http";
}
function asChannelType(v) {
	return typeof v === "string" && CHANNEL_TYPES.has(v) ? v : "webhook";
}
function asStringMap(v) {
	if (!v || typeof v !== "object" || Array.isArray(v)) return {};
	const out = {};
	for (const [k, val] of Object.entries(v)) if (typeof val === "string") out[k] = val;
	return out;
}
function asIdList(v) {
	if (!Array.isArray(v)) return [];
	return v.filter((x) => typeof x === "string" && x.length > 0);
}
function parseBackup(raw) {
	const o = asRecord(raw, "Backup file");
	if (o.kind !== "pulsewatch.backup") throw new Error("Not a Pulsewatch backup file");
	if (o.version !== 1) throw new Error(`Unsupported backup version: ${String(o.version)}`);
	const site = o.site && typeof o.site === "object" ? o.site : {};
	const users = [];
	for (const item of asArray(o.users)) {
		const u = asRecord(item, "User");
		const email = asString(u.email).trim().toLowerCase();
		if (!email.includes("@")) continue;
		users.push({
			email,
			name: asString(u.name).trim() || email.split("@")[0] || "User",
			role: asRole(u.role),
			passwordHash: typeof u.passwordHash === "string" && u.passwordHash.length > 0 ? u.passwordHash : null
		});
	}
	const channels = [];
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
			active: asBool(c.active, true)
		});
	}
	const monitors = [];
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
			channelIds: asIdList(m.channelIds)
		});
	}
	const statusPages = [];
	for (const item of asArray(o.statusPages)) {
		const p = asRecord(item, "Status page");
		const id = asString(p.id).trim();
		const slug = asString(p.slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
		const title = asString(p.title).trim();
		if (!id || !slug || !title) continue;
		statusPages.push({
			id,
			slug,
			title,
			description: asString(p.description),
			published: asBool(p.published, true),
			monitorIds: asIdList(p.monitorIds)
		});
	}
	return {
		kind: BACKUP_KIND,
		version: 1,
		exportedAt: asString(o.exportedAt, (/* @__PURE__ */ new Date()).toISOString()),
		site: { name: asString(site.name).trim() || "Pulsewatch" },
		users,
		channels,
		monitors,
		statusPages
	};
}
function backupFilename(exportedAt) {
	return `pulsewatch-backup-${(exportedAt ? typeof exportedAt === "string" ? exportedAt : exportedAt.toISOString() : (/* @__PURE__ */ new Date()).toISOString()).slice(0, 19).replace(/[:T]/g, "-")}.json`;
}
//#endregion
export { backupFilename as n, parseBackup as r, BACKUP_KIND as t };
