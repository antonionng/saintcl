"use client";

import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  footer,
  aside,
  compact = false,
  children,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="site-shell w-full">
        <div className={compact ? "flex justify-center" : "grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch"}>
          {!compact ? (
            <Card className="hidden min-h-full border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] lg:flex lg:flex-col lg:justify-between">
              {aside ?? (
                <CardContent className="flex h-full flex-col justify-between p-8 lg:p-10">
                  <div className="space-y-6">
                    <Logo />
                    <div className="space-y-4">
                      <p className="app-kicker">Agent operations</p>
                      <h1 className="text-4xl font-semibold tracking-[-0.06em] text-white">
                        A calmer way to run your agent platform.
                      </h1>
                      <p className="max-w-md text-sm leading-7 text-zinc-400">
                        Move from onboarding to provisioning, billing, and runtime oversight in one
                        cohesive workspace.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-sm font-medium text-white">What you get after sign-in</p>
                    <p className="text-sm leading-6 text-zinc-400">
                      Dashboard overview, agent fleet controls, channel connections, knowledge
                      intake, billing visibility, and governed admin tools.
                    </p>
                    <Link href="/" className="text-sm text-zinc-300 transition-colors hover:text-white">
                      Back to homepage
                    </Link>
                  </div>
                </CardContent>
              )}
            </Card>
          ) : null}

          <Card
            className={`w-full border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] ${
              compact ? "max-w-md" : "max-w-xl justify-self-center"
            }`}
          >
            <CardHeader className="space-y-4">
              <Logo className={compact ? undefined : "lg:hidden"} />
              <div className="space-y-2">
                <CardTitle className="text-[2rem]">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {children}
              <div className="text-sm text-zinc-400">{footer}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
