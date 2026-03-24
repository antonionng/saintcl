import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { legalDocuments } from "@/components/legal/content";

export const metadata: Metadata = {
  title: "Terms of Service | Saint AGI",
  description: legalDocuments.terms.description,
};

export default function TermsPage() {
  return <LegalPage document={legalDocuments.terms} />;
}
