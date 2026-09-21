import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MonitorForm } from "@/components/monitor-form";
import { saveMonitorFn } from "@/lib/server/fns";
import type { MonitorInput } from "@/lib/types";

export const Route = createFileRoute("/_app/monitors/new")({ component: NewMonitor });

function NewMonitor() {
  const navigate = useNavigate();
  const save = useMutation({
    mutationFn: (input: MonitorInput) => saveMonitorFn({ data: input }),
    onSuccess: (res) => {
      toast.success("Monitor created");
      void navigate({ to: "/monitors/$monitorId", params: { monitorId: res.id } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">New monitor</h1>
      <p className="mt-1 mb-6 text-sm text-muted">HTTP, keyword, TCP, ping, or DNS — checked on the interval you set.</p>
      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <MonitorForm submitting={save.isPending} onSubmit={(input) => save.mutate(input)} />
      </div>
    </div>
  );
}
