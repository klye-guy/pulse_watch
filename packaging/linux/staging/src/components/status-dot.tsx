import { cn } from "@/lib/utils";
import type { HeartbeatStatus } from "@/lib/types";

export function StatusDot({
  status,
  className,
}: {
  status: HeartbeatStatus | "paused";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        status === "up" && "bg-up",
        status === "down" && "bg-down shadow-[0_0_10px_color-mix(in_oklab,var(--color-down)_50%,transparent)]",
        status === "pending" && "bg-pending",
        status === "paused" && "bg-paused",
        className,
      )}
    />
  );
}

export function statusLabel(
  status: HeartbeatStatus | "paused",
  extra?: { failStreak?: number; maxRetries?: number },
): string {
  if (status === "up") return "Up";
  if (status === "down") return "Down";
  if (status === "paused") return "Paused";
  if (extra?.failStreak && extra.maxRetries) return `Retry ${extra.failStreak}/${extra.maxRetries}`;
  return "Pending";
}
