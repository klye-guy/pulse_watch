//#region node_modules/.nitro/vite/services/ssr/assets/notify-pRe8RVhC.js
var mailers = /* @__PURE__ */ new Map();
var notifyActive = 0;
var notifyWaiters = [];
var NOTIFY_CONCURRENCY = 6;
var SEND_TIMEOUT_MS = 12e3;
function parseConfig(raw) {
	try {
		const v = JSON.parse(raw);
		return v && typeof v === "object" ? v : {};
	} catch {
		return {};
	}
}
async function withNotifySlot(fn) {
	if (notifyActive >= NOTIFY_CONCURRENCY) await new Promise((resolve) => notifyWaiters.push(resolve));
	notifyActive += 1;
	try {
		return await fn();
	} finally {
		notifyActive -= 1;
		notifyWaiters.shift()?.();
	}
}
async function withTimeout(ms, promise) {
	let timer;
	try {
		return await Promise.race([promise, new Promise((_, reject) => {
			timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Notification timed out")), ms);
		})]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
async function dispatchStatusChange(sql, monitor, fromStatus, toStatus, msg) {
	const linked = await sql`
    select c.id, c.name, c.type, c.config, c.active
    from notification_channels c
    join monitor_channels mc on mc.channel_id = c.id
    where mc.monitor_id = ${monitor.id} and c.active = true
  `;
	const event = toStatus === "down" ? "down" : "up";
	const text = toStatus === "down" ? `Pulsewatch: ${monitor.name} is DOWN (${msg}). Was ${fromStatus}.` : `Pulsewatch: ${monitor.name} is UP again (${msg}).`;
	if (linked.length === 0) {
		await sql`
      insert into notification_log (monitor_id, event, detail, ok)
      values (${monitor.id}, ${event}, ${text}, true)
    `;
		return;
	}
	await Promise.all(linked.map((ch) => withNotifySlot(async () => {
		const cfg = parseConfig(ch.config);
		try {
			await sendWithRetry(ch.type, cfg, text, {
				monitor: monitor.name,
				status: toStatus,
				previous: fromStatus,
				message: msg
			});
			await sql`
            insert into notification_log (channel_id, monitor_id, event, detail, ok)
            values (${ch.id}, ${monitor.id}, ${event}, ${text}, true)
          `;
		} catch (err) {
			const detail = err instanceof Error ? err.message : "send failed";
			await sql`
            insert into notification_log (channel_id, monitor_id, event, detail, ok)
            values (${ch.id}, ${monitor.id}, ${event}, ${detail}, false)
          `;
		}
	})));
}
async function sendTestChannel(sql, channelId) {
	const ch = (await sql`
    select id, name, type, config, active
    from notification_channels
    where id = ${channelId}
  `)[0];
	if (!ch) throw new Error("Channel not found");
	const cfg = parseConfig(ch.config);
	const text = `Pulsewatch test: channel "${ch.name}" is working.`;
	try {
		await sendWithRetry(ch.type, cfg, text, {
			monitor: ch.name,
			status: "up",
			previous: "pending",
			message: "Test notification",
			test: "1"
		});
		await sql`
      insert into notification_log (channel_id, event, detail, ok)
      values (${ch.id}, 'test', ${text}, true)
    `;
	} catch (err) {
		const detail = err instanceof Error ? err.message : "send failed";
		await sql`
      insert into notification_log (channel_id, event, detail, ok)
      values (${ch.id}, 'test', ${detail}, false)
    `;
		throw new Error(detail);
	}
}
async function sendWithRetry(type, cfg, text, payload) {
	let last;
	for (let attempt = 0; attempt < 2; attempt += 1) try {
		await withTimeout(SEND_TIMEOUT_MS, sendChannel(type, cfg, text, payload));
		return;
	} catch (err) {
		last = err;
	}
	throw last instanceof Error ? last : /* @__PURE__ */ new Error("send failed");
}
async function sendChannel(type, cfg, text, payload) {
	if (type === "email") {
		await sendEmail(cfg, text, payload);
		return;
	}
	if (type === "discord" && cfg.url) {
		const res = await fetch(cfg.url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ content: text })
		});
		if (!res.ok) throw new Error(`Discord HTTP ${res.status}`);
		return;
	}
	if (type === "slack" && cfg.url) {
		const res = await fetch(cfg.url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ text })
		});
		if (!res.ok) throw new Error(`Slack HTTP ${res.status}`);
		return;
	}
	if (type === "telegram" && cfg.token && cfg.chatId) {
		const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				chat_id: cfg.chatId,
				text
			})
		});
		if (!res.ok) throw new Error(`Telegram HTTP ${res.status}`);
		return;
	}
	if (type === "webhook" && cfg.url) {
		const res = await fetch(cfg.url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				text,
				...payload,
				source: "pulsewatch"
			})
		});
		if (!res.ok) throw new Error(`Webhook HTTP ${res.status}`);
		return;
	}
	throw new Error("Channel is missing destination settings");
}
async function sendEmail(cfg, text, payload) {
	const host = cfg.host?.trim();
	const to = cfg.to?.trim();
	if (!host || !to) throw new Error("SMTP host and recipients are required");
	const port = Number(cfg.port || 587);
	const mode = (cfg.smtpSecure || (port === 465 ? "tls" : "starttls")).toLowerCase();
	const key = `${host}:${port}:${cfg.user ?? ""}:${mode}`;
	let transporter = mailers.get(key);
	if (!transporter) {
		const nodemailer = await import("../_libs/nodemailer.mjs").then((n) => n.t);
		transporter = (nodemailer.createTransport ?? nodemailer.default.createTransport)({
			host,
			port: Number.isFinite(port) ? port : 587,
			secure: mode === "tls",
			requireTLS: mode === "starttls",
			ignoreTLS: mode === "none",
			auth: cfg.user ? {
				user: cfg.user,
				pass: cfg.pass || ""
			} : void 0,
			pool: true,
			maxConnections: 2,
			maxMessages: 50,
			connectionTimeout: 8e3,
			greetingTimeout: 8e3,
			socketTimeout: 12e3
		});
		mailers.set(key, transporter);
	}
	const subject = payload.test === "1" ? `[Pulsewatch] Test notification` : payload.status === "down" ? `[Pulsewatch] ${payload.monitor} is DOWN` : `[Pulsewatch] ${payload.monitor} is UP`;
	await transporter.sendMail({
		from: cfg.from?.trim() || cfg.user || "pulsewatch@localhost",
		to,
		subject,
		text
	});
}
//#endregion
export { dispatchStatusChange, sendTestChannel };
