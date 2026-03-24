import type { Metadata } from "next";

import { legalDocuments } from "@/components/legal/content";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "AI Usage Policy | Saint AGI",
  description: legalDocuments.aiUsage.description,
};

export default function AiUsagePolicyPage() {
  return <LegalPage document={legalDocuments.aiUsage} />;
}
