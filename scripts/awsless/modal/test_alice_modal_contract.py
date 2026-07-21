"""Static contract tests for the Alice Modal release rail.

These lock the cost and auth posture of the two Modal launchers:
scale-to-zero everywhere, singleton capture, four-hour runtime ceiling
(matches the bounded staging-window rule), and fragment token delivery
(the SPA bootstrap in apps/app/src/main.tsx accepts #token=... and
refuses ?token=..., so the token never reaches server logs or Referer).
"""

from pathlib import Path

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


def test_artifact_builder_is_present_and_excludes_node_modules():
    builder = ROOT / "scripts/awsless/modal/build-alice-artifact.sh"
    text = builder.read_text()
    assert "apps/app/dist/index.html" in text  # SPA presence preflight
    assert "--exclude 'node_modules'" in text
    assert "openssl rand -hex 32" in text  # fresh key material every run


def test_capture_is_singleton_and_uses_fragment_auth():
    source = (ROOT / "scripts/awsless/modal/alice_capture_service.py").read_text()
    assert "min_containers=0" in source
    assert "max_containers=1" in source
    assert "/companion#token=" in source
    assert "/companion?token=" not in source
