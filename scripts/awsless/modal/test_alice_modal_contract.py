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


def test_runtime_scales_to_zero():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "min_containers=0" in source
    assert "alice-runtime" in source


def test_runtime_timeout_is_four_hour_ceiling():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert "timeout=14400" in source


def test_runtime_uses_milaidy_own_build_scripts():
    # Single source of truth: the image build must run the milaidy tree's own
    # (proven, release-branch) build scripts, not the drifted 555-bot/scripts
    # copies. The release artifact carries milaidy/scripts.
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert 'SCRIPTS = "/build/src/555-bot/milaidy/scripts"' in source


def test_runtime_fetches_private_r2_with_pinned_wrangler():
    source = (ROOT / "scripts/awsless/modal/alice_runtime.py").read_text()
    assert 'R2_BUCKET = "alice-xfer"' in source
    assert 'ALICE_R2_API_TOKEN' in source
    assert 'wrangler r2 object get "{R2_BUCKET}/alice.enc.part$i"' in source
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
    assert "apps/app/dist/index.html" in text  # SPA presence preflight
    assert "--exclude 'node_modules'" in text
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
