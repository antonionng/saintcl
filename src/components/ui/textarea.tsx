import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] placeholder:text-zinc-500 focus:border-white/18 focus:bg-white/[0.05]",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
