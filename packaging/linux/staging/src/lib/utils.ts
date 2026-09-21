import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "never";
  const delta = Date.now() - then;
  const sec = Math.round(delta / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export function formatPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 99.995) return "100%";
  return `${n.toFixed(2)}%`;
}

export function targetOf(m: {
  type: string;
  url?: string | null;
  hostname?: string | null;
  port?: number | null;
}): string {
  if (m.type === "tcp") return `${m.hostname ?? ""}:${m.port ?? ""}`;
  if (m.type === "ping" || m.type === "dns") return m.hostname ?? m.url ?? "";
  return m.url ?? m.hostname ?? "";
}
