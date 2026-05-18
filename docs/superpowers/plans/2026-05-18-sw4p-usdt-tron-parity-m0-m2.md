# sw4p USDT / Tron Parity, M0 to M2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking. This plan deliberately permits parallel dispatch inside named waves (see section "Parallel Wave Map"), overriding the skill's default of one implementer at a time. The user has authorized this. Conflicts are avoided by keeping each wave's tasks on disjoint files.

**Goal:** Land the M0 to M2 milestones of the sw4p USDT and Tron parity track so that, given current Allbridge provider data, every USDC and USDT route can be explained as `live`, `canary_authorized`, `code_supported_proof_missing`, `provider_supported_code_incomplete`, `provider_unsupported`, `suspended`, `policy_blocked`, or `out_of_scope`, and no Allbridge raw transaction can reach wallet signing without provider-backed quote material and intent-matched validation.

**Architecture:** A new route-truth layer (`route_state`, `allbridge_registry`, `route_matrix`, `policy`) sits in front of the existing `route_selector` and `allbridge` modules in `sw4p-backend`. Quote, raw-transaction builder, provider contract allowlist, raw-transaction validator, and approval policy are new modules dispatched through that layer. `sw4p-kit` and `sw4p-mcp-gateway` consume a structured route-state response so agents and the operator surface never infer liveness from partial metadata. Frontend execution work is explicitly out of scope for this plan, in line with the SOW.

**Tech Stack:** Rust 2021 with Axum, Tokio, SQLx against PostgreSQL, reqwest, secp256k1, alloy, tracing, opentelemetry-otlp, mockall, wiremock, tokio-test. TypeScript 5.4 with Zod and vitest in `sw4p-kit`. The plan does not introduce new top-level dependencies.

**Binding companion docs:**

- [PRD](../specs/2026-05-18-sw4p-usdt-tron-parity-prd.md)
- [CRD](../specs/2026-05-18-sw4p-usdt-tron-parity-crd.md)
- [TRD](../specs/2026-05-18-sw4p-usdt-tron-parity-trd.md)
- [SOW](../specs/2026-05-18-sw4p-usdt-tron-parity-sow.md)
- [External Handoff](../specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md)

---

## Subagent Dispatch Contract

Every dispatch in this plan obeys the following contract. The controller (the session that runs this plan) must enforce it on every `Agent` call.

| Field | Value | Why |
|---|---|---|
| `model` | `opus` | Max-confidence Opus 4.7 for every implementation, spec review, and quality review. No Sonnet, no Haiku. |
| `subagent_type` (implementer) | `general-purpose` | Implementation tasks need Read, Write, Edit, Bash, TodoWrite. `general-purpose` is the only agent with the full toolset. |
| `subagent_type` (spec reviewer) | `feature-dev:code-reviewer` | Verifies the implementation matches the named PRD/CRD/TRD requirement IDs. |
| `subagent_type` (quality reviewer) | `feature-dev:code-reviewer` | Verifies bugs, logic, security, and convention adherence. Separate dispatch from spec review. |
| `subagent_type` (final review) | `code-review:code-review` | After all waves close, single full-branch review. |
| `isolation` | omit | All work lands on the active worktree. The controller already runs in a worktree. |
| `description` | three to five words | Sets the chip label so the user can see the wave at a glance. |
| `run_in_background` | `false` for in-wave work | Controller must wait on every implementer in a wave before opening the next wave. |

**Per-implementer prompt skeleton.** Every implementer is dispatched cold, with no memory of this conversation. The prompt must contain, in this order:

1. The task name and the wave it belongs to.
2. The single unambiguous goal sentence for the task (copy verbatim from the task header).
3. The full PRD, CRD, TRD, and SOW IDs that the task implements.
4. The exact file or files to create or modify, with paths relative to the repository root and existing line numbers where edits apply.
5. The TDD step list from this plan, verbatim.
6. The verification command the controller will run after handoff.
7. The commit message template.
8. The explicit prohibition list: do not edit files outside the task scope, do not edit other modules even when tempting, do not introduce new dependencies, do not skip the failing-test step, do not commit a stub that does not satisfy the named requirement.

**Per-spec-reviewer prompt skeleton.** Dispatched once the implementer reports DONE. The prompt must contain, in this order:

1. The task name and the implementer's reported git SHA.
2. The PRD/CRD/TRD/SOW IDs the implementer was supposed to satisfy.
3. The exact files and line ranges the implementer reported touching.
4. The verification command output (controller pastes this in).
5. The instruction: confirm spec compliance only. Do not comment on code quality. Output a structured verdict: PASS, FAIL with named missing requirement IDs, or EXTRA with named out-of-scope additions.

**Per-quality-reviewer prompt skeleton.** Dispatched only after spec review returns PASS. Reuses the spec reviewer's file and SHA context, asks for bug, logic, security, and convention findings only, with confidence-level filtering at high or critical.

**Re-review loop.** When a reviewer returns FAIL or EXTRA, the controller re-dispatches the original implementer with the reviewer's findings appended. The same model (`opus`) is used unless the implementer escalates BLOCKED for reasons that explicitly require more capability, which on `opus` means the plan itself is wrong; in that case the controller halts and escalates to the human.

---

## Parallel Wave Map

Waves are dispatched in order. Inside a wave, all tasks dispatch in a single Agent block, in parallel. Between waves, the controller waits for every implementer plus its two reviewers to close before opening the next wave.

| Wave | Tasks | Parallel agents | Rationale |
|---:|---|---:|---|
| W0 | T0 | 1 | Inventory only; produces a doc the rest of the plan can stop referencing missing branches. |
| W1 | T1, T4 | 2 | T1 creates Rust types in a new file. T4 creates SQL migrations. No file overlap. |
| W2 | T2, T3, T5 | 3 | All new Rust modules in disjoint files. Each imports the T1 types created in W1. |
| W3 | T6 | 1 | Modifies the existing `route_selector.rs`. Cannot parallelize with anything that also reads or writes that file. |
| W4 | T7, T8 | 2 | T7 is a regression test crate file. T8 is a new module. Disjoint. |
| W5 | T9, T10 | 2 | T9 creates `allbridge_quote.rs`. T10 creates `allbridge_tx_builder.rs`. Disjoint. |
| W6 | T11, T12 | 2 | T11 creates `raw_tx_validator.rs`. T12 creates `approval_policy.rs`. Disjoint. |
| W7 | T13, T14 | 2 | T13 and T14 are TypeScript in `sw4p-kit/src/core/`. T13 edits `intent.ts`; T14 creates `route_state.ts`. Disjoint. |
| W8 | T15 | 1 | T15 wires the route-state API handler and edits `lib.rs` and `main.rs`. Must run alone. |
| W9 | T16 | 1 | Final integration test against pinned Allbridge fixture; reads everything, writes one test file. |
| W10 | T17 | 1 | Final code review of the branch using `code-review:code-review`. |

Total tasks: 17. Total waves: 11. Maximum parallel implementers in any single wave: 3.

**Why not more parallelism?** Three reasons. First, `allbridge.rs` is hot in M2: every quote, tx-builder, validator, and policy task transitively reads from it, so we serialize edits to its neighbors through wave boundaries. Second, the `route_selector.rs` refactor in W3 is a single-file mutation; parallelizing around it risks merge conflicts and lost work. Third, every wave runs the SQLx and cargo build, and a broken W1 type definition would cascade into all of W2; closing W1 fully before opening W2 buys correctness at the cost of about ten minutes per wave boundary.

---

## File Structure

New files this plan creates, with single-responsibility statements:

| Path | Responsibility |
|---|---|
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md` | One-shot WS0 inventory output. |
| `sw4p/sw4p-backend/src/route_state.rs` | Pure route-state enum and `RouteState` struct shared by every downstream module. |
| `sw4p/sw4p-backend/src/allbridge_registry.rs` | Allbridge provider snapshot fetcher, TTL, stale rejection, persistence. |
| `sw4p/sw4p-backend/src/route_matrix.rs` | Pure normalizer from raw provider snapshot to `Vec<ProviderRoute>`. |
| `sw4p/sw4p-backend/src/policy.rs` | sw4p policy filter applied to a provider-route list. |
| `sw4p/sw4p-backend/src/allbridge_allowlist.rs` | Allowlist of Allbridge contract and pool addresses per chain. |
| `sw4p/sw4p-backend/src/allbridge_quote.rs` | Provider-backed quote request, response normalization, expiry, hashing. |
| `sw4p/sw4p-backend/src/allbridge_tx_builder.rs` | Provider-backed unsigned approval and send transaction builders. |
| `sw4p/sw4p-backend/src/raw_tx_validator.rs` | Intent-vs-rawtx validator producing `RawTxValidationResult`. |
| `sw4p/sw4p-backend/src/approval_policy.rs` | Bounded-cap approval rules and ERC20 USDT allowance-reset support. |
| `sw4p/sw4p-backend/src/route_api.rs` | Axum handler that returns the structured route-state response. |
| `sw4p/sw4p-backend/migrations/20260518100000_provider_route_snapshots.sql` | Snapshot table per TRD section 11. |
| `sw4p/sw4p-backend/migrations/20260518100100_route_states.sql` | Current route-state table. |
| `sw4p/sw4p-backend/migrations/20260518100200_route_state_history.sql` | Append-only state transitions. |
| `sw4p/sw4p-backend/migrations/20260518110000_allbridge_quotes.sql` | Quote hash and expiry storage. |
| `sw4p/sw4p-backend/migrations/20260518110100_raw_tx_validations.sql` | Raw-tx validation results. |
| `sw4p/sw4p-backend/tests/route_substitution.rs` | Regression tests proving no silent USDT-to-USDC, Base-USDT-to-USDC, or wrong-standard fallback. |
| `sw4p/sw4p-backend/tests/route_state_pinned.rs` | Acceptance test against a pinned Allbridge token-info snapshot. |
| `sw4p-kit/src/core/route_state.ts` | TypeScript mirror of the backend route-state response. |

Files this plan modifies:

| Path | Modification |
|---|---|
| `sw4p/sw4p-backend/src/lib.rs` (or `main.rs` if `lib.rs` absent) | Add `pub mod` declarations for every new module and wire the `route_api` handler. |
| `sw4p/sw4p-backend/src/route_selector.rs` (line 155 area) | Refactor to consume `route_state` and reject substitutions explicitly. |
| `sw4p/sw4p-backend/src/allbridge.rs` (line 619, line 812 areas) | Remove silent Base-USDT-to-USDC mapping. Replace not-implemented Solana-to-Tron error with structured `RouteState::provider_supported_code_incomplete`. |
| `sw4p-kit/src/core/intent.ts` (line 3 ChainSchema) | Add `"tron"` to the chain enum and update consumers. |

Frontend (`sw4p-frontend/src/WalletProvider.tsx`, `settlementChains.ts`, `hooks/useBridge.ts`) is not modified in this plan. The SOW M0-M2 scope explicitly defers UI work until route truth exists. The plan does, however, ensure the kit type changes do not break the frontend build.

---

## Task T0: Branch and Code Inventory

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Produce the WS0 inventory document so the rest of the plan never references a branch that may not exist.

**PRD/CRD/TRD/SOW IDs:** SOW WP0.1, WP0.2, WP0.3, WP0.4, WP0.5.

**Files:**

- Create: `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md`

- [ ] **Step 1: Run the branch survey commands.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git branch -a | grep -iE 'tron|sw4p' > /tmp/sw4p_tron_branches.txt || true
git log --all --oneline | grep -iE 'tron|allbridge|usdt' | head -100 > /tmp/sw4p_tron_commits.txt || true
ls -la sw4p/sw4p-backend/src/ | grep -iE 'tron|allbridge|bridge|route' > /tmp/sw4p_backend_files.txt
ls -la sw4p-kit/src/core/ > /tmp/sw4p_kit_files.txt
```

- [ ] **Step 2: Compose the inventory doc.**

The doc must contain, with one section per item:

1. **Branch presence.** Table of the four legacy branches named in the PRD with a `present` or `absent` column. Reference `/tmp/sw4p_tron_branches.txt`.
2. **Backend surface.** Table of the seven Rust files named in the PRD section 3 table with current line counts and a one-sentence verdict each.
3. **Kit surface.** Current `sw4p-kit/src/core/intent.ts` ChainSchema and AssetSchema. Note Tron absence.
4. **Frontend surface.** Note that frontend is out of scope for M0 to M2.
5. **MCP gateway surface.** Confirm `sw4p-mcp-gateway/src/index.ts` and `src/tools.ts` exist.
6. **Provider source check.** Confirm `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md` exists and capture the TRX line.
7. **Gap report.** Five concrete gaps the rest of the plan must close, with the task ID that closes each.

- [ ] **Step 3: Verify.**

Run: `wc -l docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md`. Expected: at least 80 lines and at most 250 lines. A doc shorter than 80 lines is under-detailed; longer than 250 means scope creep.

- [ ] **Step 4: Commit.**

```bash
git add docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md
git commit -m "docs(sw4p): wp0 inventory for usdt tron parity m0 to m2"
```

---

## Task T1: Route State Types

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Create the `route_state` module that every downstream Rust module will import.

**PRD/CRD/TRD/SOW IDs:** CRD section 5.1, 5.2; TRD section 3.5; SOW WP1.4, WP1.6.

**Files:**

- Create: `sw4p/sw4p-backend/src/route_state.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod route_state;`)

- [ ] **Step 1: Write the failing tests.**

Create `sw4p/sw4p-backend/src/route_state.rs` with this content:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PrimaryState {
    Live,
    CanaryAuthorized,
    CodeSupportedProofMissing,
    ProviderSupportedCodeIncomplete,
    ProviderUnsupported,
    Suspended,
    PolicyBlocked,
    OutOfScope,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Asset { Usdc, Usdt }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TokenStandard { Erc20, Spl, Trc20, Other }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Provider { CircleCctpV2, AllbridgeCore }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProviderMechanism { Pool, Cctp, CctpV2, Oft, Unknown }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SupportFlag { Supported, Unsupported, Unknown }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QuoteSupport { Available, Unavailable, Unknown }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CodeSupport { Implemented, Partial, NotImplemented }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProofState {
    None,
    ProviderMetadataOnly,
    ProviderQuoteOnly,
    RawTxBuilt,
    SignedSourceTx,
    SourceTxConfirmed,
    DestinationSettled,
    ProviderConfirmedNonprod,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LiquidityState { Unknown, Available, Insufficient, Imbalanced }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProviderHealth { Unknown, Ok, Degraded, Paused }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PolicyState { Allowed, Blocked, ReviewRequired }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RuntimeExposure { Hidden, OperatorOnly, AgentVisible, UserVisible }

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RouteState {
    pub route_id: String,
    pub primary: PrimaryState,
    pub asset: Asset,
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token_standard: TokenStandard,
    pub destination_token_standard: TokenStandard,
    pub provider: Provider,
    pub provider_mechanism: Option<ProviderMechanism>,
    pub provider_support: SupportFlag,
    pub quote_support: QuoteSupport,
    pub code_support: CodeSupport,
    pub proof_state: ProofState,
    pub liquidity_state: LiquidityState,
    pub provider_health: ProviderHealth,
    pub policy_state: PolicyState,
    pub runtime_exposure: RuntimeExposure,
    pub registry_snapshot_at: String,
    pub registry_expires_at: String,
    pub user_visible_reason: String,
    pub agent_reason_code: String,
    pub remediation: Option<String>,
}

impl RouteState {
    pub fn is_user_executable(&self) -> bool {
        matches!(self.primary, PrimaryState::Live | PrimaryState::CanaryAuthorized)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn primary_state_serializes_to_snake_case() {
        let j = serde_json::to_string(&PrimaryState::ProviderSupportedCodeIncomplete).unwrap();
        assert_eq!(j, "\"provider_supported_code_incomplete\"");
    }

    #[test]
    fn route_state_round_trips_through_json() {
        let s = RouteState {
            route_id: "SOL:USDT->TRX:USDT:allbridge_core".to_string(),
            primary: PrimaryState::ProviderSupportedCodeIncomplete,
            asset: Asset::Usdt,
            source_chain: "SOL".to_string(),
            destination_chain: "TRX".to_string(),
            source_token_standard: TokenStandard::Spl,
            destination_token_standard: TokenStandard::Trc20,
            provider: Provider::AllbridgeCore,
            provider_mechanism: Some(ProviderMechanism::Pool),
            provider_support: SupportFlag::Supported,
            quote_support: QuoteSupport::Unknown,
            code_support: CodeSupport::NotImplemented,
            proof_state: ProofState::ProviderMetadataOnly,
            liquidity_state: LiquidityState::Unknown,
            provider_health: ProviderHealth::Unknown,
            policy_state: PolicyState::ReviewRequired,
            runtime_exposure: RuntimeExposure::AgentVisible,
            registry_snapshot_at: "2026-05-18T00:00:00Z".to_string(),
            registry_expires_at: "2026-05-18T06:00:00Z".to_string(),
            user_visible_reason: "Solana to Tron USDT route is not yet implemented.".to_string(),
            agent_reason_code: "SOL_TO_TRON_NOT_IMPLEMENTED".to_string(),
            remediation: Some("Complete WS6.3 before exposing live.".to_string()),
        };
        let j = serde_json::to_string(&s).unwrap();
        let back: RouteState = serde_json::from_str(&j).unwrap();
        assert_eq!(s, back);
    }

    #[test]
    fn is_user_executable_only_live_and_canary() {
        let mut s = RouteState {
            route_id: "x".to_string(),
            primary: PrimaryState::Live,
            asset: Asset::Usdc,
            source_chain: "ETH".to_string(),
            destination_chain: "BASE".to_string(),
            source_token_standard: TokenStandard::Erc20,
            destination_token_standard: TokenStandard::Erc20,
            provider: Provider::CircleCctpV2,
            provider_mechanism: Some(ProviderMechanism::CctpV2),
            provider_support: SupportFlag::Supported,
            quote_support: QuoteSupport::Available,
            code_support: CodeSupport::Implemented,
            proof_state: ProofState::DestinationSettled,
            liquidity_state: LiquidityState::Available,
            provider_health: ProviderHealth::Ok,
            policy_state: PolicyState::Allowed,
            runtime_exposure: RuntimeExposure::UserVisible,
            registry_snapshot_at: "x".to_string(),
            registry_expires_at: "x".to_string(),
            user_visible_reason: "x".to_string(),
            agent_reason_code: "OK".to_string(),
            remediation: None,
        };
        assert!(s.is_user_executable());
        s.primary = PrimaryState::CanaryAuthorized; assert!(s.is_user_executable());
        s.primary = PrimaryState::Suspended; assert!(!s.is_user_executable());
        s.primary = PrimaryState::ProviderUnsupported; assert!(!s.is_user_executable());
        s.primary = PrimaryState::OutOfScope; assert!(!s.is_user_executable());
    }
}
```

- [ ] **Step 2: Wire the module.**

Open `sw4p/sw4p-backend/src/lib.rs` (or `main.rs` if `lib.rs` does not exist) and add the declaration in the correct alphabetical position among the existing `pub mod` lines:

```rust
pub mod route_state;
```

- [ ] **Step 3: Run the tests, expect FAIL on first compile then PASS.**

```bash
cd sw4p/sw4p-backend
cargo test --lib route_state -- --nocapture
```

Expected on the first run after the file is in place: three PASS. If any FAIL, the implementer fixes inline and reruns. Do not move on with red tests.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/route_state.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): add route_state types for usdt tron parity"
```

---

## Task T4: Route-Truth Migrations

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add the three PostgreSQL migrations that back the route truth layer.

**PRD/CRD/TRD/SOW IDs:** TRD section 11 (`provider_route_snapshots`, `route_states`, `route_state_history`); SOW WP7.1 (early subset).

**Files:**

- Create: `sw4p/sw4p-backend/migrations/20260518100000_provider_route_snapshots.sql`
- Create: `sw4p/sw4p-backend/migrations/20260518100100_route_states.sql`
- Create: `sw4p/sw4p-backend/migrations/20260518100200_route_state_history.sql`

- [ ] **Step 1: Write the migrations.**

`20260518100000_provider_route_snapshots.sql`:

```sql
CREATE TABLE IF NOT EXISTS provider_route_snapshots (
    snapshot_id        TEXT PRIMARY KEY,
    provider           TEXT NOT NULL,
    fetched_at         TIMESTAMPTZ NOT NULL,
    expires_at         TIMESTAMPTZ NOT NULL,
    source_url_or_sdk  TEXT NOT NULL,
    raw_response_hash  TEXT NOT NULL,
    normalized_hash    TEXT NOT NULL,
    raw_response       JSONB NOT NULL,
    normalized_routes  JSONB NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_route_snapshots_provider_fetched
    ON provider_route_snapshots (provider, fetched_at DESC);
```

`20260518100100_route_states.sql`:

```sql
CREATE TABLE IF NOT EXISTS route_states (
    route_id                 TEXT PRIMARY KEY,
    primary_state            TEXT NOT NULL,
    asset                    TEXT NOT NULL,
    source_chain             TEXT NOT NULL,
    destination_chain        TEXT NOT NULL,
    source_token_standard    TEXT NOT NULL,
    destination_token_standard TEXT NOT NULL,
    provider                 TEXT NOT NULL,
    provider_mechanism       TEXT,
    provider_support         TEXT NOT NULL,
    quote_support            TEXT NOT NULL,
    code_support             TEXT NOT NULL,
    proof_state              TEXT NOT NULL,
    liquidity_state          TEXT NOT NULL,
    provider_health          TEXT NOT NULL,
    policy_state             TEXT NOT NULL,
    runtime_exposure         TEXT NOT NULL,
    registry_snapshot_at     TIMESTAMPTZ NOT NULL,
    registry_expires_at      TIMESTAMPTZ NOT NULL,
    user_visible_reason      TEXT NOT NULL,
    agent_reason_code        TEXT NOT NULL,
    remediation              TEXT,
    snapshot_id              TEXT NOT NULL REFERENCES provider_route_snapshots(snapshot_id),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_states_primary ON route_states (primary_state);
CREATE INDEX IF NOT EXISTS idx_route_states_asset_chains ON route_states (asset, source_chain, destination_chain);
```

`20260518100200_route_state_history.sql`:

```sql
CREATE TABLE IF NOT EXISTS route_state_history (
    history_id      BIGSERIAL PRIMARY KEY,
    route_id        TEXT NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    prior_state     TEXT,
    next_state      TEXT NOT NULL,
    reason_code     TEXT NOT NULL,
    snapshot_id     TEXT NOT NULL REFERENCES provider_route_snapshots(snapshot_id),
    payload         JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_state_history_route_time
    ON route_state_history (route_id, transitioned_at DESC);
```

- [ ] **Step 2: Verify migrations apply cleanly.**

```bash
cd sw4p/sw4p-backend
DATABASE_URL=postgres://localhost/sw4p_test sqlx migrate run --dry-run || true
DATABASE_URL=postgres://localhost/sw4p_test sqlx migrate run
DATABASE_URL=postgres://localhost/sw4p_test psql -c '\d provider_route_snapshots'
DATABASE_URL=postgres://localhost/sw4p_test psql -c '\d route_states'
DATABASE_URL=postgres://localhost/sw4p_test psql -c '\d route_state_history'
```

Expected: each `\d` lists every column from the migration. If Postgres is not running locally, the implementer reports DONE_WITH_CONCERNS naming the missing database and the controller decides whether to spin one up.

- [ ] **Step 3: Commit.**

```bash
git add sw4p/sw4p-backend/migrations/2026051810*.sql
git commit -m "feat(sw4p): migrations for provider route snapshots and route states"
```

---

## Task T2: Allbridge Provider Snapshot Fetcher

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `allbridge_registry::fetch_snapshot` that talks to the live Allbridge token-info endpoint, computes hashes, and persists a snapshot through SQLx.

**PRD/CRD/TRD/SOW IDs:** PRD G3, G4; CRD section 4.2, 11 (CRD-PROOF-001); TRD section 3.4 (TRD-REG-001, TRD-REG-002, TRD-REG-003, TRD-REG-010), TRD section 3.5; SOW WP1.1, WP1.3.

**Files:**

- Create: `sw4p/sw4p-backend/src/allbridge_registry.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod allbridge_registry;`)
- Test fixture: `sw4p/sw4p-backend/tests/fixtures/allbridge_token_info_2026-05-18.json` (paste the live probe response from `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md`)

- [ ] **Step 1: Write the failing wiremock-based test.**

```rust
// at the bottom of sw4p-backend/src/allbridge_registry.rs
#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::{matchers::method, matchers::path, Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn fetches_snapshot_hashes_response_and_persists() {
        let server = MockServer::start().await;
        let fixture = include_str!("../tests/fixtures/allbridge_token_info_2026-05-18.json");
        Mock::given(method("GET"))
            .and(path("/token-info"))
            .respond_with(ResponseTemplate::new(200).set_body_string(fixture))
            .mount(&server)
            .await;

        let pool = test_pool().await;
        let cfg = RegistryConfig {
            base_url: server.uri(),
            ttl_seconds: 3600,
            now: std::time::SystemTime::now,
        };
        let snapshot = fetch_snapshot(&cfg, &pool).await.expect("fetch ok");
        assert_eq!(snapshot.provider, "allbridge_core");
        assert!(!snapshot.raw_response_hash.is_empty());
        assert!(!snapshot.normalized_hash.is_empty());
        let row: (String, String) = sqlx::query_as(
            "SELECT snapshot_id, raw_response_hash FROM provider_route_snapshots WHERE snapshot_id = $1",
        )
        .bind(&snapshot.snapshot_id)
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(row.0, snapshot.snapshot_id);
        assert_eq!(row.1, snapshot.raw_response_hash);
    }

    #[tokio::test]
    async fn rejects_when_provider_returns_5xx_and_no_fresh_snapshot_exists() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/token-info"))
            .respond_with(ResponseTemplate::new(503))
            .mount(&server)
            .await;
        let pool = test_pool().await;
        let cfg = RegistryConfig { base_url: server.uri(), ttl_seconds: 3600, now: std::time::SystemTime::now };
        let err = fetch_snapshot(&cfg, &pool).await.unwrap_err();
        assert!(matches!(err, RegistryError::ProviderUnavailable { .. }));
    }
}
```

Helper `test_pool()` lives in `sw4p-backend/src/test_support.rs` if it exists; if it does not, the implementer creates it as a minimal `async fn test_pool() -> sqlx::PgPool` reading from `TEST_DATABASE_URL` and running migrations.

- [ ] **Step 2: Implement the minimal module to make the tests pass.**

```rust
use serde::Serialize;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use std::time::SystemTime;
use thiserror::Error;

pub struct RegistryConfig {
    pub base_url: String,
    pub ttl_seconds: i64,
    pub now: fn() -> SystemTime,
}

#[derive(Debug, Serialize)]
pub struct Snapshot {
    pub snapshot_id: String,
    pub provider: String,
    pub fetched_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub source_url_or_sdk: String,
    pub raw_response_hash: String,
    pub normalized_hash: String,
    pub raw_response: serde_json::Value,
    pub normalized_routes: serde_json::Value,
}

#[derive(Debug, Error)]
pub enum RegistryError {
    #[error("provider unavailable: {status}")]
    ProviderUnavailable { status: u16 },
    #[error("invalid provider payload: {0}")]
    InvalidPayload(String),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),
}

pub async fn fetch_snapshot(cfg: &RegistryConfig, pool: &PgPool) -> Result<Snapshot, RegistryError> {
    let url = format!("{}/token-info", cfg.base_url.trim_end_matches('/'));
    let resp = reqwest::get(&url).await?;
    if !resp.status().is_success() {
        return Err(RegistryError::ProviderUnavailable { status: resp.status().as_u16() });
    }
    let raw_text = resp.text().await?;
    let raw_json: serde_json::Value = serde_json::from_str(&raw_text)
        .map_err(|e| RegistryError::InvalidPayload(e.to_string()))?;
    let raw_hash = hex_sha256(raw_text.as_bytes());

    let normalized = crate::route_matrix::normalize(&raw_json)
        .map_err(|e| RegistryError::InvalidPayload(e.to_string()))?;
    let normalized_text = serde_json::to_string(&normalized).expect("normalize serializes");
    let normalized_hash = hex_sha256(normalized_text.as_bytes());

    let now = chrono::DateTime::<chrono::Utc>::from(cfg.now.call(()));
    let expires_at = now + chrono::Duration::seconds(cfg.ttl_seconds);
    let snapshot_id = format!("ab-{}", &raw_hash[..16]);

    sqlx::query(
        r#"INSERT INTO provider_route_snapshots
           (snapshot_id, provider, fetched_at, expires_at, source_url_or_sdk,
            raw_response_hash, normalized_hash, raw_response, normalized_routes)
           VALUES ($1, 'allbridge_core', $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (snapshot_id) DO NOTHING"#,
    )
    .bind(&snapshot_id)
    .bind(now)
    .bind(expires_at)
    .bind(&url)
    .bind(&raw_hash)
    .bind(&normalized_hash)
    .bind(&raw_json)
    .bind(&normalized)
    .execute(pool)
    .await?;

    Ok(Snapshot {
        snapshot_id,
        provider: "allbridge_core".to_string(),
        fetched_at: now,
        expires_at,
        source_url_or_sdk: url,
        raw_response_hash: raw_hash,
        normalized_hash,
        raw_response: raw_json,
        normalized_routes: normalized,
    })
}

fn hex_sha256(b: &[u8]) -> String {
    let mut h = Sha256::new();
    h.update(b);
    hex::encode(h.finalize())
}
```

Add to `sw4p-backend/Cargo.toml` only if missing (do not duplicate): `sha2 = "0.10"`, `hex = "0.4"`, `chrono = { version = "0.4", features = ["serde"] }`. The implementer must run `cargo add` only for missing crates and report any addition in DONE_WITH_CONCERNS.

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
TEST_DATABASE_URL=postgres://localhost/sw4p_test cargo test --lib allbridge_registry -- --nocapture
```

Expected: both PASS.

- [ ] **Step 4: Wire and commit.**

```bash
git add sw4p/sw4p-backend/src/allbridge_registry.rs sw4p/sw4p-backend/src/lib.rs sw4p/sw4p-backend/tests/fixtures/allbridge_token_info_2026-05-18.json sw4p/sw4p-backend/Cargo.toml sw4p/sw4p-backend/Cargo.lock
git commit -m "feat(sw4p): allbridge provider snapshot fetcher with ttl"
```

---

## Task T3: Route Matrix Normalizer

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `route_matrix::normalize` that converts the raw Allbridge token-info JSON into a stable `serde_json::Value` array suitable for hashing.

**PRD/CRD/TRD/SOW IDs:** TRD section 3.4 (TRD-REG-001, TRD-REG-005, TRD-REG-006, TRD-REG-007), section 3.5; SOW WP1.2.

**Files:**

- Create: `sw4p/sw4p-backend/src/route_matrix.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod route_matrix;`)

- [ ] **Step 1: Write the failing tests.**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn fixture() -> serde_json::Value {
        json!({
            "ETH": { "chainId": 1, "tokens": ["USDC", "USDT", "USDe"] },
            "BAS": { "chainId": 9, "tokens": ["USDC"] },
            "TRX": { "chainId": 3, "tokens": ["USDT"] },
            "SOL": { "chainId": 4, "tokens": ["USDC", "USDT"] }
        })
    }

    #[test]
    fn excludes_btc_and_omni() {
        let mut x = fixture();
        x["BTC"] = json!({ "chainId": 0, "tokens": ["USDT"] });
        x["OMNI"] = json!({ "chainId": 0, "tokens": ["USDT"] });
        let routes = normalize(&x).expect("ok");
        let arr = routes.as_array().unwrap();
        assert!(arr.iter().all(|r| r["source_chain"] != "BTC" && r["destination_chain"] != "BTC"));
        assert!(arr.iter().all(|r| r["source_chain"] != "OMNI" && r["destination_chain"] != "OMNI"));
    }

    #[test]
    fn marks_base_usdt_provider_unsupported_when_absent() {
        let routes = normalize(&fixture()).expect("ok");
        let arr = routes.as_array().unwrap();
        let base_usdt: Vec<_> = arr.iter().filter(|r|
            r["source_chain"] == "BAS" && r["source_token"] == "USDT"
        ).collect();
        assert!(base_usdt.is_empty(), "Base must not emit a USDT source row when provider has only USDC");
    }

    #[test]
    fn marks_tron_usdc_provider_unsupported_when_absent() {
        let routes = normalize(&fixture()).expect("ok");
        let arr = routes.as_array().unwrap();
        assert!(arr.iter().all(|r|
            !(r["source_chain"] == "TRX" && r["source_token"] == "USDC")
        ));
    }

    #[test]
    fn produces_stable_hash_input() {
        let a = normalize(&fixture()).unwrap();
        let b = normalize(&fixture()).unwrap();
        assert_eq!(serde_json::to_string(&a).unwrap(), serde_json::to_string(&b).unwrap());
    }
}
```

- [ ] **Step 2: Implement the minimal normalizer.**

```rust
use serde_json::{json, Value};
use std::collections::BTreeMap;

#[derive(Debug, thiserror::Error)]
#[error("normalize: {0}")]
pub struct NormalizeError(String);

pub fn normalize(raw: &Value) -> Result<Value, NormalizeError> {
    let obj = raw.as_object().ok_or_else(|| NormalizeError("expected object".into()))?;
    let mut chains: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for (chain, info) in obj {
        if matches!(chain.as_str(), "BTC" | "OMNI") { continue; }
        let tokens = info["tokens"].as_array().ok_or_else(||
            NormalizeError(format!("{}: missing tokens array", chain)))?;
        let toks: Vec<String> = tokens.iter()
            .filter_map(|t| t.as_str().map(|s| s.to_string()))
            .filter(|t| matches!(t.as_str(), "USDC" | "USDT"))
            .collect();
        if !toks.is_empty() {
            chains.insert(chain.clone(), toks);
        }
    }
    let mut routes: Vec<Value> = Vec::new();
    for (src, src_toks) in &chains {
        for (dst, dst_toks) in &chains {
            if src == dst { continue; }
            for asset in ["USDC", "USDT"] {
                if !src_toks.iter().any(|t| t == asset) { continue; }
                if !dst_toks.iter().any(|t| t == asset) { continue; }
                routes.push(json!({
                    "source_chain": src,
                    "destination_chain": dst,
                    "source_token": asset,
                    "destination_token": asset,
                    "provider": "allbridge_core",
                }));
            }
        }
    }
    Ok(Value::Array(routes))
}
```

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib route_matrix -- --nocapture
```

Expected: four PASS.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/route_matrix.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): route matrix normalizer with btc and omni exclusion"
```

---

## Task T5: Policy Filter

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `policy::apply` that takes a normalized route list and produces `RouteState` rows with `policy_state` and `primary` decided.

**PRD/CRD/TRD/SOW IDs:** PRD G3, G6; CRD principles 5 and 8, section 6; TRD section 4.3 (TRD-SEL-003, TRD-SEL-004, TRD-SEL-005); SOW WP1.5, WP2.4.

**Files:**

- Create: `sw4p/sw4p-backend/src/policy.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod policy;`)

- [ ] **Step 1: Write the failing tests.**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::route_state::*;
    use serde_json::json;

    fn route(src: &str, dst: &str, asset: &str) -> serde_json::Value {
        json!({
            "source_chain": src, "destination_chain": dst,
            "source_token": asset, "destination_token": asset,
            "provider": "allbridge_core"
        })
    }

    #[test]
    fn polygon_to_tron_usdt_passes_policy_and_remains_gated_until_proof() {
        let snap = SnapshotMeta { snapshot_id: "x".into(), fetched_at: "t".into(), expires_at: "t".into() };
        let out = apply(&[route("POL", "TRX", "USDT")], &snap);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].policy_state, PolicyState::Allowed);
        assert_eq!(out[0].primary, PrimaryState::CodeSupportedProofMissing);
    }

    #[test]
    fn unichain_to_tron_is_policy_blocked() {
        let snap = SnapshotMeta { snapshot_id: "x".into(), fetched_at: "t".into(), expires_at: "t".into() };
        let out = apply(&[route("UNI", "TRX", "USDT")], &snap);
        assert_eq!(out[0].policy_state, PolicyState::Blocked);
        assert_eq!(out[0].primary, PrimaryState::PolicyBlocked);
    }

    #[test]
    fn solana_to_tron_is_provider_supported_code_incomplete() {
        let snap = SnapshotMeta { snapshot_id: "x".into(), fetched_at: "t".into(), expires_at: "t".into() };
        let out = apply(&[route("SOL", "TRX", "USDT")], &snap);
        assert_eq!(out[0].primary, PrimaryState::ProviderSupportedCodeIncomplete);
        assert_eq!(out[0].agent_reason_code, "SOL_TO_TRON_NOT_IMPLEMENTED");
    }

    #[test]
    fn base_usdt_source_is_filtered_out_upstream_and_never_appears() {
        // Normalizer already drops Base USDT. Policy must not invent it back.
        let snap = SnapshotMeta { snapshot_id: "x".into(), fetched_at: "t".into(), expires_at: "t".into() };
        let out = apply(&[], &snap);
        assert!(out.iter().all(|r|
            !(r.source_chain == "BAS" && r.asset == Asset::Usdt)
        ));
    }
}
```

- [ ] **Step 2: Implement.**

```rust
use crate::route_state::*;
use serde_json::Value;

pub struct SnapshotMeta {
    pub snapshot_id: String,
    pub fetched_at: String,
    pub expires_at: String,
}

pub fn apply(routes: &[Value], snap: &SnapshotMeta) -> Vec<RouteState> {
    routes.iter().filter_map(|r| build_one(r, snap)).collect()
}

fn build_one(r: &Value, snap: &SnapshotMeta) -> Option<RouteState> {
    let src = r["source_chain"].as_str()?.to_string();
    let dst = r["destination_chain"].as_str()?.to_string();
    let asset_str = r["source_token"].as_str()?;
    let asset = match asset_str { "USDC" => Asset::Usdc, "USDT" => Asset::Usdt, _ => return None };

    let policy_state = policy_for(&src, &dst, asset);
    let (primary, reason_code, reason) = primary_for(&src, &dst, asset, policy_state);

    Some(RouteState {
        route_id: format!("{}:{:?}->{}:{:?}:allbridge_core", src, asset, dst, asset),
        primary,
        asset,
        source_chain: src.clone(),
        destination_chain: dst.clone(),
        source_token_standard: standard_for(&src),
        destination_token_standard: standard_for(&dst),
        provider: Provider::AllbridgeCore,
        provider_mechanism: Some(ProviderMechanism::Unknown),
        provider_support: SupportFlag::Supported,
        quote_support: QuoteSupport::Unknown,
        code_support: code_support_for(&src, &dst),
        proof_state: ProofState::ProviderMetadataOnly,
        liquidity_state: LiquidityState::Unknown,
        provider_health: ProviderHealth::Unknown,
        policy_state,
        runtime_exposure: RuntimeExposure::AgentVisible,
        registry_snapshot_at: snap.fetched_at.clone(),
        registry_expires_at: snap.expires_at.clone(),
        user_visible_reason: reason,
        agent_reason_code: reason_code.to_string(),
        remediation: None,
    })
}

fn policy_for(_src: &str, _dst: &str, _asset: Asset) -> PolicyState {
    // Unichain is policy-blocked until runtime admits it.
    if _src == "UNI" || _dst == "UNI" { return PolicyState::Blocked; }
    PolicyState::Allowed
}

fn primary_for(src: &str, dst: &str, _asset: Asset, policy: PolicyState)
    -> (PrimaryState, &'static str, String)
{
    if policy == PolicyState::Blocked {
        return (PrimaryState::PolicyBlocked, "POLICY_BLOCKED",
                "Route is provider-supported but disabled by sw4p policy.".to_string());
    }
    if src == "SOL" && dst == "TRX" {
        return (PrimaryState::ProviderSupportedCodeIncomplete, "SOL_TO_TRON_NOT_IMPLEMENTED",
                "Solana to Tron USDT execution is not yet implemented in sw4p.".to_string());
    }
    (PrimaryState::CodeSupportedProofMissing, "PROOF_PENDING",
     "Route is code-ready but awaits provider-confirmed proof or authorized canary.".to_string())
}

fn standard_for(chain: &str) -> TokenStandard {
    match chain {
        "TRX" => TokenStandard::Trc20,
        "SOL" => TokenStandard::Spl,
        _ => TokenStandard::Erc20,
    }
}

fn code_support_for(src: &str, dst: &str) -> CodeSupport {
    if src == "SOL" && dst == "TRX" { CodeSupport::NotImplemented } else { CodeSupport::Partial }
}
```

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib policy -- --nocapture
```

Expected: four PASS.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/policy.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): policy filter unichain block sol to tron incomplete"
```

---

## Task T6: Rail Selector Refactor

**Wave:** W3. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Modify `route_selector.rs` so it consumes `RouteState` from the policy module and never silently substitutes asset, chain, or provider.

**PRD/CRD/TRD/SOW IDs:** PRD-USDT-007, PRD-USDT-013, PRD-USDT-014; CRD principles 1 to 6; TRD section 4 (TRD-SEL-001 through TRD-SEL-007); SOW WP2.1, WP2.2, WP2.3.

**Files:**

- Modify: `sw4p/sw4p-backend/src/route_selector.rs` (entire `eligible_protocols` and selection path)

- [ ] **Step 1: Read the current selector.**

```bash
sed -n '120,200p' sw4p/sw4p-backend/src/route_selector.rs
```

Implementer notes the current `eligible_protocols` function shape around line 138 to 165 before editing. The refactor must preserve callers that consume `BridgeProtocol` and add a new path returning `Result<BridgeProtocol, RouteState>` so unsupported routes fail closed with the structured reason.

- [ ] **Step 2: Write the failing test.**

Append to `sw4p/sw4p-backend/src/route_selector.rs`:

```rust
#[cfg(test)]
mod selector_v2 {
    use super::*;
    use crate::route_state::*;

    fn live_usdc() -> RouteState { /* fixture in helper */ unimplemented!() }
    fn gated_sol_to_tron_usdt() -> RouteState { /* fixture */ unimplemented!() }

    #[test]
    fn select_returns_protocol_for_executable_route() {
        let s = live_usdc();
        let got = select_from_state(&s).unwrap();
        assert_eq!(got, BridgeProtocol::CctpV2);
    }

    #[test]
    fn select_returns_route_state_for_non_executable_route() {
        let s = gated_sol_to_tron_usdt();
        let err = select_from_state(&s).unwrap_err();
        assert_eq!(err.primary, PrimaryState::ProviderSupportedCodeIncomplete);
    }
}
```

Replace the two `unimplemented!()` helpers with concrete fixtures matching the patterns in `route_state::tests::route_state_round_trips_through_json`.

- [ ] **Step 3: Implement `select_from_state`.**

```rust
use crate::route_state::{RouteState, Provider, PrimaryState};

pub fn select_from_state(state: &RouteState) -> Result<BridgeProtocol, RouteState> {
    if !matches!(state.primary, PrimaryState::Live | PrimaryState::CanaryAuthorized) {
        return Err(state.clone());
    }
    Ok(match state.provider {
        Provider::CircleCctpV2 => BridgeProtocol::CctpV2,
        Provider::AllbridgeCore => BridgeProtocol::AllbridgeCore,
    })
}
```

Leave the existing `eligible_protocols` function in place for now. T7 will add the regression tests against it.

- [ ] **Step 4: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib route_selector -- --nocapture
```

Expected: existing tests still PASS plus two new PASS.

- [ ] **Step 5: Commit.**

```bash
git add sw4p/sw4p-backend/src/route_selector.rs
git commit -m "refactor(sw4p): route selector consumes route state and fails closed"
```

---

## Task T7: Substitution Regression Tests

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Lock down the "no silent substitution" contract with a dedicated regression test file.

**PRD/CRD/TRD/SOW IDs:** PRD-USDT-014; CRD principle 6; TRD section 4 (TRD-SEL-002, TRD-SEL-007); SOW WP2.2.

**Files:**

- Create: `sw4p/sw4p-backend/tests/route_substitution.rs`

- [ ] **Step 1: Write the tests.**

```rust
use sw4p_backend::route_state::*;
use sw4p_backend::policy::{apply, SnapshotMeta};
use sw4p_backend::route_matrix::normalize;
use serde_json::json;

fn snap() -> SnapshotMeta {
    SnapshotMeta {
        snapshot_id: "fixture".into(),
        fetched_at: "2026-05-18T00:00:00Z".into(),
        expires_at: "2026-05-18T06:00:00Z".into(),
    }
}

#[test]
fn base_usdt_to_tron_usdt_does_not_get_silently_mapped_to_usdc() {
    let raw = json!({
        "BAS": { "chainId": 9, "tokens": ["USDC"] },
        "TRX": { "chainId": 3, "tokens": ["USDT"] }
    });
    let routes = normalize(&raw).expect("normalize ok");
    let states = apply(routes.as_array().unwrap().as_slice(), &snap());
    assert!(states.iter().all(|s|
        !(s.source_chain == "BAS" && matches!(s.asset, Asset::Usdt))
    ),
    "Base must never emit a USDT source row when provider snapshot only lists USDC");
    assert!(states.iter().all(|s|
        !(s.source_chain == "BAS" && s.destination_chain == "TRX"
          && matches!(s.asset, Asset::Usdc))
    ),
    "Base USDC to Tron must not be invented; Tron has no USDC support in this snapshot");
}

#[test]
fn tron_usdc_does_not_appear_when_provider_omits_it() {
    let raw = json!({
        "TRX": { "chainId": 3, "tokens": ["USDT"] },
        "ETH": { "chainId": 1, "tokens": ["USDC", "USDT"] }
    });
    let routes = normalize(&raw).unwrap();
    let states = apply(routes.as_array().unwrap().as_slice(), &snap());
    assert!(states.iter().all(|s|
        !(s.source_chain == "TRX" && matches!(s.asset, Asset::Usdc))
    ));
    assert!(states.iter().all(|s|
        !(s.destination_chain == "TRX" && matches!(s.asset, Asset::Usdc))
    ));
}

#[test]
fn btc_and_omni_are_never_in_any_route() {
    let raw = json!({
        "BTC": { "chainId": 0, "tokens": ["USDT"] },
        "OMNI": { "chainId": 0, "tokens": ["USDT"] },
        "ETH": { "chainId": 1, "tokens": ["USDC", "USDT"] },
        "TRX": { "chainId": 3, "tokens": ["USDT"] }
    });
    let routes = normalize(&raw).unwrap();
    let states = apply(routes.as_array().unwrap().as_slice(), &snap());
    assert!(states.iter().all(|s| s.source_chain != "BTC" && s.destination_chain != "BTC"));
    assert!(states.iter().all(|s| s.source_chain != "OMNI" && s.destination_chain != "OMNI"));
}
```

- [ ] **Step 2: Run the regression suite.**

```bash
cd sw4p/sw4p-backend
cargo test --test route_substitution -- --nocapture
```

Expected: three PASS.

- [ ] **Step 3: Commit.**

```bash
git add sw4p/sw4p-backend/tests/route_substitution.rs
git commit -m "test(sw4p): regression for no silent route substitution"
```

---

## Task T8: Allbridge Contract Allowlist

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Create the per-chain allowlist of current Allbridge contract and pool addresses used downstream by the raw-tx validator.

**PRD/CRD/TRD/SOW IDs:** CRD CRD-PROOF-001, CRD-SEC-004; TRD section 6 (TRD-RAW-001, TRD-RAW-002); SOW WP4.1.

**Files:**

- Create: `sw4p/sw4p-backend/src/allbridge_allowlist.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod allbridge_allowlist;`)

- [ ] **Step 1: Write the failing tests.**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tron_allbridge_contract_is_present_and_starts_with_t() {
        let addr = contract_for("TRX").expect("tron contract present");
        assert!(addr.starts_with('T'));
    }

    #[test]
    fn ethereum_allbridge_contract_is_evm_format() {
        let addr = contract_for("ETH").expect("eth contract present");
        assert!(addr.starts_with("0x") && addr.len() == 42);
    }

    #[test]
    fn unknown_chain_returns_none() {
        assert!(contract_for("BTC").is_none());
        assert!(contract_for("OMNI").is_none());
    }

    #[test]
    fn is_allowed_contract_matches_case_insensitively_for_evm() {
        let addr = contract_for("ETH").unwrap();
        assert!(is_allowed_contract("ETH", &addr.to_lowercase()));
        assert!(is_allowed_contract("ETH", &addr.to_uppercase()));
    }
}
```

- [ ] **Step 2: Implement.**

```rust
use once_cell::sync::Lazy;
use std::collections::HashMap;

static CONTRACTS: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    m.insert("TRX", "TMY9xR2pBczWd32n6XAJz2N6L3Xyv5c888");
    m.insert("ETH", "0xBBbD1BbB4f9b936C3604906D7592A644071dE884");
    m.insert("ARB", "0xBBbD1BbB4f9b936C3604906D7592A644071dE884");
    m.insert("POL", "0xBBbD1BbB4f9b936C3604906D7592A644071dE884");
    m.insert("OPT", "0xBBbD1BbB4f9b936C3604906D7592A644071dE884");
    m.insert("AVA", "0xBBbD1BbB4f9b936C3604906D7592A644071dE884");
    m
});

pub fn contract_for(chain: &str) -> Option<&'static str> {
    CONTRACTS.get(chain).copied()
}

pub fn is_allowed_contract(chain: &str, addr: &str) -> bool {
    match contract_for(chain) {
        Some(expected) if chain == "TRX" => expected == addr,
        Some(expected) => expected.eq_ignore_ascii_case(addr),
        None => false,
    }
}
```

Note: the EVM Allbridge router used here is a placeholder commonly cited in Allbridge Core docs; the implementer must regenerate this list from current Allbridge provider data and either confirm or replace each address before committing. If the implementer cannot verify an address, the implementer reports DONE_WITH_CONCERNS and names the unverified entries.

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib allbridge_allowlist -- --nocapture
```

Expected: four PASS.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/allbridge_allowlist.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): allbridge contract allowlist per chain"
```

---

## Task T9: Allbridge Quote Module

**Wave:** W5. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `allbridge_quote::request` that calls the Allbridge calculation endpoint, normalizes fees, captures expiry, and hashes the response.

**PRD/CRD/TRD/SOW IDs:** PRD-USDT-015; CRD section 8 (CRD-FEE-004, CRD-FEE-006), CRD-PROOF-005; TRD section 5 (TRD-AB-001 through TRD-AB-009); SOW WP3.1, WP3.2, WP3.5, WP3.6.

**Files:**

- Create: `sw4p/sw4p-backend/src/allbridge_quote.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod allbridge_quote;`)

- [ ] **Step 1: Write the failing test.**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::{matchers::method, matchers::path, Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn quote_normalizes_fees_and_records_expiry() {
        let server = MockServer::start().await;
        let body = r#"{
            "amount_to_send_float": "100.000000",
            "amount_to_be_received_float": "99.250000",
            "min_amount_to_be_received_float": "99.100000",
            "relayer_fee": { "amount": "0.500000", "denomination": "USDT" },
            "lp_fee": { "amount": "0.250000", "denomination": "USDT" },
            "pool_impact_percent": "0.0123",
            "include_gas_fee_options": null,
            "valid_for_seconds": 30
        }"#;
        Mock::given(method("POST"))
            .and(path("/quote"))
            .respond_with(ResponseTemplate::new(200).set_body_string(body))
            .mount(&server)
            .await;

        let q = request(QuoteRequest {
            base_url: server.uri(),
            source_chain: "POL".into(),
            destination_chain: "TRX".into(),
            source_token: "USDT".into(),
            destination_token: "USDT".into(),
            amount_decimal: "100".into(),
        }).await.expect("ok");

        assert_eq!(q.amount_send, "100.000000");
        assert_eq!(q.amount_receive_expected, "99.250000");
        assert_eq!(q.amount_receive_minimum, "99.100000");
        assert_eq!(q.relayer_fee, "0.500000");
        assert_eq!(q.lp_fee, "0.250000");
        assert!(q.expires_at > chrono::Utc::now());
        assert!(!q.request_hash.is_empty());
        assert!(!q.response_hash.is_empty());
    }
}
```

- [ ] **Step 2: Implement.**

```rust
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize)]
pub struct QuoteRequest {
    pub base_url: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token: String,
    pub destination_token: String,
    pub amount_decimal: String,
}

#[derive(Debug, Clone)]
pub struct Quote {
    pub request_hash: String,
    pub response_hash: String,
    pub amount_send: String,
    pub amount_receive_expected: String,
    pub amount_receive_minimum: String,
    pub relayer_fee: String,
    pub lp_fee: String,
    pub pool_impact_pct: String,
    pub destination_gas_purchase: Option<String>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, thiserror::Error)]
pub enum QuoteError {
    #[error("provider error: {0}")] Provider(String),
    #[error("invalid payload: {0}")] Invalid(String),
    #[error("http: {0}")] Http(#[from] reqwest::Error),
}

#[derive(Debug, Deserialize)]
struct RawQuote {
    amount_to_send_float: String,
    amount_to_be_received_float: String,
    min_amount_to_be_received_float: String,
    relayer_fee: Fee,
    lp_fee: Fee,
    pool_impact_percent: String,
    include_gas_fee_options: Option<serde_json::Value>,
    valid_for_seconds: i64,
}

#[derive(Debug, Deserialize)]
struct Fee { amount: String }

pub async fn request(req: QuoteRequest) -> Result<Quote, QuoteError> {
    let url = format!("{}/quote", req.base_url.trim_end_matches('/'));
    let body = serde_json::to_string(&req).unwrap();
    let request_hash = hex_sha256(body.as_bytes());
    let resp = reqwest::Client::new().post(&url)
        .header("content-type", "application/json")
        .body(body)
        .send().await?;
    if !resp.status().is_success() {
        return Err(QuoteError::Provider(format!("status {}", resp.status())));
    }
    let raw_text = resp.text().await?;
    let response_hash = hex_sha256(raw_text.as_bytes());
    let raw: RawQuote = serde_json::from_str(&raw_text)
        .map_err(|e| QuoteError::Invalid(e.to_string()))?;
    let expires_at = chrono::Utc::now() + chrono::Duration::seconds(raw.valid_for_seconds);
    Ok(Quote {
        request_hash, response_hash,
        amount_send: raw.amount_to_send_float,
        amount_receive_expected: raw.amount_to_be_received_float,
        amount_receive_minimum: raw.min_amount_to_be_received_float,
        relayer_fee: raw.relayer_fee.amount,
        lp_fee: raw.lp_fee.amount,
        pool_impact_pct: raw.pool_impact_percent,
        destination_gas_purchase: raw.include_gas_fee_options.map(|v| v.to_string()),
        expires_at,
    })
}

fn hex_sha256(b: &[u8]) -> String {
    let mut h = Sha256::new(); h.update(b); hex::encode(h.finalize())
}
```

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib allbridge_quote -- --nocapture
```

Expected: one PASS. If the test fixture shape diverges from the live Allbridge response, the implementer fixes the deserializer and re-records the fixture, not the test expectations.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/allbridge_quote.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): allbridge quote module with hashing and expiry"
```

---

## Task T10: Allbridge Tx Builder Module

**Wave:** W5. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `allbridge_tx_builder` that returns unsigned approval and unsigned send-transaction payloads from the Allbridge raw-tx endpoint.

**PRD/CRD/TRD/SOW IDs:** PRD-USDT-017, PRD-USDT-023; CRD section 9 (CRD-APPROVAL-001 through CRD-APPROVAL-005); TRD section 5 (TRD-AB-002, TRD-AB-009); SOW WP3.3, WP3.4.

**Files:**

- Create: `sw4p/sw4p-backend/src/allbridge_tx_builder.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod allbridge_tx_builder;`)

- [ ] **Step 1: Write the failing tests.**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::{matchers::method, matchers::path, Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn build_approval_returns_payload_with_spender_and_amount() {
        let server = MockServer::start().await;
        Mock::given(method("POST")).and(path("/raw/approve"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"to":"0xBBbD1BbB4f9b936C3604906D7592A644071dE884","data":"0x095ea7b3...","value":"0","chain_id":"137"}"#
            )).mount(&server).await;

        let p = build_approval(BuildApprovalRequest {
            base_url: server.uri(),
            source_chain: "POL".into(),
            token: "USDT".into(),
            amount_decimal: "100".into(),
            owner: "0xowner".into(),
        }).await.expect("ok");

        assert_eq!(p.spender, "0xBBbD1BbB4f9b936C3604906D7592A644071dE884");
        assert_eq!(p.amount_decimal, "100");
        assert!(p.preimage_hash.len() > 0);
    }

    #[tokio::test]
    async fn build_send_returns_unsigned_payload() {
        let server = MockServer::start().await;
        Mock::given(method("POST")).and(path("/raw/send"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"to":"0xBBbD1BbB4f9b936C3604906D7592A644071dE884","data":"0x...","value":"0","chain_id":"137"}"#
            )).mount(&server).await;

        let p = build_send(BuildSendRequest {
            base_url: server.uri(),
            source_chain: "POL".into(),
            destination_chain: "TRX".into(),
            source_token: "USDT".into(),
            destination_token: "USDT".into(),
            amount_decimal: "100".into(),
            min_amount_decimal: "99.1".into(),
            recipient: "Tabcdef0123456789012345678901234".into(),
            sender: "0xsender".into(),
        }).await.expect("ok");

        assert_eq!(p.target, "0xBBbD1BbB4f9b936C3604906D7592A644071dE884");
        assert!(p.preimage_hash.len() > 0);
    }
}
```

- [ ] **Step 2: Implement.**

```rust
use serde::Serialize;
use sha2::{Digest, Sha256};

#[derive(Serialize)] pub struct BuildApprovalRequest { pub base_url: String, pub source_chain: String, pub token: String, pub amount_decimal: String, pub owner: String }
#[derive(Serialize)] pub struct BuildSendRequest { pub base_url: String, pub source_chain: String, pub destination_chain: String, pub source_token: String, pub destination_token: String, pub amount_decimal: String, pub min_amount_decimal: String, pub recipient: String, pub sender: String }

pub struct ApprovalPayload { pub spender: String, pub amount_decimal: String, pub raw_to: String, pub raw_data: String, pub raw_value: String, pub chain_id: String, pub preimage_hash: String }
pub struct SendPayload { pub target: String, pub raw_data: String, pub raw_value: String, pub chain_id: String, pub preimage_hash: String }

#[derive(Debug, thiserror::Error)]
pub enum BuilderError {
    #[error("provider error: {0}")] Provider(String),
    #[error("http: {0}")] Http(#[from] reqwest::Error),
    #[error("invalid payload: {0}")] Invalid(String),
}

pub async fn build_approval(req: BuildApprovalRequest) -> Result<ApprovalPayload, BuilderError> {
    let url = format!("{}/raw/approve", req.base_url.trim_end_matches('/'));
    let body = serde_json::to_string(&req).unwrap();
    let resp = reqwest::Client::new().post(&url)
        .header("content-type", "application/json").body(body.clone()).send().await?;
    if !resp.status().is_success() { return Err(BuilderError::Provider(format!("status {}", resp.status()))); }
    let text = resp.text().await?;
    let v: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| BuilderError::Invalid(e.to_string()))?;
    Ok(ApprovalPayload {
        spender: v["to"].as_str().ok_or_else(|| BuilderError::Invalid("missing to".into()))?.to_string(),
        amount_decimal: req.amount_decimal,
        raw_to: v["to"].as_str().unwrap().to_string(),
        raw_data: v["data"].as_str().unwrap_or("").to_string(),
        raw_value: v["value"].as_str().unwrap_or("0").to_string(),
        chain_id: v["chain_id"].as_str().unwrap_or("").to_string(),
        preimage_hash: hex_sha256(text.as_bytes()),
    })
}

pub async fn build_send(req: BuildSendRequest) -> Result<SendPayload, BuilderError> {
    let url = format!("{}/raw/send", req.base_url.trim_end_matches('/'));
    let body = serde_json::to_string(&req).unwrap();
    let resp = reqwest::Client::new().post(&url)
        .header("content-type", "application/json").body(body.clone()).send().await?;
    if !resp.status().is_success() { return Err(BuilderError::Provider(format!("status {}", resp.status()))); }
    let text = resp.text().await?;
    let v: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| BuilderError::Invalid(e.to_string()))?;
    Ok(SendPayload {
        target: v["to"].as_str().ok_or_else(|| BuilderError::Invalid("missing to".into()))?.to_string(),
        raw_data: v["data"].as_str().unwrap_or("").to_string(),
        raw_value: v["value"].as_str().unwrap_or("0").to_string(),
        chain_id: v["chain_id"].as_str().unwrap_or("").to_string(),
        preimage_hash: hex_sha256(text.as_bytes()),
    })
}

fn hex_sha256(b: &[u8]) -> String { let mut h = Sha256::new(); h.update(b); hex::encode(h.finalize()) }
```

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib allbridge_tx_builder -- --nocapture
```

Expected: two PASS.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/allbridge_tx_builder.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): allbridge unsigned approval and send tx builders"
```

---

## Task T11: Raw Transaction Validator

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `raw_tx_validator::validate` that checks every condition in TRD section 6.2 and returns a `RawTxValidationResult`.

**PRD/CRD/TRD/SOW IDs:** PRD-USDT-017; CRD section 9; TRD section 6 (TRD-RAW-001 through TRD-RAW-014); SOW WP4.2, WP4.6.

**Files:**

- Create: `sw4p/sw4p-backend/src/raw_tx_validator.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod raw_tx_validator;`)

- [ ] **Step 1: Write the failing tests.**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::route_state::*;
    use crate::allbridge_tx_builder::SendPayload;
    use crate::allbridge_quote::Quote;
    use chrono::Utc;

    fn payload_for_pol_trx() -> SendPayload {
        SendPayload {
            target: "0xBBbD1BbB4f9b936C3604906D7592A644071dE884".into(),
            raw_data: "0x...".into(),
            raw_value: "0".into(),
            chain_id: "137".into(),
            preimage_hash: "abc".into(),
        }
    }

    fn quote() -> Quote {
        Quote {
            request_hash: "rh".into(),
            response_hash: "qh".into(),
            amount_send: "100.000000".into(),
            amount_receive_expected: "99.250000".into(),
            amount_receive_minimum: "99.100000".into(),
            relayer_fee: "0.5".into(),
            lp_fee: "0.25".into(),
            pool_impact_pct: "0.0123".into(),
            destination_gas_purchase: None,
            expires_at: Utc::now() + chrono::Duration::seconds(60),
        }
    }

    fn intent() -> Intent {
        Intent {
            source_chain: "POL".into(),
            destination_chain: "TRX".into(),
            source_token: "USDT".into(),
            destination_token: "USDT".into(),
            amount_decimal: "100".into(),
            recipient: "TabcDEF0123456789012345678901234".into(),
            chain_id: Some("137".into()),
        }
    }

    fn snapshot() -> SnapshotMetaForValidator {
        SnapshotMetaForValidator { snapshot_id: "ab-xyz".into() }
    }

    #[test]
    fn validate_passes_for_well_formed_payload() {
        let r = validate(&intent(), &quote(), &payload_for_pol_trx(), &snapshot());
        match r { RawTxValidationResult::Ok { .. } => (), e => panic!("expected ok, got {:?}", e) }
    }

    #[test]
    fn validate_fails_on_wrong_target_contract() {
        let mut p = payload_for_pol_trx();
        p.target = "0x0000000000000000000000000000000000000000".into();
        let r = validate(&intent(), &quote(), &p, &snapshot());
        match r {
            RawTxValidationResult::Fail { failed_check, .. } => assert_eq!(failed_check, "target_contract_not_allowlisted"),
            _ => panic!("expected fail")
        }
    }

    #[test]
    fn validate_fails_on_expired_quote() {
        let mut q = quote();
        q.expires_at = Utc::now() - chrono::Duration::seconds(1);
        let r = validate(&intent(), &q, &payload_for_pol_trx(), &snapshot());
        match r {
            RawTxValidationResult::Fail { failed_check, .. } => assert_eq!(failed_check, "quote_expired"),
            _ => panic!("expected fail")
        }
    }

    #[test]
    fn validate_fails_on_wrong_chain_id() {
        let mut i = intent();
        i.chain_id = Some("1".into());
        let r = validate(&i, &quote(), &payload_for_pol_trx(), &snapshot());
        match r {
            RawTxValidationResult::Fail { failed_check, .. } => assert_eq!(failed_check, "chain_id_mismatch"),
            _ => panic!("expected fail")
        }
    }
}
```

- [ ] **Step 2: Implement.**

```rust
use crate::allbridge_allowlist;
use crate::allbridge_quote::Quote;
use crate::allbridge_tx_builder::SendPayload;
use serde::Serialize;

#[derive(Debug, Clone)]
pub struct Intent {
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token: String,
    pub destination_token: String,
    pub amount_decimal: String,
    pub recipient: String,
    pub chain_id: Option<String>,
}

pub struct SnapshotMetaForValidator { pub snapshot_id: String }

#[derive(Debug, Serialize)]
pub enum RawTxValidationResult {
    Ok {
        validation_id: String,
        raw_tx_hash: String,
        quote_hash: String,
        registry_snapshot_id: String,
        checks_passed: Vec<String>,
    },
    Fail {
        reason_code: String,
        reason: String,
        failed_check: String,
        remediation: Option<String>,
    },
}

pub fn validate(intent: &Intent, quote: &Quote, payload: &SendPayload, snap: &SnapshotMetaForValidator) -> RawTxValidationResult {
    let mut passed: Vec<String> = Vec::new();

    if !allbridge_allowlist::is_allowed_contract(&intent.source_chain, &payload.target) {
        return fail("target_contract_not_allowlisted",
            "Allbridge target contract is not allowlisted for the source chain.",
            "TARGET_NOT_ALLOWLISTED");
    }
    passed.push("target_contract_allowlisted".into());

    if let Some(ci) = &intent.chain_id {
        if ci != &payload.chain_id {
            return fail("chain_id_mismatch",
                "Connected wallet chain_id does not match the raw transaction chain_id.",
                "CHAIN_ID_MISMATCH");
        }
        passed.push("chain_id_match".into());
    }

    if quote.expires_at <= chrono::Utc::now() {
        return fail("quote_expired", "Quote has expired before signing.", "QUOTE_EXPIRED");
    }
    passed.push("quote_not_expired".into());

    if intent.amount_decimal != quote.amount_send {
        return fail("amount_mismatch", "Intent amount does not match quoted send amount.", "AMOUNT_MISMATCH");
    }
    passed.push("amount_match".into());

    RawTxValidationResult::Ok {
        validation_id: format!("val-{}", &payload.preimage_hash[..8.min(payload.preimage_hash.len())]),
        raw_tx_hash: payload.preimage_hash.clone(),
        quote_hash: quote.response_hash.clone(),
        registry_snapshot_id: snap.snapshot_id.clone(),
        checks_passed: passed,
    }
}

fn fail(check: &str, msg: &str, code: &str) -> RawTxValidationResult {
    RawTxValidationResult::Fail {
        reason_code: code.into(),
        reason: msg.into(),
        failed_check: check.into(),
        remediation: None,
    }
}
```

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib raw_tx_validator -- --nocapture
```

Expected: four PASS.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/raw_tx_validator.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): raw tx validator for intent vs provider payload"
```

---

## Task T12: Approval Policy

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `approval_policy` rules with bounded caps and ERC20 USDT reset support.

**PRD/CRD/TRD/SOW IDs:** CRD section 10 (CRD-APPROVAL-001 through CRD-APPROVAL-005); TRD section 7 (TRD-APP-001 through TRD-APP-008); SOW WP4.3, WP4.4, WP4.5, WP4.6.

**Files:**

- Create: `sw4p/sw4p-backend/src/approval_policy.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod approval_policy;`)

- [ ] **Step 1: Write the failing tests.**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_cap_is_exact_route_amount() {
        let p = decide(DecideInput { chain: "POL".into(), token: "USDT".into(), route_amount: "100".into(), existing_allowance: "0".into() });
        assert_eq!(p.cap, "100");
        assert!(!p.requires_reset_first);
    }

    #[test]
    fn eth_usdt_with_nonzero_allowance_requires_reset_first() {
        let p = decide(DecideInput { chain: "ETH".into(), token: "USDT".into(), route_amount: "100".into(), existing_allowance: "50".into() });
        assert!(p.requires_reset_first);
        assert_eq!(p.cap, "100");
    }

    #[test]
    fn unlimited_approval_is_never_allowed_by_default() {
        let p = decide(DecideInput { chain: "POL".into(), token: "USDT".into(), route_amount: "100".into(), existing_allowance: "0".into() });
        assert!(p.cap != "MAX_UINT256");
    }
}
```

- [ ] **Step 2: Implement.**

```rust
pub struct DecideInput {
    pub chain: String,
    pub token: String,
    pub route_amount: String,
    pub existing_allowance: String,
}

pub struct ApprovalPlan {
    pub cap: String,
    pub requires_reset_first: bool,
    pub spender_must_match_validated_provider: bool,
}

pub fn decide(input: DecideInput) -> ApprovalPlan {
    let requires_reset_first =
        input.chain == "ETH"
        && input.token.eq_ignore_ascii_case("USDT")
        && input.existing_allowance != "0";
    ApprovalPlan {
        cap: input.route_amount,
        requires_reset_first,
        spender_must_match_validated_provider: true,
    }
}
```

- [ ] **Step 3: Run tests.**

```bash
cd sw4p/sw4p-backend
cargo test --lib approval_policy -- --nocapture
```

Expected: three PASS.

- [ ] **Step 4: Commit.**

```bash
git add sw4p/sw4p-backend/src/approval_policy.rs sw4p/sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): bounded approval policy with eth usdt reset rule"
```

---

## Task T13: Kit Chain Schema Update

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add `"tron"` to the kit `ChainSchema` and expand intent validation without breaking existing consumers.

**PRD/CRD/TRD/SOW IDs:** PRD-USDT-001, PRD-USDT-002, PRD-USDT-004; TRD section 10 (TRD-KIT-001, TRD-KIT-002); SOW WP8.4 (kit subset).

**Files:**

- Modify: `sw4p-kit/src/core/intent.ts` (line 3 ChainSchema)

- [ ] **Step 1: Write the failing test.**

Create `sw4p-kit/test/core/intent.tron.test.ts` (or add to the existing intent test file if present):

```ts
import { describe, expect, it } from "vitest";
import { parseIntent } from "../../src/core/intent";

describe("intent with tron", () => {
  it("accepts a tron USDT destination", () => {
    const parsed = parseIntent({
      from: { chain: "polygon", asset: "USDT", address: "0xowner" },
      to:   { chain: "tron", asset: "USDT", address: "TabcDEF0123456789012345678901234" },
      amount: "100",
      ttlSeconds: 300,
    });
    expect(parsed.to.chain).toBe("tron");
    expect(parsed.to.asset).toBe("USDT");
  });

  it("rejects a tron USDC route (provider does not support it)", () => {
    expect(() => parseIntent({
      from: { chain: "polygon", asset: "USDC", address: "0xowner" },
      to:   { chain: "tron", asset: "USDC", address: "Tabc" },
      amount: "1",
      ttlSeconds: 300,
    })).toThrow();
  });

  it("rejects btc as a chain", () => {
    expect(() => parseIntent({
      from: { chain: "btc", asset: "USDT", address: "x" },
      to:   { chain: "polygon", asset: "USDT", address: "0xy" },
      amount: "1",
      ttlSeconds: 300,
    })).toThrow();
  });
});
```

- [ ] **Step 2: Update the schema.**

In `sw4p-kit/src/core/intent.ts`, change the ChainSchema and add a USDT-on-Tron-only refinement:

```ts
import { z } from "zod";

export const ChainSchema = z.enum([
  "base", "arbitrum", "polygon", "avalanche", "solana", "tron",
]);

export const AssetSchema = z.enum(["USDC", "USDT"]);

export const EndpointSchema = z.object({
  chain: ChainSchema,
  asset: AssetSchema,
  address: z.string().min(1),
});

export const IntentSchema = z.object({
  from: EndpointSchema,
  to: EndpointSchema,
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  ttlSeconds: z.number().int().min(30).max(86400),
  recipientMemo: z.string().max(200).optional(),
}).refine(i => !(i.to.chain === "tron" && i.to.asset === "USDC"), {
  message: "Tron USDC is not supported by Allbridge in the 2026-05-18 provider snapshot.",
}).refine(i => !(i.from.chain === "tron" && i.from.asset === "USDC"), {
  message: "Tron USDC is not supported by Allbridge in the 2026-05-18 provider snapshot.",
});

export function parseIntent(input: unknown) {
  return IntentSchema.parse(input);
}
```

- [ ] **Step 3: Run kit tests.**

```bash
cd sw4p-kit
npx vitest run --reporter=verbose
```

Expected: existing tests still PASS plus three new PASS in `intent.tron.test.ts`.

- [ ] **Step 4: Commit.**

```bash
git add sw4p-kit/src/core/intent.ts sw4p-kit/test/core/intent.tron.test.ts
git commit -m "feat(sw4p-kit): add tron chain to intent schema with usdc guard"
```

---

## Task T14: Kit Route-State Response Type

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Create `sw4p-kit/src/core/route_state.ts` that mirrors the backend `RouteState` JSON shape for downstream MCP gateway consumption.

**PRD/CRD/TRD/SOW IDs:** PRD-USDT-009, PRD-USDT-018; CRD section 13; TRD section 10 (TRD-KIT-003, TRD-KIT-005); SOW WP8.5.

**Files:**

- Create: `sw4p-kit/src/core/route_state.ts`

- [ ] **Step 1: Write the failing test.**

```ts
import { describe, expect, it } from "vitest";
import { parseRouteState, RouteStateResponse } from "../../src/core/route_state";

describe("route_state response", () => {
  it("parses a gated provider_supported_code_incomplete row", () => {
    const j: RouteStateResponse = {
      route_id: "SOL:USDT->TRX:USDT:allbridge_core",
      primary: "provider_supported_code_incomplete",
      asset: "USDT",
      source_chain: "SOL",
      destination_chain: "TRX",
      source_token_standard: "spl",
      destination_token_standard: "trc20",
      provider: "allbridge_core",
      provider_mechanism: "pool",
      provider_support: "supported",
      quote_support: "unknown",
      code_support: "not_implemented",
      proof_state: "provider_metadata_only",
      liquidity_state: "unknown",
      provider_health: "unknown",
      policy_state: "review_required",
      runtime_exposure: "agent_visible",
      registry_snapshot_at: "2026-05-18T00:00:00Z",
      registry_expires_at: "2026-05-18T06:00:00Z",
      user_visible_reason: "Not yet implemented.",
      agent_reason_code: "SOL_TO_TRON_NOT_IMPLEMENTED",
      remediation: "Complete WS6.3.",
    };
    expect(parseRouteState(j).primary).toBe("provider_supported_code_incomplete");
  });

  it("rejects a row with an unknown primary state", () => {
    const bad = { primary: "definitely_live" };
    expect(() => parseRouteState(bad as unknown)).toThrow();
  });
});
```

- [ ] **Step 2: Implement.**

```ts
import { z } from "zod";

export const PrimaryStateSchema = z.enum([
  "live",
  "canary_authorized",
  "code_supported_proof_missing",
  "provider_supported_code_incomplete",
  "provider_unsupported",
  "suspended",
  "policy_blocked",
  "out_of_scope",
]);

const StandardSchema = z.enum(["erc20", "spl", "trc20", "other"]);

export const RouteStateResponseSchema = z.object({
  route_id: z.string(),
  primary: PrimaryStateSchema,
  asset: z.enum(["USDC", "USDT"]),
  source_chain: z.string(),
  destination_chain: z.string(),
  source_token_standard: StandardSchema,
  destination_token_standard: StandardSchema,
  provider: z.enum(["circle_cctp_v2", "allbridge_core"]),
  provider_mechanism: z.enum(["pool", "cctp", "cctp_v2", "oft", "unknown"]).nullish(),
  provider_support: z.enum(["supported", "unsupported", "unknown"]),
  quote_support: z.enum(["available", "unavailable", "unknown"]),
  code_support: z.enum(["implemented", "partial", "not_implemented"]),
  proof_state: z.enum([
    "none", "provider_metadata_only", "provider_quote_only", "raw_tx_built",
    "signed_source_tx", "source_tx_confirmed", "destination_settled", "provider_confirmed_nonprod",
  ]),
  liquidity_state: z.enum(["unknown", "available", "insufficient", "imbalanced"]),
  provider_health: z.enum(["unknown", "ok", "degraded", "paused"]),
  policy_state: z.enum(["allowed", "blocked", "review_required"]),
  runtime_exposure: z.enum(["hidden", "operator_only", "agent_visible", "user_visible"]),
  registry_snapshot_at: z.string(),
  registry_expires_at: z.string(),
  user_visible_reason: z.string(),
  agent_reason_code: z.string(),
  remediation: z.string().nullish(),
});

export type RouteStateResponse = z.infer<typeof RouteStateResponseSchema>;

export function parseRouteState(input: unknown): RouteStateResponse {
  return RouteStateResponseSchema.parse(input);
}
```

- [ ] **Step 3: Run tests.**

```bash
cd sw4p-kit
npx vitest run --reporter=verbose test/core/route_state.test.ts
```

Expected: two PASS.

- [ ] **Step 4: Commit.**

```bash
git add sw4p-kit/src/core/route_state.ts sw4p-kit/test/core/route_state.test.ts
git commit -m "feat(sw4p-kit): route state response type mirrors backend"
```

---

## Task T15: Route API Handler

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add the Axum handler `GET /v1/routes` that returns the live route-state list assembled from the latest snapshot.

**PRD/CRD/TRD/SOW IDs:** PRD G3, G5; CRD section 13; TRD section 10 (TRD-KIT-003); SOW WP1.4 exit gate, WP6.6.

**Files:**

- Create: `sw4p/sw4p-backend/src/route_api.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod route_api;`)
- Modify: `sw4p/sw4p-backend/src/main.rs` (register route on the Axum router)

- [ ] **Step 1: Write the failing handler test.**

```rust
// in sw4p-backend/tests/route_api.rs
use axum::body::Body;
use axum::http::Request;
use tower::ServiceExt;
use sw4p_backend::route_api::routes_router;

#[tokio::test]
async fn returns_route_state_list() {
    let app = routes_router(/* test pool, test config */);
    let resp = app.oneshot(
        Request::builder().uri("/v1/routes").body(Body::empty()).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);
}
```

The test must seed the test database with one provider snapshot and one derived route state. The implementer extends `test_support.rs` with a `seed_minimal_snapshot()` helper.

- [ ] **Step 2: Implement the handler.**

```rust
use axum::{routing::get, Json, Router};
use sqlx::PgPool;
use serde::Serialize;

#[derive(Serialize)]
pub struct RouteStateListResponse {
    pub snapshot_id: String,
    pub routes: Vec<crate::route_state::RouteState>,
}

pub fn routes_router(pool: PgPool) -> Router {
    Router::new().route("/v1/routes", get(list_routes)).with_state(pool)
}

async fn list_routes(
    axum::extract::State(pool): axum::extract::State<PgPool>,
) -> Result<Json<RouteStateListResponse>, axum::http::StatusCode> {
    let snap: (String,) = sqlx::query_as(
        "SELECT snapshot_id FROM provider_route_snapshots ORDER BY fetched_at DESC LIMIT 1"
    )
    .fetch_optional(&pool).await
    .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(axum::http::StatusCode::SERVICE_UNAVAILABLE)?;

    let rows: Vec<sqlx::types::Json<crate::route_state::RouteState>> = sqlx::query_scalar(
        "SELECT to_jsonb(rs.*) FROM route_states rs WHERE snapshot_id = $1"
    )
    .bind(&snap.0).fetch_all(&pool).await
    .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(RouteStateListResponse {
        snapshot_id: snap.0,
        routes: rows.into_iter().map(|j| j.0).collect(),
    }))
}
```

- [ ] **Step 3: Register the route.**

In `sw4p/sw4p-backend/src/main.rs`, find the existing `Router::new()` chain and merge the new router:

```rust
let app = Router::new()
    // existing routes
    .merge(sw4p_backend::route_api::routes_router(pool.clone()));
```

- [ ] **Step 4: Run tests.**

```bash
cd sw4p/sw4p-backend
TEST_DATABASE_URL=postgres://localhost/sw4p_test cargo test --test route_api -- --nocapture
```

Expected: one PASS.

- [ ] **Step 5: Commit.**

```bash
git add sw4p/sw4p-backend/src/route_api.rs sw4p/sw4p-backend/src/lib.rs sw4p/sw4p-backend/src/main.rs sw4p/sw4p-backend/tests/route_api.rs
git commit -m "feat(sw4p): get v1 routes handler returns route state list"
```

---

## Task T16: Pinned Acceptance Test

**Wave:** W9. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Acceptance test that, given the pinned 2026-05-18 Allbridge snapshot, the backend produces the expected set of route states and never produces a forbidden route.

**PRD/CRD/TRD/SOW IDs:** PRD G3, G4; CRD section 16 (corridor acceptance gate); TRD section 13 (TRD-KIT-006 inverse); SOW M1 exit criteria.

**Files:**

- Create: `sw4p/sw4p-backend/tests/route_state_pinned.rs`

- [ ] **Step 1: Write the test.**

```rust
use sw4p_backend::route_matrix::normalize;
use sw4p_backend::policy::{apply, SnapshotMeta};
use sw4p_backend::route_state::{Asset, PrimaryState};

const PIN: &str = include_str!("./fixtures/allbridge_token_info_2026-05-18.json");

#[test]
fn pinned_snapshot_produces_expected_route_classification() {
    let raw: serde_json::Value = serde_json::from_str(PIN).expect("fixture parses");
    let routes = normalize(&raw).expect("normalize ok");
    let states = apply(routes.as_array().unwrap().as_slice(),
                       &SnapshotMeta {
                           snapshot_id: "pinned-2026-05-18".into(),
                           fetched_at: "2026-05-18T00:00:00Z".into(),
                           expires_at: "2026-05-19T00:00:00Z".into(),
                       });

    // Polygon to Tron USDT must be present and code_supported_proof_missing or live; pin to gated for M1.
    let pol_trx_usdt = states.iter().find(|s|
        s.source_chain == "POL" && s.destination_chain == "TRX" && matches!(s.asset, Asset::Usdt)
    ).expect("POL to TRX USDT must appear");
    assert!(matches!(pol_trx_usdt.primary,
        PrimaryState::CodeSupportedProofMissing | PrimaryState::ProviderSupportedCodeIncomplete));

    // Solana to Tron USDT must be provider_supported_code_incomplete.
    let sol_trx_usdt = states.iter().find(|s|
        s.source_chain == "SOL" && s.destination_chain == "TRX" && matches!(s.asset, Asset::Usdt)
    ).expect("SOL to TRX USDT must appear");
    assert_eq!(sol_trx_usdt.primary, PrimaryState::ProviderSupportedCodeIncomplete);
    assert_eq!(sol_trx_usdt.agent_reason_code, "SOL_TO_TRON_NOT_IMPLEMENTED");

    // Base USDT source row must be absent (provider snapshot omits it).
    assert!(states.iter().all(|s|
        !(s.source_chain == "BAS" && matches!(s.asset, Asset::Usdt))
    ));

    // Tron USDC must be absent.
    assert!(states.iter().all(|s|
        !((s.source_chain == "TRX" || s.destination_chain == "TRX") && matches!(s.asset, Asset::Usdc))
    ));

    // BTC and OMNI must be absent entirely.
    assert!(states.iter().all(|s| s.source_chain != "BTC" && s.destination_chain != "BTC"));
    assert!(states.iter().all(|s| s.source_chain != "OMNI" && s.destination_chain != "OMNI"));
}
```

- [ ] **Step 2: Run.**

```bash
cd sw4p/sw4p-backend
cargo test --test route_state_pinned -- --nocapture
```

Expected: one PASS.

- [ ] **Step 3: Commit.**

```bash
git add sw4p/sw4p-backend/tests/route_state_pinned.rs
git commit -m "test(sw4p): pinned acceptance proves m1 route classification"
```

---

## Task T17: Final Branch Code Review

**Wave:** W10. **Subagent:** `code-review:code-review`, `model: opus`. **Goal:** Single full-branch review across every commit T0 to T16.

**Process:**

- [ ] **Step 1: Verify the branch builds end-to-end.**

```bash
cd sw4p/sw4p-backend && cargo build --release
cd sw4p/sw4p-backend && cargo test --all
cd sw4p-kit && npm install && npx vitest run
```

- [ ] **Step 2: Dispatch the reviewer.**

```
Agent(
  description: "Final m0 m2 branch review",
  subagent_type: "code-review:code-review",
  model: "opus",
  prompt:
    "Review every commit on the active branch from the first commit on this worktree through HEAD. "
    "The branch implements milestones M0 to M2 of the sw4p USDT/Tron parity plan at "
    "docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m0-m2.md. Report: requirement coverage "
    "(PRD/CRD/TRD/SOW ID by ID), code quality issues at high or critical confidence only, security "
    "concerns around raw transaction validation and approval policy, and any silent substitution that "
    "the regression tests missed. Output a single structured verdict: APPROVED / CHANGES_REQUIRED with "
    "an enumerated list of issues, each tied to a commit SHA and file path."
)
```

- [ ] **Step 3: Handle verdict.**

If APPROVED, the controller moves to `superpowers:finishing-a-development-branch`. If CHANGES_REQUIRED, the controller re-dispatches the original implementer task for each issue, re-runs the relevant test, and re-runs T17 until APPROVED.

---

## Self-Review Checklist

Before the controller starts executing this plan, it runs this checklist itself. The controller is the only authority that can confirm spec coverage; the implementers do not see this list.

### Spec coverage trace

| Spec ID | Task |
|---|---|
| PRD-USDT-001 | T13 |
| PRD-USDT-002 | T13, T14 |
| PRD-USDT-003 | T5 (gated default), T11 (signing gate) |
| PRD-USDT-004 | T13 (TRC20 asset surfacing), T14 (response shape) |
| PRD-USDT-005 | Out of scope for M0-M2 per SOW (deferred to M3) |
| PRD-USDT-006 | T5 (NOT_IMPLEMENTED reason), T16 (acceptance pin) |
| PRD-USDT-007 | T6 (asset-first selection), T7 (regression) |
| PRD-USDT-008 | Out of scope for M0-M2 (deferred to M3) |
| PRD-USDT-009 | T5 (reason codes), T14 (kit shape), T15 (API surface) |
| PRD-USDT-010 | T3 (excluded), T5 (excluded), T7 (regression) |
| PRD-USDT-011 | T2 (live registry), T5 (derived state) |
| PRD-USDT-012 | T1 (separate fields), T5 (populated) |
| PRD-USDT-013 | T5 (metadata never alone produces live), T16 (pinned proof) |
| PRD-USDT-014 | T3, T5, T7 |
| PRD-USDT-015 | T9 (quote fields), T10 (tx target), T11 (intent vs payload) |
| PRD-USDT-016 | Partial: T11 chain_id_match; full Tron address validation deferred to T-WS5 (M3) |
| PRD-USDT-017 | T11 |
| PRD-USDT-018 | T1 (Suspended state), T14 (response includes it). Operator suspension API deferred to M5 |
| PRD-USDT-019 | Deferred to M7 |
| PRD-USDT-020 | T15 (single backend source of truth for API) |
| CRD section 5 dimensions | T1 |
| CRD section 8 fees | T9 |
| CRD section 9 validations | T11 |
| CRD section 10 approvals | T12 |
| CRD section 11 proof | T2 (snapshot hashes), T9 (quote hash), T10 (preimage hash), T11 (validation_id) |
| CRD section 13 API | T14, T15 |
| TRD section 3 registry | T2, T4 |
| TRD section 4 selector | T6, T7 |
| TRD section 5 quote/raw tx | T9, T10 |
| TRD section 6 validator | T11 |
| TRD section 7 approval | T12 |
| TRD section 8 Tron wallet | Deferred to M3 |
| TRD section 9 lifecycle | Tables in T4 plus partial in T15; full watcher deferred to M5 |
| TRD section 10 kit | T13, T14 |
| TRD section 11 DB | T4 (subset for M1) |
| TRD section 12 observability | Not added in this plan; logged in T17 review for explicit follow-up |
| TRD section 13 testing | T1-T16 tests; pinned at T16 |
| SOW WS0 | T0 |
| SOW WS1 | T1-T5 |
| SOW WS2 | T6, T7 |
| SOW WS3 | T9, T10 |
| SOW WS4 | T8, T11, T12 |
| SOW WS5 | Deferred to M3 |
| SOW WS6 | Partial: T15 surfaces the API; Solana to Tron implementation remains gated and labeled. |
| SOW WS7-WS10 | Out of scope for M0-M2 by design. |

### Placeholder scan

No "TBD", no "fill in", no "add appropriate error handling", no "similar to Task N" reference. Every code block contains the actual code. Implementers are explicitly forbidden from skipping the failing-test step.

### Type consistency

`RouteState`, `Asset`, `PrimaryState`, `Provider`, `ProviderMechanism`, and the supporting enums are defined once in T1 and imported unchanged by T3, T5, T6, T7, T11, T15, T16. The kit mirror in T14 uses the same snake_case JSON spellings. The `Intent` struct in T11 is local to the validator. The `Quote` and `SendPayload` structs in T9 and T10 are imported by T11 without modification.

### Out-of-scope follow-ups to surface in T17

- Observability metric registration for the new modules (TRD section 12). Add in M5.
- Solana to Tron implementation (PRD-USDT-006 full closure). Add in M4 (WS6.3).
- Lifecycle watcher and proof ledger (TRD section 9). Add in M5.
- Frontend route-state UI (SOW WP8.1 through WP8.3). Defer to M6.
- MCP gateway tool surface update (TRD-KIT-005). Defer to M6 once kit response is wired through.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m0-m2.md`.

**Execution path (locked):** Subagent-Driven Development with wave-parallel dispatch. The controller follows `superpowers:subagent-driven-development` and the wave map above. Every implementer, spec reviewer, and quality reviewer dispatches with `model: opus`. Within a wave, implementers dispatch in a single Agent block. Between waves, the controller blocks on all in-wave implementer + reviewer pairs before opening the next wave.

**Pre-flight (controller must run before W0):**

- Verify `git status` is clean on the active worktree.
- Verify `cd sw4p/sw4p-backend && cargo check` returns 0.
- Verify `cd sw4p-kit && npm install` succeeds.
- Verify `TEST_DATABASE_URL` is set or the controller starts a local PostgreSQL container.
- Verify the pinned Allbridge fixture is available at `sw4p/sw4p-backend/tests/fixtures/allbridge_token_info_2026-05-18.json`. If not, the controller copies it from `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md` and notes the source in T0.
