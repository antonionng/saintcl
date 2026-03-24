import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-white/90 bg-white !text-zinc-950 shadow-[0_12px_30px_rgba(255,255,255,0.08)] hover:border-white hover:bg-white/94 hover:!text-zinc-950 [&]:!text-zinc-950 [&>span]:!text-zinc-950 [&>svg]:!text-zinc-950 [&_svg]:!text-zinc-950 [&_span]:!text-zinc-950 [&_a]:!text-zinc-950",
        secondary:
          "border-white/10 bg-white/[0.04] text-white hover:border-white/16 hover:bg-white/[0.08]",
        ghost: "border-transparent bg-transparent text-white/82 hover:bg-white/[0.05] hover:text-white",
        outline: "border-white/12 bg-transparent text-white hover:border-white/20 hover:bg-white/[0.03]",
      },
      size: {
        default: "h-10 px-4.5",
        sm: "h-8.5 px-3.5 text-[0.82rem]",
        lg: "h-11 px-5 text-[0.95rem]",
        icon: "size-10 rounded-full",
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
