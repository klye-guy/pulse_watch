# Install Pulsewatch

Pulsewatch is a private uptime monitor (login-gated dashboard, systemd service,
PostgreSQL). Packages and the source tarball are the same **1.0.0-4** release.

Verify checksums first:

```bash
sha256sum -c SHA256SUMS
```

## Rocky Linux / Alma / RHEL / Fedora (`dnf`)

GitHub release URLs **redirect**. `dnf install https://github.com/...rpm` (and
`curl` without `-L`) often saves an HTML page. DNF then reports:

`Can not load RPM file` / `Could not open the file` / `Failed to install the RPM`

Download the file first, confirm it is an RPM, then install **from the local path**.

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch-1.0.0-4.noarch.rpm
ls -l pulsewatch-1.0.0-4.noarch.rpm
# First bytes must be ed ab ee db — not 3c 21 64 6f ("<!do", an HTML page):
od -An -tx1 -N8 pulsewatch-1.0.0-4.noarch.rpm
sudo dnf install ./pulsewatch-1.0.0-4.noarch.rpm
sudo pulsectl user add admin@company.com --name Admin --role owner
```

Use the full path if the file is not in the current directory
(`/home/you/Downloads/pulsewatch-1.0.0-4.noarch.rpm`). The `./` (or full path)
is required so dnf does not search the distro repos.

If the RPM installed but **the service will not start** and `pulsectl` says the
`pg` package is not available, first-boot never finished (PostgreSQL was not
initialized, so npm never ran). Finish it:

```bash
sudo dnf install -y postgresql-server postgresql
sudo bash /opt/pulsewatch/packaging/linux/configure-instance.sh
sudo systemctl status pulsewatch --no-pager
sudo pulsectl user add admin@company.com --name Admin --role owner
```

Or pull the fixed setup script without reinstalling the RPM:

```bash
curl -fL -o /tmp/configure-instance.sh \
  https://raw.githubusercontent.com/klye-guy/pulse_watch/main/packaging/linux/configure-instance.sh
sudo bash /tmp/configure-instance.sh
```

Helper that does the download + magic check + sha256 + dnf:

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/install-el.sh
sudo bash install-el.sh
```

If the RPM still will not load, use the source tarball below — that installer
calls `dnf` only for PostgreSQL and never needs our `.rpm`.

## Ubuntu / Debian (`apt`)

```bash
sudo apt-get update
sudo apt install ./pulsewatch_1.0.0-4_all.deb
sudo pulsectl user add admin@company.com --name Admin --role owner
```

`apt install ./file.deb` also pulls PostgreSQL. The `./` matters — without it
apt looks in the distro repo instead of the file in the current directory.

## Source tarball (works on Rocky too)

```bash
curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch-1.0.0.tar.gz
tar -xzf pulsewatch-1.0.0.tar.gz
cd pulsewatch-1.0.0
sudo bash packaging/install.sh
sudo pulsectl user add admin@company.com --name Admin --role owner
```

## After install

Open `http://<host>:3000` and sign in with the owner you created (or create the
first owner in the browser — the first account becomes owner).

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

Full operations notes: [packaging/README.md](packaging/README.md).
