export const headerLinks = [
  { href: "/#platform", label: "Platform" },
  { href: "/#capabilities", label: "Product" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/pricing", label: "Pricing" },
];

export const companyProfile = {
  brandName: "Saint AGI",
  legalName: "Neural Network Group Ltd",
  contactEmail: "hello@neuralnetworkgroup.com",
  country: "England",
  governingLaw: "England and Wales",
  registeredOffice: "[Registered office address to be confirmed]",
  tagline: "Launch useful agents with the control enterprises need.",
};

export const launchSteps = [
  {
    label: "1",
    title: "Choose the job",
    description: "Start with a proven use case like meetings, support, sales, operations, or IT.",
  },
  {
    label: "2",
    title: "Launch the agent",
    description: "Saint AGI creates the workspace, applies policy, and prepares the runtime.",
  },
  {
    label: "3",
    title: "Bring it to work",
    description: "Use workspace chat first, then connect approved business channels.",
  },
  {
    label: "4",
    title: "Scale with confidence",
    description: "Admins keep access, approvals, audit trails, spend, and runtime health in one place.",
  },
] as const;

export const agentPersonas = [
  {
    initials: "M",
    name: "Maya",
    role: "FINANCE · ACCOUNTANT",
    description:
      "Reconciles your books at 3am. Files VAT before coffee. Drafts board reports. Chases overdue invoices in seven languages.",
    reportsToPrefix: "Reports to ",
    reportsTo: "Rachel",
    reportsToSuffix: ", your CFO.",
  },
  {
    initials: "Mc",
    name: "Marcus",
    role: "SALES · ACCOUNT EXEC",
    description:
      "Researches accounts. Drafts outreach. Books meetings. Updates HubSpot without being asked.",
    reportsToPrefix: "Reports to ",
    reportsTo: "Sarah",
    reportsToSuffix: ", your Head of Sales.",
  },
  {
    initials: "P",
    name: "Priya",
    role: "TALENT · RECRUITER",
    description:
      "Sources candidates. Screens resumes. Schedules interviews. Shortlists with reasons attached.",
    reportsToPrefix: "Reports to ",
    reportsTo: "Marcus",
    reportsToSuffix: ", your Head of People.",
  },
  {
    initials: "J",
    name: "James",
    role: "MARKETING · CONTENT",
    description:
      "Drafts blog posts. Schedules social. Runs A/B tests. Reports performance every Monday morning.",
    reportsToPrefix: "Reports to your ",
    reportsTo: "CMO",
    reportsToSuffix: ".",
  },
  {
    initials: "E",
    name: "Elena",
    role: "CUSTOMER · SUPPORT",
    description:
      "Resolves Tier 1 in seconds. Answers in seven languages. Escalates with full context attached.",
    reportsToPrefix: "Reports to your ",
    reportsTo: "Head of Support",
    reportsToSuffix: ".",
  },
  {
    initials: "D",
    name: "David",
    role: "OPERATIONS · PM",
    description:
      "Routes work. Manages handoffs. Tracks deadlines. Sends standup summaries before standup.",
    reportsToPrefix: "Reports to your ",
    reportsTo: "COO",
    reportsToSuffix: ".",
  },
] as const;

export const agentsSectionIntro = {
  kicker: "YOUR NEW HIRES",
  title: "Meet six of them. Build the rest.",
  description:
    "14 pre-built personas designed for the work your team does every day. Custom personas when your work is different. Provision as many as your team can handle, all managed in one place.",
  cta: { href: "/templates", label: "Browse all 14 personas" },
};

export const howItWorksIntro = {
  kicker: "TEN-MINUTE SETUP",
  title: "Provision an agent like you provision an email.",
  description:
    "No code. No consultants. No six-week implementation. By the time your coffee goes cold, your first agent is working.",
};

export const howItWorksSteps = [
  {
    number: "1",
    label: "STEP ONE",
    title: "Pick a persona.",
    description:
      "Choose from 14 pre-built roles, or design your own. Maya, Marcus, Priya, or someone you design from scratch.",
    preview: "Step 1 preview screen",
    imageSrc: "/landing/step-1-persona.png",
    imageAlt: "Saint AGI persona selection screen showing Maya, Marcus, Priya, James, Elena, and a custom agent option.",
  },
  {
    number: "2",
    label: "STEP TWO",
    title: "Connect the tools.",
    description:
      "Authorize the systems your agent can touch. Xero, HubSpot, Slack, WhatsApp, whatever your team already uses. Toggle off what should stay off-limits.",
    preview: "Step 2 preview screen",
    imageSrc: "/landing/step-2-tools.png",
    imageAlt: "Saint AGI connections screen showing Xero, Stripe, HSBC Business Banking, Gmail, and Payroll access toggles.",
  },
  {
    number: "3",
    label: "STEP THREE",
    title: "Set the guardrails.",
    description:
      "Decide what needs your approval, what gets logged, and what stays off-limits. Set it once, enforced everywhere your agent works.",
    preview: "Step 3 preview screen",
    imageSrc: "/landing/step-3-guardrails.png",
    imageAlt: "Saint AGI policy screen showing approval, spend, PII, model routing, notification, and audit stream guardrails.",
  },
  {
    number: "4",
    label: "STEP FOUR",
    title: "Start working.",
    description:
      "Your agent lives in the apps your team already uses. WhatsApp, Telegram, Slack, Teams. Message it like a coworker. It gets things done.",
    preview: "Step 4 preview screen",
    imageSrc: "/landing/step-4-channels.png",
    imageAlt: "Saint AGI channels screen showing active WhatsApp, Slack, Telegram, and Microsoft Teams conversations.",
  },
] as const;

export const trustSectionIntro = {
  kicker: "WHY ENTERPRISES TRUST US",
  titleTop: "Useful on day one.",
  titleBottom: "Controlled on day two hundred.",
  description:
    "Two years of research. Built with enterprises across the globe. Every governance question they asked, we answered.",
};

export const auditStreamRows = [
  {
    time: "14:32:08",
    actor: "maya.finance",
    action: "drafted_email",
    detail: "user.rachel",
    status: "APPROVED",
    statusVariant: "approved",
  },
  {
    time: "14:31:51",
    actor: "marcus.sales",
    action: "searched_linkedin",
    detail: "47 results",
    status: "OK",
    statusVariant: "ok",
  },
  {
    time: "14:28:14",
    actor: "priya.talent",
    action: "exported_csv",
    detail: "230 candidates",
    status: "OK",
    statusVariant: "ok",
  },
  {
    time: "14:21:02",
    actor: "david.ops",
    action: "blocked_action",
    detail: "policy:external_api",
    status: "BLOCKED",
    statusVariant: "blocked",
  },
  {
    time: "14:14:39",
    actor: "elena.support",
    action: "resolved_ticket",
    detail: "ticket#4471",
    status: "OK",
    statusVariant: "ok",
  },
  {
    time: "14:09:22",
    actor: "james.marketing",
    action: "drafted_post",
    detail: "awaiting_approval",
    status: "PENDING",
    statusVariant: "pending",
  },
] as const;

export const approvalsQueue = [
  {
    title: "External email to acme-corp.com",
    meta: "Marcus · Sales agent · 2m ago",
  },
  {
    title: "Spend £87 on Apollo credits",
    meta: "Priya · Recruiter agent · 12m ago",
  },
] as const;

export const trustPillars = [
  {
    label: "PILLAR 01",
    icon: "shield",
    title: "Governed by default.",
    description:
      "Every action logged. Sensitive ones held for approval. Nothing happens that you didn't authorize.",
  },
  {
    label: "PILLAR 02",
    icon: "eye",
    title: "Fully observable.",
    description:
      "Live dashboard. Real-time activity. Spend visibility. Drill into any action your agent has ever taken.",
  },
  {
    label: "PILLAR 03",
    icon: "switch",
    title: "Not tied to one LLM.",
    description:
      "Use Claude, GPT, Gemini, or open-source models. The right brain for every job. Switch any time.",
  },
  {
    label: "PILLAR 04",
    icon: "chat",
    title: "Lives where your team works.",
    description:
      "WhatsApp, Telegram, Slack, Teams today. Email, voice, and Google Meet next.",
  },
] as const;

export const finalCtaContent = {
  headline: "Two years of research. Built with enterprises across the globe. Opening access carefully.",
  subhead: "Join the waiting list and tell us where governed agents could help your team first.",
  primary: { href: "/#contact", label: "Join waitlist" },
  secondary: { href: "/#contact", label: "Tell us your use case" },
};

export const productSystemIntro = {
  kicker: "Why Saint AGI",
  title: "AI agents only matter when a company can trust them at work.",
  description:
    "Saint AGI gives teams useful agents while giving operators the controls needed for real adoption.",
};

export const productSystemPillars = [
  {
    title: "Control for operators",
    description:
      "Create agents, assign access, approve sensitive actions, and monitor activity without exposing infrastructure to employees.",
    proof: "Agents, channels, approvals, audit trails, spend, model policy, and runtime health.",
  },
  {
    title: "A simple workspace",
    description:
      "Give employees one place to use approved agents with the right company context and clear handoffs.",
    proof: "Assigned agents, workspace chat, starter prompts, profile context, and role boundaries.",
  },
  {
    title: "Managed operations",
    description:
      "Keep runtime setup, logs, gateways, updates, and health checks governed as usage grows.",
    proof: "Gateway setup, admin console, log tail, health checks, and environment readiness.",
  },
] as const;

export const connectorMaturityCards = [
  {
    title: "Available now",
    channels: "Workspace chat, Slack, Telegram",
    description: "Launch the first rollout through channels with clear setup paths.",
  },
  {
    title: "Enterprise channels",
    channels: "WhatsApp, Google Chat, Microsoft Teams, email",
    description: "Add deeper channels with credentials, approvals, diagnostics, and ownership defined.",
  },
  {
    title: "Advanced runtime",
    channels: "Google Meet, voice, telephony",
    description: "Extend into meeting, voice, and telephony workflows with stronger operational controls.",
  },
] as const;

export const capabilitiesIntro = {
  kicker: "Capabilities",
  title: "Everything needed to move from AI trials to governed execution.",
  description:
    "Provision agents, connect them to work, and keep policy, visibility, and runtime operations aligned.",
  supportingCopy: "Useful on day one. Controlled on day two hundred.",
  cta: {
    href: "/capabilities",
    label: "Explore all capabilities",
  },
};

export const capabilityCards = [
  {
    title: "Autonomous execution",
    badge: "Follow-through",
    description:
      "Agents plan, act, check results, and keep work moving inside approved boundaries.",
    proof: "Multi-step work for support, sales, meetings, operations, IT, and research.",
  },
  {
    title: "Channels and presence",
    badge: "Where teams work",
    description:
      "Start in the workspace, then extend agents into approved messaging and collaboration channels.",
    proof: "Slack and Telegram today, with WhatsApp, Teams, Google Chat, Meet, email, and voice as enterprise lanes.",
  },
  {
    title: "Tools and automation",
    badge: "Action",
    description:
      "Connect agents to tools so requests turn into completed work, not another prompt.",
    proof: "Browser, files, search, GitHub, cron, external triggers, and governed terminal paths.",
  },
  {
    title: "Memory and routing",
    badge: "Context",
    description:
      "Keep company knowledge, memory, assignments, and model routing aligned across teams.",
    proof: "Org-scoped workspaces, assigned sessions, persistent memory, pruning, and model routing.",
  },
  {
    title: "Governance and trust",
    badge: "Admin control",
    description:
      "Give admins the guardrails required before agents touch real business systems.",
    proof: "Approvals, audit events, health checks, role gates, allowlists, and sandbox controls.",
  },
  {
    title: "Runtime governance",
    badge: "Reliability",
    description:
      "Keep credentials, logs, origins, updates, and tenant runtime behavior under platform-owner control.",
    proof: "Hosted gateway paths, local runtime options, persistent cloud reach, and managed console access.",
  },
] as const;

export const companyRoles = [
  {
    title: "Sales",
    detail: "Research accounts. Draft outreach. Update CRM.",
  },
  {
    title: "Support",
    detail: "Resolve Tier 1 fast. Escalate with context.",
  },
  {
    title: "Meetings",
    detail: "Summarize calls. Extract decisions. Draft follow-ups.",
  },
  {
    title: "Operations",
    detail: "Route requests. Manage handoffs. Keep work moving.",
  },
  {
    title: "IT",
    detail: "Resolve common issues. Escalate risky requests.",
  },
  {
    title: "Finance",
    detail: "Reconcile data. Monitor budgets. Flag issues.",
  },
  {
    title: "Engineering",
    detail: "Debug code. Review PRs. Automate tasks.",
  },
  {
    title: "Leadership",
    detail: "Track activity. Measure leverage. Prove ROI.",
  },
];

export const modelsIntro = {
  kicker: "Models",
  title: "Use the right model without losing control.",
  description:
    "Route work across stronger, faster, or more controlled models while policy, memory, and audit behavior stay consistent.",
};

export const pricingIntro = {
  kicker: "Pricing",
  title: "Start small. Scale when the value is proven.",
  description:
    "Launch one governed agent, prove the workflow, then expand across teams with shared controls and clear spend visibility.",
};

export const modelCoverageCards = [
  {
    title: "Deep reasoning",
    badge: "Complex work",
    description: "Use stronger reasoning for planning, analysis, and work that needs better judgment.",
  },
  {
    title: "Fast execution",
    badge: "High volume",
    description: "Keep drafting, triage, routing, and repetitive workflows moving quickly.",
  },
  {
    title: "Open and sovereign",
    badge: "Control",
    description: "Support deployment choices for teams with stricter control or residency needs.",
  },
  {
    title: "Governed premium access",
    badge: "Spend control",
    description: "Unlock premium capability with approvals, guardrails, and budget-aware routing.",
  },
];

export const modelsSectionProofPoints = [
  "Reasoning depth for complex decisions",
  "Fast lanes for repetitive operational work",
  "Flexible deployment for control-sensitive teams",
];

export const modelsSectionCta = {
  href: "/models",
  label: "Explore models",
};

export const newsIntro = {
  kicker: "Latest news",
  title: "Signals for companies operationalizing AI",
  description:
    "Model, security, and runtime shifts that affect how enterprises adopt agents.",
};

export const articleCta = {
  kicker: "Build with Saint AGI",
  title: "Turn AI ambition into governed execution.",
  description:
    "Launch agents from proven recipes, connect them to work, and keep approvals, visibility, runtime health, and policy in one place.",
  primary: {
    href: "/#contact",
    label: "Join waitlist",
  },
  secondary: {
    href: "/pricing",
    label: "See pricing",
  },
};

export const footerLinkGroups = [
  {
    title: "Product",
    links: [
      { href: "/#platform", label: "Platform" },
      { href: "/#capabilities", label: "Product" },
      { href: "/capabilities", label: "Capabilities" },
      { href: "/models", label: "Models" },
      { href: "/#news", label: "News" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#contact", label: "Join waitlist" },
      { href: "/login", label: "Log in" },
      { href: "/#contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/gdpr", label: "GDPR" },
      { href: "/ai-usage-policy", label: "AI Usage Policy" },
    ],
  },
];

export type ArticleSection = {
  title: string;
  paragraphs: string[];
};

export type AnnouncementCard = {
  slug: string;
  source: string;
  category: string;
  publishedAt: string;
  readTime: string;
  title: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  sections: ArticleSection[];
};

export const announcementCards = [
  {
    slug: "gpt-5-4-thinking-signals-a-new-standard-for-ai-work",
    source: "Saint AGI desk",
    category: "Models",
    publishedAt: "Mar 2026",
    readTime: "5 min read",
    title: "GPT-5.4 Thinking raises execution reliability",
    summary:
      "Long context and stronger tool use raise the bar for agents that need to reason and follow through.",
    imageSrc: "/news/gpt-5-4-thinking.svg",
    imageAlt: "Abstract dark illustration for GPT-5.4 Thinking and governed agent execution.",
    sections: [
      {
        title: "A new operating bar",
        paragraphs: [
          "The latest generation of reasoning models is changing what companies expect from AI execution. The shift is no longer only about benchmark performance. It is about whether an agent can stay coherent through multi-step work, choose the right tools, and finish the job inside the systems where people already work.",
          "That matters because enterprise value shows up in follow-through. A stronger model that still drifts, stalls, or loses context in the middle of execution does not reduce real workload. GPT-5.4 Thinking signals a move toward agents that can sustain intent over longer task chains with fewer breakdowns.",
        ],
      },
      {
        title: "Why control matters more as models improve",
        paragraphs: [
          "For Saint AGI, stronger models create more upside only when they are wrapped in policy, approvals, and visibility. Better reasoning expands the range of tasks companies are willing to delegate. It also increases the need for clear oversight because more capable agents can touch more sensitive workflows.",
          "That is why the control plane matters as much as the model choice. If operators cannot see where work ran, which tools were used, or when approval was requested, reliability gains at the model layer do not translate into organizational trust.",
        ],
      },
      {
        title: "What teams should do next",
        paragraphs: [
          "Teams should prepare for a world where reasoning quality improves faster than operational maturity inside companies. The winners will be the organizations that can route these stronger models into real workflows without creating shadow automation, fragmented permissions, or invisible failure modes.",
          "Execution reliability is quickly becoming the baseline expectation. The next differentiator is whether companies can roll it out in a governed way across sales, support, operations, engineering, and leadership without losing confidence in the system.",
        ],
      },
    ],
  },
  {
    slug: "claude-opus-4-6-keeps-the-pressure-on-production-coding",
    source: "Saint AGI desk",
    category: "Models",
    publishedAt: "Mar 2026",
    readTime: "4 min read",
    title: "Multi-model routing wins over single-model bets",
    summary:
      "The strongest teams are routing by task and controlling the surface centrally.",
    imageSrc: "/news/multi-model-routing.svg",
    imageAlt: "Abstract routing map showing multiple models under one dark control surface.",
    sections: [
      {
        title: "Single-model thinking keeps breaking down",
        paragraphs: [
          "The market keeps proving the same point. No single model is best for every task. Some are better at deep reasoning. Some are faster. Some are cheaper. Some are a better fit for open or sovereign deployment requirements.",
          "That means the production question has shifted from picking one winner to building the right routing strategy. Teams that still optimize around a single default model tend to overpay on simple tasks and underperform on complex ones.",
        ],
      },
      {
        title: "Routing should be a platform decision",
        paragraphs: [
          "The strongest operating model is centralized routing with decentralized usage. Employees should not need to understand every trade-off between reasoning depth, latency, price, and deployment pattern before they can get value from an agent.",
          "Saint AGI treats routing as part of the product layer. The best model for the task can change in the background while policies, approvals, audit visibility, and memory behavior stay consistent from one workflow to the next.",
        ],
      },
      {
        title: "This changes how companies adopt AI",
        paragraphs: [
          "Once routing is handled centrally, teams can scale usage without forcing every employee to become an expert in the model market. That lowers the learning curve and keeps the surface area governable as adoption spreads beyond a handful of power users.",
          "The result is a cleaner operating pattern. Companies can move faster, keep spend aligned with task value, and avoid creating a patchwork of incompatible agent setups across the business.",
        ],
      },
    ],
  },
  {
    slug: "gemini-3-1-pro-preview-expands-the-frontier-model-playbook",
    source: "Saint AGI desk",
    category: "Models",
    publishedAt: "Mar 2026",
    readTime: "5 min read",
    title: "Runtime governance becomes table stakes",
    summary:
      "As agents become more capable, governance is no longer optional infrastructure.",
    imageSrc: "/news/runtime-governance.svg",
    imageAlt: "Abstract monitoring interface representing runtime governance for AI agents.",
    sections: [
      {
        title: "Capability growth changes the risk profile",
        paragraphs: [
          "As agents become more capable, governance moves from compliance detail to product requirement. Companies need to know what agents are allowed to do, what they are actually doing, and when human approval is required.",
          "That shift is happening because model improvements now affect planning, tool use, and follow-through at the same time. The more an agent can do independently, the less acceptable it becomes to run without logs, controls, and clear review paths.",
        ],
      },
      {
        title: "Governance is how adoption scales",
        paragraphs: [
          "This is not about slowing teams down. It is about making adoption scalable. Without a shared control layer, every department creates its own workflow, its own risk profile, and its own blind spots.",
          "A runtime layer with approval checkpoints, spend visibility, and activity history lets companies expand use cases without turning every rollout into a custom risk assessment exercise.",
        ],
      },
      {
        title: "The new baseline for deployment",
        paragraphs: [
          "Runtime governance is becoming table stakes because AI is moving from experimentation into real operational use. The control layer now matters as much as the model layer, especially once usage becomes continuous instead of occasional.",
          "In practice, the companies that take governance seriously early will have an easier time distributing agents across the business. They will spend less time untangling policy drift and more time turning model improvements into measurable leverage.",
        ],
      },
    ],
  },
  {
    slug: "trinity-large-preview-shows-why-range-matters-more-than-one-best-model",
    source: "Saint AGI desk",
    category: "Models",
    publishedAt: "Mar 2026",
    readTime: "4 min read",
    title: "Trinity Large Preview shows why range matters more than one best model",
    summary:
      "The market keeps proving that teams need coverage across reasoning, speed, and price, not a single winner.",
    imageSrc: "/news/model-range.svg",
    imageAlt: "Abstract layered spectrum showing model range across cost, speed, and reasoning.",
    sections: [
      {
        title: "Range is the real production requirement",
        paragraphs: [
          "New model launches continue to reinforce the same lesson. The right production stack is not built around a single model. It is built around range. Teams need access to stronger reasoning, lower-latency options, and budget-friendly choices that still perform well enough for high-volume work.",
          "A broad model surface becomes more valuable as AI spreads across more departments. What sales needs for fast drafting is not identical to what finance needs for review or what engineering needs for deeper planning.",
        ],
      },
      {
        title: "Coverage without chaos",
        paragraphs: [
          "That is especially true once AI spreads beyond a few power users. Different teams, tasks, and channels generate different requirements. The platform has to let companies mix and match without introducing chaos at the policy layer.",
          "Saint AGI is built around that reality. Employees should benefit from the full range of available capability while operators keep a clear handle on policy, spend, and model selection.",
        ],
      },
      {
        title: "Why this affects platform design",
        paragraphs: [
          "If range matters more than one best model, then the platform has to normalize everything around it. Memory, approvals, logging, and governance should not fragment every time a team changes the model behind a workflow.",
          "That is the practical implication of the market right now. The winning AI stack is increasingly the one that keeps behavior stable while model selection remains flexible.",
        ],
      },
    ],
  },
  {
    slug: "codex-security-makes-the-case-for-tighter-agent-governance",
    source: "Saint AGI desk",
    category: "Security",
    publishedAt: "Mar 2026",
    readTime: "5 min read",
    title: "Runtime monitoring is the new security frontier",
    summary:
      "Pre-deployment checks are not enough when agents operate continuously across tools, approvals, and follow-through.",
    imageSrc: "/news/runtime-monitoring.svg",
    imageAlt: "Abstract dark security dashboard focused on runtime monitoring and approvals.",
    sections: [
      {
        title: "Static review is no longer enough",
        paragraphs: [
          "Security is shifting from static checks to continuous observation. Once agents can act across email, chat, CRM, tickets, and internal systems, the question is no longer just what they are permitted to do. It is what they are doing over time.",
          "That changes the shape of operational security. A policy document or pre-deployment review cannot capture how an always-on system behaves across real workflows, edge cases, and accumulative context.",
        ],
      },
      {
        title: "Monitoring has to be built into the runtime",
        paragraphs: [
          "That makes runtime monitoring essential. Companies need logs, approvals, and activity visibility that surface behavior before it becomes a problem. They also need enough structure to intervene without shutting down useful automation entirely.",
          "This is why governed execution is becoming a core product requirement rather than an add-on. Monitoring has to sit next to the work itself, not in a disconnected reporting layer that people only open after something breaks.",
        ],
      },
      {
        title: "Trust is now an operational outcome",
        paragraphs: [
          "For Saint AGI, that is part of the product promise. Better AI execution only matters when the company can see it, govern it, and trust it. Trust becomes more durable when the system makes its own behavior inspectable.",
          "The broader implication is straightforward. As agents become continuous, runtime monitoring will define the next security frontier for AI operations inside real companies.",
        ],
      },
    ],
  },
  {
    slug: "stateful-runtime-momentum-points-to-a-bigger-shift-in-agent-infrastructure",
    source: "Saint AGI desk",
    category: "Infrastructure",
    publishedAt: "Feb 2026",
    readTime: "4 min read",
    title: "Stateful runtime momentum points to a bigger shift in agent infrastructure",
    summary:
      "The next wave of agent platforms will be defined by memory, continuity, and operational runtime design.",
    imageSrc: "/news/stateful-runtime.svg",
    imageAlt: "Abstract infrastructure illustration showing persistent sessions and stateful runtime layers.",
    sections: [
      {
        title: "Runtime design is moving to the foreground",
        paragraphs: [
          "One of the clearest themes in the market right now is that runtime design matters more than people first assumed. Teams are learning that agents are not only prompts and models. They are also state, sessions, memory, and process continuity.",
          "That matters because weak runtime design creates friction even when the model is strong. Agents lose continuity, duplicate work, or become impossible to reason about once usage moves from isolated demos into recurring operations.",
        ],
      },
      {
        title: "Continuity is part of product quality",
        paragraphs: [
          "This trend matters directly to Saint AGI because the product sits in the operational layer between people, models, and the work itself. If the runtime is weak, the experience breaks down before model quality can deliver its full value.",
          "Persistent state, recoverable sessions, and clear execution history are not background details. They shape whether an agent feels dependable enough to keep inside live workflows across the company.",
        ],
      },
      {
        title: "What companies should expect next",
        paragraphs: [
          "We expect more of the market conversation to move in this direction. Companies will increasingly care about what keeps agents live, consistent, observable, and ready to work over time.",
          "That means infrastructure decisions will become more visible at the product layer. The platforms that win will make continuity feel simple to the end user while still giving operators the controls they need underneath.",
        ],
      },
    ],
  },
] satisfies AnnouncementCard[];

export function getAnnouncementBySlug(slug: string) {
  return announcementCards.find((item) => item.slug === slug);
}
