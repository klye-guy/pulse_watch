import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { ShieldOff } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getAccessState } from "@/lib/server/fns";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const sessionUser = await fetchSessionUser();
    if (!sessionUser) throw redirect({ to: "/login" });
    return { sessionUser };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user, isPending } = useCurrentUserState();
  const access = useQuery({
    queryKey: ["access", user?.id],
    queryFn: () => getAccessState(),
    enabled: Boolean(user),
  });

  if (isPending && !user) return <ShellSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (user && access.isPending) return <ShellSkeleton />;
  if (access.data?.status === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-4">
        <div className="w-full max-w-md rounded-xl bg-surface p-6 text-center shadow-[var(--shadow-border)]">
          <ShieldOff className="mx-auto mb-3 size-8 text-muted" />
          <h1 className="text-lg font-medium">Access not granted</h1>
          <p className="mt-2 text-sm text-muted">
            You are signed in as {access.data.email ?? "this account"}, but an administrator has
            not added you to Pulsewatch yet.
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => void signOut("/login")}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }
  if (access.data?.status !== "ok") return <ShellSkeleton />;

  return (
    <AppShell role={access.data.role}>
      <Outlet />
    </AppShell>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden w-60 border-r border-border bg-surface md:block" />
      <div className="flex-1 p-8">
        <h1 className="text-lg font-medium">Pulsewatch</h1>
        <p className="mt-2 text-sm text-muted">Loading dashboard…</p>
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-surface" />
      </div>
    </div>
  );
}
