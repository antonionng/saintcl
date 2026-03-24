import { InviteAcceptCard } from "@/components/auth/invite-accept-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentOrg } from "@/lib/dal";
import { getInvitePreview } from "@/lib/invites";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [session, preview] = await Promise.all([getCurrentOrg(), getInvitePreview(token)]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Workspace invite"
        title="Accept your Saint AGI invite"
        description="Join the workspace with the same email address that received the invite."
      />
      {preview ? (
        <InviteAcceptCard token={token} invite={preview.invite} orgName={preview.orgName} signedInEmail={session?.email} />
      ) : (
        <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 text-sm text-zinc-400">
          This invite is invalid or no longer available.
        </div>
      )}
    </div>
  );
}
