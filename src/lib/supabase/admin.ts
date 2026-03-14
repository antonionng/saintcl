import { createClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "@/lib/env";

export function createAdminClient() {
  if (!isSupabaseConfigured() || !env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
