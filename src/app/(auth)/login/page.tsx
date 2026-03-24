"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";

import { createClient } from "@/lib/supabase/client";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("changeme123");
  const [mode, setMode] = useState<"sign-in" | "recovery">("sign-in");
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  function switchMode(nextMode: "sign-in" | "recovery") {
    setMode(nextMode);
    setError(null);
    setRecoveryMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRecoveryMessage(null);
    setLoading(true);

    if (mode === "recovery") {
      if (!email.trim()) {
        setError("Enter your email address so we can send a recovery link.");
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        setError("Password recovery is unavailable while Supabase keys are not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setError("Supabase client is not configured.");
        setLoading(false);
        return;
      }

      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (recoveryError) {
        setError(recoveryError.message);
        setLoading(false);
        return;
      }

      setRecoveryMessage("Check your inbox for a reset link. It should arrive in a moment.");
      setLoading(false);
      return;
    }

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

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/auth/landing");
    router.refresh();
  }

  return (
    <AuthShell
      compact
      title="Welcome back"
      description={
        mode === "sign-in"
          ? "Sign in to your workspace."
          : "Enter your email and we will send a reset link."
      }
      footer={
        <>
          Need an account?{" "}
          <Link
            className="text-white transition-colors hover:text-zinc-200"
            href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
          >
            Create one
          </Link>
        </>
      }
    >
      {resetSuccess ? (
        <div className="rounded-[1.35rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
          Your password was updated. Sign in with your new credentials below.
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="app-field-label">Email</label>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" />
        </div>
        {mode === "sign-in" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="app-field-label">Password</label>
              <button
                type="button"
                className="text-sm text-zinc-400 transition-colors hover:text-white"
                onClick={() => switchMode("recovery")}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="pr-20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 transition-colors hover:text-white"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-zinc-400">
            We will send a secure recovery link to{" "}
            <span className="text-white">{email || "your email address"}</span>.
          </p>
        )}
        {!isSupabaseConfigured() ? (
          <p className="text-sm leading-6 text-zinc-500">
            Supabase keys are not set. Sign-in will open the dashboard in demo mode.
          </p>
        ) : null}
        {recoveryMessage ? <p className="text-sm text-emerald-300">{recoveryMessage}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? mode === "sign-in"
              ? "Signing in..."
              : "Sending reset link..."
            : mode === "sign-in"
              ? "Log in"
              : "Send reset link"}
        </Button>
        {mode === "recovery" ? (
          <button
            type="button"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
            onClick={() => switchMode("sign-in")}
          >
            Back to sign in
          </button>
        ) : null}
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell compact title="Welcome back" description="Loading sign-in..." footer={null}>
          <div className="h-48" />
        </AuthShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
