import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_AVATAR_EXTENSION_BY_MIME_TYPE = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const AGENT_AVATAR_BUCKET = "agent-avatars";
export const AGENT_AVATAR_MAX_BYTES = 512 * 1024;
export const AGENT_AVATAR_ALLOWED_MIME_TYPES = Object.keys(
  AGENT_AVATAR_EXTENSION_BY_MIME_TYPE,
) as Array<keyof typeof AGENT_AVATAR_EXTENSION_BY_MIME_TYPE>;

export function getAgentAvatarExtension(mimeType: string) {
  return AGENT_AVATAR_EXTENSION_BY_MIME_TYPE[mimeType as keyof typeof AGENT_AVATAR_EXTENSION_BY_MIME_TYPE] ?? null;
}

export function getAgentAvatarPath(orgId: string, agentId: string, mimeType: string) {
  const extension = getAgentAvatarExtension(mimeType);
  if (!extension) {
    return null;
  }

  return `${orgId}/${agentId}/avatar.${extension}`;
}

export async function getSignedAgentAvatarUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.storage.from(AGENT_AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) {
    return null;
  }

  return data.signedUrl;
}
