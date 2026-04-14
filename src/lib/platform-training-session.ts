import { getIsSuperAdmin } from "@/lib/super-admin";
import { createClient } from "@/lib/supabase/server";

export type PlatformTrainingSession = {
  userId: string;
  email: string | null;
  isSuperAdmin: boolean;
  canManagePlatformTraining: boolean;
};

export async function getCurrentPlatformTrainingSession(): Promise<PlatformTrainingSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    return null;
  }

  const isSuperAdmin = getIsSuperAdmin(user);

  return {
    userId: user.id,
    email: user.email ?? null,
    isSuperAdmin,
    canManagePlatformTraining: isSuperAdmin,
  };
}
