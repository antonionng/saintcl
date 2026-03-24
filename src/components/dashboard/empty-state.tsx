import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
        <Icon className="size-5 text-zinc-400" />
      </div>
      <h3 className="mt-5 text-lg font-medium tracking-[-0.03em] text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-7 text-zinc-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
