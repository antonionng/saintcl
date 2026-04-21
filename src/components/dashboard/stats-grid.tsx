import type { DashboardStat } from "@/types";

export function StatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-phi-5 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="rounded-lg border border-border-subtle bg-surface-2 px-phi-5 py-phi-5"
        >
          <p className="text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-zinc-500">
            {stat.label}
          </p>
          <div className="mt-phi-3 text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] text-white">{stat.value}</div>
          <p className="mt-phi-2 text-[length:var(--text-sm)] text-zinc-400">{stat.delta}</p>
        </div>
      ))}
    </div>
  );
}
