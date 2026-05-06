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

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        subject: formData.get("subject"),
        message: formData.get("message"),
        website: formData.get("website"),
      }),
    });

    const body = (await response.json().catch(() => null)) as { data?: { reference?: string }; error?: { message?: string } } | null;
    if (!response.ok) {
      setState({ status: "error", message: body?.error?.message || "We could not send your request. Please try again." });
      return;
    }

    form.reset();
    setState({
      status: "success",
      message: `Thanks. We have your request${body?.data?.reference ? ` (${body.data.reference})` : ""} and will be in touch.`,
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
          Email
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
          Subject
          <input
            name="subject"
            required
            maxLength={180}
            className="w-full rounded-[12px] border border-[#2a2a30] bg-black px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6f6f78] focus:border-white/50"
            placeholder="What do you need?"
          />
        </label>
      </div>
      <label className="mt-4 block space-y-2 text-[14px] font-medium text-white">
        Message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className="w-full resize-y rounded-[12px] border border-[#2a2a30] bg-black px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6f6f78] focus:border-white/50"
          placeholder="Tell us what you want to build, buy, fix, or ask."
        />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <p className="text-[13px] leading-6 text-[#8d8d96]">
          We will email you a confirmation and route urgent requests to the Saint AGI team.
        </p>
        <Button
          type="submit"
          disabled={state.status === "submitting"}
          className="h-12 w-full rounded-[12px] px-7 text-[15px] font-semibold whitespace-nowrap sm:w-auto sm:min-w-[160px]"
        >
          {state.status === "submitting" ? "Sending..." : "Send request"}
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
