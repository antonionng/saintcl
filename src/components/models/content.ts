export const modelsPageHero = {
  kicker: "Models",
  title: "Power, flexibility, and control across the full model range.",
  description:
    "Saint AGI gives your company access to deep reasoning, fast execution, open deployment paths, and budget-aware coverage under one governed operating layer.",
  primary: {
    href: "/signup",
    label: "Start free",
  },
  secondary: {
    href: "/capabilities",
    label: "See capabilities",
  },
  proofPoints: [
    "Deep reasoning for complex work",
    "Fast lanes for high-volume execution",
    "Open and sovereign deployment options",
    "Governed routing with approvals and guardrails",
  ],
} as const;

export const modelsPositioningCards = [
  {
    title: "More power where it matters",
    description:
      "Route harder work into stronger reasoning models for planning, review, synthesis, and multi-step decisions without forcing every task onto the most expensive path.",
  },
  {
    title: "More speed where it pays off",
    description:
      "Keep drafting, classification, routing, and repetitive workflows moving with faster models tuned for throughput and responsiveness.",
  },
  {
    title: "More control when requirements tighten",
    description:
      "Support open, local, and infrastructure-conscious deployment patterns when teams need tighter control over how AI runs.",
  },
] as const;

export const modelBandsIntro = {
  kicker: "Coverage",
  title: "The right model band for each type of work.",
  description:
    "Saint AGI is built around model range, not single-model dependency. Teams can match the task to the right balance of reasoning depth, latency, price, and control.",
} as const;

export const modelBands = [
  {
    title: "Reasoning band",
    badge: "Deep work",
    description:
      "For planning-heavy tasks, analysis, difficult decisions, and work that benefits from longer context and better judgment.",
    bullets: [
      "Research and synthesis",
      "Complex planning and review",
      "Multi-step reasoning with fewer breakdowns",
    ],
  },
  {
    title: "Execution band",
    badge: "Fast lanes",
    description:
      "For response speed, repetitive workflows, lightweight drafting, and operational tasks where throughput matters more than maximum depth.",
    bullets: [
      "Drafting and summarization",
      "Routing and classification",
      "High-volume task handling",
    ],
  },
  {
    title: "Control band",
    badge: "Open and sovereign",
    description:
      "For companies that need deployment flexibility, closer infrastructure alignment, or more control over where model execution happens.",
    bullets: [
      "Infrastructure-conscious deployment",
      "Open and local model paths",
      "More control-sensitive workloads",
    ],
  },
  {
    title: "Budget band",
    badge: "Cost-aware coverage",
    description:
      "For experimentation, broad internal rollout, and workflows that need smart cost control before they need maximum capability.",
    bullets: [
      "Early rollout and experimentation",
      "Coverage across more employees",
      "Spend-aware usage expansion",
    ],
  },
] as const;

export const operatingPrinciplesIntro = {
  kicker: "Operating model",
  title: "Model flexibility without operational drift.",
  description:
    "Saint AGI keeps the surrounding system stable even when the model behind a workflow changes. That is what makes model range useful at company scale.",
} as const;

export const operatingPrinciples = [
  {
    step: "01",
    title: "Route by job type",
    description:
      "Use stronger reasoning where the work is harder and faster models where responsiveness and volume matter more.",
  },
  {
    step: "02",
    title: "Keep policy centralized",
    description:
      "Approvals, guardrails, and spend controls stay attached to execution so teams do not create their own fragmented model policies.",
  },
  {
    step: "03",
    title: "Preserve memory and continuity",
    description:
      "Session behavior, agent identity, and runtime continuity stay stable even as the model choice behind the task changes.",
  },
  {
    step: "04",
    title: "Scale without lock-in",
    description:
      "Expand across reasoning, speed, price, and control requirements without rebuilding the surrounding workflow layer every time.",
  },
] as const;

export const modelsUseCasesIntro = {
  kicker: "Where range matters",
  title: "Different teams need different model behavior.",
  description:
    "The point is not to force every employee onto the same model. The point is to give the business a governed surface that can serve very different workloads well.",
} as const;

export const modelsUseCases = [
  {
    team: "Operations",
    title: "Keep high-volume work moving",
    description:
      "Use faster models for triage, routing, status updates, and repetitive coordination while preserving auditability and control.",
  },
  {
    team: "Finance and leadership",
    title: "Use more power for harder judgment",
    description:
      "Bring stronger reasoning into reviews, planning, synthesis, and decision support where mistakes are more expensive than latency.",
  },
  {
    team: "Engineering",
    title: "Match the model to the task",
    description:
      "Use range across debugging, planning, coding support, and documentation instead of relying on a single cost and latency profile for every workflow.",
  },
  {
    team: "Security and compliance",
    title: "Keep deployment options open",
    description:
      "Support more control-sensitive workloads with deployment paths that align better with infrastructure and governance expectations.",
  },
] as const;

export const modelsClosingCta = {
  title: "A wider model surface is only useful when the company can control it.",
  description:
    "Saint AGI turns model variety into a practical operating advantage by keeping routing, approvals, memory, and runtime behavior aligned as adoption scales.",
  primary: {
    href: "/signup",
    label: "Start free",
  },
  secondary: {
    href: "/pricing",
    label: "See pricing",
  },
} as const;
