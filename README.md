# Pulsewatch

**Document:** Project overview and documentation map  
**Product:** Pulsewatch 1.0.0-6  
**Repository:** [klye-guy/pulse_watch](https://github.com/klye-guy/pulse_watch)  
**Status:** Production release on `main` (tag `v1.0.0`)

Pulsewatch is a private, login-gated uptime monitor for self-hosted Linux servers. It runs as a systemd service with PostgreSQL, a web dashboard on port 3000, and a host CLI (`pulsectl`) for user and backup administration. There is no public sign-up.

## Purpose and scope

This README orients operators and contributors. It does not replace install or packaging procedures.

| Need | Document |
| --- | --- |
| Install (deb / rpm / source) | [INSTALL.md](INSTALL.md) |
| Packaging, ops, VM sizing, `pulsectl`, backup/restore | [packaging/README.md](packaging/README.md) |
| Branch and release workflow | [BRANCHING.md](BRANCHING.md) |
| Reverse-proxy example (nginx) | [packaging/linux/nginx-pulsewatch.conf](packaging/linux/nginx-pulsewatch.conf) |
| License | [LICENSE](LICENSE) |

Release assets for **v1.0.0** (packages, checksums, and install copies):  
https://github.com/klye-guy/pulse_watch/releases/tag/v1.0.0

## Audience

- **Operators** installing or running Pulsewatch on a Linux VM
- **Administrators** managing users, monitors, and backups
- **Contributors** preparing changes on `development` for review

## Quick start (operators)

1. Size the host using the approved VM table in [packaging/README.md](packaging/README.md#vm-size) (give the box **2 GB RAM** before first install — compile is the peak).
2. Follow the matching path in [INSTALL.md](INSTALL.md) for Rocky/Alma/RHEL/Fedora, Ubuntu/Debian, or the source tarball.
3. Create the first owner:

```bash
sudo pulsectl user add admin@company.com --name Admin --role owner --password '********'
```

4. Fresh installs bind Node to loopback (`HOST=127.0.0.1`). Put nginx or Caddy in front for HTTPS, set `BETTER_AUTH_URL` to the public `https://…` origin, and restart `pulsewatch`. Local UI: `http://127.0.0.1:3000`.

After install reference:

| Item | Location |
| --- | --- |
| UI | `http://127.0.0.1:3000` (public access via reverse proxy) |
| Config | `/etc/pulsewatch/pulsewatch.env` |
| Logs | `journalctl -u pulsewatch -f` |
| CLI | `pulsectl` |
| App files | `/opt/pulsewatch` |

## System overview

- **Service:** `pulsewatch` (systemd), default listen port **3000** on loopback (`HOST=127.0.0.1` on fresh installs)
- **Data store:** PostgreSQL database `pulsewatch` (retained across package remove unless purged)
- **Auth:** Better Auth; roles `owner`, `admin`, `editor`, `viewer`; **no public email sign-up** (accounts via `pulsectl`)
- **Checks:** Concurrent pool (default 48 workers), retries before confirmed down, alerts off the check path; on self-host the engine starts at unit boot (see [INSTALL.md](INSTALL.md)); public status pages do not start the engine
- **Proxy:** Keep `HOST=127.0.0.1` behind nginx/Caddy; optional `PULSEWATCH_TRUSTED_PROXIES` (exact IPs; loopback always trusted) — [packaging/linux/nginx-pulsewatch.conf](packaging/linux/nginx-pulsewatch.conf)
- **SSRF default:** monitors and outbound notification URLs deny private/reserved/metadata targets unless `PULSEWATCH_ALLOW_PRIVATE_TARGETS=1`
- **Notifications:** SMTP, webhook, Discord, Slack, Telegram (webhook URLs redacted in the UI)
- **Backup:** JSON export via Settings or `pulsectl backup` / `pulsectl restore` (treat as secret; heartbeat history not included; CLI restore may `try-restart` the unit)

Pulsewatch is intended to remain reliable past the scale where SQLite-based monitors typically slow down (~200–500 monitors). See packaging README for concurrency, retry, and email behavior.

## VM sizing (approved)

Run Pulsewatch and PostgreSQL on one VM, **not** on the machines you monitor. Canonical table (do not diverge in release copies):

| Monitors (approx.) | vCPU | RAM | Disk |
| --- | --- | --- | --- |
| ≤ 150 | 1 | 2 GB | 20 GB SSD |
| 150–300 | 2 | 2 GB | 40 GB SSD |
| 300–500 | 2 | 4 GB | 40 GB SSD |
| 500–1000 | 4 | 4 GB | 40 GB SSD |

Local SSD/NVMe only; do not use swap as a substitute for RAM. Full notes: [packaging/README.md](packaging/README.md#vm-size).

## Development and branching

- **`development`** — ongoing feature and fix work; day-to-day PRs target this branch.
- **`main`** — production-ready only; updates via PR when shipping (typically from `development`).

Do not push commits straight to `main`. Details: [BRANCHING.md](BRANCHING.md).

## Documentation control

- **Owner (docs):** Scriv (Coders group) — documentation only; does not change application code.
- **Build/package:** Cody · **QA gates:** Chuck · **Release coordination:** Karen
- Keep sizing tables and install procedures aligned across root docs, `packaging/README.md`, and release mirrors under `artifacts/releases/` and `public/`.
- Docs PRs: branch from `development` → PR into `development` → Chuck quick-gate → promote to `main` only when shipping.

## License

See [LICENSE](LICENSE).
