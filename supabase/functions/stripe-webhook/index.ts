Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok");
  }

  return Response.json(
    {
      error: {
        message:
          "This Supabase Edge webhook is disabled. Use the Next.js /api/billing/webhook endpoint with Stripe signature verification.",
      },
    },
    { status: 410 },
  );
});
