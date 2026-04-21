import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  getTrainingModulesForProgramme,
  getTrainingParticipantByInviteForAuthUser,
} from "@/lib/training-dal";
import {
  uploadManagedTrainingDatasets,
  type ManagedTrainingDatasetUpload,
} from "@/lib/openclaw/training-workspace-manager";

const MAX_FILES_PER_REQUEST = 10;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return NextResponse.json(
      { error: { message: "Participant session not found." } },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { message: "Upload payload must be multipart/form-data." } },
      { status: 400 },
    );
  }

  const inviteCode = String(formData.get("inviteCode") ?? "").trim();
  const moduleSlug = String(formData.get("moduleSlug") ?? "").trim();
  if (!inviteCode || !moduleSlug) {
    return NextResponse.json(
      { error: { message: "inviteCode and moduleSlug are required." } },
      { status: 400 },
    );
  }

  const fileEntries = formData.getAll("files");
  if (fileEntries.length === 0) {
    return NextResponse.json(
      { error: { message: "Attach one or more files under the `files` field." } },
      { status: 400 },
    );
  }
  if (fileEntries.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: { message: `Upload up to ${MAX_FILES_PER_REQUEST} files per request.` } },
      { status: 400 },
    );
  }

  const session = await getTrainingParticipantByInviteForAuthUser({
    inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });
  if (!session?.cohort) {
    return NextResponse.json(
      { error: { message: "Participant session is no longer valid." } },
      { status: 401 },
    );
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === moduleSlug);
  if (!trainingModule) {
    return NextResponse.json(
      { error: { message: "Training module not found for this participant." } },
      { status: 404 },
    );
  }

  const orgId = session.participant.orgId ?? session.cohort.orgId;
  if (!orgId) {
    return NextResponse.json(
      { error: { message: "Training workspace requires a resolved org context." } },
      { status: 500 },
    );
  }

  const uploads: ManagedTrainingDatasetUpload[] = [];
  let totalBytes = 0;
  for (const entry of fileEntries) {
    if (!(entry instanceof File)) continue;
    const bytes = new Uint8Array(await entry.arrayBuffer());
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        {
          error: {
            message: `Upload exceeds the ${MAX_TOTAL_BYTES / (1024 * 1024)} MB request limit.`,
          },
        },
        { status: 413 },
      );
    }
    uploads.push({ fileName: entry.name, bytes });
  }

  if (uploads.length === 0) {
    return NextResponse.json(
      { error: { message: "No valid files were attached." } },
      { status: 400 },
    );
  }

  const persisted = await uploadManagedTrainingDatasets({
    orgId,
    participantId: session.participant.id,
    moduleSlug,
    files: uploads,
  });

  if (persisted.length === 0) {
    return NextResponse.json(
      {
        error: {
          message:
            "All uploaded files were rejected (size limits or unsafe file names).",
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    data: {
      files: persisted.map((file) => ({
        fileName: file.fileName,
        size: file.size,
      })),
    },
  });
}
