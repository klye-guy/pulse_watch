import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg",
        "placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
