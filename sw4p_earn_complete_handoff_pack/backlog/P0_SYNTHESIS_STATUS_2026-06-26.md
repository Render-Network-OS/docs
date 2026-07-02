# SW4P Earn P0 Synthesis Status (2026-06-26)

## Current merge state against `sw4p-earn/main`
- Baseline: `sw4p-earn/main` is cleanly synced with `origin/sw4p-earn/main`.
- No open PRs were listed at check time.

## Confirmed completed P0 work (already merged)
- P0-001 `Fix burn-and-mint supply invariant` → merged as PR #20 (`feat(ntt): burn-and-mint supply-invariant rewrite (CC-1)`).
- P0-002 `Make decimal verifier blocking` → merged as PR #5 (`feat(decimal-verifier): load config from Secrets Manager + flip CI gate to required`) and extended in PR #14 (`feat(decimal-verifier): expand check surface`).
- P0-003 `Remove publisher hot-key dual-role` → merged as PR #26 (`fix(rewards): split EPOCH_PUBLISHER_ROLE and FUNDER_ROLE keys`).
- P0-004 `Implement anti-wash persistence` → merged as PR #3 (`fix(route-ledger,publisher): Pg anti-wash methods + anvil-backed publisher test`).
- P0-013 `Deterministic epoch root reproduction` → merged via epoch/claim stack by PR #11 (`feat(rewards, fee-ledger): durable outbox + epoch gate`) and PR #25 (`feat(reconciler): CC-7 cross-source reconciliation + proof hash`) in combination.
- P0-016 `Build proof dashboard endpoints` → merged partially by PR #9 (`feat(dashboard): pause banner + APR trust labels + epoch countdown`) and PR #10 (`feat(claims,app): per-wallet claim lifecycle API + Claim flow UI`).
- P0-015 `Safe role table and role rotation` scaffolding appears in PR #4 (`chore(deploy): require multisig env vars; revert EOA fallback unless DEV_MODE`) and PR #26.
- P0-001..P0-004 dependency chain to canary and publisher controls are all represented by merged feature PRs above.

## Needs explicit human confirmation / evidence package
- P0-005 `MM/POL wallet exclusion classes`: likely depends on anti-wash code in PR #3, but must be verified against integration tests and real route classification.
- P0-006 `POL vault pause path tests` and P0-007 `LPVault withdraw/share tests`: no obvious merged PR title proves full closeout for these contract gaps in this branch head.
- P0-008 `Resolve adapter topology`: requires a topology closeout pass after vault/tests are verified.
- P0-009 `Centralize policy manifest and bucket registry`: no obvious manifest file can be confirmed in `sw4p-earn/main` from commit titles alone.
- P0-010 `Decide LP/stake 70/30 split` and P0-011 `Resolve DEX LP fee APY treatment`: owner-marked as founder/tokenomics decisions.
- P0-012 `Fee ledger/outbox integration test`: likely covered by merged outbox/reconciler work, but needs explicit harness + non-synthetic proof artifacts.
- P0-017 `Pause/unpause drill`, P0-018 `Reward epoch synthetic close drill`, P0-019 `Anti-wash liveness 24h gate`: these are operational drill/evidence tasks.
- P0-020 `Assemble external audit evidence pack`: documentation/evidence assembly task remains.

## Suggested next control flow (orchestrator)
1. Convert unresolved IDs from "Needs explicit confirmation" into explicit ticket rows with PR/artifact owners.
2. Link each to evidence artifacts in `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p_earn_complete_handoff_pack`.
3. Run a final `sw4p-earn` evidence sweep against each unresolved acceptance criterion before moving to launch.
