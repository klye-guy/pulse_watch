import { a as newId } from "./utils-DcJqOWe7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channels-DJE3Et1_.js
function parseConfig(raw) {
	try {
		const v = JSON.parse(raw);
		return v && typeof v === "object" ? v : {};
	} catch {
		return {};
	}
}
async function listChannels(sql) {
	return (await sql`
    select id, name, type, config, active, created_at
    from notification_channels
    order by name
  `).map((r) => ({
		id: r.id,
		name: r.name,
		type: r.type,
		config: redactSecrets(r.type, parseConfig(r.config)),
		active: Boolean(r.active),
		createdAt: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString()
	}));
}
function redactSecrets(type, config) {
	const next = { ...config };
	if (next.pass) next.pass = "";
	if (type === "telegram" && next.token) next.token = next.token.length > 6 ? `${next.token.slice(0, 4)}…` : "";
	return next;
}
async function upsertChannel(sql, userId, input) {
	const id = input.id ?? newId();
	const name = input.name.trim();
	if (!name) throw new Error("Name is required");
	const nextConfig = { ...input.config ?? {} };
	if (input.id) {
		const prev = parseConfig((await sql`
      select config from notification_channels where id = ${id}
    `)[0]?.config ?? "{}");
		if (!nextConfig.pass && prev.pass) nextConfig.pass = prev.pass;
		if (!nextConfig.token && prev.token) nextConfig.token = prev.token;
	}
	const config = JSON.stringify(nextConfig);
	if (input.id) await sql`
      update notification_channels
      set name = ${name}, type = ${input.type}, config = ${config}, active = ${input.active ?? true}
      where id = ${id}
    `;
	else await sql`
      insert into notification_channels (id, name, type, config, active, created_by)
      values (${id}, ${name}, ${input.type}, ${config}, ${input.active ?? true}, ${userId})
    `;
	if (input.applyToAll) {
		const monitors = await sql`select id from monitors`;
		for (const monitor of monitors) await sql`
        insert into monitor_channels (monitor_id, channel_id)
        values (${monitor.id}, ${id})
        on conflict do nothing
      `;
	}
	return id;
}
async function deleteChannel(sql, id) {
	await sql`delete from notification_channels where id = ${id}`;
}
async function setMonitorChannels(sql, monitorId, channelIds) {
	await sql`delete from monitor_channels where monitor_id = ${monitorId}`;
	for (const channelId of channelIds) await sql`
      insert into monitor_channels (monitor_id, channel_id)
      values (${monitorId}, ${channelId})
      on conflict do nothing
    `;
}
async function getMonitorChannelIds(sql, monitorId) {
	return (await sql`
    select channel_id from monitor_channels where monitor_id = ${monitorId}
  `).map((r) => r.channel_id);
}
async function listNotifyLog(sql, limit = 40) {
	return (await sql`
    select
      l.id, l.event, l.detail, l.ok, l.created_at,
      m.name as monitor_name,
      c.name as channel_name
    from notification_log l
    left join monitors m on m.id = l.monitor_id
    left join notification_channels c on c.id = l.channel_id
    order by l.created_at desc
    limit ${limit}
  `).map((r) => ({
		id: r.id,
		event: r.event,
		detail: r.detail,
		ok: Boolean(r.ok),
		createdAt: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
		monitorName: r.monitor_name,
		channelName: r.channel_name
	}));
}
//#endregion
export { deleteChannel, getMonitorChannelIds, listChannels, listNotifyLog, setMonitorChannels, upsertChannel };
