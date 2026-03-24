import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeTempWorkspace } from "../test-helpers/workspace.js";

const mocks = vi.hoisted(() => ({
  resolveWorkspaceTemplateDir: vi.fn(async () => "/tmp/openclaw-missing-templates"),
}));

vi.mock("./workspace-templates.js", () => ({
  resolveWorkspaceTemplateDir: mocks.resolveWorkspaceTemplateDir,
  resetWorkspaceTemplateDirCache: vi.fn(),
}));

const { ensureAgentWorkspace } = await import("./workspace.js");

describe("ensureAgentWorkspace fallback templates", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    mocks.resolveWorkspaceTemplateDir.mockReset();
    mocks.resolveWorkspaceTemplateDir.mockResolvedValue("/tmp/openclaw-missing-templates");
  });

  it("uses built-in fallback content when packaged templates are missing", async () => {
    const workspaceDir = await makeTempWorkspace("openclaw-workspace-fallback-");
    const missingTemplatesDir = await makeTempWorkspace("openclaw-missing-templates-");
    tempDirs.push(workspaceDir, missingTemplatesDir);
    mocks.resolveWorkspaceTemplateDir.mockResolvedValue(missingTemplatesDir);

    await ensureAgentWorkspace({ dir: workspaceDir, ensureBootstrapFiles: true });

    await expect(fs.readFile(path.join(workspaceDir, "IDENTITY.md"), "utf-8")).resolves.toContain(
      "# IDENTITY.md - Agent Identity",
    );
    await expect(fs.readFile(path.join(workspaceDir, "AGENTS.md"), "utf-8")).resolves.toContain(
      "# AGENTS.md - Your Workspace",
    );
    await expect(fs.readFile(path.join(workspaceDir, "BOOTSTRAP.md"), "utf-8")).resolves.toContain(
      "# BOOTSTRAP.md - First Run Ritual",
    );
  });
});
