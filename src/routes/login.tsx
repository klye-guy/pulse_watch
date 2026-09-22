import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getSetupState } from "@/lib/server/fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  loader: async () => {
    try {
      return await getSetupState();
    } catch {
      return { needsSetup: true, allowPublicSignup: false, oauthEnabled: false };
    }
  },
  component: Login,
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  const loaded = Route.useLoaderData();
  const needsSetup = loaded.needsSetup;
  const oauthEnabled = Boolean(loaded.oauthEnabled);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isPending && user) return <Navigate to="/" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Public sign-up is disabled (Kevin #1). First owner: pulsectl user add.
      const { error: err } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      });
      if (err) throw new Error(err.message ?? "Invalid email or password");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-accent)_8%,transparent),transparent)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-lg bg-surface text-accent shadow-[var(--shadow-border)]">
            <Activity className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Pulsewatch</h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Sign in with an established account. New users are added by an administrator.
          </p>
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="grid gap-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label className="grid gap-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-down">{error}</p>}
            <Button className="w-full" type="submit" disabled={busy || !authEnabled}>
              {busy ? "Please wait…" : "Sign in"}
            </Button>
          </form>

          {authEnabled && oauthEnabled && (
            <div className="mt-5">
              <div className="mb-3 flex items-center gap-3 text-xs text-subtle">
                <span className="h-px flex-1 bg-border" />
                or continue with
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-2">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {needsSetup ? (
          <p className="mt-4 text-center text-xs text-subtle">
            Fresh install — create the owner with{" "}
            <code className="font-mono text-muted">pulsectl user add</code> (public sign-up is
            disabled).
          </p>
        ) : (
          <p className="mt-4 text-center text-xs text-subtle">
            Need an account? Ask an owner to add you in Users, or run{" "}
            <code className="font-mono text-muted">pulsectl user add</code>.
          </p>
        )}
      </div>
    </main>
  );
}
