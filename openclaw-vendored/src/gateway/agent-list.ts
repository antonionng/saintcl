import fs from "node:fs";
import path from "node:path";
import { resolveDefaultAgentId } from "../agents/agent-scope.js";
import { resolveStateDir } from "../config/paths.js";
import type { SessionScope } from "../config/sessions.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
import { normalizeAgentId, normalizeMainKey } from "../routing/session-key.js";
import { normalizeOptionalString } from "../shared/string-coerce.js";

type GatewayAgentListRow = {
  id: string;
  name?: string;
};

/**
 * Lists agent directories present on disk under the gateway's state root.
 *
 * Exported as the single source of truth so disk-discovery logic cannot drift
 * between the listing surface and the file-write resolver. Anyone who needs
 * to know which agent IDs the gateway has materialized state for must call
 * this helper rather than re-implementing the readdir + normalize sequence.
 */
export function listExistingAgentIdsFromDisk(): string[] {
  const root = resolveStateDir();
  const agentsDir = path.join(root, "agents");
  try {
    const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => normalizeAgentId(entry.name))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Lists every agent ID the gateway considers "configured" before any
 * explicit-list filtering is applied: the resolved default ID, every entry
 * from `cfg.agents.list`, and every disk-discovered agent directory.
 *
 * Exported so consumers (server-methods, session routing, registry probes)
 * share a single definition. Previously each consumer maintained a private
 * copy of this routine, which was the original source of the agent registry
 * drift the gateway hardening work is closing out.
 */
export function listConfiguredAgentIds(cfg: OpenClawConfig): string[] {
  const ids = new Set<string>();
  const defaultId = normalizeAgentId(resolveDefaultAgentId(cfg));
  ids.add(defaultId);

  for (const entry of cfg.agents?.list ?? []) {
    if (entry?.id) {
      ids.add(normalizeAgentId(entry.id));
    }
  }

  for (const id of listExistingAgentIdsFromDisk()) {
    ids.add(id);
  }

  const sorted = Array.from(ids).filter(Boolean);
  sorted.sort((a, b) => a.localeCompare(b));
  return sorted.includes(defaultId)
    ? [defaultId, ...sorted.filter((id) => id !== defaultId)]
    : sorted;
}

/**
 * Effective gateway agent IDs as exposed by listing/session routing.
 *
 * Returns the union of:
 *   - configured agent IDs (`cfg.agents.list`)
 *   - the resolved default agent ID
 *   - the configured `session.mainKey` (when allowed)
 *   - disk-backed agent directory IDs under `${stateDir}/agents/`
 *
 * Used for both gateway listing and `agents.files.*` resolution so file
 * writes accept exactly the IDs the gateway reports as known. Without this,
 * `agents.files.set` rejected freshly registered agents whose `config.patch`
 * had succeeded but whose in-memory cfg snapshot lagged behind the listing
 * surface.
 */
export function listEffectiveGatewayAgentIds(cfg: OpenClawConfig): string[] {
  const defaultId = normalizeAgentId(resolveDefaultAgentId(cfg));
  const mainKey = normalizeMainKey(cfg.session?.mainKey);
  const explicitIds = new Set(
    (cfg.agents?.list ?? [])
      .map((entry) => (entry?.id ? normalizeAgentId(entry.id) : ""))
      .filter(Boolean),
  );
  const allowedIds = explicitIds.size > 0 ? new Set([...explicitIds, defaultId]) : null;
  let agentIds = listConfiguredAgentIds(cfg).filter((id) =>
    allowedIds ? allowedIds.has(id) : true,
  );
  if (mainKey && !agentIds.includes(mainKey) && (!allowedIds || allowedIds.has(mainKey))) {
    agentIds = [...agentIds, mainKey];
  }
  return agentIds;
}

export function listGatewayAgentsBasic(cfg: OpenClawConfig): {
  defaultId: string;
  mainKey: string;
  scope: SessionScope;
  agents: GatewayAgentListRow[];
} {
  const defaultId = normalizeAgentId(resolveDefaultAgentId(cfg));
  const mainKey = normalizeMainKey(cfg.session?.mainKey);
  const scope = cfg.session?.scope ?? "per-sender";
  const configuredById = new Map<string, { name?: string }>();
  for (const entry of cfg.agents?.list ?? []) {
    if (!entry?.id) {
      continue;
    }
    configuredById.set(normalizeAgentId(entry.id), {
      name: normalizeOptionalString(entry.name),
    });
  }
  const agentIds = listEffectiveGatewayAgentIds(cfg);
  const agents = agentIds.map((id) => {
    const meta = configuredById.get(id);
    return {
      id,
      name: meta?.name,
    };
  });
  return { defaultId, mainKey, scope, agents };
}
