import { env } from "@/lib/env";

export function isTruthyMetadataFlag(raw: unknown) {
  return raw === true || raw === "true" || raw === 1 || raw === "1";
}

function normalizeAdminLabel(raw: unknown) {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function normalizeEmail(raw: unknown) {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function getSuperAdminEmailAllowlist() {
  return new Set(
    env.superAdminEmails
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

export function getIsSuperAdmin(user: { email?: string | null; app_metadata?: Record<string, unknown> } | null) {
  const metadata = user?.app_metadata ?? {};
  const email = normalizeEmail(user?.email);
  if (email && getSuperAdminEmailAllowlist().has(email)) {
    return true;
  }

  const flagKeys = [
    "is_super_admin",
    "isSuperAdmin",
    "super_admin",
    "superAdmin",
    "platform_admin",
    "platformAdmin",
  ];
  const adminLabels = new Set([
    "super_admin",
    "superadmin",
    "platform_admin",
    "platformadmin",
  ]);

  if (flagKeys.some((key) => isTruthyMetadataFlag(metadata[key]))) {
    return true;
  }

  const singleRoleKeys = ["role", "user_role", "admin_role", "platform_role"];
  if (singleRoleKeys.some((key) => adminLabels.has(normalizeAdminLabel(metadata[key])))) {
    return true;
  }

  const multiRoleKeys = ["roles", "role_names", "permissions", "platform_roles"];
  return multiRoleKeys.some((key) => {
    const value = metadata[key];
    return Array.isArray(value) && value.some((entry) => adminLabels.has(normalizeAdminLabel(entry)));
  });
}
