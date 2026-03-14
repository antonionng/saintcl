"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    orgName: "SaintClaw Labs",
    email: "founder@saintclaw.ai",
    password: "changeme123",
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
        data: { org_name: form.orgName },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Logo />
          <CardTitle className="pt-6 text-3xl uppercase tracking-[-0.04em]">Create workspace</CardTitle>
          <CardDescription>
            Provision your organization, seat, and first agent control surface in one flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              value={form.orgName}
              onChange={(event) => setForm((current) => ({ ...current, orgName: event.target.value }))}
              placeholder="Organization name"
            />
            <Input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              type="email"
              placeholder="Email"
            />
            <Input
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              type="password"
              placeholder="Password"
            />
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
          <p className="mt-6 text-sm text-zinc-400">
            Already have access? <Link className="text-white" href="/login">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
