import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const body = await request.json();

  if (body.type === "customer.subscription.updated") {
    await supabase
      .from("orgs")
      .update({ plan: body.data.object.metadata?.plan ?? "pro" })
      .eq("stripe_customer_id", body.data.object.customer);
  }

  return Response.json({ received: true });
});
