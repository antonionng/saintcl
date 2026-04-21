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
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-phi-8 py-phi-13 text-center",
        className,
      )}
    >
      <div className="rounded-md border border-border-subtle bg-surface-2 p-phi-3">
        <Icon className="size-5 text-zinc-400" />
      </div>
      <h3 className="mt-phi-5 text-[length:var(--text-lg)] font-medium tracking-[-0.02em] text-white">{title}</h3>
      <p className="mt-phi-2 max-w-sm text-[length:var(--text-sm)] leading-relaxed text-zinc-400">{description}</p>
      {action ? <div className="mt-phi-5">{action}</div> : null}
    </div>
  );
}
