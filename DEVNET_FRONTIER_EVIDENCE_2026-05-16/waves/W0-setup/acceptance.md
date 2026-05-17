# W0 Acceptance

**Date:** 2026-05-17T06:36:07Z
**Cycle:** sw4p devnet-frontier 2026-05-16
**Wave outcome:** partial (probes complete; baseline deferred BLOCKED on backend health)

| Gate | Plan task | Evidence link | Result |
|---|---|---|---|
| Worktree sw4p on `staging/devnet-frontier-2026-05-16` | 1.2 | `Render-Network-OS/sw4p-pro` branch | PASS |
| Worktree sw4p-kit on `staging/devnet-frontier-2026-05-16` | 1.3 | `Render-Network-OS/sw4p-kit` branch | PASS |
| Evidence skeleton at parent root | 1.5 | this directory tree | PASS |
| Env files present in worktrees | 1.6 | local verification only | PASS (var names diverged from plan; corrected in handoff) |
| Live Dependency Matrix populated | 2.5 | `live-dependency-matrix.md` | PASS |
| Circle CCTP V2 testnet probes | 2.1 | `probes/circle-cctp-v2.md` | PASS (6 EVM testnets + Solana devnet all live) |
| Uniswap deploy-addresses inventory | 2.2 | `probes/uniswap-deploy-addresses.md` | PASS (Tier 1: Sepolia + Base Sepolia; Tier 2: Fuji + Amoy; Tier 3: Arb Sepolia + Op Sepolia + AVAX/Polygon mainnet) |
| Allbridge live-route discovery | 2.3 | `probes/allbridge-discovery.md` | PASS (W2 path = B2) |
| Cloudflare DNS state captured | 2.4 | `probes/cloudflare-dns.md` | PASS |
| AWS landing probe | 3.1 | `probes/aws-landing.md` | PASS (Scenario A; sw4p.io already on AWS) |
| sw4p.io DNS swap to AWS | 3.2-3.4 | `phase-3-no-cutover-summary.md` | PASS (no swap needed) |
| Circle Gas Station semantics research | 4.1 | `probes/circle-gas-sponsor.md` | PASS (fit NOT CONFIRMED) |
| Circle-sponsored Solana devnet baseline | 4.2-4.3 | n/a | SKIPPED (fit NOT CONFIRMED) |
| Circle gas sponsor deferral | 4.4 | `circle-sponsor-deferral.md` | PASS |
| Live Dependency Matrix Circle row updated | 4.5 | `live-dependency-matrix.md` | PASS (DEFERRED) |
| Baseline Base Sepolia to Solana Devnet | 5.2 | `probes/protocol-endpoint-discovery.md`, `phase-5-baseline-deferred.md` | **DEFERRED BLOCKED** (no real backend reachable) |
| Baseline Solana Devnet to Base Sepolia | 5.3 | same | **DEFERRED BLOCKED** |

## ZERO-MOCKS check

No mock fixtures cited above. Every PASS entry cites either:
- A real on-chain probe (cast code, solana program show, dig, openssl s_client),
- A real external-service response (Circle Iris sandbox, Allbridge production API, Uniswap GitHub API, Cloudflare API),
- A real git commit on the parent or sub-repos,
- Or a real evidence file in `probes/` documenting captured output.

The only DEFERRED entries are:
- 4.2-4.3 SKIPPED (Circle fit NOT CONFIRMED; Task 4.4 deferral document covers this branch per spec design).
- 5.2-5.3 DEFERRED BLOCKED (no real backend reachable; mock URL detected and refused per ZERO-MOCKS).

No fabricated tx hashes. No mock-server evidence.

## Per-gate real evidence

Direct citations for every PASS gate:
- 1.2 sw4p worktree: head SHA `1d243c624e03f1f4ff3330b941ca3aeab31820ee` on branch `staging/devnet-frontier-2026-05-16`.
- 1.3 sw4p-kit worktree: head SHA `53c2051bc9515068fe817dd5b60187e9980f460f` on same branch name.
- 2.1 Circle CCTP V2 probe commit: `67b68b2340964d1ac3857ca16b89b8bc02304666`.
- 2.2 Uniswap inventory commit: `ea4095fb8e2fc65f68281e1be5ef258cbf126b86`.
- 2.3 Allbridge discovery commit: `6322d28b55c83a553ea896aaac5db414a65d197d` + caveat `d813973a20f03ac9b6464853ab3a97633ecd83de`.
- 2.4 Cloudflare DNS commit: `f90c9e89`.
- 2.5 Matrix v1 commit: `45c2abd41b8a8d800adfa512ef2f7a272c695928`.
- 3.1 AWS landing probe commit: `2690ab59`.
- 3.2-3.4 phase-3-no-cutover-summary commit: `ea9bd422` + matrix update `0d8066c3`.
- 4.1 Circle gas sponsor research commit: `2dd5b45577e2d383702d315aefcb166f5b44c684`.
- 4.4 Circle deferral commit: `c89ea6cd434bc2a3906f161bb160d1acc2ff62d4`.
- 4.5 matrix Circle row update commit: `ab0c4686b52ef372273ad5591efc201db4ccc976`.
- 5.2-5.3 endpoint discovery + Phase 5 deferral: `d3146d72`, `c7adc5ec`, `51c9fc19`, `6d032c43`.

## W0 wave verdict

**Partial PASS.** Probes complete and decisive. Baseline deferred BLOCKED on backend health. The cycle cannot proceed to W1 without addressing the backend-health blocker per `phase-5-baseline-deferred.md` unblock criteria.
