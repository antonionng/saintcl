import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border text-[length:var(--text-sm)] font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-white/90 bg-white !text-zinc-950 hover:border-white hover:bg-white/94 hover:!text-zinc-950 [&]:!text-zinc-950 [&>span]:!text-zinc-950 [&>svg]:!text-zinc-950 [&_svg]:!text-zinc-950 [&_span]:!text-zinc-950 [&_a]:!text-zinc-950",
        secondary:
          "border-border bg-surface-2 text-white hover:border-border-strong hover:bg-surface-3",
        ghost: "border-transparent bg-transparent text-white/82 hover:bg-surface-2 hover:text-white",
        outline: "border-border bg-transparent text-white hover:border-border-strong hover:bg-surface-1",
      },
      size: {
        default: "h-10 px-phi-5",
        sm: "h-8.5 px-phi-3 text-[length:var(--text-sm)]",
        lg: "h-11 px-phi-5 text-[length:var(--text-base)]",
        icon: "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
