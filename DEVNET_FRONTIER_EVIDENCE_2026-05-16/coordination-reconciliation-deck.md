# Coordination Reconciliation Deck (devnet-frontier 2026-05-16 cycle)

**Date:** 2026-05-17
**Worktree:** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/`
**Path chosen:** A , coordinate first, propose merge plan, then proceed with amendments + NTT work.

## Headline finding (read before everything else)

All "parallel" sw4p / sw4p-kit work surfaced in this audit (PRs #218, #221, #222, #233, #234, branch `wp2.4-mainnet-wave-2026-05-17`, plus my cycle staging branches) is authored by the same GitHub user `rndrntwrk`. There is **no separate team**. The "wp2.4 mainnet wave" is a parallel session from the same operator, not external contention. Coordination is therefore consolidation, not arbitration.

A second load-bearing finding: my sw4p staging branch `staging/devnet-frontier-2026-05-16` is rooted at `1d243c6` (PR #216 merge), which is **before** PR #239 (`p0-cctp-v2-mainnet-fix`) landed on master. Master is now at `49605a1` and contains the canonical CCTP V2 unification, the `cctp_v2_address_drift.test.cjs` regression test, and the unified `CHAIN_META` constants. My staging branch's `deploy_v4.ts` diff therefore looks like a *revert* of PR #239 when reconciled against master , this is a stale-base artifact, not a design decision. Any merge plan must rebase before touching `deploy_v4.ts`.

---

## 1. All open sw4p PRs

Source: `gh pr list --state open --limit 50` against `Render-Network-OS/sw4p-pro`. All authored by `rndrntwrk` unless noted.

| # | Title | Branch | State | Files | Commits | Overlaps cycle? |
|---:|---|---|---|---:|---:|---|
| 113 | feat(sw4p): align single-api canon and complete Allbridge lifecycle | `feat/sw4p-single-api-alignment` -> master | DRAFT | 100+ | 14 | NO , single-API canon + Allbridge lifecycle, predates this cycle. |
| 123 | ops(sw4p): record Tron proof provisioning state | `ops/sw4p-tron-proof-corridor-provisioning` -> master | DRAFT | 9 | 9 | NO , Tron Allbridge proof corridor, scoped to W2. |
| 143 | docs(policy): land devnet verification gate policy v1 (`Sw4pIO` bot author) | `policy/devnet-gate-v1` -> master | OPEN | 1 | 1 | TANGENTIAL , devnet-gate policy doc. Cycle is the implementation that exercises this policy. |
| 183 | test(contracts): lock in CCTP decoder invariants (F-006) | `test/cctp-decoder-invariants` -> master | OPEN | 2 | 1 | NO , decoder invariant unit tests. Already merged-adjacent. |
| 215 | fix(sw4p-landing): theme-color to flat Luna #0046A4 | `landing/fix-theme-color-and-close-stale-2026-05-16` -> master | OPEN | 1 | 1 | NO , landing chrome only. |
| 217 | design(ui): extract shared @sw4p/ui package from landing | `design/shared-xp-ui-package` -> master | DRAFT | 32 | 3 | NO , UI package extraction. Outside cycle scope. |
| 218 | feat(testnet): WP2.4 V4.1 testnet deploy gate | `wp2.4-testnet-v41-deploys` -> master | DRAFT | 1 | 1 | **YES** , `testnet_v41_deploys.json` inventory file. Overlaps the Base Sepolia deploy my W1 staging branch records in `testnet_addresses.json`. |
| 219 | design(frontend): migrate sw4p-frontend to @sw4p/ui, flatten chrome | `design/sw4p-frontend-xp-ui` -> master | DRAFT | 56 | 4 | NO , frontend UI flatten. |
| 220 | docs: sw4p-canary design spec + implementation plan | `docs/sw4p-canary-design-spec-2026-05-16` -> master | OPEN | 2 | 2 | NO , canary service spec. Adjacent to but not part of cycle. |
| 221 | feat(mainnet): WP2.4 V4.1 mainnet deploy (BASE; MATIC blocked) | `wp2.4-mainnet-v41-deploys` -> master | DRAFT | 4 | 2 | **YES** , `deploy_v4.ts` is the same file my staging branch touches. My version is the pre-PR-239 base; this branch is the post-PR-239 mainnet deploy artifact. |
| 222 | feat(registry): add Unichain Sepolia testnet | `unichain-sepolia-testnet-add` -> master | OPEN | 4 | 1 | **YES** , `testnet.json` + `deploy_testnet.cjs` + `hardhat.config.cjs` overlap. My staging branch does not add UNI testnet but does touch the same files. |
| 224 | M1.T15-17 landing: canary client + types + PollingManager + CanaryProvider | `landing/m1-t15-17-data-infra-2026-05-16` -> master | OPEN | 12 | 1 | NO , landing canary plumbing. Stack base for #225 to #229, #230, #231, #232. |
| 225 | M1.T18 landing: swap About + NetworkPlaces to canary snapshot | base #224 | OPEN | 4 | 1 | NO , landing stack. |
| 226 | M1.T19 landing: swap TrustSection Engine Health + Recent Activity | base #225 | OPEN | 1 | 1 | NO , landing stack. |
| 227 | M1.T20 landing: swap RouteTicker + NetworkLEDs to shared canary bus | base #226 | OPEN | 2 | 1 | NO , landing stack. |
| 228 | M1.T21 landing: Resolver button + auto-cycle hit /estimate | base #227 | OPEN | 1 | 1 | NO , landing stack. |
| 229 | M1.T22 landing: CanaryProvider behind ?canary=on flag | base #228 | OPEN | 2 | 1 | NO , landing stack. |
| 230 | fix(landing): typed import.meta.env (no any cast) | base #224 | OPEN | 2 | 1 | NO , landing review fix. |
| 231 | fix(landing): StatusLed tone reflects live state | base #225 | OPEN | 1 | 1 | NO , landing review fix. |
| 232 | fix(landing): RouteTicker fallback timer leak | base #227 | OPEN | 1 | 1 | NO , landing review fix. |
| 233 | test(contracts): empirical Circle SCP attempt on OP Sep / Polygon Amoy / Avalanche Fuji + OP+AVAX fork sims | `wp2.4-testnet-scp-op-poly-avax` -> master | DRAFT | 6 | 3 | **YES** , `hardhat.config.cjs`, `deploy_testnet.cjs`, `ZapAndBridgeV41.fork.test.cjs` all overlap. Empirically establishes OP/Amoy/Fuji testnets cannot host V4.1 because Uniswap v4 Universal Router is absent. |
| 234 | feat(testnet): WP2.4 V4.1 testnet via Circle SCA (ETH Sep / Arb Sep / Unichain Sep) | `wp2.4-testnet-circle-deploys` -> master | DRAFT | 6 | 5 | **YES** , real Circle-SCA testnet deploys with real tx hashes on ETH Sep / ARB Sep / UNI Sep. Overlaps `hardhat.config.cjs`, `deploy_testnet.cjs`. **This is the productionised version of my W1.c work.** |
| 235 | design(bots): align telegram + discord copy voice and embed brand color | `design/sw4p-bots-brand-align-r2` -> master | DRAFT | 11 | 1 | NO , bots brand alignment. |
| 237 | design(brand): align OG images and README badges | `design/og-images-readme-badges-r2` -> master | DRAFT | 18 | 1 | NO , brand. |
| 238 | design(console): migrate sw4p-console to @sw4p/ui | `design/sw4p-console-xp-ui-r2` -> master | DRAFT | 43 | 5 | NO , console UI. |
| 240 | design(widget): add XP variant consuming @sw4p/ui | `design/sw4p-widget-xp-variant-r2` -> master | DRAFT | 64 | 5 | NO , widget UI. |
| 241 | design(storefront): rebuild in XP grammar | `design/sw4p-storefront-xp-rebuild-r2` -> master | DRAFT | 40 | 5 | NO , storefront UI. |
| 242 | fix(deps): resolve zod/mini subpath error from rainbowkit transitive | `fix/zod-mini-subpath-final` -> master | DRAFT | 5 | 1 | NO , dep fix. |
| 243 | fix(deps): resolve wagmi/chains types from malformed viem install | `fix/wagmi-viem-types-final` -> master | DRAFT | 6 | 1 | NO , dep fix. |
| 245 | chore: remove stale Railway and Render deploy config | `chore/remove-stale-deploy-config` -> master | DRAFT | 15 | 1 | NO , deploy-config cleanup. |
| 246 | chore(aws): wire build pipeline for @sw4p/ui workspace dep | `chore/aws-build-pkg-ui` -> master | DRAFT | 6 | 1 | NO , AWS image build. |

**Total open sw4p PRs read end-to-end:** 30.
**Overlapping with cycle:** 5 (PR #218, #221, #222, #233, #234).
**Tangential to cycle (policy/spec only):** 2 (PR #143, #220).

## 2. All open sw4p-kit PRs

| # | Title | Branch | State | Files | Commits | Overlaps cycle? |
|---:|---|---|---|---:|---:|---|
| 4 | design(brand): align README and CLI banner to canonical sw4p brand | `design/readme-brand-align-r2` -> main | DRAFT | 1 | 1 | NO , README badge palette only. |

**Total open sw4p-kit PRs:** 1. None overlap the cycle.

## 3. Active worktrees, both sub-repos

### sw4p (selected, full list elided for non-cycle work)

| Path | Branch | Last commit | Intent guess |
|---|---|---|---|
| `/Volumes/.../sw4p` (primary checkout) | `wp2.4-mainnet-wave-2026-05-17` | `0431557` | Active wp2.4 mainnet wave work checkout. Three commits ahead of master: UNI mainnet registry, deploy_v4 UUID+fail-loud, Option-A constructor-final note. |
| `/Volumes/.../.worktrees/sw4p-devnet-frontier-2026-05-16` | `staging/devnet-frontier-2026-05-16` | `7fb34ef` | **My cycle staging.** Five commits ahead of merge-base `1d243c6` (PR #216 merge); base is now ~7 commits behind master. |
| `/private/tmp/sw4p-pro-r2-*` (8 dirs) | various `design/*-r2` branches | mixed | Open PRs #237, #238, #240, #241, #246 worktrees. |
| `/private/tmp/sw4p-pro-*-fix-final`, `/private/tmp/sw4p-pro-zod-fix-final` | `fix/wagmi-viem-types-final`, `fix/zod-mini-subpath-final` | mixed | Open PRs #242, #243 worktrees. |
| `/private/tmp/sw4p-pro-stale-deploy-cleanup` | `chore/remove-stale-deploy-config` | `a37bda2` | Open PR #245. |
| `/private/tmp/sw4p-pro-aws-build-fix` | `chore/aws-build-pkg-ui` | `1cd64e0` | Open PR #246. |
| `/private/tmp/sw4p-audit-*` (6 dirs) | `audit/2026-04-30-*` | mixed | Old audit branches from 2026-04-30, marked `prunable`. |
| `/private/tmp/sw4p-f00*`, `/private/tmp/sw4p-proof-corridor-preflight` | various `codex/f00*`, `f006-*` | mixed | Old codex feature branches, marked `prunable`. |
| 30+ `claude/*` and `assistant/*` worktrees under `.claude/worktrees/` | various agent branches | mixed | Parallel agent sessions from prior cycles; out of scope for this reconciliation. |

### sw4p-kit

| Path | Branch | Last commit | Intent guess |
|---|---|---|---|
| `/Volumes/.../sw4p-kit` (primary) | `kit/track-b-slim-down` | `1782196` | Active kit work, Track B slim-down. |
| `/Volumes/.../.worktrees/sw4p-kit-devnet-frontier-2026-05-16` | `staging/devnet-frontier-2026-05-16` | `53c2051` | **My cycle staging.** Zero commits ahead of `origin/main` , no kit work landed in this cycle yet. |
| `/private/tmp/sw4p-kit-r2-readme` | `design/readme-brand-align-r2` | `78d01e0` | Open PR #4. |
| `sw4p-kit/.claude/worktrees/b7-streamable-http` | `kit/b7-streamable-http` | `f165d42` | Parallel feature branch. |
| `sw4p-kit/.claude/worktrees/c1-c2-cli` | `kit/c1-c2-cli` | `cdf72db` | Parallel feature branch. |

## 4. `wp2.4-mainnet-wave-2026-05-17` branch , full commit chain

Branch tip: `043155766bd5396fc2cd38628477f0d3ac1adf68`. **NOT on any open PR.** Three commits ahead of master (`49605a1`):

| SHA | Subject | Files | Summary |
|---|---|---|---|
| `18a8453` | feat(registry): add Unichain mainnet (chain 130, CCTP V2 + Uniswap v4) | `sw4p-backend/contracts/registry/mainnet.json` (+9 lines) | Adds the UNI row to mainnet registry (chain_id 130, CCTP domain 10). USDC, Universal Router, Permit2 verified on-chain via `cast code` against `mainnet.unichain.org` on 2026-05-17. CCTP V2 TokenMessenger/MessageTransmitter/WETH already in `deploy_v4.ts` CHAIN_META from PR #239. INERT until per-chain V4.1 deploy + per-chain cutover authorization. |
| `9ded72e` | fix(scripts): deploy_v4.ts uses crypto.randomUUID() + fail-loud on any per-chain failure | `sw4p-backend/contracts/scripts/deploy_v4.ts` (+18 -1) | Replaces stringly idempotency key with `crypto.randomUUID()`. Adds `failures[]` collector and `process.exit(1)` if any per-chain deploy fails. Closes the "partial success exits 0" hole in mainnet deploy waves. |
| `0431557` | chore(scripts): replace stale Safe-handoff reminder with Option-A constructor-final note | `sw4p-backend/contracts/scripts/deploy_v4.ts` (+3 -4) | Updates the post-deploy log copy. Old text instructed operator to run `beginDefaultAdminTransfer` handoff ceremony. New text states Circle SCA governance authorities are constructor-final (Option A), so Safe handoff is not expected for this wave; Safe migration is a separate explicitly-authorized operation. |

## 5. My staging branch commits , parent + sw4p worktree + sw4p-kit worktree

### Parent repo (`/Volumes/.../555`)

50 commits ahead of base `04a8813a`. Top of branch is `579e6b9a`. All are evidence/docs commits; none are code changes to sub-repos.

Mapping to waves:

| Phase | Commits |
|---|---|
| Cycle scaffold | `7149c90f` (W0 plan), `ca038602` (.gitignore worktrees), `951d7eaf` (scaffold evidence bundle) |
| W0.a , Live deps matrix + probes | `45c2abd4`, `f90c9e89`, `67b68b23`, `ea4095fb`, `6322d28b`, `d813973a`, `0d8066c3`, `ab0c4686`, `51c9fc19` |
| W0.b , AWS landing health + DNS | `2690ab59`, `ea4095fb`, `ea9bd422`, `0d8066c3` |
| W0.c , Circle gas sponsorship determination | `2dd5b455`, `c89ea6cd`, `ab0c4686` |
| W0.d , Baseline (BLOCKED) | `d3146d72`, `c7adc5ec`, `51c9fc19`, `6d032c43` |
| W0 close | `699ce668`, `237ce16d`, `39f42127`, `4a9db1aa`, `fbef92cd` |
| W1 plan | `967d8ffa`, `3afcf1f1` |
| W1.a , Control coverage + constructor preconditions | `547ba64b`, `1b27286f` |
| W1.b , Permit2 sourcing | `b55623ba` |
| W1.preflight , Wallet funding probe | `d6be7f7c`, `d3a94f6d` |
| W1.c , Tier 1 V4.1 SCP deploys | `176a4b94`, `41d5c8cf`, `47628ad0` |
| W1.d , Tier 1 acceptance | `77138350`, `abf84a87`, `1663263c`, `07371944` |
| W1.e , Tier 2 CCTP-only | `306b5df5`, `51a60376`, `5ca69c5a`, `e368b104` |
| W1.f , Mainnet-fork compat | `9be6b358` |
| W1 close | `563d38cd`, `c917bba8`, `b7396849`, `82b5a868`, `61ddfeb9` |
| W1.h , Rail restoration audit | `8232f7ed`, `579e6b9a` |

### sw4p worktree (`.worktrees/sw4p-devnet-frontier-2026-05-16`)

5 commits ahead of merge-base `1d243c6` (PR #216 merge). HEAD `7fb34ef`. Merge-base is **NOT** current `origin/master` (`49605a1`); base is ~7 commits behind master.

| SHA | Subject | Files | Wave |
|---|---|---|---|
| `a062f78` | feat(contracts): per-chain Permit2 registry sourced from Uniswap/permit2 canonical addresses | `registry/permit2.json` (+13) | W1.b |
| `0dc8ee4` | feat(contracts): W1 tier1, tier2, tier3-mainnet-fork registry files resolving Base Sepolia router drift | `registry/tier1.json`, `tier2.json`, `tier3-mainnet-fork.json` (+114) | W1.a/b |
| `fef2ad7` | feat(contracts): deploy_testnet.cjs reads tier1.json for Sepolia plus Base Sepolia | `scripts/deploy_testnet.cjs` (+70 -2), `scripts/testnet_addresses.json` (+8 -1), `test/deploy_script_drift.test.cjs` (+21) | W1.c |
| `bdd1bfe` | test(contracts): Tier 3 mainnet-fork compat tests for Avalanche plus Polygon mainnets | `hardhat.config.cjs` (+36 -1), `registry/tier3-mainnet-fork.json` (+30 -1), `test/fork/avalanche-mainnet-compat.test.cjs` (+225), `test/fork/polygon-mainnet-compat.test.cjs` (+245) | W1.f |
| `7fb34ef` | feat(contracts): record V4.1 Tier 1 SCP-deployed addresses (Sepolia + Base Sepolia) | `scripts/deployed_addresses.json` (+5 -1) | W1.c |

### sw4p-kit worktree (`.worktrees/sw4p-kit-devnet-frontier-2026-05-16`)

**Zero commits ahead of `origin/main`.** HEAD `53c2051`. No kit code work has landed in this cycle yet.

## 6. Overlap matrix , my commits vs wp2.4 work

| My commit | File touched | Overlapping wp2.4 work | Verdict |
|---|---|---|---|
| `a062f78` (Permit2 registry) | `registry/permit2.json` (NEW) | None , file not on master, not in any wp2.4 PR. | **Net-new.** Cycle-only artifact, no contention. |
| `0dc8ee4` (tier1/tier2/tier3 JSON) | `registry/tier1.json`, `tier2.json`, `tier3-mainnet-fork.json` (all NEW) | None , files not on master, not in any wp2.4 PR. PR #222 adds UNI to `registry/testnet.json` (different file). PR #234 adds UNI rows to `registry/testnet.json` (different file). | **Net-new.** Different registry schema (per-tier files) from the wp2.4 single-registry-file approach. Design tension surfaced: see Section 8. |
| `fef2ad7` (deploy_testnet.cjs reads tier1) | `scripts/deploy_testnet.cjs` (+70 -2) | PR #222 modifies `deploy_testnet.cjs` (UNI testnet entry). PR #233 and #234 also modify `deploy_testnet.cjs`. | **Hard conflict.** All four touch the same `TESTNETS` map and surrounding code paths. Merge will be 3-way; my version reads a new tier1.json file the others do not know about. |
| `fef2ad7` (testnet_addresses.json) | `scripts/testnet_addresses.json` (+8 -1) | PR #234 ships `scripts/testnet_v41_deploys.json` (NEW). PR #218 ships the same file. | **Adjacent, not direct.** Different filename; same conceptual purpose (record V4.1 testnet deploys). PR #234 is the canonical productionised version with real Circle-SCA tx hashes; my file records only the dry-run "ready" status pre-deploy. |
| `fef2ad7` (deploy_script_drift.test.cjs) | `test/deploy_script_drift.test.cjs` (+21) | **Same file exists on master** (landed via PR #214/#216). My +21 is on top of an older base; reconciliation needed. | **Stale-base addition.** My +21 must be re-derived against the master version. |
| `bdd1bfe` (Tier 3 fork tests) | `hardhat.config.cjs` (+36 -1) | PR #222 modifies `hardhat.config.cjs` (adds `unichainSepolia` network). PR #233 and #234 also modify `hardhat.config.cjs`. | **Soft conflict.** I add fork networks (`forkAvalancheMainnet`, `forkPolygonMainnet`, AVAX hardforkHistory). Others add testnet networks. Different sections of the same file; mergeable with care. |
| `bdd1bfe` (Tier 3 fork tests) | `registry/tier3-mainnet-fork.json` (+30 -1) | None , file is my own from `0dc8ee4`. | **Net-new.** No contention. |
| `bdd1bfe` (Tier 3 fork tests) | `test/fork/avalanche-mainnet-compat.test.cjs`, `polygon-mainnet-compat.test.cjs` (NEW) | None , files not on master, not in any wp2.4 PR. PR #233 ships a related but separate `test/ZapAndBridgeV41.fork.test.cjs` extension for OP+AVAX fork sims. | **Net-new** at the file level, but **scope-overlap** with PR #233's AVAX fork sim. PR #233's AVAX sim is in `ZapAndBridgeV41.fork.test.cjs`; mine is a standalone `avalanche-mainnet-compat.test.cjs`. Two implementations of the same idea. |
| `7fb34ef` (deployed addresses) | `scripts/deployed_addresses.json` (+5 -1) | PR #221 writes mainnet V4.1 to `scripts/mainnet_v41_deploys.json`. PR #234 and #218 write testnet V4.1 to `scripts/testnet_v41_deploys.json`. Master's `deployed_addresses.json` is the legacy V2/V3/V4 ledger. | **Schema collision.** My commit adds a `ZAP_BRIDGE_V41` block to the legacy `deployed_addresses.json`. The wp2.4 work uses dedicated files (`testnet_v41_deploys.json`, `mainnet_v41_deploys.json`). Need to pick one schema and migrate. |
| Implicit (rebase delta) | `test/cctp_v2_address_drift.test.cjs` | **File is on master.** My branch lacks it (rooted at `1d243c6`, pre-PR-239). Git diff `origin/master..staging` shows it as `-280 lines`. | **Phantom delete.** Pure stale-base artifact; not a design decision. Resolves by rebase. |
| Implicit (rebase delta) | `scripts/deploy_v4.ts` (CHAIN_META structure) | **PR #239 rewrote this on master** (extracted `CCTP_V2_TOKEN_MESSENGER_MAINNET` / `CCTP_V2_MESSAGE_TRANSMITTER_MAINNET` constants, added UNI row). `wp2.4-mainnet-wave-2026-05-17` extends with `crypto.randomUUID()` + fail-loud + Option-A note. | **Phantom revert.** My branch does not touch `deploy_v4.ts` in any of its 5 commits, but a 3-way merge against master would surface a revert because of the base mismatch. Resolves by rebase. |

## 7. Net new work my staging branch has actually contributed

After de-duping the phantom reverts and the wp2.4 overlap, the real value-add of my staging branch is:

1. **Per-tier registry file schema** (`registry/tier1.json`, `tier2.json`, `tier3-mainnet-fork.json`) , a deliberate departure from the single-`testnet.json` / single-`mainnet.json` pattern PRs #222, #233, #234 use. The per-tier files encode the **W1 acceptance-tier semantic** (Tier 1 = real deploy + acceptance, Tier 2 = CCTP-only protocol proof, Tier 3 = mainnet-fork compat) directly in the registry layout, which the cycle spec demands but the wp2.4 single-registry-file pattern does not capture.

2. **Per-chain Permit2 registry** (`registry/permit2.json`) , canonical Permit2 singleton table sourced from Uniswap/permit2, sourced and verified per chain. Not present in any wp2.4 PR.

3. **Tier 3 mainnet-fork test scaffold** (`test/fork/avalanche-mainnet-compat.test.cjs`, `polygon-mainnet-compat.test.cjs` + `hardhat.config.cjs` `forkAvalancheMainnet` and `forkPolygonMainnet` networks) , a dedicated mainnet-fork compat surface for the chains where testnet coverage is structurally impossible (no Universal Router on testnet). Distinct from PR #233's `ZapAndBridgeV41.fork.test.cjs` extension; both implementations should be reconciled into one canonical surface.

4. **Drift-test extension** (+21 lines on `test/deploy_script_drift.test.cjs`) , additional assertions on the registry-driven config builder. Must be rebased onto master's already-merged drift test before it can be evaluated for net-new value.

5. **Pre-deploy `testnet_addresses.json` annotations** (`registry_source: "tier1.json"`) , the wp2.4 pattern uses a separate `testnet_v41_deploys.json` for post-deploy records. My annotation is a pre-deploy "ready" pointer; the wp2.4 file is a post-deploy proof. Both are legitimate; they record different lifecycle stages.

6. **Parent-repo cycle evidence corpus** (50 commits, `DEVNET_FRONTIER_EVIDENCE_2026-05-16/`) , the entire wave-by-wave acceptance documentation, including the W1.h rail restoration audit and the doc-grounded rail-scope audit. No wp2.4 PR contains this; it lives only in the parent repo cycle bundle.

**Headline:** items 1, 2, 3, 6 are unambiguous net-new value. Items 4, 5 need rebase before they can be ranked.

## 8. Concrete merge plan , per my commit

Disposition codes: **CP** (cherry-pick onto wp2.4 base after rebase), **DROP** (drop in favor of wp2.4), **MERGE** (no conflict, merge as-is after rebase), **REVIEW** (design disagreement, needs human call).

| My commit | Disposition | Target | Action |
|---|---|---|---|
| Parent: 50 cycle-evidence commits (`951d7eaf` to `579e6b9a`) | MERGE | `docs/wave-g-sw4p-earn-corpus` branch in parent repo (current branch) | Already committed to local parent branch. Push to remote and open PR to parent `main`. No sub-repo dependency. |
| sw4p `a062f78` (`registry/permit2.json`) | CP | new PR onto fresh branch off current `origin/master` | Cherry-pick clean; net-new file, no rebase issues. Open as standalone PR titled "feat(contracts): per-chain Permit2 registry (sw4p-pro)". |
| sw4p `0dc8ee4` (tier1/tier2/tier3 JSONs) | REVIEW | TBD | Design call: do we keep per-tier registry files (my pattern) or fold tiers into the existing single `registry/testnet.json` + `registry/mainnet.json` (the wp2.4 pattern)? Recommendation: keep the per-tier files because they encode acceptance-tier semantics the cycle spec needs; document the relationship to `testnet.json` (per-tier files override / specialize the chain rows). |
| sw4p `fef2ad7` (`deploy_testnet.cjs` reads tier1) | REVIEW + CP partial | TBD | Depends on the §8 row above. If per-tier files survive, cherry-pick the tier1-reading code path; rebase onto master so the test/drift addition stacks correctly on the already-merged test. If per-tier files lose, drop this row entirely. |
| sw4p `fef2ad7` (`testnet_addresses.json` annotation) | DROP | , | The wp2.4 pattern's `testnet_v41_deploys.json` already records post-deploy state with more rigor (PR #218, #234). Move the pre-deploy "ready" annotation into the cycle evidence corpus instead. |
| sw4p `fef2ad7` (`deploy_script_drift.test.cjs` +21) | CP after rebase | new commit on top of master's drift test | Rebase, re-derive the +21 assertions against the master version, open as a standalone "test: extend deploy_script_drift coverage" PR. |
| sw4p `bdd1bfe` (`hardhat.config.cjs` +36 fork networks) | CP | new PR for Tier 3 mainnet-fork compat | Cherry-pick the `forkAvalancheMainnet` / `forkPolygonMainnet` network entries and the AVAX `hardforkHistory: { cancun: 0 }` row. Resolve textual overlap with PR #222, #233, #234 by rebasing onto whichever lands first (recommend: rebase onto PR #234's merge since it has the most up-to-date `TESTNETS` map). |
| sw4p `bdd1bfe` (Tier 3 fork tests + registry/tier3) | REVIEW | TBD | Reconcile against PR #233's `ZapAndBridgeV41.fork.test.cjs` AVAX extension. Recommendation: keep both as separate files because they test different surfaces (PR #233 tests Circle-SCP-attempt feasibility; mine tests mainnet-fork V4.1 deploy + control compat). Land mine as a follow-up PR after PR #233 merges. |
| sw4p `7fb34ef` (`deployed_addresses.json` add V41 block) | DROP | , | Schema collision. PR #218 / #234 own the new V4.1 ledger pattern via `testnet_v41_deploys.json`; my `deployed_addresses.json` V41 block is the wrong file. Move the addresses into the existing wp2.4 schema in a follow-up coordination commit on `wp2.4-testnet-circle-deploys`. |
| Phantom revert: `deploy_v4.ts` CCTP_V2 constants | n/a | , | Pure stale-base artifact. Resolves automatically on rebase, no action item. |
| Phantom delete: `test/cctp_v2_address_drift.test.cjs` | n/a | , | Pure stale-base artifact. Resolves automatically on rebase, no action item. |

**Rebase-first invariant:** every CP / MERGE row in this table depends on rebasing `staging/devnet-frontier-2026-05-16` onto current `origin/master` first. The rebase will surface real conflicts in `deploy_testnet.cjs` and `hardhat.config.cjs`; resolve those by adopting the master version and re-applying the cycle-specific additions on top. The CCTP V2 unification (PR #239) wins over the cycle-base version unconditionally.

## 9. Coordination plan with named action items

Because all parallel work is single-author, this section is a self-coordination plan, not a multi-party negotiation. Named items, in priority order:

| # | Action | Owner | Where it lands | Blocking? |
|---:|---|---|---|---|
| 1 | Push parent-repo cycle evidence branch (`docs/wave-g-sw4p-earn-corpus`) and open PR to parent `main`. | enoomian | parent repo PR | No , independent of sub-repo work. |
| 2 | Rebase `staging/devnet-frontier-2026-05-16` (sw4p) onto current `origin/master`. Resolve `hardhat.config.cjs` and `deploy_testnet.cjs` conflicts by adopting master + re-applying cycle additions. Drop the phantom revert to `deploy_v4.ts` and the phantom delete of `cctp_v2_address_drift.test.cjs`. | enoomian | sw4p worktree | YES , gates items 3 to 7. |
| 3 | Cherry-pick `a062f78` (Permit2 registry) onto fresh branch off rebased master. Open standalone PR. | enoomian | new sw4p PR | No , net-new, independent of other PRs. |
| 4 | Design call: per-tier registry files vs single `testnet.json`. Resolve before re-applying `0dc8ee4` and `fef2ad7`. | enoomian | decision recorded in `DEVNET_FRONTIER_EVIDENCE_2026-05-16/decisions/` | YES , gates items 5 and 6. |
| 5 | Apply tier1/tier2/tier3 registry files (if design call A) or fold into `testnet.json` (if design call B). | enoomian | new sw4p PR or amendment to PR #222/#234 | Depends on item 4. |
| 6 | Cherry-pick `bdd1bfe` Tier 3 mainnet-fork compat tests onto rebased master. Open standalone PR, sequenced after PR #234 merges so the `hardhat.config.cjs` and `deploy_testnet.cjs` deltas reconcile. | enoomian | new sw4p PR | Depends on PR #234 merging first. |
| 7 | Merge PRs #218, #233, #234 in that order. PR #218 is the dry-run inventory baseline; PR #233 is the empirical SCP attempt evidence; PR #234 is the productionised testnet deploys. Recommend mark draft -> ready in that order. | enoomian | sw4p repo | No , independent of cycle. |
| 8 | Merge PR #222 (Unichain Sepolia testnet add) before or after PR #234 , both add UNI, PR #234 is a superset; recommend close #222 in favor of #234 if PR #234 lands first. | enoomian | sw4p repo | No , single-author dedupe. |
| 9 | Open PR for `wp2.4-mainnet-wave-2026-05-17` (UNI mainnet registry + deploy_v4 fail-loud + Option-A note). Branch has 3 commits, no PR. | enoomian | new sw4p PR | No , independent. |
| 10 | Reconcile `deployed_addresses.json` V41 block (DROP from my branch) by moving the deployed-address rows into the wp2.4 schema (`testnet_v41_deploys.json` / `mainnet_v41_deploys.json`). Document the schema migration in cycle evidence. | enoomian | follow-up commit on `wp2.4-testnet-circle-deploys` and `wp2.4-mainnet-v41-deploys` | No , clean-up. |
| 11 | Add Phase H rail amendment to cycle spec (`docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` Section 4.10 post-cycle phases) per the `rail-scope-doc-audit.md` recommendation A. Includes 555 NTT and Hyperlane conditional-future placements. | enoomian | parent repo amendment, separate PR after item 1 | No , doc work; safe to parallel-track. |
| 12 | Open ecosystem-design follow-up to resolve 555 decimal contradiction (9 decimals in canonical truth vs 6 decimals in ecosystem design + Wave G plan + decimal verifier). Out of scope for this cycle but flagged by rail-scope audit. | enoomian | new ecosystem-aligned doc PR | No , independent. |

## 10. Outstanding rail work , 555 token Hyperlane + NTT

Reference: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/rail-scope-doc-audit.md` (parent commit `579e6b9a`).

### Where this lives in the doc structure today

- **Cycle spec** (`docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md`): **silent.** W1 to W8 are CCTP V2 plus Allbridge only. No phase admits Hyperlane or NTT.
- **Frontier Engine design + SOW + TRD** (`docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-*.md`): **rejected for USDC scope.** Engine treats NTT and Hyperlane as removed. Rejection is grounded in "USDC-engine-only" scope, not a general rejection.
- **Ecosystem design** (`docs/superpowers/specs/2026-05-08-rndrntwrk-network-ecosystem-design.md`): **implicit dependency on 555 NTT.** Lines 87, 131, 153 all assume an NTT manager exists for the 555 token. Decimal verifier and authority monitor (CC-14) are wired against this assumption.
- **Wave G plan** (`docs/superpowers/plans/2026-05-13-wave-g-sw4p-earn-corpus.md`): **555 NTT round-trip canary listed as a launch prerequisite for sw4p Earn Stage 2** (multiple references). Treats NTT supply invariant and NTT manager as load-bearing for the Stage 2 cutover.
- **Kit SOW** (`docs/superpowers/specs/2026-05-09-sw4p-kit-mainnet-sow.md`): **historic 555-EVM-token + NTT manager scope (A3) resolved as "remove or finish".** Engine error message `"555 token not yet deployed on {chain}: address is placeholder"` shows NTT scaffolding was always 555-shaped.

### Concrete next-phase plan name

**Phase H , 555 cross-chain rail (post-cycle phase for the devnet-frontier execution cycle)**

Add as a new Section 4.10 in the cycle spec. Three carve-outs:

1. **555 EVM token + Wormhole NTT manager deployment** , prerequisite for sw4p Earn Stage 2. Ownership: ecosystem-aligned (not the Frontier Engine repo, because engine scope is USDC-only). Inputs: 555 Solana mint `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`; canonical decimals (resolve the 9-vs-6 contradiction first); per-chain NTT peer addresses; authority Safe addresses per chain. Outputs: per-chain EVM 555 token addresses, per-chain NTT manager addresses, NTT supply invariant green for 7 days, decimal verifier green across Solana / EVM / NTT manager.

2. **Hyperlane conditional-future placement** , mirror the existing "conditional-future" vocabulary used for Chainlink CCIP at design spec line 667. No execution work; just register Hyperlane as a deferred-conditional rail with the trigger condition "Approach-B or Approach-C ever activates". Not blocked on anything in this cycle.

3. **Decimal-contradiction resolution** , a separate consistency-pass PR to reconcile the 9-decimals vs 6-decimals ambiguity across canonical truth, ecosystem design, Wave G plan, and decimal verifier. Pre-requisite for Phase H item 1 because the NTT manager constructor needs an unambiguous decimal count.

### Sequencing

```
W8 close (cycle terminal)
   |
   v
Approach A mainnet (engine reaches mainnet; cycle spec line 6 boundary)
   |
   v
Phase H.0 , decimal-contradiction PR (consistency pass; ecosystem-aligned)
   |
   v
Phase H.1 , 555 EVM token deploy per chain
   |
   v
Phase H.2 , NTT manager deploy per chain, supply invariant canary green 7d
   |
   v
sw4p Earn Stage 2 unblock (ecosystem design line 87 precondition met)
```

Hyperlane (item 2) is parallel-trackable and not blocked on this sequence.

### TRD + SOW amendments needed

- **Cycle spec** , add Section 4.10 per above.
- **Frontier Engine TRD** (`docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md`): add a one-line "out of scope: 555-token cross-chain footprint, owned by ecosystem-aligned Phase H plan" reference. Does not re-litigate the USDC-NTT rejection.
- **Frontier Engine SOW** (`docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md`): same one-line reference.
- **Kit SOW** (`docs/superpowers/specs/2026-05-09-sw4p-kit-mainnet-sow.md`): scrub the placeholder language ("555 token not yet deployed on {chain}: address is placeholder") to point at Phase H.1 once the addresses land.
- **Ecosystem design**: add a reverse cross-reference at lines 87, 131, 153 pointing at Phase H as the owning plan.
- **Wave G plan**: same; cross-reference Phase H as the upstream prerequisite.

### Owner / sequencing

Owner: ecosystem-aligned (not the Frontier Engine repo). Concretely, the parent repo `docs/superpowers/plans/` is the right home for a `2026-05-{NN}-phase-h-555-cross-chain-rail.md` plan. Sequence: write the plan now (parallel to cycle wrap-up), execute after Approach A mainnet lands, before sw4p Earn Stage 2.

---

## Verification notes

- Every PR row in §1 verified end-to-end via `gh pr view --json title,body,headRefName,baseRefName,files,commits,isDraft`. No PR was inferred from title.
- Every commit row in §4, §5 verified via `git show --stat --format='%s%n%b'` on the actual repo SHA.
- Overlap matrix verified via `comm -12` against sorted file lists produced from `gh pr diff --name-only` and `git diff --name-only`.
- The "all authors are `rndrntwrk`" finding verified via `gh pr view <num> --json author --jq '.author.login'` for every overlap-flagged PR (#218, #221, #222, #233, #234) and confirmed by the `gh pr list` JSON dump in §1. PR #143 is the only non-`rndrntwrk` author (`Sw4pIO` bot), and is policy-doc-only.
- The wp2.4-mainnet-wave-2026-05-17 branch's "no PR" status verified via `gh pr list --state open --search "head:wp2.4-mainnet-wave-2026-05-17"` returning `[]`.
- The stale-base finding verified via `git merge-base HEAD origin/master` (returns `1d243c6`) and `git log origin/master -10` showing PRs #214, #216, #239 landed after that base.

No on-chain action was taken. No PR was closed, merged, pushed, or edited. No other-team branch was modified. Read-only audit.
