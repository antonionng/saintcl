"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { USE_CASES, type UseCaseId } from "@/lib/use-cases";
import { isSupabaseConfigured } from "@/lib/env";
import { getPlanDisplayName, getPlanIntervalLabel, normalizePlanTier, TRIAL_LENGTH_DAYS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Step = "account" | "use-case" | "team-size";

const TEAM_SIZES = [
  { id: "solo", label: "Just me", hint: "Founder or operator" },
  { id: "2-10", label: "2 to 10", hint: "Small team or startup" },
  { id: "10-50", label: "10 to 50", hint: "Growing company" },
  { id: "50+", label: "50+", hint: "Larger organization" },
] as const;

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = normalizePlanTier(searchParams.get("plan"));
  const selectedInterval = searchParams.get("interval") === "annual" ? "annual" : "monthly";
  const nextPath = searchParams.get("next");
  const templateId = searchParams.get("template");
  const [step, setStep] = useState<Step>("account");
  const [form, setForm] = useState({
    fullName: "",
    orgName: "",
    email: "",
    password: "",
  });
  const [useCase, setUseCase] = useState<UseCaseId | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function goNext() {
    setError(null);
    if (step === "account") {
      if (!form.email || !form.password || !form.orgName) {
        setError("Add your name, organization, email, and password to continue.");
        return;
      }
      setStep("use-case");
      return;
    }
    if (step === "use-case") {
      if (!useCase) {
        setError("Choose the first workflow you want to improve.");
        return;
      }
      setStep("team-size");
      return;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "team-size") {
      goNext();
      return;
    }
    setError(null);
    setLoading(true);

    if (!isSupabaseConfigured()) {
      router.push("/workspace");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Account services are not configured.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          org_name: form.orgName,
          full_name: form.fullName,
          use_case: useCase ?? undefined,
          team_size: teamSize ?? undefined,
          template_id: templateId ?? undefined,
          trial_plan: selectedPlan,
          billing_interval: selectedInterval,
        },
        emailRedirectTo: `${window.location.origin}/callback${
          nextPath && nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : "?next=%2Fworkspace"
        }`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const destination =
      nextPath && nextPath.startsWith("/") ? nextPath : "/workspace";
    window.location.assign(`${window.location.origin}${destination}`);
  }

  const stepIndex = step === "account" ? 0 : step === "use-case" ? 1 : 2;
  const stepTitle =
    step === "account"
      ? "Create your account"
      : step === "use-case"
        ? "Where should your first agent help?"
        : "How big is your team?";
  const stepDescription =
    step === "account"
      ? `Start a ${TRIAL_LENGTH_DAYS}-day ${getPlanDisplayName(selectedPlan)} trial. No credit card required.`
      : step === "use-case"
        ? "Choose a proven workflow. Saint AGI will set up the first governed agent around it."
        : "This helps us prepare sensible defaults for access, policy, and rollout.";

  return (
    <AuthShell
      title={stepTitle}
      description={stepDescription}
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
      <div className="mb-5 flex items-center gap-2">
        {[0, 1, 2].map((idx) => (
          <span
            key={idx}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              idx <= stepIndex ? "bg-white" : "bg-white/10",
            )}
          />
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {step === "account" ? (
          <>
            <div className="space-y-2">
              <label className="app-field-label">Your name</label>
              <Input
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label className="app-field-label">Company or organization</label>
              <Input
                value={form.orgName}
                onChange={(event) => setForm((current) => ({ ...current, orgName: event.target.value }))}
                placeholder="Acme Inc"
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <label className="app-field-label">Work email</label>
              <Input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="app-field-label">Password</label>
              <Input
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                type="password"
                placeholder="Choose a password"
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs leading-6 text-zinc-500">
              {getPlanDisplayName(selectedPlan)} plan, {getPlanIntervalLabel(selectedInterval)} billing. {TRIAL_LENGTH_DAYS}-day trial,
              no card required.
            </p>
          </>
        ) : null}

        {step === "use-case" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {USE_CASES.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setUseCase(option.id)}
                className={cn(
                  "group rounded-lg border p-4 text-left transition-colors",
                  useCase === option.id
                    ? "border-white bg-white/[0.05]"
                    : "border-border-subtle bg-surface-1 hover:border-border hover:bg-surface-2",
                )}
              >
                <p className="text-sm font-medium text-white">{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{option.tagline}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === "team-size" ? (
          <div className="grid grid-cols-2 gap-3">
            {TEAM_SIZES.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setTeamSize(option.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  teamSize === option.id
                    ? "border-white bg-white/[0.05]"
                    : "border-border-subtle bg-surface-1 hover:border-border hover:bg-surface-2",
                )}
              >
                <p className="text-sm font-medium text-white">{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{option.hint}</p>
              </button>
            ))}
          </div>
        ) : null}

        {!isSupabaseConfigured() && step === "team-size" ? (
          <p className="text-sm leading-6 text-zinc-500">
            Account services are not configured. Submitting will open chat in demo mode.
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex items-center gap-3 pt-1">
          {step !== "account" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(step === "team-size" ? "use-case" : "account")}
            >
              Back
            </Button>
          ) : null}
          <Button type="submit" className="flex-1" disabled={loading}>
            {step === "team-size"
              ? loading
                ? "Setting up your workspace..."
                : "Create workspace"
              : "Continue"}
          </Button>
        </div>
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
