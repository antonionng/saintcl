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
export type TrainingProgrammeStatus = "planning" | "active" | "archived";
export type TrainingModuleStatus = "draft" | "scheduled" | "ready" | "live" | "complete";
export type TrainingParticipantStatus = "invited" | "checked_in" | "active" | "completed";
export type TrainingEnrollmentStatus = "enrolled" | "in_progress" | "completed";
export type TrainingContentKind =
  | "slide"
  | "lab"
  | "assessment"
  | "dataset"
  | "notebook"
  | "workbook"
  | "facilitator_guide"
  | "solution";
export type TrainingSubmissionStatus = "draft" | "submitted" | "reviewed";
export type TrainingScope =
  | "module"
  | "checkpoint"
  | "task"
  | "assessment_question"
  | "notebook";
export type TrainingSubmissionKind =
  | "notebook_snapshot"
  | "artifact_link"
  | "file_upload"
  | "workbench_state"
  | "prompt_variant"
  | "model_card"
  | "chart_spec"
  | "flow_design"
  | "strategy_canvas";
export type TrainingDeliveryMode = "online" | "hybrid" | "in_person";

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

export interface PersonaRecord {
  id: string;
  orgId?: string | null;
  name: string;
  description: string;
  instructions: string;
  icon?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  source: "builtin" | "org";
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
  skillPolicy?: {
    allowedSources: Array<"clawhub" | "github" | "custom">;
    allowedTrustTiers: Array<"official" | "curated" | "community">;
    requireApprovalForCommunity: boolean;
  };
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
  canManageTraining: boolean;
  canManagePlatformTraining: boolean;
}

export interface TrainingProgrammeRecord {
  id: string;
  orgId?: string | null;
  slug: string;
  name: string;
  clientName?: string | null;
  description: string;
  status: TrainingProgrammeStatus;
  targetSlideCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingModuleRecord {
  id: string;
  orgId?: string | null;
  programmeId: string;
  slug: string;
  title: string;
  sequence: number;
  status: TrainingModuleStatus;
  deliveryMode: TrainingDeliveryMode;
  durationDays: number;
  hoursPerDay: number;
  startDate?: string | null;
  endDate?: string | null;
  targetSlideCount: number;
  summary: string;
  learningObjectives: string[];
  keyThemes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCohortRecord {
  id: string;
  orgId?: string | null;
  programmeId: string;
  slug: string;
  name: string;
  audience: string;
  inviteCode?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  status: "draft" | "scheduled" | "active" | "complete";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingParticipantRecord {
  id: string;
  orgId?: string | null;
  authUserId?: string | null;
  cohortId: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  status: TrainingParticipantStatus;
  checkInToken?: string | null;
  checkedInAt?: string | null;
  lastSeenAt?: string | null;
  displayName?: string | null;
  roleAtCompany?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCohortPostRecord {
  id: string;
  orgId?: string | null;
  cohortId: string;
  participantId: string | null;
  facilitatorUserId: string | null;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  author: {
    kind: "participant" | "facilitator";
    participantId?: string | null;
    facilitatorUserId?: string | null;
    displayName: string;
    roleAtCompany?: string | null;
  };
}

export interface TrainingEnrollmentRecord {
  id: string;
  orgId?: string | null;
  cohortId: string;
  moduleId: string;
  participantId: string;
  status: TrainingEnrollmentStatus;
  progressPercent: number;
  completedAt?: string | null;
  lastEventAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingContentItemRecord {
  id: string;
  orgId?: string | null;
  moduleId: string;
  kind: TrainingContentKind;
  slug: string;
  title: string;
  sequence: number;
  estimatedMinutes?: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingLabWorkspaceRecord {
  id: string;
  orgId?: string | null;
  moduleId: string;
  participantId: string;
  contentItemId?: string | null;
  provider: string;
  status: "provisioning" | "active" | "paused" | "stopped" | "error";
  launchUrl?: string | null;
  runtimeImage?: string | null;
  notebookPath?: string | null;
  metadata: Record<string, unknown>;
  lastHeartbeatAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSubmissionRecord {
  id: string;
  orgId?: string | null;
  moduleId: string;
  participantId: string;
  contentItemId?: string | null;
  status: TrainingSubmissionStatus;
  scoreBand?: "competent" | "strong" | "exceptional" | null;
  artifactUrl?: string | null;
  summary?: string | null;
  metadata: Record<string, unknown>;
  scope: TrainingScope;
  scopeId?: string | null;
  kind?: TrainingSubmissionKind | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TrainingAiAssessmentScoreBand =
  | "proficient"
  | "developing"
  | "needs_retry"
  | "not_graded";

export interface TrainingAiAssessmentCriterionScore {
  criterion: string;
  score: TrainingAiAssessmentScoreBand;
  notes: string;
}

export interface TrainingAiAssessmentRuleSignal {
  taskId?: string | null;
  taskTitle?: string | null;
  state: "passed" | "retry_needed" | "guided_complete" | "not_started";
  message?: string | null;
}

export interface TrainingAiAssessmentRecord {
  scoreBand: TrainingAiAssessmentScoreBand;
  criterionScores: TrainingAiAssessmentCriterionScore[];
  summary: string;
  suggestedNextStep: string;
  ruleSignals: TrainingAiAssessmentRuleSignal[];
  model: string | null;
  status: "completed" | "failed" | "skipped";
  facilitatorOverride?: {
    scoreBand?: TrainingAiAssessmentScoreBand | null;
    notes?: string | null;
    reviewedAt?: string | null;
  } | null;
}

export interface TrainingParticipantNoteRecord {
  id: string;
  orgId?: string | null;
  participantId: string;
  moduleId: string;
  scope: TrainingScope;
  scopeId: string;
  bodyMarkdown: string;
  bodyJson: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingLiveSessionRecord {
  id: string;
  orgId?: string | null;
  cohortId: string;
  moduleId: string;
  facilitatorUserId?: string | null;
  currentSlideId?: string | null;
  currentSlideIndex: number;
  broadcastEnabled: boolean;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface TrainingParticipantLabCheckpointRecord {
  participant: TrainingParticipantRecord;
  labSlug: string;
  labTitle: string;
  status: "not_started" | "launched" | "completed";
  completionMode?: "passed" | "guided_complete" | "retry_needed" | null;
  taskSummary?: string | null;
  launchedAt?: string | null;
  completedAt?: string | null;
  lastEventAt?: string | null;
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
    website_enriched_url?: string | null;
    website_enriched_at?: string | null;
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
    website_enriched_url?: string | null;
    website_enriched_at?: string | null;
    created_at: string;
  };
  role: OrgRole;
  isSuperAdmin: boolean;
  userId: string;
  email?: string | null;
  capabilities: OrgCapabilities;
}
