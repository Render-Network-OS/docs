"""
Alice (milaidy/elizaOS) runtime on Modal — replaces the RunPod pod (cheaper:
scale-to-zero + per-second billing). Founder pivot 2026-06-21.

The image build pulls the encrypted+chunked milaidy source from R2 (the same
artifact the RunPod /fetch-url path used — registry-skip fix baked in), decrypts
it in-build, runs the milaidy build (tsdown BACKEND ONLY — we skip the vite SPA
which needs ~24GB heap and isn't required for the agent/emote-relay server), and
applies the @elizaos -> milaidy source remap. The runtime starts Xvfb + the Node
server and exposes :8080.

Usage:
  ~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_runtime.py
  -> https://rndrntwrk--alice-runtime-web.modal.run

Secrets (already created via `modal secret create`):
  alice-build:   ALICE_KEY_HEX, ALICE_IV_HEX   (aes-256-cbc decrypt of R2 source)
  alice-runtime: STREAM555_AGENT_TOKEN, ELIZA_VAULT_PASSPHRASE,
                 MILAIDY_CREDENTIALS_MASTER_KEY
"""

import base64

import modal

app = modal.App("alice-runtime")

R2_BASE = "https://pub-322696b8cb0e447abd9d87725628383a.r2.dev/alice.enc"
CHUNKS = 4
EXPECTED_SHA = "0fb9fa04b328e89aec97b369a3c52bb15b058d55e4007798d0526ed4a06c1fa2"
MILAIDY = "/build/src/555-bot/milaidy"
SCRIPTS = "/build/src/555-bot/scripts"

# Native deps mirror the RunPod buildScript (canvas/cairo, chromium, ffmpeg, xvfb).
APT = [
    "python3", "make", "g++", "git", "pkg-config",
    "libcairo2-dev", "libpango1.0-dev", "libjpeg-dev", "libgif-dev",
    "librsvg2-dev", "libpixman-1-dev", "libsecret-1-dev",
    "ca-certificates", "curl", "openssl", "xz-utils",
    "chromium", "libnss3", "libnspr4", "libatk1.0-0", "libatk-bridge2.0-0",
    "libcups2", "libdrm2", "libxkbcommon0", "libxcomposite1", "libxdamage1",
    "libxfixes3", "libxrandr2", "libgbm1", "libasound2", "libpango-1.0-0",
    "libcairo2", "libatspi2.0-0", "ffmpeg", "xvfb", "dumb-init", "libopus-dev",
]

# Build steps: decrypt+extract the R2 source, install, build backend (tsdown),
# then the @elizaos -> source remap. Runs in the Modal image builder.
_BUILD = rf"""
set -euxo pipefail
export BUN_INSTALL=/root/.bun
export PATH="$BUN_INSTALL/bin:$PATH"
export NODE_LLAMA_CPP_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PUPPETEER_SKIP_DOWNLOAD=1 CYPRESS_INSTALL_BINARY=0

# 1. pull encrypted chunks from R2 (Modal's fast network), concat, decrypt, extract
mkdir -p /build && cd /build
: > alice.enc
for i in $(seq 0 {CHUNKS - 1}); do curl -fsSL "{R2_BASE}.part$i" >> alice.enc; done
openssl enc -d -aes-256-cbc -K "$ALICE_KEY_HEX" -iv "$ALICE_IV_HEX" -in alice.enc -out alice.tar.gz
sha=$(sha256sum alice.tar.gz | cut -d' ' -f1)
[ "$sha" = "{EXPECTED_SHA}" ] || {{ echo "sha mismatch: $sha"; exit 1; }}
mkdir -p /build/src && tar xzf alice.tar.gz -C /build/src
rm -f alice.enc alice.tar.gz

# 2. toolchain
npm install -g bun@1.3.10
npm install --prefix /opt/tsx --ignore-scripts --no-save tsx@4.21.0
npm cache clean --force || true

# 3. install + build (BACKEND ONLY via tsdown; skip vite SPA to avoid 24GB OOM)
cd {MILAIDY}
node {SCRIPTS}/resolve-milaidy-missing-workspaces.mjs {MILAIDY}
bun {SCRIPTS}/pin-alice-release-runtime-deps.mjs {MILAIDY}
bun install --no-progress --ignore-scripts --linker=hoisted --network-concurrency=8
node {SCRIPTS}/build-milaidy-runtime-plugin-workspaces.mjs {MILAIDY}
test -f node_modules/@elizaos/plugin-sql/package.json
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsdown --config-loader native --fail-on-warn false
test -f dist/entry.js

# 4. @elizaos -> milaidy source remap (mirrors the RunPod buildScript)
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
find packages eliza -path '*/node_modules/@elizaos/agent' -not -path '*/node_modules/.bun/*' -exec rm -rf {{}} + || true
test -f node_modules/@elizaos/app-core/src/index.ts
test -f node_modules/@elizaos/agent/src/api/config-env.ts
cp {SCRIPTS}/seed-knowledge.ts scripts/seed-knowledge.ts || true
"""

alice_image = (
    modal.Image.from_registry("node:22-bookworm-slim", add_python="3.11")
    .apt_install(*APT)
    # base64 the whole script onto ONE Dockerfile RUN line (embedded newlines
    # would otherwise be parsed as separate Dockerfile instructions), then
    # decode + run it with bash.
    .run_commands(
        f"echo {base64.b64encode(_BUILD.encode()).decode()} | base64 -d | bash",
        secrets=[modal.Secret.from_name("alice-build")],
    )
)

# Non-secret runtime env (the proven RunPod runtimeEnv). State dirs under /tmp
# (ephemeral; embeddings/vault are throwaway). Secret env (token/passphrase/
# master key) comes from the alice-runtime secret.
RUNTIME_ENV = {
    "NODE_ENV": "production",
    "PORT": "8080",
    "MILADY_PORT": "8080",
    "ELIZA_PORT": "8080",
    "MILADY_API_BIND": "0.0.0.0",
    "ELIZA_API_BIND": "0.0.0.0",
    "ELIZA_ALLOWED_HOSTS": "*",
    # The browser sends Origin on module-script subresources; milady's CORS guard
    # (resolveCorsOrigin) 403s any Origin not on the allowlist. The wildcard-bind
    # relaxation does not fire here (milady rewrites the bind host internally,
    # Modal proxies via localhost), and the allowlist needs the EXACT origin (no
    # `*` expansion), so list the Modal public origin explicitly. Without this
    # every /assets/*.js 403s and the avatar SPA never boots.
    "MILADY_ALLOWED_ORIGINS": "https://rndrntwrk--alice.modal.run",
    "ELIZA_ALLOWED_ORIGINS": "https://rndrntwrk--alice.modal.run",
    "ELIZA_DISABLE_LOCAL_EMBEDDINGS": "1",
    "MILADY_DISABLE_AUTO_BOOTSTRAP": "1",
    "ELIZA_VAULT_DISABLE_KEYCHAIN": "1",
    # Keep the public Modal API locked. Modal provides MILADY_API_TOKEN via the
    # alice-api-token secret, and the companion/capture browser authenticates
    # with /companion#token=<token>. Do not disable auth on this public URL:
    # Alice's API can execute code and expose secrets.
    "MILADY_AUTH_DISABLED": "0",
    "MILAIDY_AUTH_DISABLED": "0",
    "ELIZA_AUTH_DISABLED": "0",
    "API_AUTH_DISABLED": "0",
    "MILADY_STATE_DIR": "/tmp/alice-state/milaidy",
    "MILAIDY_HOME": "/tmp/alice-state/milaidy",
    "ELIZA_STATE_DIR": "/tmp/alice-state/milaidy",
    "CACHE_DIR": "/tmp/alice-state/eliza/cache",
    "MODELS_DIR": "/tmp/alice-state/eliza/models",
    "PGLITE_DATA_DIR": "/tmp/alice-state/milaidy/workspace/.eliza/.elizadb",
    "CHROMIUM_PATH": "/usr/bin/chromium",
    "DISPLAY": ":99",
    "HOME": "/tmp/alice-state/home",
    "STREAM555_BASE_URL": "https://stream.rndrntwrk.com",
    "STREAM555_CONTROL_PLUGIN_ENABLED": "true",
    "STREAM_PLUGIN_ENABLED": "true",
    "STREAM555_DEFAULT_SESSION_ID": "alice",
    "STREAM555_REQUIRE_APPROVALS": "false",
    "STREAM555_DEST_SYNC_ON_GO_LIVE": "false",
    "STREAM555_DEST_TWITCH_ENABLED": "false",
    "STREAM555_DEST_KICK_ENABLED": "false",
    "STREAM555_DEST_YOUTUBE_ENABLED": "false",
    "STREAM555_DEST_PUMPFUN_ENABLED": "false",
    "ANTHROPIC_API_KEY": "",
}


@app.function(
    image=alice_image,
    cpu=4.0,
    memory=8192,
    min_containers=0,          # scale to zero when idle (cost)
    buffer_containers=0,       # no warm spare during staging/dev smokes
    scaledown_window=60,       # short warm tail; redeploy/wake only for proof windows
    timeout=3600,
    # alice-runtime: agent token / vault passphrase / master key.
    # alice-api-token: MILADY_API_TOKEN — a KNOWN inbound API token. Modal is
    # detected as a cloud-provisioned container, so without this milady
    # auto-generates a RANDOM unknowable token and 401s every /api call; the
    # companion (and the capture browser) authenticate by loading
    # /companion#token=<MILADY_API_TOKEN>. Keeps the public Modal URL locked.
    secrets=[
        modal.Secret.from_name("alice-runtime"),
        modal.Secret.from_name("alice-api-token"),
    ],
)
@modal.web_server(port=8080, startup_timeout=900, label="alice")
def alice_web():
    """Launch Xvfb + the Node runtime; Modal proxies :8080 once it binds."""
    import os
    import subprocess
    import time

    os.environ.update(RUNTIME_ENV)
    for d in [
        "/tmp/alice-state/home",
        "/tmp/alice-state/milaidy",
        "/tmp/alice-state/eliza/cache",
        "/tmp/alice-state/eliza/models/text",
    ]:
        os.makedirs(d, exist_ok=True)

    # Xvfb for the headless avatar/render paths.
    subprocess.Popen(["Xvfb", ":99", "-screen", "0", "1920x1080x24"])
    time.sleep(2)

    # Long-running Node server; Popen + return, Modal waits for :8080.
    subprocess.Popen(
        ["node", "--import", "/opt/tsx/node_modules/tsx/dist/loader.mjs",
         "milady.mjs", "start"],
        cwd=MILAIDY,
        env=os.environ.copy(),
    )


@app.local_entrypoint()
def main():
    print("Alice runtime Modal app. Deploy with:")
    print("  ~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_runtime.py")
