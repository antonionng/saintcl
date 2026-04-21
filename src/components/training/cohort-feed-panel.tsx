"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { TrainingCohortPostRecord } from "@/types";

type FeedResponse = {
  data?: {
    cohortId: string;
    currentParticipantId: string;
    posts: TrainingCohortPostRecord[];
  };
  error?: { message?: string };
};

type PostResponse = {
  data?: { post: TrainingCohortPostRecord };
  error?: { message?: string };
};

const RELATIVE_FORMATTER =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    : null;

function formatRelative(iso: string) {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffSeconds = Math.round((ts - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  if (!RELATIVE_FORMATTER) {
    return new Date(iso).toLocaleString();
  }
  if (abs < 60) return RELATIVE_FORMATTER.format(diffSeconds, "second");
  if (abs < 3600) return RELATIVE_FORMATTER.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400) return RELATIVE_FORMATTER.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 604_800) return RELATIVE_FORMATTER.format(Math.round(diffSeconds / 86_400), "day");
  return new Date(iso).toLocaleDateString();
}

function authorInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CohortFeedPanel({
  inviteCode,
  cohortName,
  initialPosts,
  currentParticipantId,
}: {
  inviteCode: string;
  cohortName: string | null;
  initialPosts: TrainingCohortPostRecord[];
  currentParticipantId: string;
}) {
  const [posts, setPosts] = useState<TrainingCohortPostRecord[]>(initialPosts);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/training/participant/feed?inviteCode=${encodeURIComponent(inviteCode)}&limit=50`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as FeedResponse;
        if (cancelled || !payload.data) return;
        setPosts(payload.data.posts);
      } catch {
        // ignore polling errors silently; the next tick will retry
      }
    }, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [inviteCode]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const response = await fetch(
        `/api/training/participant/feed?inviteCode=${encodeURIComponent(inviteCode)}&limit=50`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as FeedResponse;
      if (response.ok && payload.data) {
        setPosts(payload.data.posts);
      } else {
        setError(payload.error?.message ?? "Could not refresh the feed.");
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length === 0) return;

    setPosting(true);
    setError(null);

    const response = await fetch("/api/training/participant/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode, body: trimmed }),
    });

    const payload = (await response.json()) as PostResponse;
    if (!response.ok || !payload.data?.post) {
      setError(payload.error?.message ?? "We could not post your message.");
      setPosting(false);
      return;
    }

    setPosts((current) => [payload.data!.post, ...current]);
    setBody("");
    setPosting(false);
  }

  const trimmedLength = body.trim().length;
  const remaining = 2000 - trimmedLength;
  const canPost = trimmedLength > 0 && !posting;

  return (
    <Card className="overflow-hidden border-white/8 bg-black/10">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10"
        >
          <FeedIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white">Cohort feed</p>
          <p className="truncate text-[11px] text-zinc-500">
            {cohortName
              ? `Visible to ${cohortName} and the facilitator.`
              : "Visible to your cohort and the facilitator."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-50"
          disabled={refreshing}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${refreshing ? "bg-sky-300 animate-pulse" : "bg-zinc-400"}`}
          />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>
      <div className="space-y-5 px-5 py-5">
        <form className="space-y-phi-3" onSubmit={handleSubmit}>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Post a short note. A win, a question, something blocking you, or just a hello."
          />
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-phi-3">
            <p
              className={`text-[11px] tabular-nums ${remaining < 100 ? "text-amber-300" : "text-zinc-500"}`}
            >
              {trimmedLength.toLocaleString()} / 2,000
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!canPost}
              className="shrink-0 whitespace-nowrap"
            >
              {posting ? "Posting" : "Post to feed"}
            </Button>
          </div>
        </form>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-8 text-center">
            <div
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full bg-white/[0.03] text-zinc-500 ring-1 ring-white/8"
            >
              <FeedIcon />
            </div>
            <p className="text-sm text-zinc-300">It is quiet in here</p>
            <p className="text-[12px] text-zinc-500">
              Be the first to post. A win, a question, or just a hello works.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => {
              const isMine = post.participantId === currentParticipantId;
              const isFacilitator = post.author.kind === "facilitator";
              return (
                <li
                  key={post.id}
                  className={`rounded-xl border px-4 py-3 ${
                    isFacilitator
                      ? "border-sky-400/20 bg-sky-400/[0.05]"
                      : isMine
                        ? "border-emerald-400/20 bg-emerald-400/[0.05]"
                        : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ${
                        isFacilitator
                          ? "bg-sky-400/15 text-sky-100 ring-sky-400/30"
                          : isMine
                            ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/30"
                            : "bg-white/[0.06] text-zinc-200 ring-white/10"
                      }`}
                    >
                      {authorInitials(post.author.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-white">
                          {post.author.displayName}
                        </span>
                        {isMine ? (
                          <span className="rounded bg-emerald-400/10 px-1 text-[9px] uppercase tracking-[0.14em] text-emerald-200">
                            You
                          </span>
                        ) : null}
                        {isFacilitator ? (
                          <span className="rounded bg-sky-400/10 px-1 text-[9px] uppercase tracking-[0.14em] text-sky-200">
                            Facilitator
                          </span>
                        ) : null}
                        {post.author.roleAtCompany ? (
                          <span className="text-[11px] text-zinc-500">{post.author.roleAtCompany}</span>
                        ) : null}
                        <span className="ml-auto text-[11px] text-zinc-500">{formatRelative(post.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{post.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

function FeedIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4 text-zinc-300">
      <circle cx="3.5" cy="12.5" r="1" fill="currentColor" />
      <path
        d="M2.5 8.5a5 5 0 0 1 5 5M2.5 4.5a9 9 0 0 1 9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
