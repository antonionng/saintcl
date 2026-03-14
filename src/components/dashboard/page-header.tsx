import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold uppercase tracking-[-0.04em] text-white">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400">{description}</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
