import type { Metadata } from "next";

import { legalDocuments } from "@/components/legal/content";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "GDPR Policy",
  description: legalDocuments.gdpr.description,
  alternates: {
    canonical: "/gdpr",
  },
};

export default function GdprPage() {
  return <LegalPage document={legalDocuments.gdpr} />;
}
