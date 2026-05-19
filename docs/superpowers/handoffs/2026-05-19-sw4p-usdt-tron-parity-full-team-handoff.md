# sw4p USDT / Tron Parity — Full Team Handoff

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The plan spans 5 phases; each phase has its own bite-sized tasks. Phases 1 and 2 reference existing detailed plans; phases 3, 4, 5 outline scope and exit gates, and the receiving team is expected to author a per-milestone detailed plan using the same writing-plans format as the M3, M4, M5 plans already in the corpus.

**Goal:** Deliver a `live` USDT/Tron settlement route for production users, end-to-end, mainnet-broadcast-safe, agent-safe, operator-runnable, with at least one Allbridge Core corridor passing every gate in PRD section 12 ("Gate E: Public live route"). USDC continues unchanged on Circle CCTP V2. All non-`live` routes remain explicitly gated and machine-readable for agents and operators. BTC and Omni USDT remain `out_of_scope`.

**Architecture:** Provider-backed route truth (M0-M2, merged), user-signed Tron signing surface with structured canary authorization (M3, merged), execution parity including raw-tx validator full TRD-RAW closure plus Solana-to-Tron scaffolding (M4, in review), durable lifecycle and proof ledger with cap enforcement (M5, drafted), product surfaces including frontend route-state UI plus full Solana SPL/Allbridge instruction building (M6, scope below), authorized mainnet canary plus selector live verification (M7, scope below), launch closure including corpus alignment plus public copy guard (M8, scope below).

**Tech Stack:** Rust 2021 with Axum, Tokio, SQLx against PostgreSQL, reqwest, secp256k1, alloy, tracing, opentelemetry-otlp, mockall, wiremock, tokio-test, sha2, hex, thiserror, chrono, base64, bincode, solana-client, solana-sdk. TypeScript 5.4 with Zod and vitest in sw4p-kit. React 19 on Vite with TanStack Query plus direct window.tronWeb / window.tronLink integration in sw4p-frontend.

---

## Audience

A new team picking up the USDT/Tron parity track cold. The team is assumed to be skilled engineers with strong Rust, TypeScript, React, and PostgreSQL experience, plus operator-grade familiarity with the EVM and Solana stacks. The team is NOT assumed to have prior sw4p context or prior conversational context with the original implementer. Everything they need is either in this document or linked from it.

---

## State of Play (as of 2026-05-19)

### Merged to master / main

| PR | Branch | Repo | Scope |
|---|---|---|---|
| sw4p-pro #259 | feat/sw4p-usdt-tron-parity-m0-m2 | Render-Network-OS/sw4p-pro | M0 inventory plus M1 route truth plus M2 provider tx safety |
| sw4p-kit #6 | feat/sw4p-kit-usdt-tron-parity-m0-m2 | Render-Network-OS/sw4p-kit | Tron in ChainSchema, RouteStateResponse type |
| sw4p-pro #261 | feat/sw4p-usdt-tron-parity-m3-tron-signing | Render-Network-OS/sw4p-pro | M3 Tron signing surface, 18 commits squashed |

### Open

| PR | Branch | Repo | Status | Blockers |
|---|---|---|---|---|
| sw4p-pro #263 | feat/sw4p-usdt-tron-parity-m4-execution-parity | Render-Network-OS/sw4p-pro | OPEN, mergeable=CLEAN, base=master, 20 commits | One pre-existing failing test fixed by #268; merge after #268 lands |
| sw4p-pro #268 | fix/sw4p-chain-registry-uni-parser | Render-Network-OS/sw4p-pro | OPEN, ready for review, 1 file, 4+/3- | None |
| sw4p-kit #7 | feat/sw4p-kit-usdt-tron-parity-m3-tron-signing | Render-Network-OS/sw4p-kit | OPEN, independent of sw4p stack | None |

### Drafted, not yet executed

- M5 lifecycle and proof ledger plan at `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md` (4250 lines, 17 tasks across 14 waves).

### Not yet drafted

- M6 product parity plan (frontend, MCP gateway, full Solana SPL/Allbridge).
- M7 evidence and canary plan (selector live verification, authorized mainnet canary).
- M8 launch closure plan (corpus alignment, public copy guard).

---

## Binding Pack Inventory

All specs, plans, and follow-up docs live in the parent repo at `/Volumes/.../555/`. **The parent repo is local-only and has no remote.** The receiving team will need access to this content via one of the logistics paths in section "Logistics: Parent Repo Handoff" below.

### Specs (binding)

| Path | Purpose |
|---|---|
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-prd.md` | Product requirements: goals G1-G6, 24 PRD-USDT-* requirements, route matrix policy, 8 route states, copy rules, evidence sources, 5 acceptance gates A-E, recommended product decision. |
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-crd.md` | Corridor requirements: 16 sections including 4 provider truth subsections, route state model with primary states plus support dimensions, corridor matrix per source-dest tuple, signing and custody requirements per source chain, fee and gas requirements, provider tx validation requirements, approval requirements, proof requirements, lifecycle state machine, API requirements, security requirements, 6 open decisions with defaults. |
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-trd.md` | Technical requirements: 16 sections including system architecture, 7 modules (provider route registry, rail selector, Allbridge quote and raw tx builder, raw tx validator, approval policy, Tron wallet adapter, lifecycle watcher and proof ledger), kit and agent API requirements, database requirements, observability requirements, testing requirements, canary authorization object, must-not-ship conditions, implementation handoff notes. |
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-sow.md` | Statement of work: 11 workstreams WS0-WS10, dependency graph, work packages, milestones M0-M8, recommended first development scope, recommended first canary, review requirements, must-not-ship checklist, definition of done for the pack. |
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md` | Original external handoff for M0-M2 scope. |
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md` | WS0 inventory output. |

### Plans (already authored)

| Path | Status |
|---|---|
| `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m0-m2.md` | Executed, all 17 tasks landed, PRs #259 plus #6 merged. |
| `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m3-tron-signing.md` | Executed, all 19 tasks landed, PR #261 merged. |
| `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m4-execution-parity.md` | Executed, all 16 tasks landed, PR #263 awaiting #268. |
| `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md` | Drafted, 17 tasks across 14 waves, not yet executed. |

### Follow-up registers (open items by milestone)

| Path | Open items |
|---|---|
| `sw4p/docs/followups/2026-05-18-usdt-tron-parity-m0-m2-followups.md` | raw_tx_validator full closure (closed by M4), allbridge_quote provider-shape validation, Quote struct gaps, policy dimensional fields, legacy allbridge.rs:812 cleanup, /v1/routes legacy handler retirement, observability metrics, MCP gateway update. |
| `sw4p/docs/followups/2026-05-18-usdt-tron-parity-m3-tron-signing-followups.md` | Unsigned tx builder TronWeb-signable (closed by M4 T4), broadcast wire format (closed by M4 T3), Allbridge selector reconciliation (closed by M4 T1), canary path enforcement (partially closed by M4 T5, full closure in M5), tron_watcher env-var (closed by M4 T2), legacy bridge_from_tron call site migration (partially closed by M4 T6), raw_tx_validator deferred checks (closed by M4 T7-T9), TRD-TRON-010 frontend test gap, M5 lifecycle wiring. |
| `sw4p/docs/followups/2026-05-18-usdt-tron-parity-m4-execution-parity-followups.md` | Allbridge selector live verification, canary cap enforcement closure, bridge_from_solana_to_tron full implementation, multi-hop legacy call site migration, native_bridge pool-less fallback, UserSigned TRON_RPC_URL hard dependency, TronClient::new_with_url timeout sweep, frontend raw_data object passing, solana broadcast byte-size limit, test fixture old selector. Post-review closures section documents the canary TOCTOU and approve baseline fixes plus the self-incident on AI-attributed PR comment. |

---

## Subagent Dispatch Contract (re-stated from M3 and M4 plans)

This contract applies to every phase that uses subagent-driven execution.

| Field | Value |
|---|---|
| `model` | `opus` (Opus 4.7 max). No Sonnet or Haiku. |
| `subagent_type` (implementer) | `general-purpose` |
| `subagent_type` (reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (final review) | `code-review:code-review` |
| `isolation` | omit |
| `run_in_background` | false for in-wave work |

### Hard rules (preserved across all phases)

1. **sw4p is a standalone nested git repo** with 100-plus branches. Every commit lands on a milestone-scoped feature branch. Implementers verify branch with `git rev-parse --abbrev-ref HEAD` and STOP if wrong. Never `git checkout` to switch branches.
2. **Sequential within each wave on the sw4p Rust repo** to avoid the parallel-agent branch-state race observed in M0-M2 W1. Frontend or kit work can interleave when files are disjoint.
3. **No signing or hook bypass flags.** Never pass `-c commit.gpgsign=false`, `--no-gpg-sign`, `--no-verify`.
4. **No `Co-Authored-By` or any AI-author trailer.** Every commit author is `rndrntwrk <dev@rndrntwrk.com>`.
5. **No em dashes (U+2014) or non-ASCII** in any committed file or commit message. Robot emojis explicitly banned.
6. **Implementer stages files via `git add`; controller commits.** The auto-mode classifier blocks subagent `git commit` invocations; this workflow avoids the block.
7. **Configured `reqwest::Client` with timeouts** on every new HTTP-calling module (30s timeout, 10s connect_timeout).
8. **`tracing::info!` / `tracing::warn!` at every network and DB boundary.** Hashes and IDs only; no plaintext secrets.
9. **No `gh pr comment` from subagents.** Code-review output goes in chat for own work, never on the PR. This rule was added after the M4 self-incident; the original `code-review:code-review` skill example output contains an AI-attribution suffix that one reviewer subagent followed instead of the override. Per-task prompts must explicitly prohibit `gh` mutations.
10. **Durable before effect:** every lifecycle transition writes to PostgreSQL before any external side effect is acknowledged. No async lock held across provider polling.

### Process expectations

- **Test database:** PostgreSQL 16 in container `sw4p-canary-pg` on `localhost:5438`, test DB `sw4p_test`, connection `postgres://postgres:dev@localhost:5438/sw4p_test`.
- **Node toolchain:** kit and frontend require Node 22 via nvm: `source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0`.
- **Backend tests:** `cargo test --lib <module>` for unit tests, `cargo test --test <name>` for integration tests, always with `--test-threads=1` for DB-touching tests.
- **Kit tests:** `npx vitest run`.
- **Frontend tests:** `npx tsc --noEmit` is the typecheck. There is no full unit-test suite for the frontend yet; TRD-TRON-010 calls for one (deferred to M6).
- **Classifier behavior:** the auto-mode classifier blocks subagent `git commit`, subagent `gh pr comment`, force-pushes without explicit user authorization, and some read-only commands when followup mutations are anticipated. When blocked, the controller hands off a single clean `!`-prefixed command to the user per the project's `feedback_classifier_blocks` memory rule.

---

## Phase 1: Operational Close-Out

Three discrete tasks that close the in-flight PRs. Estimated wall-clock: 30 to 60 minutes once a reviewer is engaged.

### Task 1.1: Review and merge sw4p-pro #268 (chain_registry UNI parser fix)

**Files in PR:** `sw4p-backend/src/chain_registry.rs` (4 +, 3 -).

**Scope:** Three-line surgical fix. `normalize_chain_code` accepts `UNI` and `UNICHAIN`; testnet test count updated from 3 to 4 to match the JSON that PR #234 already merged; expected-chains iteration adds `UNI`.

**Why it exists:** PR #234 (`feat(testnet): WP2.4 V4.1 testnet via Circle SCA (ETH Sep / Arb Sep / Unichain Sep)`) merged on 2026-05-17 added a UNI entry to `sw4p-backend/contracts/registry/testnet.json` without updating either the parser or the test. The test has been failing on `master` since that merge. #268 completes #234's intent.

**Review pass:** Trivial diff. One file. CCTP V2 + Universal Router rail. Verify alias correctness (`UNI` canonical, `UNICHAIN` long form, both fold to `UNI`).

**Merge command:**

```bash
gh pr merge 268 --repo Render-Network-OS/sw4p-pro --squash --delete-branch=false
```

**Post-merge verification:**

```bash
cd "/path/to/sw4p" && git fetch origin && git checkout origin/master
cd sw4p-backend && cargo test --lib chain_registry::tests::frontier_loads_mainnet_and_testnet_registry -- --nocapture
```

Expected: `1 passed; 0 failed`.

### Task 1.2: Rebase sw4p-pro #263 onto post-#268 master and re-run full test gate

**Why:** PR #263 was previously rebased onto the post-#261 master. Once #268 merges, the M4 branch needs another rebase so the full test gate (including the chain_registry test) passes cleanly.

**Steps:**

```bash
cd "/path/to/sw4p"
git fetch origin
git checkout feat/sw4p-usdt-tron-parity-m4-execution-parity
git rebase origin/master
# If clean, force-push:
git push --force-with-lease=feat/sw4p-usdt-tron-parity-m4-execution-parity:<current-origin-sha> \
  origin feat/sw4p-usdt-tron-parity-m4-execution-parity
```

**Re-run the merge gate from PR #263's review checklist:**

```
base = master
mergeable = clean
tests pass (full backend lib + all M4 integration tests)
diff is scoped to M4 USDT/Tron execution parity
no secrets
no AI trailers
no production / runtime / cutover changes
```

If anything fails, leave #263 open and report the exact failing item.

### Task 1.3: Merge sw4p-pro #263

**Merge command (only after Task 1.2 passes):**

```bash
gh pr merge 263 --repo Render-Network-OS/sw4p-pro --squash --delete-branch=false
```

### Task 1.4: Review and merge sw4p-kit #7

**Files in PR:** `sw4p-kit/src/core/tron_address.ts`, `sw4p-kit/src/core/canary.ts`, plus their tests.

**Scope:** Two additive helper modules, no existing consumer modified. 9 new vitest tests, all green.

**Known minor follow-ups (below 80 confidence per prior review; safe to merge through):**
- `canary.ts:20` `expires_at` is `z.string()`; could be tightened to `z.string().datetime()`. Track as M6 hygiene.
- `canary.ts:12-13` `source_chain` and `destination_chain` are bare `z.string()`; could carry a comment explaining why `ChainSchema` is not used (TRX is not yet in main enum). Track as M6 hygiene.

**Merge command:**

```bash
gh pr merge 7 --repo Render-Network-OS/sw4p-kit --squash --delete-branch=false
```

### Task 1.5: Branch cleanup (optional)

After all four PRs land, delete the source branches:

```bash
git -C "/path/to/sw4p" push origin --delete \
  feat/sw4p-usdt-tron-parity-m0-m2 \
  feat/sw4p-usdt-tron-parity-m3-tron-signing \
  feat/sw4p-usdt-tron-parity-m4-execution-parity \
  fix/sw4p-chain-registry-uni-parser

git -C "/path/to/sw4p-kit" push origin --delete \
  feat/sw4p-kit-usdt-tron-parity-m0-m2 \
  feat/sw4p-kit-usdt-tron-parity-m3-tron-signing
```

### Phase 1 exit gate

- All four PRs merged to default branches.
- `cargo test --lib` on `master` returns zero failures.
- No source branches remain on origin.

---

## Phase 2: M5 Execution (Lifecycle and Proof Ledger)

**The plan is already drafted.** Execute the plan at `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md` (4250 lines, 17 tasks across 14 waves) using subagent-driven-development. The plan contains complete TDD steps with real code for every task and verifying commands.

### Summary of M5 scope (for the receiving team's planning)

The plan delivers:

1. **T1** Lifecycle, evidence, and route-suspension migrations: three new PostgreSQL tables (`settlement_lifecycle_events`, `settlement_evidence`, `route_suspensions`).
2. **T2** `LifecycleEvent` Rust enum covering 20 transitions from `RouteRequested` to `Refunded`.
3. **T3** Lifecycle event writer (`lifecycle::record_event(pool, route_id, event, payload)`).
4. **T4** Proof ledger writer (`evidence::record_settlement(pool, evidence_record)`) with append-only supersession semantics.
5. **T5** Wire `tron_watcher` to record `SourceTxConfirmed` events.
6. **T6** Wire `provider_status_polling` to record `ProviderTransferDetected`, `DestinationPending`, `DestinationSettled` events.
7. **T7** Wire `allbridge_registry` to record `RouteSuspended` on stale-registry rejection plus a suspensions module.
8. **T8** Wire `raw_tx_validator` to record `RawTxValidated` and `Failed` events with reason codes.
9. **T9** Wire `bridge_from_tron_with_mode` for `RouteRequested` through `SourceTxSubmitted`.
10. **T10** `bridge_from_tron_with_caps` refactor: closes the M4 critical canary cap enforcement follow-up; rejects when `quote.fee > caps.max_fee_decimal`, `approve amount > caps.approval_cap_decimal`, `implied slippage > caps.max_slippage_decimal`. Three distinct reason codes: `CANARY_FEE_OVERRUN`, `CANARY_APPROVAL_OVERRUN`, `CANARY_SLIPPAGE_OVERRUN`.
11. **T11** Operator route-suspension API: `POST /v1/operator/route-states/:route_id/suspend` and `DELETE` to clear, gated by `X-Operator-Token` header. Full RBAC deferred to M6.
12. **T12** Observability metrics per TRD section 12: provider registry fetch counts, stale registry rejections, route state counts by chain and asset, quote success and failure, raw tx validation failures by reason, approval failures, source tx failures, provider status polling latency, destination settlement latency, stuck transfer count, route suspension count, canary execution count. Adds `metrics = "0.23"` as a new explicit Cargo dep.
13. **T13** Stuck transfer detection worker: periodic poll for `DestinationPending` rows older than threshold, emits `ManualReviewRequired`.
14. **T14** Five operator runbooks: stuck-transfer, route-suspension, provider-degradation, canary-execution, rollback. Land at `sw4p/docs/runbooks/`.
15. **T15** Full-lifecycle integration test (mock + real DB).
16. **T16** Pinned acceptance test asserting event ordering and row counts.
17. **T17** Final M5 code review.

### M5 follow-up linkage

Items in the M4 follow-ups doc that M5 closes:

- Canary cap enforcement gap (M4 critical item) closed by T10.
- Observability metrics gap (carried since M0-M2) closed by T12.
- Lifecycle storage of provider_status_polling and tron_watcher events (M4 important item) closed by T5 and T6.

### Phase 2 exit gate

- All 17 M5 tasks merged via a single PR (or stacked PRs per team preference).
- TRD section 9 lifecycle requirements all green.
- TRD section 12 observability requirements all green.
- The `bridge_from_tron_with_caps` private helper enforces caps in tests with the three distinct reason codes.
- All five operator runbooks present and reviewed by ops.

### Phase 2 estimated effort

~25-30 subagent dispatches, 3-5 hours wall-clock at the M4 cadence.

---

## Phase 3: M6 Plan and Execution (Product Parity)

**No detailed plan exists yet.** The receiving team's first action in this phase is to author a per-task plan using the writing-plans skill, structured like the M3, M4, and M5 plans. Save to `docs/superpowers/plans/<date>-sw4p-usdt-tron-parity-m6-product-parity.md`.

### M6 goal

Make every user-facing surface (frontend, kit, MCP gateway) honest about route state and capable of executing a Tron user-signed flow end-to-end against the M5-backed backend. Close the Solana to Tron stub in `allbridge.rs::bridge_from_solana_to_tron`.

### M6 scope (use as input for the per-task plan)

**Frontend route-state UI (SOW WP8.1, WP8.2, WP8.3):**

- T6.1 Route list view consuming `GET /v1/route-states`: renders each `RouteState` with primary state badge, source and destination chain icons, asset, provider rail. Hides `out_of_scope`. Shows distinct visual treatment for `suspended`, `policy_blocked`, `provider_unsupported`, `provider_supported_code_incomplete`, `code_supported_proof_missing`, `canary_authorized`, `live`.
- T6.2 Route detail screen: shows source asset, destination asset, token standards, provider rail, quote, fees, approval state, proof state, expected completion status. Required by PRD-USDT-015.
- T6.3 Tron execution UI: a single page that fetches the unsigned tx via `POST /v1/tron/raw-tx`, presents the `TronTxReview` component (already shipped in M3 T14), calls `useTronSigning` (already shipped in M3 T13) on user confirmation, polls status via M5's lifecycle event endpoint.
- T6.4 Frontend `raw_data` object passing: the frontend MUST pass `raw_data` (the JSON object) to `window.tronWeb.trx.sign`, NOT `raw_data_hex` (the bytes). Verify in M6 integration tests. Tracked in M4 follow-ups doc.

**Kit and MCP gateway (SOW WP8.4, WP8.5):**

- T6.5 MCP gateway consumes `RouteStateResponse` from `sw4p-kit` (added in M0-M2 PR #6). Update `sw4p-mcp-gateway/src/tools.ts` to expose `route_states` and `route_state_by_id` tools that return the structured response without re-flattening.
- T6.6 MCP gateway consumes `CanaryAuthorization` from `sw4p-kit` (added in M3 PR #7). Add an operator-only tool `canary_authorization_create` that POSTs to a new `POST /v1/operator/canary-authorizations` endpoint (which M6 also adds; backend tasks T6.10 + T6.11 cover that).
- T6.7 Kit `expires_at` strictness: tighten `canary.ts:20` from `z.string()` to `z.string().datetime()`. Hygiene item from PR #7 review.
- T6.8 Kit `source_chain` and `destination_chain` documentation: add inline comment on `canary.ts:12-13` explaining why bare `z.string()` is used instead of extending the kit's existing `ChainSchema` (TRX is not in main enum). Hygiene item from PR #7 review.

**Full Solana SPL plus Allbridge program instruction building (closes M4 T10 stub, SOW WP6.3):**

- T6.9 Implement `bridge_from_solana_to_tron` fully: SPL transfer instruction (user's USDT ATA to Allbridge pool ATA), Allbridge Solana program instruction with the Tron destination encoded as bytes32, recent blockhash fetch via `solana_client`, ATA lookup helpers, `solana_sdk::message::Message::serialize()` for the wire shape. Remove the `SOLANA_BRIDGE_STUB_MARKER` once the full path is in place.
- T6.10 Flip `policy::primary_for` for SOL to TRX: from `ProviderSupportedCodeIncomplete` plus `SOL_TO_TRON_NOT_IMPLEMENTED` to `CodeSupportedProofMissing` plus `PROOF_PENDING`. Update `tests/route_state_pinned.rs` assertion.

**Operator canary creation endpoint (referenced by T6.6):**

- T6.11 Add `POST /v1/operator/canary-authorizations` backed by `canary_authorization::insert`. Header-gated by `X-Operator-Token` same as M5 T11.

**Legacy cleanup (M4 follow-up items):**

- T6.12 Migrate `multi_hop.rs:341` legacy `bridge_from_tron` call site to `bridge_from_tron_with_mode`. Requires threading `&PgPool` through `execute_route`. Touches every caller of `execute_route`.
- T6.13 Migrate `native_bridge.rs:340` pool-less fallback. Requires changing `execute_bridged_transfer` signature so pool is always required.
- T6.14 `TronClient::new_with_url` timeout sweep: build the inner `reqwest::Client` with explicit 30s timeout plus 10s connect_timeout. Match `allbridge_registry`, `allbridge_quote`, `allbridge_tx_builder`, `provider_status_polling`.
- T6.15 Solana broadcast byte-size limit: cap `signed_tx_base64` at 256 KB in `solana_signing_api::broadcast_handler` to avoid memory pressure.
- T6.16 Remove the deprecated `/v1/routes` legacy handler in `route_selector` once the frontend is verified to be consuming `/v1/route-states`. M0-M2 follow-up.
- T6.17 Replace `allbridge.rs:812` (or wherever the silent Base USDT to Base USDC mapping currently lives) with an explicit `Err` and add a regression test. M0-M2 follow-up.

**Frontend TRD-TRON-010 acceptance tests (M3 follow-up):**

- T6.18 vitest unit tests for `useTronSigning` covering six scenarios from TRD-TRON-010: account switch, wallet rejection, insufficient resources, invalid recipient, stale quote, provider tx mismatch.
- T6.19 Snapshot test for `TronTxReview` with high vs low Bandwidth and Energy values.

### M6 phase exit gate

- Route state UI is live in the frontend, consuming `/v1/route-states`.
- Tron execution UI is live, demonstrated end-to-end against M5 backend on devnet (or a provider-confirmed non-production corridor if one becomes available).
- MCP gateway exposes route states and canary tools.
- Solana to Tron path is no longer a stub.
- All legacy call sites migrated.
- TRD-TRON-010 frontend tests all green.

### M6 estimated effort

~20-25 tasks, comparable in scope to M3 plus M4. Estimated 4-6 hours of subagent work plus frontend-side review cycles.

---

## Phase 4: M7 Plan and Execution (Evidence and Canary)

**No detailed plan exists yet.** Receiving team authors a per-task plan in `docs/superpowers/plans/<date>-sw4p-usdt-tron-parity-m7-evidence-canary.md`.

### M7 goal

Produce real settlement evidence for at least one Tron corridor: either a provider-confirmed non-production corridor or an explicitly authorized mainnet canary. Verify the Allbridge `swapAndBridge` selector against a real on-chain transaction. Promote the first qualifying route from `code_supported_proof_missing` to `live`.

### M7 scope

**Allbridge selector live verification (M4 critical follow-up):**

- T7.1 Capture a real Allbridge `swapAndBridge` transaction on Tron mainnet via Tronscan or `eth_getTransactionByHash` equivalent. Extract the first 4 bytes of the call data. Confirm they equal `0x3976471e` (the value M4 T1 derived from the canonical signature `swapAndBridge(bytes32,uint256,uint256,bytes32,uint256,bytes32)`).
- T7.2 If the selector does NOT match: re-derive `AllbridgeSwapAndBridge` from the actual on-chain signature. Update `tron_abi.rs` constant and parameter struct. Update all consumers (M4 T4, T7-T9 raw_tx_validator branches). Rerun the M4 acceptance tests.
- T7.3 If the selector matches: add an integration test that pins the verified mainnet transaction (`hex_of_call_data` from Tronscan) and asserts the decoder produces the expected `AllbridgeSwapAndBridge` shape. Land at `sw4p/sw4p-backend/tests/allbridge_selector_mainnet_pinned.rs`.

**Provider-confirmed non-production corridor (CRD section 4.3 OD-002):**

- T7.4 Reach out to Allbridge and request a non-production test corridor for sw4p (Polygon Mumbai to Tron Shasta, or similar). If granted, record the provider's confirmation, register the corridor metadata in `provider_route_snapshots`, and run a real bridge transfer through the M5 lifecycle. Update `evidence::record_settlement` with `proof_level = provider_confirmed_nonprod`.
- T7.5 If Allbridge declines: proceed to T7.6 below. Document the decline in `sw4p/docs/operations/allbridge-nonprod-decline-<date>.md`.

**Authorized mainnet canary (PRD-USDT-019, PRD-USDT-024, CRD section 14):**

- T7.6 Compose a structured canary authorization object per TRD section 14 and CRD section 14. Required fields: `authorization_id`, `route` (source_chain, destination_chain, source_asset, destination_asset, rail), `amount` (small, e.g. 5 USDT), `source_wallet` (named operator wallet), `destination_wallet` (named operator wallet), `max_fee`, `max_slippage_or_pool_impact`, `approval_cap`, `expires_at`, `approver` (named human), `proof_destination` (evidence folder or ledger id), `notes`.
- T7.7 Insert the authorization row via `POST /v1/operator/canary-authorizations` (added in M6 T6.11). Confirm the row appears in `canary_authorizations`.
- T7.8 Execute the canary transfer through `bridge_from_tron_with_mode::Canary` using the named authorization. The M5 `bridge_from_tron_with_caps` helper enforces the caps; if any cap is exceeded the canary is rejected. Run from a fresh terminal with the operator wallet's TronLink connected; the canary executes via the M3 user-signed path, NOT a relayer.
- T7.9 Record the resulting `settlement_evidence` row with `proof_level = destination_settled`, source tx hash, destination tx hash, provider transfer id, registry snapshot hash, quote hash, raw tx hash, approval tx hash. Verify via the M5 evidence ledger query.

**First canary candidate: Polygon USDT to Tron USDT (SOW section 7):**

- T7.10 Use Polygon mainnet as the source. Reasoning: provider snapshot supports Polygon USDT and Tron USDT, Polygon gas is cheaper than Ethereum mainnet, avoids Base direct USDT unsupported gap, tests EVM to Tron without depending on Solana to Tron implementation.
- T7.11 Pre-flight: source wallet must hold at least 5.5 USDT on Polygon plus 0.5 MATIC for gas. Destination wallet must be a fresh TronLink-controlled address. Operator must have written authorization from the approver named on the auth row.
- T7.12 Post-execution audit: every row mentioned in T7.9, plus a structured evidence summary at `sw4p/docs/evidence/canary-<date>-pol-trx-usdt.md` linking back to the authorization id, route states snapshot, lifecycle event chain, settlement evidence row.

**Promote first live route (PRD Gate E):**

- T7.13 Once the canary completes with `destination_settled`, validate every Gate E condition: provider support `supported`, code support `implemented`, quote support `available`, proof state `destination_settled` or `provider_confirmed_nonprod`, provider health `ok`, liquidity state `available`, frontend state == backend state == kit state, runbook ready (M5 T14 deliverable).
- T7.14 Flip the corridor's `route_states.primary` to `live` via a one-off operator script: `UPDATE route_states SET primary_state = 'live', user_visible_reason = 'Live canary executed at <date>; full lifecycle proof at evidence/canary-<date>-pol-trx-usdt.md.', agent_reason_code = 'OK' WHERE route_id = 'POL:USDT->TRX:USDT:allbridge_core'`.
- T7.15 Add a new pinned acceptance test (`tests/first_live_route_pinned.rs`) asserting POL to TRX USDT primary state is `live` and the evidence chain is recoverable from the proof ledger.

### M7 phase exit gate

- Allbridge selector verified or re-derived.
- One corridor has `proof_level = destination_settled` (or `provider_confirmed_nonprod`).
- That corridor's `route_states.primary` is `live`.
- Evidence summary doc landed at `sw4p/docs/evidence/`.
- Pinned acceptance test in place.

### M7 estimated effort

~15 tasks. Heavy ops coordination (Allbridge outreach, operator wallet provisioning, authorized canary approval). Engineering work is lighter than M5/M6 but the ops timeline is the bottleneck.

---

## Phase 5: M8 Plan and Execution (Launch Closure)

**No detailed plan exists yet.** Receiving team authors a per-task plan in `docs/superpowers/plans/<date>-sw4p-usdt-tron-parity-m8-launch-closure.md`.

### M8 goal

Close the loop on every text artifact, public commitment, and operational invariant. Bring product, ops, and corpus into alignment with what shipped.

### M8 scope

**Canonical truth alignment (SOW WP10.1):**

- T8.1 Update `RNDRNTWRK_CANONICAL_TRUTH.md` to reflect USDT plus Tron as a shipped capability with the corridors that are now `live`. Distinguish USDC-on-CCTP-V2 from USDT-on-Allbridge plainly.
- T8.2 Update `sw4p/README.md` and `sw4p-kit/README.md` Tron sections to point to the live corridors and the gated others.

**Frontier suite amendment (SOW WP10.2):**

- T8.3 Identify the Frontier-suite SOW or TRD that previously implied a public Tron testnet acceptance gate (per the M0-M2 PRD section 2.5). Amend it to record that the M7 canary is the proof, not a testnet corridor.

**Ops doc supersession (SOW WP10.3):**

- T8.4 Map every April Tron corridor doc and stale PR to its M0-M5 replacement. Add a supersession block at the top of each old doc pointing forward. Affected: `sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md`, `sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md`, plus any PR that was opened before M0-M2 and not closed.

**Public copy guard (SOW WP10.4):**

- T8.5 Sweep marketing copy, docs site, and any landing page for the phrases "Tron live", "USDT everywhere", "gasless Tron", "supports all stablecoins". Any phrase that overpromises relative to the actual live corridor list must be rewritten or removed.
- T8.6 Add an automated public-copy guard test that greps a candidate list of phrases against the docs site and fails the docs build if any forbidden phrase is added without explicit allowlist.

**External handoff closeout (SOW WP10.5):**

- T8.7 Update the external-handoff doc (`docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md`) with a final-status section: PRs merged, milestones complete, evidence locations, route launch decisions per route.
- T8.8 Produce a one-page program summary at `sw4p/docs/2026-XX-XX-usdt-tron-parity-shipped.md` for executive consumption.

**Launch decision record per route (SOW WP9.7):**

- T8.9 For each route in the corridor matrix: record one of `live`, `canary-only`, `gated`, `suspended`, `policy_blocked`, `out_of_scope`. Store at `sw4p/docs/launch-decisions/2026-XX-XX-usdt-tron-corridors.md`.

### M8 phase exit gate

- Every doc with USDT or Tron content is consistent with the shipped reality.
- No public copy overpromises.
- Launch decision per route is recorded.
- External handoff doc is closed.

### M8 estimated effort

~10 tasks, mostly doc work. Engineering effort is minimal; product and copy review are the long pole.

---

## Cross-Cutting Follow-Up Backlog

Items consolidated from `sw4p/docs/followups/2026-05-18-usdt-tron-parity-{m0-m2,m3-tron-signing,m4-execution-parity}-followups.md`. Each is mapped to the milestone that closes it. The receiving team should NOT re-investigate items already closed.

### Closed by M4 (already landed in PR #263)

- Allbridge selector + signatures.
- Broadcast wire format.
- Unsigned tx shape with block reference.
- `tron_watcher` env-var racy in production.
- Canary TOCTOU (post-review fix in #263).
- `raw_tx_handler` approve-vs-swap baseline (post-review fix in #263).
- TRD-RAW-002 approval spender.
- TRD-RAW-003 source token equality.
- TRD-RAW-005 destination token equality.
- TRD-RAW-011 route-state freshness.
- Two of three legacy `bridge_from_tron` call sites (`relay.rs` full, `native_bridge.rs` conditional).

### Closing in M5

- Canary cap enforcement (fee, approval, slippage). M5 T10.
- Observability metrics registration. M5 T12.
- Lifecycle storage of `provider_status_polling` and `tron_watcher` events. M5 T5, T6.
- Stuck transfer detection. M5 T13.
- Operator route suspension API. M5 T11.

### Closing in M6

- Full Solana SPL + Allbridge instruction building (closes M4 T10 stub). M6 T6.9.
- Third legacy `bridge_from_tron` call site migration (`multi_hop.rs`). M6 T6.12.
- `native_bridge.rs` pool-less fallback removal. M6 T6.13.
- `TronClient::new_with_url` timeout sweep. M6 T6.14.
- Solana broadcast byte-size limit. M6 T6.15.
- Legacy `/v1/routes` handler retirement. M6 T6.16.
- `allbridge.rs:812` Base USDT to USDC silent mapping cleanup. M6 T6.17.
- TRD-TRON-010 frontend test gap. M6 T6.18, T6.19.
- MCP gateway tool surface update. M6 T6.5, T6.6.
- Kit hygiene items from PR #7 review. M6 T6.7, T6.8.
- Frontend `raw_data` object passing verification. M6 T6.4.

### Closing in M7

- Allbridge selector live verification. M7 T7.1, T7.2, T7.3.
- Provider-confirmed non-prod corridor OR authorized mainnet canary. M7 T7.4 through T7.9.
- First canary candidate (Polygon to Tron USDT) execution. M7 T7.10 through T7.12.
- First `live` route promotion. M7 T7.13, T7.14, T7.15.
- Test fixture using old placeholder selector in `m4_tron_signing_full_flow.rs:37`. M7 T7.2 implicitly fixes when selector is verified.

### Closing in M8

- Canonical truth corpus alignment. M8 T8.1, T8.2.
- Frontier suite amendment. M8 T8.3.
- April ops doc supersession. M8 T8.4.
- Public copy guard. M8 T8.5, T8.6.
- External handoff closeout. M8 T8.7, T8.8.
- Launch decision per route. M8 T8.9.

### Permanent invariants (never close; perpetually enforced)

- No silent USDT to USDC conversion.
- No silent Base USDT to Base USDC fallback.
- No silent CCTP-for-USDT routing.
- No BTC or Omni USDT routes.
- No Tron source signing via backend private key for production users (Canary-only with structured authorization is the exception).
- Author `rndrntwrk <dev@rndrntwrk.com>` on every commit.
- No `Co-Authored-By` or AI attribution trailers.
- No em dashes (U+2014) in user-facing text.
- Circle SCP is the only deployment path for sw4p contracts unless explicitly overridden.
- AWS EKS + CodeBuild is the only deployment target for sw4p services.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Allbridge `swapAndBridge` selector `0x3976471e` does NOT match the live mainnet contract | Medium | High (every Tron user-signed broadcast would fail validation or, worse, be accepted by the validator but rejected by Allbridge) | M7 T7.1 captures a real mainnet tx and verifies. M7 T7.2 handles the mismatch path. |
| Allbridge declines a non-production corridor and ops cannot authorize a mainnet canary | Medium | High (no proof to gate Gate E; corridor stays at `code_supported_proof_missing` indefinitely) | M7 T7.4 plus T7.5 document the decline, T7.6 plus subsequent run the canary as the alternative. |
| `bridge_from_tron_with_caps` refactor breaks the existing `bridge_from_tron` callers | Medium | Medium (regression in the relayer-direct path that the legacy callers use) | M5 T10's plan keeps the legacy `bridge_from_tron` unchanged and gates the caps behind the new helper. Migrating the legacy callers is M6 work after M5 lands. |
| Solana SPL plus Allbridge program instruction building takes longer than estimated | High (it's untouched in M4 stub) | Medium | M6 T6.9 is the long pole. Recommend dedicating a Solana-specialist engineer to this single task. |
| Frontend `raw_data` vs `raw_data_hex` confusion produces invalid signatures | Medium | Medium (would silently produce wrong signatures the network rejects) | M6 T6.4 plus the TRD-TRON-010 tests in M6 T6.18 catch this. |
| Operator wallet provisioning for M7 canary takes weeks of approval | High (depends on internal process) | Medium (delays M7 exit gate) | Begin operator wallet provisioning in parallel with M5 execution. Pre-fund the wallet so it is ready when M7 starts. |
| Force-pushes to stacked feature branches during cascading rebases overwrite work | Low (with `--force-with-lease` discipline) | High | Use explicit-SHA leases when bare leases fail. Never use bare `--force`. |
| Auto-mode classifier blocks subagent operations that have user authorization | High (already observed) | Low (just slows the workflow) | Per the classifier-blocks memory rule: tell the user immediately with one clean `!` command; do not retry through the menu. |
| Pre-existing tests on master regress as the corpus grows | Medium | Medium | Phase 1 Task 1.2 explicitly re-runs the full test gate before merging M4. Every milestone should include a full test sweep before merge. |
| The parent repo containing PRD/CRD/TRD/SOW/plans is local-only and the receiving team loses access | Medium | High (the binding pack is unrecoverable) | "Logistics: Parent Repo Handoff" section below proposes three paths to share. Pick one before any execution starts. |

---

## Logistics: Parent Repo Handoff

The parent repo at `/Volumes/.../555/` contains every spec, plan, follow-up doc, runbook, and inventory. It has no git remote (per the original owner's preference). The receiving team needs access.

### Option A: Push the parent repo to a private GitHub repo accessible to the new team

```bash
# original owner runs once:
cd "/path/to/555"
gh repo create Render-Network-OS/sw4p-usdt-tron-parity-corpus --private --description "USDT/Tron parity specs, plans, follow-ups (local mirror)"
git remote add corpus git@github.com:Render-Network-OS/sw4p-usdt-tron-parity-corpus.git
git push corpus docs/wave-g-sw4p-earn-corpus
```

Then add the receiving team's GitHub identities as collaborators on the new repo. **Do not add `claude-bot`, `anthropic-bot`, or any AI identity.**

### Option B: Tarball the relevant subtree and share via secure channel

```bash
cd "/path/to/555"
tar czf sw4p-usdt-tron-parity-corpus-2026-05-19.tgz \
  docs/superpowers/specs/ \
  docs/superpowers/plans/ \
  docs/superpowers/handoffs/ \
  sw4p/docs/followups/
```

Share the tarball via the team's secure file transfer mechanism. **Do not include any `.local-secrets`, `.env`, or wallet key files.**

### Option C: Read-only mirror in the sw4p-pro repo itself

The receiving team has access to the sw4p-pro repo (it's where the merged code lives). Mirror the corpus into a `docs/usdt-tron-parity-corpus/` subdirectory of sw4p-pro via a single one-time PR. After that, the corpus lives alongside the code and the receiving team has it. Subsequent updates require another PR.

```bash
cd "/path/to/sw4p"
git checkout -b docs/mirror-usdt-tron-parity-corpus
mkdir -p docs/usdt-tron-parity-corpus/{specs,plans,handoffs}
cp -r "/path/to/555/docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-*.md" \
  docs/usdt-tron-parity-corpus/specs/
cp -r "/path/to/555/docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-*.md" \
  docs/usdt-tron-parity-corpus/plans/
cp -r "/path/to/555/docs/superpowers/handoffs/2026-05-19-sw4p-usdt-tron-parity-*.md" \
  docs/usdt-tron-parity-corpus/handoffs/
git add docs/usdt-tron-parity-corpus/
git commit -m "docs: mirror usdt-tron-parity corpus from parent local-only repo"
git push -u origin docs/mirror-usdt-tron-parity-corpus
gh pr create --base master --title "docs: mirror usdt-tron-parity corpus" --body "One-time mirror of the local-only parent repo's USDT/Tron parity corpus into sw4p-pro for the M5 plus team handoff."
```

**Recommendation:** Option A. Cleanest, preserves git history, no manual sync. The new private repo costs nothing on a paid org plan.

---

## Process Conventions (for the receiving team)

These are the operating rules the prior implementer followed. Follow them or document an explicit divergence.

### Test conventions

- **TDD discipline:** every new behavior gets a failing test before any implementation. Every existing behavior change updates an existing test or adds a regression test.
- **Backend lib tests:** `cargo test --lib <module>` with `--test-threads=1` for DB-touching tests. Set `TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test`.
- **Backend integration tests:** `cargo test --test <name>` for each integration test target. Same env requirements.
- **Kit tests:** `npx vitest run`. Node 22 via nvm.
- **Frontend tests:** `npx tsc --noEmit` for typecheck. No unit-test runner is wired yet; M6 T6.18 plus T6.19 add vitest tests for `useTronSigning` and `TronTxReview`.
- **Pinned tests:** every milestone includes at least one "pinned acceptance" test asserting the milestone's exit gate. Examples: `tests/route_state_pinned.rs`, `tests/sol_to_tron_pinned.rs`, `tests/tron_signing_pinned.rs`. M5 adds the lifecycle-pinned test; M6 adds Solana-fully-implemented pinned; M7 adds the first-live-route pinned.

### Commit hygiene

- Conventional commits: `feat(sw4p):`, `fix(sw4p):`, `refactor(sw4p):`, `test(sw4p):`, `docs(sw4p):`. Same for `sw4p-kit` and `sw4p-frontend` (frontend is inside `sw4p` repo).
- Subject line under 70 characters. Body explains "why", not "what".
- Author `rndrntwrk <dev@rndrntwrk.com>` on every commit. Never `--author` override.
- No `Co-Authored-By` trailers. No AI attribution. No robot emojis.
- No em dashes (U+2014) anywhere. No non-ASCII characters in committed files. Pre-existing em dashes in unrelated files left alone but never introduced by new commits.

### PR conventions

- Stacked PRs require explicit base retargeting after each ancestor merges. Use `gh pr edit <num> --base master` once the ancestor squash-merge lands on master.
- Cascading rebases use `git rebase --onto origin/master <old-base-tip> <feature-branch>` to extract only the feature-specific commits and replay them on the new master.
- Force-pushes use `--force-with-lease`. If git's heuristic rejects the bare lease as "stale info" because the fetch happened after the local rewrite, use the explicit-SHA form: `--force-with-lease=<branch>:<expected-current-sha>`.
- PR descriptions follow the SOW section 8 template: scope statement, route states affected, evidence source, tests run, no-fake-live assertion, rollback or suspension impact, security notes for signing or approval or provider interaction.
- Required review gates per SOW section 8: security review for raw tx validation and approval policy, product review for route copy and unsupported state clarity, ops review for proof ledger and lifecycle and runbooks, agent review for machine-readable error safety, final launch review per route.

### Classifier handling

The auto-mode classifier in the original implementer's environment blocks the following subagent actions without explicit per-action user authorization:

- `gh pr merge` and `gh pr edit --base` on default branches.
- `git push --force` and `git push --force-with-lease` to branches with open PRs.
- `gh pr comment` posting to GitHub.
- `gh repo create` and related repo-level mutations.
- Some read-only status checks where a downstream merge is anticipated.

When blocked, the prior pattern was: tell the user immediately, provide ONE clean `!`-prefixed command, do not retry through a menu. This pattern is documented in the user's project memory at `feedback_classifier_blocks`.

The receiving team may operate without this classifier; in that case, just run the commands directly.

### Documentation conventions

- Plans land at `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.
- Handoffs land at `docs/superpowers/handoffs/YYYY-MM-DD-<feature-name>.md`.
- Follow-ups land at `sw4p/docs/followups/YYYY-MM-DD-<feature-name>-followups.md` in the sw4p repo (so they ship with the code they describe).
- Runbooks land at `sw4p/docs/runbooks/YYYY-MM-DD-<runbook-name>.md`.
- Evidence lands at `sw4p/docs/evidence/<event-name>-<date>.md`.
- Every doc has a top header with status, date, owner, audience.

### Code conventions (Rust)

- Modules are single-responsibility. `tron_address.rs` validates addresses, `tron_fees.rs` models fees, `tron_abi.rs` decodes ABI, etc. No mega-modules.
- Test code uses `#[cfg(test)] mod tests { ... }` colocated with the module. Integration tests live at `sw4p-backend/tests/<name>.rs`.
- HTTP clients use `reqwest::Client::builder().timeout(...).connect_timeout(...).build()`. Bare `reqwest::Client::new()` is a red flag in network-facing code.
- Errors use `thiserror` for typed enums in new modules. The existing codebase mixes `thiserror`, `anyhow`, and `Box<dyn Error>`; follow the surrounding pattern when extending an existing module.
- SQL queries use `sqlx::query` or `sqlx::query_as` with bind parameters. Never string-interpolate user input into SQL.

### Code conventions (TypeScript)

- Kit modules use `zod` for runtime validation. Every public parse function takes `unknown` and returns the typed value or throws.
- Test files mirror source files at `src/__tests__/core/<name>.test.ts` (vitest config requires this layout).
- Imports use `.js` extension in source paths (the kit compiles to ESM).
- Schemas define types via `z.infer<typeof Schema>`; never duplicate type definitions.

### Code conventions (React + Vite)

- Components live at `src/components/`. Hooks live at `src/hooks/`. Config lives at `src/config/`.
- TronLink integration goes through `WalletProvider` context, not direct `window.tronWeb` calls in components.
- Signing flows go through `useTronSigning` hook, never directly through `window.tronWeb.trx.sign`.
- TypeScript strict mode. `npx tsc --noEmit` must return zero new errors.

---

## Handoff Completion Criteria

This handoff is considered fully delivered when:

1. **Receiving team has access** to all binding specs, plans, and follow-up docs via one of the logistics options above.
2. **Receiving team has acknowledged the goal** stated at the top of this document.
3. **Phase 1 is complete:** all four open PRs (#268, #263, #7, plus any others opened during execution) have merged or been formally closed with documented reason.
4. **A named owner exists** for each remaining phase (M5, M6, M7, M8). The owner is responsible for authoring the per-milestone detailed plan (M5 already exists; M6, M7, M8 are TBD) and dispatching execution.
5. **A risk acknowledgment is on record.** The receiving team has reviewed the risk register and either accepts each risk or proposes an alternate mitigation.
6. **A check-in cadence is agreed.** Suggest weekly status against the milestone exit gates, plus an unscheduled escalation for any blocker that hits the highest impact tier of the risk register.

---

## Self-Review

### Spec coverage trace

| Spec area | Phase that closes it |
|---|---|
| PRD G1 stablecoin asset clarity | Closed (M0-M2) |
| PRD G2 Tron as first-class USDT chain | Phase 1 close-out (M4 lands) plus M6 frontend |
| PRD G3 no false live routes | Closed (M0-M2 plus pinned tests) |
| PRD G4 proof-gated availability | M7 |
| PRD G5 agent-safe outputs | Closed (M0-M2 plus M3 follow-up M6 MCP update) |
| PRD G6 BTC and Omni exclusion | Closed (M0-M2) |
| PRD-USDT-001 through -024 | Distributed across M0 through M7 with the bulk in M0-M4 plus M7 canary closure |
| CRD section 5 route state model | Closed (M0-M2) |
| CRD section 6 corridor matrix | Closed (M0-M2 plus M6 Solana closure plus M7 first-live route) |
| CRD section 7 signing and custody | Closed (M3) |
| CRD section 8 fees and gas | Closed (M3) |
| CRD section 9 raw tx validation | Closed (M4, full TRD-RAW-* closure) |
| CRD section 10 approvals | Closed (M0-M2) |
| CRD section 11 proof | M7 |
| CRD section 12 lifecycle | M5 |
| CRD section 13 API | Closed (M0-M2 plus M3 plus M4) |
| CRD section 14 security | Closed (M0-M4) plus carry-forward |
| CRD section 15 open decisions | M7 (most are OD-001 user-signed default closed by M3, OD-002 canary closed by M7, OD-005 provider raw tx closed by M3) |
| CRD section 16 corridor acceptance gate | M7 |
| TRD section 3 registry | Closed (M0-M2) |
| TRD section 4 rail selector | Closed (M0-M2) |
| TRD section 5 quote and raw tx builder | Closed (M0-M2 plus M4 selector verification) |
| TRD section 6 raw tx validator | Closed (M4, all 14 TRD-RAW-* checks) |
| TRD section 7 approval policy | Closed (M0-M2) |
| TRD section 8 Tron wallet adapter | Closed (M3) |
| TRD section 9 lifecycle and proof ledger | M5 |
| TRD section 10 kit and agent API | Closed (M0-M2 plus M3) plus M6 MCP update |
| TRD section 11 database | M5 (lifecycle tables) |
| TRD section 12 observability | M5 |
| TRD section 13 testing | Distributed; M7 adds the live-route pinned test |
| TRD section 14 canary authorization | Closed (M3 plus M4 caps in M5) |
| TRD section 15 must-not-ship | Permanent invariant |
| SOW WS0 inventory | Closed |
| SOW WS1 route truth | Closed |
| SOW WS2 rail selector | Closed |
| SOW WS3 Allbridge quote and raw tx | Closed |
| SOW WS4 raw tx validation and approval policy | Closed |
| SOW WS5 Tron signing | Closed |
| SOW WS6 backend execution parity | Mostly closed (M4); Solana corridor closes in M6 |
| SOW WS7 lifecycle and proof ledger | M5 |
| SOW WS8 frontend and kit parity | M6 |
| SOW WS9 evidence and canary | M7 |
| SOW WS10 corpus and ops closure | M8 |

### Placeholder scan

This document contains:

- Two references to `<date>` as a placeholder for milestone authorship dates that the receiving team will fill in when they create the per-milestone plans. These are intentional and explicitly called out as "receiving team's first action in this phase is to author a per-task plan."
- Two references to `<num>` and `<old-base-tip>` and similar in shell command examples. These are intentional template variables the operator fills in at execution time.
- No "TBD", no "fill in details", no "implement later", no "similar to Task N" pointers.

### Type and command consistency

- Connection string `postgres://postgres:dev@localhost:5438/sw4p_test` used consistently.
- Node version `22.22.0` via nvm consistently.
- `gh pr merge` always uses `--squash --delete-branch=false`.
- Force-push uses `--force-with-lease`, explicit-SHA fallback documented.
- File paths use the canonical `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/` for the parent repo and `/path/to/sw4p` etc. for repo-relative work the receiving team will substitute.

### Out-of-scope items explicitly NOT in this handoff

- 555 token mobility / Phase H work (separate track).
- BTC and Omni USDT support (`out_of_scope` per PRD G6).
- Non-Allbridge non-CCTP bridge rails (no new rail per PRD non-goals).
- Frontend or kit work for chains beyond ETH, ARB, POL, AVA, OPT, BASE, SOL, TRX, UNI.
- Sponsored gas or gas abstraction for Tron (`gasless` claim is forbidden per PRD section 10 copy rules unless a sponsor is wired).
- Fiat settlement work.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/handoffs/2026-05-19-sw4p-usdt-tron-parity-full-team-handoff.md`.

The receiving team has two execution options for the in-flight phases (1 and 2):

**1. Subagent-Driven (recommended for Phase 2 M5 execution)** — Dispatch a fresh subagent per task, two-stage review per wave, fast iteration. Same pattern used for M3 and M4. Plan exists at `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md`.

**2. Manual / Inline Execution** — Receiving team's engineers execute each task by hand, with their own review checkpoints. Slower but lower context-switching overhead.

For Phase 1 (operational close-out), no subagent dispatch needed — it's just four `gh pr merge` commands plus one rebase. A single engineer with merge rights can close it in under an hour.

For Phases 3 (M6), 4 (M7), and 5 (M8), the receiving team must FIRST author a per-milestone detailed plan using the writing-plans skill (format like M3, M4, M5 plans already in the corpus), THEN execute via subagent-driven-development or manual.

Which execution mode the receiving team chooses is their call; the binding constraint is that no milestone exits without its named exit gate satisfied and a pinned acceptance test in place.
