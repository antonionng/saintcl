import { corsHeaders, requireOrgAdmin } from "../_shared/org-auth.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json({ error: { message: "Method not allowed." } }, { status: 405, headers: corsHeaders });
  }

  const body = await request.json() as Record<string, unknown>;
  const orgAuth = await requireOrgAdmin(request, body.orgId);
  if (orgAuth.error) {
    return orgAuth.error;
  }

  const orgId = String(body.orgId);
  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const credentials =
    body.credentials && typeof body.credentials === "object" && !Array.isArray(body.credentials)
      ? body.credentials
      : {};

  if (!agentId) {
    return Response.json({ error: { message: "Agent is required." } }, { status: 400, headers: corsHeaders });
  }

  if (!type) {
    return Response.json({ error: { message: "Channel type is required." } }, { status: 400, headers: corsHeaders });
  }

  const { data: agent, error: agentError } = await orgAuth.data.admin
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (agentError) {
    return Response.json(
      { error: { message: "Unable to verify agent ownership." } },
      { status: 500, headers: corsHeaders },
    );
  }

  if (!agent) {
    return Response.json({ error: { message: "Agent not found." } }, { status: 404, headers: corsHeaders });
  }

  const { data, error } = await orgAuth.data.admin.from("channels").insert({
    org_id: orgId,
    agent_id: agentId,
    type,
    credentials,
    status: "pending",
  }).select().single();

  await orgAuth.data.admin.from("audit_logs").insert({
    org_id: orgId,
    user_id: orgAuth.data.userId,
    action: "channel:connect-requested",
    details: {
      agentId,
      type,
    },
  });

  return Response.json({ data, error }, { headers: corsHeaders });
});
