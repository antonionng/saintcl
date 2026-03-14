import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const body = await request.json();
  const { data, error } = await supabase.from("channels").insert({
    org_id: body.orgId,
    agent_id: body.agentId,
    type: body.type,
    credentials: body.credentials,
    status: "pending",
  }).select().single();

  await supabase.from("audit_logs").insert({
    org_id: body.orgId,
    user_id: body.userId,
    action: "channel:connect-requested",
    details: {
      agentId: body.agentId,
      type: body.type,
    },
  });

  return Response.json({ data, error });
});
