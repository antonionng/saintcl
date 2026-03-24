import type {
  BootstrapAgentOptions,
  BootstrapTenantOptions,
  OpenClawRuntimeDescriptor,
} from "@/lib/openclaw/runtime-types";
import { buildOpenClawModelAllowlist } from "@/lib/openclaw/model-catalog";

export function renderTenantOpenClawConfig(
  runtime: OpenClawRuntimeDescriptor,
  options: BootstrapTenantOptions,
) {
  const approvedModels = (options.approvedModels ?? []).filter((entry) => entry.id.trim().length > 0);
  const modelAllowlist = buildOpenClawModelAllowlist(
    approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label ?? entry.id,
      provider: "openrouter",
      source: "policy",
    })),
  );

  return JSON.stringify(
    {
      agent: {
        model: options.defaultModel,
      },
      agents: {
        defaults: {
          model: options.defaultModel ? { primary: options.defaultModel } : undefined,
          models: Object.keys(modelAllowlist).length > 0 ? modelAllowlist : undefined,
          workspace: runtime.paths.workspaceRoot,
        },
        list: [],
      },
      bindings: [],
    },
    null,
    2,
  );
}

export function renderTenantAgentsMd(runtime: OpenClawRuntimeDescriptor) {
  return `# SaintClaw Tenant Runtime

You are running inside SaintClaw's managed OpenClaw runtime for org \`${runtime.orgId}\`.

Follow these operating rules:
- Keep work scoped to this tenant only.
- Do not assume access to any repo outside the tenant workspace root.
- Terminal and repo execution are admin-gated and auditable.
- Prefer safe, reversible changes and request approval before risky actions.
`;
}

export function renderTenantToolsMd() {
  return `# SaintClaw Tool Policy

- Terminal access is reserved for tenant admins.
- Treat repo access as allowlist-bound.
- Use sandboxed sessions for command execution whenever possible.
- Log significant actions through the SaintClaw control plane.
`;
}

export function renderAgentBootstrapFiles(options: BootstrapAgentOptions) {
  return {
    agents: `# ${options.name}

You are the dedicated agent for this seat.

Persona:
${options.persona}

Model:
${options.model}
`,
    tools: `# Tooling

- Default to safe, explainable actions.
- Do not execute terminal commands in a main session.
- Ask for admin approval when terminal or repo access is required.
`,
  };
}
