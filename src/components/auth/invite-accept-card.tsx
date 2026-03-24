"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MailPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrgInviteRecord } from "@/types";

export function InviteAcceptCard({
  token,
  invite,
  orgName,
  signedInEmail,
}: {
  token: string;
  invite: OrgInviteRecord;
  orgName: string | null;
  signedInEmail?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptInvite() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/org/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        throw new Error(body.error?.message || "Unable to accept invite.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept invite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="settings-panel max-w-xl">
      <CardHeader>
        <CardTitle>Join {orgName ?? "workspace"}</CardTitle>
        <CardDescription>
          This invite is for <span className="text-white">{invite.email}</span> as a{" "}
          <span className="text-white">{invite.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signedInEmail ? (
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
            <p className="text-white">Signed in as {signedInEmail}</p>
            <p className="mt-2 text-zinc-400">
              Accepting will add you to the workspace immediately. You must be signed in with the same email address
              that received the invite.
            </p>
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
            <p className="text-white">Sign in first</p>
            <p className="mt-2 text-zinc-400">
              Use the same email address that received this invite, then return to this link to accept it.
            </p>
          </div>
        )}
        {invite.status === "accepted" ? (
          <p className="text-sm text-emerald-300">This invite has already been accepted.</p>
        ) : null}
        {invite.status === "revoked" ? <p className="text-sm text-red-400">This invite has been revoked.</p> : null}
        {invite.status === "expired" ? <p className="text-sm text-red-400">This invite has expired.</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          {signedInEmail ? (
            <Button
              type="button"
              onClick={acceptInvite}
              disabled={loading || !["pending", "sent"].includes(invite.status)}
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <MailPlus className="size-4" />}
              <span>{loading ? "Joining..." : "Accept invite"}</span>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in to accept</Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
