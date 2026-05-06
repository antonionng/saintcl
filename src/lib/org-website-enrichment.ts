import { insertKnowledgeDoc } from "@/lib/dal";
import { estimateKnowledgeChunkCount } from "@/lib/knowledge";
import { syncKnowledgeToRelevantAgents } from "@/lib/openclaw/knowledge-sync";
import { recordSetupAuditEvent, recordFunnelStep } from "@/lib/setup-audit";
import { createAdminClient } from "@/lib/supabase/admin";

export type EnrichOrgWebsiteResult =
  | {
      enriched: true;
      website: string;
      companySummary: string;
      agentBrief: string;
      knowledgeProfile: string;
      profileFieldsWritten: { companySummary: boolean; agentBrief: boolean };
    }
  | {
      enriched: false;
      reason:
        | "admin_unavailable"
        | "invalid_url"
        | "fetch_failed"
        | "summarization_failed"
        | "already_enriched";
      website?: string;
    };

function normalizeUrl(raw: string): string {
  let url = raw.trim().toLowerCase();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return url.replace(/\/+$/, "");
  }
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SaintAGI-Enrichment/1.0" },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;
    const html = await res.text();
    return stripHtmlToText(html);
  } catch {
    return null;
  }
}

function stripHtmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#?\w+;/g, " ");

  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return text.slice(0, 30_000);
}

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function clampChars(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1).trim()}...`;
}

export type StructuredSummary = {
  companySummary: string;
  agentBrief: string;
  knowledgeMarkdown: string;
};

function buildSummaryPrompt(homepageText: string, aboutText: string | null, website: string): string {
  const sections = [`Homepage of ${website}:\n${homepageText}`];
  if (aboutText) {
    sections.push(`About page:\n${aboutText}`);
  }
  return [
    "You are a company research assistant. Read the website content below and produce a strictly factual company profile.",
    "Return a single JSON object with exactly these keys:",
    '  - "companySummary": 2 to 4 plain prose sentences (about 200 to 600 characters) describing what the company does, who it serves, and the products or services it offers. Editable by an admin and shown in workspace settings.',
    '  - "agentBrief": 1 to 2 short sentences (about 80 to 280 characters) telling an internal AI agent how to talk about and act on behalf of this company. Practical voice, not marketing.',
    '  - "knowledgeMarkdown": a longer markdown profile (300 to 700 words) with sections covering what the company does, products and services, target audience, industry, and any notable facts. Use third person. Do not invent information.',
    "Use only facts grounded in the source text. If the source is sparse, write shorter content rather than speculating.",
    "Do not include the JSON keys inside the values. Do not wrap the response in code fences.",
    "",
    sections.join("\n\n---\n\n"),
  ].join("\n");
}

export function parseStructuredSummary(raw: string | null): StructuredSummary | null {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const companySummary = typeof parsed.companySummary === "string" ? parsed.companySummary.trim() : "";
    const agentBrief = typeof parsed.agentBrief === "string" ? parsed.agentBrief.trim() : "";
    const knowledgeMarkdown = typeof parsed.knowledgeMarkdown === "string" ? parsed.knowledgeMarkdown.trim() : "";
    if (!companySummary || !knowledgeMarkdown) return null;
    return {
      companySummary: clampChars(companySummary, 1800),
      agentBrief: clampChars(agentBrief || companySummary, 400),
      knowledgeMarkdown,
    };
  } catch {
    return null;
  }
}

async function summarizeWithLlm(prompt: string): Promise<StructuredSummary | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://saintagi.ai",
        "X-Title": "SaintAGI Enrichment",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    return parseStructuredSummary(typeof content === "string" ? content : null);
  } catch {
    return null;
  }
}

/**
 * Extract a deterministic fallback summary from raw homepage text when the LLM
 * is unavailable. Used so onboarding never leaves the user staring at empty
 * fields. The fallback is intentionally conservative and clearly editable.
 */
export function buildFallbackSummary(
  homepageText: string,
  website: string,
): StructuredSummary | null {
  const text = homepageText.replace(/\s+/g, " ").trim();
  if (text.length < 80) return null;
  const summary = clampChars(text, 480);
  const agentBrief = clampChars(text, 220);
  const knowledgeMarkdown = `# Company Profile (extracted from ${website})\n\n${clampWords(text, 600)}`;
  return { companySummary: summary, agentBrief, knowledgeMarkdown };
}

export async function enrichOrgWebsite(input: {
  orgId: string;
  website: string;
  createdBy?: string | null;
}): Promise<EnrichOrgWebsiteResult> {
  const admin = createAdminClient();
  if (!admin) return { enriched: false, reason: "admin_unavailable" };

  const normalized = normalizeUrl(input.website);
  if (!normalized || normalized.length < 8) {
    return { enriched: false, reason: "invalid_url" };
  }

  const { data: org } = await admin
    .from("orgs")
    .select("website_enriched_url, website_enriched_at, company_summary, agent_brief")
    .eq("id", input.orgId)
    .single();

  if (org?.website_enriched_url === normalized) {
    return { enriched: false, reason: "already_enriched", website: normalized };
  }

  const homepageText = await fetchPageText(normalized);
  if (!homepageText || homepageText.length < 50) {
    return { enriched: false, reason: "fetch_failed", website: normalized };
  }

  const aboutUrl = new URL(normalized);
  aboutUrl.pathname = "/about";
  const aboutText = await fetchPageText(aboutUrl.toString());

  const prompt = buildSummaryPrompt(homepageText, aboutText, normalized);
  const summary = (await summarizeWithLlm(prompt)) ?? buildFallbackSummary(homepageText, normalized);
  if (!summary) {
    return { enriched: false, reason: "summarization_failed", website: normalized };
  }

  const filename = "website-profile.md";
  const storagePath = `${input.orgId}/enrichment/${filename}`;
  const knowledgeBody = summary.knowledgeMarkdown.trim();
  const contentText = knowledgeBody.startsWith("#")
    ? knowledgeBody
    : `# Company Profile (auto-enriched from ${normalized})\n\n${knowledgeBody}`;
  const chunkCount = estimateKnowledgeChunkCount(contentText);

  await insertKnowledgeDoc({
    orgId: input.orgId,
    scopeType: "org",
    filename,
    mimeType: "text/markdown",
    storagePath,
    contentText,
    chunkCount,
    createdBy: input.createdBy ?? null,
  });

  const profileUpdates: Record<string, unknown> = {
    website_enriched_url: normalized,
    website_enriched_at: new Date().toISOString(),
  };

  const existingSummary = (org?.company_summary ?? "").trim();
  const existingBrief = (org?.agent_brief ?? "").trim();
  const writeSummary = !existingSummary && summary.companySummary.length > 0;
  const writeBrief = !existingBrief && summary.agentBrief.length > 0;
  if (writeSummary) profileUpdates.company_summary = summary.companySummary;
  if (writeBrief) profileUpdates.agent_brief = summary.agentBrief;

  await admin.from("orgs").update(profileUpdates).eq("id", input.orgId);

  await syncKnowledgeToRelevantAgents({
    orgId: input.orgId,
    scopeType: "org",
  }).catch(() => null);

  recordSetupAuditEvent({
    orgId: input.orgId,
    userId: input.createdBy,
    eventType: "enrichment.completed",
    category: "enrichment",
    metadata: {
      url: normalized,
      profileFieldsWritten: { companySummary: writeSummary, agentBrief: writeBrief },
    },
  }).catch(() => null);

  recordFunnelStep({
    orgId: input.orgId,
    step: "enrichment_completed",
    metadata: { url: normalized },
  }).catch(() => null);

  return {
    enriched: true,
    website: normalized,
    companySummary: writeSummary ? summary.companySummary : existingSummary,
    agentBrief: writeBrief ? summary.agentBrief : existingBrief,
    knowledgeProfile: contentText,
    profileFieldsWritten: { companySummary: writeSummary, agentBrief: writeBrief },
  };
}
