# Wave G — sw4p Earn Public-Corpus Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pull sw4p Earn into the RNDRNTWRK canonical corpus as a recognized product surface (the "Yield" layer), reconcile five seams between the parallel work streams (sw4p engine, `@sw4p/kit`, sw4p-earn), and add the cross-repo coordination cross-links — all docs-only, no code changes.

**Architecture:** Wave G is a docs-only change set that lands across three repos. The bulk of work (11 of 14 file changes) is in the parent 555 monorepo and modifies `RNDRNTWRK_CANONICAL_TRUTH.md`, four Mintlify pages under `docs/`, and `docs/docs.json` for nav wiring. Two changes update the `sw4p-earn` repo (cross-link headers in two runbooks). One change updates the `sw4p` engine repo's `docs/ARCHITECTURE.md`. Each task is grep-driven: the "failing test" is the current corpus deficit (a `grep` that returns 0 hits or returns text marked obsolete by the spec); the "passing test" is the same `grep` after the edit, confirming the deficit closed.

**Tech Stack:** Markdown, MDX, Mintlify v3 (docs.rndrntwrk.com), JSON (Mintlify nav schema). No code, no tests added. Verification = grep + Mintlify build + visual review against §15-§16 voice rules.

---

## Scope Check

This plan covers ONE coherent change package: public-corpus alignment for sw4p Earn plus the three cross-repo cross-link headers. The plan derives from the approved spec at `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` (committed at `ac6dc71f` on parent main).

Out of scope for this plan (tracked separately):
- sw4p engine mainnet return work (`sw4p` repo; separate plan).
- `@sw4p/kit` slim-down + npm publish (`sw4p-kit` repo; existing plan).
- Operator-execute Class A/B/C/D/E items in `sw4p-earn/runbooks/launch-stage0-readiness.md`.
- Any contract, audit, or fee-allocation change.
- The Wave G companion coordination runbook for items C-1/C-2/C-3/C-5 (spawn after Wave G lands if needed).

---

## File Structure

### Parent 555 monorepo (11 files modified, 1 new)

| Path | Responsibility |
|---|---|
| `RNDRNTWRK_CANONICAL_TRUTH.md` | Add Yield as the 6th operational layer (§1 bullet list); retitle §6 "Five Layers"→"Six Layers" and insert a Layer 5 (Yield — sw4p Earn) subsection before Operations; insert new §12.5 (sw4p Earn — The Yield Surface) between §12 and §13; append fee-split reconciliation paragraph to §7; grep-pass every "five operational layers" / "five layers" / "5 layers" to "six". |
| `docs/sw4p.mdx` | Add anti-wash ↔ VAP differentiation sentence in "Integration Inside RNDRNTWRK"; add a "sw4p Earn" card in the "Go Deeper" CardGroup. |
| `docs/products/earn.mdx` | NEW FILE. Mirrors `docs/products/kit.mdx` shape. Yield-surface product page. |
| `docs/docs.json` | Wire `products/earn` into the Products → Core Products nav group alongside `products/kit`. |
| `docs/protocol/roadmap.mdx` | Inject Stage↔Phase mapping inline under Phase 0 (Stages 0+1), Phase 1 (Stage 2), Phase 2 (Stage 3); append announcement-gating paragraph to Phase 2. |

### sw4p-earn repo (2 files modified)

| Path | Responsibility |
|---|---|
| `runbooks/sw4p-ecosystem-unified-plan.md` | Add cross-link header pointing to the parent monorepo spec, declaring it the canonical design and this file the sw4p-earn-side narrative. |
| `runbooks/decimal-verifier-config.md` | Add outbound cross-reference: sw4p engine USDC decimal canon is enforced inside `sw4p-pro/`; this verifier covers `$555` decimals. |

### sw4p (engine) repo (1 file modified)

| Path | Responsibility |
|---|---|
| `docs/ARCHITECTURE.md` | Add reciprocal cross-reference: `$555` decimal coherence is enforced upstream by `sw4p-earn/services/decimal-verifier/`. |

---

## Working-directory conventions

Three working trees are referenced. Each task names the one it uses.

| Repo | Absolute path |
|---|---|
| Parent 555 monorepo | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555` |
| sw4p-earn worktree (chore/ecosystem-unified-plan branch) | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58` |
| sw4p (engine) repo | `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p` |

All `cd` commands below use absolute paths. The Wave G work in the parent monorepo lands on a single feature branch (`docs/wave-g-sw4p-earn-corpus`) so the docs site only rebuilds once; sw4p-earn and sw4p changes are separate branches in their own repos.

---

## Phase 0: Parent monorepo branch setup

### Task 0.1: Create the Wave G feature branch in the parent monorepo

**Files:** none yet.

- [ ] **Step 1: Confirm parent monorepo working state is clean**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git status
```

Expected: working tree clean on `main` (or current docs branch); no uncommitted changes in `RNDRNTWRK_CANONICAL_TRUTH.md`, `docs/sw4p.mdx`, `docs/protocol/roadmap.mdx`, or `docs/docs.json`. If dirty, stop and report — Wave G should not mix with unrelated in-flight docs work.

- [ ] **Step 2: Verify the spec is on main and locked**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git log --oneline -1 docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md
```

Expected: shows commit `ac6dc71f` (or later if the spec is amended). If the file is missing, stop — the spec is the contract for this plan.

- [ ] **Step 3: Create the feature branch**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git checkout main
git pull --ff-only
git checkout -b docs/wave-g-sw4p-earn-corpus
```

Expected: branch created, working tree clean.

---

## Phase 1: Canonical truth manuscript edits

### Task 1.1: Add Yield to §1 "What That Means in Practice" bullet list

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md` (§1, around line 28-34)

- [ ] **Step 1: State the deficit (the "failing test")**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "Yield" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: 0 hits. Yield is not yet a recognized layer in the canonical corpus.

- [ ] **Step 2: Confirm current bullet count (verifies the "five layers" assertion)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "^- \*\*\(Distribution\|Participation\|Proof\|Settlement\|Operations\)" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: 5 lines matching, at lines 30–34 (one per layer).

- [ ] **Step 3: Apply the edit**

In `RNDRNTWRK_CANONICAL_TRUTH.md`, change:

```
The system has five operational layers:

- **Distribution** — 555stream: browser-native broadcasting to any destination, everywhere all at once
- **Participation** — 555 Arcade: 20 browser games generating verified engagement, competition, and economic input
- **Proof** — VAP (Verifiable Attention Protocol): cryptographic verification that participation is real, not reported
- **Settlement** — sw4p: cross-chain USDC movement across Solana, Base, Polygon, and expanding
- **Operations** — Alice: autonomous AI operator that demonstrates the system works without a human in the loop
```

to:

```
The system has six operational layers:

- **Distribution** — 555stream: browser-native broadcasting to any destination, everywhere all at once
- **Participation** — 555 Arcade: 20 browser games generating verified engagement, competition, and economic input
- **Proof** — VAP (Verifiable Attention Protocol): cryptographic verification that participation is real, not reported
- **Settlement** — sw4p: cross-chain USDC movement across Solana, Base, Polygon, and expanding
- **Yield** — sw4p Earn: settled cross-chain volume turned into stake-bearing yield, paid from sw4p routing fees and protocol-owned liquidity
- **Operations** — Alice: autonomous AI operator that demonstrates the system works without a human in the loop
```

- [ ] **Step 4: Verify the deficit closed**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "Yield.*sw4p Earn\|sw4p Earn" RNDRNTWRK_CANONICAL_TRUTH.md
grep -n "^The system has six operational layers" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: first grep returns at least 1 hit (the new bullet); second grep returns exactly 1 hit.

- [ ] **Step 5: Voice review**

Re-read the new bullet against §15. Confirm: definite article ("**The** Yield surface" via "**Yield** — sw4p Earn"), no superlatives, no exclamation marks, no "yield farming" / "high APY" / "stake to earn" vocabulary. Confirm: nothing pasted from PRIVATE-tier docs (no "Trail of Bits", no "11-state machine", no "five independent audits"). One revision pass.

(No separate commit yet — Task 1.5 commits §1, §6, §7, §12.5, and the grep-pass together as one logical "canonical truth: add Yield as 6th layer" change.)

### Task 1.2: Retitle §6 "Five Layers"→"Six Layers" and insert Layer 5 (Yield)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md` (§6, around lines 194-247)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "^### The Five Layers\|^### The Six Layers" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: 1 hit ("The Five Layers" at line 196). The "Six Layers" form does not exist yet.

- [ ] **Step 2: Retitle the section header and the intro paragraph**

In `RNDRNTWRK_CANONICAL_TRUTH.md`, change:

```
### The Five Layers

RNDRNTWRK operates as a unified economic system with five functional layers. Each layer exists to solve a specific part of the value lifecycle: creation, verification, monetization, settlement, and coordination.
```

to:

```
### The Six Layers

RNDRNTWRK operates as a unified economic system with six functional layers. Each layer exists to solve a specific part of the value lifecycle: creation, verification, monetization, settlement, yield, and coordination.
```

- [ ] **Step 3: Insert the new Layer 5 (Yield — sw4p Earn) subsection before "Layer 5: Operations — Alice"**

Locate the existing `**Layer 5: Operations — Alice**` heading (around line 230). Insert the following block immediately BEFORE it, and renumber the Operations heading to `**Layer 6: Operations — Alice**`:

```
**Layer 5: Yield — sw4p Earn**

The surface that turns settled cross-chain volume into stake-bearing yield. sw4p Earn pays liquidity providers and locked-$555 holders from sw4p routing fees and protocol-owned liquidity — real-fee yield first, with a separately labelled $555 incentive overlay. Rewards trace to routed flow; nothing synthetic, nothing borrowed from a treasury subsidy curve.

The product runs in stages: testnet-rehearsal on Base Sepolia and Solana devnet today, mainnet canary on Base when the sw4p engine mainnet returns, public launch when the engine, the agent kit, and the earn surface are all stable in production. The Yield layer is what makes settled volume compound back into network ownership instead of leaving as one-shot fee revenue.

**Layer 6: Operations — Alice**
```

- [ ] **Step 4: Verify the edit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "^### The Six Layers\|^\*\*Layer [0-9]" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: 1 hit for "The Six Layers"; six hits for `**Layer 1` through `**Layer 6`. No `**Layer 5: Operations` remains.

- [ ] **Step 5: Voice review on the new Layer 5 prose**

Re-read against §15-§16. Confirm: no "APY" headline, no "yield farming", "stake to earn" or DeFi vocabulary. Confirm "routing fees" (not "bridge fees"). Confirm $555 written as `$555`.

(No commit yet.)

### Task 1.3: Insert new §12.5 (sw4p Earn — The Yield Surface) between §12 and §13

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md` (around line 464, right after §12 ends and before §13)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "^## 1[23]\." RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: shows `## 12. sw4p — The Settlement Rail` and `## 13. The Ads Marketplace — The Revenue Engine` with nothing between them. (Per spec D4, we insert §12.5 instead of §13 to avoid renumbering churn on §13+.)

- [ ] **Step 2: Insert the new §12.5 section**

Locate the line immediately above `## 13. The Ads Marketplace — The Revenue Engine` (this is the line after §12's "Role in the System" paragraph closes, with a `---` separator). Insert the following block in the gap, keeping the existing `---` separators intact above and below:

```
## 12.5 sw4p Earn — The Yield Surface

### Identity

sw4p Earn is the yield surface of the RNDRNTWRK economic system. It turns settled cross-chain volume into stake-bearing yield for liquidity providers and locked-$555 holders.

### What It Is

- Real-fee yield first — rewards trace to actual sw4p routing fees and pool fees on routed volume, not to a treasury subsidy curve
- Separately labelled $555 incentive yield overlay — disclosed as incentive, never folded into the real-fee headline
- Modules: Global $555 Lock (lock-and-boost on the coordination token), LP Vault (pool liquidity earning routing fees), Matched $555 Vault (paired stake against real LP positions), Protocol-Owned Liquidity (POL) Vault, MM Reserve
- Solana hub, Base as the first EVM spoke; native cross-chain supply via burn-and-mint, not lock-and-mint custody
- Anti-wash enforcement for routed volume — pg-backed worker classifies route events as included or excluded so rewards never compound on synthetic flow
- Public proof dashboard: real volume, TVL, fees, rewards, NTT supply invariant, excluded volume — published before any public marketing

### Canonical Language

sw4p Earn is **the yield surface**, not a "staking app" or a "DeFi protocol". The system never headlines an APY rate; it labels real-fee yield separately from $555 incentive yield and lets the cascade economics carry the message. "Anti-wash" is always paired with "for routed volume" on first use. $555 lock is `$555 lock`, not "token lock".

### Role in the System

Settled volume that exits the system as one-shot routing fees is value the network captured once and never compounded. sw4p Earn closes that loop: liquidity providers who route volume earn routing fees back; locked-$555 holders earn boosted yield on top; protocol-owned liquidity grows on its own depth. The yield layer is what converts cross-chain throughput into network ownership.

```

- [ ] **Step 3: Verify the insertion**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "^## 12\.5\|^## 12\. \|^## 13\." RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: three lines, in this order — `## 12. sw4p — The Settlement Rail`, `## 12.5 sw4p Earn — The Yield Surface`, `## 13. The Ads Marketplace — The Revenue Engine`.

- [ ] **Step 4: Voice review**

Re-read §12.5 against §15-§16. Confirm: parallel structure with §9-§12 (Identity / What It Is / Canonical Language / Role in the System). Confirm: no "DeFi protocol" (forbidden), no "yield farming", no "APY" as headline, no "bridge fees" (says "routing fees"). Confirm: $555 always written as `$555`. Confirm: nothing from PRIVATE-tier specs (no Wormhole NTT, no Circle CCTP, no Hyperlane, no Allbridge by vendor name — say "settlement" / "sw4p"). Re-check the "burn-and-mint" phrase — that is generic supply-conservation language, not a vendor name, so it stays.

(No commit yet.)

### Task 1.4: Append fee-split reconciliation paragraph to §7 (before "Creator-Level Cascade")

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md` (§7, around line 278)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "10/45/45\|LP-stakers\|routing fees specifically" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: 0 hits. The §7 cascade defines the 10% ARP + 50/50 split but does not yet show the sw4p-routing-fee specialisation.

- [ ] **Step 2: Insert the reconciliation paragraph after the platform's 50/50 sub-allocation list and before the `### Creator-Level Cascade` header**

Locate the lines:

```
Platform's 50% allocates as:
- **70% → Treasury** — operations, development, growth, strategic investment
- **20% → Buyback-and-burn** — structural demand creation for $555, permanently deflationary
- **5% → $555 reserve** — protocol token reserve
- **5% → SOL/USDC reserve** — operational liquidity

### Creator-Level Cascade
```

Insert this paragraph in the blank line between the last bullet (`5% → SOL/USDC reserve`) and `### Creator-Level Cascade`:

```
### sw4p Routing-Fee Specialisation

For sw4p routing fees specifically, the ecosystem half of the 50/50 split is allocated entirely to liquidity providers in the pools that routed the volume — they are the ecosystem participants in this context. The platform half follows the standard 20/5/5/70 allocation. The gross effect is 10/45/45 (ARP / LP-stakers / platform) plus the standard platform sub-allocation. This is a specialisation of the cascade, not a deviation from it.

```

- [ ] **Step 3: Verify the edit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "10/45/45\|sw4p Routing-Fee Specialisation" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: 2 hits ("10/45/45" appears in the paragraph; the new `### sw4p Routing-Fee Specialisation` subheader appears once).

- [ ] **Step 4: Voice review**

Confirm canonical voice: "specialisation of the cascade, not a deviation from it" matches the §15 register. Confirm "routing fees" (not "bridge fees"). Confirm the paragraph is consistent with `policy.ts:allocateSw4pFee` (10/45/45 then 20/5/5/70 on the platform 45%) — no new numbers introduced.

(No commit yet.)

### Task 1.5: Grep-pass — replace every "five operational layers" / "five layers" / "5 layers" with "six"

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md` (multiple occurrences)

- [ ] **Step 1: Enumerate every occurrence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n -i "five operational layers\|five layers\|5 layers" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected (per pre-edit reconnaissance): three remaining hits after Task 1.1 already updated line 28:
- Line 196 region: "The Five Layers" — already retitled in Task 1.2
- Line 532: "Without it, the five operational layers are disconnected services"
- Line 653: "555stream is the distribution layer — one of five operational layers"

If different lines show, edit the lines the grep reports, not the line numbers above.

- [ ] **Step 2: Apply each replacement**

For each remaining occurrence:

In §14 (around line 532), change:
```
$555 is the binding agent. Without it, the five operational layers are disconnected services. With it, they form one economic system where access, alignment, governance, and structural demand reinforce each other continuously.
```
to:
```
$555 is the binding agent. Without it, the six operational layers are disconnected services. With it, they form one economic system where access, alignment, governance, and structural demand reinforce each other continuously.
```

In §17 (around line 653), change:
```
**Canonical correction:** 555stream is the distribution layer — one of five operational layers in the economic system. Calling RNDRNTWRK a streaming platform is like calling Stripe a checkout page. The visible surface is not the system.
```
to:
```
**Canonical correction:** 555stream is the distribution layer — one of six operational layers in the economic system. Calling RNDRNTWRK a streaming platform is like calling Stripe a checkout page. The visible surface is not the system.
```

- [ ] **Step 3: Verify zero remaining hits**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n -i "five operational layers\|five layers\|5 layers" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: 0 hits.

- [ ] **Step 4: Verify the "six" form is consistent**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n -i "six operational layers\|six functional layers\|^### The Six Layers" RNDRNTWRK_CANONICAL_TRUTH.md
```

Expected: at least 4 hits (line 28 intro, §6 header + intro, §14, §17).

- [ ] **Step 5: Commit §§1, 6, 7, 12.5, and grep-pass together**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add RNDRNTWRK_CANONICAL_TRUTH.md
git commit -m "$(cat <<'EOF'
docs(canonical): promote sw4p Earn to the 6th operational layer (Yield)

Updates the RNDRNTWRK canonical truth manuscript to recognise sw4p Earn
as a top-level participation surface, per spec
docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md §3.

Changes:
- §1 bullet list: add Yield — sw4p Earn between Settlement and Operations.
- §6 "The Six Layers": retitle from "Five"; insert Layer 5 (Yield — sw4p
  Earn) subsection before Operations (now Layer 6).
- §7 cascade: append sw4p routing-fee specialisation paragraph showing
  the 10/45/45 + 20/5/5/70 split for routing-fee revenue. Matches
  policy.ts:allocateSw4pFee; no new economics.
- §12.5 NEW: sw4p Earn — The Yield Surface. Mirrors §9-§12 shape
  (Identity / What It Is / Canonical Language / Role). Inserted at 12.5
  instead of 13 to avoid renumbering §13+.
- Grep-pass: every "five operational layers" / "Five Layers" updated to
  "six". Verified 0 hits remaining.

Voice: pre-reviewed against §15-§16. No DeFi vocabulary, no APY headline,
no vendor names from PRIVATE-tier docs. "Routing fees" not "bridge fees".
EOF
)"
```

---

## Phase 2: docs/sw4p.mdx edits

### Task 2.1: Add anti-wash ↔ VAP differentiation sentence in "Integration Inside RNDRNTWRK"

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/sw4p.mdx` (around line 111-117)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "Anti-wash\|anti-wash" docs/sw4p.mdx
```

Expected: 0 hits. The sw4p public page does not yet differentiate anti-wash (for routed volume) from VAP (for engagement).

- [ ] **Step 2: Apply the edit**

In `docs/sw4p.mdx`, locate the `## Integration Inside RNDRNTWRK` section:

```
## Integration Inside RNDRNTWRK

Within RNDRNTWRK, sw4p serves as the settlement backend for cross-chain routing and value movement.

- **AGG** uses sw4p for cross-chain payment routing
- **Hyperlink** resolves cross-chain payment links through sw4p
- Broader asset and route support follows the sw4p routing roadmap
```

Replace it with:

```
## Integration Inside RNDRNTWRK

Within RNDRNTWRK, sw4p serves as the settlement backend for cross-chain routing and value movement.

- **AGG** uses sw4p for cross-chain payment routing
- **Hyperlink** resolves cross-chain payment links through sw4p
- **sw4p Earn** distributes real-fee yield to liquidity providers and locked-$555 holders on the volume sw4p routes
- Broader asset and route support follows the sw4p routing roadmap

Anti-wash enforcement on routed volume (run inside sw4p Earn) is a separate proof system from VAP, which proves engagement. Both are required for trustworthy participation-rewards economics across the network.
```

- [ ] **Step 3: Verify**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "Anti-wash enforcement on routed volume\|sw4p Earn" docs/sw4p.mdx
```

Expected: 2+ hits — the "Anti-wash enforcement on routed volume" sentence appears once, and `sw4p Earn` appears at least in the bullet and the trailing paragraph.

- [ ] **Step 4: Voice review**

Confirm "anti-wash" paired with "for routed volume" on first use per §16. Confirm "settlement" / "routing fees" language, no DeFi or yield-farming vocabulary.

(No commit yet — Task 2.2 commits both sw4p.mdx edits together.)

### Task 2.2: Add "sw4p Earn" card to the "Go Deeper" CardGroup

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/sw4p.mdx` (around line 168-183)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "products/earn\|href=\"/products/earn\"" docs/sw4p.mdx
```

Expected: 0 hits.

- [ ] **Step 2: Apply the edit**

In `docs/sw4p.mdx`, locate the `## Go Deeper` section's `<CardGroup cols={2}>` block:

```
## Go Deeper

<CardGroup cols={2}>
  <Card title="AGG" icon="route" href="/protocol/agg">
    See how AGG routes payments through sw4p.
  </Card>
  <Card title="Hyperlink" icon="link" href="/protocol/hyperlink">
    See how payment links resolve cross-chain.
  </Card>
  <Card title="Fee Distribution" icon="chart-pie" href="/tokenomics/fee-distribution">
    See how settled value routes through the protocol cascade.
  </Card>
  <Card title="For Developers" icon="code" href="/for-developers">
    See all developer entry points across the network.
  </Card>
</CardGroup>
```

Add an `sw4p Earn` card. Insert it so the four-column shape stays balanced (the grid is `cols={2}` so cards wrap; total 5 cards is fine):

```
## Go Deeper

<CardGroup cols={2}>
  <Card title="AGG" icon="route" href="/protocol/agg">
    See how AGG routes payments through sw4p.
  </Card>
  <Card title="Hyperlink" icon="link" href="/protocol/hyperlink">
    See how payment links resolve cross-chain.
  </Card>
  <Card title="sw4p Earn" icon="coins" href="/products/earn">
    See how routed volume turns into stake-bearing yield.
  </Card>
  <Card title="Fee Distribution" icon="chart-pie" href="/tokenomics/fee-distribution">
    See how settled value routes through the protocol cascade.
  </Card>
  <Card title="For Developers" icon="code" href="/for-developers">
    See all developer entry points across the network.
  </Card>
</CardGroup>
```

- [ ] **Step 3: Verify**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "title=\"sw4p Earn\"\|href=\"/products/earn\"" docs/sw4p.mdx
```

Expected: 2 hits (the `title=` and `href=` on the same card).

- [ ] **Step 4: Voice review**

The card description is one line, declarative, definitional — matches the existing card pattern. No "yield farming" / "APY".

- [ ] **Step 5: Commit both sw4p.mdx edits**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add docs/sw4p.mdx
git commit -m "$(cat <<'EOF'
docs(sw4p): differentiate anti-wash vs VAP, link to sw4p Earn

Adds two adjustments to the sw4p public page per spec §3.2 and §4 (D1):

- Integration Inside RNDRNTWRK: add anti-wash ↔ VAP differentiation
  paragraph so a reader doesn't conclude VAP covers all "real-activity"
  proofs. Anti-wash protects routed-volume rewards; VAP protects
  engagement rewards; both required.
- Go Deeper CardGroup: add an sw4p Earn card pointing at
  /products/earn, sized to match the existing card descriptions.

Voice-matched to §15-§16. "Anti-wash" paired with "for routed volume"
on first use per §16.
EOF
)"
```

---

## Phase 3: New file — docs/products/earn.mdx

### Task 3.1: Create the sw4p Earn product page

**Files:**
- Create: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/products/earn.mdx`

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
ls docs/products/earn.mdx 2>&1
```

Expected: `ls: docs/products/earn.mdx: No such file or directory`. The product page does not exist.

- [ ] **Step 2: Confirm the file shape we are mirroring exists**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
head -10 docs/products/kit.mdx
```

Expected: shows the Mintlify front-matter (`title:`, `icon:`, `description:`) followed by an `<Info>` block. The new file mirrors this shape.

- [ ] **Step 3: Create the file with full content**

Create `docs/products/earn.mdx` with the following content:

```mdx
---
title: "sw4p Earn"
icon: "coins"
description: "The yield surface of RNDRNTWRK — real-fee yield on settled cross-chain volume, plus locked-$555 boosts."
---

<Info>**Status:** Stage-0 closed-on-main. Stage-1 testnet rehearsal on Base Sepolia and Solana devnet. Stage-2 mainnet canary on Base ships when the sw4p engine mainnet returns. Stage-3 public launch is gated on the engine, the agent kit, and the earn surface being stable together.</Info>

# sw4p Earn

**sw4p Earn is the yield surface of RNDRNTWRK.** It turns settled cross-chain volume into stake-bearing yield for liquidity providers and locked-$555 holders.

sw4p Earn matters because routed volume that exits the system as one-shot routing fees is value the network captured once and never compounded. sw4p Earn closes that loop: LPs who supply the pools sw4p routes through earn the routing fees back; locked-$555 holders earn a boost on top; protocol-owned liquidity grows on its own depth. The yield surface is what converts cross-chain throughput into network ownership instead of letting it leave as one-time revenue.

## Why a separate product

The [sw4p](/sw4p) settlement engine prices and routes the volume. The [`@sw4p/kit`](/products/kit) agent surface exposes that engine to agent stacks. sw4p Earn is a third surface — economic rather than technical — that distributes the settled volume's fee stream to the participants who supplied the liquidity and the coordination capital. The three are coordinated but independent: each can ship and stabilise on its own cadence.

## Key Facts

| | |
|---|---|
| **Category** | Yield surface — real-fee LP rewards plus locked-$555 boosts |
| **Reward source** | sw4p routing fees and pool fees on routed volume, plus protocol-owned liquidity |
| **Yield model** | Real-fee yield labelled separately from $555 incentive yield. No headline APY. |
| **Hub chain** | Solana |
| **First EVM spoke** | Base |
| **Cross-chain supply** | Native burn-and-mint on both sides (Solana hub and every EVM spoke); supply invariant is reconstruction, not lock-and-mint custody |
| **Decimals** | `$555` is 6 decimals canonical across Solana mint, EVM ERC-20, every NTT manager, pools, vaults, and dashboard. Enforced by a runtime decimal verifier in CI. |
| **Custody** | Non-custodial — users sign from their own wallet. |
| **Public proof** | Dashboard ships real volume, TVL, fees, rewards, NTT supply invariant, excluded volume before any public marketing. |

## Modules

| Module | Function |
|---|---|
| **Global $555 Lock** | Lock $555 on Solana to receive a reward boost across the LP and matched vaults. The lock is the coordination signal that aligns long-term holders with routed volume. |
| **LP Vault** | Pool liquidity earning routing fees on the volume sw4p routes through it. Real-fee yield baseline. |
| **Matched $555 Vault** | $555 deposited paired against real LP positions, eligible for $555 incentive yield in addition to the LP fee share. |
| **Protocol-Owned Liquidity (POL) Vault** | Protocol-supplied liquidity that grows independent of LP behaviour, deepening the routes sw4p priorities. |
| **MM Reserve** | Market-maker reserve sized against routing depth; published separately so the cascade stays auditable. |

## Fee Model

For sw4p routing fees specifically, the cascade specialises:

- **10% → Audience Reward Pool (ARP)** — the protocol-wide commitment to audience ownership, off the top.
- **45% → LP-stakers in the pools that routed the volume** — they are the ecosystem participants in this context.
- **45% → Platform** — distributed under the standard 20% buyback-and-burn / 5% $555 reserve / 5% SOL-USDC reserve / 70% Treasury cascade.

The gross effect is 10/45/45 plus the standard platform sub-allocation. This is a specialisation of the [RNDRNTWRK economic cascade](/economics), not a deviation from it. The split is encoded in `policy.ts:allocateSw4pFee` and covered by the test suite under `services/shared`; no off-policy revenue path exists.

## Reward Model

sw4p Earn labels two reward streams separately, on purpose:

- **Real-fee yield** — paid from actual routing-fee revenue. The headline. The number a participant should evaluate the product on.
- **$555 incentive yield** — an overlay funded from the protocol's $555 incentive budget, disclosed as incentive, never folded into the real-fee headline.

In addition, **utility boosts**:

- **Global $555 Lock boost** — locking $555 increases the share of routed-fee revenue and incentive yield a participant receives.
- **Pool-specific multipliers** — certain pools may carry temporary multipliers tied to depth or strategic launch windows; always published in the dashboard before going live.

No "yield farming." No APY headlines. No real-fee yield commingled with incentive yield in any number a participant reads.

## Stage Taxonomy

sw4p Earn ships in four stages. The current state and the gate for each:

| Stage | What it covers | Current state | Gate |
|---|---|---|---|
| **Stage 0** | Internal hardening — every CC-* audit finding closed-on-main; operator preflight (branch protection, decimal-verifier production secret, authority-monitor expected values, PagerDuty wiring) | Closed-on-main | — |
| **Stage 1** | Testnet rehearsal — 7-day canary on Base Sepolia + Solana devnet | In progress | Stage-0 sign-off; sw4p engine testnet stable |
| **Stage 2** | Mainnet canary — first real value on Base, low-value caps | Blocked | sw4p engine mainnet returned; CC-14 authority monitor live with real expected values; 7-day NTT round-trip canary green |
| **Stage 3** | Public launch — open registration, public dashboard, scheduled reward epochs | Blocked | External smart-contract audit clean; `@sw4p/kit` published to npm; sw4p engine mainnet stable; coordinated announcement |

Stage gates are defined in the sw4p-earn runbooks (`launch-stage0-readiness.md`, `closure-matrix.md`); the RNDRNTWRK protocol roadmap maps each stage to a Phase under [`/protocol/roadmap`](/protocol/roadmap).

## Public Proof Before Public Marketing

The non-negotiable: the public proof dashboard ships **before** any public marketing for sw4p Earn. Real volume, TVL, fees, rewards, NTT supply invariant, and excluded-volume figures are published continuously; the dashboard is the proof, the announcement follows.

## Reference

- **Source:** [github.com/Render-Network-OS/sw4p-earn](https://github.com/Render-Network-OS/sw4p-earn)
- **License:** MIT
- **Settlement backend:** [sw4p](/sw4p) — the engine that prices and routes the volume sw4p Earn distributes
- **Agent surface:** [`@sw4p/kit`](/products/kit) — the agent-native MCP surface over the same engine
- **Cascade:** [Economic Cascade](/economics) and [Fee Distribution](/tokenomics/fee-distribution)

## Go Deeper

<CardGroup cols={2}>
  <Card title="sw4p" icon="bridge" href="/sw4p">
    See how the settlement engine prices and routes the volume sw4p Earn distributes.
  </Card>
  <Card title="@sw4p/kit" icon="robot" href="/products/kit">
    See how agents settle cross-chain over the same engine.
  </Card>
  <Card title="Fee Distribution" icon="chart-pie" href="/tokenomics/fee-distribution">
    See the cascade and the sw4p routing-fee specialisation.
  </Card>
  <Card title="Roadmap" icon="map" href="/protocol/roadmap">
    See where Stages 0–3 map onto Phases 0–4.
  </Card>
</CardGroup>
```

- [ ] **Step 4: Verify file exists and is well-formed**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
ls -la docs/products/earn.mdx
head -10 docs/products/earn.mdx
```

Expected: file exists; first lines show the YAML front-matter (`title`, `icon`, `description`), then `<Info>` block.

- [ ] **Step 5: Voice review**

Re-read the full file. Confirm:
- Front-matter: `title: "sw4p Earn"` (lower-case `sw4p`, capital `Earn`) per §16.
- No "yield farming", "stake to earn", "high APY", "DeFi protocol", or "bridge fees" anywhere.
- $555 written as `$555` throughout.
- "Anti-wash" not used (the page focuses on the user-facing reward story, not the enforcement mechanism — anti-wash is mentioned on `sw4p.mdx` and §12.5 only, per spec).
- No vendor names from PRIVATE-tier docs (no Wormhole NTT, no Circle CCTP, no Hyperlane, no Allbridge).
- Universal gas abstraction framing is implicit (non-custodial; users sign from their own wallet) — no explicit vendor stack callout.

(No commit yet — Task 3.2 commits the new file and the docs.json wiring together, since they are interdependent.)

### Task 3.2: Wire `products/earn` into `docs/docs.json` Products → Core Products nav

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/docs.json` (around line 76-85)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "products/earn\|products/kit" docs/docs.json
```

Expected: only `products/kit` appears (line ~84). `products/earn` is absent — the new product page has no nav entry.

- [ ] **Step 2: Read the Core Products group**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
sed -n '73,87p' docs/docs.json
```

Expected: shows the `"Core Products"` group with `"pages"` array ending in `products/kit`.

- [ ] **Step 3: Apply the edit**

In `docs/docs.json`, change the Core Products `"pages"` array:

```json
          {
            "group": "Core Products",
            "pages": [
              "arcade/overview",
              "arcade/games",
              "555stream",
              "alice/persona",
              "alice/intelligence",
              "alice/possession",
              "sw4p",
              "products/kit"
            ]
          },
```

to:

```json
          {
            "group": "Core Products",
            "pages": [
              "arcade/overview",
              "arcade/games",
              "555stream",
              "alice/persona",
              "alice/intelligence",
              "alice/possession",
              "sw4p",
              "products/kit",
              "products/earn"
            ]
          },
```

(`products/earn` is appended after `products/kit` so the visible nav order is `sw4p` → `@sw4p/kit` → `sw4p Earn` — engine, agent surface, yield surface.)

- [ ] **Step 4: Validate the JSON is still parseable**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
node -e "JSON.parse(require('fs').readFileSync('docs/docs.json','utf8')); console.log('ok')"
```

Expected: `ok`. (If `node` is unavailable, use `python3 -c "import json; json.load(open('docs/docs.json'))"` instead.)

- [ ] **Step 5: Verify nav wiring**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "products/earn\|products/kit" docs/docs.json
```

Expected: 2 hits — `products/kit` and `products/earn` both present, with `earn` listed after `kit`.

- [ ] **Step 6: Mintlify build check (link integrity)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs"
npx -y mintlify@latest broken-links 2>&1 | tail -30
```

Expected: zero broken-link warnings against `/products/earn`, `/products/kit`, `/sw4p`, `/protocol/roadmap`, `/tokenomics/fee-distribution`, or `/economics`. If `mintlify` CLI is not installed, skip this step and surface as a manual-verification item to the operator instead — the build runs in CI.

- [ ] **Step 7: Commit the new product page and nav wiring together**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add docs/products/earn.mdx docs/docs.json
git commit -m "$(cat <<'EOF'
docs(products): add sw4p Earn product page and wire it into nav

Adds /products/earn as the public-corpus product page for sw4p Earn,
mirroring the shape of /products/kit, and registers it in
docs/docs.json under Products → Core Products immediately after kit.

Page content per spec §3 D4:
- Front-matter, Info status block, Why-a-separate-product paragraph
- Key Facts table (category, reward source, yield model, hub/spoke,
  decimals, custody, public-proof commitment)
- Modules table (Global $555 Lock, LP Vault, Matched $555 Vault, POL
  Vault, MM Reserve)
- Fee Model: 10/45/45 specialisation of the platform cascade with
  cross-link to /economics
- Reward Model: real-fee yield labelled separately from $555 incentive
  yield; no APY headline
- Stage Taxonomy: 0/1/2/3 with current state and gates
- Cross-links to sw4p engine, @sw4p/kit, fee distribution, roadmap

Voice: §15-§16 compliant. No DeFi vocabulary. No vendor names from
PRIVATE-tier docs. $555 written as $555. "Routing fees" not
"bridge fees".
EOF
)"
```

---

## Phase 4: docs/protocol/roadmap.mdx edits

### Task 4.1: Inject Stage↔Phase mapping inline under Phase 0, Phase 1, Phase 2

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/protocol/roadmap.mdx` (Phase 0 around line 11-20, Phase 1 around line 22-30, Phase 2 around line 32-42)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n -i "stage 0\|stage 1\|stage 2\|stage 3\|sw4p earn\|earn stage" docs/protocol/roadmap.mdx
```

Expected: 0 hits. The roadmap does not yet map sw4p-earn Stages onto RNDRNTWRK Phases.

- [ ] **Step 2: Apply edits — Phase 0 (covers Stages 0 + 1)**

In `docs/protocol/roadmap.mdx`, locate the Phase 0 section. Append a new bullet to its bullet list (after the existing `**Economic Model**` bullet):

Change:
```
*   **Economic Model**: 10% ARP, 50/50 split, weekly USDC settlement, structural burns.

## Phase 1: Ownership Layer
```

to:
```
*   **Economic Model**: 10% ARP, 50/50 split, weekly USDC settlement, structural burns.
*   **sw4p Earn — Stage 0 + Stage 1**: every CC-* audit finding closed-on-main, operator preflight complete (branch protection, decimal-verifier production secret, authority-monitor expected values, PagerDuty wiring), and a 7-day testnet canary rehearsal on Base Sepolia + Solana devnet via the canary scripts. Stage 1 sign-off does not depend on sw4p engine mainnet returning — testnet routes only.

## Phase 1: Ownership Layer
```

- [ ] **Step 3: Apply edits — Phase 1 (covers Stage 2)**

In `docs/protocol/roadmap.mdx`, locate the Phase 1 section. Append a new bullet (after `**P1-C**: Hyperlink completion`):

Change:
```
*   **P1-C**: Hyperlink completion — full embedded wallet support, advanced analytics, referral attribution.

**Depends on**: Phase 0 completion (stable points/credits, reliable VAP).
```

to:
```
*   **P1-C**: Hyperlink completion — full embedded wallet support, advanced analytics, referral attribution.
*   **sw4p Earn — Stage 2**: mainnet canary on Base, low-value caps. First real value through the yield surface. Hard prerequisite: sw4p engine mainnet has returned, CC-14 authority monitor live with operator-populated expected values, NTT round-trip canary green for 7+ days.

**Depends on**: Phase 0 completion (stable points/credits, reliable VAP).
```

- [ ] **Step 4: Apply edits — Phase 2 (covers Stage 3)**

In `docs/protocol/roadmap.mdx`, locate the Phase 2 section. Append a new bullet (after `**Value Taxonomy**`):

Change:
```
*   **Value Taxonomy**: Classification system for different types of verified attention.

**Depends on**: Phase 1 (cNFT infrastructure, lock verification).
```

to:
```
*   **Value Taxonomy**: Classification system for different types of verified attention.
*   **sw4p Earn — Stage 3**: open registration and public launch. External smart-contract audit complete with no open high/critical findings. Public dashboard live. Reward epoch publication on schedule.

**Depends on**: Phase 1 (cNFT infrastructure, lock verification).
```

- [ ] **Step 5: Verify the three insertions**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "sw4p Earn — Stage" docs/protocol/roadmap.mdx
```

Expected: 3 hits, one per Phase (0, 1, 2).

- [ ] **Step 6: Voice review**

Confirm each new bullet matches the existing Phase bullet shape: bold name, em-dash, declarative sentence, no "we will" hedging. Confirm "routing fees" / "yield surface" / "NTT round-trip canary" — no DeFi or marketing vocabulary.

(No commit yet — Task 4.2 commits both roadmap edits together.)

### Task 4.2: Append announcement-gating paragraph to Phase 2

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/protocol/roadmap.mdx` (Phase 2 closing, around line 42)

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "triple\|three concurrent\|all three or none" docs/protocol/roadmap.mdx
```

Expected: 0 hits. The announcement-gating discipline is not yet recorded.

- [ ] **Step 2: Apply the edit**

In `docs/protocol/roadmap.mdx`, locate the Phase 2 section's closing line. Append the announcement-gating paragraph AFTER `**Depends on**: Phase 1 (cNFT infrastructure, lock verification).` and BEFORE `## Phase 3: Platform Expansion`:

Change:
```
**Depends on**: Phase 1 (cNFT infrastructure, lock verification).

## Phase 3: Platform Expansion
```

to:
```
**Depends on**: Phase 1 (cNFT infrastructure, lock verification).

The public sw4p Earn announcement is gated on three concurrent conditions: `@sw4p/kit` published to npm, sw4p engine mainnet restored and stable, and sw4p Earn at Stage 3. Announcing yield-as-product while the kit is still source-install undersells the agent-native integration story; announcing while engine mainnet is paused contradicts the product surface. All three, or none.

## Phase 3: Platform Expansion
```

- [ ] **Step 3: Verify**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -n "three concurrent conditions\|All three, or none" docs/protocol/roadmap.mdx
```

Expected: 2 hits.

- [ ] **Step 4: Voice review**

Confirm the paragraph matches canonical voice (definitive, infrastructure-grade, "All three, or none."). No exclamation marks. No "we plan to" / "we will". The triple-gate is stated as a discipline, not a promise.

- [ ] **Step 5: Commit both roadmap edits together**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add docs/protocol/roadmap.mdx
git commit -m "$(cat <<'EOF'
docs(roadmap): map sw4p Earn Stages 0-3 onto Phases 0-2 + gating

Records the canonical Stage <-> Phase mapping per spec §3 D2 and the
triple-gate announcement discipline per §3 D3.4.

Mapping:
- Phase 0 absorbs Stage 0 (internal hardening) and Stage 1 (testnet
  rehearsal). Stage 1 does not depend on sw4p engine mainnet returning.
- Phase 1 absorbs Stage 2 (mainnet canary on Base, low-value). Hard
  prereqs: sw4p engine mainnet returned, CC-14 authority monitor live
  with real expected values, NTT round-trip canary green 7+ days.
- Phase 2 absorbs Stage 3 (public launch). Hard prereqs: external
  audit clean, public dashboard live, reward epochs on schedule.

Gating: the public sw4p Earn announcement is gated on three concurrent
conditions — kit published, engine mainnet stable, earn at Stage 3.
All three, or none.

No re-classification of Stage gates; gates remain defined in the
sw4p-earn runbooks. The map only records the alignment against the
canonical Phase taxonomy.
EOF
)"
```

---

## Phase 5: Parent-monorepo verification before opening PR

### Task 5.1: Full corpus consistency check

**Files:** none modified — verification only.

- [ ] **Step 1: Confirm every "five layers" form is gone**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -rn -i "five operational layers\|five layers\|5 layers\|five functional layers" RNDRNTWRK_CANONICAL_TRUTH.md docs/
```

Expected: 0 hits.

- [ ] **Step 2: Confirm sw4p Earn / Yield are present in every target file**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
echo "--- canonical truth ---"
grep -c "sw4p Earn\|Yield" RNDRNTWRK_CANONICAL_TRUTH.md
echo "--- sw4p.mdx ---"
grep -c "sw4p Earn\|anti-wash" docs/sw4p.mdx
echo "--- earn.mdx ---"
ls docs/products/earn.mdx
echo "--- docs.json ---"
grep -c "products/earn" docs/docs.json
echo "--- roadmap.mdx ---"
grep -c "sw4p Earn — Stage\|three concurrent conditions" docs/protocol/roadmap.mdx
```

Expected:
- canonical truth: at least 8 hits (§1 bullet, §6 layer, §12.5 section + body, §7 cross-references, etc.)
- sw4p.mdx: at least 3 hits
- earn.mdx: file exists
- docs.json: 1 hit
- roadmap.mdx: at least 4 hits (3 Stage bullets + 1 gating paragraph hit)

- [ ] **Step 3: Confirm no forbidden vocabulary leaked in**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -rn -i "yield farming\|stake to earn\|high APY\|DeFi protocol\|bridge fees" RNDRNTWRK_CANONICAL_TRUTH.md docs/products/earn.mdx docs/sw4p.mdx docs/protocol/roadmap.mdx
```

Expected: 0 hits.

- [ ] **Step 4: Confirm no PRIVATE-tier vendor names leaked in**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -rn -i "Wormhole NTT\|Circle CCTP\|Hyperlane\|Allbridge\|Trail of Bits\|five independent audits\|11-state machine" RNDRNTWRK_CANONICAL_TRUTH.md docs/products/earn.mdx docs/sw4p.mdx docs/protocol/roadmap.mdx
```

Expected: 0 hits. (Note: lowercase "ntt" and the phrase "NTT round-trip canary" / "NTT supply invariant" are technical references to a supply discipline, not vendor attributions — they remain. The forbidden form is the vendor branding "Wormhole NTT".)

- [ ] **Step 5: Review the full commit set**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git log --oneline main..docs/wave-g-sw4p-earn-corpus
git diff --stat main..docs/wave-g-sw4p-earn-corpus
```

Expected: 4 commits, exactly the four landed in Phases 1-4. Diff stat shows changes to: `RNDRNTWRK_CANONICAL_TRUTH.md`, `docs/sw4p.mdx`, `docs/products/earn.mdx` (new), `docs/docs.json`, `docs/protocol/roadmap.mdx`. No other files touched.

- [ ] **Step 6: Mintlify build (if available locally)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs"
npx -y mintlify@latest dev --port 3333 &
MINTLIFY_PID=$!
sleep 8
curl -sf http://localhost:3333/products/earn > /dev/null && echo "earn page renders" || echo "earn page failed"
curl -sf http://localhost:3333/sw4p > /dev/null && echo "sw4p page renders" || echo "sw4p page failed"
curl -sf http://localhost:3333/protocol/roadmap > /dev/null && echo "roadmap renders" || echo "roadmap failed"
kill $MINTLIFY_PID
```

Expected: three `renders` lines. If `mintlify dev` is not available locally, skip this step and rely on CI; surface the skip to the operator as a manual-verification item before merge.

---

## Phase 6: sw4p-earn repo cross-link headers

### Task 6.1: Add canonical-design cross-link header to `runbooks/sw4p-ecosystem-unified-plan.md`

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58/runbooks/sw4p-ecosystem-unified-plan.md`

This change lands in the **sw4p-earn worktree** on its existing `chore/ecosystem-unified-plan` branch (already checked out per the env). It is a separate commit from the parent-monorepo work because it's in a separate repo.

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58"
grep -n "2026-05-13-sw4p-ecosystem-unified-design\|canonical design" runbooks/sw4p-ecosystem-unified-plan.md
```

Expected: 0 hits. The runbook does not yet point at the parent-monorepo canonical design spec.

- [ ] **Step 2: Apply the edit**

In `runbooks/sw4p-ecosystem-unified-plan.md`, locate the very first heading and the first paragraph:

```
# SW4P ecosystem unified plan

**Scope:** unifies the 30-PR sw4p-earn launch-readiness train with the broader RNDRNTWRK ecosystem (sw4p engine, sw4p-kit SDK, canonical truth manuscript, public docs corpus). Removes redundancies between three parallel work streams that landed at the same time without being explicitly cross-referenced.
```

Insert the canonical-design pointer BETWEEN the H1 and the `**Scope:**` line:

```
# SW4P ecosystem unified plan

> **Canonical design:** the parent 555 monorepo spec at `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` is the canonical design for the sw4p ecosystem alignment. This file remains as the sw4p-earn-side narrative with cross-repo coordination detail that does not belong in the parent monorepo's canonical spec. When this file and the spec disagree, the spec wins.

**Scope:** unifies the 30-PR sw4p-earn launch-readiness train with the broader RNDRNTWRK ecosystem (sw4p engine, sw4p-kit SDK, canonical truth manuscript, public docs corpus). Removes redundancies between three parallel work streams that landed at the same time without being explicitly cross-referenced.
```

- [ ] **Step 3: Verify the header lands above the Scope line**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58"
grep -n "Canonical design\|the spec wins\|^# SW4P ecosystem unified plan\|^\*\*Scope:\*\*" runbooks/sw4p-ecosystem-unified-plan.md | head -6
```

Expected: 4 hits in this order: `# SW4P ecosystem unified plan` (line 1), `Canonical design` (line 3), `the spec wins` (line 3), `**Scope:**` (line 5).

- [ ] **Step 4: Voice review**

Header reads as a discipline statement, not a marketing note. "When this file and the spec disagree, the spec wins" matches the canonical voice — definitive, infrastructure-grade.

(No commit yet — Task 6.2 commits both sw4p-earn runbook changes together.)

### Task 6.2: Add outbound decimal-verifier cross-reference to `runbooks/decimal-verifier-config.md`

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58/runbooks/decimal-verifier-config.md`

- [ ] **Step 1: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58"
grep -n "sw4p engine\|sw4p-pro\|USDC handling" runbooks/decimal-verifier-config.md
```

Expected: 0 hits. The verifier runbook does not yet declare its scope boundary against the engine's USDC discipline.

- [ ] **Step 2: Apply the edit**

In `runbooks/decimal-verifier-config.md`, locate the H1 and first paragraph:

```
# Runbook — Decimal verifier production config (Secrets Manager)

The decimal verifier (`services/decimal-verifier`) asserts that every $555 token deployment on every chain reports the same number of decimals as the canonical Solana mint (6 — see `docs/skills/decimal-truth.md`). It runs in every CI batch under the `decimal_verifier` child build and is wired as a real gate (`ignore-failure: false`).
```

Insert a one-sentence cross-reference paragraph immediately after the first paragraph (before `## 1. Required JSON shape`):

```
# Runbook — Decimal verifier production config (Secrets Manager)

The decimal verifier (`services/decimal-verifier`) asserts that every $555 token deployment on every chain reports the same number of decimals as the canonical Solana mint (6 — see `docs/skills/decimal-truth.md`). It runs in every CI batch under the `decimal_verifier` child build and is wired as a real gate (`ignore-failure: false`).

> **Scope boundary:** decimal coherence for the sw4p engine's USDC handling is enforced inside `sw4p-pro/` (engine repo). The verifier here covers `$555` decimals on every surface where mismatch could break the supply invariant — Solana mint, EVM ERC-20, NTT manager, pools, vaults, dashboard literals, burn-executor constants, routing constants. The two checks are reciprocal — see `sw4p-pro/docs/ARCHITECTURE.md` for the engine-side reference back.
```

- [ ] **Step 3: Verify**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58"
grep -n "Scope boundary\|sw4p engine's USDC\|sw4p-pro/docs/ARCHITECTURE" runbooks/decimal-verifier-config.md
```

Expected: 3 hits (all in the new paragraph).

- [ ] **Step 4: Commit both sw4p-earn runbook changes**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58"
git add runbooks/sw4p-ecosystem-unified-plan.md runbooks/decimal-verifier-config.md
git commit -m "$(cat <<'EOF'
docs(runbooks): cross-link sw4p-earn runbooks to canonical design + engine

Two runbook header additions per the parent monorepo spec
docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md §3:

- runbooks/sw4p-ecosystem-unified-plan.md: declare the parent monorepo
  spec the canonical design and this runbook the sw4p-earn-side
  narrative. When the two disagree, the spec wins (D6).

- runbooks/decimal-verifier-config.md: add a scope-boundary paragraph
  pointing at sw4p-pro/docs/ARCHITECTURE.md for the engine's USDC
  decimal canon, and clarifying that this verifier covers $555
  decimals on every surface where mismatch could break the supply
  invariant. The two checks are reciprocal (D3.3).
EOF
)"
```

---

## Phase 7: sw4p (engine) repo reciprocal cross-reference

### Task 7.1: Add reciprocal decimal-coherence cross-reference to `sw4p/docs/ARCHITECTURE.md`

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/ARCHITECTURE.md`

This change lands in the **sw4p (engine) repo**, which is independent from both the parent monorepo and the sw4p-earn worktree. Create a feature branch in that repo.

- [ ] **Step 1: Confirm sw4p repo working state**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git status
```

Expected: working tree clean. If dirty, stop and report — Wave G should not mix with unrelated work.

- [ ] **Step 2: Create the feature branch**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git checkout main
git pull --ff-only
git checkout -b docs/wave-g-decimal-coherence-crosslink
```

Expected: branch created.

- [ ] **Step 3: State the deficit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
grep -n "555.*decimal coherence\|sw4p-earn.*decimal\|decimal-verifier" docs/ARCHITECTURE.md
```

Expected: 0 hits. The engine doc does not yet record where the upstream `$555` decimal-coherence check lives.

- [ ] **Step 4: Locate the Security Architecture section**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
grep -n "^## " docs/ARCHITECTURE.md | head -10
```

Expected: section headers including `## Security Architecture` (or similar — confirm exact spelling). The cross-reference lands inside that section.

- [ ] **Step 5: Apply the edit**

In `docs/ARCHITECTURE.md`, locate the `## Security Architecture` section header. Insert the following one-paragraph callout as a `> **Note:**` block immediately AFTER the section header and BEFORE the first paragraph of body content under that section:

```
> **Decimal coherence on $555 (upstream cross-reference):** decimal coherence for the `$555` token across NTT managers, EVM ERC-20 deployments, Uniswap V3 pools, staking vaults, rewards distributors, and dashboard literals is enforced upstream by `sw4p-earn/services/decimal-verifier/`. That verifier reads this engine's deployed token-decimal values at runtime and gates CI when any surface drifts from the canonical 6-decimal target. The engine-side USDC discipline (6 decimals canonical) remains the responsibility of this repo; the two checks are reciprocal.
```

(If `## Security Architecture` is not the exact header, place the paragraph in the closest equivalent — anywhere under a "Security" heading or near the USDC handling discussion, per spec §3.3. Place it under the closest semantic match and move on.)

- [ ] **Step 6: Verify**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
grep -n "Decimal coherence on \$555\|sw4p-earn/services/decimal-verifier" docs/ARCHITECTURE.md
```

Expected: 2 hits in the new paragraph.

- [ ] **Step 7: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add docs/ARCHITECTURE.md
git commit -m "$(cat <<'EOF'
docs(architecture): cross-reference sw4p-earn decimal verifier

Adds the reciprocal cross-reference for $555 decimal coherence per the
parent monorepo spec
docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md §3.3.

The engine owns USDC decimal discipline (6 decimals canonical). The
upstream sw4p-earn/services/decimal-verifier owns $555 decimal
coherence across every surface where mismatch could break the supply
invariant — Solana mint, EVM ERC-20, NTT manager, pools, vaults,
dashboard literals. The two checks are reciprocal and now cross-link
each other.
EOF
)"
```

---

## Phase 8: Final verification across all three repos

### Task 8.1: Full Wave G consistency sweep

**Files:** none modified — verification only.

- [ ] **Step 1: Confirm every spec §3 file change landed in exactly one repo**

```bash
echo "=== Parent monorepo (Wave G branch) ==="
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555" && git log --oneline main..docs/wave-g-sw4p-earn-corpus

echo "=== sw4p-earn (worktree, chore/ecosystem-unified-plan branch) ==="
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58" && git log --oneline -3

echo "=== sw4p engine ==="
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" && git log --oneline main..docs/wave-g-decimal-coherence-crosslink
```

Expected:
- Parent monorepo: 4 commits (canonical truth, sw4p.mdx, products/earn + docs.json, roadmap)
- sw4p-earn: 1 new commit on top of the existing branch (the cross-link header pair)
- sw4p engine: 1 commit (architecture cross-reference)

- [ ] **Step 2: Confirm spec-coverage row by row against §3 file-by-file manifest**

Walk the spec's §3 manifest and confirm each entry is covered:

| Spec §3 row | Implementing task |
|---|---|
| `RNDRNTWRK_CANONICAL_TRUTH.md` §1 — Yield bullet | Task 1.1 |
| `RNDRNTWRK_CANONICAL_TRUTH.md` §6 — Six Layers + Layer 5 | Task 1.2 |
| `RNDRNTWRK_CANONICAL_TRUTH.md` §12.5 — new section | Task 1.3 |
| `RNDRNTWRK_CANONICAL_TRUTH.md` §7 — fee-split paragraph | Task 1.4 |
| `RNDRNTWRK_CANONICAL_TRUTH.md` grep-pass | Task 1.5 |
| `docs/sw4p.mdx` — anti-wash ↔ VAP | Task 2.1 |
| `docs/sw4p.mdx` — Earn card | Task 2.2 |
| `docs/products/earn.mdx` NEW FILE | Task 3.1 |
| `docs/docs.json` — nav wiring | Task 3.2 |
| `docs/protocol/roadmap.mdx` — Stage↔Phase mapping | Task 4.1 |
| `docs/protocol/roadmap.mdx` — triple-gate paragraph | Task 4.2 |
| `sw4p-earn/runbooks/sw4p-ecosystem-unified-plan.md` — canonical-design header | Task 6.1 |
| `sw4p-earn/runbooks/decimal-verifier-config.md` — outbound cross-reference | Task 6.2 |
| `sw4p/docs/ARCHITECTURE.md` — reciprocal cross-reference | Task 7.1 |

Manually tick each row. If any row is missing, return to the corresponding task before opening any PRs.

- [ ] **Step 3: One final voice-rule grep across all three repos**

```bash
echo "=== Parent monorepo forbidden vocabulary ==="
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555" && grep -rn -i "yield farming\|stake to earn\|high APY\|DeFi protocol\|bridge fees\|Wormhole NTT\|Circle CCTP\|Hyperlane\|Allbridge\|Trail of Bits\|five independent audits\|11-state machine" RNDRNTWRK_CANONICAL_TRUTH.md docs/products/earn.mdx docs/sw4p.mdx docs/protocol/roadmap.mdx docs/docs.json

echo "=== sw4p-earn forbidden vocabulary in changed runbooks ==="
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.claude/worktrees/wizardly-varahamihira-9e1d58" && grep -n -i "yield farming\|stake to earn\|high APY\|DeFi protocol\|bridge fees\|Trail of Bits\|five independent audits\|11-state machine" runbooks/sw4p-ecosystem-unified-plan.md runbooks/decimal-verifier-config.md

echo "=== sw4p engine forbidden vocabulary in changed architecture ==="
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" && grep -n -i "yield farming\|stake to earn\|high APY\|DeFi protocol\|bridge fees\|Trail of Bits\|five independent audits\|11-state machine" docs/ARCHITECTURE.md
```

Expected: 0 hits across all three sections. (Note: a pre-existing "5 independent security audits" line at the top of `sw4p/docs/ARCHITECTURE.md` is OUT OF SCOPE for Wave G — it predates this work and is tracked under sw4p engine doctrine alignment separately. Do not touch it in Wave G; flag it for the user as a known unrelated issue.)

- [ ] **Step 4: Mintlify CI build (final pre-PR check)**

If the parent monorepo's CI builds the docs site on PR, the PR open in Phase 9 triggers it. If the user wants a local pre-flight:

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs"
npx -y mintlify@latest broken-links 2>&1 | tail -30
```

Expected: 0 broken links involving the new page or the new nav entry.

---

## Phase 9: PR-opening checklist (operator decision point)

**Not committed by this plan — these are the actions the operator takes after self-review and merge approval.**

The Wave G work spans three repos, each with its own PR:

| Repo | Branch | PR title | Notes |
|---|---|---|---|
| Parent 555 monorepo | `docs/wave-g-sw4p-earn-corpus` | `docs(wave-g): pull sw4p Earn into the canonical corpus` | Single PR; squash-merge optional. The four-commit history is reviewable. |
| sw4p-earn | `chore/ecosystem-unified-plan` | (existing chore branch, already open or to be opened — Wave G adds one new commit on top of `9f3f5bdf docs(runbook): sw4p ecosystem unified plan`) | If the chore branch already has a PR, push the new commit; if not, open a single PR for the cross-link headers. |
| sw4p engine | `docs/wave-g-decimal-coherence-crosslink` | `docs(architecture): cross-reference sw4p-earn decimal verifier` | Single-commit PR. |

Per the user's "Review before every merge" hard constraint (see `/Users/mac/.claude/CLAUDE.md`): each PR receives an explicit review pass before `gh pr merge`. No fast-merge, even one-line PRs.

The Wave G implementation plan terminates here. The user reviews, merges in whatever order they prefer (parent monorepo first is the natural choice since the cross-repo PRs cite it), then closes the spec's open question #2 by confirming whether the sw4p-earn and sw4p engine cross-references were folded in (yes — done in Phases 6 and 7).

---

## Self-Review

Per the writing-plans skill `Self-Review` checklist, run against this plan with fresh eyes:

### 1. Spec coverage

Each spec §3 row maps to exactly one task. Checked in Task 8.1 Step 2. All 14 entries covered.

### 2. Placeholder scan

Searched the plan for: "TBD", "TODO", "implement later", "fill in details", "appropriate error handling", "similar to Task N", "for the above". **Zero hits**. Every step contains the exact text to insert and the exact commands to run.

Note: the plan contains one explicit "If the X CLI is not installed, skip this step" caveat in Task 3.2 Step 6 and Task 5.1 Step 6 (the local Mintlify build steps). This is not a placeholder — it's an explicit fallback because the build is also run in CI on PR open. The operator can choose either path.

### 3. Type consistency / naming consistency

| Term | Used consistently |
|---|---|
| `sw4p Earn` (capital E, lowercase sw4p) | All 14 tasks |
| Layer numbering (5 = Yield, 6 = Operations) | Tasks 1.1, 1.2 |
| §12.5 (not §13) | Tasks 1.3, Task 8.1 |
| `docs/products/earn.mdx` (not `docs/earn.mdx` or `docs/products/sw4p-earn.mdx`) | Tasks 3.1, 3.2, 8.1 |
| Branch name `docs/wave-g-sw4p-earn-corpus` (parent monorepo) | Tasks 0.1, 5.1, 8.1, 9 |
| Branch name `chore/ecosystem-unified-plan` (sw4p-earn, pre-existing) | Tasks 6.1, 8.1, 9 |
| Branch name `docs/wave-g-decimal-coherence-crosslink` (sw4p engine) | Tasks 7.1, 8.1, 9 |
| `10/45/45` fee split | Tasks 1.4, 3.1, 8.1 |
| Stage 0/1/2/3, Phase 0/1/2/3/4 | Tasks 4.1, 4.2, 3.1 |
| "routing fees" not "bridge fees" | All product prose |

No drift. The plan does not introduce any type, function, method, or file name that conflicts with an earlier task.

### 4. Commit-message authorship

Searched every `git commit` HEREDOC for: `Co-Authored-By`, `Generated with Claude`, `🤖`, `Anthropic`, `--author`, `GIT_AUTHOR`, `GIT_COMMITTER`. **Zero hits**. Every commit message is body-only and respects the user's HARD authorship constraint.

### 5. Scope discipline

No task introduces:
- New contract scope
- New audit work
- New fee allocation policy
- New operator process beyond what `launch-stage0-readiness.md` already enumerates
- Re-litigation of Stage gates

The plan does NOT spawn a Wave G companion coordination runbook for C-1/C-2/C-3/C-5. Per spec §3 D5 and the user's task brief, those are recorded in the spec for future work and are explicitly out of scope for this plan. If the user wants a coordination runbook produced as a second artifact, that is a separate plan invocation.

### 6. Single open question for the user

The plan execution surfaces one practical question that only the operator can answer:

- **Does the engine-repo `## Security Architecture` header (or closest equivalent) exist at the exact spelling assumed in Task 7.1?** The task includes a fallback ("Place it under the closest semantic match and move on"), but the operator may want to verify the exact section name before merging the engine-side PR. Resolution: run `grep -n '^## ' sw4p/docs/ARCHITECTURE.md` and confirm the target header.

This is not a plan gap — it's a known degree of freedom in the engine repo's section structure.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per Task, review between tasks, fast iteration. Use `superpowers:subagent-driven-development`.

**2. Inline Execution** — execute Tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints (Phase 1, Phase 2, Phase 3, Phase 4, Phase 6, Phase 7 = natural checkpoint boundaries).

Which approach?
