import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { legalDocuments } from "@/components/legal/content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: legalDocuments.terms.description,
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <LegalPage document={legalDocuments.terms} />;
}
