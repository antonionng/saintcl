export const AGENT_AVATAR_COLORS = [
  ["#7c3aed", "#22d3ee"],
  ["#2563eb", "#a855f7"],
  ["#059669", "#84cc16"],
  ["#ea580c", "#f43f5e"],
  ["#0891b2", "#6366f1"],
  ["#be123c", "#f97316"],
  ["#0f766e", "#38bdf8"],
  ["#9333ea", "#ec4899"],
] as const;

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getAgentInitials(name: string) {
  const words = name
    .trim()
    .replace(/\s+agent$/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return initials || "AI";
}

export type AgentAvatarConfig = {
  initials?: string | null;
  theme?: number | null;
  imagePath?: string | null;
  imageDataUrl?: string | null;
};

export function normalizeAgentAvatarConfig(value: unknown): AgentAvatarConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  return {
    initials: typeof source.initials === "string" ? source.initials : null,
    theme: typeof source.theme === "number" ? source.theme : null,
    imagePath: typeof source.imagePath === "string" ? source.imagePath : null,
    imageDataUrl: typeof source.imageDataUrl === "string" ? source.imageDataUrl : null,
  };
}

export function getAgentAvatarTheme(agentId: string, name: string, config: AgentAvatarConfig = {}) {
  const hash = hashString(`${agentId}:${name}`);
  const themeIndex =
    typeof config.theme === "number" && Number.isInteger(config.theme)
      ? Math.abs(config.theme) % AGENT_AVATAR_COLORS.length
      : hash % AGENT_AVATAR_COLORS.length;
  const colors = AGENT_AVATAR_COLORS[themeIndex] ?? AGENT_AVATAR_COLORS[0];
  const initials = config.initials?.trim().slice(0, 3).toUpperCase() || getAgentInitials(name);
  return {
    from: colors[0],
    to: colors[1],
    initials,
    theme: themeIndex,
  };
}

export function getAgentAvatarDataUri(agentId: string, name: string, config: AgentAvatarConfig = {}) {
  if (config.imageDataUrl?.startsWith("data:image/")) {
    return config.imageDataUrl;
  }

  const theme = getAgentAvatarTheme(agentId, name, config);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${theme.from}"/><stop offset="1" stop-color="${theme.to}"/></linearGradient></defs><rect width="96" height="96" rx="24" fill="url(#g)"/><circle cx="72" cy="22" r="18" fill="rgba(255,255,255,.16)"/><text x="48" y="58" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="white">${escapeSvgText(theme.initials)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
