#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const now = new Date();
const yyyyMmDd = now.toISOString().slice(0, 10);

const config = {
  apiKey: (process.env.RUNPOD_API_KEY || "").trim(),
  outputDir:
    process.env.OUTPUT_DIR ||
    path.join("555stream", "evidence", "awsless", yyyyMmDd),
  timeoutMs: Number.parseInt(process.env.RUNPOD_PROBE_TIMEOUT_MS || "15000", 10),
};

if (!config.apiKey) {
  config.apiKey = (await readStdin()).trim();
}

if (!config.apiKey) {
  throw new Error("Provide RUNPOD_API_KEY in env or stdin");
}

const results = [];

await probeGraphql();
await probeRest();

const summary = {
  checkedAt: now.toISOString(),
  outputDir: config.outputDir,
  results,
  passed: results.some((result) => result.ok),
};

await mkdir(config.outputDir, { recursive: true });
const outputPath = path.join(config.outputDir, "runpod-inventory.json");
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
console.log(`Evidence written to ${outputPath}`);

if (!summary.passed) {
  process.exitCode = 1;
}

async function probeGraphql() {
  const query = `
    query RunPodSchemaProbe {
      __schema {
        queryType {
          fields {
            name
            args {
              name
              type { kind name ofType { kind name ofType { kind name } } }
            }
            type { kind name ofType { kind name ofType { kind name } } }
          }
        }
        mutationType {
          fields {
            name
            args {
              name
              type { kind name ofType { kind name ofType { kind name } } }
            }
            type { kind name ofType { kind name ofType { kind name } } }
          }
        }
      }
    }
  `;

  for (const authMode of ["bearer", "api_key"]) {
    const startedAt = Date.now();
    try {
      const response = await graphqlFetch(query, {}, authMode);
      const text = await response.text();
      const parsed = safeJson(text);
      const schema = parsed?.data?.__schema;
      const queryFields = schema?.queryType?.fields || [];
      const mutationFields = schema?.mutationType?.fields || [];
      const interestingQueryFields = queryFields
        .filter((field) => /pod|endpoint|template|gpu|container|network|server/i.test(field.name))
        .map(formatGraphqlField)
        .slice(0, 80);
      const interestingMutationFields = mutationFields
        .filter((field) => /pod|endpoint|template|gpu|container|network|server/i.test(field.name))
        .map(formatGraphqlField)
        .slice(0, 80);

      results.push({
        label: `runpod graphql schema (${authMode})`,
        ok: response.ok && Boolean(schema),
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        queryFieldCount: queryFields.length,
        mutationFieldCount: mutationFields.length,
        interestingQueryFields,
        interestingMutationFields,
        errors: sanitizeGraphqlErrors(parsed?.errors),
        note: response.ok && !schema ? sanitizeBody(text) : undefined,
      });

      if (response.ok && schema) {
        await probeLikelyGraphqlInventory(authMode, queryFields);
        return;
      }
    } catch (error) {
      results.push({
        label: `runpod graphql schema (${authMode})`,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        error: sanitizeText(error instanceof Error ? error.message : String(error)),
      });
    }
  }
}

async function probeLikelyGraphqlInventory(authMode, queryFields) {
  const fieldNames = new Set(queryFields.map((field) => field.name));
  const candidateQueries = [];

  if (fieldNames.has("myself")) {
    candidateQueries.push({
      label: "runpod graphql myself",
      query: "query RunPodMyself { myself { id email } }",
    });
    candidateQueries.push({
      label: "runpod graphql myself pods",
      query:
        "query RunPodMyselfPods { myself { pods { id name desiredStatus imageName gpuCount containerDiskInGb volumeInGb costPerHr } } }",
    });
  }

  for (const field of ["pods", "endpoints", "templates", "gpuTypes"]) {
    if (fieldNames.has(field)) {
      candidateQueries.push({
        label: `runpod graphql ${field}`,
        query: `query RunPodInventory { ${field} { id name } }`,
      });
    }
  }

  for (const candidate of candidateQueries) {
    const startedAt = Date.now();
    try {
      const response = await graphqlFetch(candidate.query, {}, authMode);
      const text = await response.text();
      const parsed = safeJson(text);
      results.push({
        label: candidate.label,
        ok: response.ok && !parsed?.errors,
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        dataPreview: sanitizeJson(parsed?.data),
        errors: sanitizeGraphqlErrors(parsed?.errors),
      });
    } catch (error) {
      results.push({
        label: candidate.label,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        error: sanitizeText(error instanceof Error ? error.message : String(error)),
      });
    }
  }
}

async function probeRest() {
  const paths = [
    "/v1/pods",
    "/v1/endpoints",
    "/v1/templates",
    "/v1/networkvolumes",
    "/v1/containerregistryauth",
  ];

  for (const pathname of paths) {
    const startedAt = Date.now();
    try {
      const response = await fetchWithTimeout(`https://rest.runpod.io${pathname}`, {
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          accept: "application/json",
          "user-agent": "555stream-runpod-inventory/1.0",
        },
      });
      const text = await response.text();
      results.push({
        label: `runpod rest ${pathname}`,
        ok: response.ok,
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        preview: sanitizeBody(text),
      });
    } catch (error) {
      results.push({
        label: `runpod rest ${pathname}`,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        error: sanitizeText(error instanceof Error ? error.message : String(error)),
      });
    }
  }
}

async function graphqlFetch(query, variables, authMode) {
  const url =
    authMode === "api_key"
      ? `https://api.runpod.io/graphql?api_key=${encodeURIComponent(config.apiKey)}`
      : "https://api.runpod.io/graphql";
  const headers = {
    "content-type": "application/json",
    accept: "application/json",
    "user-agent": "555stream-runpod-inventory/1.0",
  };

  if (authMode === "bearer") {
    headers.authorization = `Bearer ${config.apiKey}`;
  }

  return fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
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

function formatGraphqlField(field) {
  return {
    name: field.name,
    args: (field.args || []).map((arg) => ({
      name: arg.name,
      type: formatGraphqlType(arg.type),
    })),
    type: formatGraphqlType(field.type),
  };
}

function formatGraphqlType(type) {
  if (!type) return "";
  const parts = [];
  let current = type;
  while (current) {
    parts.push(current.name || current.kind);
    current = current.ofType;
  }
  return parts.join(".");
}

function sanitizeGraphqlErrors(errors) {
  if (!Array.isArray(errors)) return undefined;
  return errors.map((error) => sanitizeText(error?.message || String(error))).slice(0, 8);
}

function sanitizeJson(value) {
  if (value == null) return value;
  return JSON.parse(sanitizeText(JSON.stringify(value)).slice(0, 4000));
}

function sanitizeBody(text) {
  return sanitizeText(text).slice(0, 1000);
}

function sanitizeText(text) {
  return String(text)
    .replaceAll(config.apiKey, "[redacted-runpod-key]")
    .replace(/rpa_[A-Za-z0-9]+/g, "[redacted-runpod-key]");
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
