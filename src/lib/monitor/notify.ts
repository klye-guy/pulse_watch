import type { Sql } from "@/lib/db";

type Channel = {
  id: string;
  name: string;
  type: string;
  config: string;
  active: boolean;
};

type Mailer = {
  sendMail: (opts: { from: string; to: string; subject: string; text: string }) => Promise<unknown>;
};

const mailers = new Map<string, Mailer>();
let notifyActive = 0;
const notifyWaiters: Array<() => void> = [];
const NOTIFY_CONCURRENCY = 6;
const SEND_TIMEOUT_MS = 12_000;

function parseConfig(raw: string): Record<string, string> {
  try {
    const v = JSON.parse(raw) as Record<string, string>;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

async function withNotifySlot<T>(fn: () => Promise<T>): Promise<T> {
  if (notifyActive >= NOTIFY_CONCURRENCY) {
    await new Promise<void>((resolve) => notifyWaiters.push(resolve));
  }
  notifyActive += 1;
  try {
    return await fn();
  } finally {
    notifyActive -= 1;
    notifyWaiters.shift()?.();
  }
}

async function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Notification timed out")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function dispatchStatusChange(
  sql: Sql,
  monitor: { id: string; name: string },
  fromStatus: string,
  toStatus: string,
  msg: string,
): Promise<void> {
  const linked = await sql<Channel>`
    select c.id, c.name, c.type, c.config, c.active
    from notification_channels c
    join monitor_channels mc on mc.channel_id = c.id
    where mc.monitor_id = ${monitor.id} and c.active = true
  `;
  const event = toStatus === "down" ? "down" : "up";
  const text =
    toStatus === "down"
      ? `Pulsewatch: ${monitor.name} is DOWN (${msg}). Was ${fromStatus}.`
      : `Pulsewatch: ${monitor.name} is UP again (${msg}).`;

  if (linked.length === 0) {
    await sql`
      insert into notification_log (monitor_id, event, detail, ok)
      values (${monitor.id}, ${event}, ${text}, true)
    `;
    return;
  }

  await Promise.all(
    linked.map((ch) =>
      withNotifySlot(async () => {
        const cfg = parseConfig(ch.config);
        try {
          await sendWithRetry(ch.type, cfg, text, {
            monitor: monitor.name,
            status: toStatus,
            previous: fromStatus,
            message: msg,
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
      }),
    ),
  );
}

export async function sendTestChannel(sql: Sql, channelId: string): Promise<void> {
  const rows = await sql<Channel>`
    select id, name, type, config, active
    from notification_channels
    where id = ${channelId}
  `;
  const ch = rows[0];
  if (!ch) throw new Error("Channel not found");
  const cfg = parseConfig(ch.config);
  const text = `Pulsewatch test: channel "${ch.name}" is working.`;
  try {
    await sendWithRetry(ch.type, cfg, text, {
      monitor: ch.name,
      status: "up",
      previous: "pending",
      message: "Test notification",
      test: "1",
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

async function sendWithRetry(
  type: string,
  cfg: Record<string, string>,
  text: string,
  payload: Record<string, string>,
): Promise<void> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await withTimeout(SEND_TIMEOUT_MS, sendChannel(type, cfg, text, payload));
      return;
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("send failed");
}

async function sendChannel(
  type: string,
  cfg: Record<string, string>,
  text: string,
  payload: Record<string, string>,
): Promise<void> {
  if (type === "email") {
    await sendEmail(cfg, text, payload);
    return;
  }
  if (type === "discord" && cfg.url) {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!res.ok) throw new Error(`Discord HTTP ${res.status}`);
    return;
  }
  if (type === "slack" && cfg.url) {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Slack HTTP ${res.status}`);
    return;
  }
  if (type === "telegram" && cfg.token && cfg.chatId) {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: cfg.chatId, text }),
    });
    if (!res.ok) throw new Error(`Telegram HTTP ${res.status}`);
    return;
  }
  if (type === "webhook" && cfg.url) {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, ...payload, source: "pulsewatch" }),
    });
    if (!res.ok) throw new Error(`Webhook HTTP ${res.status}`);
    return;
  }
  throw new Error("Channel is missing destination settings");
}

async function sendEmail(cfg: Record<string, string>, text: string, payload: Record<string, string>): Promise<void> {
  const host = cfg.host?.trim();
  const to = cfg.to?.trim();
  if (!host || !to) throw new Error("SMTP host and recipients are required");
  const port = Number(cfg.port || 587);
  const mode = (cfg.smtpSecure || (port === 465 ? "tls" : "starttls")).toLowerCase();
  const key = `${host}:${port}:${cfg.user ?? ""}:${mode}`;
  let transporter = mailers.get(key);
  if (!transporter) {
    const nodemailer = await import("nodemailer");
    const createTransport = nodemailer.createTransport ?? nodemailer.default.createTransport;
    transporter = createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure: mode === "tls",
      requireTLS: mode === "starttls",
      ignoreTLS: mode === "none",
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass || "" } : undefined,
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    }) as Mailer;
    mailers.set(key, transporter);
  }
  const subject =
    payload.test === "1"
      ? `[Pulsewatch] Test notification`
      : payload.status === "down"
        ? `[Pulsewatch] ${payload.monitor} is DOWN`
        : `[Pulsewatch] ${payload.monitor} is UP`;
  await transporter.sendMail({
    from: cfg.from?.trim() || cfg.user || "pulsewatch@localhost",
    to,
    subject,
    text,
  });
}
