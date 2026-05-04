import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OrgRole = "owner" | "admin" | "member";

type AuthenticatedOrgContext = {
  admin: ReturnType<typeof createClient>;
  userId: string;
  role: OrgRole;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: { message } }, { status, headers: corsHeaders });
}

function getSupabaseUrl() {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) {
    throw new Error("SUPABASE_URL is not configured.");
  }
  return url;
}

function getAnonKey() {
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!key) {
    throw new Error("SUPABASE_ANON_KEY is not configured.");
  }
  return key;
}

function getServiceRoleKey() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return key;
}

export async function requireOrgAdmin(
  request: Request,
  orgId: unknown,
): Promise<{ data: AuthenticatedOrgContext; error?: never } | { data?: never; error: Response }> {
  if (typeof orgId !== "string" || orgId.trim().length === 0) {
    return { error: jsonError("Organization is required.", 400) };
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return { error: jsonError("Not authenticated.", 401) };
  }

  let supabaseUrl: string;
  let anonKey: string;
  let serviceRoleKey: string;
  try {
    supabaseUrl = getSupabaseUrl();
    anonKey = getAnonKey();
    serviceRoleKey = getServiceRoleKey();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase is not configured.";
    return { error: jsonError(message, 500) };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authorization },
    },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return { error: jsonError("Not authenticated.", 401) };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: membership, error: membershipError } = await admin
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return { error: jsonError("Unable to verify organization membership.", 500) };
  }

  const role = membership?.role;
  if (role !== "owner" && role !== "admin") {
    return { error: jsonError("Admin access required.", 403) };
  }

  return {
    data: {
      admin,
      userId: user.id,
      role,
    },
  };
}

export async function requireOrgMember(
  admin: ReturnType<typeof createClient>,
  orgId: string,
  userId: unknown,
) {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return false;
  }

  const { data, error } = await admin
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data);
}
