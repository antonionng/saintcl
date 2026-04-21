import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const cardVariants = {
  default: "border border-border bg-surface-2 shadow-[var(--shadow-card)]",
  inset: "border border-border-subtle bg-surface-1",
} as const;

export function Card({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof cardVariants }) {
  return (
    <div
      className={cn("rounded-lg", cardVariants[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-phi-2 p-phi-5 lg:p-phi-8", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[length:var(--text-lg)] font-semibold tracking-[-0.02em] text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[length:var(--text-sm)] leading-relaxed text-zinc-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-phi-5 pt-0 lg:p-phi-8 lg:pt-0", className)} {...props} />;
}
