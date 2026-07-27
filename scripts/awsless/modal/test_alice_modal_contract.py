"""Static contract tests for the Alice Modal release rail.

These lock the cost and auth posture of the two Modal launchers:
scale-to-zero everywhere, singleton capture, four-hour runtime ceiling
(matches the bounded staging-window rule), and fragment token delivery
(the SPA bootstrap in apps/app/src/main.tsx accepts #token=... and
refuses ?token=..., so the token never reaches server logs or Referer).
"""

import ast
import os
import shutil
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]


def write_operator_bridge_fixture(root: Path) -> None:
    source = root / "packages/agent/src/api/alice-operator-routes.ts"
    source.parent.mkdir(parents=True, exist_ok=True)
    source.write_text(
        'import type { RouteRequestContext } from "./route-helpers";\n'
        "export const ALICE_OPERATOR_ALLOWED_ACTIONS = new Set([\n"
        '  "STREAM555_GO_LIVE",\n'
        "]);\n"
        "export async function handleAliceOperatorRoutes(\n"
        "  _ctx: RouteRequestContext,\n"
        "): Promise<boolean> {\n"
        "  return false;\n"
        "}\n"
    )

    server = root / "eliza/packages/agent/src/api/server.ts"
    server.write_text(
        'import { handleAvatarRoutes } from "./avatar-routes.ts";\n'
        "\n"
        "  // ── Avatar routes (extracted to avatar-routes.ts) ───────────────────\n"
        "  if (\n"
        "    await handleAvatarRoutes({\n"
        "      req,\n"
        "      res,\n"
        "      method,\n"
        "      pathname,\n"
        "      json,\n"
        "      error,\n"
        "    })\n"
        "  ) {\n"
        "    return;\n"
        "  }\n"
    )


def test_runtime_scales_to_zero():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "min_containers=0" in source
    assert "buffer_containers=0" in source
    assert "scaledown_window=300" in source
    assert "alice-runtime" in source


def test_runtime_timeout_is_four_hour_ceiling():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "timeout=14400" in source


def test_runtime_api_secret_uses_eliza_token_name():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "alice-api-token: ELIZA_API_TOKEN" in source
    assert 'modal.Secret.from_name("alice-api-token")' in source
    assert "MILADY_API_TOKEN" not in source


def test_runtime_injects_destinations_without_overwriting_them_at_boot():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert 'modal.Secret.from_name("alice-stream-destinations")' in source
    for platform in ("TWITCH", "KICK", "YOUTUBE", "PUMPFUN"):
        assert f'"STREAM555_DEST_{platform}_ENABLED": "false"' not in source
    assert '"STREAM555_DEST_SYNC_ON_GO_LIVE": "false"' in source


def test_runtime_uses_a_later_short_lived_stream_control_override():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert 'modal.Secret.from_name("alice-runtime")' in source
    assert 'modal.Secret.from_name("alice-stream-control")' in source
    assert source.index('modal.Secret.from_name("alice-runtime")') < source.index(
        'modal.Secret.from_name("alice-stream-control")'
    )


def test_runtime_stages_all_hoisted_node_modules():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert '"ELIZA_STAGE_ALL_HOISTED_NODE_MODULES": "true"' in source


def test_runtime_uses_milaidy_own_build_scripts():
    # Single source of truth: the image build must run the milaidy tree's own
    # (proven, release-branch) build scripts, not the drifted 555-bot/scripts
    # copies. The release artifact carries milaidy/scripts.
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert 'SCRIPTS = "/build/src/555-bot/milaidy/scripts"' in source


def test_runtime_remaps_agent_to_alice_feature_surface_after_build():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    remap = source.split("# 4. @elizaos -> milaidy source remap", 1)[1]
    remap = remap.split("find packages eliza", 1)[0]

    upstream_copies = (
        "cp eliza/packages/agent/package.json node_modules/@elizaos/agent/",
        "cp -a eliza/packages/agent/src node_modules/@elizaos/agent/src",
        "cp -a eliza/packages/agent/dist node_modules/@elizaos/agent/dist 2>/dev/null || true",
    )
    alice_copies = (
        "cp packages/agent/package.json node_modules/@elizaos/agent/",
        "cp -a packages/agent/src node_modules/@elizaos/agent/src",
        "cp -a packages/agent/dist node_modules/@elizaos/agent/dist 2>/dev/null || true",
    )

    for copy_line in alice_copies:
        assert copy_line in remap
    for copy_line in upstream_copies:
        assert copy_line not in remap

    # The public broadcast route must resolve the relative Vite asset paths at
    # the document root.  This implementation lives in Alice's agent fork,
    # not in the current upstream Eliza package used by the old remap.
    alice_static_server = (
        ROOT / "555-bot/milaidy/packages/agent/src/api/static-file-server.ts"
    ).read_text()
    assert 'injectBaseHrefIntoHtml(html, "/")' in alice_static_server
    assert "shouldInjectRootBaseHref(pathname)" in alice_static_server


def test_runtime_ports_operator_bridge_into_canonical_agent_before_compilation():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "alice-operator-routes.ts" in source
    assert "handleAliceOperatorRoutes" in source
    assert "eliza/packages/agent/src/api/server.ts" in source
    assert source.index("operator_source = root") < source.index("raise SystemExit(0)")


def test_runtime_ports_session_bootstrap_into_operator_allowlist():
    runtime_source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    tree = ast.parse(runtime_source)
    patch_node = next(
        node.value
        for node in tree.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "ALICE_SOURCE_PATCH"
            for target in node.targets
        )
    )
    patch_source = ast.literal_eval(patch_node)

    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        route = root / "eliza/packages/agent/src/api/misc-routes.ts"
        route.parent.mkdir(parents=True)
        route.write_text(
            '''import {
  EMOTE_BY_ID,
  EMOTE_CATALOG,
} from "../emotes/catalog.ts";

function loadCompanionEmotes(): {
  catalog: EmoteDef[];
  byId: Map<string, EmoteDef>;
} {
  return { catalog: EMOTE_CATALOG, byId: EMOTE_BY_ID };
}

async function postEmote() {
  const streamControl = state.runtime.getService("stream555");
  streamControl.broadcastEvent("emote", { emoteId: "wave" });
  json(res, { ok: true, broadcast });
}
'''
        )
        write_operator_bridge_fixture(root)

        old_root = os.environ.get("MILAIDY_ROOT")
        os.environ["MILAIDY_ROOT"] = str(root)
        try:
            try:
                exec(patch_source, {"__name__": "alice_operator_patch_test"})
            except SystemExit as exit_signal:
                assert exit_signal.code == 0
        finally:
            if old_root is None:
                os.environ.pop("MILAIDY_ROOT", None)
            else:
                os.environ["MILAIDY_ROOT"] = old_root

        operator_route = (
            root / "eliza/packages/agent/src/api/alice-operator-routes.ts"
        ).read_text()
        assert '"STREAM555_BOOTSTRAP_SESSION"' in operator_route


def test_runtime_refuses_to_publish_a_server_without_the_operator_bridge():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert 'grep -aq "/api/alice/operator/execute" dist/entry.js' in source


def test_runtime_fetches_private_r2_with_pinned_wrangler():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert 'R2_BUCKET = "alice-xfer"' in source
    assert 'ARTIFACT_PREFIX = "alice-release-20260723-livefix"' in source
    assert 'modal.Secret.from_name("alice-build-release-20260723-livefix")' in source
    assert 'ALICE_R2_API_TOKEN' in source
    assert 'wrangler r2 object get "{R2_BUCKET}/{ARTIFACT_PREFIX}/alice.enc.part$i"' in source
    assert '--file="alice.enc.part$i" --remote' in source
    assert 'wrangler@{WRANGLER_VERSION}' in source
    assert 'WRANGLER_VERSION = "4.113.0"' in source
    assert 'CLOUDFLARE_ACCOUNT_ID="{R2_ACCOUNT_ID}"' in source
    assert ': "${{ALICE_R2_API_TOKEN:?ALICE_R2_API_TOKEN is required}}"' in source
    assert ': "${ALICE_R2_API_TOKEN:?ALICE_R2_API_TOKEN is required}"' not in source
    assert 'set +x' in source
    assert 'unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID' in source


def test_runtime_does_not_use_public_r2_base():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "R2_BASE" not in source
    assert "r2.dev" not in source


def test_runtime_captures_tar_stderr_without_warning_spam():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "if tar xzf alice.tar.gz -C /build/src 2>/build/tar-extract.stderr; then" in source
    assert "rm -f /build/tar-extract.stderr" in source
    assert "tar stderr (last 120 lines):" in source
    assert "tail -n 120 /build/tar-extract.stderr >&2" in source


def test_runtime_fails_closed_on_tar_extraction_error():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "tar_status=$?" in source
    assert 'exit "$tar_status"' in source
    assert "2>/build/tar-extract.stderr" in source


def test_runtime_emote_patch_accepts_integrated_modern_route_unchanged():
    runtime_source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    tree = ast.parse(runtime_source)
    patch_node = next(
        node.value
        for node in tree.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "ALICE_SOURCE_PATCH"
            for target in node.targets
        )
    )
    patch_source = ast.literal_eval(patch_node)

    modern_route = '''import {
  EMOTE_BY_ID,
  EMOTE_CATALOG,
  type EmoteDef,
} from "../emotes/catalog.ts";

function loadCompanionEmotes(): {
  catalog: EmoteDef[];
  byId: Map<string, EmoteDef>;
} {
  return { catalog: EMOTE_CATALOG, byId: EMOTE_BY_ID };
}

async function postEmote() {
  const streamControl = state.runtime.getService("stream555");
  streamControl.broadcastEvent("emote", { emoteId: "wave" });
  json(res, { ok: true, broadcast });
}
'''

    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        route = root / "eliza/packages/agent/src/api/misc-routes.ts"
        route.parent.mkdir(parents=True)
        route.write_text(modern_route)
        write_operator_bridge_fixture(root)
        before = route.read_text()

        old_root = os.environ.get("MILAIDY_ROOT")
        os.environ["MILAIDY_ROOT"] = str(root)
        try:
            try:
                exec(patch_source, {"__name__": "alice_source_patch_test"})
            except SystemExit as exit_signal:
                assert exit_signal.code == 0
        finally:
            if old_root is None:
                os.environ.pop("MILAIDY_ROOT", None)
            else:
                os.environ["MILAIDY_ROOT"] = old_root

        assert route.read_text() == before


def test_runtime_emote_patch_keeps_strict_modern_route_markers():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "re.search" in source
    assert r"EMOTE_BY_ID\b" in source
    assert r"EMOTE_CATALOG\b" in source
    assert r"\.\./emotes/catalog\.ts" in source
    assert 'streamControl.broadcastEvent("emote",' in source
    assert '"json(res, { ok: true, broadcast });"' in source
    assert 'raise SystemExit("Alice emote patch failed: /api/emote block not found")' in source


def test_runtime_emote_patch_accepts_exact_release_assembly_when_present():
    assembly_route = (
        ROOT
        / ".alice-tmp/alice-release-assembly.33bec-verify.DopMWS"
        / "eliza/packages/agent/src/api/misc-routes.ts"
    )
    if not assembly_route.is_file():
        pytest.skip("exact release assembly is absent in this checkout")

    runtime_source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    tree = ast.parse(runtime_source)
    patch_node = next(
        node.value
        for node in tree.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "ALICE_SOURCE_PATCH"
            for target in node.targets
        )
    )
    patch_source = ast.literal_eval(patch_node)

    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        route = root / "eliza/packages/agent/src/api/misc-routes.ts"
        route.parent.mkdir(parents=True)
        shutil.copy2(assembly_route, route)
        write_operator_bridge_fixture(root)
        before = route.read_bytes()

        old_root = os.environ.get("MILAIDY_ROOT")
        os.environ["MILAIDY_ROOT"] = str(root)
        try:
            try:
                exec(patch_source, {"__name__": "alice_exact_release_patch_test"})
            except SystemExit as exit_signal:
                assert exit_signal.code == 0
        finally:
            if old_root is None:
                os.environ.pop("MILAIDY_ROOT", None)
            else:
                os.environ["MILAIDY_ROOT"] = old_root

        assert route.read_bytes() == before


def test_artifact_builder_is_present_and_excludes_node_modules():
    builder = ROOT / "scripts/awsless/modal/build-alice-artifact.sh"
    text = builder.read_text()
    assert 'test -f "$MILAIDY_ROOT/milady.mjs"' in text  # Modal runtime launcher preflight
    assert "apps/app/dist/index.html" in text  # SPA presence preflight
    assert "--exclude 'node_modules'" in text
    assert "--exclude '.bun-cache'" in text
    assert "openssl rand -hex 32" in text  # fresh key material every run


def test_artifact_builder_strips_macos_archive_metadata():
    text = (ROOT / "scripts/awsless/modal/build-alice-artifact.sh").read_text()
    assert "COPYFILE_DISABLE=1 tar czf" in text
    assert "--exclude '._*'" in text
    assert "--exclude '*/._*'" in text


def test_artifact_builder_honors_external_staging_root():
    text = (ROOT / "scripts/awsless/modal/build-alice-artifact.sh").read_text()
    assert 'STAGE_ROOT="${ALICE_ARTIFACT_STAGE_ROOT:-${TMPDIR:-/tmp}}"' in text
    assert 'mkdir -p "$STAGE_ROOT"' in text
    assert 'mktemp -d "$STAGE_ROOT/alice-artifact-stage.XXXXXX"' in text


def test_capture_is_singleton_and_uses_fragment_auth():
    source = (ROOT / "scripts/awsless/modal/alice_capture_service.py").read_text()
    assert "min_containers=0" in source
    assert "max_containers=1" in source
    assert "/companion#token=" in source
    assert "/companion?token=" not in source
