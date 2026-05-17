# Rail Scope Doc Audit (Hyperlane + Wormhole NTT)

**Date:** 2026-05-17T00:00:00Z
**Purpose:** correct the cycle-scope assumption that Hyperlane and Wormhole NTT were "rejected by design". The user's actual position: "for shipping back the first batch A is fine to not have those but the broad architecture and TRD and SOW must have them in other phases".

**555 token canonical mint (Solana mainnet):** `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`

This audit reads every cycle-planning doc end-to-end and reports verbatim what each says about Hyperlane, Wormhole NTT, and the `$555` token's cross-chain footprint. Findings are then compared to the misreading they corrected. Where the docs are silent or contradictory, that is noted explicitly.

---

## 1. Frontier Engine design suite (`docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md`)

### Hyperlane references

- Line 664: "| **Hyperlane** | **REJECT, do not re-add** | , | Solves long-tail-chain reach , a non-problem for a CCTP-covered set. Its removal was correct. |"
  - Doc verdict: **REJECTED** with "When" column set to em-dash (no phase). The rejection rationale is that the Approach-A chain set is CCTP-covered, so the long-tail reach Hyperlane provides is not needed.
- Line 858: "**Re-add any rejected rail.** Wormhole NTT, Hyperlane, zkSync/Starknet, and LayerZero are rejected in §10 and stay rejected."
  - Doc verdict: **REJECTED**. Section 15 (Non-goals) explicitly forbids re-adding any of these rails, with no scoped exception for a later phase.
- Line 879: "the correct removals (Wormhole NTT, Hyperlane, zkSync/Starknet)"
  - Doc verdict: framed as a "correct removal" in the research-pass summary, not as a deferral.

### Wormhole / NTT references

- Line 663: "| **Wormhole NTT** | **REJECT, do not re-add** | , | NTT is for *project-owned tokens*, not USDC. Its removal was correct. |"
  - Doc verdict: **REJECTED**. The rationale is scope-specific: NTT is for project-owned tokens; this spec is about USDC settlement. The rejection is grounded in the engine's USDC-settlement scope, not a general "NTT is bad" claim.
- Line 858: see above. Listed alongside Hyperlane as "rejected and stay rejected".
- Line 879: see above.

### 555 token / cross-chain 555 references

- None. The Frontier Engine design spec is exclusively a USDC-settlement engine spec. The `$555` token is not in scope for this document.

### Doc verdict summary

This is a **USDC-engine-only** design spec. It rejects Hyperlane and Wormhole NTT for engine purposes. It is silent on `$555` token cross-chain deployment because that is not what the spec is about. The line about "NTT is for *project-owned tokens*, not USDC" is the most important: it implicitly acknowledges that NTT has a legitimate use case (project-owned tokens) but that use case is not this engine's job.

---

## 2. Frontier Engine SOW (`docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md`)

### Hyperlane references

- Line 524: "**Re-adding any rejected rail** , Wormhole NTT, Hyperlane, zkSync/Starknet, LayerZero are rejected in design spec §10 and stay rejected; no work package re-introduces them. Chainlink CCIP is the conditional-future pick and is not day-one."
  - Doc verdict: **REJECTED** and out-of-scope for this SOW. No work package in the SOW introduces them. Note the contrast with Chainlink CCIP, which is explicitly labelled "conditional-future pick", meaning the SOW has a vocabulary for "deferred to a later phase", and Hyperlane is **not** placed in that bucket.

### Wormhole / NTT references

- Line 524: see above.

### 555 token / cross-chain 555 references

- None.

### Doc verdict summary

The SOW inherits the design spec's rejection wholesale. It also explicitly carves out **Approach B (Circle Gateway)** and **Approach C (ERC-7683 interface)** as "scoped but deferred" in section 7 (lines 456 to 462). Neither Hyperlane nor NTT appears in B or C. The deferral mechanism exists, but Hyperlane and NTT are not parked in it.

---

## 3. Frontier Engine TRD (`docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md`)

### Hyperlane references

- Line 37: "**Re-adding any rejected rail** , Wormhole NTT, Hyperlane, zkSync/Starknet, LayerZero are rejected in design spec §10 and stay rejected; Chainlink CCIP is the conditional-future pick and is not day-one. No requirement in this TRD admits any of them."
  - Doc verdict: **REJECTED**. No requirement in any of the 113 requirements names Hyperlane.

### Wormhole / NTT references

- Line 37: see above.

### 555 token / cross-chain 555 references

- None.

### Requirements that name either rail

- Zero. No requirement number (FR-RAIL-*, FR-SOL-*, FR-EVM-*, FR-ORC-*, FR-SM-*, NFR-ATOM-*, NFR-MIG-*, NFR-OBS-*, NFR-PERF-*, NFR-SEC-*, NFR-MC-*) admits Hyperlane or Wormhole NTT. The closest is FR-RAIL-001 ("the engine uses exactly two rails for Approach A: CCTP V2 and Allbridge Core. No third rail is present.") which actively forbids them.

### Doc verdict summary

Like the SOW, the TRD inherits the design spec's rejection. The "no requirement in this TRD admits any of them" line is the strongest no-Hyperlane / no-NTT statement across the cycle docs. Note the TRD does anticipate "C will add requirement areas" (line 411: "C exposes ERC-7683 as sw4p's canonical external intent interface; the rails (CCTP V2 + Allbridge + Gateway) become the execution layer underneath. ... The requirement areas a C-TRD will add:"), so the framework for a future TRD addendum exists, but it lists Gateway in C's rail set, not Hyperlane or NTT.

---

## 4. Ecosystem unified design (`docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md`)

### Hyperlane references

- Line 34: "Hyperlane+Wormhole NTT removal + `route_security` rename (`6a38db7`)"
  - Doc verdict: records the Hyperlane removal from `sw4p-pro` as a completed track item (A2/A3), merged at commit `6a38db7`.
- Line 423: "| A2/A3 , Hyperlane + Wormhole NTT removal + unified Starknet gate | [#179](https://github.com/Render-Network-OS/sw4p-pro/pull/179) | sw4p-pro | `6a38db7` |"
  - Doc verdict: confirms PR #179 was the merge that stripped Hyperlane and Wormhole NTT plumbing from the engine.
- Line 431: "**Seam #1 (Doctrine vocabulary)** , A2/A3's `route_security.rs` rename + Hyperlane/Wormhole NTT stripping + Starknet unified-gate doc updates honor the canonical-truth 'no vendor names in public copy' rule end-to-end. The §1.1 row is now consistent with canonical truth."
  - Doc verdict: frames the Hyperlane / NTT stripping as a brand-doctrine alignment, not a temporary removal.

### Wormhole / NTT references (and `$555` token cross-chain mentions)

- Line 87: "First real value on Base mainnet. **Hard prerequisite:** sw4p engine mainnet has returned. CC-14 authority monitor live with operator's real expected-values. NTT round-trip canary green for 7+ days."
  - Doc verdict: **`NTT` here is the `$555` token's NTT footprint, not the engine's NTT rail.** Stage-2 (mainnet canary for sw4p Earn) gates on the `$555` NTT round-trip being healthy for 7+ days. This is a sw4p-earn dependency, not a sw4p engine deliverable.
- Line 131: "sw4p engine asserts USDC = 6 decimals canonical (engine-internal). sw4p-earn's decimal verifier (PRs #5/#14/#15) checks `$555 = 6 decimals` canonical across Solana mint, EVM ERC-20, NTT manager, Uniswap V3 pools, staking vault, rewards distributor, dashboard literals, burn-executor constants, routing constants. The verifier reads sw4p engine's deployed token-decimal values at runtime; no shared config file."
  - Doc verdict: explicit. `$555` is deployed on Solana mint, EVM ERC-20, and an NTT manager. The decimal-coherence check covers all three. This **assumes a `$555` NTT manager exists**, but the design spec does not say who deploys it.
- Line 136: "In `sw4p-pro/docs/ARCHITECTURE.md` (under 'Security' or near the USDC handling): 'Decimal coherence on the `$555` token across NTT, EVM ERC-20, pools, vaults, and dashboard is enforced upstream by `sw4p-earn/services/decimal-verifier/` against the engine's deployed token addresses.'"
  - Doc verdict: explicitly names the engine repo (`sw4p-pro`) as the document home for the `$555`-NTT decimal-coherence note, even though the design spec itself does not deploy `$555` NTT. The seam is acknowledged.
- Line 153: "sw4p-earn CC-14 watches Solana mint authority + EVM minter + EVM owner Safe + NTT peer on the `$555` token. sw4p engine has parallel discipline for `USDC_MINT` on Solana side. Both watch for silent on-chain authority drift."
  - Doc verdict: another explicit `$555` NTT peer reference. The authority monitor watches an NTT peer on the `$555` token. This means **the docs already assume a `$555` Wormhole NTT deployment exists** at the time sw4p-earn reaches mainnet canary.

### Phase placement

- The ecosystem design's Decision 2 stage-to-phase map (lines 83 to 90) puts the `$555` NTT round-trip canary at sw4p-earn **Stage 2** (mainnet canary), which maps to RNDRNTWRK **Phase 1 Ownership Layer**. This is **explicitly post-Approach-A** because Stage 2 has a hard prerequisite of "sw4p engine mainnet has returned" (which is the terminal of Approach A).

### Doc verdict summary

This is the **only cycle doc that mentions a `$555` Wormhole NTT deployment**, and it does so consistently in three places (decimal coherence, doc cross-reference, authority monitor). It places the dependency at sw4p-earn Stage 2 / RNDRNTWRK Phase 1. The doc **does not say who owns the `$555` NTT deployment** or which repo houses it. It only says (a) it exists, (b) the decimal verifier and authority monitor watch it, and (c) the verifier reads engine-deployed token addresses.

This is the load-bearing finding for the user's claim. The Hyperlane / NTT "rejection" in the Frontier Engine spec is about the USDC-settlement engine. The `$555` NTT manager is a token-side deployment that the ecosystem design treats as an existing prerequisite for Stage 2.

---

## 5. Cycle spec (2026-05-16, the doc I authored: `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md`)

### Hyperlane references

- None. The cycle spec is silent on Hyperlane.

### Wormhole / NTT references

- None. The cycle spec is silent on Wormhole NTT.

### 555 token / cross-chain 555 references

- None. The cycle spec contains no reference to the `$555` token at all.

### Doc verdict summary

The cycle spec **never mentions Hyperlane, Wormhole NTT, or the `$555` token**. Its rail scope is inherited entirely from the Frontier Engine suite: W1 covers CCTP V2 (Tier 1/2/3), W2 covers Allbridge consolidation. There is no W-anything for `$555` token cross-chain deployment, and there is no "future phases" section that names Hyperlane or NTT.

**This is the gap.** The cycle spec faithfully reflects the Frontier Engine design (which rejects both rails), but it does not reflect the ecosystem design (which assumes a `$555` NTT deployment is in flight for Stage 2). The cycle spec's non-goals section (lines 13 to 18) explicitly excludes "audit material generation" but does not name the `$555` NTT or Hyperlane deferrals.

---

## 6. Approach-A plan (`docs/superpowers/plans/2026-05-15-sw4p-frontier-engine-approach-a.md`)

### Hyperlane references

- Line 746: "The canonical enum must include only Approach-A rails: `CctpV2` and `AllbridgeCore`. Gateway and ERC-7683 are not enum variants for Approach A."
  - Doc verdict: the BridgeProtocol enum is locked to two rails. Hyperlane and NTT are not enum variants, in line with the design spec's rejection.
- Line 764: "Red check: `cargo test frontier_approach_a_excludes_deferred_bitcoin_adapter -- --nocapture` failed before implementation because `BridgeProtocol::Bitcoin` was still eligible."
  - Doc verdict: notes one rail (Bitcoin) was treated as "deferred" rather than rejected, but Hyperlane and NTT remain rejected. There is no equivalent `excludes_deferred_hyperlane` test.
- Line 1269 to 1276 (the consistency grep): "rg -n 'Gateway|ERC-7683 runtime|ZapNative deletion gate: BLOCKED|TO[D]O|T[D]D' ..." with expected output "`Gateway` appears only as Approach B / deferred language. ERC-7683 runtime language appears only as Approach C / deferred language."
  - Doc verdict: the plan's consistency grep validates that Gateway and ERC-7683 are deferred and Hyperlane / NTT have been excised. **It does not validate that Hyperlane or NTT have a future-phase placement.** The grep is one-directional: "make sure they are not in A" with no "make sure they are in B or C" twin.

### Wormhole / NTT references

- Same lines as above. NTT is not in the rail enum and not in any test. There is no "deferred-NTT-for-555-token" task in the plan.

### 555 token / cross-chain 555 references

- None. The Approach-A plan is also USDC-engine-only.

### Doc verdict summary

The Approach-A plan inherits the design spec's rejection verbatim. It does not contemplate any future phase that adds Hyperlane or NTT. The plan's "deferred" vocabulary covers only Bitcoin (mentioned once as an enum variant to exclude), Circle Gateway (Approach B), and ERC-7683 runtime ingestion (Approach C).

---

## 7. Kit PLANNING_LOCAL (`sw4p-kit/PLANNING_LOCAL.md`)

### Hyperlane references

- Line 42: "Hyperlane: **calldata builder only**. Never submits. `derive_message_id()` uses `DefaultHasher`, not keccak256. Effectively not a live rail despite being routed in docs."
  - Doc verdict: documents the pre-removal state. Hyperlane was a calldata stub.
- Line 64, line 65: P2 / P3 protocol bugs about Hyperlane's `derive_message_id` and `dispatch_message`.
- Line 130: "Hyperlane is calldata only (not live), Wormhole NTT is non-functional"
- Line 403: "Allbridge: 0      |   Hyperlane: 0     |   Wormhole NTT: 0" (the Track-D vendor-name grep showing public copy has been scrubbed)
- Line 415: D3 deliverable strips Hyperlane plus Wormhole NTT from public copy
- Line 441: "A2 | Decide Hyperlane scope | `hyperlane.rs`, router | Either remove the routes entirely OR replace `DefaultHasher` with `keccak256` AND actually submit transactions via Circle WaaS for EVM origins. **Fixes P2, P3.** Acceptance: a real Hyperlane testnet message reaches the dispatcher and shows up on the Hyperlane explorer. If unwilling to invest, remove routes + docs."
  - Doc verdict: A2 originally framed Hyperlane as a **decision point** (finish it or remove it), not a rejection. The Frontier Engine design spec (later, 2026-05-14) escalated the decision to "remove and stay rejected".
- Line 458: "Track A is the kit-side view of the protocol-hardening work. The authoritative, full-depth plan for the sw4p engine , the canonical-contract-set consolidation, the engine-wide atomicity discipline, the rail strategy, the rejected-rail decisions (Hyperlane, Wormhole NTT), the sunset ordering, devnet→mainnet , is the Frontier Engine design suite ... Several Track A items are already settled there at design depth: A1 (the per-chain registry), **A2/A3 (Hyperlane and NTT are *rejected*, not 'decided' , design-suite §10)** ..."
  - Doc verdict: this is the kit SOW's own acknowledgement that the Frontier Engine spec **overrode** the original A2 / A3 "decide" framing with "reject". The kit SOW now defers to the Frontier Engine design suite as source of truth.
- Line 547: "├── A2 Hyperlane decide      ──► (independent)"
- Line 548: "├── A3 Wormhole NTT decide   ──► (independent)"
- Line 615: "| A , Protocol hardening + mainnet (CCTP V2 only, Hyperlane/NTT removed) | 4 weeks | 4 |"
- Line 616: "| A , Protocol with Hyperlane finished and NTT removed | 5,6 weeks | 5,6 |"
  - Doc verdict: the kit SOW's cost analysis contemplated both branches (remove vs finish Hyperlane). The Frontier Engine spec chose remove.
- Line 664: "R2 | Hyperlane / Wormhole NTT decisions stall everything | Medium | Force a call on day 1 of Track A. Default to 'remove' if no clear product case."
- Line 669: "R7 | Public docs claim things the code doesn't do (Hyperlane, NTT, '5 audits') | High right now"
- Line 676: "1. **Hyperlane scope decision** (A2). Finish it or remove it."
- Line 677: "2. **Wormhole NTT scope decision** (A3). 555-EVM-token + NTT deploy, or remove."
  - Doc verdict: **line 677 is the most explicit positive framing of a possible `$555` NTT deployment in any cycle doc.** It says: "555-EVM-token + NTT deploy, or remove". This is consistent with the ecosystem-design assumption that an NTT manager exists for the `$555` token.

### Wormhole / NTT references

- Line 43: "Wormhole NTT: **completely non-functional**. Every contract address is `\"\"`. Every handler returns `Err(\"555 token not yet deployed on {chain}: address is placeholder\")`."
  - Doc verdict: the kit SOW captures the original error message verbatim. The error says **`555 token not yet deployed on {chain}: address is placeholder`**, which means the engine had a `wormhole_ntt.rs` stub specifically targeting a future `$555` EVM deployment, not USDC NTT. The engine's NTT scaffolding was always 555-token-shaped.
- Line 66: "P4 | Wormhole NTT: all contract addresses are `\"\"` | `sw4p-backend/src/wormhole_ntt.rs` | Every NTT call returns explicit error; docs claim live"
- Line 130: see above.
- Line 442: "A3 | Decide Wormhole NTT scope | `wormhole_ntt.rs`, router | Either deploy a 555 EVM token (cross-chain via NTT manager) and fill addresses, OR remove the routes + docs. **Fixes P4.**"
  - Doc verdict: A3 is the canonical "this is what NTT was actually for in the sw4p codebase" statement. NTT in `sw4p-pro` was scaffolding for a future `$555` EVM token deployed via an NTT manager. The Frontier Engine spec rejected this without explicitly addressing whether the `$555`-EVM token gets deployed by a separate effort.
- Line 677: see above.
- Line 691: "`sw4p` protocol repo: bug fixes (10 specific items), Hyperlane / Wormhole decisions executed, mainnet canary script, network discriminator. No structural changes , the existing architecture is sound."

### 555 token / cross-chain 555 references

- Line 43, line 442, line 677: see above. The kit SOW is the only doc that **explicitly** ties Wormhole NTT scaffolding in `sw4p-pro` to the `$555` token's cross-chain EVM footprint.

### Doc verdict summary

The kit SOW captures the **original framing** before the Frontier Engine spec collapsed the decision to "reject". Under the kit SOW, Hyperlane and NTT were **decisions** (finish or remove), and NTT was specifically scaffolding for a future `$555` EVM-token + NTT-manager deployment. The Frontier Engine design spec later removed both rails from the engine without saying what happens to the `$555` cross-chain footprint.

---

## 8. Canonical truth doc (`RNDRNTWRK_CANONICAL_TRUTH.md`)

### Hyperlane references

- None.

### Wormhole / NTT references

- None.

### 555 token / cross-chain 555 references

- Line 233: "The surface that turns settled cross-chain volume into stake-bearing yield. sw4p Earn pays liquidity providers and locked-$555 holders from sw4p routing fees and protocol-owned liquidity , real-fee yield first, with a separately labelled $555 incentive overlay."
- Line 245 to 254: the "Coordination: $555" framing. Solana SPL token, 1B supply fixed at 9 decimals (note: the ecosystem-design and Wave G plan say `$555` is **6 decimals canonical**; canonical truth line 543 says **9 decimals**. This is a contradiction. See §10.)
- Line 282: "20% → Buyback-and-burn , structural demand creation for $555"
- Line 489: "Separately labelled $555 incentive yield overlay"
- Line 490: "Modules: Global $555 Lock (lock-and-boost on the coordination token), LP Vault (pool liquidity earning routing fees), Matched $555 Vault (paired stake against real LP positions), Protocol-Owned Liquidity (POL) Vault, MM Reserve"
- Line 542: "**Contract:** CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2"
- Line 543: "**Supply:** 1,000,000,000 (fixed, 9 decimals)"
- Line 545: "**Status:** Live, actively traded"
- Line 947: "| Token contract | CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2 |"

### Doc verdict summary

The canonical truth manuscript names `$555` as a Solana SPL token. It says nothing about an EVM deployment, an NTT manager, or any cross-chain footprint. The vendor-name doctrine (Section 16 implicitly via the Track-D grep that scrubs Wormhole / Hyperlane from public copy) actively forbids naming Wormhole or Hyperlane in any public surface. **However**, the canonical truth says `$555` is **9 decimals**, while every other cycle doc says `$555` is **6 decimals canonical**. This is a real contradiction that the rest of the corpus does not flag.

---

## 9. Other `docs/superpowers/` matches

From the recursive grep at audit start (`grep -rnEi "hyperlane|wormhole|ntt|warp.route|mailbox|interchain.security" docs/superpowers/`):

- `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md`: lines 265, 288, 653, 655, 699, 706, 751, 930, 965, 1032, 1100, 1103, 1206, 1216, 1306, 1335, 1395. All references treat **NTT** as part of the `$555` token's deployment surface (decimal verifier, supply invariant, round-trip canary, authority monitor). The Wave G plan **enforces a "no vendor name in public copy" rule** that explicitly bans the brand "Wormhole NTT" but **keeps lowercase `NTT` as a technical reference to a supply discipline**. Line 1103: "lowercase 'ntt' and the phrase 'NTT round-trip canary' / 'NTT supply invariant' are technical references to a supply discipline, not vendor attributions , they remain. The forbidden form is the vendor branding 'Wormhole NTT'."
- `docs/superpowers/plans/2026-05-11-landing-kit-overview-sections.md` lines 257, 322: "Hyperlane Warp Routes 2.0 + Wormhole NTT corridors" appears in landing-kit overview prose. This is **older landing-kit copy** that pre-dates the Track-D scrub.
- `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` lines 45, 544, 555, 562, 568, 694, 701, 703, 708, 1279, 1315, 1347, 1348, 1350: catalogues the `route_security.rs` rename and the wholesale Hyperlane / Wormhole NTT removal PR #179 (`bedf6fc` / `9668819` / `6a38db7`).
- `docs/superpowers/submission-internal/demo/recording-script.md` line 129: "CCTP V2 , Kora , Jupiter , Hyperlane , Wormhole , Allbridge" appears in a demo recording script. **This is internal submission copy from a hackathon era, not a forward design doc.**

The wave-g plan is the most important "other" source. It treats `$555` NTT deployment, NTT supply invariant, and NTT round-trip canary as **launch prerequisites for sw4p Earn Stage 2**.

---

## Verdict: where Hyperlane should live

**Doc-grounded answer: Hyperlane has no scheduled phase in any cycle doc.** Every doc that names it places it in the "rejected, stay rejected" bucket. The Frontier Engine design spec line 664 says the rejection rationale is that Approach A's chain set is CCTP-covered, so Hyperlane's long-tail-chain reach is "a non-problem". The SOW line 524, the TRD line 37, the design spec line 858 all repeat the same verdict.

The only positive framing of Hyperlane was in the **kit SOW line 676** ("Hyperlane scope decision (A2). Finish it or remove it.") and that decision was resolved as **remove** when the Frontier Engine suite was written. The kit SOW now defers to the Frontier Engine suite (line 458) and does not contradict the rejection.

If the user wants Hyperlane in a future phase, **no existing doc supports that placement.** The closest deferral vocabulary already in the docs is "conditional future" (used for Chainlink CCIP at design spec line 667). That is where a future Hyperlane phase would belong if it were re-introduced. Alternatively, the design spec's Approach B and Approach C buckets are explicit, scoped, deferred phases, but neither names Hyperlane.

## Verdict: where Wormhole NTT for `$555` should live

**Doc-grounded answer: split the question.** The engine-level Wormhole NTT for USDC settlement is rejected (design spec line 663). But the **`$555`-token Wormhole NTT deployment is implicit in every ecosystem-aligned cycle doc**:

- Ecosystem design line 87: Stage 2 prerequisite of "NTT round-trip canary green for 7+ days"
- Ecosystem design line 131: decimal verifier covers `$555` decimals "across Solana mint, EVM ERC-20, NTT manager"
- Ecosystem design line 153: CC-14 authority monitor watches "NTT peer on the `$555` token"
- Wave G plan, repeated: NTT supply invariant, NTT round-trip canary, NTT manager are launch prerequisites
- Kit SOW line 442: original A3 framing was "deploy a 555 EVM token (cross-chain via NTT manager)"
- Kit SOW line 43: engine error message `"555 token not yet deployed on {chain}: address is placeholder"` shows NTT scaffolding in `sw4p-pro` was always `$555`-shaped

**Phase placement (from the docs):** the `$555` NTT deployment is a **prerequisite for sw4p Earn Stage 2**, which the ecosystem design maps to **RNDRNTWRK Phase 1 Ownership Layer** (ecosystem design line 87). Stage 2 itself requires "sw4p engine mainnet has returned", which is the terminal of Approach A (design spec line 840, SOW line 446). So in temporal order: Approach A mainnet, then `$555` NTT canary 7+ days, then sw4p Earn Stage 2.

**Ownership ambiguity:** no doc explicitly says which repo owns the `$555` NTT deployment. The engine repo (`sw4p-pro`) had the original scaffolding (`wormhole_ntt.rs`, since stripped). The earn repo (`sw4p-earn`) owns the decimal verifier and the authority monitor that read it. No standalone "555 token cross-chain deployment" plan exists in the cycle docs.

## Verdict: what was correctly excluded from Wave W1 specifically

W1 (cycle spec lines 172 to 206) is explicitly **canonical EVM, 3-tier coverage, CCTP V2 only**. Tier 1 testnet acceptance plus Tier 2 CCTP-only protocol proof plus Tier 3 mainnet-fork compatibility. The wave **inherits** the Frontier Engine Phase 2 (WS2) scope which is canonical-EVM-only.

Cycle spec line 174: "Frontier Engine Phase 2 (WS2). Adds the safety-control surface modeled in `sw4p-native` to V4-derived canonical EVM contracts. Limits canonical-V4.1 deploy acceptance to chains with real official Circle CCTP V2 plus official Uniswap Universal Router testnet overlap. Honest labeling of evidence everywhere."

No Hyperlane, no NTT, no `$555` token deployment belongs in W1. That is correct. The cycle spec's W2 (rail consolidation) is also correctly bounded: CCTP V2 plus Allbridge, no third rail (cycle spec line 209 to 240).

## Concrete recommendation for next step

Three options. Pick **A** with reasoning.

### A. Cycle spec amendment to add explicit phases for Hyperlane + NTT (after W1, before mainnet)

**Recommended.** Add a new section to the cycle spec (`docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md`) that explicitly carves the `$555` NTT deployment and any future Hyperlane consideration into post-W8 phases. Specifically:

- Add a "Section 4.10: Post-cycle phases" subsection naming three carve-outs:
  - `$555` NTT deployment + decimal verifier wiring (ecosystem-aligned prerequisite for sw4p Earn Stage 2; doc-grounded in ecosystem design lines 131, 153 and Wave G plan)
  - Hyperlane "conditional future" placement (mirrors Chainlink CCIP's existing conditional-future vocabulary at design spec line 667)
  - Note that neither belongs in this cycle's W1 through W8
- Update the cycle spec's Section 1 non-goals to explicitly say "the `$555` cross-chain footprint and the conditional-future Hyperlane rail are post-cycle work; named here, not executed here"
- Cross-reference the ecosystem design and Wave G plan as the authoritative homes for the `$555` NTT scope

**Why A wins over B and C:** the user said "broad architecture and TRD and SOW must have them in other phases". The cycle spec is where the wave-by-wave map lives. Adding an explicit post-cycle phase to the cycle spec is the smallest faithful edit that matches the user's instruction. It does not re-litigate the Frontier Engine rejection of USDC-NTT; it acknowledges the `$555`-NTT seam that the ecosystem design already encoded and that the cycle spec missed.

### B. Spin out a separate plan + execution for Hyperlane + NTT (parallel to current cycle)

Possible but premature. The `$555` NTT deployment depends on sw4p engine mainnet (Approach A terminal), which this cycle does not reach (cycle is devnet-only by design, line 6). A separate plan would have to wait on a future cycle anyway. The cycle spec amendment captures the dependency without requiring a parallel plan now.

### C. Update the Approach-A plan or Frontier Engine SOW to make the placements explicit if they were ambiguous

Not appropriate. The Frontier Engine suite is clear and consistent: USDC-NTT is rejected, Hyperlane is rejected. Those rejections are about the engine's USDC scope. Adding `$555` NTT to the Frontier Engine SOW would conflict with its scope boundary (USDC-engine-only, design spec line 12). The `$555` NTT belongs in an ecosystem-aligned doc (the cycle spec or a dedicated post-cycle plan), not in the engine suite.

---

## Quotes against my misreading

The misreading I corrected was treating Hyperlane and Wormhole NTT as "architecturally rejected" with no future-phase placement. The actual cycle-doc evidence:

**Where the rejection language is unambiguous (USDC-engine scope):**

- Frontier Engine design spec line 663: "**Wormhole NTT** | **REJECT, do not re-add** | , | NTT is for *project-owned tokens*, not USDC. Its removal was correct."
- Frontier Engine design spec line 664: "**Hyperlane** | **REJECT, do not re-add** | , | Solves long-tail-chain reach , a non-problem for a CCTP-covered set. Its removal was correct."
- Frontier Engine SOW line 524: "Wormhole NTT, Hyperlane, zkSync/Starknet, LayerZero are rejected in design spec §10 and stay rejected; no work package re-introduces them."
- Frontier Engine TRD line 37: "No requirement in this TRD admits any of them."

**Where the deferral language is implicit but real (`$555` token scope):**

- Ecosystem design line 87: "NTT round-trip canary green for 7+ days." (precondition for sw4p Earn Stage 2)
- Ecosystem design line 131: "`$555 = 6 decimals` canonical across Solana mint, EVM ERC-20, NTT manager"
- Ecosystem design line 153: "sw4p-earn CC-14 watches Solana mint authority + EVM minter + EVM owner Safe + NTT peer on the `$555` token"
- Kit SOW line 43: engine error message `"555 token not yet deployed on {chain}: address is placeholder"`
- Kit SOW line 442: A3's original framing was "Either deploy a 555 EVM token (cross-chain via NTT manager) and fill addresses, OR remove the routes + docs"
- Kit SOW line 677: "**Wormhole NTT scope decision** (A3). 555-EVM-token + NTT deploy, or remove."
- Wave G plan line 1103 (rule): "lowercase 'ntt' and the phrase 'NTT round-trip canary' / 'NTT supply invariant' are technical references to a supply discipline, not vendor attributions , they remain. The forbidden form is the vendor branding 'Wormhole NTT'."

**The gap, stated precisely:** the Frontier Engine suite rejects Wormhole NTT *for the USDC settlement engine*. The ecosystem design and the Wave G plan assume a Wormhole NTT manager exists *for the `$555` token*. No cycle doc reconciles these two scopes. The cycle spec I authored is silent on both, which is the load-bearing miss.

The corrective edit is to add a Section 4.10 post-cycle phases note to the cycle spec, explicitly placing the `$555` NTT deployment as a post-Approach-A, pre-sw4p-Earn-Stage-2 prerequisite, owned by an ecosystem-aligned plan rather than by the Frontier Engine suite, and explicitly naming Hyperlane as conditional-future per the Chainlink CCIP vocabulary at design spec line 667.

---

## Doc accuracy concerns surfaced during this audit

1. **`$555` decimal contradiction.** Canonical truth (line 543) says **9 decimals**. Ecosystem design (line 131) and Wave G plan (multiple) say **`$555 = 6 decimals` canonical**. The decimal verifier is built to enforce 6. This is a real contradiction. **It is not in scope for this audit to fix**, but it should be flagged in a separate consistency pass.

2. **`$555` cross-chain ownership ambiguity.** No doc explicitly names the repo or team that owns the `$555` EVM token + NTT manager deployment. The engine repo had scaffolding; the earn repo monitors it. A standalone owner is unstated.

3. **The cycle spec I authored mirrored only the Frontier Engine suite's USDC scope.** It missed the ecosystem design's `$555`-NTT assumption entirely. The corrective edit (recommendation A) addresses this.

4. **The landing-kit overview plan (`docs/superpowers/plans/2026-05-11-landing-kit-overview-sections.md`) still mentions "Hyperlane Warp Routes 2.0 + Wormhole NTT corridors" in public-facing prose at lines 257 and 322.** This contradicts the Track-D vendor-name scrub that finished 2026-05-12 (kit SOW line 399 to 408). The landing-kit plan dates 2026-05-11, one day before Track D completed, so the contradiction is a stale artifact. **Out of scope for this audit but worth a follow-up scrub.**
