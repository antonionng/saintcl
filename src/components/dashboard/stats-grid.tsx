import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStat } from "@/types";

export function StatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.id}>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{stat.value}</div>
            <p className="mt-2 text-sm text-zinc-500">{stat.delta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
