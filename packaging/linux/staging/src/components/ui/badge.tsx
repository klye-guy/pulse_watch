import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
  {
    variants: {
      tone: {
        up: "bg-up/15 text-up",
        down: "bg-down/15 text-down",
        pending: "bg-pending/15 text-pending",
        paused: "bg-paused/15 text-paused",
        muted: "bg-elevated text-muted",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
