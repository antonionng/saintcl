export const capabilitiesPageHero = {
  kicker: "Capabilities",
  title: "What your company needs to become AI-powered.",
  description:
    "Saint AGI gives every team governed agents that can plan, act, route, and follow through across the tools, channels, and systems where employees already work.",
  primary: {
    href: "/signup",
    label: "Start free",
  },
  secondary: {
    href: "/pricing",
    label: "See pricing",
  },
  proofPoints: [
    "For every team",
    "Local-first runtime",
    "Multi-model routing",
    "Governed rollout and audit visibility",
  ],
  railTitle: "Built for real work",
  railItems: [
    {
      title: "Channels",
      detail: "Slack, WhatsApp, Telegram, Teams, email, voice, and webhooks.",
    },
    {
      title: "Runtime",
      detail: "Always-on agents with isolated sessions, memory, and routing rules.",
    },
    {
      title: "Tools",
      detail: "Browser, files, shell, GitHub, search, scheduling, and device nodes.",
    },
    {
      title: "Control",
      detail: "Approvals, allowlists, sandboxing, logs, and health checks.",
    },
  ],
  highlights: [
    {
      value: "24/7",
      label: "Persistent runtime for always-on agents",
    },
    {
      value: "Multi-channel",
      label: "Chat, inbox, voice, and webhook-driven activation",
    },
    {
      value: "Local-first",
      label: "Runs close to your data with optional managed reach",
    },
    {
      value: "Governed",
      label: "Approvals, allowlists, sandboxing, and runtime logs",
    },
  ],
} as const;

export const capabilityPillarsIntro = {
  kicker: "Capability pillars",
  title: "Everything your company needs to become AI-powered.",
  description:
    "Give every team the agents, tools, memory, and governance needed to adopt AI across the business with clarity and control.",
} as const;

export const capabilityPillars = [
  {
    title: "Autonomous execution",
    badge: "From intent to completion",
    description:
      "Agents can plan, sequence steps, use tools, adapt to outcomes, and keep progressing through multi-step work without waiting for constant human steering.",
    outcomes: [
      "Plan and complete multi-step workflows",
      "Adapt to errors and partial results",
      "Keep execution context alive across longer tasks",
    ],
  },
  {
    title: "Channels and communication",
    badge: "Built for real conversations",
    description:
      "Saint AGI operates through the surfaces people already use, from chat to voice to inbound events, while preserving routing rules and agent identity.",
    outcomes: [
      "Support DM and group workflows with routing controls",
      "Handle voice, typing, presence, and response behavior",
      "Pair the right agent to the right channel and context",
    ],
  },
  {
    title: "Tools and work surfaces",
    badge: "Acts across systems",
    description:
      "Execution spans browser automation, files, shell, GitHub, email, calendar, canvas, web research, scheduled jobs, and external triggers.",
    outcomes: [
      "Use browser and file actions to complete real tasks",
      "Trigger code, research, scheduling, and productivity flows",
      "Connect external events through cron and webhooks",
    ],
  },
  {
    title: "Memory and session design",
    badge: "Context that stays coherent",
    description:
      "Persistent sessions, pruning, compaction, activation modes, and persona isolation keep work organized without losing long-running context.",
    outcomes: [
      "Maintain isolated sessions and workspaces per agent",
      "Carry useful memory across time without uncontrolled drift",
      "Route tasks by mention, always-on, or queue behavior",
    ],
  },
  {
    title: "Model and agent orchestration",
    badge: "Best model for the job",
    description:
      "Saint AGI supports multiple models, multiple agents, and controlled routing so teams are not locked to one provider, one cost profile, or one persona.",
    outcomes: [
      "Switch between frontier, fast, open, and local models",
      "Coordinate multiple agents with isolated state",
      "Keep routing and policy centralized while execution stays flexible",
    ],
  },
  {
    title: "Governance and trust",
    badge: "Control before scale",
    description:
      "Approvals, allowlists, sandbox mode, audit trails, health checks, and usage visibility make autonomous execution safe enough to deploy across sensitive workflows.",
    outcomes: [
      "Apply approvals and guardrails at the runtime layer",
      "Monitor usage, health, and activity over time",
      "Limit risk with sandboxing and policy-driven controls",
    ],
  },
] as const;

export const operatingModelIntro = {
  kicker: "How it works",
  title: "One operating model for AI work across the company.",
  description:
    "Saint AGI makes adoption operational. Requests come in from employees and teams, the runtime routes the work, tools execute it, governance stays in control, and outcomes come back with continuity intact.",
} as const;

export const operatingModelSteps = [
  {
    step: "01",
    title: "Channels bring work in",
    description:
      "Messages, voice, webhooks, and external triggers activate the right agent inside the right session.",
  },
  {
    step: "02",
    title: "Runtime routes the task",
    description:
      "Agent identity, memory, activation mode, and model selection align around the task and the policy surface.",
  },
  {
    step: "03",
    title: "Tools execute the work",
    description:
      "Browser actions, files, shell, GitHub, search, and device-specific nodes push the task forward in real systems.",
  },
  {
    step: "04",
    title: "Governance keeps control",
    description:
      "Approvals, allowlists, sandboxing, and audit visibility stay attached to execution, not added after the fact.",
  },
  {
    step: "05",
    title: "Results return with continuity",
    description:
      "Users get the outcome back in-channel while sessions, history, and memory remain available for the next step.",
  },
] as const;

export const capabilityBandsIntro = {
  kicker: "Capability bands",
  title: "A complete AI operating surface for the whole company.",
  description:
    "Saint AGI turns broad agent capability into a platform your company can actually adopt, understand, and scale.",
} as const;

export const capabilityBands = [
  {
    title: "Execution",
    summary: "Planning, multi-step workflows, adaptation, and autonomous follow-through.",
    bullets: ["Task planning", "Workflow execution", "Error recovery", "Scheduled wakeups"],
  },
  {
    title: "Communication",
    summary: "Messaging platforms, DMs and groups, presence, reply logic, voice, and media handling.",
    bullets: ["Slack and Telegram", "WhatsApp and Teams", "Presence and typing", "Voice and media"],
  },
  {
    title: "Work surface",
    summary: "Browser, files, shell, GitHub, email, calendar, canvas, nodes, and web research.",
    bullets: ["Browser control", "Shell and files", "GitHub and docs", "Search and webhooks"],
  },
  {
    title: "Intelligence layer",
    summary: "Model routing, memory, multi-agent coordination, learning loops, and session compaction.",
    bullets: ["Provider flexibility", "Persistent memory", "Agent-to-agent coordination", "Learning over time"],
  },
  {
    title: "Trust layer",
    summary: "Sandbox mode, permission controls, allowlists, audit logging, and runtime monitoring.",
    bullets: ["Approvals", "Allowlists", "Audit trails", "Health checks"],
  },
  {
    title: "Deployment",
    summary: "Local devices, companion apps, Docker and Nix installs, managed gateways, and control UI access.",
    bullets: ["macOS, Linux, WSL2", "Mobile and companion nodes", "Optional cloud reach", "Control UI and CLI"],
  },
] as const;

export const differentiatorsIntro = {
  kicker: "Why Saint AGI",
  title: "Built for companies that want AI adoption without losing control.",
  description:
    "Saint AGI is designed to help companies put AI to work across teams in a way that stays legible, governable, and ready to scale.",
} as const;

export const capabilityComparisonIntro = {
  kicker: "Action over chat",
  title: "Why Saint AGI feels different from chat-first AI tools.",
  description:
    "The interface matters less than whether a company can actually deploy AI across teams. Saint AGI is built for systems that stay live, act across tools, and remain legible to the people responsible for outcomes.",
} as const;

export const capabilityComparison = [
  {
    title: "Chat-first assistants",
    points: [
      "Wait for prompts instead of driving work forward",
      "Live inside one interface instead of real operating channels",
      "Depend on manual copy-paste between tools",
      "Offer limited governance once automation expands",
    ],
  },
  {
    title: "Saint AGI agents",
    points: [
      "Plan, act, route, and follow through across real workflows",
      "Operate through chat, voice, inbox, webhooks, and runtime triggers",
      "Use tools directly, from browser actions to GitHub and shell",
      "Keep approvals, logs, and controls attached to execution",
    ],
  },
] as const;

export const differentiators = [
  {
    title: "Not another chat window",
    description:
      "The value comes from helping employees get work done inside real systems, not from adding another prompt interface for the company to manage.",
  },
  {
    title: "Not locked to one model",
    description:
      "Your company can route across reasoning-heavy, fast, open, and local models without rewriting the surrounding product and governance layer.",
  },
  {
    title: "Not cloud-only by design",
    description:
      "Local-first execution keeps data, credentials, and runtime control closer to your company while preserving optional always-on reach.",
  },
  {
    title: "Not opaque automation",
    description:
      "Approvals, logs, policies, and health checks make rollout explainable enough to trust as adoption expands.",
  },
] as const;
