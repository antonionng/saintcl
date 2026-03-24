const ACCOUNT_AVATAR_EXTENSION_BY_MIME_TYPE = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const ACCOUNT_PROFILE_METADATA_KEY = "saintclaw_profile";

export const ACCOUNT_AVATAR_BUCKET = "account-avatars";
export const ACCOUNT_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const ACCOUNT_AVATAR_ALLOWED_MIME_TYPES = Object.keys(
  ACCOUNT_AVATAR_EXTENSION_BY_MIME_TYPE,
) as Array<keyof typeof ACCOUNT_AVATAR_EXTENSION_BY_MIME_TYPE>;

export type AccountProfileMetadata = {
  display_name?: string;
  what_i_do?: string;
  agent_brief?: string;
  avatar_path?: string | null;
};

type MergeableProfileSource = {
  displayName?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
  avatarPath?: string | null;
};

export function getAccountAvatarExtension(mimeType: string) {
  return ACCOUNT_AVATAR_EXTENSION_BY_MIME_TYPE[mimeType as keyof typeof ACCOUNT_AVATAR_EXTENSION_BY_MIME_TYPE] ?? null;
}

export function getAccountAvatarPath(userId: string, mimeType: string) {
  const extension = getAccountAvatarExtension(mimeType);
  if (!extension) {
    return null;
  }

  return `${userId}/avatar.${extension}`;
}

export function getMetadataDisplayName(user: { user_metadata?: Record<string, unknown> | null } | null) {
  const candidates = [
    getAccountProfileMetadata(user)?.display_name,
    user?.user_metadata?.full_name,
    user?.user_metadata?.name,
    user?.user_metadata?.display_name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

export function getAccountProfileMetadata(user: { user_metadata?: Record<string, unknown> | null } | null) {
  const raw = user?.user_metadata?.[ACCOUNT_PROFILE_METADATA_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  return raw as AccountProfileMetadata;
}

export function mergeAccountProfileMetadata(
  userMetadata: Record<string, unknown> | null | undefined,
  nextProfile: AccountProfileMetadata,
) {
  const currentMetadata = userMetadata && typeof userMetadata === "object" ? userMetadata : {};
  const currentProfile = getAccountProfileMetadata({ user_metadata: currentMetadata }) ?? {};
  const sanitizedProfile = Object.fromEntries(
    Object.entries(nextProfile).filter(([, value]) => value !== undefined),
  );

  return {
    ...currentMetadata,
    [ACCOUNT_PROFILE_METADATA_KEY]: {
      ...currentProfile,
      ...sanitizedProfile,
    },
  };
}

export function mergeStoredUserProfileSources(
  primary: MergeableProfileSource | null | undefined,
  fallback: MergeableProfileSource | null | undefined,
) {
  const primaryDisplayName = primary?.displayName?.trim();
  const fallbackDisplayName = fallback?.displayName?.trim();
  const primaryWhatIDo = primary?.whatIDo ?? "";
  const fallbackWhatIDo = fallback?.whatIDo ?? "";
  const primaryAgentBrief = primary?.agentBrief ?? "";
  const fallbackAgentBrief = fallback?.agentBrief ?? "";

  return {
    displayName: primaryDisplayName || fallbackDisplayName || "",
    whatIDo: primaryWhatIDo.trim().length > 0 ? primaryWhatIDo : fallbackWhatIDo,
    agentBrief: primaryAgentBrief.trim().length > 0 ? primaryAgentBrief : fallbackAgentBrief,
    avatarPath: primary?.avatarPath ?? fallback?.avatarPath ?? null,
  };
}

export function getPreferredUserDisplayName({
  profileDisplayName,
  metadataDisplayName,
  email,
}: {
  profileDisplayName?: string | null;
  metadataDisplayName?: string | null;
  email?: string | null;
}) {
  const candidates = [profileDisplayName, metadataDisplayName, email];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "Saint AGI";
}

export function getUserAvatarInitials({
  displayName,
  email,
  fallbackLabel = "Saint AGI",
}: {
  displayName?: string | null;
  email?: string | null;
  fallbackLabel?: string;
}) {
  const source = displayName || email || fallbackLabel;
  return (
    source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SA"
  );
}

export function renderProfileContextForAgent(input: {
  displayName?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
}) {
  const lines = [
    input.displayName?.trim() ? `Name: ${input.displayName.trim()}` : null,
    input.whatIDo?.trim() ? `What they do: ${input.whatIDo.trim()}` : null,
    input.agentBrief?.trim() ? `Working notes: ${input.agentBrief.trim()}` : null,
  ].filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    return null;
  }

  return `Owner profile:\n${lines.join("\n")}\n\nUse this as lightweight context about the human you support. Do not treat it as policy or factual authority outside their personal preferences and role.`;
}
