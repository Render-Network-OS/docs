#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const now = new Date();
const yyyyMmDd = now.toISOString().slice(0, 10);
const command = process.argv[2] || "help";
const args = process.argv.slice(3);

const config = {
  apiKey: (process.env.RUNPOD_API_KEY || "").trim(),
  apiKeyPath:
    process.env.RUNPOD_API_KEY_FILE ||
    path.join("555stream", ".secrets", "runpod.key"),
  outputDir:
    process.env.OUTPUT_DIR ||
    path.join("555stream", "evidence", "awsless", yyyyMmDd),
  timeoutMs: Number.parseInt(process.env.RUNPOD_PROBE_TIMEOUT_MS || "30000", 10),
};

const usage = `Usage:
  node scripts/awsless/runpod-pod.mjs list
  node scripts/awsless/runpod-pod.mjs create --payload <payload.json> --yes
  node scripts/awsless/runpod-pod.mjs get <pod-id>
  node scripts/awsless/runpod-pod.mjs stop <pod-id> --yes
  node scripts/awsless/runpod-pod.mjs delete <pod-id> --yes

Safety:
  - create/stop/delete require --yes.
  - payloads containing replace-with placeholders are rejected.
  - output redacts env values that look secret-bearing.
`;

if (command === "help" || command === "--help" || command === "-h") {
  console.log(usage);
  process.exit(0);
}

if (!config.apiKey) {
  config.apiKey = (await readOptionalFile(config.apiKeyPath)).trim();
}

if (!config.apiKey) {
  throw new Error(
    `Missing RunPod API key. Set RUNPOD_API_KEY or create ${config.apiKeyPath}`,
  );
}

const result = await run();
await mkdir(config.outputDir, { recursive: true });
const outputPath = path.join(
  config.outputDir,
  `runpod-pod-${command}-${Date.now()}.json`,
);
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);

console.log(JSON.stringify(result, null, 2));
console.log(`Evidence written to ${outputPath}`);

if (!result.ok) {
  process.exitCode = 1;
}

async function run() {
  switch (command) {
    case "list":
      return listPods();
    case "create":
      return createPod();
    case "get":
      return getPod();
    case "stop":
      return stopPod();
    case "delete":
      return deletePod();
    default:
      return {
        ok: false,
        checkedAt: now.toISOString(),
        error: `Unknown command: ${command}`,
        usage,
      };
  }
}

async function listPods() {
  const response = await runpodFetch("/v1/pods");
  return formatResponse("list pods", response);
}

async function createPod() {
  requireYes();
  const payloadPath = valueAfter("--payload");
  if (!payloadPath) {
    throw new Error("create requires --payload <payload.json>");
  }

  const payloadText = await readFile(payloadPath, "utf8");
  if (/replace-with|REPLACE_WITH|changeme|todo/i.test(payloadText)) {
    return {
      ok: false,
      checkedAt: now.toISOString(),
      command,
      payloadPath,
      error: "Payload still contains placeholder values; refusing to create a billable pod.",
    };
  }

  const payload = JSON.parse(payloadText);
  const response = await runpodFetch("/v1/pods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return formatResponse("create pod", response, { payloadPath });
}

async function getPod() {
  const podId = args[0];
  if (!podId) throw new Error("get requires <pod-id>");
  const response = await runpodFetch(`/v1/pods/${encodeURIComponent(podId)}`);
  return formatResponse("get pod", response, { podId });
}

async function stopPod() {
  requireYes();
  const podId = args[0];
  if (!podId) throw new Error("stop requires <pod-id>");
  const response = await runpodFetch(`/v1/pods/${encodeURIComponent(podId)}/stop`, {
    method: "POST",
  });
  return formatResponse("stop pod", response, { podId });
}

async function deletePod() {
  requireYes();
  const podId = args[0];
  if (!podId) throw new Error("delete requires <pod-id>");
  const response = await runpodFetch(`/v1/pods/${encodeURIComponent(podId)}`, {
    method: "DELETE",
  });
  return formatResponse("delete pod", response, { podId });
}

async function runpodFetch(pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    return await fetch(`https://rest.runpod.io${pathname}`, {
      method: options.method || "GET",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "555stream-runpod-pod/1.0",
        ...(options.headers || {}),
      },
      body: options.body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function formatResponse(label, response, extra = {}) {
  const text = await response.text();
  return {
    ok: response.ok,
    checkedAt: now.toISOString(),
    label,
    command,
    status: response.status,
    ...extra,
    body: sanitizeJsonOrText(text),
  };
}

function requireYes() {
  if (!args.includes("--yes")) {
    throw new Error(`${command} requires --yes because it can change billable resources`);
  }
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index < 0) return "";
  return args[index + 1] || "";
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function sanitizeJsonOrText(text) {
  const sanitized = sanitizeText(text);
  try {
    return redactSecretBearingValues(JSON.parse(sanitized));
  } catch {
    return sanitized.slice(0, 4000);
  }
}

function redactSecretBearingValues(value, key = "") {
  if (key === "dockerStartCmd") {
    return Array.isArray(value)
      ? value.map((entry) =>
          typeof entry === "string" && entry.length > 240
            ? `${entry.slice(0, 240)}...[truncated ${entry.length} chars]`
            : entry,
        )
      : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecretBearingValues(item));
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      out[entryKey] = redactSecretBearingValues(entryValue, entryKey);
    }
    return out;
  }

  if (/secret|token|key|password|private|cookie|auth/i.test(key)) {
    return value == null || value === "" ? value : "[redacted]";
  }

  return value;
}

function sanitizeText(text) {
  return String(text)
    .replaceAll(config.apiKey, "[redacted-runpod-key]")
    .replace(/rpa_[A-Za-z0-9]+/g, "[redacted-runpod-key]");
}
