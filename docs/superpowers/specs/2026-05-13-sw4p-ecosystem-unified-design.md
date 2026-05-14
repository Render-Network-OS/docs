# sw4p Ecosystem Unified Design

**Status:** spec, partially fulfilled — the sw4p engine + kit doctrine-alignment stream is complete (see Update Log at the bottom of this document for merge SHAs).
**Date:** 2026-05-13 (original), 2026-05-14 (status update).
**Author:** brainstorming agent under user direction ("use superpowers").
**Spec format:** superpowers `brainstorming` skill terminal artifact. Companion `writing-plans` output (implementation plan) is the next deliverable after spec approval; it is **not** included in this document.

---

## Summary in one paragraph

Three parallel work streams landed in the same window without explicit cross-reference: the 30-PR sw4p-earn launch-readiness merge train (Render-Network-OS/sw4p-earn), a doctrine-alignment pass on the sw4p settlement engine and the agent-native `@sw4p/kit` SDK, and a canonical-truth + Mintlify docs alignment in the parent 555 monorepo. The public corpus does not yet mention sw4p-earn anywhere. This spec designs the minimum coherent change that pulls sw4p-earn into the RNDRNTWRK canonical corpus, reconciles five seams between the three streams, and defines the cross-repo coordination shape for the path to public launch — while preserving canonical voice and sw4p-earn technical fidelity ("doesn't betray either").

## Scope check (per writing-plans pre-flight, captured here for the next phase)

This spec covers ONE coherent change package: the public-corpus alignment plus the cross-repo coordination scaffolding. It does NOT cover:

- sw4p engine mainnet return work (owned by `Render-Network-OS/sw4p-pro`; separate spec, separate plan).
- `@sw4p/kit` slim-down + npm publish (owned by `Render-Network-OS/sw4p-kit`; existing `PLANNING_LOCAL.md` is the source of truth there; this spec only references it).
- The operator-execute Class A/B/C/D inventory in `sw4p-earn/runbooks/launch-stage0-readiness.md` (operator-driven, not engineer-driven; this spec only depends on the inventory and maps it to RNDRNTWRK phases).
- New contract changes, new audit findings, new fee allocations. Any of these surfacing during execution becomes a NEW spec.

The implementation surface for THIS spec is intentionally narrow: docs and coordination scaffolding only. That is what makes it appropriate for a single implementation plan.

---

## 1. Context

### 1.1 The three streams that converged

| Stream | Repo | State at 2026-05-13 |
|---|---|---|
| **sw4p-earn launch-readiness train** | `Render-Network-OS/sw4p-earn` | 30/30 PRs merged on main. Closure-matrix marks 13 of 14 CC-* findings closed-on-branch; CC-14 in-flight as Wave F1. Stage-0 ready; Stage-1/2/3 promotion blocked on operator items (branch protection, decimal-verifier secret, multisig rehearsal, sw4p engine mainnet, external audit). |
| **sw4p engine + kit doctrine alignment** | `Render-Network-OS/sw4p-pro`, `Render-Network-OS/sw4p-kit` | **DONE 2026-05-14** — six tracks (A1, A2/A3, A4, A5-A8, B7, C1/C2) merged after three review passes. Engine: Registry-driven chains + CCTP V2 testnet MT correction (`d98e3ee`), Hyperlane+Wormhole NTT removal + `route_security` rename (`6a38db7`), solver-auction persistence with 3-phase atomic closer (`b31f2bc`), deploy-contracts cleanup + smart_account hardening (`e93a8a3`). Kit: Streamable HTTP transport (`c9ec65f`), `sw4p-kit-init`/`sw4p-kit-doctor` CLIs (`6d30abe`). See Update Log at the bottom of this document for the full audit trail. Testnet/devnet live; mainnet paused; npm publish pending. |
| **Parent 555 monorepo canonical alignment** | (local-only monorepo at `Work/555/`) | `RNDRNTWRK_CANONICAL_TRUTH.md` 1.0 published. `docs/sw4p.mdx`, `docs/products/kit.mdx`, `docs/protocol/roadmap.mdx` updated to match engine/kit doctrine. **sw4p-earn is not mentioned in any of these files.** |

### 1.2 The problem in one sentence

The public corpus (canonical truth, Mintlify docs) recognises the sw4p engine and the `@sw4p/kit` agent surface, but does not recognise sw4p-earn at all — even though sw4p-earn is a launch-ready product surface that depends on the sw4p engine and (eventually) on the kit, and whose Stage-2 economics route through sw4p as routing-fee revenue. The user invoked "use superpowers" specifically because a previous (rushed) synthesis jumped to a written document without going through the brainstorming gate.

### 1.3 What the user said specifically

> "[Produce] a unified plan that aligns sw4p-earn with the broader ecosystem, removes redundancies, and 'doesn't betray either.'"

"Doesn't betray either" is the key constraint and is read in this spec as: do not violate canonical-truth voice and structure to fit sw4p-earn vocabulary, AND do not dilute sw4p-earn's technical specifics to fit canonical voice. The two corpuses must coexist with explicit hand-offs, not be merged into a lowest-common-denominator middle.

---

## 2. Design decisions

The following design decisions are the load-bearing claims of this spec. Each one is locked in here, and the implementation plan derives from them.

### Decision 1 — sw4p Earn is the 6th operational layer (with documented alternatives)

The canonical truth manuscript names **five operational layers**: Distribution, Participation, Proof, Settlement, Operations. sw4p-earn is a launch-ready yield product whose function — turning settled cross-chain volume into stake-bearing yield — is not subsumed by any of the five.

**Recommended:** introduce **Yield** as a new operational layer between Settlement (sw4p) and Operations (Alice). The full ordered list becomes:

1. Distribution — 555stream
2. Participation — 555 Arcade
3. Proof — VAP
4. Settlement — sw4p
5. **Yield — sw4p Earn (new)**
6. Operations — Alice

Position statement, canonical voice, written for direct paste into `RNDRNTWRK_CANONICAL_TRUTH.md` §1 and §6:

> **Yield — sw4p Earn:** the surface that turns settled cross-chain volume into stake-bearing yield. Real-fee LP rewards and locked-$555 boosts, paid from sw4p routing fees and protocol-owned liquidity. No artificial APY; every reward traceable to routed flow.

**Alternatives considered:**

| Alt | Description | Why not |
|---|---|---|
| **B. Five layers, sw4p-earn under Settlement** | Treat sw4p-earn as a sub-product of the Settlement layer ("sw4p surface: transfer + earn"). | Underplays that Earn is a structurally distinct economic function — locked $555 + LP capital + reward distribution is not settlement, even though it consumes settlement-fee revenue. A reader following the canonical voice rules ("products are evidence cited in support of the system thesis, not the thesis itself") could land on this — but the "evidence" framing implies one layer per problem solved, and Yield solves a different problem than Settlement. |
| **C. Replace "five operational layers" with "the operational layers"** | Drop the count so the system can grow without re-canonisation. | The canonical truth is opinionated about being a definition document. Removing the count weakens the assertion. If the user prefers C, the change is a 3-line edit and we can do both A and C; but A alone is the recommendation. |

This spec proceeds with **A** unless the user calls B or C in review.

### Decision 2 — Stage ↔ Phase canonical mapping

sw4p-earn uses **Stages 0–3** (Stage-0 hardening, Stage-1 testnet, Stage-2 mainnet canary, Stage-3 public). RNDRNTWRK uses **Phases 0–4** (Foundation Hardening, Ownership Layer, Economic Expansion, Platform Expansion, Protocol Evolution). They have been operating in parallel with no canonical map. The map below is the canonical one this spec installs.

| sw4p-earn Stage | RNDRNTWRK Phase | What lands |
|---|---|---|
| **Stage 0** internal hardening | Phase 0 Foundation Hardening | All 14 CC-* findings closed-on-main; operator preflight (branch protection, decimal-verifier prod secret, authority-monitor expected-values, PagerDuty wiring) done. |
| **Stage 1** testnet rehearsal | Phase 0 (still) | 7-day Base Sepolia + Solana devnet canary via `scripts/canary/*.ts`. Does NOT depend on sw4p engine mainnet returning. |
| **Stage 2** mainnet canary (low-value) | Phase 1 Ownership Layer | First real value on Base mainnet. **Hard prerequisite:** sw4p engine mainnet has returned. CC-14 authority monitor live with operator's real expected-values. NTT round-trip canary green for 7+ days. |
| **Stage 3** open registration / public launch | Phase 2 Economic Expansion | External smart-contract audit complete with no open high/critical. Public dashboard live. Reward epoch publication on schedule. Public announcement coordinated with `@sw4p/kit` npm publish AND sw4p engine mainnet stability. |

**Key claim:** Stage-1 of sw4p-earn ≠ Phase 1 of RNDRNTWRK. Stage-1 testnet rehearsal runs entirely inside Phase 0. The map shifts at Stage-2 → Phase 1.

This mapping is written for paste-and-cite into `docs/protocol/roadmap.mdx` under each Phase 0/1/2 section.

### Decision 3 — Five seams to reconcile (each is a concrete content change)

The five places where sw4p-earn and the broader RNDRNTWRK corpus risk contradiction or unnecessary repetition. Each one is a single-paragraph content change in a specific file. Not implementation work — design choices about what to write and where.

#### 3.1 Fee split — `fee-allocation-canon.md` ↔ canonical truth §7

Both encode the same numbers; tests in `services/shared/src/index.test.ts` (`allocateSw4pFee: 10/45/45 then 20/5/5/70`) confirm. The reader-facing issue is that the canonical "50/50 ecosystem ↔ platform" collapses to "100% LP-stakers" for sw4p routing fees specifically, because the LP-stakers ARE the ecosystem in that context.

**Action:** add a one-paragraph reconciliation note to `RNDRNTWRK_CANONICAL_TRUTH.md` §7 (or to `docs/sw4p.mdx` if §7 is too dense). Recommended placement: in canonical truth, since §7 is the cascade definition.

**Text (drop-in, canonical voice):**

> For sw4p routing fees specifically, the ecosystem half of the 50/50 split is allocated entirely to liquidity providers in the pools that routed the volume — they are the ecosystem participants in this context. The platform half follows the standard 20/5/5/70 allocation. The gross effect is 10/45/45 (ARP / LP-stakers / platform) plus the standard platform sub-allocation. This is a specialisation of the cascade, not a deviation from it.

No code change. `policy.ts:allocateSw4pFee` is already canonical per the test suite.

#### 3.2 Anti-wash (sw4p-earn CC-3) ↔ VAP (canonical Layer 3)

Both prove "real activity," but on different surfaces:

| | Anti-wash (sw4p-earn) | VAP |
|---|---|---|
| Protects | Routed volume rewards | Engagement / attention rewards |
| Mechanism | Pg-backed worker classifying route_events as included/excluded | Ed25519 heartbeats, state channels, on-chain settlement |
| Scope | sw4p routing flow | 555stream + Arcade participation |
| Owner repo | sw4p-earn (`services/anti-wash/`, `services/route-ledger/`) | sw4p-pro + Alice + Arcade infra |

A reader following canonical truth could conclude VAP covers all "real-activity" proofs. It doesn't. The two are complementary, not redundant.

**Action:** add a one-sentence cross-reference to `docs/sw4p.mdx` (under "Security" or "Integration Inside RNDRNTWRK").

**Text (drop-in):**

> Anti-wash enforcement on routed volume is a separate proof system from VAP for engagement; both are required for trustworthy participation-rewards economics across the network.

#### 3.3 Decimal coherence (sw4p-earn CC-4) ↔ sw4p engine USDC canon

sw4p engine asserts USDC = 6 decimals canonical (engine-internal). sw4p-earn's decimal verifier (PRs #5/#14/#15) checks `$555 = 6 decimals` canonical across Solana mint, EVM ERC-20, NTT manager, Uniswap V3 pools, staking vault, rewards distributor, dashboard literals, burn-executor constants, routing constants. The verifier reads sw4p engine's deployed token-decimal values at runtime; no shared config file.

**Action:** reciprocal one-line cross-references.

- In `sw4p-earn/runbooks/decimal-verifier-config.md`: "Decimal coherence for the sw4p engine's USDC handling is enforced inside `sw4p-pro/`; the verifier here covers `$555` decimals on every surface where mismatch could break the supply invariant."
- In `sw4p-pro/docs/ARCHITECTURE.md` (under "Security" or near the USDC handling): "Decimal coherence on the `$555` token across NTT, EVM ERC-20, pools, vaults, and dashboard is enforced upstream by `sw4p-earn/services/decimal-verifier/` against the engine's deployed token addresses."

#### 3.4 Two parallel pre-launch processes (sw4p-kit pre-publish vs sw4p-earn Stage-3)

They share:
- Same operator (Christian Chukwu, founder/architect)
- Same Safe signer set (Class B-3 in `launch-stage0-readiness.md`)
- Same brand-timing concern: no public "powered by sw4p" announcement that names yield-as-product while either side is pre-publish.

**Action:** add a "coordination" subsection to `docs/protocol/roadmap.mdx` Phase 2 (where Stage-3 lands) noting that the public launch announcement is gated on three concurrent conditions: kit published, engine mainnet stable, earn at Stage-3.

**Text (drop-in, canonical voice):**

> The public sw4p Earn announcement is gated on three concurrent conditions: `@sw4p/kit` published to npm, sw4p engine mainnet restored and stable, and sw4p Earn at Stage-3. Announcing earn-as-product while the kit is still source-install undersells the agent-native integration story; announcing while engine mainnet is paused contradicts the product surface. All three or none.

#### 3.5 Authority-monitor (sw4p-earn CC-14) ↔ sw4p engine USDC_MINT discipline

sw4p-earn CC-14 watches Solana mint authority + EVM minter + EVM owner Safe + NTT peer on the `$555` token. sw4p engine has parallel discipline for `USDC_MINT` on Solana side. Both watch for silent on-chain authority drift.

**Action:** `services/authority-monitor/` in sw4p-earn is the right home for the runtime check; sw4p engine adds `USDC_MINT` to its `EXPECTED_*` config rows and pipes alerts to the same PagerDuty surface. No new service is created; the existing one absorbs the engine-side rows.

- sw4p engine team owns adding the `USDC_MINT` row to the monitor config + writing the runbook entry under `runbooks/authority-monitor.md`.
- sw4p-earn owns the runtime service and the dashboard surface (`authorityMonitor` ProofSnapshot field).

This is a coordination decision; no code change inside this spec's scope. It belongs in the unified plan as a cross-repo dependency.

### Decision 4 — Wave G is a single docs-only PR in the parent 555 monorepo

The implementation surface for THIS spec is a single docs-only PR. The spec calls it **Wave G** to extend the existing sw4p-earn merge-train naming (Waves A–F closed PRs #1–#26+; Wave G closes the public-corpus gap).

**Wave G scope (locked):**

In the parent 555 monorepo:

1. `RNDRNTWRK_CANONICAL_TRUTH.md` — add Yield as the 6th layer in §1 ("What That Means in Practice" bullet list).
2. `RNDRNTWRK_CANONICAL_TRUTH.md` — in §6 ("System Architecture"), retitle "The Five Layers" to "The Six Layers" and insert a Layer 5 (Yield — sw4p Earn) subsection before Operations.
3. `RNDRNTWRK_CANONICAL_TRUTH.md` — insert §12.5 (sw4p Earn — The Yield Surface) between current §12 and §13. Do not renumber §13+.
4. `RNDRNTWRK_CANONICAL_TRUTH.md` — append Decision 3.1 fee-split reconciliation paragraph to §7 (before "Creator-Level Cascade").
5. `RNDRNTWRK_CANONICAL_TRUTH.md` — grep-pass: every occurrence of "five operational layers" / "five layers" / "5 layers" updates to "six".
6. `docs/sw4p.mdx` — add Decision 3.2 anti-wash ↔ VAP differentiation sentence in "Integration Inside RNDRNTWRK" or "Security."
7. `docs/sw4p.mdx` — add a "sw4p Earn" card in the "Go Deeper" CardGroup at the bottom.
8. `docs/products/earn.mdx` — NEW FILE. Mirror `docs/products/kit.mdx` shape.
9. `docs/docs.json` — wire `products/earn` into the Products nav.
10. `docs/protocol/roadmap.mdx` — add Decision 2 Stage↔Phase mapping inline under Phase 0, Phase 1, Phase 2.
11. `docs/protocol/roadmap.mdx` — append Decision 3.4 announcement-gating paragraph to Phase 2.

In sw4p-earn (cross-repo; either Wave G companion PR or follow-up):

12. `runbooks/decimal-verifier-config.md` — outbound cross-reference to sw4p engine.
13. `runbooks/sw4p-ecosystem-unified-plan.md` — add header pointing back to this spec.

In sw4p-pro (cross-repo follow-up):

14. `docs/ARCHITECTURE.md` — reciprocal decimal-verifier cross-reference.

**Wave G is explicitly NOT:**
- New contract scope.
- New audit work.
- New fee allocation policy.
- New operator process beyond what `launch-stage0-readiness.md` already enumerates.
- A re-litigation of Stage gates. The map in Decision 2 only RECORDS the existing gates against the canonical Phase taxonomy.

**Voice constraint:** every paragraph that lands in `RNDRNTWRK_CANONICAL_TRUTH.md` or in `docs/*.mdx` must match the canonical voice rules from §15 of the truth manuscript — expert, assertive, economical, definitive, infrastructure-grade. No marketing language. No exclamation marks. No "we're excited to announce."

### Decision 5 — Cross-repo coordination is a separate artifact

The five coordination items below are inputs/outputs across `sw4p-earn`, `sw4p-pro`, `sw4p-kit`, and parent 555 monorepo. They are NOT part of Wave G. They are recorded here so the next phase (implementation plan) can either spawn a coordination runbook OR fold them into the existing `runbooks/sw4p-ecosystem-unified-plan.md` (which already drafted them under the PR-#31 rushed-synthesis name).

| Coord ID | What | Blocks | Owner |
|---|---|---|---|
| C-1 | sw4p engine mainnet return | sw4p-earn Stage-2 (mainnet canary) | sw4p-pro team |
| C-2 | Multisig signer rehearsal (one ceremony, signers documented in both `sw4p-earn/docs/safe/signers.md` and `sw4p-pro/docs/safe/signers.md`) | sw4p-earn Stage-2 + sw4p engine treasury control | Treasury (signer convening) + engineering (Safe deploy + readback) |
| C-3 | Combined external smart-contract audit covering sw4p-earn + sw4p engine | sw4p-earn Stage-3 | Security reviewer + launch lead |
| C-4 | Wave G public-corpus PR (this spec's only implementation surface) | Public visibility of sw4p Earn | Docs lead (parent 555 monorepo) |
| C-5 | npm publish + public announcement triple-gate (kit, engine, earn) | First public "powered by sw4p" announcement | All three teams + comms |

C-1 (sw4p engine mainnet return) is no longer just a dependency line — the sw4p engine's forward architecture is now specified in full in the **Frontier Engine design suite** (`docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` plus its SOW and TRD). That suite's Approach A is the day-one consolidation-and-mainnet-promotion plan; C-1 here is the seam that sw4p-earn's Stage-2 economics ultimately wait on.

This table is the design hand-off for the writing-plans phase. The plan should produce ONE implementation plan for Wave G (C-4) and an OPTIONAL coordination runbook update for C-1/C-2/C-3/C-5.

### Decision 6 — Reference the prior rushed synthesis but do not adopt it as-is

`sw4p-earn/runbooks/sw4p-ecosystem-unified-plan.md` (the PR-#31 content cited by the user as the "rushed prior version") contains the right material but is shaped as a runbook (process narrative), not a spec. It also references "PR #31" in a way that ties it to the sw4p-earn repo specifically — but the canonical truth-and-docs alignment work landed in the parent 555 monorepo. The two are not the same merge target.

**This spec is the canonical design.** The existing `sw4p-ecosystem-unified-plan.md` should be either:
- (a) Left in place in sw4p-earn as a sw4p-earn-side narrative, with a "see also" cross-link added back to this spec.
- (b) Replaced by a thin sw4p-earn-side runbook that just points to this spec.

Recommendation: (a). The runbook contains sw4p-earn-side coordination detail that doesn't belong in the parent monorepo's canonical spec. Add a header line to it pointing at this spec.

---

## 3. File-by-file change manifest (design level, not task level)

This section maps each design decision to the specific files it touches. The implementation plan derives task-level steps from these; this manifest is what the plan should self-review against.

### Parent 555 monorepo — files modified by Wave G

| Path | Decision | Change |
|---|---|---|
| `RNDRNTWRK_CANONICAL_TRUTH.md` (§1) | D1 | Add Yield as 6th operational layer in the "What That Means in Practice" bullet list (after Settlement, before Operations). |
| `RNDRNTWRK_CANONICAL_TRUTH.md` (§6) | D1 | Retitle "The Five Layers" to "The Six Layers"; insert a new Layer 5 (Yield — sw4p Earn) subsection before Operations. Voice-matched to the existing layer prose. |
| `RNDRNTWRK_CANONICAL_TRUTH.md` (§12.5) | D1 | Insert new product section "§12.5 sw4p Earn — The Yield Surface" between current §12 (sw4p — The Settlement Rail) and §13 (Ads Marketplace). Mirror §9-§12 shape (Identity / What It Is / Canonical Language / Role in the System). Use §12.5 to avoid renumbering churn on §13+. |
| `RNDRNTWRK_CANONICAL_TRUTH.md` (§7) | D3.1 | Append fee-split reconciliation paragraph after the 90% → 50/50 cascade definition, before "Creator-Level Cascade." |
| `RNDRNTWRK_CANONICAL_TRUTH.md` (whole-doc grep) | D1 | Every occurrence of "five operational layers" / "five layers" / "5 layers" updates to "six". Verification in §6 enforces. |
| `docs/sw4p.mdx` | D3.2 | One-sentence anti-wash ↔ VAP differentiation in "Integration Inside RNDRNTWRK" (around AGG/Hyperlink list). |
| `docs/sw4p.mdx` | D1 | In "Go Deeper" CardGroup at the bottom, add a card for `earn`. |
| `docs/products/earn.mdx` | D4 | NEW FILE. Mirror `docs/products/kit.mdx` shape: front-matter (`title: "sw4p Earn"`, `icon`, `description`), `<Info>` status block, "Why" paragraph, Key Facts table, Modules table (Global 555 Lock, LP Vault, Matched 555 Vault, POL Vault, MM Reserve), Fee Model (10/45/45 + 20/5/5/70), Reward Model (real-fee yield + $555 incentive yield + utility boosts), Stage taxonomy table, cross-links to engine and kit. |
| `docs/docs.json` | D4 | Wire `products/earn` into Products nav alongside `products/kit`. Read schema first. |
| `docs/protocol/roadmap.mdx` (Phase 0/1/2) | D2 | Inject Stage↔Phase mapping inline under Phase 0 (covers Stage-0 + Stage-1), Phase 1 (Stage-2), Phase 2 (Stage-3). |
| `docs/protocol/roadmap.mdx` (Phase 2) | D3.4 | Append announcement-gating paragraph. |

### sw4p-earn repo — files modified (out of band; either a Wave G companion PR or filed as follow-up)

| Path | Decision | Change |
|---|---|---|
| `runbooks/decimal-verifier-config.md` | D3.3 | One-line outbound cross-reference to sw4p engine USDC decimal canon. |
| `runbooks/sw4p-ecosystem-unified-plan.md` | D6 | Add header line: "See parent 555 monorepo `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` for the canonical design. This file remains as a sw4p-earn-side narrative with cross-repo coordination detail." |

### sw4p-pro repo — files modified (out of band; cross-repo follow-up)

| Path | Decision | Change |
|---|---|---|
| `docs/ARCHITECTURE.md` | D3.3 | One-line reciprocal cross-reference to sw4p-earn decimal-verifier. |

### Things explicitly NOT changed

- `docs/products/kit.mdx` — already aligned; no change.
- `sw4p/README.md` — doctrine alignment already landed; no change.
- `sw4p-kit/README.md` — doctrine alignment already landed; no change.
- Any contract source file in either repo.
- Any service code in sw4p-earn.
- Any code path in sw4p-pro.

---

## 4. Voice and brand constraints

Every text addition must comply with `RNDRNTWRK_CANONICAL_TRUTH.md` §15 and §16:

**Voice (§15):** expert, assertive, economical, definitive, infrastructure-grade. Use the definite article ("**The** Yield surface"). State what is, not what could be.

**Vocabulary (§16):**
- "Yield" is acceptable (the new layer name) but the system should never be described as a "DeFi protocol" or "staking app." It is the **yield surface** of an economic operating system.
- "Real-fee yield" and "boosted yield" are preferred over "APY" because the cascade economics matter more than the rate.
- "Settled cross-chain volume" not "bridge volume."
- "$555 lock" not "token lock" generically.
- "Anti-wash" can be used as a noun-phrase but should always be paired with "for routed volume" on first use; never standalone.
- "sw4p Earn" written that way: lower-case `sw4p`, capital `Earn`. Matches the pattern of `sw4p` (engine) being lower-case.

**Things never written in this corpus:**
- "Yield farming" — borrowed-DeFi vocabulary, not RNDRNTWRK.
- "Stake to earn" — implies extraction, contradicts ownership-layer framing.
- "High APY" or any superlative APY claim.
- "Bridge fees" — sw4p does settlement, not bridging; the fee is a "routing fee" or "settlement fee."

---

## 5. Architecture diagram (one)

For the canonical truth §6 update, an updated layer diagram. Text-rendering, included here for review; the actual paste-in version is rendered when the implementation plan runs.

```
+-----------------------------------------------------------------------+
|                            RNDRNTWRK                                  |
|             economic operating system for human and agent media       |
+-----------------------------------------------------------------------+
                                  |
        +-------------------------+-------------------------+
        |                                                   |
+-------v-------+                                   +-------v-------+
|  Coordination |                                   |   Operations  |
|     $555      |                                   |     Alice     |
+---+-------+---+                                   +-------+-------+
    |       |                                               |
    v       v                                               v
+-------+ +----------+ +--------+ +-----------+ +-------+ +--------+
|       | |          | |        | |           | |       | |        |
| Dist. | |  Partic. | | Proof  | | Settlement| | Yield | | Oper.  |
|  555  | |   555    | |  VAP   | |   sw4p    | | sw4p  | | Alice  |
|stream | |  Arcade  | |        | |           | | Earn  | |        |
+-------+ +----------+ +--------+ +-----------+ +-------+ +--------+
                                          \         /
                                           \       /
                                       routing fees
                                       (50 bps gross,
                                        10/45/45 split)
```

(Note: Yield sits between Settlement and Operations in the layer order, but routing-fee revenue flows from Settlement upward into Yield. The diagram shows both the order in the canonical list AND the economic dependency.)

---

## 6. Testing and verification strategy

This is a docs-only design. Verification is review-based:

1. **Voice review:** every new paragraph re-read against `RNDRNTWRK_CANONICAL_TRUTH.md` §15 voice rules and §16 vocabulary. Specifically: search the diff for any of the §16 "Words to Never Use" entries.
2. **Cross-reference verification:** every URL or repo-relative link in the new content must resolve. Use a markdown link checker in CI for `docs/*.mdx` files (Mintlify already does this on build).
3. **Mintlify build:** `npm run dev` (or `mintlify dev`) under `docs/` must build clean. `docs.json` nav must include `products/earn` under the right group.
4. **Canonical truth consistency:** §1 "five operational layers" appears in multiple places in the truth manuscript. Decision 1 makes it "six operational layers." Grep-pass to ensure every occurrence updates.
5. **Stage↔Phase sanity:** the mapping in Decision 2 must agree with the existing `closure-matrix.md` and `launch-stage0-readiness.md`. No re-classification of Stage gates allowed in this PR. If a Stage gate appears mis-placed in the map, that is a bug in this spec and the spec gets revised; the gate definition does not move.

No code tests are added because no code is changed.

---

## 7. Risks and mitigations

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | Adding a 6th layer destabilises the canonical truth voice ("five operational layers" is repeated and quoted externally) | Medium | Decision 1 mitigates by providing alternatives B and C; this spec recommends A but the user can call B/C at review. The grep-pass in §6 catches every occurrence. |
| R2 | Yield language drifts into DeFi vocabulary in subsequent comms | Medium | Decision 4 voice constraints explicitly forbid "yield farming," "APY-as-headline," etc. Anyone writing follow-up copy starts from this spec. |
| R3 | Wave G PR conflicts with other in-flight docs changes in the parent 555 monorepo | Low | Parent 555 is local-only at the moment; no other docs work in flight that I'm aware of. Verify via `git log docs/` before opening the PR. |
| R4 | Cross-repo coordination items (D5) lose track because they're outside Wave G scope | High if ignored | The Wave G implementation plan should produce a coordination summary as a SECOND artifact, even though the spec keeps it out of the docs PR itself. |
| R5 | The prior rushed synthesis (`sw4p-earn/runbooks/sw4p-ecosystem-unified-plan.md`) and this spec drift over time | Medium | Decision 6 forces a cross-link from the runbook back to this spec; whoever updates one is reminded the other exists. |
| R6 | The user actually wanted a coordination runbook, not a canonical-corpus-alignment spec | Low (read of "doesn't betray either" supports this scope) | If review surfaces this, the spec stays as the design layer and a separate coordination runbook spawns. |

---

## 8. Open questions to confirm at review

The user explicitly asked for "no clarifying questions" via system-reminder, so reasonable calls have been made above. Each call below is the point where the user can override:

1. **Decision 1 alternative** — A (recommended, 6 layers), B (5 layers, earn-under-settlement), or C (drop the count). Default: A.
2. **Wave G scope inclusion of sw4p-earn-side and sw4p-pro-side cross-references (Decision 3.3)** — fold into Wave G PR (recommended) or file as cross-repo follow-up (safer if sw4p-earn or sw4p-pro merge train is closed). Default: include in Wave G.
3. **Coordination items D5** — produce a separate runbook artifact in the writing-plans phase (recommended) or fold into the existing `sw4p-earn/runbooks/sw4p-ecosystem-unified-plan.md`. Default: separate runbook.
4. **Prior rushed synthesis disposition (Decision 6)** — keep as sw4p-earn-side narrative with cross-link (recommended) or replace with a thin pointer file. Default: keep, add cross-link header.

If the user does not surface any override at review, the spec proceeds with the defaults above and the writing-plans phase implements them.

---

## 9. Non-goals

This spec deliberately does NOT:

- Re-define the canonical Stage gates (defined in `runbooks/launch-stage0-readiness.md` and `audit/closure-matrix.md`; this spec only maps them).
- Add new fee allocations (the 10/45/45 + 20/5/5/70 split is committed across `policy.ts` + tests + canon).
- Propose a Wave H or any further work. Wave G closes the public-corpus gap. After that, the next motion is operator-driven (Class A → B → C → D from `launch-stage0-readiness.md`).
- Change the brand-and-disclosure doctrine from `sw4p-kit/PLANNING_LOCAL.md` §2.7. The three-tier (Public/Internal/Private) doctrine stands and applies to the new sw4p Earn copy verbatim.
- Touch any code in any repo.
- Speak for the sw4p-pro team's mainnet return timeline. Decision 5 references the dependency but the timeline is theirs.

---

## 10. Handoff

This spec is the terminal artifact of the brainstorming skill. Per the skill's process flow:

1. **User reviews this spec.** Confirms or revises the four open questions in §8. Confirms voice/scope/format.
2. **On approval:** invoke `writing-plans` to produce the Wave G implementation plan at `docs/superpowers/plans/2026-05-13-sw4p-ecosystem-unified-plan.md` (or similar). The plan derives task-level steps from §3's file-by-file manifest, with TDD-style commit-per-step granularity.
3. **The implementation plan is OUT OF SCOPE for this spec.** It does not appear in this document.

---

## 11. References

- `RNDRNTWRK_CANONICAL_TRUTH.md` (parent local) — manuscript voice + system layers + cascade definition
- `docs/sw4p.mdx`, `docs/products/kit.mdx`, `docs/protocol/roadmap.mdx` (parent local) — Mintlify public docs
- `audit/closure-matrix.md` (sw4p-earn) — CC-1 through CC-14 status tracking
- `runbooks/pr-merge-sequence.md` (sw4p-earn) — 30-PR merge train history
- `runbooks/launch-stage0-readiness.md` (sw4p-earn) — Class A/B/C/D operator inventory
- `runbooks/sw4p-ecosystem-unified-plan.md` (sw4p-earn) — prior rushed synthesis, retained as sw4p-earn-side narrative per Decision 6
- `docs/skills/fee-allocation-canon.md` (sw4p-earn) — fee allocation canon
- `sw4p/README.md`, `sw4p/docs/ARCHITECTURE.md` (parent local) — engine framing post-doctrine-alignment
- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` (+ its `-sow.md` and `-trd.md`) — the sw4p engine's forward architecture: the Frontier Engine rebuild design suite. Approach A is the consolidation-and-mainnet-promotion plan that the C-1 coordination item (sw4p engine mainnet return) resolves into.
- `sw4p-kit/README.md`, `sw4p-kit/PLANNING_LOCAL.md` (parent local) — kit pre-publish state + brand/disclosure doctrine
- `sw4p_earn_execution_plan/SW4P_Earn_Execution_Plan_TRD_SOW_v0_1.md` (parent local) — original sw4p-earn TRD/SOW

---

*Spec author note:* the user's system-reminder explicitly waived clarifying questions for this run, so the four design choices in §8 are made as reasonable defaults rather than user-confirmed inputs. Any of them is reversible at review.

---

# Update Log

## 2026-05-14 — sw4p engine + kit doctrine-alignment stream: DONE

The middle row of the §1.1 stream-status table has flipped from "Testnet/devnet live; mainnet paused; npm publish pending" partial state to **DONE**. Six tracks merged across two repos via three independent review passes, resolving **35 confidence-≥75 hack findings** (8 CRITICAL + 26 IMPORTANT + 1 MINOR). The full per-PR audit trail (commit-by-commit with what each pass caught and fixed) is in the companion plan [`docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md`](../plans/2026-05-13-sw4p-pr-hack-fixes.md) — see its **Completion Report** section.

### Merge SHAs by track

| Track | PR | Repo | Merge SHA |
|---|---|---|---|
| A1 — Networks Registry + V1/V2 testnet MT correction | [#178](https://github.com/Render-Network-OS/sw4p-pro/pull/178) | sw4p-pro | `d98e3ee` |
| A2/A3 — Hyperlane + Wormhole NTT removal + unified Starknet gate | [#179](https://github.com/Render-Network-OS/sw4p-pro/pull/179) | sw4p-pro | `6a38db7` |
| A4 — Solver-auction persistence + 3-phase atomic closer | [#180](https://github.com/Render-Network-OS/sw4p-pro/pull/180) | sw4p-pro | `b31f2bc` |
| A5-A8 — Deploy-contracts cleanup + smart_account hardening | [#181](https://github.com/Render-Network-OS/sw4p-pro/pull/181) | sw4p-pro | `e93a8a3` |
| B7 — Streamable HTTP transport | [#1](https://github.com/Render-Network-OS/sw4p-kit/pull/1) | sw4p-kit | `c9ec65f` |
| C1/C2 — sw4p-kit-init + sw4p-kit-doctor CLIs | [#2](https://github.com/Render-Network-OS/sw4p-kit/pull/2) | sw4p-kit | `6d30abe` |

### Seams to other streams — impact

- **Seam #1 (Doctrine vocabulary)** — A2/A3's `route_security.rs` rename + Hyperlane/Wormhole NTT stripping + Starknet unified-gate doc updates honor the canonical-truth "no vendor names in public copy" rule end-to-end. The §1.1 row is now consistent with canonical truth.
- **Seam #2 (sw4p-earn → sw4p engine routing-fee revenue)** — A4's solver-auction persistence is the first piece of the auction infrastructure that sw4p-earn's Stage-2 economics route fees through. The 3-phase atomic-close design eliminates the recovery edge cases that would have created revenue desync between sw4p-earn's books and sw4p's auction DB.
- **Seam #3 (npm publish blockers)** — B7 + C1/C2 round out the kit's external surface: the streamable-HTTP entrypoint + the init/doctor CLIs are the last items blocking the `npm publish` step. The kit is now publish-ready from a code standpoint; remaining blockers are npm-tier organizational items (scope ownership, README polish, version bump) outside this spec.

### Items still NOT done (out of scope for this update, per the original spec)

- sw4p engine mainnet return (separate spec, separate PR train)
- `@sw4p/kit` slim-down + npm publish (kit-side organizational steps)
- Stage-1/2/3 promotion of sw4p-earn (operator items: branch protection, decimal-verifier secret, multisig rehearsal, external audit)
- The 30-PR sw4p-earn launch-readiness train (separate stream; closure-matrix at CC-13 of 14)
- The 555 parent-monorepo canonical-corpus alignment (separate work in `docs/sw4p.mdx`, `docs/products/kit.mdx`, etc.)

### Verifiable proof

```bash
# Engine + kit doctrine-alignment stream — all 6 merge SHAs
gh pr view 178 --repo Render-Network-OS/sw4p-pro --json state,mergeCommit,mergedAt
gh pr view 179 --repo Render-Network-OS/sw4p-pro --json state,mergeCommit,mergedAt
gh pr view 180 --repo Render-Network-OS/sw4p-pro --json state,mergeCommit,mergedAt
gh pr view 181 --repo Render-Network-OS/sw4p-pro --json state,mergeCommit,mergedAt
gh pr view 1   --repo Render-Network-OS/sw4p-kit --json state,mergeCommit,mergedAt
gh pr view 2   --repo Render-Network-OS/sw4p-kit --json state,mergeCommit,mergedAt
# Expected: all six show state=MERGED with the SHA above.
```
