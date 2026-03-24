"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MailPlus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, titleCase } from "@/lib/utils";
import type { OrgInviteRecord, OrgRole, TeamRecord } from "@/types";

type OrgMemberSummary = {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: OrgRole;
};

export function SettingsMembersForm({
  initialMembers,
  initialInvites,
  teams,
  seatPriceCents,
}: {
  initialMembers: OrgMemberSummary[];
  initialInvites: OrgInviteRecord[];
  teams: TeamRecord[];
  seatPriceCents: number;
}) {
  const router = useRouter();
  const [members] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeInvites = useMemo(
    () => invites.filter((invite) => ["pending", "sent", "delivery_failed"].includes(invite.status)),
    [invites],
  );

  async function sendInvite() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          teamId: teamId || null,
        }),
      });
      const body = (await response.json()) as {
        data?: OrgInviteRecord;
        error?: { message?: string };
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to send invite.");
      }

      setInvites((current) => [body.data!, ...current.filter((invite) => invite.id !== body.data!.id)]);
      setEmail("");
      setRole("member");
      setTeamId("");
      setSuccess("Invite sent and billed successfully.");
      router.refresh();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send invite.");
    } finally {
      setSaving(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    setRevokingId(inviteId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/org/invites/${inviteId}`, { method: "DELETE" });
      const body = (await response.json()) as {
        data?: OrgInviteRecord;
        error?: { message?: string };
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to revoke invite.");
      }

      setInvites((current) => current.map((invite) => (invite.id === inviteId ? body.data! : invite)));
      setSuccess("Invite revoked and billing reversed.");
      router.refresh();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke invite.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Invite teammates</CardTitle>
            <CardDescription>
              Invites send branded Saint AGI emails and bill the workspace as soon as the invite is sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
              <p className="text-white">Per-invite seat charge: {formatCurrency(seatPriceCents / 100)}</p>
              <p className="mt-2 text-zinc-400">
                If an invite is revoked or delivery fails, the invite charge is credited back to the workspace wallet.
              </p>
            </div>
            <div className="space-y-2">
              <label className="app-field-label">Email address</label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="teammate@company.com"
                disabled={saving}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="app-field-label">Workspace role</label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as OrgRole)}
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white"
                  disabled={saving}
                >
                  <option value="member">Member</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="app-field-label">Assign team</label>
                <select
                  value={teamId}
                  onChange={(event) => setTeamId(event.target.value)}
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white"
                  disabled={saving}
                >
                  <option value="">No team assignment</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
            <Button type="button" onClick={sendInvite} disabled={saving || !email.trim()}>
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : <MailPlus className="size-4" />}
              <span>{saving ? "Sending invite..." : "Send invite"}</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Current members</CardTitle>
            <CardDescription>Everyone who already belongs to this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-zinc-500">No members yet.</p>
            ) : (
              members.map((member) => (
                <div key={member.userId} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{member.displayName ?? member.email ?? member.userId}</p>
                      <p className="mt-2 text-sm text-zinc-400">{member.email ?? "Email unavailable"}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                      <Users className="size-3.5" />
                      {titleCase(member.role)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="settings-panel">
        <CardHeader>
          <CardTitle>Pending and recent invites</CardTitle>
          <CardDescription>Track invite delivery, billing status, and revoke invites before they are accepted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeInvites.length === 0 ? (
            <p className="text-sm text-zinc-500">No active invites right now.</p>
          ) : (
            activeInvites.map((invite) => (
              <div key={invite.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-white">{invite.email}</p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {titleCase(invite.role)} · {invite.status} · billing {invite.billingStatus}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Created {new Date(invite.createdAt).toLocaleString()} · Expires{" "}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                    {invite.lastError ? <p className="mt-2 text-xs text-amber-300">{invite.lastError}</p> : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => revokeInvite(invite.id)}
                    disabled={revokingId === invite.id || invite.status === "accepted"}
                  >
                    {revokingId === invite.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    <span>{revokingId === invite.id ? "Revoking..." : "Revoke"}</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
