#!/usr/bin/env node

import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, open, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createHash, createDecipheriv } from "node:crypto";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const config = {
  port: Number.parseInt(process.env.BOOTSTRAP_PORT || "3999", 10),
  token: process.env.BOOTSTRAP_TOKEN || "",
  workspace: process.env.BOOTSTRAP_WORKSPACE || "/workspace",
  alicePort: process.env.PORT || "3000",
};

if (!config.token) {
  throw new Error("BOOTSTRAP_TOKEN is required");
}

const paths = {
  upload: path.join(config.workspace, "alice-source.tar.gz"),
  sourceDir: path.join(config.workspace, "alice-src"),
  cloneLog: path.join(config.workspace, "alice-bootstrap-clone.log"),
  keysDir: path.join(config.workspace, "keys"),
  buildLog: path.join(config.workspace, "alice-bootstrap-build.log"),
  runtimeLog: path.join(config.workspace, "alice-runtime.log"),
  state: path.join(config.workspace, "alice-bootstrap-state.json"),
};

await mkdir(config.workspace, { recursive: true });

const state = {
  startedAt: new Date().toISOString(),
  upload: null,
  clone: null,
  build: { status: "idle" },
  runtime: { status: "idle" },
};

await writeState();

let buildProcess = null;
let runtimeProcess = null;
let cloneProcess = null;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, state: await currentState() });
    }

    if (!isAuthorized(url)) {
      return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    }

    if (req.method === "POST" && url.pathname === "/upload") {
      return handleUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/upload/init") {
      return handleUploadInit(url, res);
    }

    if (req.method === "POST" && url.pathname === "/upload/chunk") {
      return handleUploadChunk(req, url, res);
    }

    if (req.method === "POST" && url.pathname === "/upload/complete") {
      return handleUploadComplete(url, res);
    }

    if (req.method === "POST" && url.pathname === "/fetch-url") {
      return handleFetchUrl(req, res);
    }

    if (req.method === "POST" && url.pathname === "/clone") {
      return handleClone(req, res);
    }

    if (req.method === "POST" && url.pathname === "/build") {
      return handleBuild(res);
    }

    if (req.method === "POST" && url.pathname === "/start") {
      return handleStart(res);
    }

    if (req.method === "POST" && url.pathname === "/stop-runtime") {
      return handleStopRuntime(res);
    }

    if (req.method === "GET" && url.pathname === "/status") {
      return sendJson(res, 200, { ok: true, state: await currentState() });
    }

    if (req.method === "GET" && url.pathname === "/logs") {
      return sendJson(res, 200, {
        ok: true,
        buildLog: await tail(paths.buildLog),
        runtimeLog: await tail(paths.runtimeLog),
      });
    }

    sendJson(res, 404, { ok: false, error: "Not found" });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(config.port, "0.0.0.0", () => {
  console.log(`Alice RunPod bootstrap server listening on ${config.port}`);
});

async function handleUpload(req, res) {
  await mkdir(path.dirname(paths.upload), { recursive: true });
  const out = createWriteStream(paths.upload, { flags: "w" });
  let bytes = 0;
  req.on("data", (chunk) => {
    bytes += chunk.length;
  });
  req.pipe(out);
  out.on("error", (error) => {
    sendJson(res, 500, { ok: false, error: error.message });
  });
  out.on("finish", async () => {
    state.upload = {
      status: "uploaded",
      path: paths.upload,
      bytes,
      uploadedAt: new Date().toISOString(),
    };
    await writeState();
    sendJson(res, 200, { ok: true, upload: state.upload });
  });
}

async function handleUploadInit(url, res) {
  const expectedBytes = Number.parseInt(url.searchParams.get("bytes") || "0", 10);
  const expectedSha256 = url.searchParams.get("sha256") || "";
  await mkdir(path.dirname(paths.upload), { recursive: true });
  await rm(paths.upload, { force: true });
  await writeFile(paths.upload, "");
  state.upload = {
    status: "receiving_chunks",
    path: paths.upload,
    expectedBytes,
    expectedSha256,
    receivedBytes: 0,
    chunks: 0,
    startedAt: new Date().toISOString(),
  };
  await writeState();
  sendJson(res, 200, { ok: true, upload: state.upload });
}

async function handleUploadChunk(req, url, res) {
  if (!state.upload || state.upload.status !== "receiving_chunks") {
    return sendJson(res, 409, {
      ok: false,
      error: "Call /upload/init before /upload/chunk",
    });
  }
  const offset = Number.parseInt(url.searchParams.get("offset") || "", 10);
  if (!Number.isFinite(offset) || offset < 0) {
    return sendJson(res, 400, { ok: false, error: "Missing or invalid offset" });
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    chunks.push(chunk);
    bytes += chunk.length;
  }
  const buffer = Buffer.concat(chunks);
  const file = await open(paths.upload, "r+");
  try {
    await file.write(buffer, 0, buffer.length, offset);
  } finally {
    await file.close();
  }
  state.upload = {
    ...state.upload,
    receivedBytes: Math.max(state.upload.receivedBytes || 0, offset + bytes),
    chunks: (state.upload.chunks || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  await writeState();
  sendJson(res, 200, { ok: true, offset, bytes, upload: state.upload });
}

async function handleUploadComplete(url, res) {
  if (!state.upload || state.upload.status !== "receiving_chunks") {
    return sendJson(res, 409, {
      ok: false,
      error: "No chunked upload is in progress",
    });
  }
  const uploadStat = await stat(paths.upload);
  const expectedBytes =
    Number.parseInt(url.searchParams.get("bytes") || "", 10) ||
    state.upload.expectedBytes ||
    0;
  if (expectedBytes && uploadStat.size !== expectedBytes) {
    return sendJson(res, 409, {
      ok: false,
      error: `Upload size mismatch: expected ${expectedBytes}, got ${uploadStat.size}`,
    });
  }

  const expectedSha256 = url.searchParams.get("sha256") || state.upload.expectedSha256 || "";
  const sha256 = await sha256File(paths.upload);
  if (expectedSha256 && sha256 !== expectedSha256) {
    return sendJson(res, 409, {
      ok: false,
      error: "Upload sha256 mismatch",
      expectedSha256,
      sha256,
    });
  }

  state.upload = {
    ...state.upload,
    status: "uploaded",
    bytes: uploadStat.size,
    sha256,
    uploadedAt: new Date().toISOString(),
  };
  await writeState();
  sendJson(res, 200, { ok: true, upload: state.upload });
}

// Follow redirects and resolve to a 200 response stream for a GET URL.
function httpGetStream(targetUrl, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const lib = targetUrl.startsWith("http://") ? http : https;
    const request = lib.get(
      targetUrl,
      { headers: { "user-agent": "alice-runpod-fetch/1.0", accept: "*/*" } },
      (response) => {
        const status = response.statusCode || 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume();
          if (redirectsLeft <= 0) {
            reject(new Error("too many redirects"));
            return;
          }
          const next = new URL(response.headers.location, targetUrl).toString();
          resolve(httpGetStream(next, redirectsLeft - 1));
          return;
        }
        if (status !== 200) {
          response.resume();
          reject(new Error(`GET ${targetUrl} -> HTTP ${status}`));
          return;
        }
        resolve(response);
      },
    );
    request.on("error", reject);
    request.setTimeout(180000, () => request.destroy(new Error("fetch timeout")));
  });
}

// Pull an encrypted, chunked tarball from a public URL (fast pod-side download
// at the pod's downlink, beating the restart window), concatenate, decrypt with
// the supplied aes-256-cbc key/iv, and verify the decrypted sha256. Chunks live
// at `${baseUrl}.part${i}` for i in [0, chunkCount).
async function handleFetchUrl(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: "Invalid JSON body" });
  }
  const { baseUrl, chunkCount, keyHex, ivHex, sha256: expectedSha } = body || {};
  if (!baseUrl || !chunkCount || !keyHex || !ivHex || !expectedSha) {
    return sendJson(res, 400, {
      ok: false,
      error: "baseUrl, chunkCount, keyHex, ivHex, sha256 are required",
    });
  }

  const encPath = `${paths.upload}.enc`;
  try {
    await mkdir(path.dirname(paths.upload), { recursive: true });
    await rm(encPath, { force: true });
    await rm(paths.upload, { force: true });
    state.upload = {
      status: "fetching",
      source: "fetch-url",
      baseUrl,
      chunkCount,
      receivedBytes: 0,
      startedAt: new Date().toISOString(),
    };
    await writeState();

    for (let i = 0; i < chunkCount; i += 1) {
      const chunkUrl = `${baseUrl}.part${i}`;
      const source = await httpGetStream(chunkUrl);
      await pipeline(source, createWriteStream(encPath, { flags: i === 0 ? "w" : "a" }));
      const encStat = await stat(encPath);
      state.upload = { ...state.upload, receivedBytes: encStat.size, chunks: i + 1 };
      await writeState();
    }

    const decipher = createDecipheriv(
      "aes-256-cbc",
      Buffer.from(keyHex, "hex"),
      Buffer.from(ivHex, "hex"),
    );
    await pipeline(createReadStream(encPath), decipher, createWriteStream(paths.upload));
    await rm(encPath, { force: true });

    const sha256 = await sha256File(paths.upload);
    if (sha256 !== expectedSha) {
      state.upload = { ...state.upload, status: "failed", error: "sha256 mismatch", sha256 };
      await writeState();
      return sendJson(res, 409, {
        ok: false,
        error: "sha256 mismatch after decrypt",
        expectedSha256: expectedSha,
        sha256,
      });
    }

    const uploadStat = await stat(paths.upload);
    state.upload = {
      status: "uploaded",
      path: paths.upload,
      bytes: uploadStat.size,
      sha256,
      source: "fetch-url",
      uploadedAt: new Date().toISOString(),
    };
    await writeState();
    return sendJson(res, 200, { ok: true, upload: state.upload });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    state.upload = { ...(state.upload || {}), status: "failed", error: message };
    await writeState();
    await rm(encPath, { force: true }).catch(() => {});
    return sendJson(res, 500, { ok: false, error: message });
  }
}

async function handleClone(req, res) {
  if (cloneProcess) {
    return sendJson(res, 202, { ok: true, clone: state.clone });
  }
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: `Invalid JSON body: ${error.message}` });
  }
  const miladyRepo = String(body.miladyRepo || "");
  const miladyBranch = String(body.miladyBranch || "");
  if (!miladyRepo || !miladyBranch || !body.miladyKeyB64) {
    return sendJson(res, 400, {
      ok: false,
      error: "miladyRepo, miladyBranch, and miladyKeyB64 are required",
    });
  }

  // Drop the read-only deploy key (base64 in the request body) onto disk with
  // 0600 perms. It never appears in logs; clone uses it via GIT_SSH_COMMAND.
  await mkdir(paths.keysDir, { recursive: true });
  const miladyKey = path.join(paths.keysDir, "milady");
  await writeFile(miladyKey, Buffer.from(String(body.miladyKeyB64), "base64").toString("utf8"), { mode: 0o600 });

  state.clone = { status: "running", startedAt: new Date().toISOString(), log: paths.cloneLog };
  await writeState();
  await writeFile(paths.cloneLog, "");

  cloneProcess = spawn("bash", ["-lc", cloneScript()], {
    cwd: config.workspace,
    env: {
      ...process.env,
      BOOTSTRAP_WORKSPACE: config.workspace,
      MILADY_REPO: miladyRepo,
      MILADY_BRANCH: miladyBranch,
      MILADY_KEY: miladyKey,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  captureProcess(cloneProcess, paths.cloneLog, async (code) => {
    // Scrub the deploy keys regardless of outcome.
    await rm(paths.keysDir, { recursive: true, force: true });
    state.clone = {
      ...state.clone,
      status: code === 0 ? "cloned" : "failed",
      exitedAt: new Date().toISOString(),
      exitCode: code,
    };
    cloneProcess = null;
    await writeState();
  });

  sendJson(res, 202, { ok: true, clone: state.clone });
}

function cloneScript() {
  return `
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive
if ! command -v git >/dev/null 2>&1 || ! command -v git-lfs >/dev/null 2>&1; then
  apt-get update
  apt-get install -y --no-install-recommends git git-lfs ca-certificates openssh-client
fi
git lfs install --skip-repo

SRC="\${BOOTSTRAP_WORKSPACE}/alice-src"
rm -rf "$SRC"
mkdir -p "$SRC/555-bot"

MILADY_SSH="ssh -i \${MILADY_KEY} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

# milaidy is the runtime, cloned to the layout the build expects (555-bot/milaidy),
# at the exact review branch carrying the boundary + isStoreBuild fixes plus the
# vendored build-orchestration scripts.
GIT_SSH_COMMAND="$MILADY_SSH" git clone --depth 1 --branch "\${MILADY_BRANCH}" "\${MILADY_REPO}" "$SRC/555-bot/milaidy"

# LFS assets (avatar VRM/animations). Non-fatal: some objects may be absent on
# the remote; the endpoint smoke does not need them.
( cd "$SRC/555-bot/milaidy" && GIT_SSH_COMMAND="$MILADY_SSH" git lfs pull ) || echo "[clone] git lfs pull incomplete (continuing)"

# Reconstruct the 555-bot/scripts layout the build expects, from milaidy's
# vendored copies (the 555-bot repo has deploy keys disabled, so it is not
# cloned). These scripts are self-contained.
mkdir -p "$SRC/555-bot/scripts"
for s in resolve-milaidy-missing-workspaces.mjs pin-alice-release-runtime-deps.mjs build-milaidy-runtime-plugin-workspaces.mjs seed-knowledge.ts; do
  cp "$SRC/555-bot/milaidy/scripts/$s" "$SRC/555-bot/scripts/$s"
done

echo "[clone] milaidy HEAD: $(cd "$SRC/555-bot/milaidy" && git rev-parse HEAD)"
test -f "$SRC/555-bot/milaidy/milady.mjs"
test -f "$SRC/555-bot/scripts/resolve-milaidy-missing-workspaces.mjs"
test -f "$SRC/555-bot/scripts/seed-knowledge.ts"
echo "[clone] layout OK"
`;
}

async function handleBuild(res) {
  const cloned = existsSync(path.join(paths.sourceDir, "555-bot", "milaidy", "milady.mjs"));
  if (!existsSync(paths.upload) && !cloned) {
    return sendJson(res, 409, {
      ok: false,
      error: "Provide source first: POST /clone (git) or upload alice-source.tar.gz",
    });
  }
  if (buildProcess) {
    return sendJson(res, 202, { ok: true, build: state.build });
  }

  state.build = {
    status: "running",
    startedAt: new Date().toISOString(),
    log: paths.buildLog,
  };
  await writeState();

  buildProcess = spawn("bash", ["-lc", buildScript()], {
    cwd: config.workspace,
    env: {
      ...process.env,
      PORT: config.alicePort,
      BOOTSTRAP_WORKSPACE: config.workspace,
      NODE_ENV: "production",
      // The vite SPA build is heap-hungry (12MB+ main bundle) and hits V8's
      // default old-space limit before exhausting physical RAM. Raise the limit
      // so the build can use more of the pod's memory and avoid the
      // "JavaScript heap out of memory" SIGABRT. Tunable via BUILD_NODE_OPTIONS.
      NODE_OPTIONS: process.env.BUILD_NODE_OPTIONS || "--max-old-space-size=24576",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  captureProcess(buildProcess, paths.buildLog, async (code) => {
    state.build = {
      ...state.build,
      status: code === 0 ? "succeeded" : "failed",
      exitedAt: new Date().toISOString(),
      exitCode: code,
    };
    buildProcess = null;
    await writeState();
  });

  sendJson(res, 202, { ok: true, build: state.build });
}

async function handleStart(res) {
  if (runtimeProcess) {
    return sendJson(res, 202, { ok: true, runtime: state.runtime });
  }

  const runtimeCwd = path.join(paths.sourceDir, "555-bot", "milaidy");
  if (!existsSync(path.join(runtimeCwd, "milady.mjs"))) {
    return sendJson(res, 409, {
      ok: false,
      error: "Build source is not ready; run /build first",
    });
  }

  const runtimeStateDir = path.join(config.workspace, "runtime-state");
  await rm(runtimeStateDir, { recursive: true, force: true });
  await mkdir(path.join(runtimeStateDir, "home"), { recursive: true });
  await mkdir(path.join(runtimeStateDir, "milaidy"), { recursive: true });
  await mkdir(path.join(runtimeStateDir, "eliza", "cache"), { recursive: true });
  await mkdir(path.join(runtimeStateDir, "eliza", "models", "text"), { recursive: true });
  await writeFile(paths.runtimeLog, "");

  state.runtime = {
    status: "running",
    startedAt: new Date().toISOString(),
    log: paths.runtimeLog,
  };
  await writeState();

  runtimeProcess = spawn(
    "bash",
    [
      "-lc",
      [
        "set -euo pipefail",
        "Xvfb :99 -screen 0 1920x1080x24 &",
        "xvfb_pid=$!",
        "cleanup() { kill \"$xvfb_pid\" >/dev/null 2>&1 || true; wait \"$xvfb_pid\" >/dev/null 2>&1 || true; }",
        "trap cleanup EXIT",
        "sleep 2",
        "node --import /opt/tsx/node_modules/tsx/dist/loader.mjs milady.mjs start",
      ].join("\n"),
    ],
    {
      cwd: runtimeCwd,
      env: runtimeEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  captureProcess(runtimeProcess, paths.runtimeLog, async (code) => {
    state.runtime = {
      ...state.runtime,
      status: code === 0 ? "exited" : "failed",
      exitedAt: new Date().toISOString(),
      exitCode: code,
    };
    runtimeProcess = null;
    await writeState();
  });

  sendJson(res, 202, { ok: true, runtime: state.runtime });
}

async function handleStopRuntime(res) {
  if (!runtimeProcess) {
    state.runtime = {
      ...state.runtime,
      status: state.runtime.status === "running" ? "stopped" : state.runtime.status,
      stoppedAt: new Date().toISOString(),
    };
    await writeState();
    return sendJson(res, 200, { ok: true, runtime: state.runtime });
  }

  const child = runtimeProcess;
  child.kill("SIGTERM");
  setTimeout(() => {
    if (runtimeProcess === child && child.exitCode == null && child.signalCode == null) {
      child.kill("SIGKILL");
    }
  }, 5000).unref();

  state.runtime = {
    ...state.runtime,
    status: "stopping",
    stoppedAt: new Date().toISOString(),
  };
  await writeState();
  sendJson(res, 202, { ok: true, runtime: state.runtime });
}

function buildScript() {
  return `
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive
export BUN_INSTALL=/root/.bun
export PATH="$BUN_INSTALL/bin:$PATH"

if [ -f "\${BOOTSTRAP_WORKSPACE}/alice-source.tar.gz" ]; then
  rm -rf "\${BOOTSTRAP_WORKSPACE}/alice-src"
  mkdir -p "\${BOOTSTRAP_WORKSPACE}/alice-src"
  tar -xzf "\${BOOTSTRAP_WORKSPACE}/alice-source.tar.gz" -C "\${BOOTSTRAP_WORKSPACE}/alice-src"
else
  echo "no source tarball; using pre-cloned \${BOOTSTRAP_WORKSPACE}/alice-src (POST /clone)"
  test -f "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/milaidy/milady.mjs"
fi

apt-get update
apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  git \
  pkg-config \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev \
  libsecret-1-dev \
  ca-certificates \
  curl \
  chromium \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libcairo2 \
  libatspi2.0-0 \
  ffmpeg \
  xvfb \
  dumb-init \
  libopus-dev \
  xz-utils
rm -rf /var/lib/apt/lists/*

if ! command -v bun >/dev/null 2>&1; then
  npm install -g bun@1.3.10
fi
npm install --prefix /opt/tsx --ignore-scripts --no-save tsx@4.21.0
npm cache clean --force || true

cd "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/milaidy"
export NODE_LLAMA_CPP_SKIP_DOWNLOAD=true
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PUPPETEER_SKIP_DOWNLOAD=1
export CYPRESS_INSTALL_BINARY=0

node "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/scripts/resolve-milaidy-missing-workspaces.mjs" "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/milaidy"
bun "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/scripts/pin-alice-release-runtime-deps.mjs" "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/milaidy"
bun install --no-progress --ignore-scripts --linker=hoisted --network-concurrency=8
node "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/scripts/build-milaidy-runtime-plugin-workspaces.mjs" "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/milaidy"

test -f node_modules/@elizaos/plugin-sql/package.json
node_modules_sql="$(readlink node_modules/@elizaos/plugin-sql || true)"
case "$node_modules_sql" in *eliza/plugins/plugin-sql*) echo "runtime @elizaos/plugin-sql resolved to workspace: $node_modules_sql" >&2; exit 1 ;; esac
bun -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('node_modules/@elizaos/plugin-sql/package.json','utf8')); if (pkg.version !== '2.0.0-alpha.20') throw new Error('@elizaos/plugin-sql must be 2.0.0-alpha.20, got '+pkg.version); console.log('@elizaos/plugin-sql release runtime OK', pkg.version)"
bun run build

rm -rf node_modules/@elizaos/app-core node_modules/@elizaos/agent node_modules/@elizaos/vault node_modules/@miladyai/shared
mkdir -p node_modules/@elizaos/app-core node_modules/@elizaos/agent node_modules/@elizaos/vault node_modules/@miladyai/shared
cp packages/app-core/package.json node_modules/@elizaos/app-core/
cp -a packages/app-core/src node_modules/@elizaos/app-core/src
cp -a packages/app-core/dist node_modules/@elizaos/app-core/dist 2>/dev/null || true
cp packages/agent/package.json node_modules/@elizaos/agent/
cp -a packages/agent/src node_modules/@elizaos/agent/src
cp -a packages/agent/dist node_modules/@elizaos/agent/dist 2>/dev/null || true
cp eliza/packages/vault/package.json node_modules/@elizaos/vault/
cp -a eliza/packages/vault/src node_modules/@elizaos/vault/src
cp -a eliza/packages/vault/dist node_modules/@elizaos/vault/dist 2>/dev/null || true
cp packages/shared/package.json node_modules/@miladyai/shared/
cp -a packages/shared/src node_modules/@miladyai/shared/src
cp -a packages/shared/dist node_modules/@miladyai/shared/dist 2>/dev/null || true
find packages eliza -path '*/node_modules/@elizaos/agent' -not -path '*/node_modules/.bun/*' -exec rm -rf {} +
test -f node_modules/@elizaos/app-core/src/index.ts
test -f node_modules/@elizaos/agent/src/api/config-env.ts
test -f node_modules/@elizaos/vault/src/index.ts
test -f node_modules/@miladyai/shared/src/index.ts
test -f node_modules/@mariozechner/pi-ai/package.json

cp "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/scripts/seed-knowledge.ts" scripts/seed-knowledge.ts
cat > "\${BOOTSTRAP_WORKSPACE}/alice-runtime-build.json" <<EOF
{
  "createdAt": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "source": "runpod-bootstrap",
  "runtimePath": "\${BOOTSTRAP_WORKSPACE}/alice-src/555-bot/milaidy"
}
EOF
`;
}

function runtimeEnv() {
  const runtimeStateDir = path.join(config.workspace, "runtime-state");
  const miladyStateDir = path.join(runtimeStateDir, "milaidy");
  const elizaStateDir = path.join(runtimeStateDir, "eliza");
  return {
    ...process.env,
    HOME: path.join(runtimeStateDir, "home"),
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--trace-uncaught"].filter(Boolean).join(" "),
    NODE_ENV: "production",
    PORT: config.alicePort,
    MILADY_PORT: config.alicePort,
    ELIZA_PORT: config.alicePort,
    MILADY_API_BIND: "0.0.0.0",
    ELIZA_ALLOWED_HOSTS: "*",
    // Local embeddings (eliza-1-lite gguf) are memory/RAG only — not needed to
    // go live with emotes — and their loader JSON-parses the binary .gguf and
    // crashes runtime-boot ("Unexpected token ... is not valid JSON"). Disable
    // the warmup/collection so boot completes. Also skip the native auto-
    // bootstrap optimization pass for a clean headless boot.
    ELIZA_DISABLE_LOCAL_EMBEDDINGS: "1",
    MILADY_DISABLE_AUTO_BOOTSTRAP: "1",
    MILADY_STATE_DIR: miladyStateDir,
    MILAIDY_HOME: miladyStateDir,
    ELIZA_STATE_DIR: miladyStateDir,
    CHROMIUM_PATH: "/usr/bin/chromium",
    DISPLAY: ":99",
    CACHE_DIR: path.join(elizaStateDir, "cache"),
    MODELS_DIR: path.join(elizaStateDir, "models"),
    PGLITE_DATA_DIR: path.join(miladyStateDir, "workspace", ".eliza", ".elizadb"),
    SHELL_ALLOWED_DIRECTORY: path.join(paths.sourceDir, "555-bot", "milaidy"),
  };
}

function captureProcess(child, logPath, onExit) {
  const out = createWriteStream(logPath, { flags: "a" });
  child.stdout.pipe(out, { end: false });
  child.stderr.pipe(out, { end: false });
  child.on("close", async (code) => {
    out.end();
    await onExit(code);
  });
}

function isAuthorized(url) {
  return url.searchParams.get("token") === config.token;
}

async function currentState() {
  try {
    const uploadStat = existsSync(paths.upload) ? await stat(paths.upload) : null;
    return {
      ...state,
      uploadStat: uploadStat
        ? { bytes: uploadStat.size, updatedAt: uploadStat.mtime.toISOString() }
        : null,
    };
  } catch {
    return state;
  }
}

async function writeState() {
  await writeFile(paths.state, `${JSON.stringify(state, null, 2)}\n`);
}

async function tail(filePath, limit = 20000) {
  try {
    const text = await readFile(filePath, "utf8");
    return text.slice(-limit);
  } catch {
    return "";
  }
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

async function readJsonBody(req, limitBytes = 64 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > limitBytes) throw new Error("body too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : {};
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}
