import { generateText, Output } from "ai";
import { z } from "zod";

import { companyProfile } from "@/components/landing/content";
import { env } from "@/lib/env";

const supportDecisionSchema = z.object({
  action: z.enum(["auto_reply", "escalate"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  reason: z.string().min(1).max(500),
  summary: z.string().min(1).max(800),
  reply: z.string().max(2200),
});

export type SupportAiDecisionResult = z.infer<typeof supportDecisionSchema>;

export async function classifyAndDraftSupportReply(input: {
  requesterEmail: string;
  requesterName?: string | null;
  subject: string;
  message: string;
  previousSummary?: string | null;
}) {
  const { output } = await generateText({
    model: env.supportAiModel,
    output: Output.object({
      schema: supportDecisionSchema,
      name: "supportDecision",
      description: "Decide whether a Saint AGI support email can receive a safe automated reply.",
    }),
    system: `You are Saint AGI support triage.

Saint AGI helps teams launch governed AI agents with admin controls, billing controls, runtime governance, audit trails, connectors, and support for business workflows.

Rules:
- Auto-reply only to low-risk product, sales, scheduling, and general information requests.
- Escalate anything urgent, angry, legal, security-related, billing-sensitive, involving credentials, involving account access, asking for custom promises, asking for refunds, or unclear.
- Escalate if the sender reports downtime, data loss, unauthorized access, payment failure, production impact, compliance concerns, or threatens churn.
- Do not invent pricing, contractual terms, integrations, or timelines. Keep auto replies helpful and short.
- If auto-replying, tell them the team has the request and a human can follow up.
- Never claim to have taken an action outside sending the reply.`,
    prompt: `Requester: ${input.requesterName || "Unknown"} <${input.requesterEmail}>
Subject: ${input.subject}
Previous summary: ${input.previousSummary || "None"}

Message:
${input.message}

Brand name: ${companyProfile.brandName}
Contact email: ${companyProfile.contactEmail}`,
    providerOptions: {
      gateway: {
        tags: ["feature:support", "channel:email"],
        user: input.requesterEmail,
      },
    },
  });

  return output;
}
