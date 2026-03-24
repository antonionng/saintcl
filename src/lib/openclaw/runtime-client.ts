import { isOpenClawRuntimeManaged } from "@/lib/env";
import { OpenClawClient } from "@/lib/openclaw/client";
import type { BootstrapTenantOptions, OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";
import { ensureTenantRuntime, startTenantRuntime } from "@/lib/openclaw/runtime-manager";
import { resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

type TenantOpenClawClientResult = {
  client: OpenClawClient;
  runtime: OpenClawRuntimeDescriptor | null;
  source: "env" | "runtime";
};

export async function getTenantOpenClawClient(
  orgId: string,
  options: BootstrapTenantOptions = { orgId },
): Promise<TenantOpenClawClientResult> {
  if (isOpenClawRuntimeManaged()) {
    await ensureTenantRuntime(orgId, options);
    const runtime = await startTenantRuntime(orgId, options);
    return {
      client: new OpenClawClient(runtime, { orgId, source: "runtime" }),
      runtime,
      source: "runtime",
    };
  }

  const target = await resolveTenantGatewayTarget(orgId);
  return {
    client: new OpenClawClient(
      target
        ? {
            gatewayUrl: target.wsUrl,
            gatewayToken: target.token,
          }
        : undefined,
      { orgId, source: target?.source ?? "env" },
    ),
    runtime: null,
    source: target?.source ?? "env",
  };
}
