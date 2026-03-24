import { NextResponse } from "next/server";

import {
  extractKnowledgeText,
  estimateKnowledgeChunkCount,
  KNOWLEDGE_DOCS_BUCKET,
  KNOWLEDGE_MAX_FILE_BYTES,
  resolveKnowledgeMimeType,
  slugifyKnowledgeFilename,
} from "@/lib/knowledge";
import { getCurrentOrg, getTeam, insertKnowledgeDoc } from "@/lib/dal";
import { syncKnowledgeToRelevantAgents } from "@/lib/openclaw/knowledge-sync";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated." } }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scopeType = String(formData.get("scopeType") || "org") as "org" | "team" | "user";
  const teamId = typeof formData.get("teamId") === "string" ? String(formData.get("teamId")) : null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: { message: "A file is required." } }, { status: 400 });
  }

  if (file.size > KNOWLEDGE_MAX_FILE_BYTES) {
    return NextResponse.json({ error: { message: "Knowledge files must be 10MB or smaller." } }, { status: 400 });
  }

  if (!["org", "team", "user"].includes(scopeType)) {
    return NextResponse.json({ error: { message: "Invalid knowledge scope." } }, { status: 400 });
  }

  if (scopeType !== "user" && !session.capabilities.canManageAgents) {
    return NextResponse.json({ error: { message: "Admin access required for company or team knowledge." } }, { status: 403 });
  }

  if (scopeType === "team") {
    if (!teamId) {
      return NextResponse.json({ error: { message: "Select a team before uploading." } }, { status: 400 });
    }

    const team = await getTeam(teamId, session.org.id);
    if (!team) {
      return NextResponse.json({ error: { message: "Team not found." } }, { status: 404 });
    }
  }

  const resolvedMimeType = resolveKnowledgeMimeType(file.name, file.type);

  let contentText: string;
  try {
    contentText = await extractKnowledgeText(file);
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Unable to read the uploaded file." } },
      { status: 400 },
    );
  }

  const safeFilename = slugifyKnowledgeFilename(file.name) || "knowledge-file";
  const storagePath = `${session.org.id}/${scopeType}/${scopeType === "team" ? teamId : scopeType === "user" ? session.userId : "company"}/${Date.now()}-${safeFilename}`;
  const upload = await admin.storage.from(KNOWLEDGE_DOCS_BUCKET).upload(storagePath, file, {
    contentType: resolvedMimeType ?? file.type ?? "text/plain",
    upsert: false,
  });

  if (upload.error) {
    return NextResponse.json({ error: { message: upload.error.message } }, { status: 500 });
  }

  const doc = await insertKnowledgeDoc({
    orgId: session.org.id,
    scopeType,
    filename: file.name,
    mimeType: resolvedMimeType ?? file.type ?? "text/plain",
    storagePath,
    contentText,
    chunkCount: estimateKnowledgeChunkCount(contentText),
    teamId,
    userId: scopeType === "user" ? session.userId : null,
    createdBy: session.userId,
  });

  if (!doc) {
    return NextResponse.json({ error: { message: "Unable to store document metadata." } }, { status: 500 });
  }

  await syncKnowledgeToRelevantAgents({
    orgId: session.org.id,
    scopeType,
    teamId,
    userId: scopeType === "user" ? session.userId : null,
  }).catch(() => null);

  return NextResponse.json({
    data: {
      document: doc,
      filename: file.name,
      status: "indexed",
    },
  });
}
