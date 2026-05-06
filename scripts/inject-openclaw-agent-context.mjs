#!/usr/bin/env node
// Tenant-wide OpenClaw context injection runner.
//
// Drives the admin endpoint at POST /api/openclaw/inject-context, which
// triggers the platform-owned context-injection pipeline:
//
//   * Re-renders and writes AGENTS.md, SOUL.md, USER.md, TOOLS.md,
//     IDENTITY.md, HEARTBEAT.md to every agent in the tenant via the gateway
//     `agents.files.set` RPC.
//   * Mirrors knowledge docs into knowledge/{company,team,personal}/<id>-...md
//     based on each agent's assignment scope.
//   * Applies the safe memorySearch governance: enabled when there are docs,
//     synchronous sync hooks (onSessionStart, onSearch, watch) kept off.
//
// Auth: pass an admin/super-admin Supabase access token via --token, the
// SAINTAGI_ADMIN_TOKEN env var, or a session cookie via --cookie /
// SAINTAGI_SESSION_COOKIE. Cookie auth matches what the dashboard uses.
//
// Examples:
//
//   node scripts/inject-openclaw-agent-context.mjs \
//     --base https://app.saintagi.com \
//     --org-id 11111111-2222-3333-4444-555555555555 \
//     --cookie "$SAINTAGI_SESSION_COOKIE" \
//     --dry-run
//
//   node scripts/inject-openclaw-agent-context.mjs \
//     --base https://app.saintagi.com \
//     --token "$SUPABASE_ACCESS_TOKEN"
//
// Required:
//   --base <url>                    SaintAGI app base URL (e.g. https://app.saintagi.com)
//
// Auth (one of):
//   --token <jwt>                   Supabase session access token
//   --cookie <header-value>         Cookie header verbatim ("sb-...=...; sb-other=...")
//
// Optional:
//   --org-id <uuid>                 target org (defaults to caller's current org;
//                                   super-admin required for cross-org)
//   --dry-run                       compute the plan without writing
//   --skip-knowledge                do not mirror knowledge docs
//   --skip-memory-config            do not patch memorySearch governance
//   --skip-heartbeat                do not write HEARTBEAT.md

const args = parseArgs(process.argv);

if (args.help || !args.base) {
  process.stdout.write(usage());
  process.exit(args.help ? 0 : 1);
}

const base = String(args.base).replace(/\/$/, "");
const token = args.token ?? process.env.SAINTAGI_ADMIN_TOKEN ?? null;
const cookie = args.cookie ?? process.env.SAINTAGI_SESSION_COOKIE ?? null;

if (!token && !cookie) {
  process.stderr.write(
    "[inject-context] missing auth: pass --token <supabase-access-token> or --cookie <session-cookie>\n",
  );
  process.exit(1);
}

const url = `${base}/api/openclaw/inject-context`;
const headers = { "content-type": "application/json" };
if (token) headers.authorization = `Bearer ${token}`;
if (cookie) headers.cookie = cookie;

const body = {
  orgId: args["org-id"] ?? undefined,
  dryRun: Boolean(args["dry-run"]),
  syncKnowledge: !args["skip-knowledge"],
  applySafeMemoryConfig: !args["skip-memory-config"],
  writeHeartbeat: !args["skip-heartbeat"],
};

const startedAt = Date.now();
process.stdout.write(`[inject-context] POST ${url}\n`);
process.stdout.write(`[inject-context] params ${JSON.stringify(body)}\n`);

const response = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});

const elapsedMs = Date.now() - startedAt;
let payload;
try {
  payload = await response.json();
} catch {
  payload = { error: { message: await response.text().catch(() => "<unparsable>") } };
}

if (!response.ok) {
  process.stderr.write(
    `[inject-context] failed (${response.status}) in ${elapsedMs}ms: ${JSON.stringify(payload)}\n`,
  );
  process.exit(1);
}

const result = payload?.data ?? payload;
process.stdout.write(`[inject-context] ok in ${elapsedMs}ms\n`);
process.stdout.write(formatSummary(result));

if (result?.failedAgents > 0) {
  process.exit(2);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function formatSummary(result) {
  if (!result || typeof result !== "object") {
    return "  (no result)\n";
  }
  const lines = [];
  lines.push(`  org: ${result.orgId}`);
  if (result.skipped) {
    lines.push(`  skipped: ${result.skipped}`);
  }
  lines.push(`  agents: ${result.totalAgents} (ok=${result.okAgents}, failed=${result.failedAgents})`);
  if (Array.isArray(result.plans) && result.plans.length > 0) {
    lines.push("  plans:");
    for (const plan of result.plans) {
      const docs = plan.knowledgeDocs >= 0 ? plan.knowledgeDocs : "?";
      lines.push(
        `    - ${plan.openclawAgentId} (${plan.name}) files=${plan.files?.length ?? 0} docs=${docs} memory=${plan.memorySearch}`,
      );
    }
  }
  if (Array.isArray(result.failures) && result.failures.length > 0) {
    lines.push("  failures:");
    for (const failure of result.failures) {
      lines.push(`    - ${failure.openclawAgentId} (${failure.name}): ${failure.message}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function usage() {
  return `Usage: node scripts/inject-openclaw-agent-context.mjs --base <url> (--token <jwt> | --cookie <hdr>) [options]

Options:
  --base <url>             SaintAGI app base URL (required)
  --token <jwt>            Supabase access token
  --cookie <header>        Verbatim cookie header
  --org-id <uuid>          Target org (defaults to caller's org)
  --dry-run                Compute plan without writing
  --skip-knowledge         Do not mirror knowledge docs
  --skip-memory-config     Do not patch memorySearch governance
  --skip-heartbeat         Do not write HEARTBEAT.md
  --help                   Show this message
`;
}
