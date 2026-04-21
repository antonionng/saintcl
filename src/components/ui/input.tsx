import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border border-border bg-surface-2 px-phi-5 py-phi-2 text-[length:var(--text-sm)] text-white placeholder:text-zinc-500 focus:border-border-strong focus:bg-surface-3",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
