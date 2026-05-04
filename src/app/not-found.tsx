import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-[length:var(--text-xs)] uppercase tracking-[0.14em] text-white/45">
          Page not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
          This page is not available.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[length:var(--text-sm)] leading-6 text-zinc-400">
          The link may be old, or the resource may have been removed from this workspace.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/workspace">Go to workspace</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/agents">View agents</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
