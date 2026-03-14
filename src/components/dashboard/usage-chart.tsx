"use client";

import { useSyncExternalStore } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function UsageChart({
  data,
}: {
  data: Array<{ name: string; runs: number; messages: number }>;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-sm text-zinc-500">
        Chart loads after hydration to preserve a clean static build.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="runsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#737373" tickLine={false} axisLine={false} />
        <YAxis stroke="#737373" tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#080808",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
          }}
        />
        <Area type="monotone" dataKey="runs" stroke="#ffffff" fill="url(#runsGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
