import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] placeholder:text-zinc-500 focus:border-white/18 focus:bg-white/[0.05]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
