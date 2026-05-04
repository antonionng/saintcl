import type { Metadata } from "next";

import { legalDocuments } from "@/components/legal/content";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "AI Usage Policy",
  description: legalDocuments.aiUsage.description,
  alternates: {
    canonical: "/ai-usage-policy",
  },
};

export default function AiUsagePolicyPage() {
  return <LegalPage document={legalDocuments.aiUsage} />;
}
