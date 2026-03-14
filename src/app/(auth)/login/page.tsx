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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("founder@saintclaw.ai");
  const [password, setPassword] = useState("changeme123");
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

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
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
          <CardTitle className="pt-6 text-3xl uppercase tracking-[-0.04em]">Welcome back</CardTitle>
          <CardDescription>
            Log in to monitor agents, review governance, and keep every workspace online.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" />
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-zinc-400">
            Need an account? <Link className="text-white" href="/signup">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
