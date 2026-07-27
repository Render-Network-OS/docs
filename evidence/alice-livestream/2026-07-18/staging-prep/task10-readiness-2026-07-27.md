# Task 10 dry-run readiness, 2026-07-27

Pre-staging check for the Alice PiP campaign. Scope limit for this pass: **no Modal
contact of any kind** (the workspace is disabled by provider billing), no deploys,
and R2 access restricted to the private transfer bucket `alice-xfer`.

Names and paths only. No secret value, token, key, or IV is reproduced here.

Sources of truth: `scripts/awsless/modal/alice_runtime.py`,
`.worktrees/milaidy-alice-livestream-recovery-2026-07-18/docs/HANDOVER-alice-resume-2026-07-27.md`,
and the campaign plan
`.worktrees/milaidy-alice-livestream-recovery-2026-07-18/docs/superpowers/plans/2026-07-18-alice-application-livestream-recovery.md`.

---

## Summary

| State | Count |
|---|---|
| Green | 9 |
| Amber (unverifiable offline, by design) | 5 |
| Red | 3 |

**Nothing red blocks a restore.** The one blocker remains Modal provider billing,
which is a founder payment action, not an engineering task. The single most useful
finding is that the release artifact and its key material both survive locally, so a
restore needs neither a rebuild nor a fresh key mint.

---

## 1. Release artifact and R2

| Item | State | Detail |
|---|---|---|
| `alice-xfer` objects under `alice-release-20260723-livefix/` | **GREEN** | All 4 `alice.enc.part0..3` present, 258523096 bytes each, uploaded 2026-07-23 07:03 to 07:10 UTC. |
| Artifact matches `EXPECTED_SHA` | **GREEN** | Verified. See `artifact-verification-2026-07-27.json` in this directory. Verdict `exists-matching`, `rebuilt: false`. |
| Local encrypted parts | **GREEN** | `555stream/.secrets/alice-artifact-livefix-20260723/alice.enc.part0..3`, MD5-identical to the R2 ETags. |
| Local artifact meta (key material) | **GREEN** | `555stream/.secrets/alice-artifact-livefix-20260723/alice-artifact-meta.json` present, gitignored, mode 600. Carries the sha that equals `EXPECTED_SHA`. |
| Local build-secret file | **GREEN** | `555stream/.secrets/alice-artifact-livefix-20260723/modal-build-secret-livefix.json` present. The keyHex/ivHex for the Modal build secret are recoverable locally, so no fresh key mint and no artifact re-upload are required. |
| `~/.sw4p-cf/r2-token` | **GREEN** | Present, mode 600. Account-scoped Cloudflare API token, verified active against `/accounts/036df6c823669b8fa2f66cf4c16eeb29/tokens/verify`. |
| `alice-artifact-meta.json` in the bucket | **RED (cosmetic)** | Not present under the prefix. Only the four `.enc.part` objects were uploaded, which matches the build script contract. **Consequence:** the runbook Step 0 command (`wrangler r2 object get .../alice-artifact-meta.json`) returns absent and wrongly implies a rebuild. **Needed:** correct Step 0 to list the prefix and compare against the local meta, or accept `artifact-verification-2026-07-27.json` as the standing answer. Do not upload the meta to R2; it holds key material. |

### Runbook caveat, resolved

Handover section 2 Step 0 says no local meta carries the `e7bb0b0d` sha and that a
rebuild should be assumed. That scan covered only the 16 metas under
`555/.alice-tmp/` and missed `555stream/.secrets/`. The livefix meta there carries
exactly that sha, and its `encBytes` of 1034092384 equals the sum of the four R2
object sizes. **The rebuild assumption is lifted.**

This matters because a rebuild could not have reproduced the sha anyway: the artifact
is a gzipped tar carrying file mtimes, so a fresh `build-alice-artifact.sh` run
produces a different sha256 by construction, which would have forced an
`EXPECTED_SHA` bump plus a secret rotation plus a full re-upload.

---

## 2. Modal secret names

Read from `alice_runtime.py`. **Existence in the Modal workspace is unverifiable
offline** and contacting Modal is prohibited this pass, so these are amber rather
than green or red. Amber here means "name confirmed against runtime source, presence
in the workspace not checked". All five were present for the 2026-07-22 live deploy.

| Secret name | Referenced at | State |
|---|---|---|
| `alice-runtime` | `alice_runtime.py:454` | AMBER |
| `alice-api-token` | `alice_runtime.py:455` | AMBER |
| `alice-stream-destinations` | `alice_runtime.py:456` | AMBER |
| `alice-stream-control` | `alice_runtime.py:457` | AMBER |
| `alice-build-release-20260723-livefix` | `alice_runtime.py:378` | AMBER |

**Two corrections to the brief for this task.** It listed four secrets as
`alice-runtime, alice-stream-control, alice-stream-destinations, alice-build`.
The runtime actually names **five**: `alice-api-token` was omitted, and the build
secret's real name is `alice-build-release-20260723-livefix`, not `alice-build`.
The prefix-bearing name matters, since rotating or recreating it under the short
name would not be picked up by the image build.

Verification of all five is the first action once Modal billing is restored:
`~/.venvs/modal/bin/modal secret list`.

---

## 3. Local toolchain

| Item | State | Detail |
|---|---|---|
| `~/.venvs/modal` | **GREEN** | Present, Python 3.13.14. |
| `modal` in that venv | **GREEN** | 1.5.0. |
| `pytest` in that venv | **GREEN** | 9.1.1. Matches the 22/22 contract run recorded in the handover. |
| `gh` auth | **GREEN** | Logged in to github.com as `rndrntwrk`, active, ssh for git operations, scopes `gist, read:org, repo`. |
| `wrangler` | **GREEN** | On PATH. The runtime pins `wrangler@4.113.0` and installs it inside the image, so the local version is not load-bearing. |
| `555stream/.secrets/alice-api-token.txt` | **GREEN** | Present. Needed for the `/companion#token=` fragment check in Step 5. |
| Network-fresh `bun install` | **RED** | Handover defect 4.1. `@rollup/plugin-node-resolve` is a devDependency of 13 workspaces with no `packages` entry in `bun.lock`, so `--frozen-lockfile` cannot succeed. **Needed:** a deliberate lockfile regeneration, which will drift dependency versions. Founder or next-session decision, explicitly not a side effect of this task. **Does not block the restore**, because the pinned artifact is reusable and the image runs its own install. |

---

## 4. Evidence directory structure, campaign plan Tasks 10 to 12

The plan (line 65) sets the evidence root to `evidence/alice-livestream/2026-07-18/`
**relative to the `555/milaidy` repo**, where `local/` was committed as `3294f8e11`.

| Path | Task | State |
|---|---|---|
| `evidence/alice-livestream/2026-07-18/local/` | 7 | **GREEN** in the milaidy worktree. Manifest, browser observations, 10 screenshots. |
| `evidence/alice-livestream/2026-07-18/staging/` | 10, 11 | **RED**. Does not exist in any tree. Wanted: `config-preflight.json`, `window.json` (Task 10), `deploy.json`, `runtime-smoke.json`, `screenshots/**` (Task 11). **Needed:** a live Modal window, so founder-gated. |
| `evidence/alice-livestream/2026-07-18/platform/` | 12 | **RED**. Does not exist. Wanted: `twitch-emote-proof.json`, `twitch-game-pip-proof.json`, `screenshots/**` including `operator-game-pip.png` and `twitch-game-pip.png`, plus a sanitized capture log. **Needed:** a paid Twitch staging window with real RTMP playback. This is the one piece of evidence the campaign has never produced. |
| `evidence/alice-livestream/2026-07-18/production/` | 13 | Not started, out of scope this pass. |

### Repo placement discrepancy, flagged deliberately

This pass was pinned to the **555 root repo** on branch
`docs/555-community-airdrop-strategy`. The root repo had **no**
`evidence/alice-livestream` tree at all; it is created here for the first time by
these two files. The canonical tree lives in the `555/milaidy` repo at
`.worktrees/milaidy-alice-livestream-recovery-2026-07-18/`.

`staging-prep/` is also **not** a campaign plan directory. The plan's Task 10 output
directory is `staging/`. `staging-prep/` is pre-staging work that precedes the
window rather than recording it, so the distinct name is correct, but whoever runs
the real Task 10 should write to `staging/` in the milaidy repo per the plan and not
extend this directory.

---

## 5. What a restore now needs, in order

1. **Founder:** re-enable Modal provider billing. Everything below is blocked on it.
2. Confirm the five secrets above with `modal secret list`. The build secret's
   keyHex/ivHex are recoverable from
   `555stream/.secrets/alice-artifact-livefix-20260723/modal-build-secret-livefix.json`
   if it needs recreating.
3. **Skip handover Steps 1 and 2 entirely.** No rebuild, no re-upload, no key
   rotation, no `EXPECTED_SHA` change. The pinned artifact is verified reusable.
4. Handover Step 3: `py_compile` both launchers, then the 22 contract tests.
5. Declare the window before opening it. Max 4h, stop after 15 minutes idle.
6. Handover Steps 4 and 5: deploy, then verify against the 07-22 bar, namely
   `/api/plugins` HTTP 200, `pluginCount` 109, `@rndrntwrk/plugin-555stream`
   `isActive: true`. Tear down immediately after acceptance.
7. Task 12 Step 6, the PiP screenshots, is the real remaining deliverable.
