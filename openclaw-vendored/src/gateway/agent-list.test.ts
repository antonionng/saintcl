import { afterEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  readdirSync: vi.fn(() => [] as Array<{ name: string; isDirectory: () => boolean }>),
}));

vi.mock("node:fs", () => ({
  default: {
    readdirSync: fsMocks.readdirSync,
  },
  readdirSync: fsMocks.readdirSync,
}));

vi.mock("../config/paths.js", () => ({
  resolveStateDir: () => "/tmp/openclaw-test-state",
}));

vi.mock("../agents/agent-scope.js", () => ({
  resolveDefaultAgentId: (cfg: { agents?: { list?: Array<{ id?: string; default?: boolean }> } }) => {
    const list = cfg.agents?.list ?? [];
    const explicit = list.find((entry) => entry?.default && entry.id);
    if (explicit?.id) {
      return explicit.id;
    }
    return list[0]?.id ?? "main";
  },
}));

import { listEffectiveGatewayAgentIds, listGatewayAgentsBasic } from "./agent-list.js";

function dirent(name: string) {
  return { name, isDirectory: () => true };
}

describe("listEffectiveGatewayAgentIds", () => {
  afterEach(() => {
    fsMocks.readdirSync.mockReset();
  });

  it("returns the configured agents plus the default id when the disk is empty", () => {
    fsMocks.readdirSync.mockReturnValue([]);
    const ids = listEffectiveGatewayAgentIds({
      agents: {
        list: [
          { id: "ant-agent", default: true },
          { id: "ops-agent" },
        ],
      },
    } as never);
    expect(ids).toContain("ant-agent");
    expect(ids).toContain("ops-agent");
  });

  it("includes disk-discovered agents that are not yet in cfg.agents.list when no explicit list filter is active", () => {
    // No explicit list -> allow disk-discovered IDs through.
    fsMocks.readdirSync.mockReturnValue([dirent("disk-only-agent"), dirent("main")]);
    const ids = listEffectiveGatewayAgentIds({} as never);
    expect(ids).toContain("disk-only-agent");
    expect(ids).toContain("main");
  });

  it("filters disk-only agents when an explicit cfg.agents.list is configured", () => {
    // When the operator has an explicit configured list we must not let
    // arbitrary disk dirs be considered known to the gateway. This matches
    // the existing `listGatewayAgentsBasic` filtering rule.
    fsMocks.readdirSync.mockReturnValue([dirent("rogue-disk-agent"), dirent("ant-agent")]);
    const ids = listEffectiveGatewayAgentIds({
      agents: {
        list: [{ id: "ant-agent", default: true }],
      },
    } as never);
    expect(ids).toContain("ant-agent");
    expect(ids).not.toContain("rogue-disk-agent");
  });

  it("includes the configured session.mainKey when allowed", () => {
    fsMocks.readdirSync.mockReturnValue([]);
    const ids = listEffectiveGatewayAgentIds({
      agents: { list: [{ id: "ant-agent", default: true }] },
      session: { mainKey: "ant-agent" },
    } as never);
    expect(ids).toContain("ant-agent");
  });
});

describe("listGatewayAgentsBasic", () => {
  afterEach(() => {
    fsMocks.readdirSync.mockReset();
  });

  it("exposes the same id set that file-write resolution accepts", () => {
    // This is the regression: file writes (resolveAgentIdOrError) must accept
    // every id that gateway listing/session routing reports as known. If the
    // two diverge, agents.files.set rejects freshly registered agents with
    // `unknown agent id` even though `agents.list` reports them.
    fsMocks.readdirSync.mockReturnValue([dirent("ant-agent"), dirent("disk-only-agent")]);
    const cfg = {
      agents: { list: [{ id: "ant-agent", default: true }] },
    } as never;
    const listing = listGatewayAgentsBasic(cfg).agents.map((row) => row.id);
    const effective = listEffectiveGatewayAgentIds(cfg);
    expect([...listing].sort()).toEqual([...effective].sort());
  });
});
