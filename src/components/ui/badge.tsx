import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-1 text-[length:var(--text-xs)] font-medium tracking-[0.04em]",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-2 text-white/88",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
        secondary: "border-white/10 bg-white/5 text-white/70",
        destructive: "border-rose-500/30 bg-rose-500/10 text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
