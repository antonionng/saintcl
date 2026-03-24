import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import {
  ACCOUNT_AVATAR_ALLOWED_MIME_TYPES,
  ACCOUNT_AVATAR_BUCKET,
  ACCOUNT_AVATAR_MAX_BYTES,
  getAccountAvatarPath,
} from "@/lib/account-profile";
import { getCurrentOrg, getCurrentUserProfile, loadCurrentUserProfile, updateCurrentUserAvatarPath } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedMimeTypes = new Set(ACCOUNT_AVATAR_ALLOWED_MIME_TYPES);

function isAllowedAvatarMimeType(value: string): value is (typeof ACCOUNT_AVATAR_ALLOWED_MIME_TYPES)[number] {
  return allowedMimeTypes.has(value as (typeof ACCOUNT_AVATAR_ALLOWED_MIME_TYPES)[number]);
}

async function ensureAccountAvatarBucket(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  const { data: bucket, error: getBucketError } = await admin.storage.getBucket(ACCOUNT_AVATAR_BUCKET);

  if (bucket) {
    return null;
  }

  if (getBucketError && !/not found/i.test(getBucketError.message)) {
    return getBucketError;
  }

  const { error: createBucketError } = await admin.storage.createBucket(ACCOUNT_AVATAR_BUCKET, {
    public: false,
    fileSizeLimit: ACCOUNT_AVATAR_MAX_BYTES,
    allowedMimeTypes: [...ACCOUNT_AVATAR_ALLOWED_MIME_TYPES],
  });

  if (createBucketError && !/already exists/i.test(createBucketError.message)) {
    return createBucketError;
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  const bucketError = await ensureAccountAvatarBucket(admin);
  if (bucketError) {
    return NextResponse.json({ error: { message: bucketError.message } }, { status: 500 });
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");
  if (!(rawFile instanceof File)) {
    return NextResponse.json({ error: { message: "Avatar file is required." } }, { status: 400 });
  }

  if (!isAllowedAvatarMimeType(rawFile.type)) {
    return NextResponse.json(
      { error: { message: "Upload a PNG, JPG, WEBP, or GIF image." } },
      { status: 400 },
    );
  }

  if (rawFile.size > ACCOUNT_AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { error: { message: "Avatar files must be 5MB or smaller." } },
      { status: 400 },
    );
  }

  const avatarPath = getAccountAvatarPath(session.userId, rawFile.type);
  if (!avatarPath) {
    return NextResponse.json({ error: { message: "Unsupported avatar file type." } }, { status: 400 });
  }

  const existingProfile = await getCurrentUserProfile();
  const previousAvatarPath = existingProfile?.avatarPath ?? null;
  const fileBuffer = Buffer.from(await rawFile.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(ACCOUNT_AVATAR_BUCKET).upload(avatarPath, fileBuffer, {
    contentType: rawFile.type,
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: { message: uploadError.message } }, { status: 500 });
  }

  const profileRecord = await updateCurrentUserAvatarPath(avatarPath);
  if (!profileRecord) {
    return NextResponse.json({ error: { message: "Unable to save avatar path." } }, { status: 500 });
  }

  if (previousAvatarPath && previousAvatarPath !== avatarPath) {
    await admin.storage.from(ACCOUNT_AVATAR_BUCKET).remove([previousAvatarPath]);
  }

  const profile = await loadCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ error: { message: "Unable to reload account profile." } }, { status: 500 });
  }

  return NextResponse.json({ data: profile });
}
