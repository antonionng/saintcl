import { html } from "lit";
import type { ConfigUiHints } from "../types.ts";
import { formatChannelExtraValue, resolveChannelConfigValue } from "./channel-config-extras.ts";
import type { ChannelsProps } from "./channels.types.ts";
import { analyzeConfigSchema, renderNode, schemaType, type JsonSchema } from "./config-form.ts";
import { pathKey } from "./config-form.shared.ts";

type ChannelConfigFormProps = {
  channelId: string;
  configValue: Record<string, unknown> | null;
  schema: unknown;
  uiHints: ConfigUiHints;
  disabled: boolean;
  onPatch: (path: Array<string | number>, value: unknown) => void;
};

function resolveSchemaNode(
  schema: JsonSchema | null,
  path: Array<string | number>,
): JsonSchema | null {
  let current = schema;
  for (const key of path) {
    if (!current) {
      return null;
    }
    const type = schemaType(current);
    if (type === "object") {
      const properties = current.properties ?? {};
      if (typeof key === "string" && properties[key]) {
        current = properties[key];
        continue;
      }
      const additional = current.additionalProperties;
      if (typeof key === "string" && additional && typeof additional === "object") {
        current = additional;
        continue;
      }
      return null;
    }
    if (type === "array") {
      if (typeof key !== "number") {
        return null;
      }
      const items = Array.isArray(current.items) ? current.items[0] : current.items;
      current = items ?? null;
      continue;
    }
    return null;
  }
  return current;
}

function resolveChannelValue(
  config: Record<string, unknown>,
  channelId: string,
): Record<string, unknown> {
  return resolveChannelConfigValue(config, channelId) ?? {};
}

function collectChannelUnsupportedPaths(channelId: string, paths: string[]) {
  const prefix = `channels.${channelId}`;
  return paths.filter((entry) => entry === prefix || entry.startsWith(`${prefix}.`));
}

function pruneUnsupportedSchemaNode(params: {
  schema: JsonSchema;
  path: Array<string | number>;
  unsupported: Set<string>;
}): { schema: JsonSchema | null; prunedPaths: string[] } {
  const key = pathKey(params.path);
  if (key && params.unsupported.has(key)) {
    return { schema: null, prunedPaths: [key] };
  }

  const type =
    schemaType(params.schema) ??
    (params.schema.properties || params.schema.additionalProperties ? "object" : undefined);

  if (type === "object") {
    const next: JsonSchema = { ...params.schema };
    const prunedPaths: string[] = [];
    const nextProps: Record<string, JsonSchema> = {};
    next.type = params.schema.type ?? "object";

    for (const [propKey, propSchema] of Object.entries(params.schema.properties ?? {})) {
      const result = pruneUnsupportedSchemaNode({
        schema: propSchema,
        path: [...params.path, propKey],
        unsupported: params.unsupported,
      });
      if (result.schema) {
        nextProps[propKey] = result.schema;
      }
      prunedPaths.push(...result.prunedPaths);
    }

    next.properties = nextProps;

    if (params.schema.additionalProperties && typeof params.schema.additionalProperties === "object") {
      const result = pruneUnsupportedSchemaNode({
        schema: params.schema.additionalProperties,
        path: [...params.path, "*"],
        unsupported: params.unsupported,
      });
      next.additionalProperties = result.schema ?? false;
      prunedPaths.push(...result.prunedPaths);
    }

    return { schema: next, prunedPaths };
  }

  if (type === "array") {
    const items = Array.isArray(params.schema.items) ? params.schema.items[0] : params.schema.items;
    if (!items) {
      return { schema: params.schema, prunedPaths: [] };
    }

    const result = pruneUnsupportedSchemaNode({
      schema: items,
      path: [...params.path, "*"],
      unsupported: params.unsupported,
    });

    if (!result.schema) {
      return { schema: null, prunedPaths: result.prunedPaths };
    }

    return {
      schema: {
        ...params.schema,
        type: params.schema.type ?? "array",
        items: Array.isArray(params.schema.items) ? [result.schema] : result.schema,
      },
      prunedPaths: result.prunedPaths,
    };
  }

  return { schema: params.schema, prunedPaths: [] };
}

export function pruneChannelSchemaForForm(params: { channelId: string; schema: unknown }) {
  const analysis = analyzeConfigSchema(params.schema);
  const normalized = analysis.schema;
  if (!normalized) {
    return {
      schema: null,
      unsupportedPaths: analysis.unsupportedPaths,
      hiddenAdvancedFields: false,
    };
  }

  const node = resolveSchemaNode(normalized, ["channels", params.channelId]);
  if (!node) {
    return {
      schema: null,
      unsupportedPaths: analysis.unsupportedPaths,
      hiddenAdvancedFields: false,
    };
  }

  // If the node has no type info and no properties, it resolved to the channels
  // additionalProperties fallback (passthrough wildcard) rather than a real channel
  // schema. Treat it as unavailable so the UI shows a clear "Raw mode" message
  // instead of the cryptic "Unsupported type" renderer error.
  const hasType = schemaType(node) !== undefined;
  const hasProperties = node.properties != null && Object.keys(node.properties).length > 0;
  const hasEnum = Array.isArray(node.enum) && node.enum.length > 0;
  if (!hasType && !hasProperties && !hasEnum) {
    return {
      schema: null,
      unsupportedPaths: analysis.unsupportedPaths,
      hiddenAdvancedFields: false,
    };
  }

  const unsupportedPaths = collectChannelUnsupportedPaths(params.channelId, analysis.unsupportedPaths);
  const pruned = pruneUnsupportedSchemaNode({
    schema: node,
    path: ["channels", params.channelId],
    unsupported: new Set(unsupportedPaths),
  });

  return {
    schema: pruned.schema,
    unsupportedPaths: analysis.unsupportedPaths,
    hiddenAdvancedFields: pruned.prunedPaths.length > 0,
  };
}

const EXTRA_CHANNEL_FIELDS = ["groupPolicy", "streamMode", "dmPolicy"] as const;

function renderExtraChannelFields(value: Record<string, unknown>) {
  const entries = EXTRA_CHANNEL_FIELDS.flatMap((field) => {
    if (!(field in value)) {
      return [];
    }
    return [[field, value[field]]] as Array<[string, unknown]>;
  });
  if (entries.length === 0) {
    return null;
  }
  return html`
    <div class="status-list" style="margin-top: 12px;">
      ${entries.map(
        ([field, raw]) => html`
          <div>
            <span class="label">${field}</span>
            <span>${formatChannelExtraValue(raw)}</span>
          </div>
        `,
      )}
    </div>
  `;
}

export function renderChannelConfigForm(props: ChannelConfigFormProps) {
  const prepared = pruneChannelSchemaForForm({
    channelId: props.channelId,
    schema: props.schema,
  });
  if (!prepared.schema) {
    return html`
      <div class="callout danger">Channel config is only editable in Raw mode.</div>
    `;
  }
  const configValue = props.configValue ?? {};
  const value = resolveChannelValue(configValue, props.channelId);
  return html`
    <div class="config-form">
      ${renderNode({
        schema: prepared.schema,
        value,
        path: ["channels", props.channelId],
        hints: props.uiHints,
        unsupported: new Set(prepared.unsupportedPaths),
        disabled: props.disabled,
        showLabel: false,
        onPatch: props.onPatch,
      })}
    </div>
    ${renderExtraChannelFields(value)}
    ${
      prepared.hiddenAdvancedFields
        ? html`
            <div class="callout" style="margin-top: 12px;">
              Some advanced ${props.channelId} settings are only available in Raw mode.
            </div>
          `
        : null
    }
  `;
}

export function renderChannelConfigSection(params: { channelId: string; props: ChannelsProps }) {
  const { channelId, props } = params;
  const disabled = props.configSaving || props.configSchemaLoading;
  return html`
    <div style="margin-top: 16px;">
      ${
        props.configSchemaLoading
          ? html`
              <div class="muted">Loading config schema…</div>
            `
          : renderChannelConfigForm({
              channelId,
              configValue: props.configForm,
              schema: props.configSchema,
              uiHints: props.configUiHints,
              disabled,
              onPatch: props.onConfigPatch,
            })
      }
      <div class="row" style="margin-top: 12px;">
        <button
          class="btn primary"
          ?disabled=${disabled || !props.configFormDirty}
          @click=${() => props.onConfigSave()}
        >
          ${props.configSaving ? "Saving…" : "Save"}
        </button>
        <button
          class="btn"
          ?disabled=${disabled}
          @click=${() => props.onConfigReload()}
        >
          Reload
        </button>
      </div>
    </div>
  `;
}
