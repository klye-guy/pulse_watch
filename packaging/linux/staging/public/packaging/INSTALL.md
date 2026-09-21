# Install Pulsewatch

Pulsewatch is a private uptime monitor (login-gated dashboard, systemd service,
PostgreSQL). Packages and the source tarball are the same 1.0.0 release.

## Ubuntu / Debian (`apt`)

```bash
sudo apt-get update
sudo apt install ./pulsewatch_1.0.0_all.deb
sudo pulsectl user add admin@company.com --name Admin --role owner
```

`apt install ./file.deb` also pulls PostgreSQL. Open `http://<host>:3000` and
sign in with the owner you just created (or create the first owner in the
browser — the first account becomes owner).

## Rocky Linux / Alma / RHEL / Fedora (`dnf`)

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

| What | Where |
| --- | --- |
| UI | `http://<host>:3000` |
| Config | `/etc/pulsewatch/pulsewatch.env` |
| Logs | `journalctl -u pulsewatch -f` |
| CLI | `pulsectl` |
| App files | `/opt/pulsewatch` |

Put nginx or Caddy in front for HTTPS, then set `BETTER_AUTH_URL` in the env
file to the public URL and `sudo systemctl restart pulsewatch`.

The first package install compiles the server on the host (a few minutes). It
needs outbound HTTPS to npmjs.org and, if Node.js 20+ is missing, nodejs.org.
Give the VM **2 GB RAM** for that compile. Reinstalls keep `/etc/pulsewatch/pulsewatch.env`
and the Postgres database.

Verify checksums before you install:

```bash
sha256sum -c SHA256SUMS
```

Full operations notes: [packaging/README.md](packaging/README.md).
