# Agent A , sw4p PR / Branch / Worktree Reconciliation

## Correction (2026-05-17, user direction)

This note supersedes any prior text in this report that referenced `555hm13LzCjHLs6JLFxR2rkxCpmkHmkzC1Hz4rCbVyjY` as a 555 token mint candidate. Per user direction:

- **Canonical 555 mainnet mint:** `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`. This is the only address Phase H NTT work targets on Solana.
- `555hm13LzCjHLs6JLFxR2rkxCpmkHmkzC1Hz4rCbVyjY`: non-canonical / stale / do-not-use unless a later audit proves a different role. Any doc, code, or local-secrets reference to it as the 555 mint is flagged for correction, not followed.
- Section 9.1 (555 decimals probe) is unchanged in command shape; only the canonical mint identity is now locked. Probe ONLY `CQwwRomsuW...` for decimals truth. Record decimals, supply, mint authority, freeze authority, token program, owner, and explorer URL.
- Update docs to resolve the 6-vs-9 contradiction against THIS mint's live data only.

## User direction on blockers (2026-05-17)

The five blockers in Section 10 / Section 8.E have been resolved by the user as follows:

1. **Per-tier registry overlay**: KEEP, but fence as **acceptance metadata, not runtime routing config**. Frontend, keeper, and backend routing must continue using `registry/testnet.json` / `registry/mainnet.json` unless explicitly changed. Tier files require a short README/schema note stating this.
2. **`0xaafa1e3d...` grandfathering**: YES, with hard poison markers. Mark `legacy_v1_transmitter: true`, `superseded: true`, `canonical: false`, `route_enabled: false`, `do_not_route: true`. If PR #221 cannot make that safe, close it and move the legacy row into an evidence-only doc.
3. **`wp2.4-mainnet-wave-2026-05-17`**: SINGLE PR. Code hardening first; do not mix fresh deploy evidence into that PR unless the deploy already happened and is only being documented.
4. **555 mint identity**: locked above. Probe only `CQwwRomsuW...`.
5. **Rebase**: AUTHORIZED, but NOT in the dirty staging worktree directly. Create a fresh worktree from `staging/devnet-frontier-2026-05-16`, rebase there, manually bring forward only the intended clean files. `.env.testnet` stays untouched.

## Adjusted action order (2026-05-17, user direction)

1. Open the `wp2.4-mainnet-wave-2026-05-17` PR.
2. Mark PR #234 ready and merge.
3. Close PR #218 and PR #222 with supersession comments.
4. Rebase PR #233 after PR #234 lands; drop the duplicate UNI commit; preserve SCP-attempt + OP/AVAX fork evidence.
5. Handle PR #221 as legacy evidence only; do NOT let it imply canonical Base mainnet V4.1.
6. Rebase `staging/devnet-frontier-2026-05-16` in a fresh worktree; preserve only net-new tier/Permit2/fork-test artifacts.
7. Probe 555 mint identity + decimals against `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`.
8. Only after steps 1-7 are clean, begin Phase H spec work. Phase H is still NOT authorized for implementation; Hyperlane and Wormhole NTT must not be implemented until PR drift is consolidated and 555 mint/decimals truth is settled.

---

# Agent A , sw4p PR / Branch / Worktree Reconciliation

**Date:** 2026-05-17
**Agent role:** sw4p consolidation and PR reconciliation lead
**Scope:** read-only audit and merge plan. No deploys, no broadcasts, no destructive git.
**Authoritative repos audited:**
- `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p` (remote `Render-Network-OS/sw4p-pro`)
- `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit` (remote `Render-Network-OS/sw4p-kit`)
- `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555` (remotes `sw4p-earn`, `docs`)

---

## 1. Executive Summary

- **Classification:** parallel-session drift, not external team conflict. Every cycle-overlapping PR (#218, #221, #222, #233, #234) is authored by `rndrntwrk`. PR #143 alone is `Sw4pIO` bot, policy-doc only. There is no other team.
- **One-line recommended path:** rebase `staging/devnet-frontier-2026-05-16` onto current `origin/master` (`49605a1`), then proceed in this order: open PR for the no-PR `wp2.4-mainnet-wave-2026-05-17` branch as registry/deploy-script hardening, merge PR #234, supersede PR #218 and PR #222 against #234, leave PR #221 blocked pending Circle SCA deploy redo with the post-#239 deploy_v4.
- **Phase H blockers:** the following must be true before Phase H (555 Wormhole NTT + Hyperlane scope) starts:
  1. PR #234 merged (canonical testnet V4.1 evidence schema).
  2. PR #221 rebased onto post-#239 master OR closed and the Base mainnet `0xaafa1e3d...` deploy explicitly recorded as legacy/superseded (it used the pre-#239 deploy_v4 with V1 MessageTransmitter wiring).
  3. `wp2.4-mainnet-wave-2026-05-17` opened as a PR so registry/deploy-script hardening is reviewable.
  4. 555-token decimals contradiction resolved against live Solana mint truth.
  5. Cycle spec amended with a Section 4.10 Phase H placement (does not exist today).

**Phase H implementation is NOT authorized in this report.** This document only defines the readiness gate.

---

## 2. Repository State

### sw4p (`Render-Network-OS/sw4p-pro`)

- **Absolute path:** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p`
- **Current branch:** `wp2.4-mainnet-wave-2026-05-17`
- **Current HEAD SHA:** `043155766bd5396fc2cd38628477f0d3ac1adf68`
- **Upstream tracking branch:** `origin/master`
- **Dirty status:** clean (`git status --short` empty).
- **Default remote branch:** `origin/master` -> `49605a15c1777c5e9b87ce405536a8cc8307ece7` (this is the post-#239 head).
- **Remote SHA of default:** `49605a1` (matches `gh pr view 239 --json mergeCommit` -> `49605a15c1777c5e9b87ce405536a8cc8307ece7`).
- **Wave branch divergence:** `wp2.4-mainnet-wave-2026-05-17` is 3 commits ahead of `origin/master`, 0 commits behind.
- **Worktree count:** 37 worktrees registered (primary checkout + 36 secondary worktrees under `/private/tmp/`, `.claude/worktrees/`, and `.worktrees/`). Many marked `prunable`. Notable cycle worktrees:
  - `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16` @ `7fb34ef` (cycle staging) , **DIRTY**: `.env.testnet` modified, untracked `sw4p-backend/src/hyperlane.rs` and `sw4p-backend/src/wormhole_ntt.rs` (Phase H restoration artifacts, not yet committed).
  - `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/p0-cctp-v2-fix` @ `49605a1` (post-merge master snapshot).

### sw4p-kit (`Render-Network-OS/sw4p-kit`)

- **Absolute path:** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit`
- **Current branch:** `kit/track-b-slim-down`
- **Current HEAD SHA:** `17821963c249fcdd5546b6d0bf52e7e8165aefdb`
- **Upstream tracking branch:** `origin/kit/track-b-slim-down`
- **Dirty status:** clean.
- **Default remote branch:** `origin/main` -> `53c2051bc9515068fe817dd5b60187e9980f460f`
- **Worktree count:** 4 (primary + design/readme-brand-align-r2 + b7 + c1-c2-cli + cycle staging).
- **Cycle staging worktree:** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16` @ `53c2051`, identical to `origin/main`. No kit code committed in cycle.

### Parent corpus (root)

- **Absolute path:** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`
- **Current branch:** `docs/wave-g-sw4p-earn-corpus`
- **Current HEAD SHA:** `c0533e4cbb3692a05093360fb9429599336770b2`
- **Upstream tracking branch:** `sw4p-earn/docs/wave-g-sw4p-earn-corpus`
- **Dirty status:** DIRTY. Heavy `.DS_Store` + submodule pointer modifications + corpus docs. Notable: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/preflight-funding.md` modified. Many docs in `M` state.
- **Remotes:**
  - `sw4p-earn` -> `git@github.com:render-network-os/sw4p-earn.git` (default `sw4p-earn/main`)
  - `docs` -> `git@github.com:Render-Network-OS/docs.git` (default `docs/main`)
- **Corpus branch divergence:** 51 unique commits ahead of `sw4p-earn/main`, 133 commits behind. 133-behind is mainline drift since branch base; not a blocker for the cycle evidence corpus push.
- **Worktree count:** 60+ agent worktrees under `.claude/worktrees/`. Locked agent worktrees exist; none touched by this audit.
- **Local secrets directory check:** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.local-secrets/` exists. Contains expected files: `credentials.json`, `circle-live/`, `circle-test/`, `base-sepolia-deploys-sca.json`, `base-sepolia-deploys.json`, `solana-programs-deploys.json`, `solana-devnet-deploys.json`, EVM authority/funder/publisher/ops keys, decimal-verifier proofs, gas-station proofs. Files not opened or printed.

---

## 3. Open PR Inventory

### sw4p (`Render-Network-OS/sw4p-pro`) , 30 open PRs

| # | Title | Branch (head) | Base | Draft | Mergeable | Files | Commits | Cycle overlap |
|---:|---|---|---|---|---|---:|---:|---|
| 113 | feat(sw4p): align single-api canon and complete Allbridge lifecycle | `feat/sw4p-single-api-alignment` | master | DRAFT | UNKNOWN | many | 14 | NO |
| 123 | ops(sw4p): record Tron proof provisioning state | `ops/sw4p-tron-proof-corridor-provisioning` | master | DRAFT | UNKNOWN | 9 | 9 | NO |
| 143 | docs(policy): land devnet verification gate policy v1 (`Sw4pIO` bot) | `policy/devnet-gate-v1` | master | READY | UNKNOWN | 1 | 1 | TANGENTIAL |
| 183 | test(contracts): lock in CCTP decoder invariants (F-006) | `test/cctp-decoder-invariants` | master | READY | UNKNOWN | 2 | 1 | NO |
| 215 | fix(sw4p-landing): theme-color flat Luna #0046A4 | `landing/fix-theme-color-and-close-stale-2026-05-16` | master | READY | UNKNOWN | 1 | 1 | NO |
| 217 | design(ui): extract shared @sw4p/ui package from landing | `design/shared-xp-ui-package` | master | DRAFT | UNKNOWN | 32 | 3 | NO |
| 218 | feat(testnet): WP2.4 V4.1 testnet deploy gate | `wp2.4-testnet-v41-deploys` | master | DRAFT | MERGEABLE | 1 | 1 | **YES (V4.1 testnet evidence)** , `testnet_v41_deploys.json` schema v1 (Base Sepolia only). |
| 219 | design(frontend): migrate sw4p-frontend to @sw4p/ui, flatten chrome | `design/sw4p-frontend-xp-ui` | master | DRAFT | UNKNOWN | 56 | 4 | NO |
| 220 | docs: sw4p-canary design spec + implementation plan | `docs/sw4p-canary-design-spec-2026-05-16` | master | READY | UNKNOWN | 2 | 2 | NO |
| 221 | feat(mainnet): WP2.4 V4.1 mainnet deploy (BASE; MATIC blocked) | `wp2.4-mainnet-v41-deploys` | master | DRAFT | MERGEABLE | 4 | 2 | **YES (V4.1 mainnet)** , `mainnet_v41_deploys.json` records `0xaafa1e3d...` Base deploy. Branch HEAD `fa71255` rooted PRE-#239; the recorded deploy used V1 MessageTransmitter wiring. **Legacy/superseded.** |
| 222 | feat(registry): add Unichain Sepolia testnet | `unichain-sepolia-testnet-add` | master | READY | MERGEABLE | 4 | 1 | **YES (registry)** , adds UNI to `testnet.json` + `deploy_testnet.cjs` + `hardhat.config.cjs`. |
| 224-232 | M1.T15-T22 landing canary stack (chained) | `landing/m1-t*-*` | various | READY | mostly MERGEABLE | 1-12 | 1 each | NO |
| 233 | test(contracts): empirical Circle SCP attempt on OP Sep / Polygon Amoy / Avalanche Fuji + OP+AVAX fork sims | `wp2.4-testnet-scp-op-poly-avax` | master | DRAFT | **CONFLICTING** | 6 | 3 | **YES (testnet acceptance evidence)** , empirically shows OP/Amoy/Fuji testnet V4.1 deploy is blocked (no Uniswap v4 Universal Router on those testnets). |
| 234 | feat(testnet): WP2.4 V4.1 testnet via Circle SCA (ETH Sep / Arb Sep / Unichain Sep) | `wp2.4-testnet-circle-deploys` | master | DRAFT | MERGEABLE | 6 | 5 | **YES (V4.1 testnet evidence , canonical)** , productionised real Circle-SCA testnet deploys with real tx hashes. `testnet_v41_deploys.json` schema v2 (superset of #218). |
| 235 | design(bots): brand-align telegram + discord | `design/sw4p-bots-brand-align-r2` | master | DRAFT | UNKNOWN | 11 | 1 | NO |
| 237 | design(brand): OG images + README badges | `design/og-images-readme-badges-r2` | master | DRAFT | UNKNOWN | 18 | 1 | NO |
| 238 | design(console): migrate sw4p-console to @sw4p/ui | `design/sw4p-console-xp-ui-r2` | master | DRAFT | MERGEABLE | 43 | 5 | NO |
| 240 | design(widget): XP variant consuming @sw4p/ui | `design/sw4p-widget-xp-variant-r2` | master | DRAFT | UNKNOWN | 64 | 5 | NO |
| 241 | design(storefront): rebuild in XP grammar | `design/sw4p-storefront-xp-rebuild-r2` | master | DRAFT | MERGEABLE | 40 | 5 | NO |
| 242 | fix(deps): zod/mini subpath from rainbowkit transitive | `fix/zod-mini-subpath-final` | master | DRAFT | MERGEABLE | 5 | 1 | NO |
| 243 | fix(deps): wagmi/chains types from malformed viem | `fix/wagmi-viem-types-final` | master | DRAFT | MERGEABLE | 6 | 1 | NO |
| 245 | chore: remove stale Railway and Render deploy config | `chore/remove-stale-deploy-config` | master | DRAFT | MERGEABLE | 15 | 1 | NO |
| 246 | chore(aws): wire build pipeline for @sw4p/ui workspace dep | `chore/aws-build-pkg-ui` | master | DRAFT | MERGEABLE | 6 | 1 | NO |

PR #239 verification: `gh pr view 239` -> `MERGED` at `2026-05-17T06:51:27Z` from `p0-cctp-v2-mainnet-fix` -> master. Merge commit `49605a15c1777c5e9b87ce405536a8cc8307ece7`. **Confirmed.**

### sw4p-kit (`Render-Network-OS/sw4p-kit`) , 1 open PR

| # | Title | Branch | Base | Draft | Mergeable | Cycle overlap |
|---:|---|---|---|---|---|---|
| 4 | design(brand): align README and CLI banner to canonical sw4p brand | `design/readme-brand-align-r2` | main | DRAFT | MERGEABLE | NO |

### sw4p-earn (`render-network-os/sw4p-earn`) , 1 open PR

| # | Title | Branch | Base | Draft | Mergeable | Cycle overlap |
|---:|---|---|---|---|---|---|
| 42 | design(earn): reskin proof dashboard with vendored @sw4p/ui (XP grammar) | `design/sw4p-earn-xp-reskin` | main | DRAFT | MERGEABLE | NO |

### docs repo (`Render-Network-OS/docs`) , 0 open PRs.

---

## 4. Branch Comparison Matrix

Comparisons against the relevant remote default for each repo.

### sw4p

| Branch | Base | Ahead | Behind | Unique commits | Likely conflict files | Duplicate work | Net-new worth preserving | Risky stale to drop |
|---|---|---:|---:|---|---|---|---|---|
| `wp2.4-mainnet-wave-2026-05-17` | `origin/master` | 3 | 0 | `18a8453` UNI mainnet registry; `9ded72e` randomUUID + fail-loud; `0431557` Option-A constructor-final note | none expected | none | UNI mainnet registry row, UUID, fail-loud, Option-A note | none |
| `staging/devnet-frontier-2026-05-16` (worktree only, no remote) | `origin/master` | 6 | 5 (real merge-base is `1d243c6`, pre-#239) | `a062f78`, `0dc8ee4`, `fef2ad7`, `bdd1bfe`, `7fb34ef` plus W1.h Phase H restoration in worktree (uncommitted) | `sw4p-backend/contracts/scripts/deploy_v4.ts` (PR #239 rewrite vs phantom revert); `sw4p-backend/contracts/test/cctp_v2_address_drift.test.cjs` (phantom delete: file landed in PR #239); `sw4p-backend/contracts/scripts/deploy_testnet.cjs`; `sw4p-backend/contracts/scripts/deploy.js` (deleted on PR #234 branch); `sw4p-backend/contracts/scripts/testnet_addresses.json`; `sw4p-backend/contracts/test/ZapAndBridgeV41.fork.test.cjs` | tier-registry concept overlaps PR #234's `testnet_v41_deploys.json` purpose | `registry/permit2.json`, `registry/tier1.json`, `registry/tier2.json`, `registry/tier3-mainnet-fork.json`, `test/fork/avalanche-mainnet-compat.test.cjs`, `test/fork/polygon-mainnet-compat.test.cjs` | phantom-revert of `deploy_v4.ts`, phantom-delete of `cctp_v2_address_drift.test.cjs`, `ZAP_BRIDGE_V41` block in `deployed_addresses.json` (schema collides with #218/#234) |
| `wp2.4-testnet-v41-deploys` (PR #218) | `origin/master` | 1 | 0 | `testnet_v41_deploys.json` schema v1 (Base Sepolia only) | none direct; supersedeable by PR #234 | PR #234 ships schema v2 with all Tier-1 chains | none beyond the same Base Sepolia row in #234 | this whole PR if #234 lands first |
| `wp2.4-mainnet-v41-deploys` (PR #221) | `origin/master` | 2 | 0 | `6cc617e` Circle SDK + deploy schema; `fa71255` Base mainnet deploy record | `deploy_v4.ts` (pre-#239 base) | duplicates `wp2.4-mainnet-wave-2026-05-17`'s deploy_v4 rewrite intent but on a stale base | `mainnet_v41_deploys.json` schema | the entire `0xaafa1e3d...` deploy record (V1 MessageTransmitter miswire, legacy). The PR's tree must be rebased onto post-#239 master before any further mainnet evidence is added. |
| `unichain-sepolia-testnet-add` (PR #222) | `origin/master` | 1 | 0 | UNI Sep testnet add | `registry/testnet.json`, `deploy_testnet.cjs`, `hardhat.config.cjs` (all also in PR #234) | superseded by PR #234's UNI Sep row | none net-new | drop in favor of PR #234 if PR #234 lands first |
| `wp2.4-testnet-scp-op-poly-avax` (PR #233) | `origin/master` | 3 | 0 | `f1ab7a2` UNI Sep add; `915bd8c` SCP attempt evidence; `6d26cb5` OP/AVAX fork sim ext | `registry/testnet.json`, `deploy_testnet.cjs`, `hardhat.config.cjs`, `ZapAndBridgeV41.fork.test.cjs`, `scripts/deploy.js` (deleted) | f1ab7a2 = same UNI add as PR #222; SCP attempt evidence is unique | `scp_testnet_attempt.cjs` (empirical SCP failure-mode evidence); OP + AVAX fork sims | `f1ab7a2` UNI add overlaps PR #222/#234 |

### sw4p-kit

| Branch | Base | Ahead | Behind | Unique | Cycle? |
|---|---|---:|---:|---|---|
| `kit/track-b-slim-down` | `origin/main` | 29 | 0 | track-b slim-down + Hermes + Open Claw platforms | NO |
| `staging/devnet-frontier-2026-05-16` | `origin/main` | 0 | 0 | none | n/a , no kit code work landed in cycle |

### Parent corpus

| Branch | Base | Ahead | Behind | Unique | Cycle? |
|---|---|---:|---:|---|---|
| `docs/wave-g-sw4p-earn-corpus` | `sw4p-earn/main` | 51 | 133 | 51 cycle-evidence docs commits (W0 through W1.h plus coordination deck) | YES , this entire corpus |

---

## 5. V4.1 Deployment Evidence Truth Table

| Chain | Status | Address | Source (PR / branch / doc) | Deploy method | CCTP MessageTransmitter version | Valid evidence? | Notes |
|---|---|---|---|---|---|---|---|
| Base mainnet (legacy) | superseded | `0xaafa1e3d7f317aa40068f34c637441b5c14c1262` | PR #221 `mainnet_v41_deploys.json` | Circle WaaS SCA (`27d863e3-...` Circle wallet) | V1 (pre-#239 deploy_v4 wired `messageTransmitterV1`) | **NO , legacy/miswired** | Listed grandfathered as Circle SCP attempt evidence only. Treat as **legacy**, not as the active V4.1 Base mainnet contract. Constructor wired V1 transmitter; CCTP V2 receive will not function. |
| Base mainnet (canonical) | not deployed | n/a | n/a | n/a | n/a | n/a | Pending redeploy via Circle SCA on post-#239 `deploy_v4.ts`. Wait until PR #234 merges and the `wp2.4-mainnet-wave-2026-05-17` branch is PR'd. |
| ETH Sepolia | deployed | `0x1dcaa37161baf1ecbd1cb92d4df5e01fd049b719` (PR #234 evidence) | PR #234 commit `e153e5c` | Circle SCA | V2 | **YES** | Deployed via post-#239 deploy script. |
| Base Sepolia | deployed | `0x016731D1b719fcDA27709d9A239963B4CF50eAA8` | PR #218 schema v1 and PR #234 schema v2 | Hardhat-direct (recovered-from-killed-agent), nonce 6 | V2 | **YES (conditional)** | Constructor used V2 TokenMessenger + V2 MessageTransmitter (post-#239 canonical addrs). Acceptable as testnet evidence. Deploy path was NOT Circle SCP, but rule says any non-Circle-SCP mainnet deploy is invalid; testnet hardhat-direct is acceptable evidence. |
| Arbitrum Sepolia | deployed | per PR #234 `testnet_v41_deploys.json` (commit `379b225`) | PR #234 | Circle SCA | V2 | **YES** | |
| Unichain Sepolia | deployed | per PR #234 `testnet_v41_deploys.json` (commit `eba24b3`) | PR #234 | Circle SCA | V2 | **YES** | Registry-add was duplicated across PR #222, #233, #234; only PR #234 carries the actual deploy. |
| Optimism Sepolia | blocked (empirical) | none | PR #233 `scp_testnet_attempt.cjs` | n/a (Uniswap v4 Universal Router absent on testnet) | n/a | n/a , correctly blocked | PR #233 records the empirical SCP attempt and the structural block. Fork-sim evidence in `ZapAndBridgeV41.fork.test.cjs` (OP fork) is **compatibility evidence**, not testnet acceptance. |
| Polygon Amoy | blocked (empirical) | none | PR #233 | n/a (no v4 UR on testnet) | n/a | n/a , correctly blocked | Same as OP Sep. Plus W1.f compat via `polygon-mainnet-compat.test.cjs` on `staging/devnet-frontier-2026-05-16`. |
| Avalanche Fuji | blocked (empirical) | none | PR #233 | n/a (no v4 UR on testnet) | n/a | n/a , correctly blocked | Same. Plus W1.f compat via `avalanche-mainnet-compat.test.cjs` on cycle staging. |
| Unichain mainnet | not deployed | n/a , registry entry only | `wp2.4-mainnet-wave-2026-05-17` commit `18a8453` adds the row | n/a | n/a (CCTP V2 in CHAIN_META) | inert/pending | The mainnet registry row is INERT until per-chain V4.1 deploy + per-chain cutover authorization. Do not authorize, do not trigger. |
| OP / Polygon / Avalanche / ETH mainnet | not deployed | n/a , registry rows exist | `registry/mainnet.json` (master + wave branch) | n/a | n/a (CCTP V2 in CHAIN_META) | inert/pending | All inert until Circle SCP deploy. Do not broadcast. |

**Hard rule applied:** old Base mainnet `0xaafa1e3d...` is **legacy/miswired**, treated as superseded. The PR #221 record stays as historical evidence but the address is NOT the canonical V4.1 Base mainnet contract. A fresh Circle-SCA deploy on post-#239 master is required.

---

## 6. Schema Reconciliation

| File | Branch introduced | Should remain canonical? | Recommendation | Owner PR |
|---|---|---|---|---|
| `sw4p-backend/contracts/scripts/testnet_v41_deploys.json` (schema v2) | PR #234 (`wp2.4-testnet-circle-deploys`) | YES | Adopt as canonical testnet V4.1 evidence. Schema v2 is a superset of #218 schema v1; #218's Base Sepolia row exists verbatim inside #234. | PR #234 |
| `sw4p-backend/contracts/scripts/testnet_v41_deploys.json` (schema v1) | PR #218 (`wp2.4-testnet-v41-deploys`) | NO | Supersede with #234. Schema v1 is a strict subset. Close #218 after #234 merges and reference the supersession in the close comment. | n/a (close) |
| `sw4p-backend/contracts/scripts/mainnet_v41_deploys.json` | PR #221 (`wp2.4-mainnet-v41-deploys`) | CONDITIONAL | Keep the schema, but the recorded `0xaafa1e3d...` row is **legacy** (V1 MessageTransmitter). PR #221 must be rebased onto post-#239 master before any new mainnet row is added. Adding the address is non-destructive evidence, but it must carry a `legacy_v1_transmitter: true` marker so consumers know not to route to it. | PR #221 (rebase required) |
| `sw4p-backend/contracts/scripts/deployed_addresses.json` (existing legacy V2/V3/V4 ledger) | exists on master | YES, but freeze V41 entries | Do NOT add a `ZAP_BRIDGE_V41` block here (the cycle staging branch attempted this). V4.1 evidence goes in the dedicated `*_v41_deploys.json` files. Master's file should be left as the V2/V3/V4 historical ledger. | n/a |
| `sw4p-backend/contracts/registry/testnet.json` | exists on master; PR #222, #233, #234 add UNI row | YES | Canonical per-chain testnet registry. PR #234's UNI row is the superset (matches #222 and #233 content). Keep, supersede via #234. | PR #234 |
| `sw4p-backend/contracts/registry/mainnet.json` | exists on master; wave branch adds UNI row | YES | Canonical per-chain mainnet registry. `wp2.4-mainnet-wave-2026-05-17` commit `18a8453` adds the UNI row with cast-verified addresses. Promote via new PR for the wave branch. | new PR for `wp2.4-mainnet-wave-2026-05-17` |
| `sw4p-backend/contracts/registry/tier1.json` | `staging/devnet-frontier-2026-05-16` commit `0dc8ee4` | CONDITIONAL | Keeps acceptance-tier semantics (Tier 1 = real deploy + acceptance). Mostly OVERLAPS the same chain rows in `registry/testnet.json` plus #234's deploy evidence. Recommend KEEP if it adds non-redundant acceptance metadata (tier labels, drift-resolution notes, W0 source pointer); drop if it just re-spells `testnet.json` chain rows. **Decision needed.** Default recommendation: KEEP because the W0 source pointer and the BASE router drift-resolution note are genuinely net-new. | new sw4p PR |
| `sw4p-backend/contracts/registry/tier2.json` | `staging/devnet-frontier-2026-05-16` commit `0dc8ee4` | YES | Tier 2 = CCTP-only protocol proof chains (OP, Polygon, Avalanche testnets). No overlap with existing registries; encodes the "no v4 UR on testnet, but CCTP V2 still works" semantic that PR #233 evidences empirically. KEEP. | new sw4p PR |
| `sw4p-backend/contracts/registry/tier3-mainnet-fork.json` | `staging/devnet-frontier-2026-05-16` commits `0dc8ee4` and `bdd1bfe` | YES | Tier 3 = mainnet-fork compat surface for chains where testnet coverage is structurally impossible. Pairs with `test/fork/avalanche-mainnet-compat.test.cjs` and `polygon-mainnet-compat.test.cjs`. No overlap. KEEP. | new sw4p PR |
| `sw4p-backend/contracts/registry/permit2.json` | `staging/devnet-frontier-2026-05-16` commit `a062f78` | YES | Per-chain Permit2 singleton table, verified via `eth_getCode`. Removes the need for hardcoded Permit2 constants scattered across deploy scripts. No overlap with any wp2.4 PR. KEEP. | new sw4p PR |

**Net schema posture:**
- **Adopt:** `testnet_v41_deploys.json` (PR #234 schema v2), `mainnet_v41_deploys.json` (rebased), `registry/testnet.json` (with PR #234 UNI add), `registry/mainnet.json` (with wave branch UNI add), `registry/tier1.json`, `registry/tier2.json`, `registry/tier3-mainnet-fork.json`, `registry/permit2.json`.
- **Drop:** PR #218's schema v1 (supersede); staging branch's `ZAP_BRIDGE_V41` block in `deployed_addresses.json` (schema collision).

---

## 7. Rebase Plan , `staging/devnet-frontier-2026-05-16` onto `origin/master`

**Do not execute without explicit instruction.**

### Preflight

```bash
# In a fresh terminal, working dir = the staging worktree.
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"

git status                                       # confirm dirty state on record
git fetch --all --prune
git log --oneline origin/master..HEAD            # expect 5 cycle commits
git merge-base HEAD origin/master                # expect 1d243c6 (pre-#239)
git diff --stat origin/master..HEAD              # expect phantom-revert in deploy_v4.ts + phantom-delete of cctp_v2_address_drift.test.cjs
```

Optional safety tag:

```bash
git tag pre-rebase-staging-2026-05-17
```

### Expected conflict files

1. `sw4p-backend/contracts/scripts/deploy_v4.ts` , **expected MASSIVE conflict** because PR #239 rewrote `CHAIN_META`, introduced `CCTP_V2_TOKEN_MESSENGER_MAINNET` / `CCTP_V2_MESSAGE_TRANSMITTER_MAINNET` constants, and added the UNI mainnet row. The staging branch base predates all of that.
2. `sw4p-backend/contracts/test/cctp_v2_address_drift.test.cjs` , **phantom delete**. File added in PR #239; staging base predates it. Rebase will look like a delete.
3. `sw4p-backend/contracts/test/ZapAndBridgeV41.fork.test.cjs` , PR #239 normalised this file to canonical V2 addresses across ETH/BASE/ARB/MATIC.
4. `sw4p-backend/contracts/scripts/deploy_testnet.cjs` , already-merged drift test from PR #214/#216 means master version differs from staging base.
5. `sw4p-backend/contracts/test/deploy_script_drift.test.cjs` , file exists on master (PR #214/#216). Staging commit `fef2ad7` adds +21 lines that must be re-applied on top of master's version.

### Conflict resolution strategy

For each conflict file, **adopt the master version (post-#239) wholesale**, then re-apply the cycle-specific additions on top:

- `deploy_v4.ts` , take master. Cycle did not actually intend to touch this file. The diff is a stale-base artifact.
- `cctp_v2_address_drift.test.cjs` , take master (keep the file). Cycle did not intend to delete it.
- `ZapAndBridgeV41.fork.test.cjs` , take master. Cycle additions, if any, live in the new tier1/tier2/tier3 test files.
- `deploy_testnet.cjs` , 3-way merge: keep master's drift-test integration, re-apply staging's `tier1.json` read path.
- `deploy_script_drift.test.cjs` , take master, then re-derive staging's +21 lines against the master version.

### Commits/changes to drop

- Phantom revert of `deploy_v4.ts` (entire stale-base diff against post-#239 master).
- Phantom delete of `test/cctp_v2_address_drift.test.cjs`.
- Staging's `ZAP_BRIDGE_V41` block in `scripts/deployed_addresses.json` (schema collides with #234's `testnet_v41_deploys.json`).

### Commits/changes to preserve

- `a062f78` , `registry/permit2.json` (clean, net-new).
- `0dc8ee4` , `registry/tier1.json`, `tier2.json`, `tier3-mainnet-fork.json` (clean, net-new).
- `fef2ad7` , the `tier1.json` read path in `deploy_testnet.cjs` and the test addition (re-derived against master).
- `bdd1bfe` , `hardhat.config.cjs` fork networks (`forkAvalancheMainnet`, `forkPolygonMainnet`, AVAX hardforkHistory cancun: 0), and the two new fork-test files.

### Verification commands after rebase

```bash
# Working dir still = staging worktree.
git diff origin/master..HEAD -- sw4p-backend/contracts/scripts/deploy_v4.ts        # expect EMPTY or small surgical diff
git show HEAD:sw4p-backend/contracts/scripts/deploy_v4.ts | grep -c CCTP_V2_MESSAGE_TRANSMITTER_MAINNET   # expect >= 7
git show HEAD:sw4p-backend/contracts/scripts/deploy_v4.ts | grep -c "crypto.randomUUID"                  # expect >= 1
git show HEAD:sw4p-backend/contracts/scripts/deploy_v4.ts | grep -c "failures.length > 0"                # expect >= 1
ls sw4p-backend/contracts/test/cctp_v2_address_drift.test.cjs                                            # expect present
ls sw4p-backend/contracts/registry/{permit2,tier1,tier2,tier3-mainnet-fork}.json                         # expect all four present
ls sw4p-backend/contracts/test/fork/{avalanche,polygon}-mainnet-compat.test.cjs                          # expect both present
git rev-list --left-right --count origin/master...HEAD                                                   # expect 0 left, N right (N = preserved cycle commits)
```

### Post-rebase test commands

```bash
cd sw4p-backend/contracts
npm install --prefer-offline --no-audit         # only if package-lock changed (unlikely)
npx hardhat compile
npx hardhat test test/cctp_v2_address_drift.test.cjs
npx hardhat test test/deploy_script_drift.test.cjs
# Fork tests (require RPC URLs; do not require funded keys; do not broadcast):
ALCHEMY_AVAX_RPC_URL=... npx hardhat test test/fork/avalanche-mainnet-compat.test.cjs
ALCHEMY_POLYGON_RPC_URL=... npx hardhat test test/fork/polygon-mainnet-compat.test.cjs
```

### Post-rebase PR update

- The staging branch is local-only; it has no remote tracking branch. After rebase, push to a non-`codex/`, non-`code/` remote branch name. Suggestion: `cycle/devnet-frontier-2026-05-16-rebased`.
- Open as draft PR titled `chore(cycle): W1 acceptance artifacts (rebased onto post-#239 master)`.
- Body must list the dropped phantom diffs explicitly, with the merge-base SHAs.

---

## 8. PR Close / Merge Plan

### A. Merge first

| PR | Reason | Dependencies | Risk if merged as-is |
|---:|---|---|---|
| 234 | Canonical testnet V4.1 evidence schema (superset of #218); productionised Circle-SCA deploys with real tx hashes; the canonical UNI Sepolia add | none (mergeable as-is); branch is on post-#239 base | Low. Only risk: PR #218 and PR #222 become trivially superseded. Mark them in the close comment. |

### B. Rebase / update first

| PR | Reason | Required action |
|---:|---|---|
| 221 | Branch HEAD `fa71255` is pre-#239 base. Recorded `0xaafa1e3d...` Base mainnet deploy used V1 MessageTransmitter. Must rebase onto post-#239 master before any new mainnet row is added. Add `legacy_v1_transmitter: true` marker on the existing row to make consumers route around it. | rebase; mark draft to ready only after rebase. Hold merge pending Circle-SCA redeploy on Base via post-#239 deploy_v4. |
| 233 | `mergeable: CONFLICTING`. Stale `f1ab7a2` UNI add duplicates PR #222 / PR #234. Drop the UNI add commit on rebase and keep only the SCP-attempt evidence + OP/AVAX fork sims. | rebase onto post-#234 master; force rewrite the f1ab7a2 commit out of the head; resolve `hardhat.config.cjs` and `deploy_testnet.cjs` conflicts toward post-#234 versions. |
| `wp2.4-mainnet-wave-2026-05-17` (no PR yet) | 3 commits ahead of master, no PR open. Open as a registry/deploy-script hardening PR. | branch off itself, push, `gh pr create` titled "feat(scripts): WP2.4 mainnet deploy hardening (UNI registry, UUID, fail-loud, Option-A)" with base master. |

### C. Close / supersede

| PR | Reason | Exact close comment to post |
|---:|---|---|
| 218 | Schema v1 subset of PR #234's schema v2. Same Base Sepolia row appears verbatim in #234. | "Superseded by #234. The Base Sepolia row in this PR is preserved verbatim inside `testnet_v41_deploys.json` schema v2 on `wp2.4-testnet-circle-deploys`. Closing in favor of the productionised superset; no evidence lost." |
| 222 | UNI Sepolia testnet add is duplicated in PR #234's `testnet.json` and `deploy_testnet.cjs` deltas. | "Superseded by #234 which lands the same UNI Sepolia registry entry plus the productionised Circle-SCA deploy. Closing in favor of #234; no functionality lost." (Only close after PR #234 lands.) |

### D. Leave open but blocked

| PR | Reason | Unblock condition |
|---:|---|---|
| 221 | Pre-#239 base + legacy `0xaafa1e3d...` deploy needs `legacy_v1_transmitter: true` annotation. | Rebase. Mark canonical Base deploy as legacy/superseded. Wait for a fresh Circle-SCA Base mainnet deploy via post-#239 deploy script before promoting to ready. **Do NOT broadcast that deploy until user explicitly authorizes V4.1 mainnet cutover.** |
| 233 | Conflicts after PR #234 lands; SCP attempt evidence is genuinely valuable, do not close. | Rebase, drop the UNI-add commit, resolve hardhat + deploy_testnet conflicts toward #234. |
| 113, 123, 143, 183, 215, 217, 219, 220, 224-232, 235, 237, 238, 240, 241, 242, 243, 245, 246 | Non-cycle scope. Out of scope for this reconciliation. | n/a |

### E. Needs user decision

| Topic | Decision required |
|---|---|
| Per-tier registry files vs a single `testnet.json` / `mainnet.json` | The staging branch introduces `tier1/tier2/tier3-mainnet-fork.json`. wp2.4 PRs use single per-environment files. Default recommendation: keep both, treat tier files as overlays that encode acceptance-tier semantics. Confirm before merging the rebased staging branch. |
| Whether to keep PR #218 open until #234 merges, or close immediately and add a "see #234" pointer | Default recommendation: keep open until #234 merges, then close with supersession comment. |
| Whether `wp2.4-mainnet-wave-2026-05-17` should be split into multiple PRs (registry add vs deploy_v4 hardening) | Default recommendation: single PR, the three commits are coherent (mainnet hardening wave). |
| Whether to grandfather `0xaafa1e3d...` as a Circle-SCP attempt artifact or scrub from `mainnet_v41_deploys.json` entirely | Default recommendation: grandfather with `legacy_v1_transmitter: true` and `superseded: true` flags. The deploy is on-chain history; deleting from the ledger is dishonest evidence. |

---

## 9. Phase H Readiness Gate

**Phase H is NOT authorized.** This section only defines what must be true before Phase H starts.

### Docs that must be amended

- `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` , add a Section 4.10 "Phase H , 555 cross-chain rail" placement. Today the cycle spec is silent on Hyperlane and NTT.
- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` , the §10 rejection table currently reads "REJECT; do not re-add" for Wormhole NTT and Hyperlane. Amend with a one-line note: "Out of scope for the USDC Frontier Engine. 555-token cross-chain footprint is owned by Phase H (separate plan)."
- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md` and `2026-05-14-sw4p-frontier-engine-sow.md` , identical one-line scope-boundary note.
- `docs/superpowers/specs/2026-05-09-sw4p-kit-mainnet-sow.md` , scrub the placeholder language ("555 token not yet deployed on {chain}: address is placeholder") once Phase H.1 lands.
- `docs/superpowers/specs/2026-05-08-rndrntwrk-network-ecosystem-design.md` (lines 87, 131, 153) , add reverse cross-reference to Phase H as the upstream rail owner.
- `docs/superpowers/plans/2026-05-13-wave-g-sw4p-earn-corpus.md` , same cross-reference.
- New: `docs/superpowers/plans/2026-05-{NN}-phase-h-555-cross-chain-rail.md` , the Phase H plan itself.

### Branch / PR consolidation prerequisites

- PR #234 merged.
- PR #221 either rebased + marked legacy, OR explicitly closed with a follow-up Circle-SCA redeploy PR planned.
- PR #222 closed via PR #234 supersession.
- `wp2.4-mainnet-wave-2026-05-17` opened as a PR and merged.
- `staging/devnet-frontier-2026-05-16` rebased; per-tier registry files and Permit2 registry merged or formally rejected.
- PR #233 rebased after #234 lands.

### Unresolved architecture questions

1. **555 decimals contradiction.** Canonical truth (`555hm13LzCjHLs6JLFxR2rkxCpmkHmkzC1Hz4rCbVyjY` per local secrets filename and known 555 mint) is claimed at 9 decimals in some docs, 6 in ecosystem design + Wave G plan + decimal verifier. Resolution rule: **probe the Solana mint, do not decide by document majority.** Probe command:

   ```bash
   # Read-only Solana mint probe. No tx broadcast.
   spl-token display CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2 \
       --url https://api.mainnet-beta.solana.com
   # or equivalently:
   solana account CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2 \
       --url https://api.mainnet-beta.solana.com --output json
   ```

   The mint's `decimals` field is authoritative for the NTT manager constructor.

2. **Who owns EVM 555 + NTT deployment?** Not the Frontier Engine repo (engine scope is USDC). Recommendation: ecosystem-aligned, lives in parent repo `docs/superpowers/plans/`.

3. **Hyperlane scope.** Must NOT be silently reintroduced as a Frontier Engine Approach A rail. Classify as **messaging-only future/conditional**, explicitly promoted only after user approval. Default Phase H proposal: mirror the cycle spec's existing "conditional-future" vocabulary for CCIP and register Hyperlane in the same posture. No execution work.

4. **Vendor-name cleanup in older landing-kit plan.** The older landing-kit plan mentions "Stargate" / "LayerZero" / "Allbridge" rails in scope language that does not match current Approach A (USDC + CCTP V2). Cleanup is a follow-up doc PR.

5. **Separation between USDC Frontier Engine and 555 token mobility.** Currently the cycle spec is USDC + CCTP V2 only (W1 through W8). Phase H is 555 token + NTT (Wormhole) for cross-chain mobility. Hyperlane sits outside both as deferred-conditional messaging. This separation must be explicit in the Phase H plan body, not implicit.

### Architectural boundary , locked in this report

- **Frontier Engine Approach A:** USDC + CCTP V2 only. Wormhole NTT is NOT a USDC rail. Hyperlane is NOT a USDC rail.
- **Wormhole NTT:** owned by Phase H for 555-token mobility only.
- **Hyperlane:** messaging-only future/conditional. No silent reintroduction. Requires explicit user promotion.

### Exact live probes needed before Phase H

1. Solana mint decimals (above).
2. Per-chain Permit2 presence verification (already done via `registry/permit2.json` on staging branch; ratify by adopting that file).
3. Per-chain Universal Router presence verification (already done in W0.a probes; ratify).
4. Circle SCP wallet provisioning status on Base mainnet (verify Circle wallet ID `27d863e3-7dee-5a95-9d5d-7d85543a0829` is still valid and that the V1-transmitter `0xaafa1e3d...` deploy is recorded as superseded).

---

## 10. Final Recommendation

- **Execute consolidation now?** YES, for the rebase + PR open / supersede / close steps. NO for any deploy. NO for any broadcast.
- **Any PR can merge immediately?** YES , **PR #234** is the only one that is unambiguously mergeable today. It is the canonical testnet V4.1 evidence (schema v2, real Circle-SCA tx hashes on ETH Sep / Arb Sep / Unichain Sep + the verbatim Base Sepolia row from #218). Confirm the draft -> ready flip, then merge.
- **Any PR must close?** YES , **PR #218** must close after #234 merges (schema v1 subset). **PR #222** must close after #234 merges (UNI Sepolia duplication). Both with supersession comments per Section 8.
- **Phase H can start?** NO. Gate is not met. Pre-conditions: §9 docs amendments, PR #234 merged, PR #221 rebased or closed, PR #222 closed, `wp2.4-mainnet-wave-2026-05-17` opened as a PR, decimals resolved against live Solana mint.
- **Next human / user decision:**
  1. Authorize the rebase of `staging/devnet-frontier-2026-05-16` onto `origin/master` per Section 7. This is local-only and reversible.
  2. Decide whether the per-tier registry files survive (Section 6 / Section 8.E). Default: KEEP.
  3. Decide whether `0xaafa1e3d...` is grandfathered in `mainnet_v41_deploys.json` with `legacy_v1_transmitter: true` markers (default: KEEP with markers) or scrubbed (NOT recommended; dishonest evidence).
  4. Authorize opening a PR for `wp2.4-mainnet-wave-2026-05-17`.
  5. Confirm PR #234 promotion from draft to ready, then merge.

**No deploy, no broadcast, no Circle write, no AWS write, no DNS write, no force push, no destructive git, no Hyperlane / Wormhole NTT / Phase H implementation has been or should be taken from this reconciliation.**

---

## Audit notes

- All PR rows verified end-to-end via `gh pr view --json title,baseRefName,headRefName,files,commits,isDraft,mergeable,state`. No PR was inferred from title.
- Branch divergences verified via `git rev-list --left-right --count`, `git log --oneline`, `git diff --stat`.
- PR #239 merge status verified: `gh pr view 239 --json mergeCommit,state,mergedAt` returns `MERGED` at `2026-05-17T06:51:27Z` with merge commit `49605a15c1777c5e9b87ce405536a8cc8307ece7`, matching current `origin/master` head.
- Staging branch `deploy_v4.ts` confirmed to lack PR #239 constants (`CCTP_V2_MESSAGE_TRANSMITTER_MAINNET` not present; per-chain hardcoded V1 transmitter addresses retained), confirming the phantom-revert classification.
- Wave branch `deploy_v4.ts` confirmed to retain PR #239 constants AND adds `crypto.randomUUID()` + `failures.length > 0` + `process.exit(1)`.
- `.local-secrets/` directory existence noted; contents not opened.
- No file was modified outside this report.
