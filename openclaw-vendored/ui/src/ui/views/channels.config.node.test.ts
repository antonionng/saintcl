import { describe, expect, it } from "vitest";
import { buildChannelConfigSchema } from "../../../../src/channels/plugins/config-schema.ts";
import { TelegramConfigSchema } from "../../../../src/config/zod-schema.providers-core.ts";
import { WhatsAppConfigSchema } from "../../../../src/config/zod-schema.providers-whatsapp.ts";
import { pruneChannelSchemaForForm } from "./channels.config.ts";

function wrapChannelSchema(channelId: string, schema: Record<string, unknown>) {
  return {
    type: "object",
    properties: {
      channels: {
        type: "object",
        properties: {
          [channelId]: schema,
        },
      },
    },
  };
}

describe("pruneChannelSchemaForForm", () => {
  it("removes unsupported Telegram advanced branches from the embedded form schema", () => {
    const result = pruneChannelSchemaForForm({
      channelId: "telegram",
      schema: wrapChannelSchema("telegram", buildChannelConfigSchema(TelegramConfigSchema).schema),
    });

    expect(result.schema).toBeTruthy();
    expect(result.hiddenAdvancedFields).toBe(true);

    const schema = result.schema as { properties?: Record<string, unknown> };
    const properties = schema.properties ?? {};
    expect(properties.botToken).toBeTruthy();
    expect(properties.accounts).toBeUndefined();
    expect(properties.capabilities).toBeUndefined();
    expect(properties.customCommands).toBeUndefined();
  });

  it("keeps the WhatsApp embedded form schema intact", () => {
    const result = pruneChannelSchemaForForm({
      channelId: "whatsapp",
      schema: wrapChannelSchema("whatsapp", buildChannelConfigSchema(WhatsAppConfigSchema).schema),
    });

    expect(result.schema).toBeTruthy();
    expect(result.hiddenAdvancedFields).toBe(false);

    const schema = result.schema as { properties?: Record<string, unknown> };
    const properties = schema.properties ?? {};
    expect(properties.messagePrefix).toBeTruthy();
    expect(properties.accounts).toBeTruthy();
  });

  it("preserves inferred object types when the channel node omits type", () => {
    const result = pruneChannelSchemaForForm({
      channelId: "whatsapp",
      schema: {
        type: "object",
        properties: {
          channels: {
            type: "object",
            properties: {
              whatsapp: {
                properties: {
                  enabled: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    });

    expect(result.schema).toBeTruthy();
    expect((result.schema as { type?: string }).type).toBe("object");
    expect((result.schema as { properties?: Record<string, unknown> }).properties?.enabled).toBeTruthy();
  });
});
