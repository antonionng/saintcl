import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/dal";
import {
  getOrgLogoPath,
  ORG_LOGO_ALLOWED_MIME_TYPES,
  ORG_LOGO_BUCKET,
  ORG_LOGO_MAX_BYTES,
} from "@/lib/org-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedMimeTypes = new Set(ORG_LOGO_ALLOWED_MIME_TYPES);

function isAllowedLogoMimeType(value: string): value is (typeof ORG_LOGO_ALLOWED_MIME_TYPES)[number] {
  return allowedMimeTypes.has(value as (typeof ORG_LOGO_ALLOWED_MIME_TYPES)[number]);
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManagePolicies) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");
  if (!(rawFile instanceof File)) {
    return NextResponse.json({ error: { message: "Logo file is required." } }, { status: 400 });
  }

  if (!isAllowedLogoMimeType(rawFile.type)) {
    return NextResponse.json(
      { error: { message: "Upload a PNG, JPG, WEBP, or GIF image." } },
      { status: 400 },
    );
  }

  if (rawFile.size > ORG_LOGO_MAX_BYTES) {
    return NextResponse.json(
      { error: { message: "Logo files must be 5MB or smaller." } },
      { status: 400 },
    );
  }

  const logoPath = getOrgLogoPath(session.org.id, rawFile.type);
  if (!logoPath) {
    return NextResponse.json({ error: { message: "Unsupported logo file type." } }, { status: 400 });
  }

  const previousLogoPath = session.org.logo_path ?? null;
  const fileBuffer = Buffer.from(await rawFile.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(ORG_LOGO_BUCKET).upload(logoPath, fileBuffer, {
    contentType: rawFile.type,
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: { message: uploadError.message } }, { status: 500 });
  }

  const { data, error } = await admin
    .from("orgs")
    .update({ logo_path: logoPath })
    .eq("id", session.org.id)
    .select("id, logo_path")
    .single();

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  if (previousLogoPath && previousLogoPath !== logoPath) {
    await admin.storage.from(ORG_LOGO_BUCKET).remove([previousLogoPath]);
  }

  const signed = await admin.storage.from(ORG_LOGO_BUCKET).createSignedUrl(logoPath, 60 * 60);
  return NextResponse.json({
    data: {
      id: data.id,
      logoPath: data.logo_path,
      logoUrl: signed.data?.signedUrl ?? null,
    },
  });
}
