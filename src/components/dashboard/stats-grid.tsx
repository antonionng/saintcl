import type { DashboardStat } from "@/types";

export function StatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.015)]"
        >
          <p className="text-[0.74rem] font-medium uppercase tracking-[0.16em] text-zinc-500">
            {stat.label}
          </p>
          <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">{stat.value}</div>
          <p className="mt-2 text-sm text-zinc-400">{stat.delta}</p>
        </div>
      ))}
    </div>
  );
}
