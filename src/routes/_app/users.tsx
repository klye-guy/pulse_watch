import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMemberFn, listMembersFn, removeMemberFn, setMemberPasswordFn, setMemberRoleFn } from "@/lib/server/fns";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

const ROLES: Role[] = ["admin", "editor", "viewer"];

function UsersPage() {
  const qc = useQueryClient();
  const members = useQuery({ queryKey: ["members"], queryFn: () => listMembersFn() });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("editor");

  const add = useMutation({
    mutationFn: addMemberFn,
    onSuccess: () => {
      toast.success("User added");
      setEmail("");
      setName("");
      setPassword("");
      void qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not add user"),
  });
  const roleMut = useMutation({
    mutationFn: setMemberRoleFn,
    onSuccess: () => {
      toast.success("Role updated");
      void qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not change role"),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeMemberFn({ data: userId }),
    onSuccess: () => {
      toast.success("User removed");
      void qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove"),
  });
  const passwd = useMutation({
    mutationFn: setMemberPasswordFn,
    onSuccess: () => toast.success("Password set"),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not set password"),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Only established members can open the dashboard. Add people here or with{" "}
          <code className="font-mono text-fg">pulsectl user add</code> on the host.
        </p>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="mb-4 text-sm font-medium">Add user</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate({ data: { email, name, password: password || undefined, role } });
          }}
        >
          <label className="grid gap-1.5">
            <Label>Email</Label>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <Label>Password (required for new accounts)</Label>
            <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <Label>Role</Label>
            <select
              className="h-10 rounded-md border border-border bg-bg px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? "Adding…" : "Add user"}
            </Button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Login</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {(members.data ?? []).map((u) => (
              <tr key={u.userId} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="font-mono text-xs text-subtle">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  {u.role === "owner" ? (
                    <span className="text-accent">owner</span>
                  ) : (
                    <select
                      className="h-9 rounded-md border border-border bg-bg px-2"
                      value={u.role}
                      onChange={(e) =>
                        roleMut.mutate({ data: { userId: u.userId, role: e.target.value as Role } })
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{u.hasPassword ? "password" : "sso"}</td>
                <td className="px-4 py-3 text-right">
                  {u.role !== "owner" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const next = window.prompt(`New password for ${u.email}`);
                          if (next) passwd.mutate({ data: { userId: u.userId, password: next } });
                        }}
                      >
                        Password
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Remove ${u.email} from Pulsewatch?`)) remove.mutate(u.userId);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
