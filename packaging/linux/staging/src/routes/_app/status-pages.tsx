import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deletePageFn, listMonitorsFn, listPagesFn, savePageFn } from "@/lib/server/fns";

export const Route = createFileRoute("/_app/status-pages")({ component: StatusPages });

function StatusPages() {
  const qc = useQueryClient();
  const pages = useQuery({ queryKey: ["pages"], queryFn: () => listPagesFn() });
  const monitors = useQuery({ queryKey: ["monitors"], queryFn: () => listMonitorsFn() });
  const [title, setTitle] = useState("Service status");
  const [slug, setSlug] = useState("public");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const save = useMutation({
    mutationFn: savePageFn,
    onSuccess: () => {
      toast.success("Status page saved");
      void qc.invalidateQueries({ queryKey: ["pages"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePageFn({ data: id }),
    onSuccess: () => {
      toast.success("Removed");
      void qc.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Status pages</h1>
        <p className="mt-1 text-sm text-muted">
          Public pages do not require a login. The dashboard itself stays private.
        </p>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="mb-4 text-sm font-medium">Create page</h2>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              data: { title, slug, description, published: true, monitorIds: selected },
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <Label>Title</Label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <Label>Slug</Label>
              <Input required value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid gap-1.5">
            <Label>Monitors</Label>
            <div className="grid gap-1 sm:grid-cols-2">
              {(monitors.data ?? []).map((m) => {
                const on = selected.includes(m.id);
                return (
                  <label key={m.id} className="flex h-10 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-accent"
                      checked={on}
                      onChange={() =>
                        setSelected((cur) => (on ? cur.filter((id) => id !== m.id) : [...cur, m.id]))
                      }
                    />
                    {m.name}
                  </label>
                );
              })}
            </div>
          </div>
          <Button type="submit" disabled={save.isPending}>
            Publish page
          </Button>
        </form>
      </section>

      <section className="space-y-2">
        {(pages.data ?? []).map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
          >
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="font-mono text-xs text-subtle">/s/{p.slug}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" asChild>
                <Link to="/s/$slug" params={{ slug: p.slug }}>
                  Open
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
