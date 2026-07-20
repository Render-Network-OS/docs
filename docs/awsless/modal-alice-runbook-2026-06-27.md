# Modal runbook: Alice runtime + capture-service

**Purpose:** hand a fresh agent everything needed to build, deploy, verify, and cost-manage
Alice (the milaidy/elizaOS agent) and the capture-service on **Modal**. Modal is the compute
rail for Alice (RunPod abandoned for cost, founder call 2026-06-21). Railway (control-plane +
Postgres + Redis) and Cloudflare (Stream / Workers / R2 / DNS) rails are unchanged; only the
agent compute lives on Modal.

Last verified: 2026-06-27. Modal client 1.5.0, workspace `rndrntwrk`.
Contract update 2026-07-20: static launcher contract tests added (see 0.1), runtime
timeout raised to the four-hour staging-window ceiling, capture precomputes the
companion fragment-token target, and section 9 records the release-candidate gate
that must pass BEFORE the next staging window.

---

## 0. TL;DR (the four commands)

```bash
# deploy Alice runtime
~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_runtime.py

# deploy the capture-service (renders /companion -> RTMP)
~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_capture_service.py

# stop an app (frees containers, $0 while stopped) -- --yes is REQUIRED (no TTY)
~/.venvs/modal/bin/modal app stop alice-runtime --yes
~/.venvs/modal/bin/modal app stop alice-capture-service --yes

# list apps / state
~/.venvs/modal/bin/modal app list
```

Run all commands from the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
`alice_capture_service.py` uses `add_local_dir("555stream/services/capture-service", ...)`, a
path relative to the working directory, so it MUST be run from the repo root or the build fails.

### 0.1 Launcher contract tests (run before ANY deploy)

```bash
python3 -m py_compile scripts/awsless/modal/alice_runtime.py scripts/awsless/modal/alice_capture_service.py
~/.venvs/modal/bin/python -m pytest scripts/awsless/modal/test_alice_modal_contract.py -q
```

The contract locks: `min_containers=0` on both apps (idle = $0), `max_containers=1` on
capture (in-process browser/ffmpeg sessions), runtime `timeout=14400` (the four-hour
staging-window ceiling), and fragment token delivery (`/companion#token=...`, never a
query token). pytest lives in the modal venv (`~/.venvs/modal/bin/python -m pip install pytest`
if missing).

Every staging window additionally requires, BEFORE start: owner, start time, expiry
(max 4h), teardown command, and evidence path recorded; and AFTER acceptance: the exact
Modal revision captured in evidence (`~/.venvs/modal/bin/modal app list` output) and an
immediate `modal app stop <app> --yes` teardown.

---

## 1. Tooling and where everything lives

| Thing | Location | Notes |
|---|---|---|
| Modal CLI | `~/.venvs/modal/bin/modal` | v1.5.0. A venv shim; do NOT rely on a bare `modal` on PATH. |
| Modal auth/config | `~/.modal.toml` | Holds `[rndrntwrk]` `token_id` / `token_secret` / `active`. Secret file, never print or commit. If missing, re-auth with `~/.venvs/modal/bin/modal setup` (opens browser) or `modal token set`. |
| Workspace | `rndrntwrk` | All apps + secrets live here. Public URLs are `https://rndrntwrk--<label>.modal.run`. |
| Alice runtime app | `scripts/awsless/modal/alice_runtime.py` | `modal.App("alice-runtime")`, web label `alice`. |
| Capture-service app | `scripts/awsless/modal/alice_capture_service.py` | `modal.App("alice-capture-service")`, web label `capture`. |
| Pycache ignore | `scripts/awsless/modal/.gitignore` | ignores `__pycache__/` + `*.pyc`. |
| Local API-token copy | `555stream/.secrets/alice-api-token.txt` | The `MILADY_API_TOKEN` value, gitignored via `555stream/.gitignore` (`.secrets/`). 555stream is a NESTED git repo, so check ignore with `git -C 555stream check-ignore <path>`, NOT from repo root (returns 128). |

**Public URLs when deployed:**
- Alice runtime: `https://rndrntwrk--alice.modal.run` (web label `alice`)
- Alice runtime alt host string used in some env allowlists: `https://rndrntwrk--alice-runtime-web.modal.run`
- Capture-service: `https://rndrntwrk--capture.modal.run` (web label `capture`)

---

## 2. Secrets (Modal secret store, never in the repo)

Secrets live in the Modal workspace, injected into the container at runtime via
`modal.Secret.from_name(...)`. Create/update with `modal secret create <name> KEY=value ...`
(re-running `create` overwrites). List with `~/.venvs/modal/bin/modal secret list`.

| Secret name | Keys | Consumed by | What it is |
|---|---|---|---|
| `alice-build` | `ALICE_KEY_HEX`, `ALICE_IV_HEX` | image build of `alice_runtime.py` | aes-256-cbc key+iv to decrypt the R2 source tarball in-build. |
| `alice-runtime` | `STREAM555_AGENT_TOKEN`, `ELIZA_VAULT_PASSPHRASE`, `MILAIDY_CREDENTIALS_MASTER_KEY` | Alice runtime function | agent token / vault passphrase / credentials master key. |
| `alice-api-token` | `MILADY_API_TOKEN` | Alice runtime function | KNOWN inbound API token (64-hex). Needed because Modal is detected as cloud-provisioned; without a known token milady auto-generates a RANDOM one and 401s every `/api` call. |
| `alice-capture-auth` | `CAPTURE_API_TOKEN` | capture-service function | inbound auth for the capture API (`CAPTURE_AUTH_DISABLED=0`). |

To create the capture auth secret (example):
```bash
~/.venvs/modal/bin/modal secret create alice-capture-auth CAPTURE_API_TOKEN=<64-hex>
```

**Never** paste any secret value into chat, logs, commits, or a tracked file. The only local
copy that exists is `555stream/.secrets/alice-api-token.txt`, and it is gitignored.

---

## 3. Alice runtime (`alice_runtime.py`) in detail

### 3.1 What the image build does (runs in Modal's builder)
1. Pulls the encrypted+chunked milaidy source from R2:
   `https://pub-322696b8cb0e447abd9d87725628383a.r2.dev/alice.enc.part0` .. `.part3`
   (4 chunks; concat -> single `alice.enc`).
2. `openssl enc -d -aes-256-cbc -K $ALICE_KEY_HEX -iv $ALICE_IV_HEX` to decrypt to `alice.tar.gz`.
3. sha256-verify against `EXPECTED_SHA` (`0fb9fa04b328e89aec97b369a3c52bb15b058d55e4007798d0526ed4a06c1fa2`).
4. Extract, install bun 1.3.10 + tsx 4.21.0, `bun install`, then
   `tsdown --config-loader native` **backend only** (the vite SPA is skipped: it OOMs at ~24GB;
   the prebuilt `apps/app/dist` is already in the tarball, so the avatar SPA is NOT lost).
5. Apply the `@elizaos` -> milaidy source remap (mirrors the RunPod buildScript).

**CRITICAL build gotcha:** Modal's `run_commands(multiline)` parses each line as a separate
Dockerfile instruction. The whole build script is therefore base64-encoded onto ONE line:
`.run_commands(f"echo {b64} | base64 -d | bash", secrets=[...])`. Do not "clean this up" into
a multiline string; it will break with "could not parse Dockerfile".

### 3.2 Runtime function config (`@app.function(...)`)
`cpu=4.0, memory=8192` (8 GiB), `min_containers=0` (scale to zero), `buffer_containers=1`,
`scaledown_window=600`, `timeout=3600`, `startup_timeout=900`, web port `8080`, label `alice`.
Secrets attached: `alice-runtime` + `alice-api-token`.

`alice_web()` does `os.environ.update(RUNTIME_ENV)`, makes `/tmp/alice-state/*` dirs, launches
`Xvfb :99`, then Popen `node --import <tsx loader> milady.mjs start` (cwd `/build/src/555-bot/milaidy`).

### 3.3 Where runtime env variables live and what they mean
All non-secret env is the `RUNTIME_ENV` dict in `alice_runtime.py` (edit there). Key ones:

| Var | Value | Why |
|---|---|---|
| `PORT` / `MILADY_PORT` / `ELIZA_PORT` | `8080` | Modal proxies :8080. |
| `MILADY_API_BIND` / `ELIZA_API_BIND` | `0.0.0.0` | bind all interfaces. |
| `ELIZA_ALLOWED_HOSTS` | `*` | Host header allow. |
| `MILADY_ALLOWED_ORIGINS` / `ELIZA_ALLOWED_ORIGINS` | `https://rndrntwrk--alice.modal.run` | **The 403 fix.** milady `resolveCorsOrigin` 403s any Origin not on this EXACT-match allowlist (no `*` expansion); the browser sends Origin on module-script subresources, so without this every `/assets/*.js` 403s and the SPA never boots. |
| `ELIZA_DISABLE_LOCAL_EMBEDDINGS` | `1` | skip local embedding model download. |
| `MILADY_DISABLE_AUTO_BOOTSTRAP` | `1` | no auto onboarding. |
| `ELIZA_VAULT_DISABLE_KEYCHAIN` | `1` | no OS keychain in container. |
| `MILAIDY_AUTH_DISABLED` | `1` | **NOT effective on Modal** (cloud-provisioned overrides it). Auth stays ON. Do not rely on this. See 3.4. |
| state dirs (`MILADY_STATE_DIR`, `PGLITE_DATA_DIR`, `CACHE_DIR`, `MODELS_DIR`, `HOME`) | under `/tmp/alice-state` | ephemeral scratch. |
| `CHROMIUM_PATH` | `/usr/bin/chromium` | headless render. |
| `DISPLAY` | `:99` | Xvfb. |
| `STREAM555_BASE_URL` | `https://stream.rndrntwrk.com` | control-plane base. |

### 3.4 Auth model (READ THIS before touching auth)
The Modal URL is PUBLIC. Alice's API exposes `EXECUTE_CODE`, plugin-install, and secrets, so
**disabling auth = public RCE. DO NOT flip auth off on the public URL.** Instead:
- A KNOWN `MILADY_API_TOKEN` is set via the `alice-api-token` secret.
- The companion and the capture browser authenticate by loading
  `https://rndrntwrk--alice.modal.run/companion#token=<MILADY_API_TOKEN>`.
- The SPA reads the token from the URL **hash** (`#token=`, `apps/app/src/main.tsx:359-413`),
  refuses `?token=`, stores it under localStorage `milady:self-hosted-api-token`, sends it as Bearer.
- The avatar mesh renders client-side WITHOUT the token; only live data + the emote WS channel need it.

### 3.5 Render surface (which route to point a browser at)
The avatar+emote surface is **`/companion`** (or `?mode=companion`). `isPhoneCompanionMode()`
(`apps/app/src/main.tsx:731`) renders `CompanionShell` with `companionGlobalOverlay:
GlobalEmoteOverlay` (the EMOTE surface), bypassing onboarding. Verified render: a 1200x863 WebGL
canvas, `hasWebGL:true`, `hasCompanion:true`. By contrast `/` and `/broadcast` show the
onboarding GATE (no canvas). **Point the capture browser at `/companion#token=<token>`, not `/broadcast`.**

---

## 4. Capture-service (`alice_capture_service.py`) in detail

Renders a browser page and pushes it to RTMP (Puppeteer/Chromium on Xvfb + ffmpeg; CPU /
SwiftShader, no GPU). Source lives at `555stream/services/capture-service` (uploaded into the
image via `add_local_dir`, so LOCAL edits to that dir are what get deployed).

Config: `cpu=4.0, memory=8192`, `min_containers=0`, **`max_containers=1`** (browser + ffmpeg
sessions are in-process, so status/screenshot calls must hit the same container that
`/api/capture/start` created the session on), `buffer_containers=0`, `scaledown_window=60`,
web port `8080`, label `capture`. Secrets: `alice-capture-auth` (inbound API auth) and
`alice-api-token` (used only to precompute `CAPTURE_DEFAULT_TARGET_URL`, the companion
target with fragment token delivery, at container start; the URL is never logged).

Env (`CAPTURE_ENV` in the file):
- `PORT=8080`, `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`, `PUPPETEER_SKIP_DOWNLOAD=1`
- `CAPTURE_ALLOWED_ORIGINS=https://stream.rndrntwrk.com,https://rndrntwrk--alice-runtime-web.modal.run`
- `CAPTURE_AUTH_DISABLED=0` (auth ON; requires `CAPTURE_API_TOKEN`)
- `REDIS_URL=""` (empty; set to the Railway Redis URL if session persistence is needed)

Capture API (`555stream/services/capture-service/README.md`): `POST /api/capture/start
{url, outputRtmpUrl, viewport}`, `GET /api/capture/:id/status`, `DELETE /api/capture/:id`,
`GET /healthz`. `url` may be omitted on Modal: the service falls back to
`CAPTURE_DEFAULT_TARGET_URL` (Alice's `/companion#token=<token>`, precomputed by the
launcher) so proof requests never carry the token. When supplying `url` explicitly, point
it at Alice's `/companion#token=<token>` and `outputRtmpUrl` at the Cloudflare Stream
RTMPS ingest. The default-url fallback lands with 555stream branch
`fix/alice-modal-livestream-2026-07-18`; deploys of the capture image before that branch
is merged into the local checkout still require `url` in the request body.

---

## 5. Deploy + verify loop

### 5.1 Deploy
```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_runtime.py
```
- Cached image (no build-affecting change): redeploy is ~5s.
- Cold start of a fresh container: ~45s.

### 5.2 CRITICAL redeploy gotcha (env-only changes)
`RUNTIME_ENV` is applied inside `alice_web()` at container start. If you change ONLY env (image
hash unchanged), a plain `modal deploy` keeps the already-running container, so the new env does
NOT take effect. To force a fresh container:
```bash
~/.venvs/modal/bin/modal app stop alice-runtime --yes   # --yes REQUIRED, no interactive TTY
~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_runtime.py
```

### 5.3 Verify Alice
```bash
curl -s https://rndrntwrk--alice.modal.run/api/health    # expect ready:true, ~16 plugins
```
Then load `https://rndrntwrk--alice.modal.run/companion#token=<MILADY_API_TOKEN>` in a browser
(token from `555stream/.secrets/alice-api-token.txt`): expect the VRM avatar canvas + emote
overlay, and NO 401 on `/api/*`.

### 5.4 Verify capture-service
```bash
curl -s https://rndrntwrk--capture.modal.run/healthz     # expect ok + display stats
```

---

## 6. Cost model (Modal)

Rates (2026-06, verified): CPU `$0.0000131 / core / sec` = `$0.0472 / core / hr`; memory
`$0.00000222 / GiB / sec` = `$0.0080 / GiB / hr`; min 0.125 cores/container. Free credits:
$30/mo Starter, $100/mo Team. Scale-to-zero => idle costs $0.

Alice config (4 CPU, 8 GiB): `4 * 0.0472 + 8 * 0.0080 = ~$0.25 / hr while running`, ~$0 idle.
Capture-service is a second similar container, so a live broadcast runs ~2 containers at once
(~$0.40-0.50/hr combined). A cold start (~45s) plus the `scaledown_window` warm tail bills a
few cents per wake (runtime tail = 10 min; capture tail = 1 min).

Cost controls (already partly applied): keep `min_containers=0`; short `scaledown_window`
(capture is 60s); `stop` apps when idle (stopped = $0); avoid repeated cold-starts and needless
rebuilds (cached image redeploys are ~5s and near-free). The **spend-limit** block ("workspace
billing cycle spend limit reached") is the Starter monthly credit cap; the FOUNDER raises it /
adds a card in the Modal dashboard (Settings -> Billing). Agents cannot raise it.

---

## 7. Known blockers / founder dependencies (for the emote-on-broadcast goal)

1. **Modal spend limit** (if hit): founder raises it in the dashboard. Until then `modal deploy`
   fails and Alice stays stopped ($0, cost-safe).
2. **Cloudflare Stream live input** (the RTMPS ingest + HLS URLs): needs a CF API token with
   **Stream:Edit**. Not present (only TURN/SFU creds + wrangler OAuth workers/zone:read).
   Founder issues the token or creates the live input in the CF dashboard and hands over the
   `rtmps://` ingest + HLS playback URLs. This gates the whole capture leg.
3. **Platform RTMP keys** (twitch / kick / youtube / pumpfun): founder provides for CF Stream
   simulcast. Last mile after the HLS self-view proof.

---

## 8. Gotchas checklist (quick reference)

- Run deploys from the repo ROOT (capture upload path is relative).
- `run_commands` multiline breaks the build -> base64 the script onto one line (already done).
- Env-only change needs `app stop --yes` then redeploy (unchanged image = stale container).
- `app stop` needs `--yes` (no interactive TTY in this harness).
- Auth is ON on Modal regardless of `MILAIDY_AUTH_DISABLED`; use the `#token=` hash approach,
  never disable auth on the public URL.
- Render route is `/companion`, not `/broadcast`.
- CORS: set `*_ALLOWED_ORIGINS` to the EXACT Modal origin or `/assets/*.js` 403.
- 555stream is a nested git repo: check ignores with `git -C 555stream check-ignore`.
- Never print/commit secret values; the CLI config `~/.modal.toml` holds the workspace token.

---

## 9. Release-candidate gate (MUST pass before the next staging window)

The runtime image currently builds from the ENCRYPTED June R2 artifact
(`R2_BASE`/`EXPECTED_SHA` in `alice_runtime.py`) and runs the tsdown backend build ONLY,
skipping the Vite SPA. That artifact PREDATES the accepted release candidate
(milaidy `release/alice-livestream-recovery-2026-07-18` @ `3294f8e11`: restored LifeOps
routes and operator actions, companion public-route exemption, mobile and landscape
Go Live header fixes, tracked local evidence with an accepted manifest). Deploying the
current image as-is would regress the restored companion.

Before Task 11 (deploy the exact candidate to direct Modal URLs):

1. Hydrate a fresh assembly from `3294f8e11` (recovery plan Task 1 Step 5 recipe) and run
   the FULL production build (backend + SPA; the SPA build needs the large-heap
   `NODE_OPTIONS`, which is why the June rail skipped it).
2. Re-encrypt + chunk + upload that tree with the existing `alice-build` key material and
   update `R2_BASE` chunks + `EXPECTED_SHA` in `alice_runtime.py` (same commit as the
   artifact swap; the build must keep verifying the sha before decrypt).
3. Because the artifact now ships the prebuilt SPA and the full patched tree, drop the
   in-build backend-only rebuild if redundant, keeping image build time down.
4. Re-run 0.1 contract tests, deploy, and record the revision in the staging evidence.

Do NOT open a staging window against the June artifact.
