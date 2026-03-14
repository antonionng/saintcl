export type PlanTier = "free" | "pro" | "team";
export type OrgRole = "owner" | "admin" | "member" | "employee";

export type AgentStatus = "online" | "offline" | "provisioning";
export type ChannelType = "telegram" | "slack";
export type RuntimeStatus = "stopped" | "starting" | "online" | "degraded" | "error";
export type TerminalApprovalStatus = "pending" | "approved" | "denied" | "executed";
export type AgentAssigneeType = "employee" | "team" | "org";
export type WalletLedgerDirection = "credit" | "debit";
export type WalletLedgerSourceType =
  | "stripe_topup"
  | "manual_credit"
  | "usage_agent_provision"
  | "usage_channel_connect"
  | "usage_api"
  | "adjustment";

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
  filename: string;
  chunkCount: number;
  status: "indexed" | "processing";
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

export interface OrgCapabilities {
  canManageBilling: boolean;
  canManagePolicies: boolean;
  canManageAgents: boolean;
  canViewAllAgents: boolean;
  canManageConsole: boolean;
  canManageAdminTools: boolean;
}

export interface CurrentOrgSession {
  org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    created_at: string;
  };
  role: OrgRole;
  userId: string;
  email?: string | null;
  capabilities: OrgCapabilities;
}
