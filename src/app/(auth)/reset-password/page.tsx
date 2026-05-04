"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabaseConfigured = isSupabaseConfigured();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    supabaseConfigured
      ? "Open the recovery link from your email on this device. Once the secure session is ready, you can choose a new password here."
      : "Password reset is unavailable while Supabase keys are not configured.",
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const maybeSupabaseClient = createClient();
    if (!maybeSupabaseClient) {
      return;
    }
    const supabaseClient: NonNullable<ReturnType<typeof createClient>> = maybeSupabaseClient;

    let active = true;

    async function hydrateRecoverySession() {
      const { data, error: sessionError } = await supabaseClient.auth.getSession();
      if (!active) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        setReady(true);
        setInfo("Choose a new password for your Saint AGI workspace account.");
      }
    }

    hydrateRecoverySession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
        setReady(true);
        setError(null);
        setInfo("Choose a new password for your Saint AGI workspace account.");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!supabaseConfigured) {
      setError("Password reset is unavailable while Supabase keys are not configured.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match yet.");
      return;
    }

    const maybeSupabase = createClient();
    if (!maybeSupabase) {
      setError("Supabase client is not configured.");
      return;
    }
    const supabase: NonNullable<ReturnType<typeof createClient>> = maybeSupabase;

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?reset=success");
    router.refresh();
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Choose a new password to regain access to your workspace and agent controls."
      footer={
        <>
          Remembered it?{" "}
          <Link className="text-white transition-colors hover:text-zinc-200" href="/login">
            Back to sign in
          </Link>
        </>
      }
    >
      <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
        {info}
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="app-field-label">New password</label>
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="New password"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Confirm new password</label>
          <Input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </div>
        {!ready ? (
          <p className="text-sm leading-6 text-zinc-500">
            Still waiting for a valid recovery session. If this page was opened directly, request a
            new reset link from the sign-in page.
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={!ready || loading}>
          {loading ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
