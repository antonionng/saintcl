import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AccountProfileForm } from "@/components/account/account-profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getAuthenticatedHomePath } from "@/lib/access";
import { getCurrentOrg, getCurrentUserProfile } from "@/lib/dal";

export default async function AccountPage() {
  const session = await getCurrentOrg();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect(getAuthenticatedHomePath(session.role, { isSuperAdmin: session.isSuperAdmin }));
  }

  const homePath = getAuthenticatedHomePath(session.role, { isSuperAdmin: session.isSuperAdmin });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personal account"
        title="Your profile"
        description="Share the basics your agents should know about you, without turning it into a long onboarding form."
        action={
          <Button asChild variant="secondary">
            <Link href={homePath}>
              <ChevronLeft className="size-4" />
              <span>Back</span>
            </Link>
          </Button>
        }
      />

      <AccountProfileForm initialProfile={profile} homePath={homePath} />
    </div>
  );
}
