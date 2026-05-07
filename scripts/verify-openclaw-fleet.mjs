#!/usr/bin/env node
/**
 * Fleet verification for the OpenClaw gateway shards behind SaintAGI.
 *
 * Reads `OPENCLAW_GATEWAY_SHARDS` (JSON shape used by
 * `src/lib/openclaw/gateway-shards.ts`) plus the optional global
 * `OPENCLAW_GATEWAY_URL`/`OPENCLAW_GATEWAY_TOKEN`, and for every shard reports
 * whether it is:
 *   - reachable via the shallow HTTP `/healthz` probe (gateway process is up)
 *   - ready via the deeper HTTP `/readyz` probe (channels and runtime ready)
 *   - usable as a control plane via an authenticated `config.get` RPC over
 *     WebSocket (gateway accepts our token, returns a config snapshot, and
 *     reports the agent-list it would consider effective)
 *
 * The intent is to run this AFTER any OpenClaw vendored change is deployed
 * to Railway and BEFORE telling the SaintAGI app to rely on the new RPC
 * behavior, so that we never call a `config.patch` against a shard that
 * silently lags behind on a stale image.
 *
 * Usage:
 *   node scripts/verify-openclaw-fleet.mjs                       # uses env
 *   node scripts/verify-openclaw-fleet.mjs --json                # machine output
 *   node scripts/verify-openclaw-fleet.mjs --expected-build=abc  # informational
 *   node scripts/verify-openclaw-fleet.mjs --skip-rpc            # HTTP only
 *   node scripts/verify-openclaw-fleet.mjs --shards path/to.json # override env
 *
 * Exits with code 0 only if every configured shard passes every requested
 * check. Exits 1 if anything is unhealthy or the config is missing/invalid.
 */

import { readFile } from "node:fs/promises";

import WebSocket from "ws";

const ARGS = parseArgs(process.argv.slice(2));

async function main() {
  const shards = await loadShardConfig(ARGS);
  if (shards.length === 0) {
    fail(
      "No gateway shards configured. Set OPENCLAW_GATEWAY_SHARDS or pass --shards <file>, or set OPENCLAW_GATEWAY_URL for a single-shard fleet.",
    );
  }

  const results = [];
  for (const shard of shards) {
    const result = await verifyShard(shard);
    results.push(result);
  }

  const ok = results.every((entry) => entry.overallOk);

  if (ARGS.json) {
    process.stdout.write(`${JSON.stringify({ ok, shards: results, expectedBuild: ARGS.expectedBuild ?? null }, null, 2)}\n`);
  } else {
    printHumanReport(results, { ok, expectedBuild: ARGS.expectedBuild });
  }

  process.exit(ok ? 0 : 1);
}

function parseArgs(argv) {
  const out = { json: false, skipRpc: false, expectedBuild: null, shardsFile: null, timeoutMs: 8_000 };
  for (const raw of argv) {
    if (raw === "--json") out.json = true;
    else if (raw === "--skip-rpc") out.skipRpc = true;
    else if (raw.startsWith("--expected-build=")) out.expectedBuild = raw.slice("--expected-build=".length).trim() || null;
    else if (raw.startsWith("--shards=")) out.shardsFile = raw.slice("--shards=".length).trim() || null;
    else if (raw === "--shards") {
      throw new Error("--shards requires a value, e.g. --shards=path/to.json");
    } else if (raw.startsWith("--timeout=")) {
      const next = Number.parseInt(raw.slice("--timeout=".length), 10);
      if (Number.isFinite(next) && next > 0) out.timeoutMs = next;
    } else if (raw === "--help" || raw === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${raw}`);
    }
  }
  return out;
}

function printUsage() {
  process.stdout.write(`Usage: node scripts/verify-openclaw-fleet.mjs [options]\n\nOptions:\n  --json                Machine-readable output\n  --skip-rpc            Skip the config.get RPC over WebSocket\n  --expected-build=HASH Display the expected OpenClaw build hash on the report\n  --shards=PATH         Read shard config JSON from a file instead of env\n  --timeout=MS          Per-probe timeout (default 8000ms)\n`);
}

async function loadShardConfig(args) {
  if (args.shardsFile) {
    const raw = await readFile(args.shardsFile, "utf8");
    return parseShardJson(raw);
  }

  const fromEnv = process.env.OPENCLAW_GATEWAY_SHARDS?.trim();
  if (fromEnv) {
    return parseShardJson(fromEnv);
  }

  const single = process.env.OPENCLAW_GATEWAY_URL?.trim();
  if (single) {
    return [
      {
        id: "default",
        wsUrl: single,
        token: process.env.OPENCLAW_GATEWAY_TOKEN?.trim() || undefined,
      },
    ];
  }

  return [];
}

function parseShardJson(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`Failed to parse shard config JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const entries = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.shards)
      ? parsed.shards
      : [];
  const out = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const wsUrl =
      typeof entry.wsUrl === "string" && entry.wsUrl.trim()
        ? entry.wsUrl.trim()
        : typeof entry.url === "string"
          ? entry.url.trim()
          : "";
    if (!wsUrl) continue;
    out.push({
      id: typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `shard-${out.length + 1}`,
      wsUrl,
      token: typeof entry.token === "string" && entry.token.trim() ? entry.token.trim() : undefined,
    });
  }
  return out;
}

async function verifyShard(shard) {
  const httpBase = wsUrlToHttp(shard.wsUrl);
  const checks = {};

  checks.healthz = await probeHttpJson(`${httpBase}/healthz`, ARGS.timeoutMs);
  checks.readyz = await probeHttpJson(`${httpBase}/readyz`, ARGS.timeoutMs);

  if (ARGS.skipRpc) {
    checks.rpc = { skipped: true };
  } else {
    checks.rpc = await probeRpc(shard, ARGS.timeoutMs);
  }

  const overallOk =
    checks.healthz.ok &&
    (checks.readyz.ok || (checks.readyz.body && checks.readyz.body.ready === true)) &&
    (ARGS.skipRpc ? true : checks.rpc.ok);

  return {
    shardId: shard.id,
    wsUrl: shard.wsUrl,
    httpBase,
    overallOk,
    checks,
  };
}

function wsUrlToHttp(wsUrl) {
  if (wsUrl.startsWith("wss://")) return `https://${wsUrl.slice("wss://".length)}`.replace(/\/+$/, "");
  if (wsUrl.startsWith("ws://")) return `http://${wsUrl.slice("ws://".length)}`.replace(/\/+$/, "");
  return wsUrl.replace(/\/+$/, "");
}

async function probeHttpJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - startedAt,
      body,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      url,
    };
  } finally {
    clearTimeout(timer);
  }
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

async function probeRpc(shard, timeoutMs) {
  if (!shard.token) {
    return {
      ok: false,
      skipped: true,
      reason: "no token configured for shard; cannot exercise control-plane RPCs",
    };
  }

  return await new Promise((resolve) => {
    const startedAt = Date.now();
    const ws = new WebSocket(shard.wsUrl, {
      headers: { Authorization: `Bearer ${shard.token}` },
      handshakeTimeout: timeoutMs,
    });

    let settled = false;
    let connected = false;
    let connectId = randomId();
    let configRequestId = null;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // best effort
      }
      resolve({ ...value, durationMs: Date.now() - startedAt });
    };

    const timer = setTimeout(
      () => finish({ ok: false, error: "rpc timeout waiting for config.get response" }),
      timeoutMs,
    );

    ws.on("open", () => {
      const connectFrame = {
        type: "req",
        id: connectId,
        method: "connect",
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: "saintagi-fleet-verifier",
            version: "0.1.0",
            platform: "node",
            mode: "backend",
          },
          role: "operator",
          scopes: ["operator.read", "operator.write", "operator.admin"],
          auth: { token: shard.token },
        },
      };
      try {
        ws.send(JSON.stringify(connectFrame));
      } catch (error) {
        finish({ ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    });

    ws.on("message", (raw) => {
      let frame;
      try {
        frame = JSON.parse(raw.toString());
      } catch (error) {
        finish({
          ok: false,
          error: `invalid gateway frame: ${error instanceof Error ? error.message : String(error)}`,
        });
        return;
      }

      if (frame?.type === "event") return;
      if (frame?.type !== "res") return;

      if (!connected) {
        if (frame.id !== connectId) return;
        if (!frame.ok) {
          finish({
            ok: false,
            error: frame.error?.message || "gateway rejected connect frame",
          });
          return;
        }
        connected = true;
        configRequestId = randomId();
        ws.send(
          JSON.stringify({
            type: "req",
            id: configRequestId,
            method: "config.get",
            params: {},
          }),
        );
        return;
      }

      if (frame.id !== configRequestId) return;
      clearTimeout(timer);

      if (!frame.ok) {
        finish({
          ok: false,
          error: frame.error?.message || "config.get rejected",
        });
        return;
      }

      const payload = frame.payload ?? {};
      const cfgHash = typeof payload.hash === "string" ? payload.hash : null;
      const cfg = payload.config ?? null;
      const agentList = Array.isArray(cfg?.agents?.list) ? cfg.agents.list : [];
      finish({
        ok: true,
        cfgHash,
        agentCount: agentList.length,
        agentIds: agentList
          .map((entry) => (entry && typeof entry === "object" && typeof entry.id === "string" ? entry.id : null))
          .filter(Boolean),
      });
    });

    ws.on("error", (error) => {
      clearTimeout(timer);
      finish({ ok: false, error: error instanceof Error ? error.message : String(error) });
    });

    ws.on("close", () => {
      if (settled) return;
      finish({ ok: false, error: "gateway closed connection before config.get response" });
    });
  });
}

function printHumanReport(results, summary) {
  const headerBuild = summary.expectedBuild ? ` (expected build ${summary.expectedBuild})` : "";
  process.stdout.write(`\nOpenClaw fleet verification${headerBuild}\n`);
  process.stdout.write(`${"-".repeat(72)}\n`);
  for (const entry of results) {
    const tick = entry.overallOk ? "OK " : "FAIL";
    process.stdout.write(`[${tick}] ${entry.shardId}  ${entry.wsUrl}\n`);
    process.stdout.write(`        healthz: ${describeHttpResult(entry.checks.healthz)}\n`);
    process.stdout.write(`        readyz : ${describeHttpResult(entry.checks.readyz)}\n`);
    if (entry.checks.rpc.skipped) {
      process.stdout.write(`        rpc    : skipped${entry.checks.rpc.reason ? ` (${entry.checks.rpc.reason})` : ""}\n`);
    } else if (entry.checks.rpc.ok) {
      process.stdout.write(
        `        rpc    : ok  cfgHash=${entry.checks.rpc.cfgHash ?? "<none>"}  agents=${entry.checks.rpc.agentCount}  (${entry.checks.rpc.durationMs}ms)\n`,
      );
    } else {
      process.stdout.write(`        rpc    : fail  ${entry.checks.rpc.error}\n`);
    }
  }
  process.stdout.write(`${"-".repeat(72)}\n`);
  process.stdout.write(`Result: ${summary.ok ? "all shards healthy" : "one or more shards failed"}\n`);
}

function describeHttpResult(result) {
  if (result.ok) {
    const summary = summarizeBody(result.body);
    return `${result.status} (${result.durationMs}ms)${summary ? `  ${summary}` : ""}`;
  }
  if (result.error) {
    return `error: ${result.error} (${result.durationMs}ms)`;
  }
  const summary = summarizeBody(result.body);
  return `${result.status} (${result.durationMs}ms)${summary ? `  ${summary}` : ""}`;
}

function summarizeBody(body) {
  if (!body || typeof body !== "object") return "";
  if ("ready" in body) {
    const ready = body.ready === true ? "ready" : "not-ready";
    const failing = Array.isArray(body.failing) && body.failing.length > 0 ? ` failing=${body.failing.join(",")}` : "";
    const uptime = typeof body.uptimeMs === "number" ? ` uptimeMs=${body.uptimeMs}` : "";
    return `${ready}${failing}${uptime}`;
  }
  if (body.status) {
    return `status=${body.status}`;
  }
  return "";
}

function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
