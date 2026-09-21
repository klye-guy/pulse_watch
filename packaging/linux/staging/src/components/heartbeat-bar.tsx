import { cn } from "@/lib/utils";
import type { Beat } from "@/lib/types";

export function HeartbeatBar({ beats, className }: { beats: Beat[]; className?: string }) {
  const slots = 36;
  const padded: Array<Beat | null> = [...beats];
  while (padded.length < slots) padded.unshift(null);
  const shown = padded.slice(-slots);

  return (
    <div className={cn("flex h-8 items-end gap-px", className)} aria-hidden="true">
      {shown.map((beat, i) => (
        <span
          key={i}
          className={cn(
            "min-w-0 flex-1 rounded-sm",
            beat?.status === "up" && "h-full bg-up",
            beat?.status === "down" && "h-full bg-down",
            beat?.status === "pending" && "h-3/4 bg-pending",
            !beat && "h-1/2 bg-elevated",
          )}
        />
      ))}
    </div>
  );
}
