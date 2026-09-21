# Pulsewatch Linux install

Pulsewatch is a private Uptime Kuma-style monitor. The dashboard is login-only.
Users are created in the web UI or with `pulsectl` on the host.

## Ubuntu / Rocky Linux

From the application tree:

```bash
sudo bash packaging/install.sh
sudo systemctl enable --now pulsewatch
sudo pulsectl user add admin@company.com --name Admin --role owner
```

The installer:

1. Installs Node.js 22 and PostgreSQL
2. Creates the `pulsewatch` system user and database
3. Copies the app to `/opt/pulsewatch`
4. Builds the self-hosted server
5. Enables the `pulsewatch` systemd unit

Environment lives in `/etc/pulsewatch/pulsewatch.env`. Logs:

```bash
journalctl -u pulsewatch -f
```

## `pulsectl`

```bash
pulsectl user add jane@ops.example --name Jane --password '********' --role editor
pulsectl user list
pulsectl user role jane@ops.example viewer
pulsectl user passwd jane@ops.example
pulsectl user delete jane@ops.example
pulsectl status
pulsectl backup /var/backups/pulsewatch.json
pulsectl restore /var/backups/pulsewatch.json
pulsectl restore /var/backups/pulsewatch.json --replace
```

Roles: `owner`, `admin`, `editor`, `viewer`. There is no public sign-up.

## Backup & restore

Admins can also download and restore the same JSON from **Settings → Backup & restore**.

The file includes:

- Users (email, name, role, password hashes)
- Monitors and which notification channels they fire
- Notification channels (including webhook / bot tokens)
- Status pages
- Instance display name

Heartbeat history is not included. Treat the file as a secret.

Restore **merges** by default: users match on email, monitors/channels/pages match on id. `--replace` deletes existing monitors, channels, and status pages first, then imports. Users are always merged so the last owner cannot be removed.

## Scale, retries, and email

Pulsewatch is built to stay reliable past the point where Uptime Kuma on SQLite typically slows down (~200–500 monitors). PostgreSQL plus a concurrent check pool is the default on Linux.

- Checks run in a pool of **48** workers (`CHECK_CONCURRENCY`, max 128). Same-host checks are capped at 6 so one origin is not stampeded.
- Timeouts are capped at 20 seconds. HTTP checks do not buffer the response body (keyword checks read at most 512 KB).
- After a restart, first checks are spread across each monitor’s interval so 300 due jobs do not fire at once.
- The engine ticks every 5 seconds. Check results are written **one monitor at a time** so a large wave cannot exhaust the database pool (Kuma’s common “pool is full → false down” failure).
- Alerts are sent off the check path, retried once, and capped at 6 in-flight SMTP/webhooks.
- Uptime 24h/30d comes from hourly rollups, not a scan of every heartbeat. Raw heartbeats are trimmed to the recent bar.

Each monitor retries before it is confirmed down. Defaults: **2 retries**, **20 seconds** apart. Recoveries notify immediately. Optionally **resend while down** (5 minutes / 10 / 30 / hour) so a missed first page is not silent.

**Email (SMTP)** is a notification channel alongside webhook, Discord, Slack, and Telegram. Add it under Notifications, send a test, and attach it on each monitor — or check “Attach to every existing monitor” when saving the channel.

