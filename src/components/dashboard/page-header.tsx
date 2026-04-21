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
    <div className={cn("flex flex-col gap-phi-5 pb-phi-8 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="app-kicker mb-phi-2">{eyebrow}</p>
        ) : null}
        <h1 className="app-title text-[length:var(--text-xl)] font-semibold tracking-[-0.03em] text-white sm:text-[length:var(--text-2xl)]">{title}</h1>
        <p className="app-copy mt-phi-3 text-[length:var(--text-sm)] sm:text-[length:var(--text-base)]">{description}</p>
      </div>
      {action ? <div className="shrink-0 self-start lg:self-auto">{action}</div> : null}
    </div>
  );
}
