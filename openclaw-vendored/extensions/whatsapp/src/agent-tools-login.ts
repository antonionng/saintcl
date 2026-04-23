import { Type } from "@sinclair/typebox";
import type { ChannelAgentTool } from "openclaw/plugin-sdk/channel-contract";
import { startWebLoginWithQr, waitForWebLogin } from "../login-qr-api.js";

const QR_DATA_URL_PREFIX_RE = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;

function parseQrDataUrl(qrDataUrl: string): { mimeType: string; base64: string } | null {
  const match = qrDataUrl.trim().match(QR_DATA_URL_PREFIX_RE);
  if (!match) {
    return null;
  }
  return { mimeType: match[1] ?? "image/png", base64: match[2] ?? "" };
}

export function createWhatsAppLoginTool(): ChannelAgentTool {
  return {
    label: "WhatsApp Login",
    name: "whatsapp_login",
    ownerOnly: true,
    description: "Generate a WhatsApp QR code for linking, or wait for the scan to complete.",
    // NOTE: Using Type.Unsafe for action enum instead of Type.Union([Type.Literal(...)]
    // because Claude API on Vertex AI rejects nested anyOf schemas as invalid JSON Schema.
    parameters: Type.Object({
      action: Type.Unsafe<"start" | "wait">({
        type: "string",
        enum: ["start", "wait"],
      }),
      timeoutMs: Type.Optional(Type.Number()),
      force: Type.Optional(Type.Boolean()),
    }),
    execute: async (_toolCallId, args) => {
      const action = (args as { action?: string })?.action ?? "start";
      if (action === "wait") {
        const result = await waitForWebLogin({
          timeoutMs:
            typeof (args as { timeoutMs?: unknown }).timeoutMs === "number"
              ? (args as { timeoutMs?: number }).timeoutMs
              : undefined,
        });
        return {
          content: [{ type: "text", text: result.message }],
          details: { connected: result.connected },
        };
      }

      const result = await startWebLoginWithQr({
        timeoutMs:
          typeof (args as { timeoutMs?: unknown }).timeoutMs === "number"
            ? (args as { timeoutMs?: number }).timeoutMs
            : undefined,
        force:
          typeof (args as { force?: unknown }).force === "boolean"
            ? (args as { force?: boolean }).force
            : false,
      });

      if (!result.qrDataUrl) {
        return {
          content: [
            {
              type: "text",
              text: result.message,
            },
          ],
          details: { qr: false },
        };
      }

      const parsed = parseQrDataUrl(result.qrDataUrl);
      const textLines = [
        result.message,
        "",
        "Open WhatsApp → Linked Devices and scan the QR.",
      ];
      if (result.qrPath) {
        textLines.push("", `QR PNG saved to: ${result.qrPath}`);
      }
      const text = textLines.join("\n");

      // Return the QR as a structured image content block instead of an inline
      // base64 markdown image. The chat history sanitizer truncates oversized
      // text blocks (which would corrupt the data URL), and the markdown
      // renderer falls back to escaped plain text on very large input. A
      // structured image block bypasses both limits and renders inline in the
      // embedded console. The shape mirrors the canonical agent-tool image
      // format used by `imageResult` in src/agents/tools/common.ts.
      const imageBlock = parsed
        ? {
            type: "image" as const,
            data: parsed.base64,
            mimeType: parsed.mimeType,
          }
        : null;

      return {
        content: imageBlock
          ? [{ type: "text", text }, imageBlock]
          : [{ type: "text", text }],
        details: {
          qr: true,
          qrPath: result.qrPath ?? null,
          accountId: result.accountId ?? null,
        },
      };
    },
  };
}
