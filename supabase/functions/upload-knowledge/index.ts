import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function chunkText(text: string, size = 800) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

Deno.serve(async (request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const body = await request.json();
  const chunks = chunkText(body.content ?? "");

  const { data: doc } = await supabase.from("knowledge_docs").insert({
    org_id: body.orgId,
    filename: body.filename,
    storage_path: body.storagePath,
    chunk_count: chunks.length,
  }).select().single();

  if (doc) {
    await supabase.from("knowledge_chunks").insert(
      chunks.map((content, index) => ({
        doc_id: doc.id,
        org_id: body.orgId,
        content,
        metadata: { chunkIndex: index },
      })),
    );
  }

  await supabase.from("audit_logs").insert({
    org_id: body.orgId,
    user_id: body.userId,
    action: "knowledge:uploaded",
    details: {
      filename: body.filename,
      chunkCount: chunks.length,
    },
  });

  return Response.json({ docId: doc?.id, chunkCount: chunks.length });
});
