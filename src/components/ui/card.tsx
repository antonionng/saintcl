import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const cardVariants = {
  default: "border border-border bg-transparent",
  inset: "border border-border-subtle bg-transparent",
} as const;

export function Card({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof cardVariants }) {
  return (
    <div
      className={cn("rounded-md", cardVariants[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 border-b border-border-subtle", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[length:var(--text-base)] font-medium tracking-[-0.01em] text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[length:var(--text-sm)] text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-2 p-5 border-t border-border-subtle", className)} {...props} />;
}
