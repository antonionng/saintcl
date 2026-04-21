import type {
  BootstrapAgentOptions,
  BootstrapTenantOptions,
  OpenClawRuntimeDescriptor,
} from "@/lib/openclaw/runtime-types";
import { buildOpenClawModelAllowlist } from "@/lib/openclaw/model-catalog";
import { renderOrgContextForAgent } from "@/lib/org-profile";

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

function renderAgentUserMd(options: BootstrapAgentOptions) {
  const lines = [
    options.user?.displayName?.trim() ? `- Name: ${options.user.displayName.trim()}` : null,
    options.user?.email?.trim() ? `- Email: ${options.user.email.trim()}` : null,
    options.user?.role?.trim() ? `- Workspace role: ${options.user.role.trim()}` : null,
    options.user?.whatIDo?.trim() ? `- Role in the company: ${options.user.whatIDo.trim()}` : null,
    options.user?.agentBrief?.trim() ? `- Working notes: ${options.user.agentBrief.trim()}` : null,
  ].filter((line): line is string => Boolean(line));

  const details = lines.length > 0 ? lines.join("\n") : "- No saved user profile details yet.";

  return `# USER.md - Your Human

${details}

Use this file to understand who you are helping. Personalize your responses when appropriate and address them by name when it feels natural.
`;
}

function renderAgentSoulMd(options: BootstrapAgentOptions) {
  const companyContext = renderOrgContextForAgent({
    name: options.org?.name,
    website: options.org?.website,
    companySummary: options.org?.companySummary,
    agentBrief: options.org?.agentBrief,
  });

  const contextGuidance = companyContext
    ? ""
    : `\n\nNote: Limited company context is currently available. If asked about the company, share what you know from knowledge files and any available context. The system may enrich company context automatically in the background -- check the knowledge/company directory for any enriched profiles.`;

  return `# SOUL.md - Who You Are

${options.persona}
${companyContext ? `\n\n${companyContext}` : ""}${contextGuidance}
`;
}

export function renderAgentBootstrapFiles(options: BootstrapAgentOptions) {
  return {
    agents: `# ${options.name}

You are the dedicated agent for this seat.

## Session Startup

Before doing anything else:
1. Read SOUL.md for your persona and working style.
2. Read USER.md to understand who you are working with.
3. Read recent memory files if they exist.

## Rules

- Keep work scoped to this workspace.
- Avoid destructive actions without asking first.
- Use local files for continuity.

Model:
${options.model}
`,
    soul: renderAgentSoulMd(options),
    user: renderAgentUserMd(options),
    tools: `# Tooling

- Default to safe, explainable actions.
- Do not execute terminal commands in a main session.
- Ask for admin approval when terminal or repo access is required.
`,
  };
}
