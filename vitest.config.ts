import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Vitest is the default test runner for SaintClaw. The only project-wide
// concern this config exists to solve is mirroring the `@/*` -> `./src/*`
// path alias from tsconfig.json so tests can import sibling modules the same
// way the application does. Anything more (test environment, coverage, etc.)
// is left to per-script invocation so this file stays cheap to reason about.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
