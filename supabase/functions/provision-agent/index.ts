import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const body = await request.json();
  const slug = String(body.name || "agent").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const runtimeRoot = `runtime-data/openclaw/${body.orgId}/${slug}`;

  const { data: runtime } = await supabase
    .from("openclaw_runtimes")
    .upsert({
      org_id: body.orgId,
      state_root: `${runtimeRoot}/state`,
      config_path: `${runtimeRoot}/config/openclaw.json`,
      workspace_root: `${runtimeRoot}/workspaces`,
      gateway_port: body.gatewayPort ?? 18789,
      gateway_token: body.gatewayToken,
      status: body.runtimeStatus ?? "starting",
      last_heartbeat_at: new Date().toISOString(),
    })
    .select()
    .single();

  const { data, error } = await supabase.from("agents").insert({
    org_id: body.orgId,
    user_id: body.userId,
    openclaw_runtime_id: runtime?.id,
    name: body.name,
    openclaw_agent_id: slug,
    model: body.model,
    status: "provisioning",
    config: {
      persona: body.persona,
      workspace: `${runtimeRoot}/workspaces/${slug}`,
    },
  }).select().single();

  return Response.json({ data, error, runtime });
});
