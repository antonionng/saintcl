import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm border text-center text-[length:var(--text-sm)] font-medium leading-none transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-white/40",
  {
    variants: {
      variant: {
        default:
          "border-white bg-white !text-zinc-950 hover:bg-white/90 [&_svg]:!text-zinc-950 [&_span]:!text-zinc-950",
        secondary:
          "border-border bg-transparent text-white hover:bg-white/5 hover:border-border-strong",
        ghost: "border-transparent bg-transparent text-white/70 hover:bg-white/5 hover:text-white",
        outline: "border-border bg-transparent text-white hover:bg-white/5 hover:border-border-strong",
        destructive:
          "border-rose-500/40 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/60",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[length:var(--text-xs)]",
        lg: "h-10 px-5 text-[length:var(--text-base)]",
        icon: "size-9 rounded-sm",
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
