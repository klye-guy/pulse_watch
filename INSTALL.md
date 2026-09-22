# Install Pulsewatch 1.0.0-6

Private uptime monitor: login-gated dashboard, systemd service, PostgreSQL.
**No public email sign-up** — create the first owner (and further accounts) with
`pulsectl` on the host.

Release assets: [github.com/klye-guy/pulse_watch/releases/tag/v1.0.0](https://github.com/klye-guy/pulse_watch/releases/tag/v1.0.0)

```bash
sha256sum -c SHA256SUMS
```

## Rocky Linux / Alma / RHEL / Fedora

Download the file, then install from the local path. Do not pass the GitHub URL
to `dnf install` (redirects can save an HTML page as `.rpm`).

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/install-el.sh
sudo bash install-el.sh
```

Or:

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch-1.0.0-6.noarch.rpm
sudo dnf install ./pulsewatch-1.0.0-6.noarch.rpm
```

Use a full path if the RPM is not in the current directory. First install
initializes PostgreSQL, compiles the app (a few minutes, ~2 GB RAM, outbound
HTTPS to npmjs.org), and starts `pulsewatch`.

```bash
sudo pulsectl user add admin@company.com --name Admin --role owner --password '********'
```

## Ubuntu / Debian

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch_1.0.0-6_all.deb
sudo apt-get update
sudo apt install ./pulsewatch_1.0.0-6_all.deb
sudo pulsectl user add admin@company.com --name Admin --role owner --password '********'
```

## Source tarball

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch-1.0.0.tar.gz
tar -xzf pulsewatch-1.0.0.tar.gz
cd pulsewatch-1.0.0
sudo bash packaging/install.sh
sudo pulsectl user add admin@company.com --name Admin --role owner --password '********'
```

## After install

| What | Where |
| --- | --- |
| UI | `http://127.0.0.1:3000` (loopback; use the reverse proxy for public access) |
| Config | `/etc/pulsewatch/pulsewatch.env` |
| Logs | `journalctl -u pulsewatch -f` |
| CLI | `pulsectl` |
| App files | `/opt/pulsewatch` |

**Monitor engine:** On packaged self-host (`PULSEWATCH_SELFHOST=1`), the check
engine starts when the `pulsewatch` unit boots — you do not need to open the
dashboard first. Public status pages do not start the engine.

Fresh installs write `HOST=127.0.0.1` so Node only listens on loopback. Put
nginx or Caddy in front for **HTTPS**, set `BETTER_AUTH_URL` in
`/etc/pulsewatch/pulsewatch.env` to the public `https://…` origin (must match
what browsers use), then `sudo systemctl restart pulsewatch`.

**Reverse proxy:** Use the sample at
`/opt/pulsewatch/packaging/linux/nginx-pulsewatch.conf` (sets `X-Real-IP` for
Better Auth rate limits). Keep `HOST=127.0.0.1` so only the proxy can reach
Node on `:3000`. Extra proxy hops: set `PULSEWATCH_TRUSTED_PROXIES` to exact
proxy IPs (comma/whitespace); loopback is always trusted.

**Private / reserved targets (SSRF default):** Monitor checks and outbound
notification URLs (webhook, Discord, Slack) refuse loopback, RFC1918,
link-local, and cloud metadata addresses. Set
`PULSEWATCH_ALLOW_PRIVATE_TARGETS=1` only if you intentionally allow those
targets.

**After restore:** UI restore immediately kicks due checks. `pulsectl restore`
best-effort runs `systemctl try-restart pulsewatch` when the unit is active
(may briefly restart the service).

Reinstalls keep `/etc/pulsewatch/pulsewatch.env` and the Postgres database.

Full operations notes: [packaging/README.md](packaging/README.md).
