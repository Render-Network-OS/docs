#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const now = new Date();
const yyyyMmDd = now.toISOString().slice(0, 10);

const config = {
  controlPlaneUrl: cleanBaseUrl(process.env.CONTROL_PLANE_URL || ""),
  aliceWorkerUrl: cleanBaseUrl(process.env.ALICE_WORKER_URL || ""),
  cloudflareUrl: cleanBaseUrl(process.env.CLOUDFLARE_URL || ""),
  aliceToken:
    process.env.ALICE_API_TOKEN ||
    process.env.ELIZA_API_TOKEN ||
    process.env.MILAIDY_API_TOKEN ||
    "",
  outputDir:
    process.env.OUTPUT_DIR ||
    path.join("555stream", "evidence", "awsless", yyyyMmDd),
  requireEmoteCount: Number.parseInt(process.env.REQUIRE_EMOTE_COUNT || "41", 10),
  timeoutMs: Number.parseInt(process.env.PROBE_TIMEOUT_MS || "15000", 10),
};

const results = [];

if (!config.controlPlaneUrl && !config.aliceWorkerUrl && !config.cloudflareUrl) {
  throw new Error(
    "Set at least one of CONTROL_PLANE_URL, ALICE_WORKER_URL, or CLOUDFLARE_URL",
  );
}

if (config.controlPlaneUrl) {
  await checkText("control-plane health", `${config.controlPlaneUrl}/healthz`, {
    expectStatus: 200,
  });
}

if (config.cloudflareUrl) {
  await checkText("cloudflare-fronted health", `${config.cloudflareUrl}/healthz`, {
    expectStatus: 200,
  });
  await checkText("cloudflare api-router health", `${config.cloudflareUrl}/api/health`, {
    expectStatus: 200,
    include: ["edge"],
    softInclude: true,
  });
}

if (config.aliceWorkerUrl) {
  await checkText("alice health", `${config.aliceWorkerUrl}/healthz`, {
    expectStatus: 200,
    soft: true,
  });
  await checkText("alice companion html", `${config.aliceWorkerUrl}/companion/`, {
    expectStatus: 200,
    include: ["html"],
    softInclude: true,
  });
  await checkText(
    "alice broadcast page",
    `${config.aliceWorkerUrl}/broadcast/alice-cam`,
    {
      expectStatus: 200,
      soft: true,
    },
  );
  await checkText(
    "alice draco decoder",
    `${config.aliceWorkerUrl}/vrm-decoders/draco/draco_wasm_wrapper.js`,
    {
      expectStatus: 200,
      soft: true,
    },
  );
  await checkEmotes(`${config.aliceWorkerUrl}/api/emotes`);
}

const summary = {
  checkedAt: now.toISOString(),
  config: {
    controlPlaneUrl: redactUrl(config.controlPlaneUrl),
    aliceWorkerUrl: redactUrl(config.aliceWorkerUrl),
    cloudflareUrl: redactUrl(config.cloudflareUrl),
    outputDir: config.outputDir,
    requireEmoteCount: config.requireEmoteCount,
  },
  results,
  passed: results.every((result) => result.ok || result.soft),
};

await mkdir(config.outputDir, { recursive: true });
const outputPath = path.join(config.outputDir, "awsless-alice-probe.json");
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
console.log(`Evidence written to ${outputPath}`);

if (!summary.passed) {
  process.exitCode = 1;
}

function cleanBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function redactUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.username || url.password) {
      url.username = url.username ? "redacted" : "";
      url.password = url.password ? "redacted" : "";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return "invalid-url-redacted";
  }
}

async function checkText(label, url, options = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(url);
    const text = await response.text();
    const okStatus =
      options.expectStatus == null
        ? response.status >= 200 && response.status < 300
        : response.status === options.expectStatus;
    const includes = options.include || [];
    const includeOk =
      includes.length === 0 ||
      includes.some((needle) => text.toLowerCase().includes(needle.toLowerCase()));
    const ok = okStatus && (includeOk || options.softInclude);
    results.push({
      label,
      url: redactUrl(url),
      status: response.status,
      ok,
      soft: Boolean(options.soft) || Boolean(options.softInclude && okStatus),
      elapsedMs: Date.now() - startedAt,
      bytes: text.length,
      note: includeOk
        ? undefined
        : includes.length > 0
          ? `response did not include any of: ${includes.join(", ")}`
          : undefined,
    });
  } catch (error) {
    results.push({
      label,
      url: redactUrl(url),
      ok: false,
      soft: Boolean(options.soft),
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function checkEmotes(url) {
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(url);
    const text = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Keep parsed null; status/body size still gives useful evidence.
    }
    const emotes = extractEmoteList(parsed);
    const ids = emotes
      .map((item) => item?.id || item?.name || item?.key)
      .filter(Boolean)
      .slice(0, 80);
    const knownIds = ["wave", "agreeing", "gangnam-style", "dance-happy"];
    const hasKnownIds = knownIds.every((id) => ids.includes(id));
    const countOk = emotes.length >= config.requireEmoteCount;
    results.push({
      label: "alice emote catalog",
      url: redactUrl(url),
      status: response.status,
      ok: response.ok && countOk && hasKnownIds,
      soft: false,
      elapsedMs: Date.now() - startedAt,
      bytes: text.length,
      emoteCount: emotes.length,
      knownIdsPresent: knownIds.filter((id) => ids.includes(id)),
      note:
        response.ok && !parsed
          ? "response was not JSON"
          : !countOk
            ? `expected at least ${config.requireEmoteCount} emotes`
            : !hasKnownIds
              ? `missing one or more known ids: ${knownIds.join(", ")}`
              : undefined,
    });
  } catch (error) {
    results.push({
      label: "alice emote catalog",
      url: redactUrl(url),
      ok: false,
      soft: false,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function extractEmoteList(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.emotes)) return parsed.emotes;
  if (Array.isArray(parsed?.data)) return parsed.data;
  if (Array.isArray(parsed?.actions)) return parsed.actions;
  if (parsed && typeof parsed === "object") {
    for (const value of Object.values(parsed)) {
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: authHeaders(),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders() {
  const headers = {
    "user-agent": "555stream-awsless-probe/1.0",
    accept: "application/json,text/html,*/*",
  };
  if (config.aliceToken) {
    headers.authorization = `Bearer ${config.aliceToken}`;
    headers["x-api-key"] = config.aliceToken;
    headers["x-eliza-api-token"] = config.aliceToken;
  }
  return headers;
}
