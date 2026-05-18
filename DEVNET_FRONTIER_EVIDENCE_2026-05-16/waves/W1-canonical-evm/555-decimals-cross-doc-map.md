# 555 token decimals: cross-doc + cross-code map

Audit type: read-only, evidence-only. Authored under Phase H rail audit follow-up
to Section 10 of `rail-scope-doc-audit.md`, which flagged the canonical-truth
(9 decimals) vs ecosystem-design + Wave-G + verifier (6 decimals) contradiction.

Live-mint truth (Domain B's probe) is the deciding input. This document does not
pick a winner. It maps every claim and lays out the conditional edit plan that
both branches would need.

Canonical mint: `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`.

---

## 1. Match index table

| File path | Line | Value | Category | Surrounding context (one-line) |
|---|---|---|---|---|
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md` | 543 | 9 | doc (canonical truth) | `- **Supply:** 1,000,000,000 (fixed, 9 decimals)` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/tokenomics/555-token.mdx` | 14 | 9 | doc (public tokenomics) | `**Contract:** CQww...AF2 ... **Network:** Solana (SPL) ... **Decimals:** 9` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` | 131 | 6 | doc (ecosystem design) | `sw4p-earn's decimal verifier ... checks $555 = 6 decimals canonical across Solana mint, EVM ERC-20, NTT manager, ...` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` | 135 | 6 (implicit) | doc (ecosystem design) | `runbooks/decimal-verifier-config.md: ... the verifier here covers $555 decimals on every surface ...` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` | 136 | 6 (implicit) | doc (ecosystem design) | `sw4p-pro/docs/ARCHITECTURE.md: Decimal coherence on the $555 token across NTT, EVM ERC-20, pools, vaults, and dashboard ...` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 653 | 6 | doc (Wave G plan, Key Facts) | `**Decimals** $555 is 6 decimals canonical across Solana mint, EVM ERC-20, every NTT manager, pools, vaults, and dashboard.` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 1206 | 6 | doc (Wave G plan, Task 6.2 body) | `The decimal verifier ... asserts that every $555 token deployment on every chain reports the same number of decimals as the canonical Solana mint (6 ...)` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 1214 | 6 | doc (Wave G plan, Task 6.2 patch) | duplicate of 1206 inside the proposed-content block |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 1306 | 6 | doc (Wave G plan, Task 7.1 patch) | `Decimal coherence on $555 ... gates CI when any surface drifts from the canonical 6-decimal target.` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/products/earn.mdx` | 29 | 6 | doc (public earn product) | `**Decimals** $555 is 6 decimals canonical across Solana mint, EVM ERC-20, every NTT manager, pools, vaults, and dashboard.` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/rail-scope-doc-audit.md` | 226, 231, 237, 341 | (records both) | doc (audit log) | flags the 9-vs-6 contradiction explicitly; not itself a claim, an observation |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/token_burn_verify.rs` | 25 | 6 | code (Rust constant) | `const TOKEN_555_DECIMALS: u32 = 6;` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/token_burn_verify.rs` | 472-473 | 6 | code (Rust test) | `fn test_token_555_decimals() { assert_eq!(TOKEN_555_DECIMALS, 6); }` |
| `.claude/worktrees/agent-a64cbb09eabe2bf05/sw4p-earn/config/decimal-verifier.example.json` (and identical copies in `agent-a8571ba151e2075c4`, `agent-af463fe3340ec0d16`, `agent-ad7eb8ad2db1e5c72`, `agent-aa6ec08b81916b7fd`, `agent-a8483dbd29f4d334a`, etc.) | 2-3 | 6 | code (verifier config example) | `Canonical $555 SPL mint is CQww...AF2 with 6 decimals (verified in sw4p-backend/src/token_burn_verify.rs:24-25). The SW4P Earn TRD §6 assumed 9 decimals; the implementation aligns to the on-chain truth (6) per plan §FR-001 'chain-verified decimals'. ... "expectedDecimals": 6` |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.local-secrets/decimal-verifier-dev.json` | 3 | 6 | code (local dev secret) | `"expectedDecimals": 6` (+ multiple per-surface `"expectedDecimals": 6` in stakingVaults / rewardsDistributor / dashboardSurfaces / burnExecutor sub-objects) |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.local-secrets/decimal-verifier-real-base-sepolia.json` | 2 | 6 | code (local real-Base-Sepolia secret) | `"expectedDecimals": 6` |
| `.claude/worktrees/agent-a64cbb09eabe2bf05/sw4p-earn/services/decimal-verifier/src/index.ts` (and the dist twin) | 26 | comment says 9 | code (verifier source, stale comment) | `expectedDecimals: Decimals;        // Canonical $555: 9` , stale code comment that contradicts every JSON config the same service consumes |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/contracts/src/EVM555Token.sol` | 27 | 6 | code (Solidity constant) | `uint8 private constant _DECIMALS = 6;` |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/contracts/src/EVM555Token.sol` | 23-24 | 6 | code (Solidity NatSpec) | `NTT serializes amounts as TrimmedAmount{ ... uint8 decimals } with decimals = min(tokenDecimals, 8). With 6 decimals there is no [trimming dust]` |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/contracts/test/EVM555Token.t.sol` | 20-21 | 6 | code (Solidity test) | `function test_decimalsArePinnedTo6() public view { assertEq(token.decimals(), 6); }` |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/ntt/topology.example.yaml` | 26 | 6 | code (NTT topology) | `decimals: 6     # canonical SPL mint` (preceded by 17-18 NatSpec on `decimals = min(tokenDecimals, 8)`) |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/runbooks/decimal-verifier-config.md` | 3 | 6 | doc (runbook) | `... reports the same number of decimals as the canonical Solana mint (6 - see docs/skills/decimal-truth.md)` |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/runbooks/decimal-verifier-config.md` | 14, 130 | 6 | doc (runbook examples) | `"expectedDecimals": 6,` |
| `.claude/worktrees/agent-a41d2847a8f56b48a/sw4p-earn/docs/skills/decimal-truth.md` (and copies in agent-af463fe3340ec0d16, agent-a61ca02bcea9a9b27, agent-a31142b7d6bef16b8, agent-ad8203154b575009d, agent-afe04ec3646184430, agent-a08db544ca9581d18) | 1, 13, 18 | 6 | doc (sw4p-earn skill) | `# Decimal truth: $555 is **6**, not 9 ... const TOKEN_555_DECIMALS: u32 = 6; ... **Canonical $555 is 6 decimals.** The plan TRD §6 was wrong; the plan §FR-001 ("chain-verified decimals") explicitly says the chain wins, so we align to 6.` |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/pool-tvl.anvil.test.js` | 154, 189, 191 | 6 | code (indexer test fixture) | `// Mint tokens directly to the synthetic pool: 1,000,000 of each (6 decimals). ... [token555.toLowerCase()]: { decimals: 6, ... }` |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/lp-snapshot.js` | 58 | 6 (default) | code (indexer) | `const t555Decimals = this.cfg.token555Decimals ?? 6;` |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/pol-state.js` | 32 | 6 (default) | code (indexer) | `const dec = this.cfg.token555Decimals ?? 6;` |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/pol-state.anvil.test.js` | 74 | 6 | code (indexer test fixture) | `priceToken555Usd: 0.01, token555Decimals: 6,` |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/dashboard-api/dist/composition.js` | 42 | 6 | code (dashboard API) | `[cfg.contracts.evm555Token.toLowerCase()]: { decimals: 6, priceUsd: 0, symbol: "555" }` |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/quote-engine/dist/index.js` | 80 | 9 | code (quote-engine, stale assumption) | `return 250000000000n; // assumes 9 decimals; ~250e9 units` |

(Notes: the agent worktrees are pinned snapshots of `sw4p-earn` under `.claude/worktrees/`. The same file content recurs across multiple agent-* worktree IDs; only the live worktree (`wizardly-varahamihira-9e1d58`) and one canonical agent worktree (`agent-ad7eb8ad2db1e5c72`, used here because it carries both the runbook and the contracts source) are cited per file. The other worktree copies are byte-identical clones.)

---

## 2. Group by claimed value

### Claims that $555 is 9 decimals

| File | Line(s) | Count |
|---|---|---|
| `RNDRNTWRK_CANONICAL_TRUTH.md` | 543 | 1 |
| `docs/tokenomics/555-token.mdx` | 14 | 1 |
| `.claude/worktrees/.../sw4p-earn/services/decimal-verifier/src/index.ts` (stale code comment) | 26 | 1 |
| `.claude/worktrees/.../sw4p-earn/services/quote-engine/dist/index.js` (stale code comment + magic number) | 80 | 1 |
| `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md` | , | 0 |

Total direct doc-level "9 decimals" claims: **2** (canonical truth + public tokenomics doc).
Total code-level "9 decimals" residue: **2 stale comments** (no executable constant equals 9 anywhere; the `quote-engine` magic number `250_000_000_000n` is a value comment, not a `decimals = 9` constant).

### Claims that $555 is 6 decimals

| File | Line(s) | Count |
|---|---|---|
| `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` | 131, 135, 136 | 3 |
| `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` | 653, 1206, 1214, 1306 (+ many indirect references at 43, 49, 265, 288, 1216, 1332, 1335, 1395) | 4 explicit, ~10 indirect |
| `docs/products/earn.mdx` | 29 | 1 |
| `sw4p/sw4p-backend/src/token_burn_verify.rs` | 25, 230, 331, 415, 472-473, 532, 534, 549, 562, 580 | 1 const + ~9 use-sites + test |
| `.claude/worktrees/.../sw4p-earn/config/decimal-verifier.example.json` (and every per-agent worktree clone) | 2-3 | 1 per worktree clone (~30 total) |
| `.local-secrets/decimal-verifier-dev.json` | 3 + per-surface fields | 5+ |
| `.local-secrets/decimal-verifier-real-base-sepolia.json` | 2 + per-surface fields | 3+ |
| `.claude/worktrees/.../sw4p-earn/contracts/src/EVM555Token.sol` | 23, 24, 27 | 1 const + NatSpec |
| `.claude/worktrees/.../sw4p-earn/contracts/test/EVM555Token.t.sol` | 20-21 | 1 test |
| `.claude/worktrees/.../sw4p-earn/ntt/topology.example.yaml` | 18, 26 | 1 |
| `.claude/worktrees/.../sw4p-earn/runbooks/decimal-verifier-config.md` (and per-agent worktree clones) | 3, 14, 130, 131, 144, 146 | many per clone |
| `.claude/worktrees/.../sw4p-earn/docs/skills/decimal-truth.md` (and per-agent worktree clones) | title, 13, 18, 26, 27 | many per clone |
| `.claude/worktrees/.../sw4p-earn/services/indexers/dist/*.js` (lp-snapshot, pol-state, pool-tvl tests) | 58, 32, 74, 154, 189, 191 | 6 |
| `.claude/worktrees/.../sw4p-earn/services/dashboard-api/dist/composition.js` | 42 | 1 |

Total direct doc-level "6 decimals" claims: **8** (3 ecosystem-design + 4 Wave-G + 1 earn product), plus the multiplied skill / runbook copies across agent worktrees.
Total code-level "6 decimals" anchors (executable): **8 distinct surfaces** (Rust burn-verify const, verifier JSON configs, EVM555 Solidity const, EVM555 Solidity test, NTT topology yaml, indexer defaults, dashboard-api literal, local-secrets configs).

### Direction summary

- Every executable code path that has a hard-coded value picks **6**.
- Every doc that is operationally downstream of code (verifier runbook, decimal-truth skill, ecosystem design, Wave G plan, public earn product) picks **6**.
- Every doc that is operationally upstream of code (canonical truth manifest, public tokenomics page) picks **9**.
- The lone "9" inside source (decimal-verifier `index.ts` line 26 comment) and the lone "9" inside dist (quote-engine line 80 magic-number comment) are stale residue from when the SW4P Earn TRD §6 still assumed 9. The verifier config example explicitly calls this out: "The SW4P Earn TRD §6 assumed 9 decimals; the implementation aligns to the on-chain truth (6) per plan §FR-001 'chain-verified decimals'."

---

## 3. Per-doc verdict

### `RNDRNTWRK_CANONICAL_TRUTH.md` , verdict: **9 decimals**

Most load-bearing line:

```
/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md:543: - **Supply:** 1,000,000,000 (fixed, 9 decimals)
```

Context: Section 14, "$555 , The Coordination Token", "Technical Details" block. This is the canonical-truth manuscript's only mention of decimals and it is in the field that any downstream consumer would read first. Single-statement camp anchor on the 9-decimal side.

### `docs/tokenomics/555-token.mdx` , verdict: **9 decimals**

Most load-bearing line:

```
docs/tokenomics/555-token.mdx:14: **Contract:** `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2` · **Supply:** 1,000,000,000 (fixed) · **Distribution:** 92% public · 8% team (5-year lock) · **Network:** Solana (SPL) · **Decimals:** 9
```

Context: The public Mintlify tokenomics page's `<Info>` callout. Public-facing.

### `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` , verdict: **6 decimals**

Most load-bearing line:

```
docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md:131: sw4p engine asserts USDC = 6 decimals canonical (engine-internal). sw4p-earn's decimal verifier (PRs #5/#14/#15) checks `$555 = 6 decimals` canonical across Solana mint, EVM ERC-20, NTT manager, Uniswap V3 pools, staking vault, rewards distributor, dashboard literals, burn-executor constants, routing constants.
```

### `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` , verdict: **6 decimals**

Most load-bearing line (Key Facts table):

```
docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md:653: | **Decimals** | `$555` is 6 decimals canonical across Solana mint, EVM ERC-20, every NTT manager, pools, vaults, and dashboard. Enforced by a runtime decimal verifier in CI. |
```

### `docs/products/earn.mdx` , verdict: **6 decimals**

Most load-bearing line: identical phrasing on line 29 (public product page; mirrors Wave G Key Facts).

### `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-{design,sow,trd}.md` and `2026-05-16-sw4p-devnet-frontier-execution-design.md` , verdict: **silent**

No 555-decimal claim. Scope is the sw4p engine (USDC settlement), not the $555 token.

### `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md` , verdict: **silent**

No 555-decimal claim.

### `docs/superpowers/plans/2026-05-11-*.md` (`landing-kit-overview-sections.md`, `sw4p-kit*.md`) , verdict: **silent**

No 555-decimal claim.

### `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/rail-scope-doc-audit.md` , verdict: **records both, flags contradiction**

The audit log itself (Section 10, lines 226-237 and 341) explicitly records: "canonical truth says $555 is 9 decimals, while every other cycle doc says $555 is 6 decimals canonical. This is a real contradiction that the rest of the corpus does not flag." This is the file that triggered the present cross-doc map.

### sw4p-earn skill `docs/skills/decimal-truth.md` , verdict: **6 decimals**

This doc is itself a remediation artifact. Its title is `# Decimal truth: $555 is **6**, not 9` and it is the most explicit anti-9 statement in the corpus. Line 18: "Canonical $555 is 6 decimals. The plan TRD §6 was wrong; the plan §FR-001 ('chain-verified decimals') explicitly says the chain wins, so we align to 6."

### sw4p-earn runbook `runbooks/decimal-verifier-config.md` , verdict: **6 decimals**

Line 3: "asserts that every $555 token deployment on every chain reports the same number of decimals as the canonical Solana mint (6 - see docs/skills/decimal-truth.md)."

---

## 4. Recommended Phase H.0 edit plan (conditional on Domain B's live probe)

Both branches are listed. Pick one based on Domain B's RPC probe result. Edits are listed upstream-first, then downstream.

### Branch A: live mint = 9 (canonical truth is correct, code + ecosystem-design + Wave G are wrong)

Edit upstream code/config first, since these gate Phase H.1 deploys. Then downstream docs.

1. **`/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/token_burn_verify.rs:25`**: `const TOKEN_555_DECIMALS: u32 = 6;` → `9`. Also update test at line 472-473 (`test_token_555_decimals` assertion) and any divisor comments at lines 230, 331, 415, 532, 534, 549, 562, 580.
2. **`.claude/worktrees/<active-sw4p-earn>/contracts/src/EVM555Token.sol:27`**: `_DECIMALS = 6` → `9`. Update NatSpec on lines 23-24 to drop the "with 6 decimals there is no trimming dust" claim (since at 9 decimals NTT trims to 8, losing the last digit per hop).
3. **`.claude/worktrees/<active-sw4p-earn>/contracts/test/EVM555Token.t.sol:20-21`**: rename `test_decimalsArePinnedTo6` to `test_decimalsArePinnedTo9` and update the assertion.
4. **`.claude/worktrees/<active-sw4p-earn>/ntt/topology.example.yaml:26`**: `decimals: 6` → `decimals: 9`. Update header comment block at lines 17-18 to reflect NTT trim impact.
5. **`.claude/worktrees/<active-sw4p-earn>/config/decimal-verifier.example.json:3`**: `"expectedDecimals": 6` → `9`. Also rewrite the `$comment` field at line 2 (currently asserts on-chain truth is 6).
6. **`/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.local-secrets/decimal-verifier-dev.json` + `.local-secrets/decimal-verifier-real-base-sepolia.json`**: `"expectedDecimals": 6` → `9` everywhere (top-level + per-surface fields in stakingVaults, rewardsDistributor, dashboardSurfaces, burnExecutor).
7. **`.claude/worktrees/<active-sw4p-earn>/services/indexers/dist/*.js`**: change the `?? 6` defaults to `?? 9` in `lp-snapshot.js:58` and `pol-state.js:32`. Update `pool-tvl.anvil.test.js` fixtures and `pol-state.anvil.test.js:74`.
8. **`.claude/worktrees/<active-sw4p-earn>/services/dashboard-api/dist/composition.js:42`**: `decimals: 6` → `9`.
9. **`.claude/worktrees/<active-sw4p-earn>/docs/skills/decimal-truth.md`**: full rewrite , invert the title, swap the 6/9 columns in the comparison table, flip the FR-001 framing.
10. **`.claude/worktrees/<active-sw4p-earn>/runbooks/decimal-verifier-config.md`**: lines 3, 14, 130, 144, 146 , flip 6→9.
11. **`docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md:131`**: change `$555 = 6 decimals` → `$555 = 9 decimals`.
12. **`docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md`**: lines 653, 1206, 1214, 1306 , flip 6→9 (note: line 1216 about "USDC discipline (6 decimals canonical)" stays , that's USDC, not $555).
13. **`docs/products/earn.mdx:29`**: same Key Facts flip.

Canonical truth and the public tokenomics page (`docs/tokenomics/555-token.mdx:14`) require **no edit** under Branch A.

### Branch B: live mint = 6 (ecosystem-design + Wave G + code are correct, canonical truth + public tokenomics are wrong)

Edit upstream docs first, since these are the source-of-truth manuscripts that other consumers cite. Downstream code/config is already correct.

1. **`/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md:543`**: `1,000,000,000 (fixed, 9 decimals)` → `1,000,000,000 (fixed, 6 decimals)`.
2. **`/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/tokenomics/555-token.mdx:14`**: `**Decimals:** 9` → `**Decimals:** 6`.
3. **`.claude/worktrees/<active-sw4p-earn>/services/decimal-verifier/src/index.ts:26`**: stale comment `// Canonical $555: 9` → `// Canonical $555: 6`. Rebuild dist.
4. **`.claude/worktrees/<active-sw4p-earn>/services/quote-engine/dist/index.js:80`**: stale comment `// assumes 9 decimals; ~250e9 units` either gets removed or recomputed for 6. If the magic number `250000000000n` was sized for 9-decimal units, the underlying calculation needs reaudit , flag for Phase H.1.

All other 6-claims are already coherent under Branch B.

### Common shared work (both branches)

- Reconcile `docs/superpowers/audits/.../rail-scope-doc-audit.md` Section 10 once the decision is made: update the contradiction note to a resolution note. (Audit logs are append-only by convention , write a follow-up evidence note rather than edit in place.)
- Audit `quote-engine` magic number `250000000000n` regardless of which branch , its assumption needs to match whichever value is canonical.

---

## 5. Source-code constants (Phase H.1 implementation gates)

These are the files where a non-doc, executable value is hard-coded. Each line must be touched if the canonical decimal changes; each is independently a deploy-truth surface.

| File:line | Language | Constant or expression | Value |
|---|---|---|---|
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/token_burn_verify.rs:25` | Rust | `const TOKEN_555_DECIMALS: u32` | **6** |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/token_burn_verify.rs:472-473` | Rust (test) | `assert_eq!(TOKEN_555_DECIMALS, 6)` | **6** |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/contracts/src/EVM555Token.sol:27` | Solidity | `uint8 private constant _DECIMALS` | **6** |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/contracts/test/EVM555Token.t.sol:21` | Solidity (test) | `assertEq(token.decimals(), 6)` | **6** |
| `.claude/worktrees/agent-ad7eb8ad2db1e5c72/sw4p-earn/ntt/topology.example.yaml:26` | YAML | `decimals: 6` | **6** |
| `.claude/worktrees/agent-a64cbb09eabe2bf05/sw4p-earn/config/decimal-verifier.example.json:3` | JSON (+ many agent-* clones) | `"expectedDecimals": 6` | **6** |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.local-secrets/decimal-verifier-dev.json:3` (+ embedded per-surface fields) | JSON | `"expectedDecimals": 6` | **6** |
| `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.local-secrets/decimal-verifier-real-base-sepolia.json:2` (+ embedded per-surface fields) | JSON | `"expectedDecimals": 6` | **6** |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/lp-snapshot.js:58` | JS (default) | `this.cfg.token555Decimals ?? 6` | **6** (default fallback) |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/pol-state.js:32` | JS (default) | `this.cfg.token555Decimals ?? 6` | **6** (default fallback) |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/dashboard-api/dist/composition.js:42` | JS (literal) | `decimals: 6` | **6** |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/pool-tvl.anvil.test.js:154,189,191` | JS (test fixture) | `decimals: 6` | **6** |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/indexers/dist/pol-state.anvil.test.js:74` | JS (test fixture) | `token555Decimals: 6` | **6** |
| `.claude/worktrees/agent-a64cbb09eabe2bf05/sw4p-earn/services/decimal-verifier/src/index.ts:26` | TS (stale comment) | `// Canonical $555: 9` | **9 in comment only**; actual runtime value flows from `VerifierConfig.expectedDecimals` (JSON, = 6). The comment is dead. |
| `.claude/worktrees/wizardly-varahamihira-9e1d58/sw4p-earn/services/quote-engine/dist/index.js:80` | JS (magic number + comment) | `return 250000000000n; // assumes 9 decimals; ~250e9 units` | **9 assumed**; needs reaudit independently of which branch is picked. |

Total distinct executable surfaces with a hard-coded 555 decimals value: **8** (Rust const, Solidity const, NTT yaml, two local-secrets JSONs, two indexer defaults, dashboard-api literal). The verifier config example JSON in the agent worktrees is the same surface multiplied across worktree clones , counted once. The Solidity test, Rust test, and indexer test fixtures are dependent assertions on the constants and would update together. Two stale comments (`decimal-verifier/src/index.ts:26` and `quote-engine/dist/index.js:80`) are not executable values but flag for cleanup.

### Phase H.1 gating order

1. The Rust const in `sw4p-backend/src/token_burn_verify.rs:25` is the most-load-bearing single line; the burn-executor path divides by `10^TOKEN_555_DECIMALS` to produce token-amount math at runtime. Drift here mis-prices every burn.
2. The Solidity `_DECIMALS = 6` constant in `EVM555Token.sol:27` is the on-chain immutable for every future EVM deployment. Drift here is unrecoverable post-deploy.
3. The NTT topology yaml is what wires the cross-chain transfer manager and must match (1) and (2).
4. The verifier configs (example + .local-secrets) are the CI gate that asserts (1), (2), (3) match the live SPL mint and every EVM ERC-20.

These four are the load-bearing gates. Indexer defaults, dashboard literals, and quote-engine magic numbers are downstream and would catch any upstream drift via the verifier's `dashboardSurfaces`, `burnExecutor`, and `routing` checks.
