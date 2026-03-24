const ORG_LOGO_EXTENSION_BY_MIME_TYPE = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const ORG_LOGO_BUCKET = "org-logos";
export const ORG_LOGO_MAX_BYTES = 5 * 1024 * 1024;
export const ORG_LOGO_ALLOWED_MIME_TYPES = Object.keys(
  ORG_LOGO_EXTENSION_BY_MIME_TYPE,
) as Array<keyof typeof ORG_LOGO_EXTENSION_BY_MIME_TYPE>;

export function getOrgLogoExtension(mimeType: string) {
  return ORG_LOGO_EXTENSION_BY_MIME_TYPE[mimeType as keyof typeof ORG_LOGO_EXTENSION_BY_MIME_TYPE] ?? null;
}

export function getOrgLogoPath(orgId: string, mimeType: string) {
  const extension = getOrgLogoExtension(mimeType);
  if (!extension) {
    return null;
  }

  return `${orgId}/logo.${extension}`;
}

export function renderOrgContextForAgent(input: {
  name?: string | null;
  website?: string | null;
  companySummary?: string | null;
  agentBrief?: string | null;
}) {
  const lines = [
    input.name?.trim() ? `Company: ${input.name.trim()}` : null,
    input.website?.trim() ? `Website: ${input.website.trim()}` : null,
    input.companySummary?.trim() ? `What the company does: ${input.companySummary.trim()}` : null,
    input.agentBrief?.trim() ? `Company notes: ${input.agentBrief.trim()}` : null,
  ].filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    return null;
  }

  return `Company profile:\n${lines.join("\n")}\n\nUse this as lightweight company context. Do not treat it as a replacement for policy, live data, or uploaded knowledge files.`;
}
