#!/usr/bin/env node
// Benchmarks the three latency paths the Real Chat Latency plan asks about:
//
//   1. Direct provider           - call OpenRouter (or any OpenAI-compatible endpoint)
//                                   directly, no gateway in the middle. This is the floor.
//   2. Gateway raw model         - call the OpenClaw gateway's models.run RPC, which goes
//                                   through OpenClaw but skips agent orchestration.
//                                   (Falls back to chat.send if models.run is unavailable.)
//   3. Full WebChat chat.send    - the real product path with full agent orchestration.
//
// Use it locally or in Railway to confirm where the latency budget is being spent before
// changing models or adding fast paths.
//
// Examples:
//
//   node scripts/benchmark-chat-latency.mjs \
//     --gateway wss://openclaw-production.up.railway.app \
//     --token $OPENCLAW_GATEWAY_TOKEN \
//     --session-key agent-<id>:main \
//     --message "say hi in 3 words" \
//     --model openrouter/anthropic/claude-haiku-4.5 \
//     --openrouter-key $OPENROUTER_API_KEY \
//     --runs 3
//
// Required:
//   --gateway <wss-url>            OpenClaw gateway WebSocket URL
//   --token <token>                OPENCLAW_GATEWAY_TOKEN
//   --session-key <key>            WebChat session key, e.g. "agent-<openclaw_agent_id>:main"
//
// Optional:
//   --message <text>               default: "ping"
//   --runs <int>                   default: 3
//   --model <model-id>             default: openrouter/anthropic/claude-haiku-4.5
//   --openrouter-key <key>         enables direct provider benchmark (OPENROUTER_API_KEY env)
//   --skip-direct                  skip direct provider call
//   --skip-raw                     skip gateway raw model call
//   --skip-chat                    skip full chat.send
//   --slo-ack-ms <int>             SLO target for chat.send ack (default 300ms)
//   --slo-final-ms <int>           SLO target for full warm answer (default 4000ms)
//   --slo-strict                   exit with non-zero status if SLOs are not met

import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import WebSocket from "ws";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function fmt(ms) {
  return `${ms.toFixed(0)}ms`;
}

function summarize(label, samples) {
  if (samples.length === 0) {
    console.log(`  ${label}: skipped`);
    return;
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  console.log(
    `  ${label}: avg=${fmt(avg)} p50=${fmt(p50)} min=${fmt(min)} max=${fmt(max)} (n=${samples.length})`,
  );
}

async function benchmarkDirectProvider({ apiKey, model, message }) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const requestBody = {
    model: model.replace(/^openrouter\//, ""),
    messages: [{ role: "user", content: message }],
    max_tokens: 32,
    temperature: 0,
    stream: false,
  };
  const started = performance.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://saintagi.local/benchmark",
      "X-Title": "saintagi-latency-benchmark",
    },
    body: JSON.stringify(requestBody),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`direct provider HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  await res.json();
  return performance.now() - started;
}

function connectGateway({ gatewayUrl, token }) {
  return new Promise((resolve, reject) => {
    const url = new URL(gatewayUrl);
    if (url.protocol === "https:") url.protocol = "wss:";
    if (url.protocol === "http:") url.protocol = "ws:";
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/v1/ws";
    }
    url.searchParams.set("token", token);
    const ws = new WebSocket(url.toString());
    const pending = new Map();
    let nextId = 1;

    ws.on("open", () => {
      resolve({
        request(method, params) {
          return new Promise((resolveCall, rejectCall) => {
            const id = nextId++;
            pending.set(id, { resolveCall, rejectCall, method });
            const payload = JSON.stringify({ id, method, params });
            ws.send(payload);
          });
        },
        on(event, handler) {
          ws.on(event, handler);
        },
        close() {
          ws.close();
        },
      });
    });
    ws.on("error", (err) => reject(err));
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString("utf8"));
        if (typeof msg.id === "number" && pending.has(msg.id)) {
          const entry = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) {
            entry.rejectCall(
              new Error(
                `gateway ${entry.method} error: ${msg.error.message ?? JSON.stringify(msg.error)}`,
              ),
            );
          } else {
            entry.resolveCall(msg.result ?? msg.payload ?? msg);
          }
        }
      } catch {
        // ignore malformed frames
      }
    });
  });
}

async function benchmarkChatSend({ gateway, sessionKey, message, runs }) {
  const samples = [];
  const ackSamples = [];
  for (let i = 0; i < runs; i += 1) {
    const idempotencyKey = `bench-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
    const started = performance.now();
    let resolveDone;
    const done = new Promise((r) => {
      resolveDone = r;
    });
    const handler = (raw) => {
      try {
        const event = JSON.parse(raw.toString("utf8"));
        if (
          event.method === "chat.final" ||
          (event.method === "chat.event" && event.params?.type === "final")
        ) {
          if (
            event.params?.runId === idempotencyKey ||
            event.params?.idempotencyKey === idempotencyKey
          ) {
            resolveDone();
          }
        }
      } catch {
        // ignore
      }
    };
    gateway.on("message", handler);
    try {
      await gateway.request("chat.send", {
        sessionKey,
        message,
        idempotencyKey,
        timeoutMs: 60_000,
      });
      const ackedAt = performance.now() - started;
      ackSamples.push(ackedAt);
      const finished = await Promise.race([
        done.then(() => "final"),
        delay(60_000).then(() => "timeout"),
      ]);
      const totalMs = performance.now() - started;
      samples.push(totalMs);
      console.log(
        `  run ${i + 1}: ack=${fmt(ackedAt)} ${finished === "final" ? "final" : "TIMEOUT"} total=${fmt(totalMs)}`,
      );
    } finally {
      gateway.off?.("message", handler);
    }
    await delay(500);
  }
  return { totalSamples: samples, ackSamples };
}

async function benchmarkGatewayRaw({ gateway, sessionKey, message, runs, model }) {
  const samples = [];
  for (let i = 0; i < runs; i += 1) {
    const started = performance.now();
    try {
      await gateway.request("models.run", {
        sessionKey,
        message,
        model,
        timeoutMs: 60_000,
      });
      samples.push(performance.now() - started);
    } catch (err) {
      console.log(`  models.run unavailable, skipping raw probe: ${err.message}`);
      return [];
    }
    await delay(250);
  }
  return samples;
}

async function main() {
  const args = parseArgs(process.argv);
  const gatewayUrl = args.gateway || process.env.OPENCLAW_GATEWAY_URL;
  const token = args.token || process.env.OPENCLAW_GATEWAY_TOKEN;
  const sessionKey = args["session-key"] || args.session;
  const message = (args.message || "ping").toString();
  const runs = Number.parseInt(args.runs ?? "3", 10) || 3;
  const model = args.model || "openrouter/anthropic/claude-haiku-4.5";
  const openrouterKey = args["openrouter-key"] || process.env.OPENROUTER_API_KEY;

  if (!gatewayUrl || !token || !sessionKey) {
    console.error(
      "usage: node scripts/benchmark-chat-latency.mjs --gateway wss://... --token ... --session-key agent-<id>:main",
    );
    process.exit(1);
  }

  console.log(`Benchmark: model=${model} runs=${runs} message=${JSON.stringify(message)}`);
  console.log(`Gateway: ${gatewayUrl}`);
  console.log(`SessionKey: ${sessionKey}`);
  console.log("");

  const directSamples = [];
  if (!args["skip-direct"] && openrouterKey) {
    console.log("Path 1: direct provider (OpenRouter)");
    for (let i = 0; i < runs; i += 1) {
      try {
        const ms = await benchmarkDirectProvider({ apiKey: openrouterKey, model, message });
        directSamples.push(ms);
        console.log(`  run ${i + 1}: ${fmt(ms)}`);
      } catch (err) {
        console.log(`  run ${i + 1}: ERROR ${err.message}`);
      }
      await delay(250);
    }
  } else if (!args["skip-direct"]) {
    console.log("Path 1: direct provider skipped (no --openrouter-key / OPENROUTER_API_KEY)");
  }
  console.log("");

  const gateway = await connectGateway({ gatewayUrl, token });

  let rawSamples = [];
  if (!args["skip-raw"]) {
    console.log("Path 2: gateway raw models.run (skips agent orchestration)");
    rawSamples = await benchmarkGatewayRaw({ gateway, sessionKey, message, runs, model });
  } else {
    console.log("Path 2: gateway raw skipped");
  }
  console.log("");

  let chatTotalSamples = [];
  let chatAckSamples = [];
  if (!args["skip-chat"]) {
    console.log("Path 3: full WebChat chat.send (real product path)");
    const result = await benchmarkChatSend({ gateway, sessionKey, message, runs });
    chatTotalSamples = result.totalSamples;
    chatAckSamples = result.ackSamples;
  } else {
    console.log("Path 3: chat.send skipped");
  }
  console.log("");

  console.log("Summary:");
  summarize("direct provider", directSamples);
  summarize("gateway raw    ", rawSamples);
  summarize("chat.send ack  ", chatAckSamples);
  summarize("chat.send total", chatTotalSamples);

  if (directSamples.length && chatTotalSamples.length) {
    const directAvg = directSamples.reduce((a, b) => a + b, 0) / directSamples.length;
    const chatAvg =
      chatTotalSamples.reduce((a, b) => a + b, 0) / chatTotalSamples.length;
    const overhead = chatAvg - directAvg;
    console.log("");
    console.log(
      `Orchestration overhead: ~${fmt(overhead)} per turn (chat.send - direct provider).`,
    );
  }

  const sloAckMs = Number.parseInt(args["slo-ack-ms"] ?? "300", 10) || 300;
  const sloFinalMs = Number.parseInt(args["slo-final-ms"] ?? "4000", 10) || 4000;
  const ackP50 = chatAckSamples.length
    ? [...chatAckSamples].sort((a, b) => a - b)[Math.floor(chatAckSamples.length * 0.5)]
    : null;
  const totalP50 = chatTotalSamples.length
    ? [...chatTotalSamples].sort((a, b) => a - b)[Math.floor(chatTotalSamples.length * 0.5)]
    : null;
  const sloFailures = [];
  if (ackP50 !== null && ackP50 > sloAckMs) {
    sloFailures.push(`chat.send ack p50 ${fmt(ackP50)} > target ${sloAckMs}ms`);
  }
  if (totalP50 !== null && totalP50 > sloFinalMs) {
    sloFailures.push(`chat.send total p50 ${fmt(totalP50)} > target ${sloFinalMs}ms`);
  }
  console.log("");
  if (sloFailures.length === 0 && chatTotalSamples.length) {
    console.log(`SLO check: PASS (ack <= ${sloAckMs}ms, total <= ${sloFinalMs}ms p50).`);
  } else if (sloFailures.length) {
    console.log("SLO check: FAIL");
    for (const failure of sloFailures) {
      console.log(`  - ${failure}`);
    }
  }

  gateway.close();
  if (args["slo-strict"] && sloFailures.length) {
    process.exit(2);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
