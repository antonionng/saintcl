import fsp from "node:fs/promises";
import path from "node:path";
import { resolvePreferredOpenClawTmpDir } from "openclaw/plugin-sdk/temp-path";

// Mirrors extensions/zalouser/src/qr-temp-file.ts. We persist the WhatsApp
// pairing QR as a real PNG on disk so the agent tool result can stay small
// (the chat history sanitizer truncates oversized text blocks, which would
// corrupt an inline base64 data URL).
export async function writeQrDataUrlToTempFile(
  qrDataUrl: string,
  accountId: string,
): Promise<string | null> {
  const trimmed = qrDataUrl.trim();
  const match = trimmed.match(/^data:image\/png;base64,(.+)$/i);
  const base64 = (match?.[1] ?? "").trim();
  if (!base64) {
    return null;
  }
  const safeAccountId = accountId.replace(/[^a-zA-Z0-9_-]+/g, "-") || "default";
  const filePath = path.join(
    resolvePreferredOpenClawTmpDir(),
    `openclaw-whatsapp-qr-${safeAccountId}.png`,
  );
  await fsp.writeFile(filePath, Buffer.from(base64, "base64"));
  return filePath;
}
