const DANGEROUS_PATTERNS = [
  /\brm\s+-rf\s+\//,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
];

export function assertAdminRole(role: string) {
  if (role !== "owner" && role !== "admin") {
    throw new Error("Terminal access is restricted to tenant admins.");
  }
}

export function assertCommandAllowed(command: string) {
  if (DANGEROUS_PATTERNS.some((pattern) => pattern.test(command))) {
    throw new Error("This command is blocked by Saint AGI terminal policy.");
  }
}

export function assertRepoAllowed(repo: string | undefined, allowlists: string[]) {
  if (!repo) {
    return;
  }

  if (allowlists.length === 0) {
    throw new Error("No repo allowlists configured. Add at least one allowlist entry before running repo-scoped commands.");
  }

  const allowed = allowlists.some((pattern) => repo.includes(pattern));
  if (!allowed) {
    throw new Error("Repository is not included in the tenant allowlist.");
  }
}
