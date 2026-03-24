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
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <p className="app-kicker">{eyebrow}</p>
        ) : null}
        <div className="space-y-3">
          <h1 className="app-title text-3xl font-semibold text-white sm:text-[2.25rem]">{title}</h1>
          <p className="app-copy text-sm sm:text-[0.96rem]">{description}</p>
        </div>
      </div>
      {action ? <div className="shrink-0 self-start lg:self-auto">{action}</div> : null}
    </div>
  );
}
