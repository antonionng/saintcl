import { Activity, Cable, CreditCard, ShieldCheck } from "lucide-react";

import { PolicyForm } from "@/components/dashboard/policy-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsEmailPreferencesForm } from "@/components/dashboard/settings-email-preferences-form";
import { SettingsAllowlistForm } from "@/components/dashboard/settings-allowlist-form";
import { SettingsBillingPlans } from "@/components/dashboard/settings-billing-plans";
import { SettingsConnectionsForm } from "@/components/dashboard/settings-connections-form";
import { SettingsGeneralForm } from "@/components/dashboard/settings-general-form";
import { SettingsMembersForm } from "@/components/dashboard/settings-members-form";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAgents,
  getChannels,
  getCurrentOrg,
  getOrgMembers,
  getOrgPolicy,
  getOrgWallet,
  getRepoAllowlists,
  getTerminalApprovals,
  getTerminalRuns,
  getTeams,
  getUsageSummary,
  getWalletLedger,
} from "@/lib/dal";
import { getEmailPreferences } from "@/lib/email/preferences";
import { listOrgInvites } from "@/lib/invites";
import {
  getPlanConfig,
  getPlanDisplayName,
  getPlanIntervalLabel,
  getPlanSeatPriceCents,
  getResolvedTrialStatus,
  getTrialDaysRemaining,
} from "@/lib/plans";
import { resolveSettingsTab, settingsTabs } from "@/lib/settings-tabs";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { syncOpenClawUsageForOrg } from "@/lib/openclaw/usage-sync";
import { formatCurrency } from "@/lib/utils";

const fallbackCapabilities = {
  canManageBilling: false,
  canManagePolicies: false,
  canManageAgents: false,
  canViewAllAgents: false,
  canManageConsole: false,
  canManageAdminTools: false,
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentOrg();
  const org = session?.org;
  const capabilities = session?.capabilities ?? fallbackCapabilities;
  const requestedSearchParams = searchParams ? await searchParams : {};
  const activeTab = resolveSettingsTab(requestedSearchParams.tab, capabilities);
  const currentTab = settingsTabs.find((tab) => tab.id === activeTab) ?? settingsTabs[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace settings"
        title={currentTab.heading}
        description={currentTab.description}
      />
      {org ? (
        <SettingsTabContent
          activeTab={activeTab}
          userId={session?.userId ?? null}
          orgId={org.id}
          orgName={org.name}
          orgSlug={org.slug}
          orgPlan={org.plan}
          billingInterval={org.billing_interval ?? "monthly"}
          trialStatus={org.trial_status ?? "none"}
          trialEndsAt={org.trial_ends_at ?? null}
          stripeSubscriptionStatus={org.stripe_subscription_status ?? null}
          website={org.website ?? ""}
          companySummary={org.company_summary ?? ""}
          agentBrief={org.agent_brief ?? ""}
          logoUrl={org.logoUrl ?? null}
          capabilities={capabilities}
          unsubscribeStatus={
            requestedSearchParams.unsubscribe === "success" || requestedSearchParams.unsubscribe === "error"
              ? requestedSearchParams.unsubscribe
              : null
          }
          unsubscribeMessage={
            typeof requestedSearchParams.message === "string" ? requestedSearchParams.message : null
          }
        />
      ) : (
        <Card className="settings-panel">
          <CardContent className="p-6 text-sm text-zinc-400">
            Settings become available after the workspace session is initialized.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function SettingsTabContent({
  activeTab,
  userId,
  orgId,
  orgName,
  orgSlug,
  orgPlan,
  billingInterval,
  trialStatus,
  trialEndsAt,
  stripeSubscriptionStatus,
  website,
  companySummary,
  agentBrief,
  logoUrl,
  capabilities,
  unsubscribeStatus,
  unsubscribeMessage,
}: {
  activeTab: "general" | "members" | "governance" | "billing" | "integrations" | "security" | "email";
  userId: string | null;
  orgId: string;
  orgName: string;
  orgSlug: string;
  orgPlan: string;
  billingInterval: "monthly" | "annual";
  trialStatus: string;
  trialEndsAt: string | null;
  stripeSubscriptionStatus: string | null;
  website: string;
  companySummary: string;
  agentBrief: string;
  logoUrl: string | null;
  capabilities: typeof fallbackCapabilities;
  unsubscribeStatus: "success" | "error" | null;
  unsubscribeMessage: string | null;
}) {
  if (activeTab === "general") {
    return (
      <SettingsGeneralForm
        orgName={orgName}
        slug={orgSlug}
        plan={orgPlan}
        website={website}
        companySummary={companySummary}
        agentBrief={agentBrief}
        logoUrl={logoUrl}
        canEdit={capabilities.canManagePolicies}
      />
    );
  }

  if (activeTab === "members") {
    const [members, invites, teams] = await Promise.all([getOrgMembers(orgId), listOrgInvites(orgId), getTeams(orgId)]);
    return (
      <SettingsMembersForm
        initialMembers={members}
        initialInvites={invites}
        teams={teams}
        seatPriceCents={getPlanSeatPriceCents(orgPlan) ?? 0}
      />
    );
  }

  if (activeTab === "governance") {
    const [policy, catalogState] = await Promise.all([
      getOrgPolicy(orgId),
      getOrgModelCatalogState(orgId),
    ]);

    return (
      <PolicyForm
        mission={policy?.mission ?? ""}
        reasonForAgents={policy?.reason_for_agents ?? ""}
        defaultModel={policy?.default_model ?? ""}
        requireApprovalOnSpend={policy?.require_approval_on_spend ?? false}
        guardrails={(policy?.guardrails as Record<string, unknown>) ?? {}}
        approvedModels={catalogState?.snapshot.approvedModels ?? []}
        blockedModels={(policy?.blocked_models as string[] | undefined) ?? []}
        modelGuardrails={
          catalogState?.snapshot.guardrails ?? {
            allowAgentOverride: true,
            allowSessionOverride: true,
            requireApprovalForPremiumModels: false,
            premiumInputCostPerMillionCents: null,
            premiumOutputCostPerMillionCents: null,
          }
        }
        readOnly={!capabilities.canManagePolicies}
      />
    );
  }

  if (activeTab === "billing") {
    const policy = await getOrgPolicy(orgId);
    const [sync, wallet, ledger, usage] = await Promise.all([
      syncOpenClawUsageForOrg(orgId, {
        defaultModel: policy?.default_model ?? undefined,
      }),
      getOrgWallet(orgId),
      getWalletLedger(orgId, 12),
      getUsageSummary(orgId),
    ]);

    const balance = (wallet?.balance_cents ?? 0) / 100;
    const weeklyBurn = usage.last7dSpendCents / 100;
    const resolvedTrialStatus = getResolvedTrialStatus(trialStatus, trialEndsAt);
    const trialDaysRemaining = getTrialDaysRemaining(trialEndsAt);
    const planConfig = getPlanConfig(orgPlan);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={CreditCard}
            title="Current plan"
            value={getPlanDisplayName(orgPlan)}
            detail={`${getPlanIntervalLabel(billingInterval)} billing${resolvedTrialStatus === "active" ? ` · ${trialDaysRemaining} trial day${trialDaysRemaining === 1 ? "" : "s"} left` : ""}`}
          />
          <MetricCard
            icon={CreditCard}
            title="Wallet balance"
            value={formatCurrency(balance)}
            detail={`Low-balance threshold: ${formatCurrency((wallet?.low_balance_threshold_cents ?? 0) / 100)}`}
          />
          <MetricCard
            icon={Activity}
            title="Usage sync"
            value={formatCurrency(sync.chargedCents / 100)}
            detail={
              sync.lastError
                ? sync.lastError
                : `Last sync charged ${sync.chargedSessions} session(s) and skipped ${sync.skippedSessions}.`
            }
          />
          <MetricCard
            icon={CreditCard}
            title="Projected burn"
            value={formatCurrency(weeklyBurn)}
            detail="Last 7 days of recorded AI/API spend."
          />
          <MetricCard
            icon={ShieldCheck}
            title="Included usage credit"
            value={planConfig.includedUsageCreditCents ? formatCurrency(planConfig.includedUsageCreditCents / 100) : "Custom"}
            detail={planConfig.storageGb ? `${planConfig.storageGb} GB included storage` : "Custom enterprise storage and support"}
          />
        </div>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Wallet actions</CardTitle>
            <CardDescription>
              Run Stripe top-ups or manual admin credits without leaving the settings hub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingActions returnPath="/settings?tab=billing" />
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Plans</CardTitle>
            <CardDescription>
              Compare monthly and annual plans, manage Stripe billing, and convert trial workspaces when ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsBillingPlans
              currentPlan={orgPlan}
              currentInterval={billingInterval}
              trialStatus={trialStatus}
              trialEndsAt={trialEndsAt}
              stripeSubscriptionStatus={stripeSubscriptionStatus}
            />
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Billing status</CardTitle>
            <CardDescription>Subscription lifecycle, trial state, and spend controls for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <StatusTile
              label="Trial"
              value={resolvedTrialStatus === "active" ? `Active · ${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left` : resolvedTrialStatus}
            />
            <StatusTile label="Subscription" value={stripeSubscriptionStatus ?? "Not linked"} />
            <StatusTile
              label="Approval mode"
              value={policy?.require_approval_on_spend ? "Enabled" : "Disabled"}
            />
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Ledger history</CardTitle>
            <CardDescription>Immutable wallet events for top-ups, usage, and manual adjustments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ledger.length === 0 ? (
              <p className="text-sm text-zinc-500">No wallet entries yet.</p>
            ) : (
              ledger.map((entry) => (
                <div key={entry.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{entry.description}</p>
                      <p className="mt-2 text-sm text-zinc-400">
                        {entry.source_type} · {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={entry.direction === "credit" ? "text-emerald-400" : "text-amber-300"}>
                        {entry.direction === "credit" ? "+" : "-"}
                        {formatCurrency(entry.amount_cents / 100)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Balance {formatCurrency((entry.balance_after_cents ?? 0) / 100)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === "integrations") {
    const [channels, agents] = await Promise.all([getChannels(orgId), getAgents(orgId)]);

    return (
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Connect channel</CardTitle>
            <CardDescription>
              Attach Telegram and Slack providers to a specific agent without leaving the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsConnectionsForm
              orgId={orgId}
              agents={agents.map((agent) => ({ id: agent.id, name: agent.name }))}
            />
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Active bindings</CardTitle>
            <CardDescription>Channels already connected to agents in this tenant runtime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.length === 0 ? (
              <p className="text-sm text-zinc-500">No channels connected yet.</p>
            ) : (
              channels.map((channel) => (
                <div key={channel.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium capitalize text-white">{channel.type}</p>
                      <p className="mt-2 text-sm text-zinc-400">
                        Agent: {(channel.agents as { name: string } | null)?.name ?? channel.agent_id}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Connected:{" "}
                        {channel.connected_at
                          ? new Date(channel.connected_at).toLocaleString()
                          : "Pending provider handshake"}
                      </p>
                    </div>
                    <Badge variant={channel.status === "connected" ? "success" : "warning"}>
                      {channel.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="settings-panel xl:col-span-2">
          <CardHeader>
            <CardTitle>Integration flow</CardTitle>
            <CardDescription>
              Connections are validated, written to the tenant runtime, and recorded as billable usage events.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MiniProcessCard
              title="1. Collect credentials"
              description="Capture bot tokens or workspace identifiers for the provider you are connecting."
            />
            <MiniProcessCard
              title="2. Persist tenant config"
              description="Saint AGI stores the binding metadata and updates the tenant runtime with the active model policy."
            />
            <MiniProcessCard
              title="3. Route traffic"
              description="Inbound provider traffic is routed to the selected agent and begins showing up in runtime logs."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === "email") {
    const preferences = userId ? await getEmailPreferences(orgId, userId) : null;
    if (!preferences) {
      return (
        <Card className="settings-panel">
          <CardContent className="p-6 text-sm text-zinc-400">
            Email preferences are unavailable until the workspace session is fully initialized.
          </CardContent>
        </Card>
      );
    }

    return (
      <SettingsEmailPreferencesForm
        initialPreferences={preferences}
        unsubscribeStatus={unsubscribeStatus}
        unsubscribeMessage={unsubscribeMessage}
      />
    );
  }

  const [allowlists, approvals, runs, policy] = await Promise.all([
    getRepoAllowlists(orgId),
    getTerminalApprovals(orgId),
    getTerminalRuns(orgId),
    getOrgPolicy(orgId),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Repo allowlists</CardTitle>
            <CardDescription>
              Restrict which repos agents can clone before terminal workflows are approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allowlists.length === 0 ? (
              <p className="text-sm text-zinc-500">No allowlists configured yet.</p>
            ) : (
              allowlists.map((entry) => (
                <div key={entry.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="font-medium text-white">{entry.pattern}</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Added {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
            <SettingsAllowlistForm />
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Terminal policy</CardTitle>
            <CardDescription>High-risk command execution remains admin-only and repo-scoped.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-400">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck className="size-4 text-emerald-400" />
                Non-main sandbox required
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-white">
                <Cable className="size-4 text-white" />
                Commands require explicit admin approval
              </div>
            </div>
            {policy?.mission ? (
              <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="app-kicker">Company mission</p>
                <p className="mt-2 text-white">{policy.mission}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Approval queue</CardTitle>
            <CardDescription>Recent terminal approvals visible from the settings hub.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvals.length === 0 ? (
              <p className="text-sm text-zinc-500">No approvals pending or recorded yet.</p>
            ) : (
              approvals.slice(0, 8).map((approval) => (
                <div key={approval.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{approval.command}</p>
                      <p className="mt-2 text-sm text-zinc-400">
                        {new Date(approval.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={approval.status === "approved" ? "success" : "warning"}>
                      {approval.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
            <CardDescription>Audited terminal executions with short output excerpts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {runs.length === 0 ? (
              <p className="text-sm text-zinc-500">No terminal runs recorded yet.</p>
            ) : (
              runs.slice(0, 8).map((run) => (
                <div key={run.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{run.command}</p>
                    <Badge variant={run.exit_code === 0 ? "success" : "warning"}>
                      exit {run.exit_code}
                    </Badge>
                  </div>
                  {run.stdout_excerpt ? (
                    <p className="mt-3 text-sm leading-7 text-zinc-400">{run.stdout_excerpt}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="settings-panel">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/8 bg-white/[0.04] p-2">
            <Icon className="size-4 text-white" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold tracking-[-0.04em] text-white">{value}</div>
        <p className="text-sm leading-6 text-zinc-400">{detail}</p>
      </CardContent>
    </Card>
  );
}

function StatusTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-3 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function MiniProcessCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{description}</p>
    </div>
  );
}
