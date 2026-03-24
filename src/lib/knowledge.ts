const SUPPORTED_KNOWLEDGE_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);
const SUPPORTED_KNOWLEDGE_EXTENSIONS = new Map([
  ["txt", "text/plain"],
  ["md", "text/markdown"],
  ["markdown", "text/markdown"],
  ["csv", "text/csv"],
  ["json", "application/json"],
]);

export const KNOWLEDGE_DOCS_BUCKET = "knowledge-docs";
export const KNOWLEDGE_MAX_FILE_BYTES = 10 * 1024 * 1024;

export function resolveKnowledgeMimeType(filename: string, mimeType?: string | null) {
  const normalizedMimeType = mimeType?.trim().toLowerCase() ?? "";
  if (SUPPORTED_KNOWLEDGE_MIME_TYPES.has(normalizedMimeType)) {
    return normalizedMimeType;
  }

  const extension = filename.trim().toLowerCase().split(".").at(-1) ?? "";
  return SUPPORTED_KNOWLEDGE_EXTENSIONS.get(extension) ?? null;
}

export function isSupportedKnowledgeMimeType(mimeType: string, filename?: string) {
  if (SUPPORTED_KNOWLEDGE_MIME_TYPES.has(mimeType)) {
    return true;
  }

  if (!filename) {
    return false;
  }

  return resolveKnowledgeMimeType(filename, mimeType) !== null;
}

export function slugifyKnowledgeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function extractKnowledgeText(file: File) {
  if (!resolveKnowledgeMimeType(file.name, file.type)) {
    throw new Error("Upload TXT, MD, CSV, or JSON files for now.");
  }

  const text = (await file.text()).trim();
  if (!text) {
    throw new Error("This file is empty.");
  }

  return text;
}

export function estimateKnowledgeChunkCount(text: string, chunkSize = 1200) {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  return Math.max(1, Math.ceil(normalized.length / chunkSize));
}

export function renderKnowledgeWorkspaceFile(input: {
  title: string;
  scopeLabel: string;
  filename: string;
  contentText: string;
}) {
  return `# ${input.title}

Scope: ${input.scopeLabel}
Source file: ${input.filename}

${input.contentText}
`;
}
