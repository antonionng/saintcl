type AgentLike = {
  status?: string | null;
  config?: unknown;
};

function hasProvisionedWorkspace(config: unknown) {
  return (
    Boolean(config) &&
    typeof config === "object" &&
    !Array.isArray(config) &&
    typeof (config as Record<string, unknown>).workspace === "string" &&
    ((config as Record<string, unknown>).workspace as string).trim().length > 0
  );
}

export function getAgentDisplayStatus(agent: AgentLike) {
  if (agent.status === "provisioning" && hasProvisionedWorkspace(agent.config)) {
    return "online";
  }

  return agent.status ?? "offline";
}

export function getAgentStatusLabel(agent: AgentLike) {
  const status = getAgentDisplayStatus(agent);
  if (status === "online") return "ready";
  return status;
}
