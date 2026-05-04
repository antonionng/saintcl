import { companyProfile } from "@/components/landing/content";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export const legalDocuments = {
  terms: {
    title: "Terms of Service",
    description:
      "These terms govern access to and use of the Saint AGI service operated by Neural Network Group Ltd.",
    lastUpdated: "17 March 2026",
    sections: [
      {
        title: "Who we are",
        paragraphs: [
          `Saint AGI is a service operated by ${companyProfile.legalName}, a company based in ${companyProfile.country}. These Terms of Service apply to your access to and use of the Saint AGI website, hosted application, and related services.`,
          `If you have questions about these terms, contact ${companyProfile.contactEmail}. Where a registered office address is required for a formal legal notice, use ${companyProfile.registeredOffice} until an updated address is published on this site.`,
        ],
      },
      {
        title: "Eligibility and accounts",
        paragraphs: [
          "You may use the service only if you can form a binding contract on behalf of yourself or the organization you represent. You are responsible for keeping account credentials secure and for all activity that occurs through your account.",
          "If you register on behalf of a business, you confirm that you have authority to accept these terms for that business and its users.",
        ],
      },
      {
        title: "Using the service",
        paragraphs: [
          "Subject to these terms, we grant you a limited, non-exclusive, non-transferable right to use Saint AGI in accordance with the product documentation and any plan limits that apply to your subscription.",
          "You must use the service lawfully and responsibly. You must not use Saint AGI to infringe rights, access systems without authorization, distribute malware, generate unlawful content, or violate applicable sanctions, export controls, employment obligations, or data protection law.",
        ],
        bullets: [
          "Do not attempt to bypass product guardrails, billing controls, rate limits, or access restrictions.",
          "Do not reverse engineer or resell the service except where applicable law expressly permits it.",
          "Do not submit personal data or regulated information unless your use is permitted by law and by your organization.",
        ],
      },
      {
        title: "Customer content and AI outputs",
        paragraphs: [
          "You retain ownership of content, prompts, files, and other materials you submit to the service. You are responsible for ensuring that you have the rights needed to provide that content and to instruct Saint AGI to process it.",
          "AI-generated outputs may be inaccurate, incomplete, or unsuitable for your intended purpose. You are responsible for reviewing outputs before acting on them, especially where outputs affect legal, financial, employment, security, or operational decisions.",
        ],
      },
      {
        title: "Billing and subscriptions",
        paragraphs: [
          "Paid features may be billed on a subscription, usage, or prepaid basis depending on your plan. Fees are due in accordance with the checkout flow, order form, or pricing page in effect at the time of purchase.",
          "Unless otherwise agreed in writing, fees are non-refundable except where required by law. We may suspend access for overdue amounts after providing reasonable notice.",
        ],
      },
      {
        title: "Service changes and availability",
        paragraphs: [
          "We may update, improve, or modify the service from time to time. We also may suspend or discontinue features where necessary for security, legal compliance, maintenance, or product evolution.",
          "We do not guarantee uninterrupted or error-free availability. Scheduled and emergency maintenance, third-party outages, and internet failures can affect service performance.",
        ],
      },
      {
        title: "Suspension and termination",
        paragraphs: [
          "We may suspend or terminate access if we reasonably believe your use breaches these terms, creates security risk, exposes us or others to liability, or is required by law.",
          "You may stop using the service at any time. Provisions that by their nature should survive termination, including payment obligations, disclaimers, limitations of liability, and dispute provisions, will survive.",
        ],
      },
      {
        title: "Disclaimers and liability",
        paragraphs: [
          "To the fullest extent permitted by law, the service is provided on an as available and as provided basis. We disclaim implied warranties including merchantability, fitness for a particular purpose, and non-infringement.",
          "To the fullest extent permitted by law, Neural Network Group Ltd will not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, revenue, goodwill, data, or business opportunity. Our aggregate liability for claims arising out of or relating to the service will not exceed the fees paid by you to us for the service in the twelve months before the event giving rise to the claim.",
        ],
      },
      {
        title: "Governing law",
        paragraphs: [
          `These terms are governed by the laws of ${companyProfile.governingLaw}. The courts of England and Wales will have exclusive jurisdiction unless applicable law requires otherwise.`,
          `For legal notices and questions about these terms, contact ${companyProfile.contactEmail}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "This policy explains how Neural Network Group Ltd collects, uses, stores, and discloses personal data when operating Saint AGI.",
    lastUpdated: "17 March 2026",
    sections: [
      {
        title: "Controller information",
        paragraphs: [
          `${companyProfile.legalName} operates Saint AGI and is the controller for personal data described in this policy unless a different role is stated. Our contact email is ${companyProfile.contactEmail}.`,
          `Our registered office address is currently listed as ${companyProfile.registeredOffice}. This placeholder will be replaced when the published registered office details are finalized.`,
        ],
      },
      {
        title: "What we collect",
        paragraphs: [
          "We may collect account details such as name, email address, organization, authentication identifiers, billing contact details, support requests, and communications with us.",
          "We may also process product usage data such as workspace identifiers, configuration settings, model routing choices, audit events, approval actions, logs, and operational telemetry needed to secure, run, and improve the service.",
        ],
        bullets: [
          "Information you provide directly when creating an account, contacting us, or purchasing a plan.",
          "Information created through use of the product, including logs, events, and settings.",
          "Information received from service providers that support authentication, billing, hosting, and model execution.",
        ],
      },
      {
        title: "Why we use personal data",
        paragraphs: [
          "We use personal data to provide and maintain Saint AGI, authenticate users, process transactions, support customers, detect misuse, enforce policies, improve the product, and comply with legal obligations.",
          "Where applicable, we may use contact details to send service notices, important security updates, product changes, and lawful marketing communications. You can opt out of non-essential marketing messages at any time.",
        ],
      },
      {
        title: "Lawful bases",
        paragraphs: [
          "Where UK GDPR or EU GDPR applies, our lawful bases may include performance of a contract, legitimate interests in operating and securing the service, compliance with legal obligations, and consent where required.",
          "When we rely on legitimate interests, we consider the impact on individuals and use safeguards that are proportionate to the processing involved.",
        ],
      },
      {
        title: "Sharing and subprocessors",
        paragraphs: [
          "We may share personal data with trusted service providers that help us operate the service, such as infrastructure, authentication, payment, support, and model inference providers. We may also disclose information where required by law, regulation, court order, or to protect rights, safety, and security.",
          "We do not sell personal data. We may share data in connection with a merger, financing, acquisition, or sale of all or part of our business, subject to appropriate confidentiality and legal safeguards.",
        ],
      },
      {
        title: "International transfers",
        paragraphs: [
          "Personal data may be processed outside the UK or EEA depending on where our providers operate. Where required, we use appropriate transfer safeguards, which may include adequacy decisions, standard contractual clauses, or comparable lawful mechanisms.",
          "If you need more information about international transfers relevant to your use of the service, contact us at the address above.",
        ],
      },
      {
        title: "Retention and security",
        paragraphs: [
          "We retain personal data for as long as reasonably necessary for the purposes described in this policy, including to provide the service, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods may vary by data type and customer configuration.",
          "We use administrative, technical, and organizational measures designed to protect personal data. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "Depending on your location, you may have rights to access, correct, delete, restrict, object to, or port your personal data. You may also have the right to withdraw consent where processing is based on consent.",
          `To exercise your rights or ask a privacy question, contact ${companyProfile.contactEmail}. You may also have the right to complain to the Information Commissioner's Office or another relevant supervisory authority.`,
        ],
      },
    ],
  },
  gdpr: {
    title: "GDPR Policy",
    description:
      "This page summarizes how Saint AGI approaches UK GDPR and EU GDPR compliance, roles, lawful bases, and data subject rights.",
    lastUpdated: "17 March 2026",
    sections: [
      {
        title: "Our role under data protection law",
        paragraphs: [
          `${companyProfile.legalName} may act as a controller for account, billing, security, support, and website data connected to Saint AGI. In some product contexts, we may also act as a processor on behalf of our customers when handling customer-configured workspace content and operational data.`,
          "Where we act as a processor, the customer remains responsible for determining the legal basis for its use of the service and for ensuring that instructions given to Saint AGI are lawful and appropriate.",
        ],
      },
      {
        title: "Core GDPR principles we apply",
        paragraphs: [
          "We aim to process personal data lawfully, fairly, and transparently. We seek to collect data that is relevant and limited to what is necessary, maintain appropriate security controls, and avoid retaining data longer than reasonably required.",
          "We also design our systems around access control, logging, and accountability so that customers can operate AI workflows with clearer visibility and governance.",
        ],
        bullets: [
          "Purpose limitation and data minimization where practicable.",
          "Security controls appropriate to the nature of the service.",
          "Documented handling of rights requests, incidents, and provider management.",
        ],
      },
      {
        title: "Lawful bases and rights",
        paragraphs: [
          "When we process data as a controller, we rely on lawful bases such as contract, legitimate interests, legal obligation, and consent where applicable. When we process data as a processor, we act on the documented instructions of the relevant customer.",
          "Individuals may have rights of access, rectification, erasure, restriction, portability, objection, and complaint to a supervisory authority. Rights can vary depending on context, location, and the role in which we process the data.",
        ],
      },
      {
        title: "Transfers, security, and incidents",
        paragraphs: [
          "Where data is transferred outside the UK or EEA, we use transfer mechanisms required by applicable law. We also use technical and organizational measures intended to protect confidentiality, integrity, and availability.",
          "If we become aware of a confirmed personal data breach affecting controller data under our responsibility, we will assess the incident and make notifications required by applicable law.",
        ],
      },
      {
        title: "How to contact us",
        paragraphs: [
          `For GDPR requests or questions, contact ${companyProfile.contactEmail}. Formal notices may also reference ${companyProfile.registeredOffice} until the final registered office address is published.`,
          "If you are a Saint AGI customer and need a data processing agreement or transfer documentation, contact us and we will direct your request to the appropriate team.",
        ],
      },
    ],
  },
  aiUsage: {
    title: "AI Usage Policy",
    description:
      "This policy explains the expected use of Saint AGI's AI capabilities, including governance, human review, and prohibited uses.",
    lastUpdated: "17 March 2026",
    sections: [
      {
        title: "Purpose of this policy",
        paragraphs: [
          "Saint AGI is designed to help organizations run governed AI agents across real workflows. This policy sets expectations for customers and end users who deploy the service across internal tools, knowledge sources, and business processes.",
          "Use of Saint AGI must remain lawful, responsible, and consistent with your organization's internal approvals and risk policies.",
        ],
      },
      {
        title: "Human responsibility remains in place",
        paragraphs: [
          "AI outputs and agent actions should be reviewed at a level appropriate to the task. Sensitive changes, external communications, regulated workflows, financial activity, employment decisions, and security-impacting actions should receive meaningful human oversight.",
          "You are responsible for the prompts, data sources, instructions, and actions configured in your use of the service, including downstream effects of automated decisions or executions.",
        ],
      },
      {
        title: "Prohibited uses",
        paragraphs: [
          "You may not use Saint AGI to generate or facilitate unlawful content, fraud, harassment, malware, unauthorized access, deceptive impersonation, or activity that infringes privacy, intellectual property, or other legal rights.",
          "You may not use the service in a way that violates employment law, anti-discrimination law, consumer law, sanctions rules, export controls, or any other law that applies to your organization or users.",
        ],
        bullets: [
          "No deployment for illegal surveillance or unauthorized monitoring.",
          "No autonomous execution in high-risk contexts without suitable human review and legal basis.",
          "No attempts to disable safety, approval, logging, or governance features without authorization.",
        ],
      },
      {
        title: "Data handling and model use",
        paragraphs: [
          "You should only submit data to Saint AGI when you have the right and legal basis to do so. Before using personal, confidential, or regulated data, ensure that your organization has approved the workflow and that the selected model path is appropriate for the sensitivity of the task.",
          "Where the product offers different routing, approval, or visibility controls, you are responsible for choosing settings that fit the relevant level of risk.",
        ],
      },
      {
        title: "Monitoring and enforcement",
        paragraphs: [
          "We may monitor service use for security, abuse prevention, product integrity, and compliance with our terms and policies. This can include reviewing operational metadata, audit events, approval trails, and support-related information.",
          "We may suspend or restrict use that poses a legal, security, or reputational risk to us, our customers, third parties, or the public.",
        ],
      },
      {
        title: "Questions and escalation",
        paragraphs: [
          `If you need clarification on appropriate use of Saint AGI, contact ${companyProfile.contactEmail}. If you believe the service has been used in a way that breaches this policy, notify us promptly using the same address.`,
          "Organizations using Saint AGI should maintain their own internal approval, escalation, and review processes for higher-risk AI activity.",
        ],
      },
    ],
  },
} satisfies Record<string, LegalDocument>;
