"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wizard } from "@/components/ui/wizard";
import { formatCurrency, titleCase } from "@/lib/utils";
import type { OrgInviteRecord, OrgRole, TeamRecord } from "@/types";

type OrgMemberSummary = {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: OrgRole;
};

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div>
        <h3 className="text-[length:var(--text-base)] font-medium text-white">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-[length:var(--text-xs)] text-white/55">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

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
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const activeInvites = useMemo(
    () => invites.filter((invite) => ["pending", "sent", "delivery_failed"].includes(invite.status)),
    [invites],
  );

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
      setInvites((current) => current.map((i) => (i.id === inviteId ? body.data! : i)));
      setSuccess("Invite revoked and billing reversed.");
      router.refresh();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke invite.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          title="Members"
          description={`${members.length} ${members.length === 1 ? "person" : "people"} in this workspace.`}
          action={
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Invite member</span>
            </Button>
          }
        />
        <div className="border border-border rounded-md overflow-hidden">
          {members.length === 0 ? (
            <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
              No members yet.
            </p>
          ) : (
            <ul>
              {members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--text-sm)] text-white">
                      {member.displayName ?? member.email ?? member.userId}
                    </p>
                    <p className="mt-0.5 text-[length:var(--text-xs)] text-white/45">
                      {member.email ?? "Email unavailable"}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-sm border border-border-subtle px-2 py-0.5 text-[length:var(--text-xs)] text-white/70">
                    {titleCase(member.role)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Pending invites"
          description="Track delivery and revoke invites before they are accepted."
        />
        {error ? (
          <p className="mb-3 rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mb-3 rounded-sm border border-emerald-500/30 px-3 py-2 text-[length:var(--text-xs)] text-emerald-300">
            {success}
          </p>
        ) : null}
        <div className="border border-border rounded-md overflow-hidden">
          {activeInvites.length === 0 ? (
            <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
              No active invites.
            </p>
          ) : (
            <ul>
              {activeInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--text-sm)] text-white">
                      {invite.email}
                    </p>
                    <p className="mt-0.5 text-[length:var(--text-xs)] text-white/45">
                      {titleCase(invite.role)} &middot; {invite.status} &middot; billing {invite.billingStatus}
                    </p>
                    {invite.lastError ? (
                      <p className="mt-0.5 text-[length:var(--text-xs)] text-amber-300">
                        {invite.lastError}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeInvite(invite.id)}
                    disabled={revokingId === invite.id || invite.status === "accepted"}
                  >
                    {revokingId === invite.id ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>{revokingId === invite.id ? "Revoking" : "Revoke"}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <InviteMemberWizard
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        teams={teams}
        seatPriceCents={seatPriceCents}
        onCreated={(invite) => {
          setInvites((cur) => [invite, ...cur.filter((i) => i.id !== invite.id)]);
          setInviteOpen(false);
          setSuccess("Invite sent and billed successfully.");
          router.refresh();
        }}
      />
    </div>
  );
}

function InviteMemberWizard({
  open,
  onOpenChange,
  teams,
  seatPriceCents,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: TeamRecord[];
  seatPriceCents: number;
  onCreated: (invite: OrgInviteRecord) => void;
}) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [teamId, setTeamId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setEmail("");
      setRole("member");
      setTeamId("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          teamId: teamId || null,
        }),
      });
      const body = (await res.json()) as {
        data?: OrgInviteRecord;
        error?: { message?: string };
      };
      if (!res.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to send invite.");
      }
      onCreated(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send invite.");
    } finally {
      setSubmitting(false);
    }
  }

  const validEmail = /.+@.+\..+/.test(email.trim());

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      title="Invite member"
      description={`Each invite charges ${formatCurrency(seatPriceCents / 100)}. Refunded on revoke.`}
      steps={["Details", "Role", "Review"]}
      step={step}
      onStepChange={setStep}
      finalLabel="Send invite"
      onFinalClick={submit}
      finalLoading={submitting}
      finalDisabled={!validEmail}
      nextDisabled={step === 0 ? !validEmail : false}
    >
      <Wizard.Step>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Email address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
          />
        </div>
      </Wizard.Step>

      <Wizard.Step>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Workspace role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
            className="flex h-9 w-full rounded-sm border border-border bg-transparent px-3 text-[length:var(--text-sm)] text-white"
          >
            <option value="member">Member</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Assign team (optional)
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="flex h-9 w-full rounded-sm border border-border bg-transparent px-3 text-[length:var(--text-sm)] text-white"
          >
            <option value="">No team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </Wizard.Step>

      <Wizard.Step>
        <ReviewRow label="Email" value={email || "-"} />
        <ReviewRow label="Role" value={titleCase(role)} />
        <ReviewRow
          label="Team"
          value={teamId ? teams.find((t) => t.id === teamId)?.name ?? "-" : "(none)"}
        />
        <ReviewRow label="Seat charge" value={formatCurrency(seatPriceCents / 100)} />
        {error ? (
          <p className="rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
      </Wizard.Step>
    </Wizard>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 last:border-b-0">
      <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>
      <span className="text-[length:var(--text-sm)] text-white text-right">{value}</span>
    </div>
  );
}
