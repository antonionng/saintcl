import WebSocket from "ws";

import { env, isOpenClawConfigured } from "@/lib/env";
import type { OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

type OpenClawFrame<T = unknown> =
  | { type: "req"; id: string; method: string; params: Record<string, unknown> }
  | { type: "res"; id: string; ok: boolean; payload?: T; error?: { message: string } }
  | { type: "event"; event: string; payload?: T };

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export class OpenClawClient {
  constructor(
    private readonly runtime?: Pick<OpenClawRuntimeDescriptor, "gatewayUrl" | "gatewayToken">,
  ) {}

  async health() {
    if (!isOpenClawConfigured()) {
      return { ok: true, mode: "mock", gateway: "unconfigured" };
    }

    if (!this.runtime?.gatewayUrl && !env.openClawGatewayUrl) {
      return { ok: true, mode: "managed", gateway: "runtime-resolved-on-demand" };
    }

    return this.call("health", {});
  }

  private async getConfigHash(): Promise<string> {
    const result = await this.call<{ hash: string }>("config.get", {});
    return result.hash;
  }

  async provisionAgent(input: { agentId: string; workspace: string; model: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      agents: {
        list: [{ id: input.agentId, workspace: input.workspace, model: input.model }],
      },
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async connectTelegram(input: { agentId: string; botToken: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      channels: { telegram: { botToken: input.botToken } },
      bindings: [{ agentId: input.agentId, match: { channel: "telegram", accountId: "default" } }],
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async connectSlack(input: { agentId: string; teamId: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      bindings: [{ agentId: input.agentId, match: { channel: "slack", accountId: input.teamId } }],
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async call<T = unknown>(method: string, params: Record<string, unknown>) {
    const gatewayUrl = this.runtime?.gatewayUrl || env.openClawGatewayUrl;
    const token = this.runtime?.gatewayToken || env.openClawGatewayToken;

    if (!gatewayUrl) {
      throw new Error("OpenClaw gateway URL is not configured.");
    }

    const requestId = randomId();

    return new Promise<T>((resolve, reject) => {
      const socket = new WebSocket(gatewayUrl);
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("OpenClaw gateway timeout"));
      }, 10000);

      let connected = false;

      socket.on("open", () => {
        const connectFrame: OpenClawFrame = {
          type: "req",
          id: randomId(),
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: { id: "gateway-client", version: "0.1.0", platform: "macos", mode: "backend" },
            role: "operator",
            scopes: ["operator.read", "operator.write", "operator.admin"],
            auth: token ? { token } : undefined,
          },
        };

        socket.send(JSON.stringify(connectFrame));
      });

      socket.on("message", (rawMessage) => {
        const frame = JSON.parse(rawMessage.toString()) as OpenClawFrame<T>;

        if (frame.type === "event") {
          return;
        }

        if (!connected && frame.type === "res") {
          if (!frame.ok) {
            clearTimeout(timeout);
            socket.close();
            reject(new Error((frame as OpenClawFrame & { error?: { message: string } }).error?.message || "OpenClaw connect failed"));
            return;
          }
          connected = true;
          const requestFrame: OpenClawFrame = {
            type: "req",
            id: requestId,
            method,
            params,
          };
          socket.send(JSON.stringify(requestFrame));
          return;
        }

        if (frame.type === "res" && frame.id === requestId) {
          clearTimeout(timeout);
          socket.close();
          if (frame.ok) {
            resolve((frame.payload ?? {}) as T);
          } else {
            reject(new Error(frame.error?.message || "OpenClaw request failed."));
          }
        }
      });

      socket.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
}
