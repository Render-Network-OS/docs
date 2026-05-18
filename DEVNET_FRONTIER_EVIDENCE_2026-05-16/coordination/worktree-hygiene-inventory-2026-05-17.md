# Worktree hygiene inventory, 2026-05-17

Read-only audit. No worktrees removed, no branches deleted.
Generated at 2026-05-18T05:00:03.747068+00:00 from `git worktree list --porcelain` per repo.
Stale threshold: 14 days since last commit on HEAD.

## Section 1, Per-repo summary counts

| Repo | Total | Active | PR-in-flight | Merged-safe | Stale | Dirty | Agent-scratch | Prunable-flag |
|------|------:|-------:|-------------:|------------:|------:|------:|--------------:|--------------:|
| parent (555 root) | 76 | 1 | 0 | 33 | 3 | 10 | 47 | 11 |
| sw4p | 38 | 5 | 0 | 25 | 0 | 5 | 0 | 15 |
| sw4p-kit | 6 | 2 | 1 | 3 | 0 | 0 | 0 | 1 |
| 555-mono | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 1 |
| milaidy | 29 | 1 | 0 | 20 | 8 | 6 | 0 | 12 |
| backend | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 1 |

**Totals across all repos:** 153 worktrees, 83 safe-to-prune candidates, 21 dirty (need human review).

## Section 2, Full inventory

| Repo | Path | Branch | HEAD | Last activity | Category | Recommendation |
|------|------|--------|------|---------------|----------|---------------|
| 555-mono | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555-mono` | `main` | `19816a0855` | 2026-03-20 (58d) | ACTIVE | PRESERVE: primary checkout |
| 555-mono | `/private/tmp/deployment-readme-prs/555-mono` | `codex/deployment-readme-structure-20260414` | `d6f64b2ff6` | 2026-04-14 (33d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/deployment-readme-prs/555-mono' OR git worktree prune |
| backend | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/backend` | `main` | `76839181ab` | 2026-03-20 (58d) | ACTIVE | PRESERVE: primary checkout |
| backend | `/private/tmp/deployment-readme-prs/backend` | `codex/deployment-readme-structure-20260414` | `9e8e632137` | 2026-04-14 (33d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/deployment-readme-prs/backend' OR git worktree prune |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy` | `alice` | `925ab77012` | 2026-05-17 (0d) | ACTIVE | PRESERVE: primary checkout |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-alice-companion-audit` | `alice-companion-audit-20260517` | `1d9807c9fa` | 2026-05-17 (0d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/milaidy-plugin-schema` | `fix/plugin-555stream-dest-schema-surface` | `60faad9135` | 2026-04-15 (32d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-alice-upstream-develop-20260428` | `codex/alice-upstream-develop-20260428` | `05c6371d3e` | 2026-04-28 (19d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy-cloud-compat` | `feat/555stream-01-v2-compat-test` | `b051bad130` | 2026-04-01 (46d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy-cloud-image` | `feat/555stream-03-plugin-cloud-image` | `7308757dfb` | 2026-04-01 (46d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy-mld008-proof` | `feat/mld-008-proof` | `7d48e7c3cb` | 2026-04-01 (46d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| milaidy | `/private/tmp/milaidy-alice-crosschannel-code-agent` | `alice-crosschannel-code-agent` | `672921f048` | 2026-05-01 (16d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-alice-crosschannel-code-agent' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-alice-prod-recovery` | `fix/alice-prod-runtime-recovery` | `318895a1c8` | 2026-05-06 (11d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-alice-prod-recovery' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-alice-tmp` | `DETACHED:b5c5d9a4d3` | `b5c5d9a4d3` | 2026-04-16 (31d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-alice-tmp' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-broadcast-auth` | `codex/public-broadcast-auth-bypass` | `273a7b5c35` | 2026-04-17 (30d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-broadcast-auth' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-broadcast-p0` | `fix/broadcast-apitoken-precedence` | `d5781233e5` | 2026-04-17 (30d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-broadcast-p0' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-bulk-ndjson` | `ops/knowledge-bulk-ndjson-streaming` | `36a0dd75db` | 2026-05-03 (14d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-bulk-ndjson' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-feat` | `feat/livekit-canvas-publisher` | `efde2e4d6e` | 2026-04-16 (31d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-feat' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-pr107` | `DETACHED:8979e6871a` | `8979e6871a` | 2026-05-02 (15d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-pr107' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-pr3` | `ops/knowledge-api-pglite-timing` | `8979e6871a` | 2026-05-02 (15d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-pr3' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-pr5-startup-logs` | `ops/startup-phase-logs` | `0eb600999f` | 2026-05-02 (15d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-pr5-startup-logs' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-pr7-durable-corpus` | `ops/durable-corpus-store-spike` | `d2402d6d77` | 2026-05-02 (15d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-pr7-durable-corpus' OR git worktree prune |
| milaidy | `/private/tmp/milaidy-prod-regression` | `ops/alice-prod-api-compat-surfaces` | `f964ae7bc7` | 2026-05-05 (12d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/milaidy-prod-regression' OR git worktree prune |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/milaidy-aws-engine-config-spec` | `docs/alice-aws-engine-config-model-design` | `2b5cbeedbe` | 2026-05-14 (3d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/milaidy-upstream-sync-2026-05-13` | `chore/upstream-milady-sync-2026-05-13` | `9ee7327cea` | 2026-05-13 (4d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/milaidy-alice-sync` | `corpus/01-canonicals` | `7720f44f0c` | 2026-05-01 (16d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/milaidy-alice-sync' |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-alice-upstream-develop-origin-20260428` | `codex/alice-upstream-develop-origin-20260428` | `ebe5d169f1` | 2026-04-29 (18d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-alice-upstream-develop-origin-20260428' |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-handoff-atomic-mastery-20260308` | `codex/handoff-atomic-mastery-milaidy-20260308` | `98b3597211` | 2026-03-08 (70d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-handoff-atomic-mastery-20260308' |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-003-eval-set` | `codex/milaidy-mld-003-eval-set` | `92b5741ea2` | 2026-04-03 (44d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-003-eval-set' |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-004-safety-register` | `codex/milaidy-mld-004-safety-register` | `03d2456a11` | 2026-04-03 (44d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-004-safety-register' |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-005-config-matrix` | `codex/milaidy-mld-005-config-matrix` | `34c33ea77f` | 2026-04-03 (44d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-005-config-matrix' |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-006-knowledge-registry` | `codex/milaidy-mld-006-knowledge-registry` | `1ad1d2a439` | 2026-04-03 (44d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-006-knowledge-registry' |
| milaidy | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-preteam-reset` | `codex/preteam-pro-streamer-reset` | `c6edffe971` | 2026-03-10 (68d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-preteam-reset' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555` | `docs/wave-g-sw4p-earn-corpus` | `55df46d368` | 2026-05-17 (0d) | ACTIVE | PRESERVE: primary checkout |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a08db544ca9581d18` | `feat/decimal-verifier-expansion` | `37ed37eb85` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a0acf24ba5a9762f9` | `feat/canonical-ledger-adapter` | `33286f063a` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a31142b7d6bef16b8` | `chore/launch-stage0-readiness` | `5ff9bc6001` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a32bdf875bca5224c` | `feat/lp-slippage-twap-guard` | `7b4954d9ce` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a41d2847a8f56b48a` | `feat/decimal-verifier-secrets-manager` | `37ed37eb85` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a5679ecef32edba0b` | `feat/publisher-funder-key-split` | `74d1e6d6d9` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a61ca02bcea9a9b27` | `feat/publisher-epoch-build` | `37a060689d` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a64cbb09eabe2bf05` | `feat/proof-snapshot-canonical` | `ad5d80d17c` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a79c83c4f354b6d8b` | `feat/allocation-registry-caps` | `ac392f7ba3` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a7dba0c953e601fde` | `chore/multisig-deploy-params` | `5ab784a4a7` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a8483dbd29f4d334a` | `feat/adapter-swap-safety` | `bb6881373a` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a8571ba151e2075c4` | `feat/reconciler-proof-hasher` | `c69e608698` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a869809eb90b6d752` | `feat/sw4p-fee-outbox` | `e3bde04071` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a8faa44ac2c126c13` | `feat/runtime-authority-monitor` | `eb04c81845` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-aa54fb1b6a5732047` | `chore/migration-conflict-resolver` | `bcf55b666b` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-aa60d007fb9cfe40a` | `chore/pol-vault-tests` | `1d452c4299` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-aa6ec08b81916b7fd` | `feat/cd-pipeline-scaffolding` | `a2dd76af4e` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-ad7eb8ad2db1e5c72` | `feat/decimal-verifier-expansion-v2` | `4326f8b356` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-ad8203154b575009d` | `feat/claim-flow` | `557f0d9963` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-ad95d0240ee9ea242` | `feat/ntt-burn-and-mint-invariant` | `62f0997dfe` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-aebf02f6b06bf05f1` | `feat/canary-harness` | `c02c4ae6d8` | 2026-05-09 (8d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-af463fe3340ec0d16` | `feat/dashboard-trust-labels` | `e9da5a3cf4` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-afe04ec3646184430` | `chore/stage0-gate-cleanup` | `50e59aaa35` | 2026-05-08 (9d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/awesome-lumiere-645a99` | `claude/awesome-lumiere-645a99` | `ac6dc71fe4` | 2026-05-13 (4d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/elastic-cray-173a66` | `claude/elastic-cray-173a66` | `06c29161ad` | 2026-05-13 (4d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/flamboyant-curran-aa50ac` | `claude/flamboyant-curran-aa50ac` | `6e15e4758a` | 2026-05-12 (5d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/musing-bhabha-b29e50` | `claude/musing-bhabha-b29e50` | `ac6dc71fe4` | 2026-05-13 (4d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/quirky-turing-d49445` | `claude/quirky-turing-d49445` | `ac6dc71fe4` | 2026-05-13 (4d) | AGENT-SCRATCH(recent) | PRESERVE: agent scratch, recent |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/blissful-dhawan` | `claude/blissful-dhawan` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/blissful-dhawan' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/busy-jang` | `claude/busy-jang` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/busy-jang' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/dazzling-meninsky` | `claude/dazzling-meninsky` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/dazzling-meninsky' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/elated-nightingale` | `claude/elated-nightingale` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/elated-nightingale' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/elegant-aryabhata` | `claude/elegant-aryabhata` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/elegant-aryabhata' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/exciting-volhard` | `claude/exciting-volhard` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/exciting-volhard' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/flamboyant-grothendieck-ff71d8` | `claude/flamboyant-grothendieck-ff71d8` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/flamboyant-grothendieck-ff71d8' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/focused-hermann` | `claude/focused-hermann` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/focused-hermann' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/focused-shannon` | `claude/focused-shannon` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/focused-shannon' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/happy-shockley` | `claude/happy-shockley` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/happy-shockley' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/hungry-boyd` | `claude/hungry-boyd` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/hungry-boyd' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/interesting-villani` | `claude/interesting-villani` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/interesting-villani' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/laughing-lamarr` | `claude/laughing-lamarr` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/laughing-lamarr' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/musing-ptolemy-3e31b0` | `claude/musing-ptolemy-3e31b0` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/musing-ptolemy-3e31b0' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/nostalgic-bardeen` | `claude/nostalgic-bardeen` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/nostalgic-bardeen' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/objective-gauss` | `claude/objective-gauss` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/objective-gauss' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/pedantic-dubinsky` | `claude/pedantic-dubinsky` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/pedantic-dubinsky' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/serene-dubinsky-ad82c8` | `claude/serene-dubinsky-ad82c8` | `98f6ac3246` | 2026-03-31 (47d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/serene-dubinsky-ad82c8' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/serene-wing` | `claude/serene-wing` | `51ee71947e` | 2026-03-11 (67d) | AGENT-SCRATCH(stale) | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/serene-wing' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a01963269d7dc0ea6` | `assistant/2026-05-15-corpus-evidence-from-session` | `9f07a029d4` | 2026-05-16 (1d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agitated-swirles-8d180d` | `claude/agitated-swirles-8d180d` | `ac6dc71fe4` | 2026-05-13 (4d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/musing-nash-6e996f` | `claude/musing-nash-6e996f` | `409fe96068` | 2026-05-16 (1d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/optimistic-nightingale-7857bc` | `claude/optimistic-nightingale-7857bc` | `6e15e4758a` | 2026-05-12 (5d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sleepy-chandrasekhar-e5c7d4` | `claude/sleepy-chandrasekhar-e5c7d4` | `ac6dc71fe4` | 2026-05-13 (4d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58` | `main` | `ac6dc71fe4` | 2026-05-13 (4d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/determined-herschel` | `claude/determined-herschel` | `98f6ac3246` | 2026-03-31 (47d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/heuristic-nobel` | `claude/heuristic-nobel` | `98f6ac3246` | 2026-03-31 (47d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/unruffled-pasteur-10445b` | `claude/unruffled-pasteur-10445b` | `98f6ac3246` | 2026-03-31 (47d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/upbeat-yalow` | `claude/upbeat-yalow` | `51ee71947e` | 2026-03-11 (67d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| parent (555 root) | `/private/tmp/sw4p-dev-fix` | `fix/dev-launcher-end-to-end` | `92128ebe6f` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-dev-fix' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-fix-canary` | `fix/canary-live-chain-ops` | `a7b763c90f` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-fix-canary' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-fix-devsh` | `fix/local-devnet-ergonomics` | `6c14b440c0` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-fix-devsh' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-fix-dv-cwd` | `fix/decimal-verifier-cwd-resolution` | `aa258fed53` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-fix-dv-cwd' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-fix-feeoutbox` | `fix/fee-ledger-outbox-jsonb` | `204adddc83` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-fix-feeoutbox' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-fix-ports` | `fix/anvil-ephemeral-ports` | `e4f43a4e1e` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-fix-ports' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-fix-reconciler` | `fix/reconciler-solana-rpc-typing` | `5bc552bcff` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-fix-reconciler' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-fix-ws` | `chore/services-workspace-cleanup` | `6efb3694e6` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-fix-ws' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-test` | `DETACHED:6c14b440c0` | `6c14b440c0` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-test' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-earn-xp-reskin` | `design/sw4p-earn-xp-reskin` | `8eaf2bd7a9` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-earn-xp-reskin' OR git worktree prune |
| parent (555 root) | `/private/tmp/sw4p-vis-earn` | `DETACHED:71fc45f9c6` | `71fc45f9c6` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-vis-earn' OR git worktree prune |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/c7-docs-kit` | `docs/c7-kit-section` | `49abf50a19` | 2026-05-13 (4d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/corpus-evidence-2026-05-15` | `assistant/2026-05-17-wp2.4-unified-testnet-evidence` | `1513a2aadd` | 2026-05-17 (0d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/silly-mendel-f28c50` | `claude/silly-mendel-f28c50` | `ac6dc71fe4` | 2026-05-13 (4d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sweet-brown-fc0138` | `claude/sweet-brown-fc0138` | `ac6dc71fe4` | 2026-05-13 (4d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sharp-elion-d8066a` | `claude/sharp-elion-d8066a` | `98f6ac3246` | 2026-03-31 (47d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sharp-elion-d8066a' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sleepy-diffie` | `claude/sleepy-diffie` | `51ee71947e` | 2026-03-11 (67d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sleepy-diffie' |
| parent (555 root) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/stupefied-kilby` | `claude/stupefied-kilby` | `51ee71947e` | 2026-03-11 (67d) | STALE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/stupefied-kilby' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/staging-rebase-2026-05-17` | `DETACHED:f680248cd3` | `f680248cd3` | 2026-05-17 (0d) | ACTIVE | PRESERVE: current-cycle worktree |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16` | `staging/devnet-frontier-2026-05-16` | `7fb34ef4f1` | 2026-05-17 (0d) | ACTIVE | PRESERVE: current-cycle worktree |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-pr233-rebase` | `wp2.4-testnet-scp-op-poly-avax` | `4b485e94af` | 2026-05-17 (0d) | ACTIVE | PRESERVE: current-cycle worktree |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-staging-rebase-2026-05-17` | `staging/devnet-frontier-rebased-2026-05-17` | `6238d5a74e` | 2026-05-17 (0d) | ACTIVE | PRESERVE: current-cycle worktree |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p` | `wp2.4-mainnet-wave-2026-05-17` | `15979dfdbe` | 2026-05-17 (0d) | ACTIVE | PRESERVE: primary checkout |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-vis-console` | `DETACHED:4239eac874` | `4239eac874` | 2026-05-17 (0d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry` | `protocol/a1-networks-registry` | `6980ea5356` | 2026-05-13 (4d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/sw4p-vis-frontend` | `DETACHED:4239eac874` | `4239eac874` | 2026-05-17 (0d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| sw4p | `/Volumes/OWC Envoy Pro FX/sw4p-vis-landing` | `DETACHED:4239eac874` | `4239eac874` | 2026-05-17 (0d) | DIRTY-RECENT | HUMAN REVIEW: uncommitted changes |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-done-audit-resolution` | `enoomian/sw4p-done-audit-resolution` | `5b4d7bddd0` | 2026-04-01 (46d) | DIRTY-STALE | HUMAN REVIEW: uncommitted changes |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails` | `protocol/a2-a3-remove-aspirational-rails` | `b3812cfa1d` | 2026-05-13 (4d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist` | `protocol/a4-solver-auction-persist` | `f24e383ade` | 2026-05-13 (4d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups` | `protocol/a5-a8-cleanups` | `d590d5bffc` | 2026-05-13 (4d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/p0-cctp-v2-fix` | `master` | `49605a15c1` | 2026-05-17 (0d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/p0-cctp-v2-fix' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.2-v4-controls` | `wp0.2-sw4p-v4-controls` | `1630d958c7` | 2026-05-16 (1d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.2-v4-controls' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.2-v4-fork-tests` | `wp0.2-sw4p-v4-fork-tests` | `ddab7539f8` | 2026-05-16 (1d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.2-v4-fork-tests' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.7-localnet-repair` | `wp0.7-localnet-repair` | `60556fdb09` | 2026-05-16 (1d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.7-localnet-repair' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.7-verify` | `wp0.7-verify` | `e12cd41a62` | 2026-05-16 (1d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.7-verify' |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp2.4-fork-sims-op-poly-avax` | `wp2.4-fork-sims-op-poly-avax` | `1d243c624e` | 2026-05-16 (1d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp2.4-fork-sims-op-poly-avax' |
| sw4p | `/Volumes/OWC Envoy Pro FX/tmp/sw4p-vis-storefront` | `DETACHED:4239eac874` | `4239eac874` | 2026-05-17 (0d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/tmp/sw4p-vis-storefront' |
| sw4p | `/private/tmp/sw4p-177-rebase` | `fix/sw4p-native-squads-fixtures` | `53898412d8` | 2026-05-13 (4d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-177-rebase' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-frontend-xp-ui` | `design/sw4p-frontend-xp-ui` | `68dd906aac` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-frontend-xp-ui' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-217-fixes` | `sw4p-pro-217-fixes` | `750deaf2c7` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-217-fixes' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-aws-build-fix` | `chore/aws-build-pkg-ui` | `1cd64e0bc3` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-aws-build-fix' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-fix-wagmi-viem` | `fix/wagmi-viem-types` | `1d243c624e` | 2026-05-16 (1d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-fix-wagmi-viem' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-r2-bots` | `design/sw4p-bots-brand-align-r2` | `b49e36daa5` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-r2-bots' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-r2-console` | `design/sw4p-console-xp-ui-r2` | `59a79e1dcb` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-r2-console' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-r2-landing-deploy-fix` | `design/landing-deploy-fix-r2` | `596ec79951` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-r2-landing-deploy-fix' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-r2-og-readmes` | `design/og-images-readme-badges-r2` | `8e3f14f701` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-r2-og-readmes' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-r2-storefront` | `design/sw4p-storefront-xp-rebuild-r2` | `ba9f517b83` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-r2-storefront' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-r2-widget` | `design/sw4p-widget-xp-variant-r2` | `2d722c9d92` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-r2-widget' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-render-fix` | `chore/render-build-cmd-for-sw4p-ui` | `29bdbbe32e` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-render-fix' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-stale-deploy-cleanup` | `chore/remove-stale-deploy-config` | `a37bda2b47` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-stale-deploy-cleanup' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-wagmi-fix-final` | `fix/wagmi-viem-types-final` | `0c5847ac07` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-wagmi-fix-final' OR git worktree prune |
| sw4p | `/private/tmp/sw4p-pro-zod-fix-final` | `fix/zod-mini-subpath-final` | `458213725c` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-pro-zod-fix-final' OR git worktree prune |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/unichain-testnet-add` | `unichain-sepolia-testnet-add` | `f1ab7a2060` | 2026-05-16 (1d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp2.4-mainnet-deploys` | `wp2.4-mainnet-v41-deploys` | `fa7125580f` | 2026-05-16 (1d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| sw4p | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp2.4-testnet-circle-deploys` | `wp2.4-testnet-circle-deploys` | `2e9d96db2a` | 2026-05-17 (0d) | RECENT-UNMERGED | PRESERVE: recent activity, no open PR yet |
| sw4p-kit | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16` | `staging/devnet-frontier-2026-05-16` | `53c2051bc9` | 2026-05-16 (1d) | ACTIVE | PRESERVE: current-cycle worktree |
| sw4p-kit | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit` | `kit/track-b-slim-down` | `17821963c2` | 2026-05-13 (4d) | ACTIVE | PRESERVE: primary checkout |
| sw4p-kit | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http` | `kit/b7-streamable-http` | `f165d42ee4` | 2026-05-13 (4d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http' |
| sw4p-kit | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli` | `kit/c1-c2-cli` | `cdf72db280` | 2026-05-13 (4d) | MERGED-SAFE-TO-PRUNE | PRUNE: git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli' |
| sw4p-kit | `/private/tmp/sw4p-kit-readme-scrub` | `chore/readme-scrub-em-dashes` | `8a4f73f873` | 2026-05-17 (0d) | PR-IN-FLIGHT | PRESERVE: open PR (sw4p-kit #chore/readme-scrub-em-dashes) |
| sw4p-kit | `/private/tmp/sw4p-kit-r2-readme` | `design/readme-brand-align-r2` | `78d01e0da6` | 2026-05-17 (0d) | PRUNABLE-FLAGGED | PRUNE: git worktree remove --force '/private/tmp/sw4p-kit-r2-readme' OR git worktree prune |

## Section 3, Safe-to-prune commands (copy-paste)

Note: many entries below have `prunable gitdir file points to non-existent location`. For those, a plain `git -C <repo> worktree prune` will remove all of them in one shot per repo, but the explicit `worktree remove --force` form is given here so the operator can review each path. Use `--force` only on git-prunable entries (their working trees are already gone).

### /Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555

```
# Clears all entries marked 'gitdir points to non-existent location':
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree prune -v

# [git-prunable] last 2026-05-13, branch fix/dev-launcher-end-to-end
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-dev-fix'
# [git-prunable] last 2026-05-13, branch fix/canary-live-chain-ops
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-fix-canary'
# [git-prunable] last 2026-05-13, branch fix/local-devnet-ergonomics
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-fix-devsh'
# [git-prunable] last 2026-05-13, branch fix/decimal-verifier-cwd-resolution
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-fix-dv-cwd'
# [git-prunable] last 2026-05-13, branch fix/fee-ledger-outbox-jsonb
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-fix-feeoutbox'
# [git-prunable] last 2026-05-13, branch fix/anvil-ephemeral-ports
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-fix-ports'
# [git-prunable] last 2026-05-13, branch fix/reconciler-solana-rpc-typing
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-fix-reconciler'
# [git-prunable] last 2026-05-13, branch chore/services-workspace-cleanup
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-fix-ws'
# [git-prunable] last 2026-05-13, branch DETACHED:6c14b440c0
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-test'
# [git-prunable] last 2026-05-17, branch design/sw4p-earn-xp-reskin
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-earn-xp-reskin'
# [git-prunable] last 2026-05-17, branch DETACHED:71fc45f9c6
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove --force '/private/tmp/sw4p-vis-earn'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/blissful-dhawan
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/blissful-dhawan'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/busy-jang
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/busy-jang'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/dazzling-meninsky
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/dazzling-meninsky'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/elated-nightingale
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/elated-nightingale'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/elegant-aryabhata
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/elegant-aryabhata'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/exciting-volhard
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/exciting-volhard'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/flamboyant-grothendieck-ff71d8
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/flamboyant-grothendieck-ff71d8'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/focused-hermann
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/focused-hermann'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/focused-shannon
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/focused-shannon'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/happy-shockley
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/happy-shockley'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/hungry-boyd
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/hungry-boyd'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/interesting-villani
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/interesting-villani'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/laughing-lamarr
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/laughing-lamarr'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/musing-ptolemy-3e31b0
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/musing-ptolemy-3e31b0'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/nostalgic-bardeen
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/nostalgic-bardeen'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/objective-gauss
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/objective-gauss'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/pedantic-dubinsky
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/pedantic-dubinsky'
# [AGENT-SCRATCH(stale)] last 2026-03-31, branch claude/serene-dubinsky-ad82c8
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/serene-dubinsky-ad82c8'
# [AGENT-SCRATCH(stale)] last 2026-03-11, branch claude/serene-wing
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/serene-wing'
# [stale 47d] last 2026-03-31, branch claude/sharp-elion-d8066a
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sharp-elion-d8066a'
# [stale 67d] last 2026-03-11, branch claude/sleepy-diffie
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sleepy-diffie'
# [stale 67d] last 2026-03-11, branch claude/stupefied-kilby
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/stupefied-kilby'
```

### /Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p

```
# Clears all entries marked 'gitdir points to non-existent location':
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree prune -v

# [git-prunable] last 2026-05-13, branch fix/sw4p-native-squads-fixtures
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-177-rebase'
# [git-prunable] last 2026-05-17, branch design/sw4p-frontend-xp-ui
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-frontend-xp-ui'
# [git-prunable] last 2026-05-17, branch sw4p-pro-217-fixes
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-217-fixes'
# [git-prunable] last 2026-05-17, branch chore/aws-build-pkg-ui
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-aws-build-fix'
# [git-prunable] last 2026-05-16, branch fix/wagmi-viem-types
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-fix-wagmi-viem'
# [git-prunable] last 2026-05-17, branch design/sw4p-bots-brand-align-r2
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-r2-bots'
# [git-prunable] last 2026-05-17, branch design/sw4p-console-xp-ui-r2
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-r2-console'
# [git-prunable] last 2026-05-17, branch design/landing-deploy-fix-r2
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-r2-landing-deploy-fix'
# [git-prunable] last 2026-05-17, branch design/og-images-readme-badges-r2
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-r2-og-readmes'
# [git-prunable] last 2026-05-17, branch design/sw4p-storefront-xp-rebuild-r2
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-r2-storefront'
# [git-prunable] last 2026-05-17, branch design/sw4p-widget-xp-variant-r2
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-r2-widget'
# [git-prunable] last 2026-05-17, branch chore/render-build-cmd-for-sw4p-ui
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-render-fix'
# [git-prunable] last 2026-05-17, branch chore/remove-stale-deploy-config
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-stale-deploy-cleanup'
# [git-prunable] last 2026-05-17, branch fix/wagmi-viem-types-final
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-wagmi-fix-final'
# [git-prunable] last 2026-05-17, branch fix/zod-mini-subpath-final
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove --force '/private/tmp/sw4p-pro-zod-fix-final'
# [merged] last 2026-05-13, branch protocol/a2-a3-remove-aspirational-rails
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails'
# [merged] last 2026-05-13, branch protocol/a4-solver-auction-persist
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist'
# [merged] last 2026-05-13, branch protocol/a5-a8-cleanups
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups'
# [merged] last 2026-05-17, branch master
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/p0-cctp-v2-fix'
# [merged] last 2026-05-16, branch wp0.2-sw4p-v4-controls
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.2-v4-controls'
# [merged] last 2026-05-16, branch wp0.2-sw4p-v4-fork-tests
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.2-v4-fork-tests'
# [merged] last 2026-05-16, branch wp0.7-localnet-repair
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.7-localnet-repair'
# [merged] last 2026-05-16, branch wp0.7-verify
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp0.7-verify'
# [merged] last 2026-05-16, branch wp2.4-fork-sims-op-poly-avax
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/wp2.4-fork-sims-op-poly-avax'
# [merged] last 2026-05-17, branch DETACHED:4239eac874
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p' worktree remove '/Volumes/OWC Envoy Pro FX/tmp/sw4p-vis-storefront'
```

### /Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit

```
# Clears all entries marked 'gitdir points to non-existent location':
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit' worktree prune -v

# [git-prunable] last 2026-05-17, branch design/readme-brand-align-r2
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit' worktree remove --force '/private/tmp/sw4p-kit-r2-readme'
# [merged] last 2026-05-13, branch kit/b7-streamable-http
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http'
# [merged] last 2026-05-13, branch kit/c1-c2-cli
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli'
```

### /Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555-mono

```
# Clears all entries marked 'gitdir points to non-existent location':
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555-mono' worktree prune -v

# [git-prunable] last 2026-04-14, branch codex/deployment-readme-structure-20260414
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555-mono' worktree remove --force '/private/tmp/deployment-readme-prs/555-mono'
```

### /Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy

```
# Clears all entries marked 'gitdir points to non-existent location':
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree prune -v

# [git-prunable] last 2026-05-01, branch alice-crosschannel-code-agent
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-alice-crosschannel-code-agent'
# [git-prunable] last 2026-05-06, branch fix/alice-prod-runtime-recovery
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-alice-prod-recovery'
# [git-prunable] last 2026-04-16, branch DETACHED:b5c5d9a4d3
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-alice-tmp'
# [git-prunable] last 2026-04-17, branch codex/public-broadcast-auth-bypass
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-broadcast-auth'
# [git-prunable] last 2026-04-17, branch fix/broadcast-apitoken-precedence
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-broadcast-p0'
# [git-prunable] last 2026-05-03, branch ops/knowledge-bulk-ndjson-streaming
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-bulk-ndjson'
# [git-prunable] last 2026-04-16, branch feat/livekit-canvas-publisher
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-feat'
# [git-prunable] last 2026-05-02, branch DETACHED:8979e6871a
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-pr107'
# [git-prunable] last 2026-05-02, branch ops/knowledge-api-pglite-timing
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-pr3'
# [git-prunable] last 2026-05-02, branch ops/startup-phase-logs
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-pr5-startup-logs'
# [git-prunable] last 2026-05-02, branch ops/durable-corpus-store-spike
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-pr7-durable-corpus'
# [git-prunable] last 2026-05-05, branch ops/alice-prod-api-compat-surfaces
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove --force '/private/tmp/milaidy-prod-regression'
# [stale 16d] last 2026-05-01, branch corpus/01-canonicals
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/milaidy-alice-sync'
# [stale 18d] last 2026-04-29, branch codex/alice-upstream-develop-origin-20260428
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-alice-upstream-develop-origin-20260428'
# [stale 70d] last 2026-03-08, branch codex/handoff-atomic-mastery-milaidy-20260308
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-handoff-atomic-mastery-20260308'
# [stale 44d] last 2026-04-03, branch codex/milaidy-mld-003-eval-set
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-003-eval-set'
# [stale 44d] last 2026-04-03, branch codex/milaidy-mld-004-safety-register
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-004-safety-register'
# [stale 44d] last 2026-04-03, branch codex/milaidy-mld-005-config-matrix
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-005-config-matrix'
# [stale 44d] last 2026-04-03, branch codex/milaidy-mld-006-knowledge-registry
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-mld-006-knowledge-registry'
# [stale 68d] last 2026-03-10, branch codex/preteam-pro-streamer-reset
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy' worktree remove '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-preteam-reset'
```

### /Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/backend

```
# Clears all entries marked 'gitdir points to non-existent location':
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/backend' worktree prune -v

# [git-prunable] last 2026-04-14, branch codex/deployment-readme-structure-20260414
git -C '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/backend' worktree remove --force '/private/tmp/deployment-readme-prs/backend'
```

## Section 4, Needs human review, DIRTY worktrees

Worktrees with uncommitted changes. Inspect before pruning; the work may need to be committed or moved.

- **milaidy** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-alice-upstream-develop-20260428`
  - branch: `codex/alice-upstream-develop-20260428`, last commit age: 19d, dirty files: 40
  - sample (top 5):
    - ` M .gitattributes`
    - ` M apps/app/package.json`
    - ` M apps/app/src/main.tsx`
    - ` M apps/app/vite.config.ts`
    - ` D apps/homepage/public/milady-icon.png`

- **milaidy** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/milaidy-plugin-schema`
  - branch: `fix/plugin-555stream-dest-schema-surface`, last commit age: 32d, dirty files: 20
  - sample (top 5):
    - ` M apps/app/public/vrms/milady-1.vrm.gz`
    - ` M apps/app/public/vrms/milady-2.vrm.gz`
    - ` M apps/app/public/vrms/milady-3.vrm.gz`
    - ` M apps/app/public/vrms/milady-4.vrm.gz`
    - ` M apps/app/public/vrms/milady-5.vrm.gz`

- **milaidy** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy-mld008-proof`
  - branch: `feat/mld-008-proof`, last commit age: 46d, dirty files: 18
  - sample (top 5):
    - ` M README.md`
    - ` M apps/app/electrobun/src/index.ts`
    - ` M apps/app/electrobun/src/native/gpu-window.ts`
    - ` M apps/app/src/main.tsx`
    - ` M apps/app/test/plugins/swabble.test.ts`

- **sw4p** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-done-audit-resolution`
  - branch: `enoomian/sw4p-done-audit-resolution`, last commit age: 46d, dirty files: 7
  - sample (top 5):
    - ` M README.md`
    - ` M docs/ARCHITECTURE.md`
    - ` M docs/RPC_ARCHITECTURE_AUDIT_2026-02-19.md`
    - ` M docs/funding/SW4P_One_Pager.md`
    - ` M sw4p-frontend/public/docs/WELCOME.md`

- **sw4p** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry`
  - branch: `protocol/a1-networks-registry`, last commit age: 4d, dirty files: 7
  - sample (top 5):
    - `?? evidence/`
    - `?? kora/.railwayignore`
    - `?? sw4p-backend/contracts/bun.lock`
    - `?? sw4p-backend/contracts/scripts/v4_mainnet_deployment_journal.json`
    - `?? sw4p-backend/src/bin/recover_solana_cctp.rs`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58`
  - branch: `main`, last commit age: 4d, dirty files: 6
  - sample (top 5):
    - `?? .claude/`
    - `?? app/`
    - `?? contracts/`
    - `?? scripts/`
    - `?? services/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/sleepy-chandrasekhar-e5c7d4`
  - branch: `claude/sleepy-chandrasekhar-e5c7d4`, last commit age: 4d, dirty files: 5
  - sample (top 5):
    - `?? .playwright-mcp/`
    - `?? landing-screenshots/`
    - `?? og-landing.png`
    - `?? screenshots/`
    - `?? sw4p-visual-review/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/determined-herschel`
  - branch: `claude/determined-herschel`, last commit age: 47d, dirty files: 4
  - sample (top 5):
    - `?? .claude/`
    - `?? .vite/`
    - `?? .wrangler/`
    - `?? node_modules/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/heuristic-nobel`
  - branch: `claude/heuristic-nobel`, last commit age: 47d, dirty files: 2
  - sample (top 5):
    - `?? ", r.count);\nconst convCount = await db.query(\\\\\\\"SELECT \\\\\\\\\\\\\\\"agentId\\\\\\\\\\\\\\\", COUNT(*) FROM rooms GROUP BY \\\\\\\\\\\\\\\"agentId\\\\\\\\\\\\\\\"\\\\\\\").catch(()=>null);\nif (convCount) { console.log(rooms"`
    - `?? ", r.count); }\nawait db.close();\n\\\"\""`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/musing-nash-6e996f`
  - branch: `claude/musing-nash-6e996f`, last commit age: 1d, dirty files: 2
  - sample (top 5):
    - ` M docs/products/kit.mdx`
    - `?? .claude/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/unruffled-pasteur-10445b`
  - branch: `claude/unruffled-pasteur-10445b`, last commit age: 47d, dirty files: 2
  - sample (top 5):
    - `?? .claude/`
    - `?? ops/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agent-a01963269d7dc0ea6`
  - branch: `assistant/2026-05-15-corpus-evidence-from-session`, last commit age: 1d, dirty files: 1
  - sample (top 5):
    - `?? sw4p-earn/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/agitated-swirles-8d180d`
  - branch: `claude/agitated-swirles-8d180d`, last commit age: 4d, dirty files: 1
  - sample (top 5):
    - `?? .playwright-mcp/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/optimistic-nightingale-7857bc`
  - branch: `claude/optimistic-nightingale-7857bc`, last commit age: 5d, dirty files: 1
  - sample (top 5):
    - `?? .claude/`

- **parent (555 root)** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/upbeat-yalow`
  - branch: `claude/upbeat-yalow`, last commit age: 67d, dirty files: 1
  - sample (top 5):
    - `?? sw4p-backend/`

- **sw4p** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-vis-console`
  - branch: `DETACHED:4239eac874`, last commit age: 0d, dirty files: 1
  - sample (top 5):
    - ` M sw4p-console/package-lock.json`

- **sw4p** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/sw4p-vis-frontend`
  - branch: `DETACHED:4239eac874`, last commit age: 0d, dirty files: 1
  - sample (top 5):
    - ` M sw4p-frontend/package-lock.json`

- **sw4p** `/Volumes/OWC Envoy Pro FX/sw4p-vis-landing`
  - branch: `DETACHED:4239eac874`, last commit age: 0d, dirty files: 1
  - sample (top 5):
    - ` M sw4p-landing/package-lock.json`

- **milaidy** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/milaidy-alice-companion-audit`
  - branch: `alice-companion-audit-20260517`, last commit age: 0d, dirty files: 1
  - sample (top 5):
    - ` M eliza`

- **milaidy** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy-cloud-compat`
  - branch: `feat/555stream-01-v2-compat-test`, last commit age: 46d, dirty files: 1
  - sample (top 5):
    - ` M README.md`

- **milaidy** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy-cloud-image`
  - branch: `feat/555stream-03-plugin-cloud-image`, last commit age: 46d, dirty files: 1
  - sample (top 5):
    - ` M README.md`

## Section 5, Preserve list

### Active checkouts (current session)

- parent (555 root): `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555` on `docs/wave-g-sw4p-earn-corpus`
- sw4p: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p` on `wp2.4-mainnet-wave-2026-05-17`
- sw4p: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/staging-rebase-2026-05-17` on `DETACHED:f680248cd3`
- sw4p: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16` on `staging/devnet-frontier-2026-05-16`
- sw4p: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-pr233-rebase` on `wp2.4-testnet-scp-op-poly-avax`
- sw4p: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-staging-rebase-2026-05-17` on `staging/devnet-frontier-rebased-2026-05-17`
- sw4p-kit: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit` on `kit/track-b-slim-down`
- sw4p-kit: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16` on `staging/devnet-frontier-2026-05-16`
- 555-mono: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555-mono` on `main`
- milaidy: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy` on `alice`
- backend: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/backend` on `main`

### PR-in-flight

- sw4p-kit: `/private/tmp/sw4p-kit-readme-scrub` on `chore/readme-scrub-em-dashes` (open PR)

