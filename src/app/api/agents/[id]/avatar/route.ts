import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { normalizeAgentAvatarConfig } from "@/lib/agent-identity";
import {
  AGENT_AVATAR_ALLOWED_MIME_TYPES,
  AGENT_AVATAR_BUCKET,
  AGENT_AVATAR_MAX_BYTES,
  getAgentAvatarPath,
  getSignedAgentAvatarUrl,
} from "@/lib/agent-avatar-storage";
import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedMimeTypes = new Set(AGENT_AVATAR_ALLOWED_MIME_TYPES);

function isAllowedAvatarMimeType(value: string): value is (typeof AGENT_AVATAR_ALLOWED_MIME_TYPES)[number] {
  return allowedMimeTypes.has(value as (typeof AGENT_AVATAR_ALLOWED_MIME_TYPES)[number]);
}

async function ensureAgentAvatarBucket(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  const { data: bucket, error: getBucketError } = await admin.storage.getBucket(AGENT_AVATAR_BUCKET);

  if (bucket) {
    return null;
  }

  if (getBucketError && !/not found/i.test(getBucketError.message)) {
    return getBucketError;
  }

  const { error: createBucketError } = await admin.storage.createBucket(AGENT_AVATAR_BUCKET, {
    public: false,
    fileSizeLimit: AGENT_AVATAR_MAX_BYTES,
    allowedMimeTypes: [...AGENT_AVATAR_ALLOWED_MIME_TYPES],
  });

  if (createBucketError && !/already exists/i.test(createBucketError.message)) {
    return createBucketError;
  }

  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: { message: "Agent management requires admin access." } }, { status: 403 });
  }

  const { id } = await context.params;
  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) {
    return NextResponse.json({ error: { message: "Agent not found." } }, { status: 404 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  const bucketError = await ensureAgentAvatarBucket(admin);
  if (bucketError) {
    return NextResponse.json({ error: { message: bucketError.message } }, { status: 500 });
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");
  if (!(rawFile instanceof File)) {
    return NextResponse.json({ error: { message: "Avatar image is required." } }, { status: 400 });
  }

  if (!isAllowedAvatarMimeType(rawFile.type)) {
    return NextResponse.json(
      { error: { message: "Upload a PNG, JPG, WEBP, or GIF image." } },
      { status: 400 },
    );
  }

  if (rawFile.size > AGENT_AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { error: { message: "Agent avatar images must be 512KB or smaller." } },
      { status: 400 },
    );
  }

  const avatarPath = getAgentAvatarPath(session.org.id, agent.id, rawFile.type);
  if (!avatarPath) {
    return NextResponse.json({ error: { message: "Unsupported avatar image type." } }, { status: 400 });
  }

  const currentConfig = (agent.config ?? {}) as Record<string, unknown>;
  const currentAvatar = normalizeAgentAvatarConfig(currentConfig.agentAvatar);
  const previousAvatarPath = currentAvatar.imagePath ?? null;
  const fileBuffer = Buffer.from(await rawFile.arrayBuffer());
  const imageDataUrl = `data:${rawFile.type};base64,${fileBuffer.toString("base64")}`;

  const { error: uploadError } = await admin.storage.from(AGENT_AVATAR_BUCKET).upload(avatarPath, fileBuffer, {
    contentType: rawFile.type,
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: { message: uploadError.message } }, { status: 500 });
  }

  const nextAvatar = {
    ...currentAvatar,
    imagePath: avatarPath,
  };
  const nextConfig = {
    ...currentConfig,
    agentAvatar: nextAvatar,
  };

  const { data, error: updateError } = await admin
    .from("agents")
    .update({ config: nextConfig })
    .eq("id", agent.id)
    .eq("org_id", session.org.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: { message: updateError.message } }, { status: 500 });
  }

  if (previousAvatarPath && previousAvatarPath !== avatarPath) {
    await admin.storage.from(AGENT_AVATAR_BUCKET).remove([previousAvatarPath]);
  }

  await getTenantOpenClawClient(session.org.id, { orgId: session.org.id })
    .then(({ client }) =>
      client.updateAgentIdentity({
        agentId: agent.openclaw_agent_id,
        name: agent.name,
        avatar: {
          ...nextAvatar,
          imageDataUrl,
        },
      }),
    )
    .catch(() => null);

  return NextResponse.json({
    data: {
      agent: data,
      avatar: nextAvatar,
      avatarUrl: await getSignedAgentAvatarUrl(avatarPath),
    },
  });
}
