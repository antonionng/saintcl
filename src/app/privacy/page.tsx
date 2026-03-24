import type { Metadata } from "next";

import { legalDocuments } from "@/components/legal/content";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Saint AGI",
  description: legalDocuments.privacy.description,
};

export default function PrivacyPage() {
  return <LegalPage document={legalDocuments.privacy} />;
}
