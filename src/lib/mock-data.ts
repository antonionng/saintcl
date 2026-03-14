import type {
  AgentRecord,
  ChannelRecord,
  DashboardStat,
  KnowledgeDocument,
  LogRecord,
  PlanTier,
  RepoAllowlistRecord,
  RuntimeRecord,
  TerminalApprovalRecord,
  TerminalRunRecord,
} from "@/types";

export const dashboardStats: DashboardStat[] = [
  { id: "agents", label: "Active agents", value: "12", delta: "+4 this month" },
  { id: "runs", label: "Runs today", value: "1,284", delta: "+18% week over week" },
  { id: "response", label: "Median response", value: "2.3s", delta: "Stable" },
  { id: "automation", label: "Estimated ROI", value: "$48k", delta: "Projected annualized" },
];

export const agents: AgentRecord[] = [
  {
    id: "agt_sales_01",
    orgId: "org_001",
    userId: "user_001",
    runtimeId: "rt_org_001",
    name: "Revenue Operator",
    openclawAgentId: "revenue-operator",
    model: "anthropic/claude-sonnet-4",
    persona: "Proactive sales operator that enriches leads, drafts outreach, and prepares briefs.",
    status: "online",
    tools: ["browser", "crm", "knowledge-search"],
    channels: ["telegram", "slack"],
    lastActiveAt: "2 minutes ago",
  },
  {
    id: "agt_ops_02",
    orgId: "org_001",
    userId: "user_002",
    runtimeId: "rt_org_001",
    name: "Ops Sentinel",
    openclawAgentId: "ops-sentinel",
    model: "openai/gpt-4.1-mini",
    persona: "Monitors anomalies, summarizes incidents, and proposes approval-safe remediations.",
    status: "provisioning",
    tools: ["analytics", "reporting"],
    channels: ["slack"],
    lastActiveAt: "Provisioning now",
  },
  {
    id: "agt_research_03",
    orgId: "org_001",
    userId: "user_003",
    runtimeId: "rt_org_001",
    name: "Research Desk",
    openclawAgentId: "research-desk",
    model: "google/gemini-2.5-pro",
    persona: "Tracks competitors, keeps market memory warm, and ships executive digests.",
    status: "offline",
    tools: ["web", "knowledge-search"],
    channels: ["telegram"],
    lastActiveAt: "14 hours ago",
  },
];

export const channels: ChannelRecord[] = [
  {
    id: "chn_telegram_1",
    agentId: "agt_sales_01",
    type: "telegram",
    status: "connected",
    identifier: "@saintclaw_sales_bot",
    connectedAt: "Mar 08, 2026",
  },
  {
    id: "chn_slack_1",
    agentId: "agt_sales_01",
    type: "slack",
    status: "connected",
    identifier: "saintclaw-workspace",
    connectedAt: "Mar 07, 2026",
  },
  {
    id: "chn_slack_2",
    agentId: "agt_ops_02",
    type: "slack",
    status: "pending",
    identifier: "ops-squad",
    connectedAt: "Awaiting OAuth approval",
  },
];

export const logs: LogRecord[] = [
  {
    id: "log_1",
    agentId: "agt_sales_01",
    level: "info",
    source: "gateway",
    message: "Lead enrichment completed for 12 accounts and queued three outreach drafts.",
    timestamp: "16:04 UTC",
  },
  {
    id: "log_2",
    agentId: "agt_sales_01",
    level: "warn",
    source: "control-plane",
    message: "Slack rate limit approached; falling back to scheduled send window.",
    timestamp: "15:41 UTC",
  },
  {
    id: "log_3",
    agentId: "agt_sales_01",
    level: "info",
    source: "terminal",
    message: "Knowledge search refreshed from quarterly battlecards upload.",
    timestamp: "15:20 UTC",
  },
  {
    id: "log_4",
    agentId: "agt_ops_02",
    level: "error",
    source: "gateway",
    message: "OpenClaw heartbeat missed. Provisioner is retrying workspace bootstrap.",
    timestamp: "14:53 UTC",
  },
];

export const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: "doc_1",
    filename: "enterprise-pricing-playbook.pdf",
    chunkCount: 184,
    status: "indexed",
    updatedAt: "Mar 08, 2026",
  },
  {
    id: "doc_2",
    filename: "q1-product-roadmap.md",
    chunkCount: 48,
    status: "indexed",
    updatedAt: "Mar 06, 2026",
  },
  {
    id: "doc_3",
    filename: "support-escalations.csv",
    chunkCount: 92,
    status: "processing",
    updatedAt: "Uploading now",
  },
];

export const runtimes: RuntimeRecord[] = [
  {
    id: "rt_org_001",
    orgId: "org_001",
    stateRoot: "runtime-data/openclaw/org-001/state",
    configPath: "runtime-data/openclaw/org-001/config/openclaw.json",
    workspaceRoot: "runtime-data/openclaw/org-001/workspaces",
    gatewayPort: 19124,
    gatewayToken: "tenant-token-redacted",
    status: "online",
    pid: 42811,
    lastHeartbeatAt: "2026-03-08T18:41:00.000Z",
  },
];

export const repoAllowlists: RepoAllowlistRecord[] = [
  {
    id: "allow_1",
    orgId: "org_001",
    pattern: "github.com/saintclaw",
    createdBy: "antonio",
    createdAt: "Mar 08, 2026",
  },
  {
    id: "allow_2",
    orgId: "org_001",
    pattern: "github.com/company-org",
    createdBy: "antonio",
    createdAt: "Mar 08, 2026",
  },
];

export const terminalApprovals: TerminalApprovalRecord[] = [
  {
    id: "approval_1",
    orgId: "org_001",
    agentId: "agt_sales_01",
    requestedBy: "antonio",
    command: "git clone https://github.com/company-org/qbr-playbooks.git",
    repo: "https://github.com/company-org/qbr-playbooks.git",
    status: "pending",
    createdAt: "18:21 UTC",
  },
  {
    id: "approval_2",
    orgId: "org_001",
    agentId: "agt_ops_02",
    requestedBy: "antonio",
    command: "pnpm install && pnpm lint",
    status: "approved",
    approvedBy: "antonio",
    approvedAt: "18:16 UTC",
    createdAt: "18:13 UTC",
  },
];

export const terminalRuns: TerminalRunRecord[] = [
  {
    id: "run_1",
    orgId: "org_001",
    agentId: "agt_ops_02",
    approvalId: "approval_2",
    command: "pnpm install && pnpm lint",
    exitCode: 0,
    stdoutExcerpt: "Dependencies installed. Lint completed with zero errors.",
    stderrExcerpt: "",
    createdAt: "18:18 UTC",
  },
];

export const billingPlans: Array<{
  id: PlanTier;
  name: string;
  price: string;
  description: string;
  features: string[];
}> = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "One always-on agent for solo operators validating ROI.",
    features: ["1 agent", "Telegram or Slack", "Basic logs"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    description: "For teams running dedicated agents per function.",
    features: ["5 agents", "Usage-based runs", "Knowledge uploads"],
  },
  {
    id: "team",
    name: "Team",
    price: "$99",
    description: "Multi-user governance, RAG, and shared operating memory.",
    features: ["25 agents", "RAG enabled", "Approval workflows"],
  },
];

export const monthlyUsage = [
  { name: "Mon", runs: 112, messages: 480 },
  { name: "Tue", runs: 148, messages: 610 },
  { name: "Wed", runs: 176, messages: 740 },
  { name: "Thu", runs: 164, messages: 702 },
  { name: "Fri", runs: 210, messages: 861 },
  { name: "Sat", runs: 138, messages: 512 },
  { name: "Sun", runs: 124, messages: 488 },
];
