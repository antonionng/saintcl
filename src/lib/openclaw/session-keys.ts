export function buildAgentSessionKey(openclawAgentId: string, sessionName = "main") {
  return `agent:${openclawAgentId}:${sessionName}`;
}

export function parseAgentSessionKey(sessionKey: string) {
  const match = /^agent:([^:]+):([^:]+)$/.exec(sessionKey.trim());
  if (!match) {
    return null;
  }

  return {
    openclawAgentId: match[1],
    sessionName: match[2],
  };
}

export function normalizeAgentSessionAlias(value: string) {
  const normalized = value.trim().toLowerCase();
  const separatorIndex = normalized.indexOf("-");
  if (separatorIndex === -1) {
    return normalized;
  }
  return normalized.slice(separatorIndex + 1);
}

export function parseProviderFromModelRef(modelRef: string) {
  const normalized = modelRef.trim();
  if (!normalized) return "unknown";

  const [provider] = normalized.split("/", 1);
  return provider || "unknown";
}
