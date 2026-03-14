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
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/14 bg-white/[0.02] px-6 py-16 text-center",
        className,
      )}
    >
      <div className="rounded-full border border-white/10 bg-white/5 p-4">
        <Icon className="size-6 text-zinc-500" />
      </div>
      <h3 className="mt-5 text-lg font-medium tracking-tight text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-7 text-zinc-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
