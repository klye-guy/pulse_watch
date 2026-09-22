# Install Pulsewatch 1.0.0-5

Private uptime monitor: login-gated dashboard, systemd service, PostgreSQL.

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
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch-1.0.0-5.noarch.rpm
sudo dnf install ./pulsewatch-1.0.0-5.noarch.rpm
```

Use a full path if the RPM is not in the current directory. First install
initializes PostgreSQL, compiles the app (a few minutes, ~2 GB RAM, outbound
HTTPS to npmjs.org), and starts `pulsewatch`.

```bash
sudo pulsectl user add admin@company.com --name Admin --role owner --password '********'
```

## Ubuntu / Debian

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch_1.0.0-5_all.deb
sudo apt-get update
sudo apt install ./pulsewatch_1.0.0-5_all.deb
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
| UI | `http://<host>:3000` |
| Config | `/etc/pulsewatch/pulsewatch.env` |
| Logs | `journalctl -u pulsewatch -f` |
| CLI | `pulsectl` |
| App files | `/opt/pulsewatch` |

Put nginx or Caddy in front for HTTPS, then set `BETTER_AUTH_URL` in the env
file to the public URL and `sudo systemctl restart pulsewatch`.

An example nginx site that sets `X-Real-IP` / `X-Forwarded-For` for Better Auth
rate limits ships at `/opt/pulsewatch/packaging/linux/nginx-pulsewatch.conf`.
Copy it into `sites-available`, enable it, and prefer `HOST=127.0.0.1` so only
the proxy can reach Node on `:3000`. Extra proxy hops: set
`PULSEWATCH_TRUSTED_PROXIES` (comma-separated) in the env file.

Reinstalls keep `/etc/pulsewatch/pulsewatch.env` and the Postgres database.

Full operations notes: [packaging/README.md](packaging/README.md).
