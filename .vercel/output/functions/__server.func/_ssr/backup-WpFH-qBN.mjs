import { a as newId } from "./utils-DcJqOWe7.mjs";
import { a as ROLE_RANK } from "./types-DYYyg_em.mjs";
import { r as parseBackup, t as BACKUP_KIND } from "./backup-format-BiFNZH6i.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/backup-WpFH-qBN.js
async function exportBackup(sql) {
	const siteRows = await sql`select value from site_settings where key = 'site_name'`;
	const memberRows = await sql`
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
	const channelRows = await sql`
    select id, name, type, config, active from notification_channels order by name
  `;
	const monitorRows = await sql`
    select id, name, type, url, method, keyword, keyword_invert, hostname, port,
           dns_record_type, interval_sec, timeout_sec, accepted_status, tags, active,
           max_retries, retry_interval_sec, resend_interval_sec
    from monitors
    order by name
  `;
	const links = await sql`
    select monitor_id, channel_id from monitor_channels
  `;
	const channelMap = /* @__PURE__ */ new Map();
	for (const link of links) {
		const list = channelMap.get(link.monitor_id) ?? [];
		list.push(link.channel_id);
		channelMap.set(link.monitor_id, list);
	}
	const pageRows = await sql`
    select id, slug, title, description, published from status_pages order by title
  `;
	const pageLinks = await sql`
    select page_id, monitor_id from status_page_monitors order by sort_order
  `;
	const pageMap = /* @__PURE__ */ new Map();
	for (const link of pageLinks) {
		const list = pageMap.get(link.page_id) ?? [];
		list.push(link.monitor_id);
		pageMap.set(link.page_id, list);
	}
	return {
		kind: BACKUP_KIND,
		version: 1,
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		site: { name: siteRows[0]?.value ?? "Pulsewatch" },
		users: memberRows.map((u) => ({
			email: u.email,
			name: u.name,
			role: u.role,
			passwordHash: u.password
		})),
		channels: channelRows.map((c) => {
			let config = {};
			try {
				const parsed = JSON.parse(c.config);
				if (parsed && typeof parsed === "object") config = parsed;
			} catch {
				config = {};
			}
			return {
				id: c.id,
				name: c.name,
				type: c.type,
				config,
				active: Boolean(c.active)
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
			channelIds: channelMap.get(m.id) ?? []
		})),
		statusPages: pageRows.map((p) => ({
			id: p.id,
			slug: p.slug,
			title: p.title,
			description: p.description,
			published: Boolean(p.published),
			monitorIds: pageMap.get(p.id) ?? []
		}))
	};
}
async function restoreBackup(sql, backup, opts) {
	await sql`
    insert into site_settings (key, value) values ('site_name', ${backup.site.name.trim() || "Pulsewatch"})
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
	for (const channel of backup.channels) await upsertChannel(sql, opts.actorId, channel);
	const monitorIds = /* @__PURE__ */ new Set();
	for (const monitor of backup.monitors) {
		await upsertMonitorRow(sql, opts.actorId, monitor);
		monitorIds.add(monitor.id);
		await sql`delete from monitor_channels where monitor_id = ${monitor.id}`;
		for (const channelId of monitor.channelIds) {
			if (!(await sql`select id from notification_channels where id = ${channelId}`)[0]) continue;
			await sql`
        insert into monitor_channels (monitor_id, channel_id)
        values (${monitor.id}, ${channelId})
        on conflict do nothing
      `;
		}
	}
	for (const page of backup.statusPages) await upsertPageRow(sql, opts.actorId, page, monitorIds);
	return {
		mode: opts.mode,
		users: userCount,
		monitors: backup.monitors.length,
		channels: backup.channels.length,
		statusPages: backup.statusPages.length
	};
}
async function restoreUsers(sql, users, actorId, actorEmail) {
	let count = 0;
	for (const user of users) {
		const email = user.email.trim().toLowerCase();
		const name = user.name.trim() || email.split("@")[0] || "User";
		let userId = (await sql`select id from "user" where email = ${email}`)[0]?.id;
		const now = (/* @__PURE__ */ new Date()).toISOString();
		if (!userId) {
			userId = newId();
			await sql`
        insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
        values (${userId}, ${name}, ${email}, true, ${now}, ${now})
      `;
		} else await sql`update "user" set name = ${name}, "updatedAt" = ${now} where id = ${userId}`;
		if (user.passwordHash) {
			const acc = await sql`
        select id from account where "userId" = ${userId} and "providerId" = 'credential'
      `;
			if (acc[0]) await sql`
          update account set password = ${user.passwordHash}, "updatedAt" = ${now}
          where id = ${acc[0].id}
        `;
			else await sql`
          insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
          values (${newId()}, ${userId}, 'credential', ${userId}, ${user.passwordHash}, ${now}, ${now})
        `;
		}
		let role = user.role;
		if (actorEmail && email === actorEmail.toLowerCase()) {
			const currentRole = (await sql`select role from members where user_id = ${actorId}`)[0]?.role;
			if (currentRole && ROLE_RANK[currentRole] > ROLE_RANK[role]) role = currentRole;
		}
		if (role !== "owner") {
			if ((await sql`select role from members where user_id = ${userId}`)[0]?.role === "owner") {
				const owners = await sql`select count(*)::int as n from members where role = 'owner'`;
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
async function upsertChannel(sql, actorId, channel) {
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
async function upsertMonitorRow(sql, actorId, monitor) {
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
async function upsertPageRow(sql, actorId, page, knownMonitors) {
	const bySlug = await sql`select id from status_pages where slug = ${page.slug}`;
	const id = bySlug[0]?.id && bySlug[0].id !== page.id ? bySlug[0].id : page.id;
	if ((await sql`select id from status_pages where id = ${id}`)[0]) await sql`
      update status_pages
      set slug = ${page.slug}, title = ${page.title}, description = ${page.description}, published = ${page.published}
      where id = ${id}
    `;
	else await sql`
      insert into status_pages (id, slug, title, description, published, created_by)
      values (${id}, ${page.slug}, ${page.title}, ${page.description}, ${page.published}, ${actorId})
    `;
	await sql`delete from status_page_monitors where page_id = ${id}`;
	for (let i = 0; i < page.monitorIds.length; i += 1) {
		const monitorId = page.monitorIds[i];
		if (!knownMonitors.has(monitorId)) {
			if (!(await sql`select id from monitors where id = ${monitorId}`)[0]) continue;
		}
		await sql`
      insert into status_page_monitors (page_id, monitor_id, sort_order)
      values (${id}, ${monitorId}, ${i})
      on conflict do nothing
    `;
	}
}
//#endregion
export { exportBackup, parseBackup, restoreBackup };
