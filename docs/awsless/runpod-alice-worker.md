# RunPod Alice Worker Rail

This rail hosts the heavy Alice runtime: Milady companion, VRM render surface,
Playwright/Chrome, FFmpeg, and action execution. It should not host the first
self-managed UDP SFU path.

## Inputs From RunPod Setup

Populate these values in your local shell or provider secrets:

```bash
export ALICE_WORKER_URL="https://<runpod-endpoint>"
export ALICE_API_TOKEN="<redacted>"
```

Use the full variable checklist in:

- `docs/awsless/env/runpod-alice-worker.env.example`

## Verified RunPod Account State

RunPod REST access is working with the local ignored key file:

```text
555stream/.secrets/runpod.key
```

Inventory evidence is written to:

```text
555stream/evidence/awsless/<date>/runpod-inventory.json
```

Current state from the first successful probe:

- pods: `[]`
- endpoints: `[]`
- templates: `[]`
- network volumes: `[]`
- container registry auths: `null`

So there is no existing RunPod workload to reuse. We must create the Alice
worker from an image that RunPod can pull.

## Bootstrap Build Requirement

The current Alice runtime image path is based on:

```text
555-bot/docker/Dockerfile
```

Do not use the older top-level `555-bot/Dockerfile` for the restored Alice
runtime. The active Dockerfile already includes Chromium, FFmpeg, Xvfb, the
restored Milaidy runtime, and the `milady.mjs start` entrypoint.

Anonymous GHCR access to `ghcr.io/render-network-os/555-bot:latest` was denied.
That is not a deploy blocker. The AWSless bootstrap rail starts from a public
Node image, uploads a sanitized source tarball, builds the same runtime shape in
the pod, and then starts Alice on `PORT=3000`.

The bootstrap pod uses RunPod's CPU-compatible maximum container disk and keeps
the source/build tree on the pod volume:

- `containerDiskInGb=20`
- `volumeInGb=40`
- `volumeMountPath=/workspace`

The bootstrap pod exposes two HTTP ports:

- `3999/http`: temporary guarded bootstrap server for upload/build/start.
- `3000/http`: Alice runtime after `/start`.

The bootstrap server requires a generated token stored only under
`555stream/.secrets/`.

The pod starts with a tiny stage-1 HTTP server first. Stage 1 exposes
unauthenticated `/health` and a guarded `/install` endpoint; after `/install`
receives the full bootstrap server source, the pod swaps to the full
upload/build/start server. This keeps RunPod proxy readiness separate from the
heavier Alice bootstrap code.

## Required Runtime Shape

- Container exposes HTTP on `PORT=3000`.
- Persistent state volume is mounted if Alice state must survive replacement:
  - `/home/node/.milaidy`
  - `/home/node/.eliza`
- Browser/FFmpeg dependencies are present in the image.
- `MILAIDY_AUTH_DISABLED=0` for protected staging/prod.
- `STREAM555_BASE_URL` points at the Railway control-plane URL.
- Destination keys stay disabled/blank until the named evidence window.

## First Smoke Probe

From workspace root:

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/probe-awsless-alice.mjs
```

Minimum env for the probe:

```bash
export ALICE_WORKER_URL="https://<runpod-endpoint>"
export ALICE_API_TOKEN="<redacted-if-required>"
```

Expected evidence file:

```text
555stream/evidence/awsless/<date>/awsless-alice-probe.json
```

## Pod Create / Teardown Commands

### 1. Record the Test Window

Before starting a billable pod, record owner, expiry, expected max spend,
teardown command, and required evidence:

```text
555stream/evidence/awsless/<date>/runpod-test-window.json
```

### 2. Package the Current Alice Source

The packager includes only the active runtime inputs:

- `555-bot/docker/Dockerfile`
- `555-bot/scripts/pin-alice-release-runtime-deps.mjs`
- `555-bot/scripts/seed-knowledge.ts`
- `555-bot/alice_knowledge`
- `555-bot/milaidy`

It excludes git history, node modules, env files, generated local caches, and
known local secret text.

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/package-alice-runpod-source.mjs
```

### 3. Generate a Public-Base Bootstrap Payload

For the first build smoke, use `--smoke`. This disables local auth only inside
the isolated RunPod smoke pod and generates non-placeholder runtime tokens so
the create guard can proceed without production secrets:

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-bootstrap.mjs write-payload --smoke
```

This writes:

```text
555stream/.secrets/runpod-alice-bootstrap-pod.payload.json
555stream/.secrets/runpod-alice-bootstrap.token
```

For a protected staging/prod payload, omit `--smoke`, fill the placeholders in
the ignored payload copy, and keep destination keys disabled until the named
go-live evidence window.

The static example is:

```text
docs/awsless/runpod-alice-pod.payload.example.json
```

### 4. Create, Install, Upload, Build, Start

The pod script refuses placeholder values and requires `--yes` for billable
actions:

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-pod.mjs create \
  --payload 555stream/.secrets/runpod-alice-bootstrap-pod.payload.json \
  --yes
```

After create, inspect the returned `publicIp` and `portMappings` or RunPod HTTP
proxy URL. Use the bootstrap URL for port `3999`:

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-bootstrap.mjs install-server \
  --base-url <bootstrap-3999-url> \
  --token-file 555stream/.secrets/runpod-alice-bootstrap.token

/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-bootstrap.mjs upload-chunked \
  --base-url <bootstrap-3999-url> \
  --token-file 555stream/.secrets/runpod-alice-bootstrap.token \
  --tarball 555stream/.secrets/alice-runpod-source-<stamp>.tar.gz

/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-bootstrap.mjs action \
  --base-url <bootstrap-3999-url> \
  --token-file 555stream/.secrets/runpod-alice-bootstrap.token \
  --action build

/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-bootstrap.mjs action \
  --base-url <bootstrap-3999-url> \
  --token-file 555stream/.secrets/runpod-alice-bootstrap.token \
  --action start
```

The RunPod HTTP proxy is behind Cloudflare and rejects the current 758 MB
archive as one request with HTTP 413. Use `upload-chunked`; it sends 32 MB
chunks and verifies the final archive SHA-256 inside the pod before build.

Inspect, stop, and delete:

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-pod.mjs get <pod-id>

/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-pod.mjs stop <pod-id> --yes

/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/runpod-pod.mjs delete <pod-id> --yes
```

Evidence is written to:

```text
555stream/evidence/awsless/<date>/runpod-pod-*.json
```

## Pass Criteria

- `/companion/` returns HTTP 200.
- `/broadcast/alice-cam` returns HTTP 200 or a documented auth/setup blocker.
- `/vrm-decoders/draco/draco_wasm_wrapper.js` returns HTTP 200.
- `/api/emotes` returns at least 41 emotes and includes:
  - `wave`
  - `agreeing`
  - `gangnam-style`
  - `dance-happy`

## Cost Control

For non-prod, stop the RunPod worker after the evidence window unless there is a
written exception. Record the start time, owner, expected max spend, and stop
action in the evidence folder.
