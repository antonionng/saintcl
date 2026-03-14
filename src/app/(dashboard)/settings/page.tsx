import { AccessDenied } from "@/components/dashboard/access-denied";
import { PolicyForm } from "@/components/dashboard/policy-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentOrg, getOrgPolicy } from "@/lib/dal";

export default async function SettingsPage() {
  const session = await getCurrentOrg();
  const org = session?.org;
  const policy = org ? await getOrgPolicy(org.id) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace settings"
        title="Governance defaults"
        description="Control organization-level policies like approval modes, default models, and audit retention."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Organization name</label>
              <Input defaultValue={org?.name ?? ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Slug</label>
              <Input defaultValue={org?.slug ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Plan</label>
              <Input defaultValue={org?.plan ?? "free"} readOnly />
            </div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mission and guardrails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-400">
            {session?.capabilities.canManagePolicies ? (
              <PolicyForm
                mission={policy?.mission ?? ""}
                reasonForAgents={policy?.reason_for_agents ?? ""}
                defaultModel={policy?.default_model ?? ""}
                requireApprovalOnSpend={policy?.require_approval_on_spend ?? false}
                guardrails={(policy?.guardrails as Record<string, unknown>) ?? {}}
              />
            ) : (
              <AccessDenied description="Only admins can edit company mission and guardrails." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
