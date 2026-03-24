import { NextResponse } from "next/server";
import { z } from "zod";

import { getAgentWorkspacePath } from "@/lib/openclaw/paths";
import { appendRuntimeAuditEvent } from "@/lib/openclaw/log-sync";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { ensureTenantRuntime, startTenantRuntime } from "@/lib/openclaw/runtime-manager";
import {
  insertTerminalApproval,
  insertTerminalRun,
  listRepoAllowlistPatterns,
} from "@/lib/openclaw/runtime-store";
import { assertAdminRole, assertCommandAllowed, assertRepoAllowed } from "@/lib/openclaw/terminal-policy";
import { runApprovedTerminalCommand } from "@/lib/openclaw/terminal-runner";
import { getCurrentOrg, getRepoAllowlists, getTerminalApprovals, getTerminalRuns } from "@/lib/dal";

const terminalSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("request"),
    orgId: z.string(),
    agentId: z.string(),
    requestedBy: z.string().optional(),
    role: z.string(),
    command: z.string().min(1),
    repo: z.string().optional(),
  }),
  z.object({
    action: z.literal("approve"),
    orgId: z.string(),
    agentId: z.string(),
    approvedBy: z.string().optional(),
    role: z.string(),
    command: z.string().min(1),
    repo: z.string().optional(),
    approvalId: z.string().optional(),
  }),
]);

export async function GET(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageAdminTools) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId") ?? session.org.id;
  if (orgId !== session.org.id) {
    return NextResponse.json({ error: { message: "Organization mismatch." } }, { status: 403 });
  }
  if (!orgId) {
    return NextResponse.json({ data: { allowlists: [], approvals: [], runs: [] } });
  }

  const [allowlists, approvals, runs] = await Promise.all([
    getRepoAllowlists(orgId),
    getTerminalApprovals(orgId),
    getTerminalRuns(orgId),
  ]);

  return NextResponse.json({ data: { allowlists, approvals, runs } });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageAdminTools) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const payload = terminalSchema.parse(await request.json());
  if (payload.orgId !== session.org.id) {
    return NextResponse.json({ error: { message: "Organization mismatch." } }, { status: 403 });
  }
  assertAdminRole(session.role);
  assertCommandAllowed(payload.command);

  const dbAllowlists = await listRepoAllowlistPatterns(payload.orgId);
  assertRepoAllowed(payload.repo, dbAllowlists);
  const { snapshot } = await getOrgModelCatalogState(payload.orgId);

  const runtime = payload.action === "approve"
    ? await startTenantRuntime(payload.orgId, {
        orgId: payload.orgId,
        defaultModel: snapshot.defaultModel,
        approvedModels: snapshot.approvedModels.map((entry) => ({
          id: entry.id,
          label: entry.label,
        })),
      })
    : await ensureTenantRuntime(payload.orgId, {
        orgId: payload.orgId,
        defaultModel: snapshot.defaultModel,
        approvedModels: snapshot.approvedModels.map((entry) => ({
          id: entry.id,
          label: entry.label,
        })),
      });

  if (payload.action === "request") {
    const approval = await insertTerminalApproval({
      orgId: payload.orgId,
      agentId: payload.agentId,
      requestedBy: session.userId,
      command: payload.command,
      repo: payload.repo,
      status: "pending",
    });

    await appendRuntimeAuditEvent(runtime, "terminal.approval.requested", {
      agentId: payload.agentId,
      command: payload.command,
      repo: payload.repo,
    });

    return NextResponse.json({
      data: {
        id: approval?.id ?? `approval_${Date.now()}`,
        status: "pending",
        allowlists: dbAllowlists,
      },
    });
  }

  const result = await runApprovedTerminalCommand(runtime, {
    command: payload.command,
    cwd: getAgentWorkspacePath(payload.orgId, payload.agentId),
  });

  const approval = await insertTerminalApproval({
    orgId: payload.orgId,
    agentId: payload.agentId,
    command: payload.command,
    repo: payload.repo,
    status: "approved",
    approvedBy: session.userId,
    approvedAt: new Date().toISOString(),
  });

  const run = await insertTerminalRun({
    orgId: payload.orgId,
    agentId: payload.agentId,
    approvalId: approval?.id ?? payload.approvalId,
    command: payload.command,
    exitCode: result.exitCode ?? 1,
    stdoutExcerpt: result.stdout.slice(0, 1000),
    stderrExcerpt: result.stderr.slice(0, 1000),
  });

  await appendRuntimeAuditEvent(runtime, "terminal.command.executed", {
    agentId: payload.agentId,
    command: payload.command,
    exitCode: result.exitCode,
  });

  return NextResponse.json({
    data: {
      id: run?.id ?? `run_${Date.now()}`,
      approvalId: approval?.id ?? payload.approvalId,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    },
  });
}
