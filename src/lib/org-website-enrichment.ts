import { insertKnowledgeDoc } from "@/lib/dal";
import { estimateKnowledgeChunkCount } from "@/lib/knowledge";
import { syncKnowledgeToRelevantAgents } from "@/lib/openclaw/knowledge-sync";
import { recordSetupAuditEvent, recordFunnelStep } from "@/lib/setup-audit";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeUrl(raw: string): string {
  let url = raw.trim().toLowerCase();
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
      headers: { "User-Agent": "SaintClaw-Enrichment/1.0" },
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

function buildSummaryPrompt(homepageText: string, aboutText: string | null, website: string): string {
  const sections = [`Homepage of ${website}:\n${homepageText}`];
  if (aboutText) {
    sections.push(`About page:\n${aboutText}`);
  }
  return `You are a company research assistant. Given the following website content, write a factual company profile summary (300-600 words). Cover: what the company does, products/services, target audience, industry, and any notable facts. Write in third person. Do not speculate or add information not present in the source text.\n\n${sections.join("\n\n---\n\n")}`;
}

async function summarizeWithLlm(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://saintclaw.ai",
        "X-Title": "SaintClaw Enrichment",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function enrichOrgWebsite(input: {
  orgId: string;
  website: string;
  createdBy?: string | null;
}): Promise<{ enriched: boolean; reason?: string }> {
  const admin = createAdminClient();
  if (!admin) return { enriched: false, reason: "admin_unavailable" };

  const normalized = normalizeUrl(input.website);
  if (!normalized || normalized.length < 8) {
    return { enriched: false, reason: "invalid_url" };
  }

  const { data: org } = await admin
    .from("orgs")
    .select("website_enriched_url, website_enriched_at")
    .eq("id", input.orgId)
    .single();

  if (org?.website_enriched_url === normalized) {
    return { enriched: false, reason: "already_enriched" };
  }

  const homepageText = await fetchPageText(normalized);
  if (!homepageText || homepageText.length < 50) {
    return { enriched: false, reason: "fetch_failed" };
  }

  const aboutUrl = new URL(normalized);
  aboutUrl.pathname = "/about";
  const aboutText = await fetchPageText(aboutUrl.toString());

  const prompt = buildSummaryPrompt(homepageText, aboutText, normalized);
  const summary = await summarizeWithLlm(prompt);
  if (!summary) {
    return { enriched: false, reason: "summarization_failed" };
  }

  const filename = `website-profile.md`;
  const storagePath = `${input.orgId}/enrichment/${filename}`;
  const contentText = `# Company Profile (auto-enriched from ${normalized})\n\n${summary}`;
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

  await admin
    .from("orgs")
    .update({
      website_enriched_url: normalized,
      website_enriched_at: new Date().toISOString(),
    })
    .eq("id", input.orgId);

  await syncKnowledgeToRelevantAgents({
    orgId: input.orgId,
    scopeType: "org",
  }).catch(() => null);

  recordSetupAuditEvent({
    orgId: input.orgId,
    userId: input.createdBy,
    eventType: "enrichment.completed",
    category: "enrichment",
    metadata: { url: normalized },
  }).catch(() => null);

  recordFunnelStep({
    orgId: input.orgId,
    step: "enrichment_completed",
    metadata: { url: normalized },
  }).catch(() => null);

  return { enriched: true };
}
