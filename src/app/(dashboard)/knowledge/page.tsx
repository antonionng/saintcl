import { Database, Upload } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentOrg, getKnowledgeDocs } from "@/lib/dal";

export default async function KnowledgePage() {
  const session = await getCurrentOrg();
  const docs = session?.org.id ? await getKnowledgeDocs(session.org.id) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Knowledge"
        title="Upload working memory"
        description="Store team documents in Supabase Storage, chunk them into pgvector, and bootstrap tenant-specific OpenClaw retrieval skills."
        action={<Button>Upload file</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>RAG intake</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-8 text-center">
            <Upload className="mx-auto size-8 text-white" />
            <p className="mt-5 text-lg text-white">
              Drop PDF, TXT, MD, or CSV files here
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Files are staged in Supabase Storage before chunking and embedding.
            </p>
            <Input className="mt-6" type="file" />
          </div>

          {docs.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No documents"
              description="Upload your first document to build retrieval memory for your agents."
              className="py-10"
            />
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{doc.filename}</p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {doc.chunk_count} chunks
                      </p>
                    </div>
                    <Badge variant={doc.chunk_count > 0 ? "success" : "warning"}>
                      {doc.chunk_count > 0 ? "indexed" : "processing"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm text-zinc-400">
                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
