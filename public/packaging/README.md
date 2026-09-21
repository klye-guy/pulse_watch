# Pulsewatch Linux install

Pulsewatch is a private Uptime Kuma-style monitor. The dashboard is login-only.
Users are created in the web UI or with `pulsectl` on the host.

Packages (version **1.0.0**):

- `pulsewatch_1.0.0_all.deb` — Ubuntu / Debian (`apt`)
- `pulsewatch-1.0.0-1.noarch.rpm` — Rocky / Alma / RHEL / Fedora (`dnf`)
- `pulsewatch-1.0.0.tar.gz` — source tree (same installer the packages run)

First install compiles the server on the host (a few minutes, needs outbound HTTPS
to npmjs.org and, if Node 22 is missing, nodejs.org). After that it is a systemd
service on port 3000.

## Ubuntu / Debian (apt)

```bash
sudo apt-get update
sudo apt install ./pulsewatch_1.0.0_all.deb
sudo pulsectl user add admin@company.com --name Admin --role owner
```

`apt install ./file.deb` pulls PostgreSQL. Node.js 22 is used from the system if
it is already ≥ 20; otherwise the package unpacks an official Node 22 runtime
under `/opt/pulsewatch/runtime`.

## Rocky Linux / Alma / RHEL / Fedora (dnf)

```bash
sudo dnf install ./pulsewatch-1.0.0-1.noarch.rpm
sudo pulsectl user add admin@company.com --name Admin --role owner
```

## Source tarball

```bash
tar -xzf pulsewatch-1.0.0.tar.gz
cd pulsewatch-1.0.0
sudo bash packaging/install.sh
sudo pulsectl user add admin@company.com --name Admin --role owner
```

## After install

- UI: `http://<host>:3000` (put nginx/Caddy in front for HTTPS and set `BETTER_AUTH_URL` in `/etc/pulsewatch/pulsewatch.env` to the public URL)
- Logs: `journalctl -u pulsewatch -f`
- Config: `/etc/pulsewatch/pulsewatch.env`
- Data: PostgreSQL database `pulsewatch` (kept on uninstall)

```bash
sudo systemctl enable --now pulsewatch
sudo pulsectl user list
sudo pulsectl status
```

Re-running the package install or `packaging/install.sh` upgrades files and
rebuilds; it does **not** overwrite an existing env file.

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

## VM size

Pulsewatch and PostgreSQL on one VM, **not** on the machines you watch:

- up to ~150 monitors: 1 vCPU / 2 GB RAM / 20 GB SSD
- ~150–300 monitors: 2 vCPU / 2 GB RAM / 40 GB SSD (typical small business)
- ~300–500 monitors: 2 vCPU / 2–4 GB RAM / 40 GB SSD
- ~500–1000 monitors: 2–4 vCPU / 4 GB RAM / 40 GB SSD

Give the box 2 GB RAM before the first install — the compile step is the peak.
Do not use swap as a substitute for RAM. Local SSD/NVMe, not NFS.

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

## Uninstall

```bash
# Debian/Ubuntu — keeps the database and /etc/pulsewatch unless you purge
sudo apt remove pulsewatch
sudo apt purge pulsewatch

# Rocky/RHEL
sudo dnf remove pulsewatch
```

The `pulsewatch` Postgres database is left in place so a reinstall can attach to it if you kept the env file.
