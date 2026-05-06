export type OpenClawRuntimeStatus =
  | "stopped"
  | "starting"
  | "online"
  | "degraded"
  | "error";

export interface OpenClawRuntimePaths {
  root: string;
  stateRoot: string;
  configDir: string;
  configPath: string;
  workspaceRoot: string;
  logsDir: string;
  gatewayLogPath: string;
  metadataPath: string;
}

export interface OpenClawRuntimeDescriptor {
  id: string;
  orgId: string;
  gatewayPort: number;
  gatewayUrl: string;
  gatewayToken?: string;
  vendorPath: string;
  status: OpenClawRuntimeStatus;
  pid?: number;
  lastHeartbeatAt?: string;
  paths: OpenClawRuntimePaths;
}

export type OpenClawGatewaySource = "env" | "runtime" | "shard" | "assignment";

export interface OpenClawRuntimeState {
  id: string;
  orgId: string;
  gatewayPort: number;
  gatewayUrl: string;
  gatewayToken?: string;
  vendorPath: string;
  status: OpenClawRuntimeStatus;
  pid?: number;
  startedAt?: string;
  lastHeartbeatAt?: string;
}

export interface BootstrapTenantOptions {
  orgId: string;
  defaultModel?: string;
  approvedModels?: Array<{
    id: string;
    label?: string;
  }>;
}

export interface BootstrapAgentOrgContext {
  name?: string | null;
  website?: string | null;
  companySummary?: string | null;
  agentBrief?: string | null;
}

export interface BootstrapAgentUserContext {
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
}

export interface BootstrapAgentOptions {
  agentId: string;
  name: string;
  model: string;
  persona: string;
  org?: BootstrapAgentOrgContext | null;
  user?: BootstrapAgentUserContext | null;
}
