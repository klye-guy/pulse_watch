import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Box, FileArchive, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/download")({ component: DownloadPage });

const VERSION = "1.0.0";
const RELEASE = "3";
const DEB = `pulsewatch_${VERSION}-${RELEASE}_all.deb`;
const RPM = `pulsewatch-${VERSION}-${RELEASE}.noarch.rpm`;
const TAR = `pulsewatch-${VERSION}.tar.gz`;
const ZIP = `pulsewatch-${VERSION}-linux-packages.tar.gz`;

function DownloadPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-lg bg-surface text-accent shadow-[var(--shadow-border)]">
            <Activity className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Pulsewatch {VERSION}</h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Native packages for Ubuntu/Debian and Rocky/Alma/RHEL/Fedora, plus the source
            tarball. Dashboard stays behind login. First owner is created in the browser or
            with <code className="font-mono text-fg">pulsectl</code>.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PackageCard
            title="Ubuntu / Debian"
            filename={DEB}
            hint="apt"
            command={`sudo apt-get update
sudo apt install ./${DEB}
sudo pulsectl user add admin@company.com --name Admin --role owner`}
          />
          <PackageCard
            title="Rocky / RHEL / Fedora"
            filename={RPM}
            hint="dnf"
            command={`curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v${VERSION}/${RPM}
sudo dnf install ./${RPM}
sudo pulsectl user add admin@company.com --name Admin --role owner`}
          />
          <PackageCard
            title="Source tarball"
            filename={TAR}
            hint="install.sh"
            command={`tar -xzf ${TAR}
cd pulsewatch-${VERSION}
sudo bash packaging/install.sh
sudo pulsectl user add admin@company.com --name Admin --role owner`}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Button asChild>
            <a href={`/releases/${ZIP}`} download>
              <FileArchive className="size-4" />
              Download all packages
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/releases/SHA256SUMS" download>
              <Hash className="size-4" />
              SHA256SUMS
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>

        <section className="mt-10 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-medium">After install</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>
              UI at <code className="font-mono text-fg">{"http://<host>:3000"}</code>
            </li>
            <li>
              Config: <code className="font-mono text-fg">/etc/pulsewatch/pulsewatch.env</code>
            </li>
            <li>
              Logs: <code className="font-mono text-fg">journalctl -u pulsewatch -f</code>
            </li>
            <li>
              First install compiles the server (a few minutes, needs outbound HTTPS and about
              2 GB RAM). PostgreSQL is pulled in by the package.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function PackageCard({
  title,
  filename,
  hint,
  command,
}: {
  title: string;
  filename: string;
  hint: string;
  command: string;
}) {
  return (
    <section className="flex flex-col rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="rounded-full bg-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
          {hint}
        </span>
      </div>
      <pre className="mt-3 flex-1 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-[11px] leading-5 text-fg">
        {command}
      </pre>
      <Button asChild className="mt-4 w-full" variant="secondary">
        <a href={`/releases/${filename}`} download>
          <Box className="size-4" />
          {filename}
        </a>
      </Button>
    </section>
  );
}
