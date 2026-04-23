import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[length:var(--text-xs)] font-medium",
  {
    variants: {
      variant: {
        default: "border-border bg-transparent text-white/85",
        success: "border-emerald-500/30 bg-transparent text-emerald-300",
        warning: "border-amber-500/30 bg-transparent text-amber-300",
        secondary: "border-border-subtle bg-transparent text-white/60",
        destructive: "border-rose-500/30 bg-transparent text-rose-300",
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
