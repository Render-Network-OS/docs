#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, readFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const now = new Date();
const yyyyMmDd = now.toISOString().slice(0, 10);
const command = process.argv[2] || "help";
const args = process.argv.slice(3);

const config = {
  outputDir:
    process.env.OUTPUT_DIR ||
    path.join("555stream", "evidence", "awsless", yyyyMmDd),
  secretDir:
    process.env.RUNPOD_SECRET_DIR ||
    path.join("555stream", ".secrets"),
  timeoutMs: Number.parseInt(process.env.RUNPOD_BOOTSTRAP_TIMEOUT_MS || "300000", 10),
  cpuFlavorIds: splitCsv(process.env.RUNPOD_CPU_FLAVOR_IDS || "cpu3g,cpu3c"),
  cpuFlavorPriority: process.env.RUNPOD_CPU_FLAVOR_PRIORITY || "availability",
  vcpuCount: Number.parseInt(process.env.RUNPOD_VCPU_COUNT || "2", 10),
  containerDiskInGb: Number.parseInt(process.env.RUNPOD_CONTAINER_DISK_GB || "20", 10),
  volumeInGb: Number.parseInt(process.env.RUNPOD_VOLUME_GB || "40", 10),
};

const usage = `Usage:
  node scripts/awsless/runpod-bootstrap.mjs write-payload [--smoke] [--output <payload.json>] [--control-plane-url <url>]
  node scripts/awsless/runpod-bootstrap.mjs write-diagnostic-payload [--output <payload.json>]
  node scripts/awsless/runpod-bootstrap.mjs install-server --base-url <url> --token-file <file>
  node scripts/awsless/runpod-bootstrap.mjs upload --base-url <url> --token-file <file> --tarball <file>
  node scripts/awsless/runpod-bootstrap.mjs upload-chunked --base-url <url> --token-file <file> --tarball <file>
  node scripts/awsless/runpod-bootstrap.mjs action --base-url <url> --token-file <file> --action <build|start|stop-runtime|status|logs>

Notes:
  - write-payload uses a public Node base image and does not require GHCR.
  - create the pod with scripts/awsless/runpod-pod.mjs after reviewing the payload.
  - upload/action never print the bootstrap token.
`;

if (command === "help" || command === "--help" || command === "-h") {
  console.log(usage);
  process.exit(0);
}

const result = await run();
await mkdir(config.outputDir, { recursive: true });
const outputPath = path.join(
  config.outputDir,
  `runpod-bootstrap-${command}-${Date.now()}.json`,
);
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
console.log(`Evidence written to ${outputPath}`);

if (!result.ok) {
  process.exitCode = 1;
}

async function run() {
  switch (command) {
    case "write-payload":
      return writePayload();
    case "write-diagnostic-payload":
      return writeDiagnosticPayload();
    case "install-server":
      return installServer();
    case "upload":
      return uploadTarball();
    case "upload-chunked":
      return uploadTarballChunked();
    case "clone":
      return callClone();
    case "action":
      return callAction();
    default:
      return { ok: false, checkedAt: now.toISOString(), error: `Unknown command: ${command}`, usage };
  }
}

async function writeDiagnosticPayload() {
  const payloadPath =
    valueAfter("--output") ||
    path.join(config.secretDir, "runpod-proxy-diagnostic-pod.payload.json");
  const diagnosticServer = [
    "const http=require('node:http')",
    "const port=Number(process.env.PORT||3999)",
    "http.createServer((req,res)=>{",
    "res.setHeader('content-type','application/json')",
    "res.end(JSON.stringify({ok:true,service:'runpod-proxy-diagnostic',url:req.url,at:new Date().toISOString()}))",
    "}).listen(port,'0.0.0.0')",
  ].join(";");
  const payload = {
    name: "alice-awsless-proxy-diagnostic",
    cloudType: "SECURE",
    computeType: "CPU",
    cpuFlavorIds: ["cpu3g", "cpu3c"],
    cpuFlavorPriority: "availability",
    containerDiskInGb: 20,
    imageName: "node:22-bookworm-slim",
    dockerEntrypoint: [],
    dockerStartCmd: ["node", "-e", diagnosticServer],
    env: {
      PORT: "3999",
    },
    ports: ["3999/http"],
    supportPublicIp: true,
    locked: false,
    interruptible: true,
  };

  await mkdir(path.dirname(payloadPath), { recursive: true });
  await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600,
  });

  return {
    ok: true,
    checkedAt: now.toISOString(),
    payloadPath,
    imageName: payload.imageName,
    ports: payload.ports,
    computeType: payload.computeType,
    containerDiskInGb: payload.containerDiskInGb,
    placeholdersRemaining: countPlaceholders(payload),
    next: [
      "Create with: node scripts/awsless/runpod-pod.mjs create --payload <payload> --yes",
      "Probe with: curl -fsS https://<pod-id>-3999.proxy.runpod.net/health",
      "Tear down with stop/delete immediately after evidence.",
    ],
  };
}

async function writePayload() {
  const payloadPath =
    valueAfter("--output") ||
    path.join(config.secretDir, "runpod-alice-bootstrap-pod.payload.json");
  const tokenPath =
    valueAfter("--token-output") ||
    path.join(config.secretDir, "runpod-alice-bootstrap.token");
  const token = randomBytes(32).toString("hex");
  const smokeMode = args.includes("--smoke");
  const controlPlaneUrl = valueAfter("--control-plane-url");
  const runtimeApiToken = randomBytes(32).toString("hex");
  const credentialMasterKey = randomBytes(32).toString("hex");
  const payload = {
    name: "alice-awsless-bootstrap",
    cloudType: "SECURE",
    computeType: "CPU",
    cpuFlavorIds: config.cpuFlavorIds,
    cpuFlavorPriority: config.cpuFlavorPriority,
    vcpuCount: config.vcpuCount,
    containerDiskInGb: config.containerDiskInGb,
    imageName: "node:22-bookworm-slim",
    dockerEntrypoint: [],
    dockerStartCmd: ["node", "-e", stageOneServerSource()],
    env: {
      BOOTSTRAP_PORT: "3999",
      BOOTSTRAP_TOKEN: token,
      BOOTSTRAP_WORKSPACE: "/workspace",
      NODE_ENV: "production",
      PORT: "3000",
      MILADY_API_BIND: "0.0.0.0",
      MILAIDY_AUTH_DISABLED: smokeMode ? "1" : "0",
      MILAIDY_API_TOKEN: smokeMode ? runtimeApiToken : "replace-with-secret",
      ELIZA_API_TOKEN: smokeMode ? runtimeApiToken : "replace-with-secret",
      MILAIDY_CREDENTIALS_MASTER_KEY: smokeMode
        ? credentialMasterKey
        : "replace-with-secret",
      ANTHROPIC_API_KEY: smokeMode ? "" : "replace-with-secret",
      OPENAI_API_KEY: "",
      STREAM555_BASE_URL: smokeMode
        ? controlPlaneUrl
        : "https://replace-with-railway-control-plane.up.railway.app",
      STREAM555_AGENT_TOKEN: smokeMode ? "" : "replace-with-secret",
      STREAM555_AGENT_API_KEY: smokeMode ? "" : "replace-with-secret",
      STREAM555_REQUIRE_APPROVALS: "false",
      STREAM555_CONTROL_PLUGIN_ENABLED: "true",
      STREAM_PLUGIN_ENABLED: "true",
      STREAM555_DEFAULT_SESSION_ID: "alice",
      STREAM555_DEST_SYNC_ON_GO_LIVE: "false",
      STREAM555_DEST_TWITCH_ENABLED: "false",
      STREAM555_DEST_KICK_ENABLED: "false",
      STREAM555_DEST_YOUTUBE_ENABLED: "false",
      STREAM555_DEST_PUMPFUN_ENABLED: "false",
      STREAM555_DEST_X_ENABLED: "false",
      STREAM555_DEST_FACEBOOK_ENABLED: "false",
      STREAM555_DEST_CUSTOM_ENABLED: "false",
    },
    ports: ["3000/http", "3999/http"],
    supportPublicIp: true,
    volumeInGb: config.volumeInGb,
    volumeMountPath: "/workspace",
    locked: false,
    interruptible: true,
  };

  await mkdir(path.dirname(payloadPath), { recursive: true });
  await mkdir(path.dirname(tokenPath), { recursive: true });
  await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600,
  });
  await writeFile(tokenPath, `${token}\n`, { mode: 0o600 });

  return {
    ok: true,
    checkedAt: now.toISOString(),
    payloadPath,
    tokenPath,
    smokeMode,
    imageName: payload.imageName,
    ports: payload.ports,
    computeType: payload.computeType,
    cpuFlavorIds: payload.cpuFlavorIds,
    cpuFlavorPriority: payload.cpuFlavorPriority,
    vcpuCount: payload.vcpuCount,
    containerDiskInGb: payload.containerDiskInGb,
    volumeInGb: payload.volumeInGb,
    volumeMountPath: payload.volumeMountPath,
    placeholdersRemaining: countPlaceholders(payload),
    next: [
      smokeMode
        ? "Smoke payload has no placeholders; create can proceed under the recorded test window."
        : "Fill secret placeholder values in the payload before create.",
      "Create with: node scripts/awsless/runpod-pod.mjs create --payload <payload> --yes",
      "Install server with: node scripts/awsless/runpod-bootstrap.mjs install-server --base-url <bootstrap-url> --token-file <token>",
      "Upload with: node scripts/awsless/runpod-bootstrap.mjs upload --base-url <bootstrap-url> --token-file <token> --tarball <tarball>",
      "Build with: node scripts/awsless/runpod-bootstrap.mjs action --base-url <bootstrap-url> --token-file <token> --action build",
      "Start Alice with: node scripts/awsless/runpod-bootstrap.mjs action --base-url <bootstrap-url> --token-file <token> --action start",
    ],
  };
}

async function installServer() {
  const baseUrl = requiredValue("--base-url");
  const token = await readToken(requiredValue("--token-file"));
  const serverSource = await readFile(
    path.join("scripts", "awsless", "runpod-bootstrap-server.mjs"),
    "utf8",
  );
  const response = await fetchWithTimeout(
    `${trimSlash(baseUrl)}/install?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      body: serverSource,
      headers: {
        "content-type": "text/javascript",
        "user-agent": "555stream-runpod-bootstrap/1.0",
      },
    },
  );
  return formatResponse("install-server", response);
}

async function uploadTarballChunked() {
  const baseUrl = requiredValue("--base-url");
  const token = await readToken(requiredValue("--token-file"));
  const tarball = requiredValue("--tarball");
  const tarballStat = await stat(tarball);
  const sha256 = await sha256File(tarball);
  const chunkSize = Number.parseInt(
    process.env.RUNPOD_BOOTSTRAP_UPLOAD_CHUNK_BYTES || `${32 * 1024 * 1024}`,
    10,
  );
  const initResponse = await fetchWithTimeout(
    `${trimSlash(baseUrl)}/upload/init?token=${encodeURIComponent(token)}&bytes=${tarballStat.size}&sha256=${encodeURIComponent(sha256)}`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "user-agent": "555stream-runpod-bootstrap/1.0",
      },
    },
  );
  const init = await responseSummary(initResponse);
  if (!init.ok) {
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      label: "upload-chunked",
      phase: "init",
      tarball,
      sizeBytes: tarballStat.size,
      sha256,
      init,
    };
  }

  const chunkResults = [];
  const file = await open(tarball, "r");
  try {
    const buffer = Buffer.allocUnsafe(chunkSize);
    for (let offset = 0; offset < tarballStat.size; offset += chunkSize) {
      const { bytesRead } = await file.read(buffer, 0, chunkSize, offset);
      const chunk = buffer.subarray(0, bytesRead);
      const response = await fetchWithTimeout(
        `${trimSlash(baseUrl)}/upload/chunk?token=${encodeURIComponent(token)}&offset=${offset}`,
        {
          method: "POST",
          body: chunk,
          headers: {
            "content-type": "application/octet-stream",
            "content-length": String(bytesRead),
            "user-agent": "555stream-runpod-bootstrap/1.0",
          },
        },
      );
      const chunkSummary = await responseSummary(response);
      chunkResults.push({
        ok: chunkSummary.ok,
        status: chunkSummary.status,
        offset,
        bytes: bytesRead,
      });
      if (!chunkSummary.ok) {
        return {
          ok: false,
          checkedAt: new Date().toISOString(),
          label: "upload-chunked",
          phase: "chunk",
          tarball,
          sizeBytes: tarballStat.size,
          sha256,
          chunkSize,
          failedChunk: chunkResults.at(-1),
          chunksCompleted: chunkResults.length - 1,
        };
      }
    }
  } finally {
    await file.close();
  }

  const completeResponse = await fetchWithTimeout(
    `${trimSlash(baseUrl)}/upload/complete?token=${encodeURIComponent(token)}&bytes=${tarballStat.size}&sha256=${encodeURIComponent(sha256)}`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "user-agent": "555stream-runpod-bootstrap/1.0",
      },
    },
  );
  const complete = await responseSummary(completeResponse);

  return {
    ok: complete.ok,
    checkedAt: new Date().toISOString(),
    label: "upload-chunked",
    tarball,
    sizeBytes: tarballStat.size,
    sha256,
    chunkSize,
    chunkCount: chunkResults.length,
    chunksOk: chunkResults.every((entry) => entry.ok),
    complete,
  };
}

async function uploadTarball() {
  const baseUrl = requiredValue("--base-url");
  const token = await readToken(requiredValue("--token-file"));
  const tarball = requiredValue("--tarball");
  const response = await fetchWithTimeout(
    `${trimSlash(baseUrl)}/upload?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      body: Readable.toWeb(createReadStream(tarball)),
      duplex: "half",
      headers: {
        "content-type": "application/gzip",
        "user-agent": "555stream-runpod-bootstrap/1.0",
      },
    },
  );
  return formatResponse("upload", response);
}

async function callAction() {
  const baseUrl = requiredValue("--base-url");
  const token = await readToken(requiredValue("--token-file"));
  const action = requiredValue("--action");
  const method = action === "status" || action === "logs" ? "GET" : "POST";
  if (!["build", "start", "stop-runtime", "status", "logs"].includes(action)) {
    throw new Error("--action must be one of build, start, stop-runtime, status, logs");
  }
  const response = await fetchWithTimeout(
    `${trimSlash(baseUrl)}/${action}?token=${encodeURIComponent(token)}`,
    {
      method,
      headers: {
        accept: "application/json",
        "user-agent": "555stream-runpod-bootstrap/1.0",
      },
    },
  );
  return formatResponse(action, response);
}

async function callClone() {
  const baseUrl = requiredValue("--base-url");
  const token = await readToken(requiredValue("--token-file"));
  const miladyRepo = requiredValue("--milady-repo");
  const miladyBranch = requiredValue("--milady-branch");
  const miladyKeyB64 = (await readFile(requiredValue("--milady-key"))).toString("base64");
  const response = await fetchWithTimeout(
    `${trimSlash(baseUrl)}/clone?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "user-agent": "555stream-runpod-bootstrap/1.0",
      },
      body: JSON.stringify({ miladyRepo, miladyBranch, miladyKeyB64 }),
    },
  );
  return formatResponse("clone", response);
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

async function formatResponse(label, response) {
  const summary = await responseSummary(response);
  return {
    ok: summary.ok,
    checkedAt: new Date().toISOString(),
    label,
    status: summary.status,
    body: summary.body,
  };
}

async function responseSummary(response) {
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body: sanitizeJsonOrText(text),
  };
}

async function readToken(tokenFile) {
  return (await readFile(tokenFile, "utf8")).trim();
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function stageOneServerSource() {
  return [
    "const http=require('node:http')",
    "const fs=require('node:fs/promises')",
    "const path=require('node:path')",
    "const {pathToFileURL}=require('node:url')",
    "const port=Number(process.env.BOOTSTRAP_PORT||3999)",
    "const token=process.env.BOOTSTRAP_TOKEN||''",
    "const workspace=process.env.BOOTSTRAP_WORKSPACE||'/workspace'",
    "const serverPath=path.join(workspace,'bootstrap','server.mjs')",
    "let installing=false",
    "function send(res,status,body){res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body)+'\\n')}",
    "function authed(url){return token&&url.searchParams.get('token')===token}",
    "const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);if(url.pathname==='/health')return send(res,200,{ok:true,service:'alice-runpod-bootstrap-stage1',installed:false,at:new Date().toISOString()});if(req.method==='POST'&&url.pathname==='/install'){if(!authed(url))return send(res,401,{ok:false,error:'Unauthorized'});if(installing)return send(res,409,{ok:false,error:'Install already in progress'});installing=true;await fs.mkdir(path.dirname(serverPath),{recursive:true});const chunks=[];for await(const chunk of req)chunks.push(chunk);await fs.writeFile(serverPath,Buffer.concat(chunks),{mode:0o600});send(res,200,{ok:true,service:'alice-runpod-bootstrap-stage1',installed:true,path:serverPath,bytes:Buffer.concat(chunks).length});setTimeout(()=>server.close(async()=>{await import(pathToFileURL(serverPath).href)}),50);return}send(res,404,{ok:false,error:'Not found'})}catch(error){send(res,500,{ok:false,error:error instanceof Error?error.message:String(error)})}})",
    "server.listen(port,'0.0.0.0')",
  ].join(";");
}

function countPlaceholders(value) {
  return (JSON.stringify(value).match(/replace-with/g) || []).length;
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index < 0) return "";
  return args[index + 1] || "";
}

function splitCsv(value) {
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function requiredValue(flag) {
  const value = valueAfter(flag);
  if (!value) throw new Error(`${command} requires ${flag}`);
  return value;
}

function trimSlash(value) {
  return value.replace(/\/+$/, "");
}

function sanitizeJsonOrText(text) {
  try {
    return redactSecretBearingValues(JSON.parse(text));
  } catch {
    return String(text).replace(/token=[A-Fa-f0-9]+/g, "token=[redacted]").slice(0, 40000);
  }
}

function redactSecretBearingValues(value, key = "") {
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
