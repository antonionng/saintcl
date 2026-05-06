import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrg } from "@/lib/dal";
import { listSupportTickets } from "@/lib/support/tickets";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }
  return new Date(value).toLocaleString();
}

function priorityVariant(priority: string) {
  if (priority === "urgent" || priority === "high") {
    return "warning" as const;
  }
  if (priority === "low") {
    return "secondary" as const;
  }
  return "default" as const;
}

export default async function SupportPage() {
  const session = await getCurrentOrg();
  if (!session?.isSuperAdmin) {
    notFound();
  }

  const tickets = await listSupportTickets();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform support"
        title="Support tickets"
        description="Contact form requests, inbound email replies, AI decisions, and urgent escalations for the Saint AGI team."
      />

      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-[length:var(--text-sm)] text-zinc-400">
              No support tickets yet. Contact form submissions and inbound replies will appear here.
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-zinc-500">
                      SC-{ticket.public_token} · {ticket.requester_email}
                    </p>
                    <CardTitle className="mt-2">{ticket.subject}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                    <Badge variant={ticket.status === "closed" ? "secondary" : "default"}>{ticket.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[length:var(--text-sm)] leading-relaxed text-zinc-300">
                  {ticket.latest_message_preview || "No message preview recorded."}
                </p>
                <div className="grid gap-3 text-[length:var(--text-sm)] text-zinc-400 md:grid-cols-3">
                  <div>
                    <p className="text-zinc-500">Requester</p>
                    <p className="mt-1 text-zinc-200">{ticket.requester_name || "Unknown"}</p>
                    <p>{ticket.company || "No company"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Last inbound</p>
                    <p className="mt-1 text-zinc-200">{formatDate(ticket.last_inbound_at)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">AI decision</p>
                    <p className="mt-1 text-zinc-200">{ticket.ai_last_decision || "None yet"}</p>
                    {ticket.ai_last_decision_reason ? <p>{ticket.ai_last_decision_reason}</p> : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
