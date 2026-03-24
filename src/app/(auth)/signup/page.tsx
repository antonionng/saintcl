"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";
import { getPlanDisplayName, getPlanIntervalLabel, normalizePlanTier } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = normalizePlanTier(searchParams.get("plan"));
  const selectedInterval = searchParams.get("interval") === "annual" ? "annual" : "monthly";
  const nextPath = searchParams.get("next");
  const [form, setForm] = useState({
    orgName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!isSupabaseConfigured()) {
      router.push("/dashboard");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase client is not configured.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          org_name: form.orgName,
          trial_plan: selectedPlan,
          billing_interval: selectedInterval,
        },
        emailRedirectTo: `${window.location.origin}/callback${nextPath && nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : ""}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/auth/landing");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create workspace"
      description={`Start a 14-day ${getPlanDisplayName(selectedPlan)} trial billed ${getPlanIntervalLabel(selectedInterval).toLowerCase()} if you upgrade.`}
      footer={
        <>
          Already have access?{" "}
          <Link
            className="text-white transition-colors hover:text-zinc-200"
            href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          >
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-300">
          <p className="text-white">
            Selected plan: {getPlanDisplayName(selectedPlan)} ({getPlanIntervalLabel(selectedInterval)})
          </p>
          <p className="mt-2 text-zinc-400">
            No credit card is required to start. Your workspace begins on a 14-day trial with one agent.
          </p>
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Organization name</label>
          <Input
            value={form.orgName}
            onChange={(event) => setForm((current) => ({ ...current, orgName: event.target.value }))}
            placeholder="Organization name"
          />
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Email</label>
          <Input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            type="email"
            placeholder="Email"
          />
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Password</label>
          <Input
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            type="password"
            placeholder="Password"
          />
        </div>
        {!isSupabaseConfigured() ? (
          <p className="text-sm leading-6 text-zinc-500">
            Supabase keys are not set. Submitting will open the dashboard in demo mode.
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating workspace..." : "Create workspace"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Create workspace" description="Loading signup..." footer={null}>
          <div className="h-56" />
        </AuthShell>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
