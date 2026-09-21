import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Download,
  LayoutGrid,
  Menu,
  Plus,
  Radio,
  Settings,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet, SheetContent } from "./ui/sheet";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, min: "viewer" },
  { to: "/monitors/new", label: "New monitor", icon: Plus, min: "editor" },
  { to: "/status-pages", label: "Status pages", icon: Radio, min: "viewer" },
  { to: "/notifications", label: "Notifications", icon: Bell, min: "viewer" },
  { to: "/users", label: "Users", icon: Users, min: "admin" },
  { to: "/settings", label: "Settings", icon: Settings, min: "viewer" },
  { to: "/install", label: "Install", icon: Download, min: "admin" },
] as const;

const RANK = { viewer: 0, editor: 1, admin: 2, owner: 3 };

type NavItem = (typeof NAV)[number];

export function AppShell({ children, role }: { children: ReactNode; role: Role }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((item) => RANK[role] >= RANK[item.min]);

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <Brand />
        <NavList items={items} pathname={pathname} />
        <div className="mt-auto border-t border-border p-3">
          <UserButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <Link to="/" className="flex items-center gap-2 font-medium">
            <Activity className="size-4 text-accent" />
            Pulsewatch
          </Link>
          <div className="ml-auto">
            <UserButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-5 md:px-8 md:py-7">{children}</main>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <Brand />
          <NavList items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
          <p className="mt-auto px-2 text-xs text-subtle">{user?.primaryEmail}</p>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-4 py-5">
      <span className="grid size-8 place-items-center rounded-md bg-elevated text-accent shadow-[var(--shadow-border)]">
        <Activity className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold tracking-tight">Pulsewatch</span>
        <span className="block text-xs text-subtle">Private monitoring</span>
      </span>
    </Link>
  );
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {items.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
              active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
