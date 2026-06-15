#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const now = new Date();
const yyyyMmDd = now.toISOString().slice(0, 10);

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

if (!config.apiKey) {
  config.apiKey = (await readOptionalFile(config.apiKeyPath)).trim();
}

if (!config.apiKey) {
  throw new Error(
    `Missing RunPod API key. Set RUNPOD_API_KEY or create ${config.apiKeyPath}`,
  );
}

const startedAt = Date.now();
const response = await fetchWithTimeout("https://rest.runpod.io/v1/openapi.json", {
  headers: {
    authorization: `Bearer ${config.apiKey}`,
    accept: "application/json",
    "user-agent": "555stream-runpod-openapi/1.0",
  },
});

const text = await response.text();
const parsed = safeJson(text);
const summary = {
  ok: response.ok && Boolean(parsed?.paths),
  checkedAt: now.toISOString(),
  status: response.status,
  elapsedMs: Date.now() - startedAt,
  openapi: parsed?.openapi,
  title: parsed?.info?.title,
  version: parsed?.info?.version,
  pathSample: Object.keys(parsed?.paths || {}).slice(0, 30),
  podPaths: summarizePaths(parsed?.paths || {}, /^\/(?:v1\/)?pods/),
  registryAuthPaths: summarizePaths(
    parsed?.paths || {},
    /^\/(?:v1\/)?containerregistryauth/,
  ),
  podCreateRequest: summarizeRequestBody(
    parsed?.paths?.["/v1/pods"]?.post || parsed?.paths?.["/pods"]?.post,
    parsed,
  ),
  note: response.ok ? undefined : sanitizeText(text).slice(0, 2000),
};

await mkdir(config.outputDir, { recursive: true });
const outputPath = path.join(config.outputDir, "runpod-openapi-summary.json");
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
console.log(`Evidence written to ${outputPath}`);

if (!summary.ok) {
  process.exitCode = 1;
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function summarizePaths(paths, matcher) {
  return Object.entries(paths)
    .filter(([pathname]) => matcher.test(pathname))
    .map(([pathname, methods]) => ({
      path: pathname,
      methods: Object.keys(methods || {}).sort(),
      summaries: Object.fromEntries(
        Object.entries(methods || {}).map(([method, spec]) => [
          method,
          spec?.summary || spec?.operationId || "",
        ]),
      ),
    }));
}

function summarizeRequestBody(operation, document) {
  const content = operation?.requestBody?.content?.["application/json"];
  const schema = deref(content?.schema, document);
  if (!schema) return null;

  return {
    required: schema.required || [],
    properties: Object.fromEntries(
      Object.entries(schema.properties || {}).map(([key, value]) => [
        key,
        summarizeSchema(deref(value, document), document),
      ]),
    ),
  };
}

function summarizeSchema(schema, document) {
  if (!schema) return {};
  return {
    type: schema.type,
    format: schema.format,
    default: schema.default,
    enum: schema.enum,
    description: schema.description,
    items: schema.items ? summarizeSchema(deref(schema.items, document), document) : undefined,
  };
}

function deref(value, document) {
  if (value?.$ref?.startsWith("#/")) {
    return value.$ref
      .slice(2)
      .split("/")
      .reduce((node, part) => node?.[part], document);
  }
  return value;
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sanitizeText(text) {
  return String(text)
    .replaceAll(config.apiKey, "[redacted-runpod-key]")
    .replace(/rpa_[A-Za-z0-9]+/g, "[redacted-runpod-key]");
}
