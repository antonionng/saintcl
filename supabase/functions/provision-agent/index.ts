import { corsHeaders } from "../_shared/org-auth.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json({ error: { message: "Method not allowed." } }, { status: 405, headers: corsHeaders });
  }

  return Response.json(
    {
      error: {
        message:
          "This Edge provisioning path is disabled. Use the Next.js /api/agents or /api/openclaw/bootstrap routes.",
      },
    },
    { status: 410, headers: corsHeaders },
  );
});
