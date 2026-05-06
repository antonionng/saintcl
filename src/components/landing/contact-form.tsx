"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SubmissionState =
  | { status: "idle"; message: string | null }
  | { status: "submitting"; message: string | null }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ContactForm() {
  const [state, setState] = useState<SubmissionState>({ status: "idle", message: null });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState({ status: "submitting", message: null });

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        teamSize: formData.get("teamSize"),
        useCase: formData.get("useCase"),
        website: formData.get("website"),
      }),
    });

    const body = (await response.json().catch(() => null)) as { data?: { reference?: string }; error?: { message?: string } } | null;
    if (!response.ok) {
      setState({ status: "error", message: body?.error?.message || "We could not add you to the waiting list. Please try again." });
      return;
    }

    form.reset();
    setState({
      status: "success",
      message: `You are on the waiting list${body?.data?.reference ? ` (${body.data.reference})` : ""}. We sent a confirmation and will reach out as access opens.`,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[720px] rounded-[28px] border border-[#24242a] bg-[rgba(13,13,18,0.82)] p-6 text-left shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-[14px] font-medium text-white">
          Name
          <input
            name="name"
            required
            maxLength={120}
            className="w-full rounded-[12px] border border-[#2a2a30] bg-black px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6f6f78] focus:border-white/50"
            placeholder="Your name"
          />
        </label>
        <label className="space-y-2 text-[14px] font-medium text-white">
          Work email
          <input
            name="email"
            type="email"
            required
            maxLength={240}
            className="w-full rounded-[12px] border border-[#2a2a30] bg-black px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6f6f78] focus:border-white/50"
            placeholder="you@company.com"
          />
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-[14px] font-medium text-white">
          Company
          <input
            name="company"
            maxLength={160}
            className="w-full rounded-[12px] border border-[#2a2a30] bg-black px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6f6f78] focus:border-white/50"
            placeholder="Company name"
          />
        </label>
        <label className="space-y-2 text-[14px] font-medium text-white">
          Team size
          <input
            name="teamSize"
            maxLength={80}
            className="w-full rounded-[12px] border border-[#2a2a30] bg-black px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6f6f78] focus:border-white/50"
            placeholder="1-10, 11-50, 51-250..."
          />
        </label>
      </div>
      <label className="mt-4 block space-y-2 text-[14px] font-medium text-white">
        What would you like agents to handle first?
        <textarea
          name="useCase"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className="w-full resize-y rounded-[12px] border border-[#2a2a30] bg-black px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6f6f78] focus:border-white/50"
          placeholder="Tell us about the team, workflow, or tools you want Saint AGI to help with."
        />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <p className="text-[13px] leading-6 text-[#8d8d96]">
          We will email your confirmation and notify the Saint AGI team when you join.
        </p>
        <Button
          type="submit"
          disabled={state.status === "submitting"}
          className="h-12 w-full rounded-[12px] px-7 text-[15px] font-semibold whitespace-nowrap sm:w-auto sm:min-w-[160px]"
        >
          {state.status === "submitting" ? "Joining..." : "Join waiting list"}
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "mt-4 rounded-[12px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[14px] text-rose-200"
              : "mt-4 rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[14px] text-emerald-200"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
