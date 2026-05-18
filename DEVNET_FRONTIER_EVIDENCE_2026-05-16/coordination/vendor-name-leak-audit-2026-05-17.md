# Vendor-name leak audit , 2026-05-17

Read-only audit of the doc corpus and user-facing source against the Track-D brand doctrine. Doctrine sources: `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` line ~1103 (lowercase `ntt` permitted, "Wormhole NTT" / "Hyperlane Warp Routes" forbidden in public copy) and `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` line ~431 ("no vendor names in public copy" load-bearing rule).

Classification key:

1. VENDOR-BRAND-LEAK (public copy, MUST scrub)
2. DOCTRINE-INTERNAL-OK (spec / SOW / TRD / cycle plan / audit, permitted in context)
3. TECHNICAL-LOWERCASE-NTT (lowercase `ntt` reference: supply invariant, decimal verifier, round-trip canary)
4. VENDOR-IN-REJECTION-OK (vendor name inside an explicit rejection paragraph in a spec)

Filenames like `wormhole_ntt.rs`, `hyperlane.rs`, `route_security.rs` and language-internal package names are out of scope (technical identifiers, not public copy).

---

## Section 1: Match index

| File | Line | Snippet | Class |
| --- | --- | --- | --- |
| `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 288 | "no PRIVATE-tier specs (no Wormhole NTT, no Circle CCTP, no Hyperlane, no Allbridge...)" , doctrine self-check checklist | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 751 | "No vendor names from PRIVATE-tier docs (no Wormhole NTT, no Circle CCTP, no Hyperlane, no Allbridge)." , doctrine list | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 1100 | `grep -rn -i "Wormhole NTT\|...\|Hyperlane\|..."` , leak-detection grep command | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 1103 | "...the forbidden form is the vendor branding 'Wormhole NTT'." , doctrine note | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 1395 | Same leak-detection grep command repeated | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 45 | "stale 'Hyperlane Warp Routes' comments" , refers to backend Rust source comments, plan-doc | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 544 | "Task 9: A2/A3 #7 , Update stale 'Hyperlane Warp Routes' doc comments" , plan-doc task heading | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 555 | `grep -nE "Hyperlane Warp Routes\|Hyperlane only\|..."` , leak-detection grep | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 562 | "replace the 'uses Hyperlane Warp Routes' / 'Hyperlane only' prose" , task instruction | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 568 | "CCTP V2 does not cover Starknet and the Hyperlane rail that..." , replacement-comment example for Rust source | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 694 | "fix(backend): purge remaining Hyperlane terminology..." , proposed commit message | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 701 | "(Interchain Security Module) abbreviation is Hyperlane-exclusive" , commit-body rationale | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 703 | "log tags after removing Hyperlane was a vendor-branding leak..." , commit-body rationale | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 708 | "Stale Hyperlane Warp Routes references in starknet_client.rs..." | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 1279 | "A2/A3 stale Hyperlane docs" , task checklist row | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 1315 | PR table entry "A2/A3 (Hyperlane + Wormhole removal)" | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 1347 | Commit log "Hyperlane + Wormhole NTT aspirational rails removed" | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 1348 | Commit log "stale-Hyperlane-doc updates" | 2 |
| `docs/superpowers/plans/2026-05-13-sw4p-pr-hack-fixes.md` | 1350 | "Resolved zksync(master)/hyperlane(HEAD) parallel struct-field removals" | 2 |
| `docs/superpowers/plans/2026-05-11-landing-kit-overview-sections.md` | 257 | "Hyperlane Warp Routes 2.0 + Wormhole NTT corridors" , bullet inside specified On-the-horizon group for landing copy | 1 |
| `docs/superpowers/plans/2026-05-11-landing-kit-overview-sections.md` | 322 | `'Hyperlane Warp Routes 2.0 + Wormhole NTT corridors',` , literal string inside `HORIZON` array of the `OverviewRoadmapSection.tsx` component sketch | 1 |
| `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` | 34 | "Hyperlane+Wormhole NTT removal + `route_security` rename" , engine status row | 2 |
| `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` | 423 | "A2/A3 , Hyperlane + Wormhole NTT removal + unified Starknet gate" , PR table | 2 |
| `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` | 431 | "Hyperlane/Wormhole NTT stripping...honor the canonical-truth 'no vendor names in public copy' rule" , doctrine self-cite | 2 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | 663 | "Wormhole NTT , REJECT , NTT is for project-owned tokens..." | 4 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | 664 | "Hyperlane , REJECT , Solves long-tail-chain reach..." | 4 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | 666 | "LayerZero , REJECT , $292M Kelp exploit..." | 4 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | 667 | "Chainlink CCIP , REJECT for now , conditional future..." | 4 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | 858 | "Wormhole NTT, Hyperlane, zkSync/Starknet, and LayerZero are rejected in §10 and stay rejected." | 4 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | 879 | Research-pass bullet listing "correct removals (Wormhole NTT, Hyperlane, zkSync/Starknet); LayerZero rejection..." | 4 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` | 524 | "Re-adding any rejected rail , Wormhole NTT, Hyperlane, zkSync/Starknet, LayerZero are rejected...Chainlink CCIP is the conditional-future pick..." | 4 |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md` | 37 | Mirror of the SOW non-goal , "Re-adding any rejected rail , Wormhole NTT, Hyperlane, zkSync/Starknet, LayerZero...Chainlink CCIP..." | 4 |
| `docs/superpowers/submission-internal/demo/recording-script.md` | 129 | "CCTP V2 · Kora · Jupiter · Hyperlane · Wormhole · Allbridge" , stack diagram label inside recording script | 1 |
| `docs/superpowers/notes/2026-05-15-sw4p-earn-uniswap-v4-mm-design-intake.md` | 434 | "Chainlink Automation" , keeper-vendor option in MM design intake notes | 2 |
| `docs/superpowers/notes/2026-05-15-sw4p-earn-uniswap-v4-mm-design-intake.md` | 551 | "Gelato vs Chainlink Automation vs OZ Defender vs in-house" , design-intake comparison | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 42 | "Hyperlane: calldata builder only..." , internal status doc | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 43 | "Wormhole NTT: completely non-functional..." | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 64 | "Hyperlane `derive_message_id()` uses `DefaultHasher`..." | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 65 | "Hyperlane `dispatch_message()` returns calldata but never submits" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 66 | "Wormhole NTT: all contract addresses are `\"\"`" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 126 | "Coverage gaps: Hyperlane (untestable as a calldata builder), Wormhole NTT (untestable...)" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 130 | "Hyperlane is calldata only (not live), Wormhole NTT is non-functional..." | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 179 | "(Hyperlane?)" inside ASCII pipeline diagram | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 180 | "(Wormhole?)" inside ASCII pipeline diagram | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 378 | "deBridge, Across, and LayerZero brand themselves" , branding-rationale paragraph | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 403 | "Allbridge: 0 \| Hyperlane: 0 \| Wormhole NTT: 0" , rail-count table | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 415 | D3 task: "Strip vendor names from public copy (Circle, CCTP, Allbridge, Hyperlane, Wormhole NTT, Kora, Jupiter, Pyth)" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 441 | A2 task: "Decide Hyperlane scope" with Hyperlane explorer mention | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 442 | A3 task: "Decide Wormhole NTT scope" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 454 | "Hyperlane/NTT either work or are removed" , internal acceptance | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 456 | "could add 1-2 weeks if Hyperlane is finished" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 458 | "rejected-rail decisions (Hyperlane, Wormhole NTT)...Hyperlane and NTT are rejected..." | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 547 | "A2 Hyperlane decide" , Mermaid/ASCII branch | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 548 | "A3 Wormhole NTT decide" , Mermaid/ASCII branch | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 615 | "CCTP V2 only, Hyperlane/NTT removed" , scenario table | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 616 | "Hyperlane finished and NTT removed" , scenario table | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 664 | R2 risk: "Hyperlane / Wormhole NTT decisions stall everything" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 669 | R7 risk: "Public docs claim things the code doesn't do (Hyperlane, NTT, '5 audits')" | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 676 | "Hyperlane scope decision (A2). Finish it or remove it." | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 677 | "Wormhole NTT scope decision (A3)..." | 2 |
| `sw4p-kit/PLANNING_LOCAL.md` | 691 | "Hyperlane / Wormhole decisions executed" | 2 |
| `sw4p/sw4p-frontend/components/apps/RecycleBin.tsx` | 18 | `{ name: 'Wormhole', icon: '/competitor-icons/wormhole.webp', description: 'Cross-chain messaging', replacedBy: 'SW4P route selection' }` , public UI string in production frontend | 1 |
| `sw4p/sw4p-frontend/components/apps/RecycleBin.tsx` | 19 | `{ name: 'LayerZero', icon: '/competitor-icons/layerzero.webp', description: 'Omnichain interop', replacedBy: 'SW4P settlement engine' }` , public UI string | 1 |

Notes on lowercase-`ntt` (class 3): no class-3 hits were found in the in-scope corpus. Lowercase `ntt` does not appear standalone in any of the public-copy targets (`docs/*.mdx`, landing/console/frontend source, README files, MCP tool descriptions). All `NTT` occurrences in the audit are vendor-branded "Wormhole NTT" in design specs (class 4) or planning docs (class 2). MCP tool descriptions under `sw4p-kit/src/mcp/tools/` returned zero matches for any vendor pattern (clean).

---

## Section 2: Scrub queue (files containing class-1 leaks)

1. `sw4p/sw4p-frontend/components/apps/RecycleBin.tsx` , public frontend UI strings, 2 leaks (lines 18, 19).
2. `docs/superpowers/plans/2026-05-11-landing-kit-overview-sections.md` , landing-copy plan with literal-string code snippets that, if implemented as-written, would land the leak in `OverviewRoadmapSection.tsx`. 2 leaks (lines 257, 322). The current `OverviewRoadmapSection.tsx` source has already been scrubbed; the plan doc is the stale upstream.
3. `docs/superpowers/submission-internal/demo/recording-script.md` , line 129. This is `submission-internal`, but the doc dictates a stack diagram that gets recorded into video/screen output, which is public-facing. Treating as class-1 since it dictates on-screen public copy.

No other class-1 leaks were found in scope.

---

## Section 3: Per-file scrub plan

### 3.1 `sw4p/sw4p-frontend/components/apps/RecycleBin.tsx` (lines 18, 19)

The `RecycleBin` is an XP-themed "competitors replaced by SW4P" feature. The doctrine forbids public vendor branding tied to our own rails (Wormhole/Hyperlane/LayerZero), but the RecycleBin's whole UX premise is to display third-party-vendor logos as items the user "throws away". Two cases need to be distinguished:

- The `Bridges` group lists DeBridge, Wormhole, LayerZero, Across as discrete competitor entries with `replacedBy: 'SW4P ...'`. Wormhole and LayerZero here are *third-party competitor labels*, not internal rail attributions. Under the strict reading of the doctrine, however, this is still public copy that names the vendors we explicitly rejected. Two doctrine-aligned options:

  Option A (preferred, minimal): drop `Wormhole` and `LayerZero` from the `Bridges` array, keep DeBridge and Across (which are not in the rejected-rail list at design-suite §10). Resulting count: 2.

  Option B (preserves UX): re-label without the vendor brand and keep the slot. Replacement copy:
  - `{ name: 'Generic message bridge', icon: '/competitor-icons/generic-bridge.webp', description: 'Long-tail message rail', replacedBy: 'SW4P route security' }`
  - `{ name: 'Omnichain messaging', icon: '/competitor-icons/generic-omnichain.webp', description: 'Generic interop rail', replacedBy: 'SW4P settlement engine' }`

  Recommended: Option A. The "throwing competitors away" frame relies on the named brand being recognisable, so swapping to generic labels destroys the UX premise; the cleanest move is to remove those two rows. Also re-check that `RECYCLE_BIN_ITEM_COUNT` consumers downstream stay consistent (the const is computed from `ALL_ITEMS.length`, so it self-corrects).

### 3.2 `docs/superpowers/plans/2026-05-11-landing-kit-overview-sections.md` (lines 257, 322)

This is an internal landing-copy plan; the bullet is *prescribing* a roadmap entry on the live landing page. The current landing source no longer contains this bullet (verified: `grep` of `OverviewRoadmapSection.tsx`, `TrustSection.tsx`, `KitSection.tsx` returns zero hits), so the leak risk is "future-implementer follows the stale plan and re-adds it".

Replacement copy that preserves the on-horizon technical meaning (long-tail-chain coverage beyond CCTP) without vendor names:

- Line 257 (markdown bullet under "On the horizon"):
  > `- Long-tail-chain message rails beyond the CCTP V2 set`

- Line 322 (literal string in the `HORIZON` array in the component sketch):
  > `'Long-tail-chain message rails beyond the CCTP V2 set',`

Both forms convey "we may extend the rail set past CCTP-covered chains" without naming Hyperlane or Wormhole NTT. Note: the design spec at `2026-05-14-sw4p-frontier-engine-design.md` §10 marks Hyperlane and Wormhole NTT as REJECT for the engine, so the landing bullet should arguably also be dropped entirely rather than rewritten. Recommended: delete both lines outright. Keep the rewrite above only if a future product decision re-introduces a long-tail rail under a different doctrine-compliant brand.

### 3.3 `docs/superpowers/submission-internal/demo/recording-script.md` (line 129)

The diagram bottom row currently reads:

```
CCTP V2 · Kora · Jupiter · Hyperlane · Wormhole · Allbridge
```

This is what gets recorded on screen during the submission video. Doctrine-aligned replacement that preserves the "underlying rails" frame:

```
USDC settlement · Solana gasless · SPL aggregation · cross-chain message · stablecoin corridors
```

This keeps the same six-segment cadence and conveys the same capability surface (Circle CCTP V2, Kora 2.0, Jupiter SPL, Hyperlane-class messaging, Wormhole-class corridors, Allbridge-class corridors) without naming vendors. Alternative tighter form if the diagram is too narrow:

```
USDC rails · gasless execution · SPL output · cross-chain message · corridor coverage
```

If the recording team wants to preserve a "supported integrations" beat, that should go in a separate trust/credits slide that lists Circle and Kora (the two vendors whose branding does survive doctrine, since their products are explicitly trusted upstream dependencies rather than rejected rails) without Hyperlane/Wormhole/Allbridge.

---

## Section 4: Class-2/3/4 references confirmed permitted

- **Wave-G plan (`2026-05-13-sw4p-earn-wave-g-plan.md`):** all 5 hits are class-2. The doc *is* the doctrine source for class-3 (line 1103), and its other hits are the leak-detection grep commands and verification checklists. Permitted.
- **PR-hack-fixes plan (`2026-05-13-sw4p-pr-hack-fixes.md`):** 11 hits, all class-2. The doc plans the scrub of stale Hyperlane Warp Routes comments out of `sw4p-backend/*.rs`; naming the strings being removed inside the plan is unavoidable and stays internal.
- **Unified ecosystem spec (`2026-05-13-sw4p-ecosystem-unified-design.md`):** 3 hits, all class-2. The spec is the doctrine source for §431, and the other two hits are PR-table entries that quote the engine PR title verbatim.
- **Frontier Engine design / SOW / TRD (`2026-05-14-sw4p-frontier-engine-{design,sow,trd}.md`):** 8 hits across the three docs, all class-4. The design spec §10 is the explicit rejection ledger for Wormhole NTT, Hyperlane, LayerZero, Chainlink CCIP; the SOW and TRD cite the rejection in non-goal sections. Doctrine explicitly permits vendor names inside rejection paragraphs in spec context.
- **MM design intake (`2026-05-15-sw4p-earn-uniswap-v4-mm-design-intake.md`):** 2 hits naming "Chainlink Automation" as one of four keeper-sourcing options. Class-2. The doc is a design-intake comparison, not public copy. Permitted in context; flag for re-check if any of this MM intake content gets promoted to a public docs page, the Chainlink mention has to be reframed as "automated keeper" generically.
- **Kit PLANNING_LOCAL (`sw4p-kit/PLANNING_LOCAL.md`):** 22 hits. The filename ends in `_LOCAL` and the file is the kit's internal status / tracking doc. Class-2 throughout. The doc explicitly calls out vendor-name stripping as Track D3, so the references inside it are the *audit subject*, not public copy.
- **MCP tool descriptions (`sw4p-kit/src/mcp/tools/`):** zero hits. Clean. No vendor brand surfaces through the agent-facing tool descriptions; doctrine satisfied.
- **Public docs (`docs/**/*.mdx`):** zero hits across all 66 mdx files for any of the audit patterns. The earlier scrub passes (per `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` Step 4) held.
- **Landing / console / frontend source (`sw4p/sw4p-{landing,console}/src/`, `sw4p/sw4p-frontend/{App.tsx,index.html,types.ts,index.tsx}`):** zero hits outside `RecycleBin.tsx`. The current landing copy and console UI are doctrine-compliant.

---

## Section 5: Edge cases , orchestrator judgment calls

1. `RecycleBin.tsx` (class-1, scrub queue): the "throw competitors in the bin" UX is a recognisable brand-positioning move. The doctrine reading says "no vendor names in public copy" full stop, but the RecycleBin's premise specifically *requires* naming competitors so users see who SW4P replaces. Orchestrator: is the doctrine intent that we should not promote our own rails by name (which would exclude only Wormhole/Hyperlane/LayerZero / CCIP, since those are the *internal-rail* rejects), or is it the broader rule that no third-party brand shows up at all on user-facing surfaces? My read: the doctrine is the narrower internal-rail one, and DeBridge/Across/Jupiter/Stripe in the RecycleBin are fine; only the three that name our own rejected rails (Wormhole, LayerZero) need to come out. Flagging because the strict reading would also pull Jupiter, Uniswap, Raydium, Orca, 1inch, Li.Fi, Paraswap, Matcha, Stripe, DeBridge, Across.

2. `recording-script.md` (class-1, scrub queue): the script is in `submission-internal/`, which the doctrine generally treats as "internal context for the orchestrator". But the script's bottom line is rendered on-screen in a published video, which is public copy by destination even though the file lives in an internal folder. I have classified line 129 as class-1 on the destination basis. Orchestrator: confirm the destination-based classification is what the doctrine intends, or override to class-2 if the line is treated as internal staging that the editor scrubs separately before recording.

3. `2026-05-11-landing-kit-overview-sections.md` (class-1, scrub queue): the plan doc itself is internal, but its embedded literal-string code blocks would re-leak if a future implementer treats this plan as the source of truth. The current `OverviewRoadmapSection.tsx` source is already clean, which means the plan and the code have diverged. Orchestrator: should this plan doc be (a) edited to match the current scrubbed source, (b) marked superseded with a banner, or (c) left alone since the source-of-truth is the engine design spec? My recommendation is (a) + (b): rewrite the two lines per Section 3.2 and add a top-of-file banner noting the plan was scrubbed for doctrine alignment on 2026-05-17.

4. `sw4p-kit/PLANNING_LOCAL.md` line 415 (D3 task): the task itself lists every vendor name that has to be stripped from public copy. This is fine inside the planning doc, but the task list now appears stale because most of the public-copy targets have already been scrubbed (verified: zero mdx hits). Orchestrator may want to mark D3 as DONE-partial and re-scope it to (i) the three remaining class-1 leaks above and (ii) a periodic re-grep against the same pattern set so this audit is not the last verification pass before launch.

5. `sw4p-kit/PLANNING_LOCAL.md` line 378 ("deBridge, Across, and LayerZero brand themselves"): this is a branding-rationale paragraph inside an internal planning doc. The vendor names are used as positioning examples, not as attributions of an internal rail. Class-2 in my read. Edge case because LayerZero is a rejected rail per design-suite §10, so even an internal "look how they brand themselves" reference could be read as forbidden under the strictest reading of doctrine. Recommend leaving as-is; flag if the orchestrator's reading is stricter.
