import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backupFilename, parseBackup } from "@/lib/backup-format";
import { exportBackupFn, getAccessState, getSiteNameFn, restoreBackupFn, setSiteNameFn } from "@/lib/server/fns";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const site = useQuery({ queryKey: ["site-name"], queryFn: () => getSiteNameFn() });
  const access = useQuery({ queryKey: ["access"], queryFn: () => getAccessState() });
  const [name, setName] = useState("");
  const [replace, setReplace] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; backup: unknown } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (site.data) setName(site.data.siteName);
  }, [site.data]);

  const save = useMutation({
    mutationFn: (value: string) => setSiteNameFn({ data: value }),
    onSuccess: () => {
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: ["site-name"] });
    },
  });

  const download = useMutation({
    mutationFn: () => exportBackupFn(),
    onSuccess: (backup) => {
      const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFilename(backup.exportedAt);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not export"),
  });

  const restore = useMutation({
    mutationFn: restoreBackupFn,
    onSuccess: (result) => {
      setPendingFile(null);
      setReplace(false);
      toast.success(
        `Restored ${result.monitors} monitors, ${result.users} users, ${result.channels} channels`,
      );
      void qc.invalidateQueries();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not restore"),
  });

  const role = access.data?.status === "ok" ? access.data.role : "viewer";
  const canBackup = role === "admin" || role === "owner";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Instance identity, membership, and configuration backups.</p>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="mb-4 text-sm font-medium">This instance</h2>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(name);
          }}
        >
          <label className="grid gap-1.5">
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div>
            <Button type="submit" disabled={save.isPending || role === "viewer" || role === "editor"}>
              Save
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="mb-2 text-sm font-medium">Your access</h2>
        {access.data?.status === "ok" && (
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Role</dt>
              <dd className="font-mono capitalize">{access.data.role}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="font-mono">{access.data.email ?? "—"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="mb-2 text-sm font-medium">Backup & restore</h2>
        <p className="text-sm text-muted">
          One JSON file covers users (including password hashes), monitors, notification channels,
          status pages, and the instance name. Heartbeat history is not included. Treat the file as
          a secret — it contains webhook tokens and hashes.
        </p>

        {canBackup ? (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={download.isPending}
                onClick={() => download.mutate()}
              >
                <Download />
                {download.isPending ? "Preparing…" : "Download backup"}
              </Button>
              <Button type="button" onClick={() => fileRef.current?.click()}>
                <Upload />
                Choose backup file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const parsed = parseBackup(JSON.parse(String(reader.result ?? "")));
                      setPendingFile({ name: file.name, backup: parsed });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not read that JSON file");
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </div>

            {pendingFile && (
              <div className="rounded-lg bg-elevated p-4 shadow-[var(--shadow-border)]">
                <p className="text-sm font-medium">{pendingFile.name}</p>
                <p className="mt-1 text-xs text-muted">
                  Merge updates matching users (by email) and monitors (by id) without deleting
                  anything. Replace wipes monitors, channels, and status pages first, then imports.
                  Users are always merged so you cannot lock yourself out.
                </p>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-accent"
                    checked={replace}
                    onChange={(e) => setReplace(e.target.checked)}
                  />
                  <span>Replace existing monitors, channels, and status pages</span>
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={restore.isPending}
                    onClick={() => {
                      const mode = replace ? "replace" : "merge";
                      if (mode === "replace") {
                        const ok = window.confirm(
                          "Replace will delete current monitors, channels, and status pages, then import this file. Continue?",
                        );
                        if (!ok) return;
                      }
                      restore.mutate({ data: { backup: pendingFile.backup, mode } });
                    }}
                  >
                    {restore.isPending ? "Restoring…" : replace ? "Replace from backup" : "Merge from backup"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setPendingFile(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-subtle">Only admins can export or restore configuration.</p>
        )}
      </section>
    </div>
  );
}
