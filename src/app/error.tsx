"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-[length:var(--text-xs)] uppercase tracking-[0.14em] text-white/45">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
          We could not load this workspace view.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[length:var(--text-sm)] leading-6 text-zinc-400">
          Try again, or return to the workspace while we recover this request.
        </p>
        {error.digest ? (
          <p className="mt-3 text-[length:var(--text-xs)] text-zinc-500">Error reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/workspace">Go to workspace</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
