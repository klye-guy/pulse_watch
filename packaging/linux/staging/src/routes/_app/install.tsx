import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/install")({ component: InstallPage });

const VERSION = "1.0.0";
const RELEASE = "4";
const DEB = `pulsewatch_${VERSION}-${RELEASE}_all.deb`;
const RPM = `pulsewatch-${VERSION}-${RELEASE}.noarch.rpm`;
const TAR = `pulsewatch-${VERSION}.tar.gz`;

function InstallPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Install on Linux</h1>
        <p className="mt-1 text-sm text-muted">
          Native packages for Ubuntu/Debian (<code className="font-mono">apt</code>) and
          Rocky/Alma/RHEL/Fedora (<code className="font-mono">dnf</code>), plus a source
          tarball. The dashboard stays behind login; users are created here or with{" "}
          <code className="font-mono">pulsectl</code>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PackageCard
          title="Ubuntu / Debian"
          filename={DEB}
          command={`sudo apt-get update
sudo apt install ./${DEB}`}
        />
        <PackageCard
          title="Rocky / RHEL / Fedora"
          filename={RPM}
          command={`curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v${VERSION}/${RPM}
sudo dnf install ./${RPM}`}
        />
        <PackageCard
          title="Source tarball"
          filename={TAR}
          command={`tar -xzf ${TAR}
cd pulsewatch-${VERSION}
sudo bash packaging/install.sh`}
        />
      </div>

      <p className="text-xs text-muted">
        First install compiles the server (a few minutes) and needs outbound HTTPS. After
        that it is a systemd unit on port 3000.{" "}
        <a className="underline underline-offset-2" href="/releases/SHA256SUMS" download>
          SHA256SUMS
        </a>
      </p>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">After install</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs leading-6 text-fg">
{`sudo pulsectl user add admin@company.com --name Admin --role owner
sudo systemctl enable --now pulsewatch
journalctl -u pulsewatch -f`}
        </pre>
        <p className="mt-3 text-sm text-muted">
          UI at <code className="font-mono">{"http://<host>:3000"}</code>. Config:{" "}
          <code className="font-mono">/etc/pulsewatch/pulsewatch.env</code>. For HTTPS, put
          nginx/Caddy in front and set <code className="font-mono">BETTER_AUTH_URL</code> to
          the public URL.
        </p>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">User management from the terminal</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs leading-6 text-fg">
{`pulsectl user add jane@ops.example --name Jane --password '********' --role editor
pulsectl user list
pulsectl user role jane@ops.example viewer
pulsectl user passwd jane@ops.example
pulsectl user delete jane@ops.example
pulsectl backup /var/backups/pulsewatch.json
pulsectl restore /var/backups/pulsewatch.json`}
        </pre>
        <p className="mt-3 text-sm text-muted">
          <code className="font-mono">pulsectl</code> reads{" "}
          <code className="font-mono">/etc/pulsewatch/pulsewatch.env</code> and writes the
          same tables the web UI uses. No public sign-up. Admins can also download and
          restore this JSON from Settings.
        </p>
      </section>
    </div>
  );
}

function PackageCard({
  title,
  filename,
  command,
}: {
  title: string;
  filename: string;
  command: string;
}) {
  return (
    <section className="flex flex-col rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <h2 className="text-sm font-medium">{title}</h2>
      <pre className="mt-3 flex-1 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-[11px] leading-5 text-fg">
        {command}
      </pre>
      <Button asChild className="mt-4 w-full" variant="secondary">
        <a href={`/releases/${filename}`} download>
          Download {filename}
        </a>
      </Button>
    </section>
  );
}
