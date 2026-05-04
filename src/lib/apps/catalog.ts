export type AppCategory =
  | "channel"
  | "skill"
  | "search"
  | "memory"
  | "tool"
  | "mcp";

export type AppInstallType = "click" | "paste-token" | "oauth-soon";

export type AppInstallerType =
  | "openclaw-skill"
  | "channel-token"
  | "mcp-stub"
  | "config-toggle";

export type CatalogApp = {
  id: string;
  name: string;
  category: AppCategory;
  vendor: string;
  logo?: string;
  oneLiner: string;
  description?: string;
  install: AppInstallType;
  installer?: AppInstallerType;
  openclawId?: string;
  skillSlug?: string;
  channelType?: string;
  requiresEnv?: string[];
  tags?: string[];
};

export const CATEGORY_LABELS: Record<AppCategory, string> = {
  channel: "Channels",
  skill: "Skills",
  search: "Search",
  memory: "Memory",
  tool: "Tools",
  mcp: "MCP",
};

export const SORTED_APP_CATEGORIES: AppCategory[] = ["channel", "mcp", "memory", "search", "skill", "tool"];

const SIMPLE_ICON = (slug: string, color = "ffffff") =>
  `https://cdn.simpleicons.org/${slug}/${color}`;
const FAVICON = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const CATALOG: CatalogApp[] = [
  // --- Search providers ---
  {
    id: "brave-search",
    name: "Brave Search",
    category: "search",
    vendor: "Brave",
    logo: SIMPLE_ICON("brave", "FB542B"),
    oneLiner: "Independent web search index. No tracking.",
    description:
      "Real-time web search powered by Brave's independent index. Great for general research and current events.",
    install: "click",
    installer: "config-toggle",
    openclawId: "brave",
    tags: ["search", "research"],
  },
  {
    id: "duckduckgo-search",
    name: "DuckDuckGo",
    category: "search",
    vendor: "DuckDuckGo",
    logo: SIMPLE_ICON("duckduckgo", "DE5833"),
    oneLiner: "Privacy-first web search. Click to enable.",
    description:
      "Privacy-respecting search engine that works out of the box without any API keys.",
    install: "click",
    installer: "config-toggle",
    openclawId: "duckduckgo",
    tags: ["search", "privacy"],
  },
  {
    id: "tavily-search",
    name: "Tavily",
    category: "search",
    vendor: "Tavily",
    logo: FAVICON("tavily.com"),
    oneLiner: "Search API tuned for AI agents.",
    description:
      "AI-native search that returns clean, structured results designed for retrieval-augmented generation.",
    install: "click",
    installer: "config-toggle",
    openclawId: "tavily",
    requiresEnv: ["TAVILY_API_KEY"],
    tags: ["search", "ai"],
  },
  {
    id: "exa-search",
    name: "Exa",
    category: "search",
    vendor: "Exa Labs",
    logo: FAVICON("exa.ai"),
    oneLiner: "Neural search that understands intent.",
    description: "Semantic search that finds high-quality pages by meaning, not just keywords.",
    install: "click",
    installer: "config-toggle",
    openclawId: "exa",
    requiresEnv: ["EXA_API_KEY"],
    tags: ["search", "neural"],
  },
  {
    id: "firecrawl-search",
    name: "Firecrawl",
    category: "search",
    vendor: "Firecrawl",
    logo: FAVICON("firecrawl.dev"),
    oneLiner: "Crawl and scrape any website.",
    description:
      "Turn websites into clean, structured data. Useful for documentation, knowledge bases, and competitive research.",
    install: "click",
    installer: "config-toggle",
    openclawId: "firecrawl",
    requiresEnv: ["FIRECRAWL_API_KEY"],
    tags: ["search", "scraping"],
  },
  {
    id: "perplexity-search",
    name: "Perplexity",
    category: "search",
    vendor: "Perplexity",
    logo: SIMPLE_ICON("perplexity", "20808D"),
    oneLiner: "AI answers with cited sources.",
    description: "Search with synthesized answers and citations from across the web.",
    install: "click",
    installer: "config-toggle",
    openclawId: "perplexity",
    requiresEnv: ["PERPLEXITY_API_KEY"],
    tags: ["search", "ai"],
  },

  // --- Memory ---
  {
    id: "memory-core",
    name: "Memory",
    category: "memory",
    vendor: "Saint AGI",
    oneLiner: "Persistent memory across conversations.",
    description:
      "Your agent remembers user preferences, past conversations, and key facts across sessions.",
    install: "click",
    installer: "config-toggle",
    openclawId: "memory-core",
    tags: ["memory", "context"],
  },
  {
    id: "memory-lancedb",
    name: "Vector Memory",
    category: "memory",
    vendor: "Saint AGI",
    oneLiner: "Vector-backed long-term memory.",
    description:
      "Local vector store for high-volume embeddings. Pairs with knowledge bases for semantic recall.",
    install: "click",
    installer: "config-toggle",
    openclawId: "memory-lancedb",
    tags: ["memory", "vector"],
  },

  // --- Tools ---
  {
    id: "browser-tool",
    name: "Browser",
    category: "tool",
    vendor: "Saint AGI",
    oneLiner: "Headless browser for live web pages.",
    description:
      "Lets your agent open URLs, take screenshots, click buttons, and read full pages in real time.",
    install: "click",
    installer: "config-toggle",
    openclawId: "browser",
    tags: ["browser", "automation"],
  },
  {
    id: "diffs-tool",
    name: "Diffs",
    category: "tool",
    vendor: "Saint AGI",
    oneLiner: "File diffs and patch operations.",
    description: "Compare files, generate patches, and apply targeted edits inside the agent workspace.",
    install: "click",
    installer: "config-toggle",
    openclawId: "diffs",
    tags: ["files", "code"],
  },
  {
    id: "diagnostics-otel",
    name: "Telemetry",
    category: "tool",
    vendor: "Saint AGI",
    oneLiner: "OpenTelemetry trace export.",
    description: "Send agent traces to your OpenTelemetry collector for production observability.",
    install: "click",
    installer: "config-toggle",
    openclawId: "diagnostics-otel",
    tags: ["observability", "tracing"],
  },

  // --- Skills (click-installable from skills index) ---
  {
    id: "skill-web-search",
    name: "Web Search Skill",
    category: "skill",
    vendor: "Saint AGI",
    oneLiner: "Multi-provider web search skill.",
    description: "Agent skill that wraps multiple search providers for resilient research.",
    install: "click",
    installer: "openclaw-skill",
    skillSlug: "web-search",
    tags: ["search", "research"],
  },
  {
    id: "skill-file-edit",
    name: "File Editor Skill",
    category: "skill",
    vendor: "Saint AGI",
    oneLiner: "Read, write, and patch files.",
    description: "Adds file editing capability to the agent workspace.",
    install: "click",
    installer: "openclaw-skill",
    skillSlug: "file-edit",
    tags: ["files", "editor"],
  },
  {
    id: "skill-code-exec",
    name: "Code Execution Skill",
    category: "skill",
    vendor: "Saint AGI",
    oneLiner: "Sandboxed code execution.",
    description: "Run Python, JavaScript, and bash in a sandboxed environment with output capture.",
    install: "click",
    installer: "openclaw-skill",
    skillSlug: "code-exec",
    tags: ["code", "sandbox"],
  },
  {
    id: "skill-pdf-reader",
    name: "PDF Reader Skill",
    category: "skill",
    vendor: "Saint AGI Community",
    oneLiner: "Extract text from PDF documents.",
    description: "Parse tables, forms, and multi-page reports into usable text.",
    install: "click",
    installer: "openclaw-skill",
    skillSlug: "github/pdf-reader",
    tags: ["pdf", "documents"],
  },
  {
    id: "skill-data-analysis",
    name: "Data Analysis Skill",
    category: "skill",
    vendor: "Saint AGI Community",
    oneLiner: "CSV and Excel parsing with pivots.",
    description: "Turn raw spreadsheets into insights with natural language queries.",
    install: "click",
    installer: "openclaw-skill",
    skillSlug: "github/data-analysis",
    tags: ["data", "csv"],
  },
  {
    id: "skill-slides",
    name: "Slide Deck Generator",
    category: "skill",
    vendor: "Community",
    oneLiner: "Generate presentations from text.",
    description: "Produce professional slides from text or research output.",
    install: "click",
    installer: "openclaw-skill",
    skillSlug: "github/slides-cog",
    tags: ["slides", "presentations"],
  },
  {
    id: "skill-research",
    name: "Deep Research Skill",
    category: "skill",
    vendor: "Community",
    oneLiner: "Systematic multi-source research.",
    description:
      "Conduct deep research on any topic by searching, reading, and synthesizing across many sources.",
    install: "click",
    installer: "openclaw-skill",
    skillSlug: "github/research-cog",
    tags: ["research", "synthesis"],
  },

  // --- Channels (existing paste-token flow) ---
  {
    id: "telegram-channel",
    name: "Telegram",
    category: "channel",
    vendor: "Telegram",
    logo: SIMPLE_ICON("telegram", "26A5E4"),
    oneLiner: "Reply to chats from a Telegram bot.",
    description:
      "Connect a Telegram bot so your agent can read and reply to chats, groups, and DMs.",
    install: "paste-token",
    installer: "channel-token",
    channelType: "telegram",
    tags: ["chat", "messaging"],
  },
  {
    id: "slack-channel",
    name: "Slack",
    category: "channel",
    vendor: "Slack",
    logo: SIMPLE_ICON("slack", "4A154B"),
    oneLiner: "Talk to your agent inside Slack.",
    description:
      "Drop your agent into Slack channels or DMs. Uses Socket Mode or the Events API.",
    install: "paste-token",
    installer: "channel-token",
    channelType: "slack",
    tags: ["chat", "messaging", "team"],
  },

  // --- Channels (placeholder, oauth-soon) ---
  {
    id: "discord-channel",
    name: "Discord",
    category: "channel",
    vendor: "Discord",
    logo: SIMPLE_ICON("discord", "5865F2"),
    oneLiner: "Connect to Discord servers.",
    install: "oauth-soon",
    tags: ["chat", "community"],
  },
  {
    id: "whatsapp-channel",
    name: "WhatsApp",
    category: "channel",
    vendor: "Meta",
    logo: SIMPLE_ICON("whatsapp", "25D366"),
    oneLiner: "Reply to WhatsApp messages.",
    install: "oauth-soon",
    tags: ["chat", "messaging"],
  },
  {
    id: "msteams-channel",
    name: "Microsoft Teams",
    category: "channel",
    vendor: "Microsoft",
    logo: SIMPLE_ICON("microsoftteams", "6264A7"),
    oneLiner: "Bring your agent into Teams chats.",
    install: "oauth-soon",
    tags: ["chat", "team"],
  },
  {
    id: "google-chat-channel",
    name: "Google Chat",
    category: "channel",
    vendor: "Google",
    logo: SIMPLE_ICON("googlechat", "00AC47"),
    oneLiner: "Reply inside Google Workspace.",
    install: "oauth-soon",
    tags: ["chat", "team"],
  },
  {
    id: "line-channel",
    name: "LINE",
    category: "channel",
    vendor: "LINE",
    logo: SIMPLE_ICON("line", "00C300"),
    oneLiner: "Chat with users on LINE.",
    install: "oauth-soon",
    tags: ["chat", "messaging"],
  },
  {
    id: "matrix-channel",
    name: "Matrix",
    category: "channel",
    vendor: "Matrix.org",
    logo: SIMPLE_ICON("matrix", "ffffff"),
    oneLiner: "Federated chat over Matrix.",
    install: "oauth-soon",
    tags: ["chat", "open"],
  },
  {
    id: "signal-channel",
    name: "Signal",
    category: "channel",
    vendor: "Signal",
    logo: SIMPLE_ICON("signal", "3A76F0"),
    oneLiner: "Private messaging via Signal.",
    install: "oauth-soon",
    tags: ["chat", "privacy"],
  },
  {
    id: "mattermost-channel",
    name: "Mattermost",
    category: "channel",
    vendor: "Mattermost",
    logo: SIMPLE_ICON("mattermost", "0058CC"),
    oneLiner: "Self-hosted team chat.",
    install: "oauth-soon",
    tags: ["chat", "team"],
  },

  // --- MCP placeholders ---
  {
    id: "mcp-filesystem",
    name: "Filesystem MCP",
    category: "mcp",
    vendor: "Anthropic",
    logo: SIMPLE_ICON("anthropic", "D97757"),
    oneLiner: "Read and write workspace files via MCP.",
    description: "Standard Model Context Protocol filesystem server. Click to register a stub config.",
    install: "click",
    installer: "mcp-stub",
    tags: ["mcp", "files"],
  },
  {
    id: "mcp-github",
    name: "GitHub MCP",
    category: "mcp",
    vendor: "Anthropic",
    logo: SIMPLE_ICON("github", "ffffff"),
    oneLiner: "Browse repos and issues via MCP.",
    install: "click",
    installer: "mcp-stub",
    tags: ["mcp", "git"],
  },
];

export function getApp(id: string): CatalogApp | undefined {
  return CATALOG.find((app) => app.id === id);
}

export function sortCatalogApps(apps: CatalogApp[]): CatalogApp[] {
  const categoryRank = new Map(SORTED_APP_CATEGORIES.map((category, index) => [category, index]));

  return [...apps].sort((a, b) => {
    const categoryDelta =
      (categoryRank.get(a.category) ?? Number.MAX_SAFE_INTEGER) -
      (categoryRank.get(b.category) ?? Number.MAX_SAFE_INTEGER);
    if (categoryDelta !== 0) return categoryDelta;

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function filterCatalog(opts: { category?: AppCategory | "all"; search?: string }): CatalogApp[] {
  let items = CATALOG;
  if (opts.category && opts.category !== "all") {
    items = items.filter((app) => app.category === opts.category);
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    items = items.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.oneLiner.toLowerCase().includes(q) ||
        app.vendor.toLowerCase().includes(q) ||
        app.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }
  return sortCatalogApps(items);
}
