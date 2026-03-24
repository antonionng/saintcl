export const headerLinks = [
  { href: "/#capabilities", label: "Product" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/pricing", label: "Pricing" },
  { href: "/models", label: "Models" },
  { href: "/#news", label: "News" },
];

export const companyProfile = {
  brandName: "Saint AGI",
  legalName: "Neural Network Group Ltd",
  contactEmail: "hello@neuralnetworkgroup.com",
  country: "England",
  governingLaw: "England and Wales",
  registeredOffice: "[Registered office address to be confirmed]",
  tagline: "Make every employee AI-powered. Keep the rollout governed.",
};

export const capabilitiesIntro = {
  kicker: "Capabilities",
  title: "What your company needs to put AI to work.",
  description:
    "Saint AGI gives every team governed agents that can plan, act, and follow through across the systems your employees already use.",
  supportingCopy: "Company-wide adoption. Centralized control.",
  cta: {
    href: "/capabilities",
    label: "Explore all capabilities",
  },
};

export const capabilityCards = [
  {
    title: "Autonomous execution",
    badge: "Work that gets completed",
    description:
      "Give employees agents that can break work into steps, act across tools, adapt to results, and keep moving without constant supervision.",
    proof: "Multi-step execution that keeps momentum across real workflows.",
  },
  {
    title: "Channels and presence",
    badge: "Where employees already work",
    description:
      "Deploy agents through chat, inbox, voice, and shared workstreams so teams can use AI inside the channels they already rely on.",
    proof: "Slack, WhatsApp, Telegram, Teams, email, and voice-ready surfaces.",
  },
  {
    title: "Tools and automation",
    badge: "Turns intent into output",
    description:
      "Connect agents to browser automation, files, shell, GitHub, calendar, search, and scheduled actions so work actually gets done.",
    proof: "Browser, files, shell, GitHub, search, cron, and external triggers.",
  },
  {
    title: "Memory and routing",
    badge: "Context that scales cleanly",
    description:
      "Keep sessions, memory, activation rules, and model routing aligned so each team gets continuity without operational sprawl.",
    proof: "Isolated workspaces, persistent sessions, pruning, and multi-model routing.",
  },
  {
    title: "Governance and trust",
    badge: "Roll out with confidence",
    description:
      "Apply approvals, allowlists, sandboxing, audit visibility, and runtime monitoring so adoption can spread without losing control.",
    proof: "Approvals, audit trails, health checks, allowlists, and sandbox controls.",
  },
  {
    title: "Local-first runtime",
    badge: "Closer to your systems",
    description:
      "Keep credentials, files, and execution close to your company while extending reach through managed gateways when needed.",
    proof: "Runs on local devices with optional persistent cloud reach.",
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
    title: "Operations",
    detail: "Route requests. Manage handoffs. Keep moving.",
  },
  {
    title: "Marketing",
    detail: "Generate ideas. Personalize campaigns. Analyze results.",
  },
  {
    title: "HR",
    detail: "Screen candidates. Draft offers. Handle queries.",
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
  title: "Model range your company can actually put to work.",
  description:
    "Give each team the right mix of power, speed, cost control, and deployment flexibility while policy, memory, and runtime behavior stay consistent across the business.",
};

export const pricingIntro = {
  kicker: "Pricing",
  title: "Roll out AI agents across your company with control from day one.",
  description:
    "Start with one team, prove value quickly, then expand across the business with approvals, shared knowledge, audit visibility, and clear spend controls.",
};

export const modelCoverageCards = [
  {
    title: "Deep reasoning",
    badge: "Complex work",
    description: "Handle planning-heavy analysis, long chains of thought, and high-stakes work that needs stronger judgment.",
  },
  {
    title: "Fast execution",
    badge: "High volume",
    description: "Keep drafting, triage, routing, and repetitive workflows moving with low-latency models built for throughput.",
  },
  {
    title: "Open and sovereign",
    badge: "Control",
    description: "Support deployment paths that stay closer to your infrastructure when data residency and operational control matter.",
  },
  {
    title: "Governed premium access",
    badge: "Spend control",
    description: "Unlock stronger models with approvals, guardrails, and budget-aware routing instead of opening the floodgates.",
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
  title: "What matters for companies putting AI to work",
  description:
    "Frontier shifts that affect execution, governance, and rollout across real teams.",
};

export const articleCta = {
  kicker: "Build with Saint AGI",
  title: "Make your company AI-powered with governed agents.",
  description:
    "Start free, equip teams with the right agents for the job, and keep approvals, visibility, and policy enforcement in one place.",
  primary: {
    href: "/signup",
    label: "Start free",
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
      { href: "/signup", label: "Start free" },
      { href: "/login", label: "Log in" },
      { href: `mailto:${companyProfile.contactEmail}`, label: "Contact" },
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
