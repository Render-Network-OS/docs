# PR Hygiene Triage, 2026-05-17

Read-only sweep of open PRs in `Render-Network-OS/sw4p-pro` and `Render-Network-OS/sw4p-kit`. No PR was closed, merged, commented, or converted by this pass. Orchestrator commits.

Cycle context already absorbed (do not duplicate):

- Merged this cycle: #234, #247, #239 (W1 deploys, CCTP fix, UNI registry hardening), plus #237, #240, #241, #243, #242, #246, #245, #217, #238, #235 design merges.
- Closed this cycle: #218, #221, #222 (superseded or legacy-evidence).
- Concurrent refresh-rebase in flight by another agent: PR #233. Captured as-is, no disposition recommended.
- PR #143 is authored by the `Sw4pIO` bot (policy doc). All other open PRs are `rndrntwrk`.

Data sources: `gh pr list`, `gh pr view --json ...`, `gh api repos/.../compare/...`. No CI checks are configured on any open PR in either repo (every `statusCheckRollup` is empty), so the CI column is omitted from the tables.

---

## Section 1, Per-repo summary count

### sw4p-pro

- Open total: 16
- Drafts: 3 (#233, #123, #113)
- Ready (non-draft): 13
- By recommendation:
  - READY-TO-MERGE: 6 (#224, #225, #226, #227, #228, #229)
  - NEEDS-REVIEW: 4 (#230, #231, #232, #215)
  - NEEDS-REBASE: 1 (#220)
  - WAIT-FOR-WX: 1 (#143)
  - STALE-CLOSE: 2 (#113, #123)
  - SUPERSEDED-OR-WAIT: 1 (#183)
  - HANDS-OFF (concurrent agent): 1 (#233)

### sw4p-kit

- Open total: 1
- Drafts: 1 (#5)
- Ready (non-draft): 0
- By recommendation:
  - READY-TO-MERGE (after un-draft): 1 (#5)

---

## Section 2, Full table per repo

Columns: `#`, `Title`, `State`, `Behind`, `Files`, `LastActivity`, `Recommendation`, `Justification`.

### Render-Network-OS/sw4p-pro

| # | Title | State | Behind | Files | LastActivity | Recommendation | Justification |
|---|---|---|---|---|---|---|---|
| 233 | test(contracts): empirical Circle SCP attempt on OP Sep / Polygon Amoy / Avalanche Fuji + OP+AVAX fork sims | draft | 13 | 3 | 2026-05-17 | HANDS-OFF | Refresh-rebase being driven by another agent this cycle. Recorded only. |
| 232 | fix(landing): RouteTicker fallback timer leak | ready | 0 | 1 | 2026-05-17 | NEEDS-REVIEW | One-line cleanup of setTimeout handles, base `landing/m1-t20-ticker-leds-swap-2026-05-16`. Mergeable CLEAN, awaiting reviewer. Lands after #227. |
| 231 | fix(landing): StatusLed tone reflects live state | ready | 0 | 1 | 2026-05-17 | NEEDS-REVIEW | Review fix for #225, base `landing/m1-t18-about-network-swap-2026-05-16`. Mergeable CLEAN. Lands after #225. |
| 230 | fix(landing): typed import.meta.env (no any cast) | ready | 0 | 2 | 2026-05-17 | NEEDS-REVIEW | Removes `any` cast on `import.meta.env`, base `landing/m1-t15-17-data-infra-2026-05-16`. Mergeable CLEAN. Lands after #224. |
| 229 | M1.T22 landing: CanaryProvider behind ?canary=on flag (flip deferred to ops) | ready | 0 | 2 | 2026-05-17 | READY-TO-MERGE | Final link of the M1.T15-T22 stack. Base `landing/m1-t21-resolver-swap-2026-05-16`. Mergeable CLEAN. |
| 228 | M1.T21 landing: Resolver button + auto-cycle hit /estimate | ready | 0 | 1 | 2026-05-17 | READY-TO-MERGE | Next link, base `landing/m1-t20-ticker-leds-swap-2026-05-16`. Mergeable CLEAN. |
| 227 | M1.T20 landing: swap RouteTicker + NetworkLEDs to shared canary bus | ready | 0 | 2 | 2026-05-17 | READY-TO-MERGE | Base `landing/m1-t19-trust-swap-2026-05-16`. Mergeable CLEAN. |
| 226 | M1.T19 landing: swap TrustSection Engine Health + Recent Activity | ready | 0 | 1 | 2026-05-17 | READY-TO-MERGE | Base `landing/m1-t18-about-network-swap-2026-05-16`. Mergeable CLEAN. |
| 225 | M1.T18 landing: swap About + NetworkPlaces to canary snapshot | ready | 0 | 4 | 2026-05-17 | READY-TO-MERGE | Base `landing/m1-t15-17-data-infra-2026-05-16`. Mergeable CLEAN. Has follow-up review-fix #231 pending. |
| 224 | M1.T15-17 landing: canary client + types + PollingManager + CanaryProvider | ready | 50 | 12 | 2026-05-17 | READY-TO-MERGE | First link of the stack, base `master`. 50 commits behind master but the stack chains through internal branches, so master drift does not block landing once base is `master`. Mergeable state UNKNOWN, recommend rebase-or-merge of `master` into base before squash-merge. Has follow-up #230. |
| 220 | docs: sw4p-canary design spec + implementation plan | ready | 50 | 2 | 2026-05-17 | NEEDS-REBASE | Docs-only (spec + 37-task plan, 4481 additions, 0 deletions). 50 commits behind master, mergeable UNKNOWN. Rebase onto current master and land before the M1 stack so the corpus references the spec at land time. Suggested base: `master`. |
| 215 | fix(sw4p-landing): theme-color to flat Luna #0046A4 | ready | 74 | 1 | 2026-05-17 | NEEDS-REVIEW | Trivial meta-tag fix, but 74 behind master with mergeable UNKNOWN. Rebase onto `master`, smoke-test mobile chrome tint, then merge. |
| 183 | test(contracts): lock in CCTP decoder invariants (F-006) | ready | 142 | 2 | 2026-05-14 | WAIT-FOR-WX | Hardhat test additions for `ZapAndBridgeV4`/`ZapAndBridge` decoder reverts. 142 behind master. Contract test ground has shifted significantly since this PR (V4.1, fork sims). Recommend WAIT-FOR-WX until W2 contract-test corpus consolidation; PR may need re-targeting to V4.1 decoder before landing. |
| 143 | docs(policy): land devnet verification gate policy v1 | ready | 261 | 1 | 2026-04-29 | WAIT-FOR-WX | `Sw4pIO` bot PR. Policy doc still relevant (devnet gate + canary caps + PO waiver), but mainnet-canary policy has evolved during the W0/W1 cycle. Rebase onto master and reconcile with the canary design spec (#220) and current SCP/devnet evidence before landing. |
| 123 | ops(sw4p): record Tron proof provisioning state | draft | 301 | 9 | 2026-04-29 | STALE-CLOSE | Provisioning-status memo from late April. 301 behind master, draft, last commit "fix: unblock scripts typecheck". Tron proof corridor state has been re-recorded multiple times in newer evidence drops. Supersession: subsequent ops evidence under `DEVNET_FRONTIER_EVIDENCE_2026-05-16/` and ECOSYSTEM_EXECUTION_BOARD updates. Close as STALE-CLOSE. |
| 113 | feat(sw4p): align single-api canon and complete Allbridge lifecycle | draft | 306 | 120 | 2026-04-21 | STALE-CLOSE | 7131 additions, 785 deletions, 120 files, 14 commits, draft since April 21. Mixes docs-canon alignment with a backend lifecycle change. Backend lifecycle work has been re-done across W1 merges. Doc-canon work overlaps with merged design corpus. Split-or-abandon: recommend STALE-CLOSE and re-open targeted PRs if any sub-piece still applies. |

### Render-Network-OS/sw4p-kit

| # | Title | State | Behind | Files | LastActivity | Recommendation | Justification |
|---|---|---|---|---|---|---|---|
| 5 | docs(readme): replace em dashes with colons commas and periods | draft | 0 | 1 | 2026-05-18 | READY-TO-MERGE | README scrub, 21 add / 21 del, single file, base `main`, mergeable CLEAN. Currently draft; un-draft and merge. Aligns with project hard-constraint on em-dash removal. |

---

## Section 3, Ready to land, with merge order

The M1 landing rewire is a 7-PR stack (1 base + 6 stacked) chained on internal branches. Each base branch must be merged before the PR that targets it. The intended squash-merge order is:

1. **#224**, `landing/m1-t15-17-data-infra-2026-05-16` -> `master`. Foundation: canary client + types + PollingManager + CanaryProvider. After this lands, all downstream PRs auto-retarget to `master` once each is squash-merged in sequence.
2. **#225**, T18 About + NetworkPlaces swap. Has follow-up review-fix #231 that should be merged into the base branch before squash, or landed as a follow-up commit on `master` immediately after.
3. **#226**, T19 TrustSection swap.
4. **#227**, T20 RouteTicker + NetworkLEDs swap. Has follow-up review-fix #232 (timer-leak cleanup) that should be merged into base before squash, or land immediately after.
5. **#228**, T21 Resolver swap.
6. **#229**, T22 `?canary=on` flag.

Then the in-stack review-fix PRs (`#230`, `#231`, `#232`) collapse into either their parent's squash or a follow-up cleanup commit on `master`.

Other ready-to-land outside the stack:

- **#5 (sw4p-kit)**, README em-dash scrub. Standalone, un-draft and merge any time. Aligns with the project-level no-em-dash hard constraint.

---

## Section 4, Needs rebase, with behind-master count and suggested base

| # | Repo | Behind master | Suggested base | Notes |
|---|---|---|---|---|
| 224 | sw4p-pro | 50 | `master` | Foundation of M1 stack. Rebase the base branch onto current master, retest `bun run build` and the 6 vitest cases, then squash-merge. |
| 220 | sw4p-pro | 50 | `master` | Docs-only spec + plan. Rebase, then land before the M1 stack so the corpus references the spec at land time. |
| 215 | sw4p-pro | 74 | `master` | One-line theme-color fix. Rebase, smoke-check mobile-chrome tint, then merge. |
| 183 | sw4p-pro | 142 | `master` | Contract decoder invariants. See Section 6, this PR is also WAIT-FOR-WX. Rebase only if W2 contract-test corpus decides to keep it. |
| 143 | sw4p-pro | 261 | `master` | Policy doc. See Section 6. Reconcile with #220 + current canary evidence on rebase. |

---

## Section 5, Stale-close candidates, with supersession reference

| # | Repo | Behind | Reason | Supersession reference |
|---|---|---|---|---|
| 123 | sw4p-pro | 301 | Draft Tron-proof provisioning-state memo, last touched 2026-04-29. Tron corridor state has been re-recorded multiple times since. Provisioning blocker has shifted. | `DEVNET_FRONTIER_EVIDENCE_2026-05-16/` evidence drops, ECOSYSTEM_EXECUTION_BOARD updates, and post-W0 ops memos. Re-open a fresh PR if a specific provisioning record is still required. |
| 113 | sw4p-pro | 306 | Draft single-API canon + Allbridge lifecycle bundle, 7131 additions / 120 files, last touched 2026-04-21. Backend lifecycle re-done across W1 merges. Doc-canon overlaps with merged corpus. | W1 backend merges (CCTP fix #239, UNI registry hardening #247, W1 deploys #234), plus merged design PRs #237/#240/#241/#243/#242/#246/#245. Sub-pieces, if still needed, should be re-opened as scoped PRs. |

(#218, #221, #222 are already closed per cycle context; not listed here.)

---

## Section 6, Wait-for-WX, blocked on a specific cycle wave

| # | Repo | Blocked on | Why |
|---|---|---|---|
| 183 | sw4p-pro | W2, contract-test corpus consolidation | Decoder invariant tests target the V4 codepath. V4.1 has since landed and fork-sim contract testing has expanded (see #233). PR should be re-targeted to the consolidated V4.1 decoder before landing, otherwise it locks in invariants on a deprecated codepath. |
| 143 | sw4p-pro | W2, canary policy reconciliation | `Sw4pIO` bot policy doc still relevant in shape, but the mainnet-canary surface has moved during W0/W1 (real SCP attempts, V4.1 per-chain immutable registry-canonical). Reconcile with #220 design spec and current evidence before landing so the policy reflects landed reality. |

Count blocked on W2 backend / W2 contract-test restoration: **2** (#183, #143).

(#113 also depends on backend restoration but is recommended STALE-CLOSE rather than WAIT, because its bundle scope no longer corresponds to landed backend reality.)

---

## Section 7, Per-PR notes for non-trivial decisions

### #224, M1.T15-T22 stack base

Stack-merge sequencing is non-trivial. The chain is `master` -> #224 -> #225 -> #226 -> #227 -> #228 -> #229, with review-fix PRs #230 (review-fix for #224), #231 (review-fix for #225), and #232 (review-fix for #227) hanging off the corresponding base branches. Two clean ways to land:

1. **Sequential squash:** merge #224 to master, retarget #225 to master, squash; repeat for #226 through #229. Land review-fixes either by merging into their parent's base branch before that parent's squash, or as direct follow-up commits to master after the stack lands. This is the path the PR titles assume.
2. **Single squash:** rebase the whole chain onto master at the head of #229, squash everything into one M1.T15-T22 commit, then land review-fixes (#230, #231, #232) on master as the next three commits. Lower review cost, loses per-task attribution.

Orchestrator should pick. The stack is currently 50 commits behind master at the base; either path needs a master rebase of #224 first.

### #220, sw4p-canary design spec + implementation plan

4481 additions, 0 deletions, 2 docs files (`docs/superpowers/specs/2026-05-16-real-devnet-data-and-canary-design.md`, `docs/superpowers/plans/2026-05-16-sw4p-canary-real-devnet-data.md`). Mergeable UNKNOWN, 50 behind master. Docs-only so the rebase risk is low (file-add, expected to be conflict-free). Landing this **before** the M1 stack is preferred so the corpus has the spec to reference at the moment the implementation lands.

### #233, Circle SCP empirical attempt on OP Sep / Polygon Amoy / Avalanche Fuji

Concurrent refresh-rebase in flight by another agent. 13 behind master, draft. Body confirms SCP attempts empirically succeeded at the wallet + paymaster layer on all three testnets; Uniswap v4 UR is empirically absent on all three, so V4.1 deploy is deferred and the PR falls back to anvil-fork sims on OP + AVAX mainnet. Captured here for visibility only; no disposition recommended per task scope.

### #113, single-api alignment + Allbridge lifecycle

The largest open PR (7131 additions, 785 deletions, 120 files, 14 commits). Mixes docs canon, SDK defaults, and a backend Allbridge lifecycle fix on one branch. The backend lifecycle change is the load-bearing part, and that area has been re-done in W1 backend merges. Recommend STALE-CLOSE with explicit note in the close message: any remaining sub-piece (for example a specific Allbridge watcher tweak or a specific docs page that did not land via the merged design corpus) should be re-opened as a scoped PR against current `master`.

### #143, devnet verification gate policy v1

`Sw4pIO`-authored. The class A/B/C scheme and the canary caps ($5/exec, 3 execs, canary-only key) remain useful, and the open-question section on BTC Testnet3 / Tron Nile / StarkNet Goerli is still relevant. Before landing, reconcile against #220 (which defines the canary service that operationalises the policy) and against the live SCP evidence in #233 + the closed #218/#221/#222 evidence trail. The reconciled doc should reference the canary service as the authority that enforces the policy.

---

End of triage.
