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
  alice-build-release-20260723-livefix:
                 ALICE_KEY_HEX, ALICE_IV_HEX, ALICE_R2_API_TOKEN
                 (aes-256-cbc decrypt of R2 source; private R2 read token)
  alice-runtime: STREAM555_AGENT_TOKEN, ELIZA_VAULT_PASSPHRASE,
                 MILAIDY_CREDENTIALS_MASTER_KEY
  alice-stream-control: short-lived STREAM555_AGENT_TOKEN override for
                        bounded public livestream control
  alice-stream-destinations: enabled platform RTMP destinations and stream keys
"""

import base64

import modal

app = modal.App("alice-runtime")

R2_ACCOUNT_ID = "036df6c823669b8fa2f66cf4c16eeb29"
R2_BUCKET = "alice-xfer"
ARTIFACT_PREFIX = "alice-release-20260723-livefix"
WRANGLER_VERSION = "4.113.0"
CHUNKS = 4
EXPECTED_SHA = "e7bb0b0d94bf65428241facfa40c45506af6fc2a29f8f6cbc9335fcc32eae6fe"
MILAIDY = "/build/src/555-bot/milaidy"
# Use the milaidy tree's OWN build scripts (tarred inside the release artifact)
# as the single source of truth. The separate 555-bot/scripts copies drifted
# from the proven release-branch versions (resolve/pin/build-workspaces were
# rewritten during the livestream-recovery work to build the full server
# workspace set in dependency order); pointing here removes the dual-copy hazard.
SCRIPTS = "/build/src/555-bot/milaidy/scripts"

ALICE_SOURCE_PATCH = r"""
import os
import re
from pathlib import Path

root = Path(os.environ["MILAIDY_ROOT"])
route = root / "eliza/packages/agent/src/api/misc-routes.ts"
text = route.read_text()

# Keep the canonical Eliza agent package intact, then port only the Alice
# operator bridge it does not own. This must run before the idempotent emote
# fast-path below, which may exit after observing a previously patched route.
operator_source = root / "packages/agent/src/api/alice-operator-routes.ts"
canonical_operator_route = root / "eliza/packages/agent/src/api/alice-operator-routes.ts"
if not operator_source.is_file():
    raise SystemExit("Alice operator patch failed: source route not found")

operator_text = operator_source.read_text().replace(
    'from "./route-helpers";',
    'from "./route-helpers.ts";',
)
if "handleAliceOperatorRoutes" not in operator_text:
    raise SystemExit("Alice operator patch failed: source handler missing")

# A new control plane begins without the persisted default session.  Bootstrap
# is the plugin's existing session-creation action, so permit it through the
# otherwise narrow operator allowlist before a status or Go Live request.
operator_allowlist_anchor = 'export const ALICE_OPERATOR_ALLOWED_ACTIONS = new Set([\n'
bootstrap_action = '  "STREAM555_BOOTSTRAP_SESSION",\n'
if operator_allowlist_anchor not in operator_text:
    raise SystemExit("Alice operator patch failed: allowlist anchor not found")
if bootstrap_action not in operator_text:
    operator_text = operator_text.replace(
        operator_allowlist_anchor,
        operator_allowlist_anchor + bootstrap_action,
        1,
    )
canonical_operator_route.write_text(operator_text)

server = root / "eliza/packages/agent/src/api/server.ts"
server_text = server.read_text()
operator_import = 'import { handleAliceOperatorRoutes } from "./alice-operator-routes.ts";\n'
avatar_import = 'import { handleAvatarRoutes } from "./avatar-routes.ts";\n'
if operator_import not in server_text:
    if avatar_import not in server_text:
        raise SystemExit("Alice operator patch failed: avatar import anchor not found")
    server_text = server_text.replace(avatar_import, avatar_import + operator_import)

avatar_dispatch = '''  // ── Avatar routes (extracted to avatar-routes.ts) ───────────────────
  if (
    await handleAvatarRoutes({
      req,
      res,
      method,
      pathname,
      json,
      error,
    })
  ) {
    return;
  }
'''
operator_dispatch = '''
  // ── Alice operator routes (ported from Alice-owned agent source) ─────
  if (
    await handleAliceOperatorRoutes({
      req,
      res,
      method,
      pathname,
      json,
      error,
      readJsonBody,
      runtime: state.runtime,
    })
  ) {
    return;
  }
'''
if operator_dispatch not in server_text:
    if avatar_dispatch not in server_text:
        raise SystemExit("Alice operator patch failed: avatar dispatch anchor not found")
    server_text = server_text.replace(avatar_dispatch, avatar_dispatch + operator_dispatch)
server.write_text(server_text)
print("[alice-runtime] ported Alice operator bridge into canonical agent")

# The release source may already contain the Alice emote route. Require all
# current catalog/loader/live-broadcast markers before treating it as complete;
# a partial route must still go through the legacy migration and fail closed.
modern_route_markers = (
    bool(re.search(
        r'import\s*\{(?=[^}]*\bEMOTE_BY_ID\b)(?=[^}]*\bEMOTE_CATALOG\b)'
        r'[^}]*\}\s*from\s*"\.\./emotes/catalog\.ts"\s*;',
        text,
    )),
    bool(re.search(r"function\s+loadCompanionEmotes\(\)\s*:", text)),
    bool(re.search(
        r"return\s*\{\s*catalog:\s*EMOTE_CATALOG,\s*"
        r"byId:\s*EMOTE_BY_ID\s*\};",
        text,
    )),
    'streamControl.broadcastEvent("emote",' in text,
    "json(res, { ok: true, broadcast });" in text,
)
if all(modern_route_markers):
    print("[alice-runtime] modern Alice emote routes already integrated")
    raise SystemExit(0)

catalog_import = (
    'import { EMOTE_BY_ID, EMOTE_CATALOG } from '
    '"../../../../../packages/agent/src/emotes/catalog.ts";\n'
)

if catalog_import not in text:
    core_import = '''import {
  type AgentRuntime,
  buildStoreVariantBlockedMessage,
  composePrompt,
  customActionGenerateTemplate,
  isLocalCodeExecutionAllowed,
  ModelType,
} from "@elizaos/core";
'''
    patched_core_import = '''import {
  type AgentRuntime,
  buildStoreVariantBlockedMessage,
  composePrompt,
  customActionGenerateTemplate,
  isLocalCodeExecutionAllowed,
  ModelType,
  logger,
} from "@elizaos/core";
'''
    if core_import not in text:
        raise SystemExit("Alice emote patch failed: core import anchor not found")
    text = text.replace(core_import, patched_core_import)

    route_import_anchor = 'import { resolveTerminalRunLimits } from "./terminal-run-limits.ts";\n'
    if route_import_anchor not in text:
        raise SystemExit("Alice emote patch failed: route import anchor not found")
    text = text.replace(route_import_anchor, route_import_anchor + catalog_import)

old_get = '''  // ── GET /api/emotes ──────────────────────────────────────────────────
  if (method === "GET" && pathname === "/api/emotes") {
    const emotes = await loadCompanionEmotes();
    json(res, { emotes: emotes.catalog });
    return true;
  }
'''
new_get = '''  // ── GET /api/emotes ──────────────────────────────────────────────────
  if (method === "GET" && pathname === "/api/emotes") {
    json(res, { emotes: EMOTE_CATALOG });
    return true;
  }
'''
if old_get in text:
    text = text.replace(old_get, new_get)
elif new_get not in text:
    raise SystemExit("Alice emote patch failed: /api/emotes block not found")

old_post = '''    const body = parsedEmote.data;
    const emotes = await loadCompanionEmotes();
    const emote = body.emoteId ? emotes.byId.get(body.emoteId) : undefined;
    if (!emote) {
      error(res, `Unknown emote: ${body.emoteId ?? "(none)"}`);
      return true;
    }
    state.broadcastWs?.({
      type: "emote",
      emoteId: emote.id,
      path: emote.path,
      duration: emote.duration,
      loop: false,
    });
    json(res, { ok: true });
    return true;
'''
new_post = '''    const body = parsedEmote.data;
    const emote = body.emoteId ? EMOTE_BY_ID.get(body.emoteId) : undefined;
    if (!emote) {
      error(res, `Unknown emote: ${body.emoteId ?? "(none)"}`);
      return true;
    }
    const emotePayload = {
      emoteId: emote.id,
      path: emote.path,
      duration: emote.duration,
      loop: false,
    };
    state.broadcastWs?.({ type: "emote", ...emotePayload });

    const streamControl =
      (state.runtime?.getService?.("stream555") as
        | {
            broadcastEvent?: (
              topic: string,
              payload: unknown,
            ) => Promise<unknown>;
          }
        | undefined) ?? undefined;
    if (streamControl && typeof streamControl.broadcastEvent === "function") {
      void streamControl
        .broadcastEvent("emote", emotePayload)
        .catch((err: unknown) => {
          logger.debug?.(
            "[misc-routes] LiveKit emote broadcast failed (non-fatal):",
            err instanceof Error ? err.message : String(err),
          );
        });
    }

    json(res, { ok: true });
    return true;
'''
if old_post in text:
    text = text.replace(old_post, new_post)
elif new_post not in text:
    raise SystemExit("Alice emote patch failed: /api/emote block not found")

route.write_text(text)
print("[alice-runtime] patched upstream agent emote routes to Alice catalog")
"""

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

# Build steps: fetch/decrypt+extract the R2 source, install, build backend (tsdown),
# then the @elizaos -> source remap. Runs in the Modal image builder.
_BUILD = rf"""
set -euxo pipefail
export BUN_INSTALL=/root/.bun
export PATH="$BUN_INSTALL/bin:$PATH"
export NODE_LLAMA_CPP_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PUPPETEER_SKIP_DOWNLOAD=1 CYPRESS_INSTALL_BINARY=0

# 1. Pull encrypted chunks from private R2 (Modal's fast network), concat,
# decrypt, and extract. Keep the token setup and Wrangler calls outside xtrace.
mkdir -p /build && cd /build
: > alice.enc
set +x
: "${{ALICE_R2_API_TOKEN:?ALICE_R2_API_TOKEN is required}}"
export CLOUDFLARE_API_TOKEN="$ALICE_R2_API_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="{R2_ACCOUNT_ID}"
npm install --global "wrangler@{WRANGLER_VERSION}" --no-fund --no-audit
for i in $(seq 0 {CHUNKS - 1}); do
  wrangler r2 object get "{R2_BUCKET}/{ARTIFACT_PREFIX}/alice.enc.part$i" \
    --file="alice.enc.part$i" --remote
  cat "alice.enc.part$i" >> alice.enc
  rm -f "alice.enc.part$i"
done
unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
# Do not xtrace the decrypt command: it expands ALICE_KEY_HEX/ALICE_IV_HEX.
openssl enc -d -aes-256-cbc -K "$ALICE_KEY_HEX" -iv "$ALICE_IV_HEX" -in alice.enc -out alice.tar.gz
set -x
sha=$(sha256sum alice.tar.gz | cut -d' ' -f1)
[ "$sha" = "{EXPECTED_SHA}" ] || {{ echo "sha mismatch: $sha"; exit 1; }}
mkdir -p /build/src
if tar xzf alice.tar.gz -C /build/src 2>/build/tar-extract.stderr; then
  rm -f /build/tar-extract.stderr
else
  tar_status=$?
  echo "Alice artifact extraction failed; tar stderr (last 120 lines):" >&2
  tail -n 120 /build/tar-extract.stderr >&2 || true
  exit "$tar_status"
fi
rm -f alice.enc alice.tar.gz
MILAIDY_ROOT="{MILAIDY}" python3 - <<'PY'
{ALICE_SOURCE_PATCH}
PY

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
grep -aq "/api/alice/operator/execute" dist/entry.js

# 4. @elizaos -> milaidy source remap (mirrors the RunPod buildScript)
rm -rf node_modules/@elizaos/app-core node_modules/@elizaos/agent node_modules/@elizaos/vault node_modules/@miladyai/shared
mkdir -p node_modules/@elizaos/app-core node_modules/@elizaos/agent node_modules/@elizaos/vault node_modules/@miladyai/shared
cp packages/app-core/package.json node_modules/@elizaos/app-core/
cp -a packages/app-core/src node_modules/@elizaos/app-core/src
cp -a packages/app-core/dist node_modules/@elizaos/app-core/dist 2>/dev/null || true
# The entry bundle keeps @elizaos/agent external.  Resolve that external to
# Alice's fork rather than the upstream Eliza checkout: it carries the public
# broadcast shell behavior (including root-base injection for Vite's relative
# assets), companion routes, and the Alice operator surface.  This matches the
# proven RunPod bootstrap layout.
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
        # Version the artifact decrypt secret with the R2 prefix. This lets the
        # old deployment retain its matching key until the recreated app is live.
        secrets=[modal.Secret.from_name("alice-build-release-20260723-livefix")],
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
    # Canonical Eliza plugin staging must link hoisted dependencies in the Modal assembly.
    "ELIZA_STAGE_ALL_HOISTED_NODE_MODULES": "true",
    # Keep the public Modal API locked. Modal provides ELIZA_API_TOKEN via the
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
    # Destination credentials and enabled flags are injected at runtime by the
    # dedicated alice-stream-destinations secret. Keep them out of this mapping:
    # alice_web applies RUNTIME_ENV after Modal has injected its secrets.
    "STREAM555_DEST_SYNC_ON_GO_LIVE": "false",
    "ANTHROPIC_API_KEY": "",
}


@app.function(
    image=alice_image,
    cpu=4.0,
    memory=8192,
    min_containers=0,          # scale to zero when idle (cost)
    buffer_containers=0,       # no warm spare during staging/dev smokes
    scaledown_window=300,      # 5m tail covers the 86.9s boot with operational margin
    timeout=14400,             # four-hour ceiling = bounded staging-window maximum
    # alice-runtime: agent token / vault passphrase / master key.
    # alice-stream-control: short-lived, admin-issued control token. This comes
    # after alice-runtime so it overrides only STREAM555_AGENT_TOKEN when the
    # durable Alice identity is intentionally authorized for a live test.
    # alice-api-token: ELIZA_API_TOKEN — a KNOWN inbound API token. Modal is
    # detected as a cloud-provisioned container, so without this milady
    # auto-generates a RANDOM unknowable token and 401s every /api call; the
    # companion (and the capture browser) authenticate by loading
    # /companion#token=<ELIZA_API_TOKEN>. Keeps the public Modal URL locked.
    secrets=[
        modal.Secret.from_name("alice-runtime"),
        modal.Secret.from_name("alice-api-token"),
        modal.Secret.from_name("alice-stream-destinations"),
        modal.Secret.from_name("alice-stream-control"),
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
