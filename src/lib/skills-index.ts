export type TrustTier = "official" | "curated" | "community";

export interface SkillIndexEntry {
  slug: string;
  name: string;
  description: string;
  source: "clawhub" | "github";
  trustTier: TrustTier;
  repoUrl?: string;
  clawHubUrl?: string;
  version?: string;
  category?: string;
  requires?: {
    bins?: string[];
    envKeys?: string[];
  };
  tags?: string[];
  author?: string;
}

const SKILL_LIBRARY: SkillIndexEntry[] = [
  // --- Official bundled skills ---
  {
    slug: "web-search",
    name: "Web Search",
    description: "Real-time web search with multiple provider support. Enables agents to find up-to-date information from the internet.",
    source: "clawhub",
    trustTier: "official",
    category: "Search & Research",
    tags: ["search", "web", "research"],
    requires: { envKeys: ["OPENCLAW_SEARCH_API_KEY"] },
    author: "openclaw",
  },
  {
    slug: "computer",
    name: "Computer Use",
    description: "Screen control and browser automation for desktop tasks. Take screenshots, click, type, scroll, and navigate apps.",
    source: "clawhub",
    trustTier: "official",
    category: "Browser & Automation",
    tags: ["automation", "desktop", "browser", "screenshots"],
    author: "openclaw",
  },
  {
    slug: "memory",
    name: "Memory",
    description: "Persistent memory across sessions with vector-backed recall. Agents remember user preferences, past conversations, and key facts.",
    source: "clawhub",
    trustTier: "official",
    category: "Productivity & Tasks",
    tags: ["memory", "context", "persistence"],
    author: "openclaw",
  },
  {
    slug: "file-edit",
    name: "File Editor",
    description: "Read, write, and patch files in the agent workspace. Create new files, make targeted edits, and manage project files.",
    source: "clawhub",
    trustTier: "official",
    category: "Coding Agents & IDEs",
    tags: ["files", "editor", "workspace"],
    author: "openclaw",
  },
  {
    slug: "code-exec",
    name: "Code Execution",
    description: "Run code in a sandboxed environment with output capture. Supports Python, JavaScript, bash, and more.",
    source: "clawhub",
    trustTier: "official",
    category: "Coding Agents & IDEs",
    tags: ["code", "sandbox", "execution", "python"],
    author: "openclaw",
  },

  // --- Curated from ClawHub registry (real popular skills) ---
  {
    slug: "slack",
    name: "Slack Integration",
    description: "Send messages, search channels, manage threads, and interact with Slack workspaces. Full read/write access to team communications.",
    source: "clawhub",
    trustTier: "curated",
    category: "Communication",
    clawHubUrl: "https://clawhub.ai/steipete/slack",
    tags: ["slack", "messaging", "team", "communication"],
    requires: { envKeys: ["SLACK_BOT_TOKEN"] },
    author: "steipete",
  },
  {
    slug: "github",
    name: "GitHub",
    description: "Interact with GitHub repositories, issues, pull requests, and CI/CD pipelines using the gh CLI. Manage code reviews, create branches, and automate workflows.",
    source: "clawhub",
    trustTier: "curated",
    category: "Git & GitHub",
    clawHubUrl: "https://clawhub.ai/openclaw/github",
    tags: ["github", "git", "pr", "issues", "code-review"],
    requires: { bins: ["gh"] },
    author: "openclaw",
  },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Create, read, update, and delete calendar events. Check availability, schedule meetings, and manage recurring events.",
    source: "clawhub",
    trustTier: "curated",
    category: "Calendar & Scheduling",
    clawHubUrl: "https://clawhub.ai/google-calendar",
    tags: ["calendar", "scheduling", "google", "meetings"],
    requires: { envKeys: ["GOOGLE_CALENDAR_API_KEY"] },
    author: "openclaw-community",
  },
  {
    slug: "email-drafter",
    name: "Email Drafter",
    description: "Compose, review, and refine email drafts with tone and style matching. Supports Gmail and Outlook integration.",
    source: "clawhub",
    trustTier: "curated",
    category: "Communication",
    clawHubUrl: "https://clawhub.ai/email-drafter",
    tags: ["email", "drafts", "communication", "gmail"],
    author: "openclaw-community",
  },
  {
    slug: "1password",
    name: "1Password",
    description: "Set up and use 1Password CLI (op). Use when installing the CLI, enabling desktop app integration, signing in (single or multi-account).",
    source: "clawhub",
    trustTier: "curated",
    category: "Security & Passwords",
    clawHubUrl: "https://clawhub.ai/1password",
    tags: ["security", "passwords", "credentials", "vault"],
    requires: { bins: ["op"] },
    author: "openclaw",
  },
  {
    slug: "puppeteer",
    name: "Puppeteer Browser",
    description: "Headless browser automation with Puppeteer. Navigate pages, fill forms, take screenshots, generate PDFs, and scrape structured data.",
    source: "clawhub",
    trustTier: "curated",
    category: "Browser & Automation",
    clawHubUrl: "https://clawhub.ai/puppeteer",
    tags: ["browser", "automation", "scraping", "puppeteer"],
    requires: { bins: ["npx"] },
    author: "openclaw-community",
  },
  {
    slug: "notion",
    name: "Notion",
    description: "Read, create, and update Notion pages and databases. Search across workspaces, manage tasks, and sync content.",
    source: "clawhub",
    trustTier: "curated",
    category: "Notes & PKM",
    clawHubUrl: "https://clawhub.ai/notion",
    tags: ["notion", "notes", "wiki", "databases"],
    requires: { envKeys: ["NOTION_API_KEY"] },
    author: "openclaw-community",
  },
  {
    slug: "linear",
    name: "Linear",
    description: "Create and manage Linear issues, projects, and cycles. Track team progress, triage bugs, and plan sprints.",
    source: "clawhub",
    trustTier: "curated",
    category: "Productivity & Tasks",
    clawHubUrl: "https://clawhub.ai/linear",
    tags: ["linear", "issues", "project-management", "sprints"],
    requires: { envKeys: ["LINEAR_API_KEY"] },
    author: "openclaw-community",
  },
  {
    slug: "docker",
    name: "Docker",
    description: "Manage Docker containers, images, and compose stacks. Build, run, stop, and inspect containers directly from your agent.",
    source: "clawhub",
    trustTier: "curated",
    category: "DevOps & Cloud",
    clawHubUrl: "https://clawhub.ai/docker",
    tags: ["docker", "containers", "devops", "deployment"],
    requires: { bins: ["docker"] },
    author: "openclaw-community",
  },

  // --- GitHub community skills ---
  {
    slug: "github/data-analysis",
    name: "Data Analysis",
    description: "CSV/Excel parsing, aggregation, pivot tables, and chart generation. Turn raw data into insights with natural language queries.",
    source: "github",
    trustTier: "curated",
    category: "Data & Analytics",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/data-analysis",
    tags: ["data", "csv", "charts", "analysis", "excel"],
    requires: { bins: ["python3"] },
    author: "openclaw-community",
  },
  {
    slug: "github/image-gen",
    name: "Image Generation",
    description: "Generate images using DALL-E, Stable Diffusion, or Flux. Create illustrations, diagrams, mockups, and creative assets from text prompts.",
    source: "github",
    trustTier: "curated",
    category: "Image & Video Generation",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/image-gen",
    tags: ["image", "generation", "creative", "dall-e"],
    requires: { envKeys: ["IMAGE_GEN_API_KEY"] },
    author: "openclaw-community",
  },
  {
    slug: "github/pdf-reader",
    name: "PDF Reader",
    description: "Extract text and structured data from PDF documents. Parse tables, forms, and multi-page reports into usable formats.",
    source: "github",
    trustTier: "curated",
    category: "PDF & Documents",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/pdf-reader",
    tags: ["pdf", "documents", "extraction", "parsing"],
    author: "openclaw-community",
  },
  {
    slug: "github/crm-sync",
    name: "CRM Sync",
    description: "Bidirectional sync with Salesforce, HubSpot, or Pipedrive. Read contacts, update deals, log activities, and query CRM data.",
    source: "github",
    trustTier: "curated",
    category: "Marketing & Sales",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/crm-sync",
    tags: ["crm", "salesforce", "hubspot", "sync"],
    requires: { envKeys: ["CRM_API_KEY"] },
    author: "openclaw-community",
  },
  {
    slug: "github/biz-reporter",
    name: "Business Reporter",
    description: "Automated business intelligence reports pulling data from Google Analytics GA4, Google Search Console, and Stripe.",
    source: "github",
    trustTier: "community",
    category: "Marketing & Sales",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/ariktulcha/biz-reporter",
    tags: ["analytics", "reporting", "ga4", "stripe"],
    requires: { envKeys: ["GA4_API_KEY", "STRIPE_API_KEY"] },
    author: "ariktulcha",
  },
  {
    slug: "github/azure-devops",
    name: "Azure DevOps",
    description: "List Azure DevOps projects, repositories, and branches. Create pull requests, manage work items, and check build status.",
    source: "github",
    trustTier: "community",
    category: "DevOps & Cloud",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/pals-software/azure-devops",
    tags: ["azure", "devops", "ci-cd", "microsoft"],
    requires: { envKeys: ["AZURE_DEVOPS_TOKEN"] },
    author: "pals-software",
  },
  {
    slug: "github/research-cog",
    name: "Deep Research",
    description: "Conduct deep research on any topic by systematically searching, reading, and synthesizing information from multiple sources.",
    source: "github",
    trustTier: "community",
    category: "Search & Research",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/nitishgargiitd/research-cog",
    tags: ["research", "synthesis", "academic", "deep-dive"],
    author: "nitishgargiitd",
  },
  {
    slug: "github/slides-cog",
    name: "Slide Deck Generator",
    description: "Generate professional presentation slides from text or research output. Supports multiple formats and themes.",
    source: "github",
    trustTier: "community",
    category: "Productivity & Tasks",
    repoUrl: "https://github.com/openclaw/skills/tree/main/skills/nitishgargiitd/slides-cog",
    tags: ["slides", "presentations", "powerpoint"],
    author: "nitishgargiitd",
  },
];

const CATEGORIES = [
  "Search & Research",
  "Browser & Automation",
  "Communication",
  "Git & GitHub",
  "Coding Agents & IDEs",
  "Calendar & Scheduling",
  "Productivity & Tasks",
  "Security & Passwords",
  "Notes & PKM",
  "DevOps & Cloud",
  "Data & Analytics",
  "Image & Video Generation",
  "PDF & Documents",
  "Marketing & Sales",
] as const;

export type SkillCategory = (typeof CATEGORIES)[number];

export { CATEGORIES as SKILL_CATEGORIES };

let cachedIndex: SkillIndexEntry[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchSkillIndex(): Promise<SkillIndexEntry[]> {
  const now = Date.now();
  if (cachedIndex && now - cachedAt < CACHE_TTL_MS) {
    return cachedIndex;
  }

  cachedIndex = SKILL_LIBRARY;
  cachedAt = now;
  return cachedIndex;
}

export function filterSkillIndex(
  index: SkillIndexEntry[],
  opts: { search?: string; trustTier?: TrustTier; source?: string; tag?: string; category?: string },
): SkillIndexEntry[] {
  let filtered = index;

  if (opts.trustTier) {
    filtered = filtered.filter((s) => s.trustTier === opts.trustTier);
  }
  if (opts.source) {
    filtered = filtered.filter((s) => s.source === opts.source);
  }
  if (opts.category) {
    filtered = filtered.filter((s) => s.category === opts.category);
  }
  if (opts.tag) {
    filtered = filtered.filter((s) => s.tags?.includes(opts.tag!));
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.includes(q)) ||
        s.category?.toLowerCase().includes(q),
    );
  }

  return filtered;
}
