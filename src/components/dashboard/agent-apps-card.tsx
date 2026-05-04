import Link from "next/link";
import { Cable, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export type AgentAppBinding = {
  id: string;
  appId: string;
  name?: string | null;
  description?: string | null;
  status?: string | null;
};

export function AgentAppsCard({
  agentId,
  bindings = [],
}: {
  agentId: string;
  bindings?: AgentAppBinding[];
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Connected apps</h2>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/apps?agent=${agentId}`}>
            <Plus className="size-4" />
            <span>Add app</span>
          </Link>
        </Button>
      </div>

      {bindings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle p-5 text-sm text-zinc-400">
          <Cable className="mb-2 size-4 text-zinc-500" />
          <p>No apps connected yet. Add channels, search providers, skills, and tools from Connect.</p>
          <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
            <Link href={`/apps?agent=${agentId}`}>Open Connect</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {bindings.map((binding) => (
            <li
              key={binding.id}
              className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-1 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{binding.name ?? binding.appId}</p>
                {binding.description ? (
                  <p className="text-xs text-zinc-500">{binding.description}</p>
                ) : null}
              </div>
              {binding.status ? (
                <span className="text-xs uppercase tracking-[0.08em] text-zinc-500">{binding.status}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
