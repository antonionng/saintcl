import { Activity, Cable, CreditCard, ShieldCheck } from "lucide-react";

import { PolicyForm } from "@/components/dashboard/policy-form";
import { SkillPolicyForm } from "@/components/dashboard/skill-policy-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsEmailPreferencesForm } from "@/components/dashboard/settings-email-preferences-form";
import { SettingsAllowlistForm } from "@/components/dashboard/settings-allowlist-form";
import { SettingsBillingPlans } from "@/components/dashboard/settings-billing-plans";
import { SettingsConnectionsForm } from "@/components/dashboard/settings-connections-form";
import { SettingsGeneralForm } from "@/components/dashboard/settings-general-form";
import { SettingsMembersForm } from "@/components/dashboard/settings-members-form";
import { SettingsPersonasForm } from "@/components/dashboard/settings-personas-form";
import { SettingsSectionTabs } from "@/components/dashboard/settings-section-tabs";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LLM_USAGE_MARKUP_PERCENT } from "@/lib/billing/math";
import {
  getAgents,
  getChannels,
  getCurrentOrg,
  getOrgMembers,
  getOrgPolicy,
  getOrgWallet,
  getPersonas,
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
import { getBuiltInPersonas } from "@/lib/personas";
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
          isSuperAdmin={session?.isSuperAdmin ?? false}
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
  isSuperAdmin,
}: {
  activeTab: "general" | "members" | "personas" | "governance" | "billing" | "integrations" | "security" | "email";
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
  isSuperAdmin: boolean;
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

  if (activeTab === "personas") {
    const [orgPersonas, builtInPersonas] = await Promise.all([getPersonas(orgId), Promise.resolve(getBuiltInPersonas())]);
    return (
      <SettingsPersonasForm
        initialOrgPersonas={orgPersonas}
        builtInPersonas={builtInPersonas}
        canEdit={capabilities.canManagePolicies}
      />
    );
  }

  if (activeTab === "governance") {
    const [policy, catalogState] = await Promise.all([
      getOrgPolicy(orgId),
      getOrgModelCatalogState(orgId, {
        trialStatus,
        trialEndsAt,
      }),
    ]);

    const skillPolicyData = (policy?.skill_policy as {
      allowedSources?: string[];
      allowedTrustTiers?: string[];
      requireApprovalForCommunity?: boolean;
    } | null) ?? null;

    return (
      <>
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
        <SkillPolicyForm
          orgId={orgId}
          allowedSources={skillPolicyData?.allowedSources ?? ["clawhub", "github"]}
          allowedTrustTiers={skillPolicyData?.allowedTrustTiers ?? ["official", "curated"]}
          requireApprovalForCommunity={skillPolicyData?.requireApprovalForCommunity ?? true}
          readOnly={!capabilities.canManagePolicies}
        />
      </>
    );
  }

  if (activeTab === "billing") {
    const policy = await getOrgPolicy(orgId);

    const syncPromise = syncOpenClawUsageForOrg(orgId, {
      defaultModel: policy?.default_model ?? undefined,
    }).catch(() => ({ chargedCents: 0, chargedSessions: 0, skippedSessions: 0, lastError: "Sync unavailable" }));

    const [wallet, ledger, usage] = await Promise.all([
      getOrgWallet(orgId),
      getWalletLedger(orgId, 12),
      getUsageSummary(orgId),
    ]);
    const sync = await syncPromise;

    const balance = (wallet?.balance_cents ?? 0) / 100;
    const weeklyBurn = usage.last7dSpendCents / 100;
    const resolvedTrialStatus = getResolvedTrialStatus(trialStatus, trialEndsAt);
    const trialDaysRemaining = getTrialDaysRemaining(trialEndsAt);
    const planConfig = getPlanConfig(orgPlan);

    return (
      <SettingsSectionTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="space-y-5 p-5">
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
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <StatusTile
                    label="Included usage credit"
                    value={planConfig.includedUsageCreditCents ? formatCurrency(planConfig.includedUsageCreditCents / 100) : "Custom"}
                  />
                  <StatusTile
                    label="Trial"
                    value={resolvedTrialStatus === "active" ? `Active · ${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left` : resolvedTrialStatus}
                  />
                  <StatusTile label="Subscription" value={stripeSubscriptionStatus ?? "Not linked"} />
                  <StatusTile
                    label="Approval mode"
                    value={policy?.require_approval_on_spend ? "Enabled" : "Disabled"}
                  />
                </div>
              </div>
            ),
          },
          {
            id: "wallet",
            label: "Wallet",
            content: (
              <section className="space-y-4 p-5">
                <div>
                  <h3 className="text-[length:var(--text-base)] font-medium text-white">Wallet actions</h3>
                  <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
                    Top up for paid model usage. Runtime costs include a {LLM_USAGE_MARKUP_PERCENT}% service margin.
                  </p>
                </div>
                <BillingActions returnPath="/settings?tab=billing" canIssueManualCredit={isSuperAdmin} />
              </section>
            ),
          },
          {
            id: "plans",
            label: "Plans",
            content: (
              <section className="space-y-4 p-5">
                <div>
                  <h3 className="text-[length:var(--text-base)] font-medium text-white">Plans</h3>
                  <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
                    Compare monthly and annual plans, manage Stripe billing, and convert trial workspaces when ready.
                  </p>
                </div>
                <SettingsBillingPlans
                  currentPlan={orgPlan}
                  currentInterval={billingInterval}
                  trialStatus={trialStatus}
                  trialEndsAt={trialEndsAt}
                  stripeSubscriptionStatus={stripeSubscriptionStatus}
                />
              </section>
            ),
          },
          {
            id: "ledger",
            label: "Ledger",
            content: (
              <section className="space-y-4 p-5">
                <div>
                  <h3 className="text-[length:var(--text-base)] font-medium text-white">Ledger history</h3>
                  <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
                    Immutable wallet events for top-ups, usage, and manual adjustments.
                  </p>
                </div>
                <div className="overflow-hidden rounded-md border border-border">
                  {ledger.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
                      No wallet entries yet.
                    </p>
                  ) : (
                    <ul>
                      {ledger.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[length:var(--text-sm)] text-white">
                              {entry.description}
                            </p>
                            <p className="mt-0.5 text-[length:var(--text-xs)] text-white/45">
                              {entry.source_type} · {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p
                              className={`text-[length:var(--text-sm)] ${
                                entry.direction === "credit" ? "text-emerald-300" : "text-amber-300"
                              }`}
                            >
                              {entry.direction === "credit" ? "+" : "-"}
                              {formatCurrency(entry.amount_cents / 100)}
                            </p>
                            <p className="text-[length:var(--text-xs)] text-white/45">
                              Balance {formatCurrency((entry.balance_after_cents ?? 0) / 100)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ),
          },
        ]}
      />
    );
  }

  if (activeTab === "integrations") {
    const [channels, agents] = await Promise.all([getChannels(orgId), getAgents(orgId)]);

    return (
      <SettingsSectionTabs
        tabs={[
          {
            id: "channels",
            label: "Channels",
            content: (
              <section className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[length:var(--text-base)] font-medium text-white">
                      Connected channels
                    </h3>
                    <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
                      Telegram and Slack channels routed to your agents.
                    </p>
                  </div>
                  <SettingsConnectionsForm
                    orgId={orgId}
                    agents={agents.map((agent) => ({ id: agent.id, name: agent.name }))}
                  />
                </div>
                <div className="overflow-hidden rounded-md border border-border">
                  {channels.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[length:var(--text-sm)] font-medium text-white">
                        No channels connected yet.
                      </p>
                      <p className="mx-auto mt-1 max-w-md text-[length:var(--text-xs)] text-white/55">
                        Connect Telegram or Slack once a business agent is ready to handle inbound messages.
                      </p>
                    </div>
                  ) : (
                    <ul>
                      {channels.map((channel) => (
                        <li
                          key={channel.id}
                          className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="text-[length:var(--text-sm)] font-medium capitalize text-white">
                              {channel.type}
                            </p>
                            <p className="mt-0.5 text-[length:var(--text-xs)] text-white/45">
                              {(channel.agents as { name: string } | null)?.name ?? channel.agent_id}
                              {channel.connected_at
                                ? ` · connected ${new Date(channel.connected_at).toLocaleDateString()}`
                                : " · pending"}
                            </p>
                          </div>
                          <Badge variant={channel.status === "connected" ? "success" : "warning"}>
                            {channel.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ),
          },
          {
            id: "setup",
            label: "Setup guide",
            content: (
              <section className="space-y-5 p-5">
                <div>
                  <h3 className="text-[length:var(--text-base)] font-medium text-white">Ready setup</h3>
                  <p className="mt-1 max-w-3xl text-[length:var(--text-sm)] leading-6 text-zinc-400">
                    Slack and Telegram are productized for the current rollout. WhatsApp, Google Chat, Teams, email,
                    Meet, and voice should be treated as enterprise setup until their credential, runtime, and diagnostics
                    flows are fully self-serve.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <MiniProcessCard
                    title="Telegram"
                    description="Use a bot token from BotFather and bind it to the agent that should handle messages."
                  />
                  <MiniProcessCard
                    title="Slack"
                    description="Use the target workspace team ID and route company channel traffic to a selected agent."
                  />
                </div>
                <div className="space-y-3 border-t border-border-subtle pt-5">
                  <div>
                    <h3 className="text-[length:var(--text-base)] font-medium text-white">How it works</h3>
                    <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
                      Connections are validated, written to the tenant runtime, and recorded as billable usage events.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <MiniProcessCard
                      title="1. Collect credentials"
                      description="Capture bot tokens or workspace identifiers for the provider."
                    />
                    <MiniProcessCard
                      title="2. Persist tenant config"
                      description="Saint AGI stores the binding and updates the tenant runtime."
                    />
                    <MiniProcessCard
                      title="3. Route traffic"
                      description="Inbound provider traffic is routed to the selected agent."
                    />
                  </div>
                </div>
              </section>
            ),
          },
        ]}
      />
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
    <div className="space-y-8">
      <section>
        <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h3 className="text-[length:var(--text-base)] font-medium text-white">
              Repo allowlists
            </h3>
            <p className="mt-0.5 text-[length:var(--text-xs)] text-white/55">
              Restrict which repos agents can clone before terminal workflows are approved.
            </p>
          </div>
          <SettingsAllowlistForm />
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          {allowlists.length === 0 ? (
            <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
              No allowlists configured yet.
            </p>
          ) : (
            <ul>
              {allowlists.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--text-sm)] text-white">
                      {entry.pattern}
                    </p>
                    <p className="mt-0.5 text-[length:var(--text-xs)] text-white/45">
                      Added {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="pb-3">
          <h3 className="text-[length:var(--text-base)] font-medium text-white">Terminal policy</h3>
          <p className="mt-0.5 text-[length:var(--text-xs)] text-white/55">
            High-risk command execution remains admin-only and repo-scoped.
          </p>
        </div>
        <div className="border border-border rounded-md divide-y divide-border-subtle">
          <div className="flex items-center gap-3 px-4 py-2.5 text-[length:var(--text-sm)] text-white">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            Non-main sandbox required
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 text-[length:var(--text-sm)] text-white">
            <Cable className="h-3.5 w-3.5 text-white/70" />
            Commands require explicit admin approval
          </div>
          {policy?.mission ? (
            <div className="px-4 py-2.5">
              <p className="app-kicker">Company mission</p>
              <p className="mt-1 text-[length:var(--text-sm)] text-white">{policy.mission}</p>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <div className="pb-3">
            <h3 className="text-[length:var(--text-base)] font-medium text-white">Approval queue</h3>
            <p className="mt-0.5 text-[length:var(--text-xs)] text-white/55">
              Recent terminal approvals visible from the settings hub.
            </p>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            {approvals.length === 0 ? (
              <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
                No approvals pending or recorded yet.
              </p>
            ) : (
              <ul>
                {approvals.slice(0, 8).map((approval) => (
                  <li
                    key={approval.id}
                    className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[length:var(--text-sm)] text-white">
                        {approval.command}
                      </p>
                      <p className="mt-0.5 text-[length:var(--text-xs)] text-white/45">
                        {new Date(approval.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={approval.status === "approved" ? "success" : "warning"}>
                      {approval.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <div className="pb-3">
            <h3 className="text-[length:var(--text-base)] font-medium text-white">Recent runs</h3>
            <p className="mt-0.5 text-[length:var(--text-xs)] text-white/55">
              Audited terminal executions with short output excerpts.
            </p>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            {runs.length === 0 ? (
              <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
                No terminal runs recorded yet.
              </p>
            ) : (
              <ul>
                {runs.slice(0, 8).map((run) => (
                  <li
                    key={run.id}
                    className="border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[length:var(--text-sm)] text-white">
                        {run.command}
                      </p>
                      <Badge variant={run.exit_code === 0 ? "success" : "warning"}>
                        exit {run.exit_code}
                      </Badge>
                    </div>
                    {run.stdout_excerpt ? (
                      <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
                        {run.stdout_excerpt}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
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
    <div className="settings-panel p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-white/60" />
        <p className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/55">
          {title}
        </p>
      </div>
      <div className="mt-2 text-[length:var(--text-xl)] font-medium tracking-[-0.01em] text-white">
        {value}
      </div>
      <p className="mt-1 text-[length:var(--text-xs)] text-white/55">{detail}</p>
    </div>
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
    <div className="border border-border-subtle rounded-md p-3">
      <p className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/55">
        {label}
      </p>
      <p className="mt-1.5 text-[length:var(--text-sm)] font-medium text-white">{value}</p>
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
    <div className="border border-border-subtle rounded-md p-4">
      <p className="text-[length:var(--text-sm)] font-medium text-white">{title}</p>
      <p className="mt-1.5 text-[length:var(--text-xs)] text-white/55">{description}</p>
    </div>
  );
}
