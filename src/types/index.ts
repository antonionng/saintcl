export type PlanTier = "starter" | "pro" | "business" | "enterprise";
export type BillingInterval = "monthly" | "annual";
export type OrgTrialStatus = "none" | "active" | "expired" | "converted";
export type OrgRole = "owner" | "admin" | "member" | "employee";

export type AgentStatus = "online" | "offline" | "provisioning";
export type ChannelType = "telegram" | "slack";
export type RuntimeStatus = "stopped" | "starting" | "online" | "degraded" | "error";
export type TerminalApprovalStatus = "pending" | "approved" | "denied" | "executed";
export type AgentAssigneeType = "employee" | "team" | "org";
export type KnowledgeScopeType = "org" | "team" | "user";
export type WalletLedgerDirection = "credit" | "debit";
export type ObservabilitySource =
  | "gateway_http"
  | "gateway_rpc"
  | "runtime_lifecycle"
  | "session_usage_logs"
  | "session_usage_sync";
export type RequestEventStatus = "started" | "completed" | "failed";
export type SessionActivityLevel = "info" | "warn" | "error";
export type WalletLedgerSourceType =
  | "stripe_topup"
  | "manual_credit"
  | "usage_agent_provision"
  | "usage_channel_connect"
  | "usage_api"
  | "usage_team_invite"
  | "invite_reversal"
  | "adjustment";
export type EmailEventCategory = "transactional" | "marketing";
export type EmailEventStatus = "queued" | "sent" | "skipped" | "failed";
export type OrgInviteStatus = "pending" | "sent" | "accepted" | "revoked" | "expired" | "delivery_failed";
export type InviteBillingStatus = "pending" | "charged" | "reversed" | "not_required";

export interface AgentRecord {
  id: string;
  orgId: string;
  userId: string;
  runtimeId: string;
  name: string;
  openclawAgentId: string;
  model: string;
  persona: string;
  status: AgentStatus;
  tools: string[];
  channels: ChannelType[];
  lastActiveAt: string;
}

export interface ChannelRecord {
  id: string;
  agentId: string;
  type: ChannelType;
  status: "connected" | "pending" | "disconnected";
  identifier: string;
  connectedAt: string;
}

export interface LogRecord {
  id: string;
  agentId: string;
  level: "info" | "warn" | "error";
  source?: "gateway" | "control-plane" | "terminal";
  message: string;
  timestamp: string;
}

export interface KnowledgeDocument {
  id: string;
  orgId: string;
  scopeType: KnowledgeScopeType;
  teamId?: string | null;
  userId?: string | null;
  filename: string;
  mimeType?: string | null;
  contentText?: string;
  chunkCount: number;
  status: "indexed" | "processing";
  updatedAt: string;
}

export interface TeamRecord {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  delta: string;
}

export interface RuntimeRecord {
  id: string;
  orgId: string;
  stateRoot: string;
  configPath: string;
  workspaceRoot: string;
  gatewayPort: number;
  gatewayToken?: string;
  status: RuntimeStatus;
  pid?: number;
  lastHeartbeatAt: string;
}

export interface RepoAllowlistRecord {
  id: string;
  orgId: string;
  pattern: string;
  createdBy: string;
  createdAt: string;
}

export interface AgentTerminalRepoAllowlistRecord {
  id: string;
  orgId: string;
  agentId: string;
  repoPath: string;
  createdBy?: string | null;
  createdAt: string;
}

export interface TerminalApprovalRecord {
  id: string;
  orgId: string;
  agentId: string;
  requestedBy: string;
  command: string;
  repo?: string;
  status: TerminalApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface TerminalRunRecord {
  id: string;
  orgId: string;
  agentId: string;
  approvalId: string;
  command: string;
  exitCode: number;
  stdoutExcerpt: string;
  stderrExcerpt: string;
  createdAt: string;
}

export interface OrgWallet {
  orgId: string;
  balanceCents: number;
  currency: string;
  lowBalanceThresholdCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  orgId: string;
  userId?: string | null;
  agentId?: string | null;
  sourceType: WalletLedgerSourceType | string;
  direction: WalletLedgerDirection;
  amountCents: number;
  balanceAfterCents?: number | null;
  description: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface UsageEventRecord {
  id: string;
  orgId: string;
  userId?: string | null;
  agentId?: string | null;
  eventType: string;
  quantity: number;
  unit: string;
  amountCents: number;
  sessionKey?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RequestEventRecord {
  id: string;
  orgId: string;
  agentId?: string | null;
  actorUserId?: string | null;
  sessionKey?: string | null;
  requestId?: string | null;
  source: ObservabilitySource | string;
  eventType: string;
  path?: string | null;
  method?: string | null;
  provider?: string | null;
  model?: string | null;
  channel?: string | null;
  status: RequestEventStatus | string;
  statusCode?: number | null;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cacheReadTokens?: number | null;
  cacheWriteTokens?: number | null;
  costUsd?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface SessionActivityEventRecord {
  id: string;
  orgId: string;
  agentId?: string | null;
  actorUserId?: string | null;
  sessionKey?: string | null;
  source: ObservabilitySource | string;
  eventType: string;
  level: SessionActivityLevel | string;
  role?: string | null;
  provider?: string | null;
  model?: string | null;
  channel?: string | null;
  message: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface AgentAssignmentRecord {
  id: string;
  orgId: string;
  agentId: string;
  assigneeType: AgentAssigneeType;
  assigneeRef: string;
  createdBy?: string | null;
  createdAt: string;
}

export interface OrgPolicyRecord {
  orgId: string;
  mission: string;
  reasonForAgents: string;
  guardrails: Record<string, unknown>;
  defaultModel?: string | null;
  approvedModels?: Array<{
    id: string;
    label?: string;
    description?: string | null;
    contextWindow?: number | null;
    inputCostPerMillionCents?: number | null;
    outputCostPerMillionCents?: number | null;
    isFree?: boolean;
  }>;
  blockedModels?: string[];
  modelGuardrails?: {
    allowAgentOverride: boolean;
    allowSessionOverride: boolean;
    requireApprovalForPremiumModels: boolean;
    premiumInputCostPerMillionCents?: number | null;
    premiumOutputCostPerMillionCents?: number | null;
  };
  requireApprovalOnSpend: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBudgetOverrideRecord {
  id: string;
  orgId: string;
  userId: string;
  softLimitCents?: number | null;
  hardLimitCents?: number | null;
  alertThresholdCents?: number | null;
  createdAt: string;
}

export interface UserProfileRecord {
  userId: string;
  displayName: string;
  whatIDo: string;
  agentBrief: string;
  avatarPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailPreferenceRecord {
  id: string;
  orgId: string;
  userId: string;
  marketingOptIn: boolean;
  weeklyDigestOptIn: boolean;
  welcomeSeriesOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrgInviteRecord {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  teamId?: string | null;
  invitedBy?: string | null;
  status: OrgInviteStatus;
  billingStatus: InviteBillingStatus;
  billedAmountCents: number;
  resendMessageId?: string | null;
  lastError?: string | null;
  expiresAt: string;
  sentAt?: string | null;
  acceptedBy?: string | null;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EmailEventRecord {
  id: string;
  orgId: string;
  userId?: string | null;
  inviteId?: string | null;
  email: string;
  templateKey: string;
  campaignKey?: string | null;
  category: EmailEventCategory;
  status: EmailEventStatus;
  dedupeKey?: string | null;
  subject: string;
  resendMessageId?: string | null;
  errorMessage?: string | null;
  metadata: Record<string, unknown>;
  sentAt?: string | null;
  createdAt: string;
}

export interface CurrentUserProfile {
  userId: string;
  email: string | null;
  role: OrgRole;
  displayName: string;
  whatIDo: string;
  agentBrief: string;
  avatarPath?: string | null;
  avatarUrl?: string | null;
}

export interface OrgCapabilities {
  canManageBilling: boolean;
  canManagePolicies: boolean;
  canManageAgents: boolean;
  canViewAllAgents: boolean;
  canManageConsole: boolean;
  canManageAdminTools: boolean;
}

export interface WorkspaceMembership {
  org: {
    id: string;
    name: string;
    slug: string;
    plan: PlanTier | string;
    billing_interval?: BillingInterval | null;
    trial_status?: OrgTrialStatus | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    trial_plan?: PlanTier | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_subscription_status?: string | null;
    stripe_price_id?: string | null;
    stripe_current_period_end?: string | null;
    website?: string;
    company_summary?: string;
    agent_brief?: string;
    logo_path?: string | null;
    logoUrl?: string | null;
    created_at: string;
  };
  role: OrgRole;
  capabilities: OrgCapabilities;
}

export interface CurrentOrgSession {
  org: {
    id: string;
    name: string;
    slug: string;
    plan: PlanTier | string;
    billing_interval?: BillingInterval | null;
    trial_status?: OrgTrialStatus | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    trial_plan?: PlanTier | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_subscription_status?: string | null;
    stripe_price_id?: string | null;
    stripe_current_period_end?: string | null;
    website?: string;
    company_summary?: string;
    agent_brief?: string;
    logo_path?: string | null;
    logoUrl?: string | null;
    created_at: string;
  };
  role: OrgRole;
  isSuperAdmin: boolean;
  userId: string;
  email?: string | null;
  capabilities: OrgCapabilities;
}
