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
}

export interface BootstrapAgentOptions {
  agentId: string;
  name: string;
  model: string;
  persona: string;
}
