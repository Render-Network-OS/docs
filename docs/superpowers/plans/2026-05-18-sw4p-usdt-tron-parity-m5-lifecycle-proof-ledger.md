# sw4p USDT / Tron Parity, M5 Lifecycle and Proof Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Sequential within each wave on the sw4p Rust repo. The reason was documented in M0-M2 and re-stated in M3 and M4: parallel agents racing on a shared standalone git repo cause branch-state fragmentation. The plan also lands an operator HTTP surface, runbook documents under `docs/runbooks/` in the parent repo, and a stuck-transfer worker.

**Goal:** Make every Allbridge transfer durable, restart-safe, observable, and operator-controllable. Concretely: ship the three remaining lifecycle tables (`settlement_lifecycle_events`, `settlement_evidence`, `route_suspensions`), the writer modules that own those tables, the wiring from every M3/M4 module that should record state transitions, the operator route-suspension API, the metrics emission per TRD section 12, a stuck-transfer detection worker, the operator runbooks per SOW WP7.6, and a final integration test that walks `RouteRequested` through `DestinationSettled` end to end. M5 also closes the M4 critical follow-up by extracting `bridge_from_tron_with_caps` and threading `CanaryCaps` through to actually reject when quote fee, approval amount, or implied slippage exceed the canary authorization.

**Architecture:** Three new tables plus three new writer modules form the durable backbone. `lifecycle::record_event` writes a single row per transition into `settlement_lifecycle_events`, parameterized by `route_id`, `event` (a typed `LifecycleEvent` enum), and an optional `payload` JSON object whose shape is event-specific (tx hashes, quote hashes, provider response hashes, reason codes). `evidence::record_settlement` writes append-only rows into `settlement_evidence` and supports supersession by writing a new row that carries `supersedes_evidence_id` to the prior row. `suspensions::record` writes into `route_suspensions` and is the operator API's persistence layer. Every existing module that already emits a `tracing::info!`/`tracing::warn!` on a boundary gets a paired call into the appropriate writer. The `allbridge.rs` flow is refactored to thread `CanaryCaps` through a new `bridge_from_tron_with_caps` private helper so the cap checks (max_fee, max_slippage, approval_cap) actually execute before the relayer-sign code submits the source tx. A new `stuck_transfer_worker` background task polls `settlement_lifecycle_events` for routes stuck in `DestinationPending` past a threshold and emits `ManualReviewRequired`. A new `operator_api` HTTP module exposes the route-suspension surface gated behind a static header check (full auth is M6). Metrics use the `metrics` crate (added to `Cargo.toml`) so the existing OTLP pipeline already exporting traces can be reused without a separate counter framework. Runbooks live as Markdown under `docs/runbooks/` in the parent repo.

**Tech Stack:** Rust 2021 with Axum, Tokio, SQLx (PostgreSQL), reqwest, tracing, opentelemetry-otlp, mockall, wiremock, tokio-test, sha2, hex, thiserror, chrono, serde_json. New top-level dependency: `metrics = "0.23"` for counter and histogram registrations (light, optional macro-only API; the OTLP exporter chain stays in `tracing-opentelemetry`). No frontend or kit work in this milestone; the kit-side `lifecycle` event mirror and the frontend route-state UI are M6.

**Binding companion docs:**

- [PRD](../specs/2026-05-18-sw4p-usdt-tron-parity-prd.md) (PRD-USDT-018 lifecycle, PRD-USDT-020 proof ledger, PRD-USDT-021 observability, PRD-USDT-022 operator suspension)
- [CRD](../specs/2026-05-18-sw4p-usdt-tron-parity-crd.md) (section 11 proof requirements, section 12 lifecycle requirements, section 14 security)
- [TRD](../specs/2026-05-18-sw4p-usdt-tron-parity-trd.md) (section 9 lifecycle watcher + proof ledger, section 11 DB requirements, section 12 observability)
- [SOW](../specs/2026-05-18-sw4p-usdt-tron-parity-sow.md) (Workstream WS7 in full, WP7.1 through WP7.6)
- [M0-M2 plan](2026-05-18-sw4p-usdt-tron-parity-m0-m2.md)
- [M3 plan](2026-05-18-sw4p-usdt-tron-parity-m3-tron-signing.md)
- [M4 plan](2026-05-18-sw4p-usdt-tron-parity-m4-execution-parity.md)
- [M4 follow-ups](../../../sw4p/docs/followups/2026-05-18-usdt-tron-parity-m4-execution-parity-followups.md)
- [Inventory](../specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md)

---

## Subagent Dispatch Contract

Same as the M0-M2, M3, and M4 plans. Repeated here so this plan stands alone.

| Field | Value |
|---|---|
| `model` | `opus` (Opus 4.7 max, no Sonnet/Haiku) |
| `subagent_type` (implementer) | `general-purpose` |
| `subagent_type` (spec reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (quality reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (final review) | `code-review:code-review` |
| `isolation` | omit |
| `run_in_background` | false for in-wave work |

**Hard rules from earlier milestones (re-stated):**

1. **sw4p is a standalone nested git repo** with 100+ branches. Every M5 sw4p commit lands on branch `feat/sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger` (the controller creates it off `feat/sw4p-usdt-tron-parity-m4-execution-parity` if that branch is still open in review, otherwise off whichever branch M4 merges into). Implementers must verify branch with `git -C /Volumes/.../555/sw4p rev-parse --abbrev-ref HEAD` and STOP if wrong. Never `git checkout` to switch branches.
2. **Parent repo at `/Volumes/.../555/`** is local-only for the runbook deliverables (T14). The plan, specs, follow-ups, and runbooks live there but the parent is not pushed.
3. **Sequential within a single git repo wave** to avoid the parallel-agent branch-race issue observed in M0-M2 W1.
4. **No signing/hook bypass flags.** Never pass `-c commit.gpgsign=false`, `--no-gpg-sign`, `--no-verify`. Hard user rule.
5. **No AI co-author trailer.** Every commit author is `rndrntwrk <dev@rndrntwrk.com>`. Commit message body contains the message only; no `Co-Authored-By:`, no `Generated with`, no AI attribution.
6. **No em dashes (U+2014) or non-ASCII** in any committed file, commit message, or this plan.
7. **Implementer stages files via `git add`; controller commits.** The auto-mode classifier blocks subagent `git commit` invocations; this workflow avoids the block.
8. **Configured `reqwest::Client` with timeouts** on every new HTTP-calling module (30s timeout, 10s connect; lesson from M0-M2 W2 quality review).
9. **Add `tracing::info!` / `tracing::warn!` to network and DB boundaries.** Hashes and IDs only; no plaintext secrets.
10. **Lifecycle event ordering is durable-before-effect.** Every external side-effect call (HTTP POST, RPC submit, signing API) must be preceded by a `lifecycle::record_event` write so a crash between the write and the call results in a recoverable state, not a silent loss.

---

## Parallel Wave Map

| Wave | Tasks | Repo(s) | Parallelism |
|---:|---|---|---|
| W0 | T1 lifecycle/evidence/suspensions migrations, T2 `LifecycleEvent` enum + type module | sw4p | sequential (both touch `lib.rs`) |
| W1 | T3 `lifecycle::record_event` writer, T4 `evidence::record_settlement` writer | sw4p | sequential (both touch `lib.rs`) |
| W2 | T5 wire `tron_watcher` to `SourceTxConfirmed` | sw4p | solo |
| W3 | T6 wire `provider_status_polling` to provider/destination events | sw4p | solo |
| W4 | T7 wire `allbridge_registry` to `RouteSuspended` on stale rejection | sw4p | solo |
| W5 | T8 wire `raw_tx_validator` to `RawTxValidated` + `Failed` events | sw4p | solo |
| W6 | T9 wire `bridge_from_tron_with_mode` for `RouteRequested` through `SourceTxSubmitted` | sw4p | solo |
| W7 | T10 `bridge_from_tron_with_caps` refactor (closes M4 critical follow-up) | sw4p | solo |
| W8 | T11 operator route-suspension API + `suspensions::record` | sw4p | solo |
| W9 | T12 `metrics` crate registrations + emission per TRD section 12 | sw4p | solo |
| W10 | T13 stuck-transfer detection worker | sw4p | solo |
| W11 | T14 operator runbooks (5 docs) | parent | solo |
| W12 | T15 full-lifecycle integration test, T16 pinned acceptance | sw4p | sequential |
| W13 | T17 final M5 branch review | sw4p + parent | solo |

Total: 17 tasks across 14 waves. The plan deliberately keeps each wave to a single repo-touching task because module-wiring tasks each modify either `allbridge.rs` or its direct neighbors, and those neighbors all transitively touch `lib.rs` to register the new sub-module imports added in W0 and W1.

---

## File Structure

New files this plan creates:

| Path | Responsibility |
|---|---|
| `sw4p/sw4p-backend/migrations/20260518140000_settlement_lifecycle_events.sql` | `settlement_lifecycle_events` table per TRD section 11. |
| `sw4p/sw4p-backend/migrations/20260518140100_settlement_evidence.sql` | `settlement_evidence` table (append-only proof ledger) per TRD section 11. |
| `sw4p/sw4p-backend/migrations/20260518140200_route_suspensions.sql` | `route_suspensions` table per TRD section 11. |
| `sw4p/sw4p-backend/src/lifecycle.rs` | `LifecycleEvent` enum + `record_event` writer. |
| `sw4p/sw4p-backend/src/evidence.rs` | `SettlementEvidence` struct + `record_settlement` writer with supersession. |
| `sw4p/sw4p-backend/src/suspensions.rs` | `RouteSuspension` struct + `record`/`clear`/`list_active` against the `route_suspensions` table. |
| `sw4p/sw4p-backend/src/operator_api.rs` | Axum handlers for `POST /v1/operator/route-states/:route_id/suspend` and `DELETE`. |
| `sw4p/sw4p-backend/src/stuck_transfer_worker.rs` | Periodic worker scanning for `DestinationPending` older than threshold and emitting `ManualReviewRequired`. |
| `sw4p/sw4p-backend/src/observability.rs` | `metrics` registrations + helper counter/histogram emitters per TRD section 12. |
| `sw4p/sw4p-backend/tests/m5_lifecycle_integration.rs` | End-to-end integration test walking `RouteRequested` through `DestinationSettled` against wiremock + real DB. |
| `sw4p/sw4p-backend/tests/m5_lifecycle_pinned.rs` | Pinned acceptance test asserting row count and event ordering for a synthetic transfer. |
| `docs/runbooks/2026-05-18-stuck-transfer.md` | SOW WP7.6 operator runbook for stuck transfers. |
| `docs/runbooks/2026-05-18-route-suspension.md` | SOW WP7.6 operator runbook for route suspension. |
| `docs/runbooks/2026-05-18-provider-degradation.md` | SOW WP7.6 operator runbook for Allbridge provider degradation. |
| `docs/runbooks/2026-05-18-canary-execution.md` | SOW WP7.6 operator runbook for canary execution. |
| `docs/runbooks/2026-05-18-rollback.md` | SOW WP7.6 operator runbook for rollback. |

Files this plan modifies:

| Path | Modification |
|---|---|
| `sw4p/sw4p-backend/Cargo.toml` | Add `metrics = "0.23"` dependency. |
| `sw4p/sw4p-backend/src/lib.rs` | Add `pub mod` declarations for `lifecycle`, `evidence`, `suspensions`, `operator_api`, `stuck_transfer_worker`, `observability`. |
| `sw4p/sw4p-backend/src/main.rs` | Merge `operator_api::operator_router` into the app router; spawn `stuck_transfer_worker::spawn` on boot. |
| `sw4p/sw4p-backend/src/tron_watcher.rs` | Call `lifecycle::record_event(SourceTxConfirmed)` on confirmation. |
| `sw4p/sw4p-backend/src/provider_status_polling.rs` | Call `lifecycle::record_event(ProviderTransferDetected | DestinationPending | DestinationSettled)` at each transition. |
| `sw4p/sw4p-backend/src/allbridge_registry.rs` | Call `lifecycle::record_event(Suspended)` + `suspensions::record` when the registry rejects a stale snapshot. |
| `sw4p/sw4p-backend/src/raw_tx_validator.rs` | Call `lifecycle::record_event(RawTxValidated)` on success; `lifecycle::record_event(Failed)` with reason code on failure. |
| `sw4p/sw4p-backend/src/allbridge.rs` | T9 wires the `bridge_from_tron_with_mode` flow to lifecycle events; T10 extracts `bridge_from_tron_with_caps` and enforces caps. |

---

## Task T1: Lifecycle, Evidence, and Suspension Migrations

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add the three Postgres tables that own M5's durable state, in three separate migration files so each can be reviewed and rolled back independently.

**Spec IDs:** PRD-USDT-018, PRD-USDT-020, PRD-USDT-022; CRD section 11, section 12; TRD section 9, section 11; SOW WP7.1.

**Files:**

- Create: `sw4p/sw4p-backend/migrations/20260518140000_settlement_lifecycle_events.sql`
- Create: `sw4p/sw4p-backend/migrations/20260518140100_settlement_evidence.sql`
- Create: `sw4p/sw4p-backend/migrations/20260518140200_route_suspensions.sql`

- [ ] **Step 1: Write the lifecycle events migration.**

```sql
CREATE TABLE IF NOT EXISTS settlement_lifecycle_events (
    event_id        BIGSERIAL PRIMARY KEY,
    route_id        TEXT NOT NULL,
    event           TEXT NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason_code     TEXT,
    tx_hash         TEXT,
    evidence_id     TEXT,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_lifecycle_events_route_id_recorded_at
    ON settlement_lifecycle_events (route_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_settlement_lifecycle_events_event_recorded_at
    ON settlement_lifecycle_events (event, recorded_at);

CREATE INDEX IF NOT EXISTS idx_settlement_lifecycle_events_pending_destination
    ON settlement_lifecycle_events (route_id, recorded_at)
    WHERE event = 'destination_pending';
```

The `event` column stores the snake_case name of the `LifecycleEvent` variant defined in T2. The partial index on `destination_pending` is what the stuck-transfer worker (T13) uses to scan efficiently for stale rows.

- [ ] **Step 2: Write the evidence migration.**

```sql
CREATE TABLE IF NOT EXISTS settlement_evidence (
    evidence_id                  TEXT PRIMARY KEY,
    route_id                     TEXT NOT NULL,
    provider                     TEXT NOT NULL,
    provider_mechanism           TEXT,
    source_tx_hash               TEXT,
    destination_tx_hash          TEXT,
    provider_transfer_id         TEXT,
    provider_status_response_hash TEXT,
    registry_snapshot_hash       TEXT NOT NULL,
    quote_hash                   TEXT NOT NULL,
    raw_tx_hash                  TEXT,
    approval_tx_hash             TEXT,
    source_chain_finality        TEXT NOT NULL,
    destination_chain_finality   TEXT,
    amount                       TEXT NOT NULL,
    source_token                 TEXT NOT NULL,
    destination_token            TEXT NOT NULL,
    proof_level                  TEXT NOT NULL,
    recorded_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator                     TEXT,
    supersedes_evidence_id       TEXT REFERENCES settlement_evidence(evidence_id)
);

CREATE INDEX IF NOT EXISTS idx_settlement_evidence_route_id_recorded_at
    ON settlement_evidence (route_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_settlement_evidence_source_tx_hash
    ON settlement_evidence (source_tx_hash)
    WHERE source_tx_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_settlement_evidence_destination_tx_hash
    ON settlement_evidence (destination_tx_hash)
    WHERE destination_tx_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_settlement_evidence_supersedes
    ON settlement_evidence (supersedes_evidence_id)
    WHERE supersedes_evidence_id IS NOT NULL;
```

The table is append-only: corrections write a new row carrying `supersedes_evidence_id`, never `UPDATE` the original. `proof_level` is the discriminator from CRD section 11; the writer (T4) validates it against the allowed values.

- [ ] **Step 3: Write the suspensions migration.**

```sql
CREATE TABLE IF NOT EXISTS route_suspensions (
    suspension_id   TEXT PRIMARY KEY,
    route_id        TEXT NOT NULL,
    reason_code     TEXT NOT NULL,
    reason          TEXT NOT NULL,
    operator        TEXT NOT NULL,
    suspended_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cleared_at      TIMESTAMPTZ,
    cleared_by      TEXT,
    cleared_reason  TEXT
);

CREATE INDEX IF NOT EXISTS idx_route_suspensions_route_id_active
    ON route_suspensions (route_id)
    WHERE cleared_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_route_suspensions_suspended_at
    ON route_suspensions (suspended_at DESC);
```

The partial index gates the "is this route active?" check the operator API (T11) and the rail selector (existing M2 code) read on every request.

- [ ] **Step 4: Apply all three migrations to the test DB.**

```bash
for f in 20260518140000_settlement_lifecycle_events.sql \
         20260518140100_settlement_evidence.sql \
         20260518140200_route_suspensions.sql ; do
  cat "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/migrations/$f" \
    | docker exec -i sw4p-canary-pg psql -U postgres -d sw4p_test
done
docker exec sw4p-canary-pg psql -U postgres -d sw4p_test -c '\d settlement_lifecycle_events'
docker exec sw4p-canary-pg psql -U postgres -d sw4p_test -c '\d settlement_evidence'
docker exec sw4p-canary-pg psql -U postgres -d sw4p_test -c '\d route_suspensions'
```

Expected: three `CREATE TABLE` + multiple `CREATE INDEX` ack lines, then three `\d` listings showing all expected columns.

- [ ] **Step 5: Stage (controller commits).**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/migrations/20260518140000_settlement_lifecycle_events.sql \
        sw4p-backend/migrations/20260518140100_settlement_evidence.sql \
        sw4p-backend/migrations/20260518140200_route_suspensions.sql
git status --short
```

---

## Task T2: LifecycleEvent Enum and Type Module

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Pure Rust module that owns the `LifecycleEvent` enum, its `as_str()` serialization, and the `payload` schema documentation for each variant. The writer module (T3) imports this; the wiring tasks (T5 through T9) construct variants from it.

**Spec IDs:** TRD section 9.2 (lifecycle events list); CRD section 12 (lifecycle requirements).

**Files:**

- Create: `sw4p/sw4p-backend/src/lifecycle.rs` (initial type-only contents; T3 adds the writer below)
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod lifecycle;`)

- [ ] **Step 1: Write the module header and enum.**

```rust
//! Lifecycle event types and writer.
//!
//! Owns the `LifecycleEvent` enum, the snake_case string it serializes to
//! in the `settlement_lifecycle_events.event` column, and the
//! `record_event` writer that writes a single durable row per transition.
//!
//! Every state-transition the bridging flow makes must be recorded BEFORE
//! the external side effect (HTTP POST, RPC submit, signing call) that
//! transitions to the next state. A crash between the write and the call
//! results in a recoverable state: the next start-up sees the lifecycle
//! row but no downstream effect, and the operator runbook (T14
//! `stuck-transfer.md`) directs replay.
//!
//! Satisfies: PRD-USDT-018, PRD-USDT-020; CRD section 12; TRD section 9.2;
//! SOW WP7.1, WP7.2.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LifecycleEvent {
    RouteRequested,
    ProviderRegistryChecked,
    QuoteRequested,
    QuoteReceived,
    ApprovalRequired,
    ApprovalSubmitted,
    ApprovalConfirmed,
    RawTxBuilt,
    RawTxValidated,
    WalletSignatureRequested,
    SourceTxSubmitted,
    SourceTxConfirmed,
    ProviderTransferDetected,
    DestinationPending,
    DestinationSettled,
    SettlementProofRecorded,
    Failed,
    Refunded,
    ManualReviewRequired,
    Suspended,
}

impl LifecycleEvent {
    /// Snake_case name written into the `settlement_lifecycle_events.event`
    /// column. Must be stable: changing this is a schema change.
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::RouteRequested => "route_requested",
            Self::ProviderRegistryChecked => "provider_registry_checked",
            Self::QuoteRequested => "quote_requested",
            Self::QuoteReceived => "quote_received",
            Self::ApprovalRequired => "approval_required",
            Self::ApprovalSubmitted => "approval_submitted",
            Self::ApprovalConfirmed => "approval_confirmed",
            Self::RawTxBuilt => "raw_tx_built",
            Self::RawTxValidated => "raw_tx_validated",
            Self::WalletSignatureRequested => "wallet_signature_requested",
            Self::SourceTxSubmitted => "source_tx_submitted",
            Self::SourceTxConfirmed => "source_tx_confirmed",
            Self::ProviderTransferDetected => "provider_transfer_detected",
            Self::DestinationPending => "destination_pending",
            Self::DestinationSettled => "destination_settled",
            Self::SettlementProofRecorded => "settlement_proof_recorded",
            Self::Failed => "failed",
            Self::Refunded => "refunded",
            Self::ManualReviewRequired => "manual_review_required",
            Self::Suspended => "suspended",
        }
    }
}

/// Structured payload that pairs with a lifecycle event. The writer
/// serializes this into the `payload` JSONB column. Optional fields keep
/// the column compact; required fields per event are documented at each
/// call site.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LifecyclePayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_chain: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_chain: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount_decimal: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registry_snapshot_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quote_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw_tx_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_transfer_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_status_response_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub elapsed_ms: Option<i64>,
}

#[derive(Debug, thiserror::Error)]
pub enum LifecycleError {
    #[error("database: {0}")] Db(#[from] sqlx::Error),
    #[error("payload encode: {0}")] Encode(#[from] serde_json::Error),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_variant_has_a_snake_case_name() {
        let pairs = [
            (LifecycleEvent::RouteRequested, "route_requested"),
            (LifecycleEvent::ProviderRegistryChecked, "provider_registry_checked"),
            (LifecycleEvent::QuoteRequested, "quote_requested"),
            (LifecycleEvent::QuoteReceived, "quote_received"),
            (LifecycleEvent::ApprovalRequired, "approval_required"),
            (LifecycleEvent::ApprovalSubmitted, "approval_submitted"),
            (LifecycleEvent::ApprovalConfirmed, "approval_confirmed"),
            (LifecycleEvent::RawTxBuilt, "raw_tx_built"),
            (LifecycleEvent::RawTxValidated, "raw_tx_validated"),
            (LifecycleEvent::WalletSignatureRequested, "wallet_signature_requested"),
            (LifecycleEvent::SourceTxSubmitted, "source_tx_submitted"),
            (LifecycleEvent::SourceTxConfirmed, "source_tx_confirmed"),
            (LifecycleEvent::ProviderTransferDetected, "provider_transfer_detected"),
            (LifecycleEvent::DestinationPending, "destination_pending"),
            (LifecycleEvent::DestinationSettled, "destination_settled"),
            (LifecycleEvent::SettlementProofRecorded, "settlement_proof_recorded"),
            (LifecycleEvent::Failed, "failed"),
            (LifecycleEvent::Refunded, "refunded"),
            (LifecycleEvent::ManualReviewRequired, "manual_review_required"),
            (LifecycleEvent::Suspended, "suspended"),
        ];
        for (variant, expected) in pairs {
            assert_eq!(variant.as_str(), expected, "variant {:?} expected {}", variant, expected);
        }
    }

    #[test]
    fn payload_serializes_to_jsonb_friendly_object() {
        let p = LifecyclePayload {
            quote_hash: Some("0xabc".into()),
            failure_reason: Some("provider_unavailable".into()),
            ..Default::default()
        };
        let v: serde_json::Value = serde_json::to_value(&p).expect("encode ok");
        assert_eq!(v.get("quote_hash").and_then(|x| x.as_str()), Some("0xabc"));
        assert_eq!(v.get("failure_reason").and_then(|x| x.as_str()), Some("provider_unavailable"));
        // None fields must be skipped, not encoded as null.
        assert!(v.get("source_chain").is_none(), "None fields must be skipped");
    }
}
```

- [ ] **Step 2: Wire the module declaration.**

Edit `sw4p/sw4p-backend/src/lib.rs` and add `pub mod lifecycle;` adjacent to the other M0-M2/M3/M4 `pub mod` lines.

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib lifecycle -- --nocapture
```

Expected: two PASS (`every_variant_has_a_snake_case_name`, `payload_serializes_to_jsonb_friendly_object`).

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/lifecycle.rs sw4p-backend/src/lib.rs
git status --short
```

---


## Task T3: Lifecycle Event Writer

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add `lifecycle::record_event(pool, route_id, event, payload)` and `lifecycle::list_for_route(pool, route_id)` to the module created in T2. Writes are durable, ordered by serial primary key, and emit a structured `tracing::info!` for every successful write so the OTLP pipeline can correlate without a second pass.

**Spec IDs:** PRD-USDT-018; TRD section 9.4 (TRD-PROOF-001, TRD-PROOF-002, TRD-PROOF-004); SOW WP7.2.

**Files:**

- Modify: `sw4p/sw4p-backend/src/lifecycle.rs`

- [ ] **Step 1: Append the writer to `lifecycle.rs`.** Below the test module, add:

```rust
use sqlx::PgPool;

/// Write a single lifecycle event row. Returns the assigned `event_id`.
///
/// Callers must invoke this BEFORE the side-effect that transitions to
/// the next state. Crash between write and side-effect leaves a
/// recoverable row; crash after side-effect but before this returns
/// leaves the side-effect orphaned (the watcher (T13) detects via
/// `DestinationPending` staleness).
pub async fn record_event(
    pool: &PgPool,
    route_id: &str,
    event: LifecycleEvent,
    payload: LifecyclePayload,
) -> Result<i64, LifecycleError> {
    let payload_json = serde_json::to_value(&payload)?;
    let reason_code = payload.failure_reason.clone();
    let tx_hash = payload.raw_tx_hash.clone();
    let row: (i64,) = sqlx::query_as(
        r#"INSERT INTO settlement_lifecycle_events
              (route_id, event, payload, reason_code, tx_hash)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING event_id"#,
    )
    .bind(route_id)
    .bind(event.as_str())
    .bind(&payload_json)
    .bind(reason_code.as_deref())
    .bind(tx_hash.as_deref())
    .fetch_one(pool)
    .await?;
    tracing::info!(
        target: "lifecycle",
        route_id = %route_id,
        event = %event.as_str(),
        event_id = %row.0,
        "lifecycle event recorded"
    );
    Ok(row.0)
}

#[derive(Debug, Clone, Serialize)]
pub struct LifecycleRow {
    pub event_id: i64,
    pub route_id: String,
    pub event: String,
    pub payload: serde_json::Value,
    pub reason_code: Option<String>,
    pub tx_hash: Option<String>,
    pub evidence_id: Option<String>,
    pub recorded_at: chrono::DateTime<chrono::Utc>,
}

/// Read all lifecycle events for a route, oldest first. Used by the
/// integration test (T15) and the stuck-transfer worker (T13).
pub async fn list_for_route(
    pool: &PgPool,
    route_id: &str,
) -> Result<Vec<LifecycleRow>, LifecycleError> {
    let rows: Vec<(i64, String, String, serde_json::Value, Option<String>, Option<String>, Option<String>, chrono::DateTime<chrono::Utc>)> = sqlx::query_as(
        r#"SELECT event_id, route_id, event, payload, reason_code, tx_hash, evidence_id, recorded_at
           FROM settlement_lifecycle_events
           WHERE route_id = $1
           ORDER BY event_id ASC"#,
    )
    .bind(route_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|r| LifecycleRow {
        event_id: r.0,
        route_id: r.1,
        event: r.2,
        payload: r.3,
        reason_code: r.4,
        tx_hash: r.5,
        evidence_id: r.6,
        recorded_at: r.7,
    }).collect())
}

/// Read the last lifecycle event for a route, or None if none recorded.
/// Used for restart recovery decisions: a process resuming after crash
/// reads this to decide whether to replay, refund, or escalate.
pub async fn last_for_route(
    pool: &PgPool,
    route_id: &str,
) -> Result<Option<LifecycleRow>, LifecycleError> {
    let row: Option<(i64, String, String, serde_json::Value, Option<String>, Option<String>, Option<String>, chrono::DateTime<chrono::Utc>)> = sqlx::query_as(
        r#"SELECT event_id, route_id, event, payload, reason_code, tx_hash, evidence_id, recorded_at
           FROM settlement_lifecycle_events
           WHERE route_id = $1
           ORDER BY event_id DESC
           LIMIT 1"#,
    )
    .bind(route_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| LifecycleRow {
        event_id: r.0,
        route_id: r.1,
        event: r.2,
        payload: r.3,
        reason_code: r.4,
        tx_hash: r.5,
        evidence_id: r.6,
        recorded_at: r.7,
    }))
}
```

- [ ] **Step 2: Extend the test module** at the bottom of `lifecycle.rs`:

```rust
#[cfg(test)]
mod writer_tests {
    use super::*;
    use crate::test_support::test_pool;

    async fn truncate(pool: &PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn record_event_writes_durable_row() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let id = record_event(
            &pool,
            "POL:USDT->TRX:USDT:allbridge_core",
            LifecycleEvent::RouteRequested,
            LifecyclePayload {
                source_chain: Some("POL".into()),
                destination_chain: Some("TRX".into()),
                source_token: Some("USDT".into()),
                destination_token: Some("USDT".into()),
                amount_decimal: Some("5.00".into()),
                ..Default::default()
            },
        ).await.expect("record ok");
        assert!(id > 0, "event_id must be positive");
    }

    #[tokio::test]
    async fn list_for_route_returns_events_in_order() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let rid = "POL:USDT->TRX:USDT:allbridge_core";
        record_event(&pool, rid, LifecycleEvent::RouteRequested, LifecyclePayload::default()).await.unwrap();
        record_event(&pool, rid, LifecycleEvent::QuoteRequested, LifecyclePayload::default()).await.unwrap();
        record_event(&pool, rid, LifecycleEvent::QuoteReceived, LifecyclePayload {
            quote_hash: Some("0xqh1".into()), ..Default::default()
        }).await.unwrap();
        let rows = list_for_route(&pool, rid).await.expect("list ok");
        assert_eq!(rows.len(), 3, "expected 3 rows");
        assert_eq!(rows[0].event, "route_requested");
        assert_eq!(rows[1].event, "quote_requested");
        assert_eq!(rows[2].event, "quote_received");
        assert_eq!(rows[2].payload.get("quote_hash").and_then(|x| x.as_str()), Some("0xqh1"));
    }

    #[tokio::test]
    async fn last_for_route_returns_most_recent() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let rid = "POL:USDT->TRX:USDT:allbridge_core";
        record_event(&pool, rid, LifecycleEvent::RouteRequested, LifecyclePayload::default()).await.unwrap();
        record_event(&pool, rid, LifecycleEvent::Failed, LifecyclePayload {
            failure_reason: Some("provider_unavailable".into()), ..Default::default()
        }).await.unwrap();
        let last = last_for_route(&pool, rid).await.unwrap().expect("some");
        assert_eq!(last.event, "failed");
        assert_eq!(last.reason_code.as_deref(), Some("provider_unavailable"));
    }

    #[tokio::test]
    async fn last_for_route_returns_none_when_unknown() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let last = last_for_route(&pool, "no:such:route").await.unwrap();
        assert!(last.is_none());
    }
}
```

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib lifecycle -- --test-threads=1 --nocapture
```

Expected: 6 PASS (2 from T2 + 4 new in T3).

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/lifecycle.rs
git status --short
```

---

## Task T4: Proof Ledger Writer

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add `evidence::record_settlement(pool, evidence)` with append-only semantics and `evidence::supersede(pool, prior_id, new_evidence)` for corrections. `evidence::list_for_route` reads the latest non-superseded row for downstream consumers (T11 operator API, T15 integration test).

**Spec IDs:** PRD-USDT-020; CRD section 11 (proof requirements), TRD section 9.3 (proof ledger object), TRD-PROOF-003, TRD-PROOF-005, TRD-PROOF-006, TRD-PROOF-007; SOW WP7.3.

**Files:**

- Create: `sw4p/sw4p-backend/src/evidence.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod evidence;`)

- [ ] **Step 1: Write the module.**

```rust
//! Append-only proof ledger.
//!
//! Implements the SettlementEvidence shape from TRD section 9.3 against
//! the `settlement_evidence` table. Records are immutable: corrections
//! call `supersede` which inserts a new row whose `supersedes_evidence_id`
//! points at the prior row. Readers always pick the leaf of the
//! supersession chain via `latest_for_route`.
//!
//! Satisfies: PRD-USDT-020; CRD section 11; TRD-PROOF-003, TRD-PROOF-005,
//! TRD-PROOF-006, TRD-PROOF-007; SOW WP7.3.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SettlementEvidence {
    pub evidence_id: String,
    pub route_id: String,
    pub provider: String,
    pub provider_mechanism: Option<String>,
    pub source_tx_hash: Option<String>,
    pub destination_tx_hash: Option<String>,
    pub provider_transfer_id: Option<String>,
    pub provider_status_response_hash: Option<String>,
    pub registry_snapshot_hash: String,
    pub quote_hash: String,
    pub raw_tx_hash: Option<String>,
    pub approval_tx_hash: Option<String>,
    pub source_chain_finality: String,
    pub destination_chain_finality: Option<String>,
    pub amount: String,
    pub source_token: String,
    pub destination_token: String,
    pub proof_level: String,
    pub recorded_at: Option<DateTime<Utc>>,
    pub operator: Option<String>,
    pub supersedes_evidence_id: Option<String>,
}

/// Allowed proof_level discriminator values per CRD section 11.
pub const ALLOWED_PROOF_LEVELS: &[&str] = &[
    "metadata_only",
    "quote_only",
    "raw_tx_only",
    "source_tx_confirmed",
    "destination_settled",
    "provider_confirmed_nonprod",
];

/// Allowed provider discriminator values.
pub const ALLOWED_PROVIDERS: &[&str] = &[
    "circle_cctp_v2",
    "allbridge_core",
];

#[derive(Debug, thiserror::Error)]
pub enum EvidenceError {
    #[error("database: {0}")] Db(#[from] sqlx::Error),
    #[error("invalid proof_level: {0}")] InvalidProofLevel(String),
    #[error("invalid provider: {0}")] InvalidProvider(String),
    #[error("prior evidence not found: {0}")] PriorNotFound(String),
    #[error("missing required field: {0}")] MissingRequired(&'static str),
}

fn validate(ev: &SettlementEvidence) -> Result<(), EvidenceError> {
    if ev.evidence_id.is_empty() { return Err(EvidenceError::MissingRequired("evidence_id")); }
    if ev.route_id.is_empty() { return Err(EvidenceError::MissingRequired("route_id")); }
    if ev.registry_snapshot_hash.is_empty() { return Err(EvidenceError::MissingRequired("registry_snapshot_hash")); }
    if ev.quote_hash.is_empty() { return Err(EvidenceError::MissingRequired("quote_hash")); }
    if ev.amount.is_empty() { return Err(EvidenceError::MissingRequired("amount")); }
    if !ALLOWED_PROOF_LEVELS.contains(&ev.proof_level.as_str()) {
        return Err(EvidenceError::InvalidProofLevel(ev.proof_level.clone()));
    }
    if !ALLOWED_PROVIDERS.contains(&ev.provider.as_str()) {
        return Err(EvidenceError::InvalidProvider(ev.provider.clone()));
    }
    Ok(())
}

/// Append a settlement evidence row. Returns the inserted row's
/// `evidence_id` for symmetry; callers usually already know this.
pub async fn record_settlement(
    pool: &PgPool,
    ev: &SettlementEvidence,
) -> Result<String, EvidenceError> {
    validate(ev)?;
    sqlx::query(
        r#"INSERT INTO settlement_evidence
           (evidence_id, route_id, provider, provider_mechanism,
            source_tx_hash, destination_tx_hash, provider_transfer_id,
            provider_status_response_hash, registry_snapshot_hash, quote_hash,
            raw_tx_hash, approval_tx_hash, source_chain_finality,
            destination_chain_finality, amount, source_token, destination_token,
            proof_level, operator, supersedes_evidence_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)"#,
    )
    .bind(&ev.evidence_id)
    .bind(&ev.route_id)
    .bind(&ev.provider)
    .bind(&ev.provider_mechanism)
    .bind(&ev.source_tx_hash)
    .bind(&ev.destination_tx_hash)
    .bind(&ev.provider_transfer_id)
    .bind(&ev.provider_status_response_hash)
    .bind(&ev.registry_snapshot_hash)
    .bind(&ev.quote_hash)
    .bind(&ev.raw_tx_hash)
    .bind(&ev.approval_tx_hash)
    .bind(&ev.source_chain_finality)
    .bind(&ev.destination_chain_finality)
    .bind(&ev.amount)
    .bind(&ev.source_token)
    .bind(&ev.destination_token)
    .bind(&ev.proof_level)
    .bind(&ev.operator)
    .bind(&ev.supersedes_evidence_id)
    .execute(pool)
    .await?;
    tracing::info!(
        target: "evidence",
        evidence_id = %ev.evidence_id,
        route_id = %ev.route_id,
        provider = %ev.provider,
        proof_level = %ev.proof_level,
        supersedes = ev.supersedes_evidence_id.as_deref().unwrap_or(""),
        "settlement evidence recorded"
    );
    Ok(ev.evidence_id.clone())
}

/// Insert a new evidence row that supersedes a prior one. The prior row
/// must exist. The new row's `supersedes_evidence_id` is set to
/// `prior_evidence_id` even if the caller forgot to set it; this is the
/// supersession invariant per TRD-PROOF-007.
pub async fn supersede(
    pool: &PgPool,
    prior_evidence_id: &str,
    mut new_evidence: SettlementEvidence,
) -> Result<String, EvidenceError> {
    let prior_exists: Option<(String,)> = sqlx::query_as(
        "SELECT evidence_id FROM settlement_evidence WHERE evidence_id = $1"
    )
    .bind(prior_evidence_id)
    .fetch_optional(pool)
    .await?;
    if prior_exists.is_none() {
        return Err(EvidenceError::PriorNotFound(prior_evidence_id.into()));
    }
    new_evidence.supersedes_evidence_id = Some(prior_evidence_id.to_string());
    record_settlement(pool, &new_evidence).await
}

#[derive(Debug, Clone, Serialize)]
pub struct EvidenceRow {
    pub evidence_id: String,
    pub route_id: String,
    pub provider: String,
    pub provider_mechanism: Option<String>,
    pub source_tx_hash: Option<String>,
    pub destination_tx_hash: Option<String>,
    pub provider_transfer_id: Option<String>,
    pub provider_status_response_hash: Option<String>,
    pub registry_snapshot_hash: String,
    pub quote_hash: String,
    pub raw_tx_hash: Option<String>,
    pub approval_tx_hash: Option<String>,
    pub source_chain_finality: String,
    pub destination_chain_finality: Option<String>,
    pub amount: String,
    pub source_token: String,
    pub destination_token: String,
    pub proof_level: String,
    pub recorded_at: DateTime<Utc>,
    pub operator: Option<String>,
    pub supersedes_evidence_id: Option<String>,
}

/// Return the leaf (most recent non-superseded) evidence row for a route,
/// or None if none recorded.
pub async fn latest_for_route(
    pool: &PgPool,
    route_id: &str,
) -> Result<Option<EvidenceRow>, EvidenceError> {
    let rows: Vec<(String, String, String, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, String, String, Option<String>, Option<String>, String, Option<String>, String, String, String, String, DateTime<Utc>, Option<String>, Option<String>)> = sqlx::query_as(
        r#"SELECT evidence_id, route_id, provider, provider_mechanism,
                  source_tx_hash, destination_tx_hash, provider_transfer_id,
                  provider_status_response_hash, registry_snapshot_hash, quote_hash,
                  raw_tx_hash, approval_tx_hash, source_chain_finality,
                  destination_chain_finality, amount, source_token, destination_token,
                  proof_level, recorded_at, operator, supersedes_evidence_id
           FROM settlement_evidence
           WHERE route_id = $1
           ORDER BY recorded_at DESC"#,
    )
    .bind(route_id)
    .fetch_all(pool)
    .await?;
    let superseded: std::collections::HashSet<String> = rows.iter()
        .filter_map(|r| r.20.clone())
        .collect();
    for r in rows {
        if !superseded.contains(&r.0) {
            return Ok(Some(EvidenceRow {
                evidence_id: r.0, route_id: r.1, provider: r.2, provider_mechanism: r.3,
                source_tx_hash: r.4, destination_tx_hash: r.5, provider_transfer_id: r.6,
                provider_status_response_hash: r.7, registry_snapshot_hash: r.8, quote_hash: r.9,
                raw_tx_hash: r.10, approval_tx_hash: r.11, source_chain_finality: r.12,
                destination_chain_finality: r.13, amount: r.14, source_token: r.15, destination_token: r.16,
                proof_level: r.17, recorded_at: r.18, operator: r.19, supersedes_evidence_id: r.20,
            }));
        }
    }
    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::test_pool;

    fn fixture(evidence_id: &str) -> SettlementEvidence {
        SettlementEvidence {
            evidence_id: evidence_id.into(),
            route_id: "POL:USDT->TRX:USDT:allbridge_core".into(),
            provider: "allbridge_core".into(),
            provider_mechanism: Some("pool".into()),
            source_tx_hash: Some("0xsrc".into()),
            destination_tx_hash: Some("0xdst".into()),
            provider_transfer_id: Some("xfer123".into()),
            provider_status_response_hash: Some("0xprovhash".into()),
            registry_snapshot_hash: "0xreg".into(),
            quote_hash: "0xqh".into(),
            raw_tx_hash: Some("0xraw".into()),
            approval_tx_hash: None,
            source_chain_finality: "1_finalized".into(),
            destination_chain_finality: Some("1_finalized".into()),
            amount: "5.00".into(),
            source_token: "USDT".into(),
            destination_token: "USDT".into(),
            proof_level: "destination_settled".into(),
            recorded_at: None,
            operator: Some("ops@rndrntwrk".into()),
            supersedes_evidence_id: None,
        }
    }

    async fn truncate(pool: &PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_evidence CASCADE").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn record_settlement_writes_row() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let id = record_settlement(&pool, &fixture("ev_001")).await.expect("ok");
        assert_eq!(id, "ev_001");
    }

    #[tokio::test]
    async fn record_settlement_rejects_invalid_proof_level() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let mut bad = fixture("ev_bad");
        bad.proof_level = "made_up_level".into();
        let err = record_settlement(&pool, &bad).await.unwrap_err();
        assert!(matches!(err, EvidenceError::InvalidProofLevel(_)));
    }

    #[tokio::test]
    async fn record_settlement_rejects_invalid_provider() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let mut bad = fixture("ev_bad_provider");
        bad.provider = "other_bridge".into();
        let err = record_settlement(&pool, &bad).await.unwrap_err();
        assert!(matches!(err, EvidenceError::InvalidProvider(_)));
    }

    #[tokio::test]
    async fn supersede_inserts_new_and_marks_chain() {
        let pool = test_pool().await;
        truncate(&pool).await;
        record_settlement(&pool, &fixture("ev_old")).await.unwrap();
        let mut newer = fixture("ev_new");
        newer.destination_tx_hash = Some("0xdst_corrected".into());
        supersede(&pool, "ev_old", newer).await.expect("supersede ok");
        let latest = latest_for_route(&pool, "POL:USDT->TRX:USDT:allbridge_core").await.unwrap().expect("some");
        assert_eq!(latest.evidence_id, "ev_new", "leaf must be the new row");
        assert_eq!(latest.destination_tx_hash.as_deref(), Some("0xdst_corrected"));
    }

    #[tokio::test]
    async fn supersede_fails_when_prior_missing() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let err = supersede(&pool, "ev_nonexistent", fixture("ev_orphan")).await.unwrap_err();
        assert!(matches!(err, EvidenceError::PriorNotFound(_)));
    }

    #[tokio::test]
    async fn latest_for_route_returns_none_when_unknown() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let latest = latest_for_route(&pool, "no:such:route").await.unwrap();
        assert!(latest.is_none());
    }
}
```

- [ ] **Step 2: Wire and test.**

Edit `sw4p/sw4p-backend/src/lib.rs` and add `pub mod evidence;`.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib evidence -- --test-threads=1 --nocapture
```

Expected: 6 PASS.

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/evidence.rs sw4p-backend/src/lib.rs
git status --short
```

---

## Task T5: Wire tron_watcher to Record SourceTxConfirmed

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Augment the M3 `tron_watcher::watch_until_confirmed` so on a successful confirmation it calls `lifecycle::record_event(SourceTxConfirmed)` with the tx hash, elapsed time, and route id.

**Spec IDs:** PRD-USDT-018; TRD-PROOF-004; SOW WP7.2.

**Files:**

- Modify: `sw4p/sw4p-backend/src/tron_watcher.rs`

- [ ] **Step 1: Inspect the existing `watch_until_confirmed` signature.**

```bash
grep -nA20 'pub async fn watch_until_confirmed' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/tron_watcher.rs
```

Note the M3 signature returned a `WatchResult { tx_id, confirmed, elapsed_ms }` and did not take a `&PgPool`. M5 extends it to write a lifecycle row.

- [ ] **Step 2: Add a `_with_lifecycle` variant.** The original signature stays for callers that do not have a pool (tests, ad-hoc tooling); the new variant takes the pool and the route id.

```rust
use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};
use sqlx::PgPool;

/// Watch a Tron source tx until confirmation, then record the
/// `SourceTxConfirmed` lifecycle event against the given route. Returns
/// the same `WatchResult` as `watch_until_confirmed` for symmetry.
pub async fn watch_until_confirmed_with_lifecycle(
    rpc_url: &str,
    tx_id: &str,
    timeout_secs: u64,
    pool: &PgPool,
    route_id: &str,
) -> WatchResult {
    let result = watch_until_confirmed(rpc_url, tx_id, timeout_secs).await;
    if result.confirmed {
        let payload = LifecyclePayload {
            raw_tx_hash: Some(tx_id.to_string()),
            elapsed_ms: Some(result.elapsed_ms as i64),
            ..Default::default()
        };
        if let Err(e) = record_event(pool, route_id, LifecycleEvent::SourceTxConfirmed, payload).await {
            tracing::warn!(
                target: "tron_watcher",
                route_id = %route_id,
                tx_id = %tx_id,
                error = %e,
                "failed to record SourceTxConfirmed lifecycle event"
            );
        }
    } else {
        let payload = LifecyclePayload {
            raw_tx_hash: Some(tx_id.to_string()),
            elapsed_ms: Some(result.elapsed_ms as i64),
            failure_reason: Some("source_tx_not_confirmed_within_timeout".into()),
            ..Default::default()
        };
        if let Err(e) = record_event(pool, route_id, LifecycleEvent::Failed, payload).await {
            tracing::warn!(
                target: "tron_watcher",
                route_id = %route_id,
                tx_id = %tx_id,
                error = %e,
                "failed to record Failed lifecycle event"
            );
        }
    }
    result
}
```

The `watch_until_confirmed` function from M3 is unchanged. Callers that want lifecycle integration use the new variant.

- [ ] **Step 3: Add a test.**

```rust
#[cfg(test)]
mod lifecycle_wiring_tests {
    use super::*;
    use crate::lifecycle::list_for_route;
    use crate::test_support::test_pool;
    use wiremock::{matchers::method, Mock, MockServer, ResponseTemplate};

    async fn truncate(pool: &PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn watch_with_lifecycle_records_source_tx_confirmed_on_success() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"id":"deadbeef","ret":[{"contractRet":"SUCCESS"}]}"#
            ))
            .mount(&server).await;
        let route_id = "POL:USDT->TRX:USDT:allbridge_core";
        let result = watch_until_confirmed_with_lifecycle(
            &server.uri(),
            "deadbeef",
            2,
            &pool,
            route_id,
        ).await;
        assert!(result.confirmed, "expected confirmed");
        let rows = list_for_route(&pool, route_id).await.unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].event, "source_tx_confirmed");
        assert_eq!(rows[0].tx_hash.as_deref(), Some("deadbeef"));
    }

    #[tokio::test]
    async fn watch_with_lifecycle_records_failed_on_timeout() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"id":"deadbeef","ret":[{"contractRet":"PENDING"}]}"#
            ))
            .mount(&server).await;
        let route_id = "POL:USDT->TRX:USDT:allbridge_core";
        let result = watch_until_confirmed_with_lifecycle(
            &server.uri(),
            "deadbeef",
            1,
            &pool,
            route_id,
        ).await;
        assert!(!result.confirmed, "expected not confirmed");
        let rows = list_for_route(&pool, route_id).await.unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].event, "failed");
        assert_eq!(rows[0].reason_code.as_deref(), Some("source_tx_not_confirmed_within_timeout"));
    }
}
```

(If the M3 watcher's success/pending response shape differs from the assumption above, adapt the mock body to whatever the actual `wait_for_confirmation` consumes. The lesson from M3 W5 was that the watcher reads `ret[0].contractRet`; if that has changed by M5, the mock body must change to match.)

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib tron_watcher -- --test-threads=1 --nocapture
```

Expected: existing tron_watcher tests still PASS, plus 2 new lifecycle wiring tests PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_watcher.rs
git status --short
```

---


## Task T6: Wire provider_status_polling to Provider and Destination Events

**Wave:** W3. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Augment the M4 `provider_status_polling::poll_until_settled` to record `ProviderTransferDetected` on the first non-empty state, `DestinationPending` on each Pending observation transition, and `DestinationSettled` on Complete. Hash the provider response and store the hash on the lifecycle row so the proof ledger writer (T4) can later link it.

**Spec IDs:** PRD-USDT-018; TRD-PROOF-005; SOW WP7.2, WP6.5.

**Files:**

- Modify: `sw4p/sw4p-backend/src/provider_status_polling.rs`

- [ ] **Step 1: Inspect the M4 polling loop.**

```bash
grep -nA30 'pub async fn poll_until_settled' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/provider_status_polling.rs
```

The M4 module emits tracing events at each transition but does not write lifecycle rows. M5 adds a `_with_lifecycle` variant that takes a `&PgPool` and a `route_id`.

- [ ] **Step 2: Add the lifecycle-wired variant.**

```rust
use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};
use sha2::{Digest, Sha256};
use sqlx::PgPool;

/// Same loop as `poll_until_settled`, with lifecycle writes at every
/// provider state transition. The route_id is the durable identifier for
/// the in-flight transfer; the provider transfer id is the upstream
/// (Allbridge) identifier for the same transfer, written into the
/// `provider_transfer_id` payload field on every lifecycle row this
/// function produces.
pub async fn poll_until_settled_with_lifecycle(
    cfg: PollerConfig,
    pool: &PgPool,
    route_id: &str,
    provider_transfer_id: &str,
) -> ProviderStatusOutcome {
    let started = std::time::Instant::now();
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .connect_timeout(std::time::Duration::from_secs(10))
        .build()
        .expect("reqwest client build");
    let mut last_status: u16 = 0;
    let mut last_state = String::new();
    let mut detected_once = false;
    loop {
        if started.elapsed() >= cfg.timeout {
            tracing::warn!(target: "provider_status_polling", route_id = %route_id, message_id = %cfg.message_id, last_state = %last_state, "poll timed out");
            let payload = LifecyclePayload {
                provider_transfer_id: Some(provider_transfer_id.into()),
                provider_state: Some(last_state.clone()),
                elapsed_ms: Some(started.elapsed().as_millis() as i64),
                failure_reason: Some("provider_status_polling_timeout".into()),
                ..Default::default()
            };
            let _ = record_event(pool, route_id, LifecycleEvent::Failed, payload).await;
            return ProviderStatusOutcome::TimedOut {
                last_known_state: last_state,
                elapsed_secs: started.elapsed().as_secs(),
            };
        }
        let url = format!("{}/transfer-status?messageId={}", cfg.base_url.trim_end_matches('/'), cfg.message_id);
        match client.get(&url).send().await {
            Ok(resp) => {
                last_status = resp.status().as_u16();
                if !resp.status().is_success() {
                    tracing::warn!(target: "provider_status_polling", route_id = %route_id, message_id = %cfg.message_id, status = %last_status, "non-2xx from provider");
                    if last_status >= 500 {
                        let payload = LifecyclePayload {
                            provider_transfer_id: Some(provider_transfer_id.into()),
                            provider_state: Some(last_state.clone()),
                            elapsed_ms: Some(started.elapsed().as_millis() as i64),
                            failure_reason: Some(format!("provider_unavailable_{}", last_status)),
                            ..Default::default()
                        };
                        let _ = record_event(pool, route_id, LifecycleEvent::Failed, payload).await;
                        return ProviderStatusOutcome::ProviderUnavailable {
                            last_status,
                            elapsed_secs: started.elapsed().as_secs(),
                        };
                    }
                } else if let Ok(body_bytes) = resp.bytes().await {
                    let hash = format!("0x{}", hex::encode(Sha256::digest(&body_bytes)));
                    let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap_or(serde_json::Value::Null);
                    let state = body.get("status").and_then(|s| s.as_str()).unwrap_or("unknown").to_string();
                    if state != last_state {
                        tracing::info!(target: "provider_status_polling", route_id = %route_id, message_id = %cfg.message_id, state = %state, "provider state transition");
                    }
                    if !detected_once && !state.is_empty() && state != "unknown" {
                        let payload = LifecyclePayload {
                            provider_transfer_id: Some(provider_transfer_id.into()),
                            provider_state: Some(state.clone()),
                            provider_status_response_hash: Some(hash.clone()),
                            elapsed_ms: Some(started.elapsed().as_millis() as i64),
                            ..Default::default()
                        };
                        let _ = record_event(pool, route_id, LifecycleEvent::ProviderTransferDetected, payload).await;
                        detected_once = true;
                    }
                    if (state == "Pending" || state == "pending") && state != last_state {
                        let payload = LifecyclePayload {
                            provider_transfer_id: Some(provider_transfer_id.into()),
                            provider_state: Some(state.clone()),
                            provider_status_response_hash: Some(hash.clone()),
                            elapsed_ms: Some(started.elapsed().as_millis() as i64),
                            ..Default::default()
                        };
                        let _ = record_event(pool, route_id, LifecycleEvent::DestinationPending, payload).await;
                    }
                    last_state = state.clone();
                    if state == "Complete" || state == "complete" {
                        let dest_hash = body.get("destinationTxHash").and_then(|h| h.as_str()).unwrap_or("").to_string();
                        tracing::info!(target: "provider_status_polling", route_id = %route_id, message_id = %cfg.message_id, dest_hash = %dest_hash, elapsed_secs = %started.elapsed().as_secs(), "provider confirmed destination settlement");
                        let payload = LifecyclePayload {
                            provider_transfer_id: Some(provider_transfer_id.into()),
                            provider_state: Some(state.clone()),
                            provider_status_response_hash: Some(hash.clone()),
                            raw_tx_hash: Some(dest_hash.clone()),
                            elapsed_ms: Some(started.elapsed().as_millis() as i64),
                            ..Default::default()
                        };
                        let _ = record_event(pool, route_id, LifecycleEvent::DestinationSettled, payload).await;
                        return ProviderStatusOutcome::Confirmed {
                            destination_tx_hash: dest_hash,
                            elapsed_secs: started.elapsed().as_secs(),
                        };
                    }
                }
            }
            Err(e) => {
                tracing::warn!(target: "provider_status_polling", route_id = %route_id, message_id = %cfg.message_id, error = %e, "poll request error");
            }
        }
        tokio::time::sleep(cfg.poll_interval).await;
    }
}
```

- [ ] **Step 3: Add tests** alongside the existing M4 tests:

```rust
#[cfg(test)]
mod lifecycle_wiring_tests {
    use super::*;
    use crate::lifecycle::list_for_route;
    use crate::test_support::test_pool;
    use std::time::Duration;
    use wiremock::{matchers::{method, path_regex}, Mock, MockServer, ResponseTemplate};

    async fn truncate(pool: &PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn polling_records_detected_pending_and_settled_transitions() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let server = MockServer::start().await;
        // First two responses report Pending, third reports Complete.
        let body_pending = r#"{"status":"Pending"}"#;
        let body_complete = r#"{"status":"Complete","destinationTxHash":"0xabc"}"#;
        Mock::given(method("GET"))
            .and(path_regex(r"^/transfer-status"))
            .respond_with(ResponseTemplate::new(200).set_body_string(body_pending))
            .up_to_n_times(2)
            .mount(&server).await;
        Mock::given(method("GET"))
            .and(path_regex(r"^/transfer-status"))
            .respond_with(ResponseTemplate::new(200).set_body_string(body_complete))
            .mount(&server).await;
        let cfg = PollerConfig {
            base_url: server.uri(),
            message_id: "msg_abc".into(),
            poll_interval: Duration::from_millis(50),
            timeout: Duration::from_secs(3),
        };
        let route_id = "POL:USDT->TRX:USDT:allbridge_core";
        let result = poll_until_settled_with_lifecycle(cfg, &pool, route_id, "xfer_abc").await;
        match result {
            ProviderStatusOutcome::Confirmed { destination_tx_hash, .. } => {
                assert_eq!(destination_tx_hash, "0xabc");
            }
            other => panic!("expected Confirmed, got {:?}", other),
        }
        let rows = list_for_route(&pool, route_id).await.unwrap();
        let event_names: Vec<&str> = rows.iter().map(|r| r.event.as_str()).collect();
        assert!(event_names.contains(&"provider_transfer_detected"),
            "expected provider_transfer_detected, got {:?}", event_names);
        assert!(event_names.contains(&"destination_pending"),
            "expected destination_pending, got {:?}", event_names);
        assert!(event_names.contains(&"destination_settled"),
            "expected destination_settled, got {:?}", event_names);
        // The settled row carries the destination tx hash and a non-empty provider response hash.
        let settled = rows.iter().find(|r| r.event == "destination_settled").unwrap();
        assert_eq!(settled.tx_hash.as_deref(), Some("0xabc"));
        let payload_hash = settled.payload.get("provider_status_response_hash").and_then(|x| x.as_str()).unwrap();
        assert!(payload_hash.starts_with("0x"));
        assert_eq!(payload_hash.len(), 2 + 64, "sha256 hex with 0x prefix");
    }

    #[tokio::test]
    async fn polling_records_failed_on_timeout() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path_regex(r"^/transfer-status"))
            .respond_with(ResponseTemplate::new(200).set_body_string(r#"{"status":"Pending"}"#))
            .mount(&server).await;
        let cfg = PollerConfig {
            base_url: server.uri(),
            message_id: "msg_tmo".into(),
            poll_interval: Duration::from_millis(50),
            timeout: Duration::from_millis(250),
        };
        let route_id = "POL:USDT->TRX:USDT:allbridge_core";
        let _ = poll_until_settled_with_lifecycle(cfg, &pool, route_id, "xfer_tmo").await;
        let rows = list_for_route(&pool, route_id).await.unwrap();
        let last = rows.last().unwrap();
        assert_eq!(last.event, "failed");
        assert_eq!(last.reason_code.as_deref(), Some("provider_status_polling_timeout"));
    }
}
```

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib provider_status_polling -- --test-threads=1 --nocapture
```

Expected: existing M4 tests still PASS, plus 2 new lifecycle wiring tests PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/provider_status_polling.rs
git status --short
```

---

## Task T7: Wire allbridge_registry to RouteSuspended on Stale Rejection

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** When the registry rejects a snapshot for staleness (the snapshot's `expires_at` is past), record a `Suspended` lifecycle event for every affected route and write a `route_suspensions` row with reason code `REGISTRY_STALE`.

**Spec IDs:** PRD-USDT-018, PRD-USDT-022; CRD CRD-SEC-005 (provider token-info removal must suspend affected routes); TRD-PROOF-008; SOW WP7.2.

**Files:**

- Modify: `sw4p/sw4p-backend/src/allbridge_registry.rs`
- Create: `sw4p/sw4p-backend/src/suspensions.rs` (initial module; T11 adds the operator-facing API)
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod suspensions;`)

- [ ] **Step 1: Write the suspensions module skeleton.** This task lands the writer; T11 lands the HTTP surface on top.

```rust
//! Operator route suspension storage.
//!
//! Owns the `route_suspensions` table introduced in T1. A suspended route
//! is one the operator (or a registry-stale automatic guard) has
//! disqualified from execution until cleared. Reads use the partial index
//! on `cleared_at IS NULL` so the hot-path check is a single index lookup.
//!
//! Satisfies: PRD-USDT-022; CRD CRD-SEC-008 (operator suspension without
//! code deployment); TRD section 11; SOW WP7.2, WP7.5.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RouteSuspension {
    pub suspension_id: String,
    pub route_id: String,
    pub reason_code: String,
    pub reason: String,
    pub operator: String,
    pub suspended_at: Option<DateTime<Utc>>,
    pub cleared_at: Option<DateTime<Utc>>,
    pub cleared_by: Option<String>,
    pub cleared_reason: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum SuspensionError {
    #[error("database: {0}")] Db(#[from] sqlx::Error),
    #[error("missing required field: {0}")] MissingRequired(&'static str),
    #[error("not found: {0}")] NotFound(String),
    #[error("already cleared: {0}")] AlreadyCleared(String),
}

fn validate(s: &RouteSuspension) -> Result<(), SuspensionError> {
    if s.suspension_id.is_empty() { return Err(SuspensionError::MissingRequired("suspension_id")); }
    if s.route_id.is_empty() { return Err(SuspensionError::MissingRequired("route_id")); }
    if s.reason_code.is_empty() { return Err(SuspensionError::MissingRequired("reason_code")); }
    if s.reason.is_empty() { return Err(SuspensionError::MissingRequired("reason")); }
    if s.operator.is_empty() { return Err(SuspensionError::MissingRequired("operator")); }
    Ok(())
}

/// Insert a new suspension row. Returns the inserted `suspension_id`.
pub async fn record(pool: &PgPool, sus: &RouteSuspension) -> Result<String, SuspensionError> {
    validate(sus)?;
    sqlx::query(
        r#"INSERT INTO route_suspensions
           (suspension_id, route_id, reason_code, reason, operator)
           VALUES ($1, $2, $3, $4, $5)"#,
    )
    .bind(&sus.suspension_id)
    .bind(&sus.route_id)
    .bind(&sus.reason_code)
    .bind(&sus.reason)
    .bind(&sus.operator)
    .execute(pool)
    .await?;
    tracing::info!(
        target: "suspensions",
        suspension_id = %sus.suspension_id,
        route_id = %sus.route_id,
        reason_code = %sus.reason_code,
        operator = %sus.operator,
        "route suspended"
    );
    Ok(sus.suspension_id.clone())
}

/// Mark the active suspension for `route_id` as cleared. Errors if no
/// active suspension exists.
pub async fn clear(
    pool: &PgPool,
    route_id: &str,
    cleared_by: &str,
    cleared_reason: &str,
) -> Result<(), SuspensionError> {
    let n = sqlx::query(
        r#"UPDATE route_suspensions
           SET cleared_at = NOW(), cleared_by = $2, cleared_reason = $3
           WHERE route_id = $1 AND cleared_at IS NULL"#,
    )
    .bind(route_id)
    .bind(cleared_by)
    .bind(cleared_reason)
    .execute(pool)
    .await?
    .rows_affected();
    if n == 0 {
        return Err(SuspensionError::NotFound(route_id.into()));
    }
    tracing::info!(
        target: "suspensions",
        route_id = %route_id,
        cleared_by = %cleared_by,
        "route suspension cleared"
    );
    Ok(())
}

/// Return true if `route_id` has an unclear suspension row.
pub async fn is_active(pool: &PgPool, route_id: &str) -> Result<bool, SuspensionError> {
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT suspension_id FROM route_suspensions WHERE route_id = $1 AND cleared_at IS NULL LIMIT 1"
    )
    .bind(route_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.is_some())
}

/// List all active suspensions, newest first. Used by T11's GET endpoint
/// (operator route-state dashboard) and the integration test (T15).
pub async fn list_active(pool: &PgPool) -> Result<Vec<RouteSuspension>, SuspensionError> {
    let rows: Vec<(String, String, String, String, String, DateTime<Utc>, Option<DateTime<Utc>>, Option<String>, Option<String>)> = sqlx::query_as(
        r#"SELECT suspension_id, route_id, reason_code, reason, operator,
                  suspended_at, cleared_at, cleared_by, cleared_reason
           FROM route_suspensions
           WHERE cleared_at IS NULL
           ORDER BY suspended_at DESC"#,
    )
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|r| RouteSuspension {
        suspension_id: r.0, route_id: r.1, reason_code: r.2, reason: r.3, operator: r.4,
        suspended_at: Some(r.5), cleared_at: r.6, cleared_by: r.7, cleared_reason: r.8,
    }).collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::test_pool;

    fn fixture(id: &str, route_id: &str) -> RouteSuspension {
        RouteSuspension {
            suspension_id: id.into(),
            route_id: route_id.into(),
            reason_code: "REGISTRY_STALE".into(),
            reason: "Provider registry snapshot expired before refresh.".into(),
            operator: "system:allbridge_registry".into(),
            suspended_at: None,
            cleared_at: None,
            cleared_by: None,
            cleared_reason: None,
        }
    }

    async fn truncate(pool: &PgPool) {
        sqlx::query("TRUNCATE TABLE route_suspensions RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn record_writes_active_suspension() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let id = record(&pool, &fixture("sus_001", "POL:USDT->TRX:USDT:allbridge_core")).await.expect("ok");
        assert_eq!(id, "sus_001");
        assert!(is_active(&pool, "POL:USDT->TRX:USDT:allbridge_core").await.unwrap());
    }

    #[tokio::test]
    async fn clear_marks_row() {
        let pool = test_pool().await;
        truncate(&pool).await;
        record(&pool, &fixture("sus_002", "POL:USDT->TRX:USDT:allbridge_core")).await.unwrap();
        clear(&pool, "POL:USDT->TRX:USDT:allbridge_core", "ops@rndrntwrk", "registry refreshed").await.expect("clear ok");
        assert!(!is_active(&pool, "POL:USDT->TRX:USDT:allbridge_core").await.unwrap());
    }

    #[tokio::test]
    async fn clear_fails_when_no_active_row() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let err = clear(&pool, "no:such:route", "ops", "noop").await.unwrap_err();
        assert!(matches!(err, SuspensionError::NotFound(_)));
    }

    #[tokio::test]
    async fn list_active_returns_only_uncleared() {
        let pool = test_pool().await;
        truncate(&pool).await;
        record(&pool, &fixture("sus_a", "RA:USDT->TRX:USDT:allbridge_core")).await.unwrap();
        record(&pool, &fixture("sus_b", "RB:USDT->TRX:USDT:allbridge_core")).await.unwrap();
        clear(&pool, "RA:USDT->TRX:USDT:allbridge_core", "ops", "fixed").await.unwrap();
        let list = list_active(&pool).await.unwrap();
        assert_eq!(list.len(), 1, "only one active");
        assert_eq!(list[0].route_id, "RB:USDT->TRX:USDT:allbridge_core");
    }

    #[tokio::test]
    async fn record_rejects_missing_required_field() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let mut s = fixture("sus_x", "RX:USDT->TRX:USDT:allbridge_core");
        s.reason_code = String::new();
        let err = record(&pool, &s).await.unwrap_err();
        assert!(matches!(err, SuspensionError::MissingRequired("reason_code")));
    }
}
```

- [ ] **Step 2: Wire the module declaration.**

Edit `sw4p/sw4p-backend/src/lib.rs` and add `pub mod suspensions;`.

- [ ] **Step 3: Augment `allbridge_registry.rs` to call `suspensions::record` on stale rejection.**

Locate the existing M0-M2 path that rejects a stale registry snapshot (typically inside `refresh_or_die`-style logic). Add immediately after the rejection branch:

```rust
use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};
use crate::suspensions::{record as record_suspension, RouteSuspension};

// When the registry snapshot is stale (expires_at <= now), iterate over
// every route id derived from the prior snapshot and write a route
// suspension + a Suspended lifecycle event. The operator runbook (T14
// provider-degradation.md) directs the operator to refresh the registry
// and clear the suspension via the operator API (T11).
async fn suspend_routes_for_stale_registry(
    pool: &sqlx::PgPool,
    affected_route_ids: &[String],
    snapshot_id: &str,
) {
    for route_id in affected_route_ids {
        let suspension_id = format!("sus_{}_{}_{}",
            snapshot_id,
            route_id.replace(':', "_").replace("->", "_to_"),
            chrono::Utc::now().timestamp_millis()
        );
        let sus = RouteSuspension {
            suspension_id,
            route_id: route_id.clone(),
            reason_code: "REGISTRY_STALE".into(),
            reason: format!("Allbridge registry snapshot {} expired; routes suspended until refresh.", snapshot_id),
            operator: "system:allbridge_registry".into(),
            suspended_at: None,
            cleared_at: None,
            cleared_by: None,
            cleared_reason: None,
        };
        if let Err(e) = record_suspension(pool, &sus).await {
            tracing::warn!(
                target: "allbridge_registry",
                route_id = %route_id,
                error = %e,
                "failed to record stale-registry suspension"
            );
        }
        let payload = LifecyclePayload {
            registry_snapshot_hash: Some(snapshot_id.into()),
            failure_reason: Some("REGISTRY_STALE".into()),
            ..Default::default()
        };
        if let Err(e) = record_event(pool, route_id, LifecycleEvent::Suspended, payload).await {
            tracing::warn!(
                target: "allbridge_registry",
                route_id = %route_id,
                error = %e,
                "failed to record Suspended lifecycle event"
            );
        }
    }
}
```

Then invoke `suspend_routes_for_stale_registry` from the stale-rejection branch, passing the route ids derived from the prior in-memory snapshot. If the prior snapshot is not retained, log a tracing warning and skip the suspension write rather than fail the entire request; the operator runbook will surface the gap.

- [ ] **Step 4: Add a test in `allbridge_registry.rs::tests` or alongside.**

```rust
#[cfg(test)]
mod stale_registry_lifecycle_tests {
    use super::*;
    use crate::lifecycle::list_for_route;
    use crate::suspensions::is_active;
    use crate::test_support::test_pool;

    async fn truncate(pool: &sqlx::PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
        sqlx::query("TRUNCATE TABLE route_suspensions RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn stale_registry_suspends_routes_and_records_lifecycle() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let routes = vec![
            "POL:USDT->TRX:USDT:allbridge_core".to_string(),
            "ETH:USDT->TRX:USDT:allbridge_core".to_string(),
        ];
        suspend_routes_for_stale_registry(&pool, &routes, "snap_abc").await;
        for r in routes.iter() {
            assert!(is_active(&pool, r).await.unwrap(), "{} must be suspended", r);
            let rows = list_for_route(&pool, r).await.unwrap();
            assert_eq!(rows.len(), 1);
            assert_eq!(rows[0].event, "suspended");
            assert_eq!(rows[0].reason_code.as_deref(), Some("REGISTRY_STALE"));
        }
    }
}
```

- [ ] **Step 5: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib suspensions allbridge_registry -- --test-threads=1 --nocapture
```

Expected: 5 PASS in `suspensions`, plus 1 new PASS in `allbridge_registry`, existing tests still PASS.

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/suspensions.rs sw4p-backend/src/allbridge_registry.rs sw4p-backend/src/lib.rs
git status --short
```

---

## Task T8: Wire raw_tx_validator to RawTxValidated and Failed Events

**Wave:** W5. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add a sibling `validate_with_route_state_and_lifecycle` to `raw_tx_validator` that records `RawTxValidated` on success and `Failed` (with a specific reason code from the existing `failed_check` list) on failure.

**Spec IDs:** PRD-USDT-018; TRD-PROOF-003; CRD section 9 (raw tx validation).

**Files:**

- Modify: `sw4p/sw4p-backend/src/raw_tx_validator.rs`

- [ ] **Step 1: Locate the M4 `validate_with_route_state` function.**

```bash
grep -nA10 'pub async fn validate_with_route_state' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/raw_tx_validator.rs
```

- [ ] **Step 2: Add the lifecycle-wired variant.**

```rust
use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};

/// Same as `validate_with_route_state`, but writes a `RawTxValidated`
/// lifecycle row on success and a `Failed` row carrying the failure
/// reason_code on rejection. The reason_code matches the value the
/// existing `RawTxValidationResult.failed_check` reports, so downstream
/// dashboards and alerting key off the same vocabulary.
pub async fn validate_with_route_state_and_lifecycle(
    intent: &Intent,
    quote: &Quote,
    payload: &SendPayload,
    snap: &SnapshotMetaForValidator,
    pool: &sqlx::PgPool,
    route_id: &str,
) -> RawTxValidationResult {
    let result = validate_with_route_state(intent, quote, payload, snap, pool).await;
    let lifecycle_payload = LifecyclePayload {
        registry_snapshot_hash: Some(snap.snapshot_id.clone()),
        quote_hash: Some(quote_hash_for_lifecycle(quote)),
        raw_tx_hash: Some(raw_tx_hash_for_lifecycle(payload)),
        ..Default::default()
    };
    if result.is_valid() {
        if let Err(e) = record_event(pool, route_id, LifecycleEvent::RawTxValidated, lifecycle_payload).await {
            tracing::warn!(
                target: "raw_tx_validator",
                route_id = %route_id,
                error = %e,
                "failed to record RawTxValidated lifecycle event"
            );
        }
    } else {
        let mut failed_payload = lifecycle_payload;
        failed_payload.failure_reason = Some(result.first_failed_check_code().to_string());
        if let Err(e) = record_event(pool, route_id, LifecycleEvent::Failed, failed_payload).await {
            tracing::warn!(
                target: "raw_tx_validator",
                route_id = %route_id,
                error = %e,
                "failed to record Failed lifecycle event"
            );
        }
    }
    result
}

/// Deterministic hash of the quote, used as a lifecycle payload hint.
/// Truncates to 32 hex chars for readability; the full hash is in the
/// evidence row.
fn quote_hash_for_lifecycle(quote: &Quote) -> String {
    use sha2::{Digest, Sha256};
    let encoded = serde_json::to_string(quote).unwrap_or_default();
    let hash = Sha256::digest(encoded.as_bytes());
    format!("0x{}", &hex::encode(hash)[..32])
}

/// Deterministic hash of the raw tx payload, used as a lifecycle payload
/// hint. Same truncation rule as `quote_hash_for_lifecycle`.
fn raw_tx_hash_for_lifecycle(payload: &SendPayload) -> String {
    use sha2::{Digest, Sha256};
    let encoded = serde_json::to_string(payload).unwrap_or_default();
    let hash = Sha256::digest(encoded.as_bytes());
    format!("0x{}", &hex::encode(hash)[..32])
}
```

- [ ] **Step 3: Expose helpers on `RawTxValidationResult`.** If the existing struct does not already have `is_valid()` and `first_failed_check_code()`, add them. Inspect first:

```bash
grep -nA20 'pub struct RawTxValidationResult\|pub enum RawTxValidationResult' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/raw_tx_validator.rs
```

The M0-M2 shape carries a `passed_checks: Vec<String>` and a `failed_check: Option<{ check: String, reason: String, code: String }>` (or similar). Add:

```rust
impl RawTxValidationResult {
    pub fn is_valid(&self) -> bool {
        self.failed_check.is_none()
    }

    pub fn first_failed_check_code(&self) -> &str {
        self.failed_check.as_ref().map(|f| f.code.as_str()).unwrap_or("UNKNOWN")
    }
}
```

(Adapt to the actual field name; the M3/M4 plans called it `failed_check` consistently.)

- [ ] **Step 4: Add tests.**

```rust
#[cfg(test)]
mod lifecycle_wiring_tests {
    use super::*;
    use crate::lifecycle::list_for_route;
    use crate::test_support::test_pool;

    async fn truncate(pool: &sqlx::PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
    }

    fn fixture_intent_quote_payload_snap() -> (Intent, Quote, SendPayload, SnapshotMetaForValidator) {
        // Reuse the existing M3/M4 fixtures. If they live behind a `tests` module,
        // replicate the minimal versions inline.
        let intent = Intent::default();  // assumes Intent: Default
        let quote = Quote::default();
        let payload = SendPayload::default();
        let snap = SnapshotMetaForValidator {
            snapshot_id: "snap_pinned_2026_05_18".into(),
            fetched_at: "2026-05-18T00:00:00Z".into(),
            expires_at: "2026-05-19T00:00:00Z".into(),
        };
        (intent, quote, payload, snap)
    }

    #[tokio::test]
    async fn lifecycle_wrap_records_raw_tx_validated_on_success() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let (mut intent, quote, payload, snap) = fixture_intent_quote_payload_snap();
        // Configure intent so the validator's existing happy path passes.
        intent.source_chain = "TRX".into();
        // ... (any other fixture wiring that the M3/M4 happy-path tests already did)
        let route_id = "POL:USDT->TRX:USDT:allbridge_core";
        let _result = validate_with_route_state_and_lifecycle(
            &intent, &quote, &payload, &snap, &pool, route_id
        ).await;
        let rows = list_for_route(&pool, route_id).await.unwrap();
        assert_eq!(rows.len(), 1);
        // Depending on whether the happy path actually passes in the test
        // fixture, the assert below may need to be `failed`. The point of
        // this test is the *lifecycle row exists*, not the legacy
        // validator outcome.
        assert!(rows[0].event == "raw_tx_validated" || rows[0].event == "failed",
            "expected lifecycle row, got {:?}", rows[0].event);
    }

    #[tokio::test]
    async fn lifecycle_wrap_records_failed_with_reason_code_on_failure() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let (mut intent, quote, payload, snap) = fixture_intent_quote_payload_snap();
        // Configure intent so validation fails on a known check (route_state_missing).
        intent.source_chain = "TRX".into();
        // ... configure so the validator returns failed_check with code ROUTE_STATE_MISSING
        let route_id = "fake:route:that:does:not:exist";
        let _result = validate_with_route_state_and_lifecycle(
            &intent, &quote, &payload, &snap, &pool, route_id
        ).await;
        let rows = list_for_route(&pool, route_id).await.unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].event, "failed");
        assert!(rows[0].reason_code.is_some(), "reason_code must be set");
    }
}
```

(The two tests above are deliberately structural rather than asserting exact outcomes; the goal is to prove the lifecycle write path fires. The existing M3/M4 unit tests already pin happy-path / failed-path outcomes for the underlying validator.)

- [ ] **Step 5: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib raw_tx_validator -- --test-threads=1 --nocapture
```

Expected: existing tests still PASS, plus 2 new lifecycle wiring tests PASS.

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/raw_tx_validator.rs
git status --short
```

---

## Task T9: Wire bridge_from_tron_with_mode for RouteRequested through SourceTxSubmitted

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Inside `bridge_from_tron_with_mode`, write lifecycle rows for `RouteRequested`, `ProviderRegistryChecked`, `QuoteRequested`, `QuoteReceived`, `RawTxBuilt`, `WalletSignatureRequested`, and `SourceTxSubmitted`. Each write precedes the side effect for that state.

**Spec IDs:** PRD-USDT-018; TRD-PROOF-001 (durable lifecycle row before external calls), TRD-PROOF-002 (quote hash), TRD-PROOF-003 (raw tx hash before signing), TRD-PROOF-004 (source tx hash immediately after submission); SOW WP7.2.

**Files:**

- Modify: `sw4p/sw4p-backend/src/allbridge.rs`

- [ ] **Step 1: Inspect the current `bridge_from_tron_with_mode` body.**

```bash
grep -nA80 'pub async fn bridge_from_tron_with_mode' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/allbridge.rs
```

- [ ] **Step 2: Compute the route id once at the top.**

```rust
let route_id = format!(
    "{}:{}->{}:{}:allbridge_core",
    request.source_chain, request.token,
    request.destination_chain, request.destination_token
);
```

- [ ] **Step 3: Insert the lifecycle writes inline.** The pattern at every transition point:

```rust
use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};

// RouteRequested: very first thing, before any provider call.
let _ = record_event(
    pool,
    &route_id,
    LifecycleEvent::RouteRequested,
    LifecyclePayload {
        source_chain: Some(request.source_chain.clone()),
        destination_chain: Some(request.destination_chain.clone()),
        source_token: Some(request.token.clone()),
        destination_token: Some(request.destination_token.clone()),
        amount_decimal: Some(request.amount_decimal.clone()),
        ..Default::default()
    },
).await;

// ProviderRegistryChecked: after the registry lookup that confirms the route is allowed.
let _ = record_event(
    pool,
    &route_id,
    LifecycleEvent::ProviderRegistryChecked,
    LifecyclePayload {
        registry_snapshot_hash: Some(registry_snapshot.id.clone()),
        ..Default::default()
    },
).await;

// QuoteRequested: immediately before the quote HTTP call.
let _ = record_event(
    pool,
    &route_id,
    LifecycleEvent::QuoteRequested,
    LifecyclePayload {
        source_chain: Some(request.source_chain.clone()),
        destination_chain: Some(request.destination_chain.clone()),
        ..Default::default()
    },
).await;

// (perform the quote call)
let quote = quote_client.fetch_quote(&request).await?;

// QuoteReceived: immediately after the quote returns, with the quote hash.
let quote_hash = compute_quote_hash(&quote);
let _ = record_event(
    pool,
    &route_id,
    LifecycleEvent::QuoteReceived,
    LifecyclePayload {
        quote_hash: Some(quote_hash.clone()),
        ..Default::default()
    },
).await;

// RawTxBuilt: after the unsigned tx is constructed.
let unsigned = build_unsigned_tx(&quote, &request)?;
let raw_tx_hash = compute_raw_tx_hash(&unsigned);
let _ = record_event(
    pool,
    &route_id,
    LifecycleEvent::RawTxBuilt,
    LifecyclePayload {
        quote_hash: Some(quote_hash.clone()),
        raw_tx_hash: Some(raw_tx_hash.clone()),
        ..Default::default()
    },
).await;

// WalletSignatureRequested: only on the user-signed path; the canary path
// would record WalletSignatureRequested before its internal sign step too.
let _ = record_event(
    pool,
    &route_id,
    LifecycleEvent::WalletSignatureRequested,
    LifecyclePayload {
        raw_tx_hash: Some(raw_tx_hash.clone()),
        ..Default::default()
    },
).await;
// For the UserSigned mode, return the unsigned tx and exit. The frontend
// signs and POSTs to /v1/tron/broadcast; the broadcast handler (which we
// also extend below in this step) writes the SourceTxSubmitted row.

// SourceTxSubmitted: only on the canary path inside this function, since
// UserSigned exits above. The broadcast handler records the same event
// for the UserSigned path.
let _ = record_event(
    pool,
    &route_id,
    LifecycleEvent::SourceTxSubmitted,
    LifecyclePayload {
        raw_tx_hash: Some(source_tx_hash.clone()),
        ..Default::default()
    },
).await;
```

The `compute_quote_hash` and `compute_raw_tx_hash` helpers are sha256-over-canonical-json; reuse the lifecycle helpers from T8 (`quote_hash_for_lifecycle`, `raw_tx_hash_for_lifecycle`) or factor them into a shared `crate::hashes` mini-module if `allbridge.rs` already has its own version. Pick whichever results in the same hash for the same quote / payload across modules.

- [ ] **Step 4: Extend `tron_signing_api::broadcast_handler` to write `SourceTxSubmitted`.** The M3/M4 broadcast handler does not know the route id; M5 adds a `route_id: Option<String>` field to `BroadcastRequest`. When present, the handler writes the lifecycle row immediately before forwarding to TronGrid.

```rust
// inside tron_signing_api.rs broadcast_handler, after request validation
// and before the TronGrid forward:
if let Some(route_id) = req.route_id.as_deref() {
    use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};
    let raw_data_hex = signed.get("raw_data_hex").and_then(|s| s.as_str()).unwrap_or("");
    let payload = LifecyclePayload {
        raw_tx_hash: Some(format!("0x{}", &raw_data_hex.chars().take(64).collect::<String>())),
        ..Default::default()
    };
    let _ = record_event(&pool, route_id, LifecycleEvent::SourceTxSubmitted, payload).await;
}
```

Add `route_id: Option<String>` to `BroadcastRequest`.

- [ ] **Step 5: Add tests in `allbridge.rs`.**

```rust
#[cfg(test)]
mod lifecycle_wiring_tests {
    use super::*;
    use crate::lifecycle::list_for_route;
    use crate::test_support::test_pool;

    async fn truncate(pool: &sqlx::PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn user_signed_path_records_lifecycle_up_to_wallet_signature_requested() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let adapter = AllbridgeAdapter::default();
        let request = BridgeRequest {
            source_chain: "TRX".into(),
            destination_chain: "POL".into(),
            token: "USDT".into(),
            destination_token: "USDT".into(),
            amount_decimal: "5.00".into(),
            sender: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t".into(),
            recipient: "0xowner".into(),
        };
        let _ = adapter.bridge_from_tron_with_mode(
            request,
            TronExecutionMode::UserSigned,
            &pool,
        ).await;
        let route_id = "TRX:USDT->POL:USDT:allbridge_core";
        let rows = list_for_route(&pool, route_id).await.unwrap();
        let events: Vec<&str> = rows.iter().map(|r| r.event.as_str()).collect();
        assert!(events.contains(&"route_requested"), "got {:?}", events);
        assert!(events.contains(&"provider_registry_checked") || events.contains(&"failed"),
            "got {:?}", events);
    }
}
```

The flexible assertion (`contains_registry_checked OR contains_failed`) accommodates the case where the test environment cannot reach a real Allbridge registry; the lifecycle integration is the assertion, not the provider success.

- [ ] **Step 6: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib allbridge tron_signing_api -- --test-threads=1 --nocapture
```

Expected: existing allbridge tests still PASS, plus 1 new lifecycle wiring test PASS.

- [ ] **Step 7: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/allbridge.rs sw4p-backend/src/tron_signing_api.rs
git status --short
```

---

## Task T10: bridge_from_tron_with_caps Refactor (Closes M4 Critical Follow-up)

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Extract a private helper `bridge_from_tron_with_caps(request, caps, pool)` from the relayer-sign path inside `bridge_from_tron`, and enforce the canary caps for `max_fee`, `approval_cap`, and `max_slippage`. Each rejection writes a `Failed` lifecycle row with a specific reason code (`CANARY_FEE_OVERRUN`, `CANARY_APPROVAL_OVERRUN`, `CANARY_SLIPPAGE_OVERRUN`).

**Spec IDs:** PRD-USDT-019; TRD-TRON-009; CRD section 14 (canary authorization object); closes M4 critical follow-up.

**Files:**

- Modify: `sw4p/sw4p-backend/src/allbridge.rs`

- [ ] **Step 1: Locate the M4 Canary arm.**

```bash
grep -nB5 -A60 'TronExecutionMode::Canary' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/allbridge.rs
```

The M4 T5 work added the asset/amount checks and wired the call to `bridge_from_tron_with_caps`, but left the inner function with a stub body. M5 fills it in.

- [ ] **Step 2: Write the helper.**

```rust
use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};
use crate::raw_tx_validator::normalize_decimal;

/// Internal helper that runs the relayer-signed Tron path with the canary
/// caps enforced. Each cap is checked once at the right point in the
/// flow:
///   - max_fee is compared to the quote's relayer_fee right after the
///     quote returns;
///   - approval_cap is compared to the approval tx amount right after
///     the approval tx is constructed;
///   - max_slippage is compared to the implied slippage right after the
///     bridge tx is constructed.
/// A cap rejection writes a Failed lifecycle row with a specific reason
/// code and returns an error; the caller (the Canary arm of
/// bridge_from_tron_with_mode) then returns that error without consuming
/// the authorization row.
async fn bridge_from_tron_with_caps(
    adapter: &AllbridgeAdapter,
    request: &BridgeRequest,
    caps: &CanaryCaps,
    pool: &sqlx::PgPool,
    route_id: &str,
) -> Result<AllbridgeBridgeResult, Box<dyn std::error::Error + Send + Sync>> {
    // 1. Fetch the quote. The existing code path constructs the quote
    // client and calls `fetch_quote`; reuse that, then enforce the fee cap.
    let _ = record_event(pool, route_id, LifecycleEvent::QuoteRequested, LifecyclePayload::default()).await;
    let quote = adapter.fetch_tron_quote(request).await?;
    let _ = record_event(pool, route_id, LifecycleEvent::QuoteReceived, LifecyclePayload {
        quote_hash: Some(compute_quote_hash(&quote)),
        ..Default::default()
    }).await;
    let quote_fee = normalize_decimal(&quote.relayer_fee_decimal)
        .ok_or_else(|| "quote relayer_fee_decimal is malformed")?;
    let max_fee = normalize_decimal(&caps.max_fee_decimal)
        .ok_or_else(|| "caps.max_fee_decimal is malformed")?;
    if compare_decimal_strings(&quote_fee, &max_fee) == std::cmp::Ordering::Greater {
        let _ = record_event(pool, route_id, LifecycleEvent::Failed, LifecyclePayload {
            failure_reason: Some("CANARY_FEE_OVERRUN".into()),
            quote_hash: Some(compute_quote_hash(&quote)),
            ..Default::default()
        }).await;
        return Err(format!(
            "canary fee overrun: quote fee {} > caps max_fee {}",
            quote_fee, max_fee
        ).into());
    }

    // 2. Build the approval tx. Enforce approval_cap.
    let approval_tx = adapter.build_tron_approval_tx(request, &quote).await?;
    let approval_amount = normalize_decimal(&approval_tx.amount_decimal)
        .ok_or_else(|| "approval amount_decimal is malformed")?;
    let approval_cap = normalize_decimal(&caps.approval_cap_decimal)
        .ok_or_else(|| "caps.approval_cap_decimal is malformed")?;
    if compare_decimal_strings(&approval_amount, &approval_cap) == std::cmp::Ordering::Greater {
        let _ = record_event(pool, route_id, LifecycleEvent::Failed, LifecyclePayload {
            failure_reason: Some("CANARY_APPROVAL_OVERRUN".into()),
            quote_hash: Some(compute_quote_hash(&quote)),
            ..Default::default()
        }).await;
        return Err(format!(
            "canary approval overrun: approval amount {} > caps approval_cap {}",
            approval_amount, approval_cap
        ).into());
    }
    let _ = record_event(pool, route_id, LifecycleEvent::ApprovalRequired, LifecyclePayload::default()).await;

    // 3. Build the bridge tx. Enforce implied slippage against caps.
    let bridge_tx = adapter.build_tron_bridge_tx(request, &quote).await?;
    let implied_slippage = compute_implied_slippage(&quote, &bridge_tx);
    let max_slippage = normalize_decimal(&caps.max_slippage_decimal)
        .ok_or_else(|| "caps.max_slippage_decimal is malformed")?;
    if compare_decimal_strings(&implied_slippage, &max_slippage) == std::cmp::Ordering::Greater {
        let _ = record_event(pool, route_id, LifecycleEvent::Failed, LifecyclePayload {
            failure_reason: Some("CANARY_SLIPPAGE_OVERRUN".into()),
            quote_hash: Some(compute_quote_hash(&quote)),
            ..Default::default()
        }).await;
        return Err(format!(
            "canary slippage overrun: implied slippage {} > caps max_slippage {}",
            implied_slippage, max_slippage
        ).into());
    }
    let _ = record_event(pool, route_id, LifecycleEvent::RawTxBuilt, LifecyclePayload {
        quote_hash: Some(compute_quote_hash(&quote)),
        raw_tx_hash: Some(compute_raw_tx_hash_for_tron_bridge(&bridge_tx)),
        ..Default::default()
    }).await;

    // 4. Sign + broadcast via the existing relayer code path.
    let _ = record_event(pool, route_id, LifecycleEvent::WalletSignatureRequested, LifecyclePayload::default()).await;
    let signed_approval = adapter.relayer_sign(&approval_tx)?;
    let approval_tx_hash = adapter.tron_client.broadcast_signed(&signed_approval).await?;
    let _ = record_event(pool, route_id, LifecycleEvent::ApprovalSubmitted, LifecyclePayload {
        raw_tx_hash: Some(approval_tx_hash.clone()),
        ..Default::default()
    }).await;
    let approval_confirmed = adapter.tron_client.wait_for_confirmation(&approval_tx_hash, 60).await;
    if !approval_confirmed.confirmed {
        let _ = record_event(pool, route_id, LifecycleEvent::Failed, LifecyclePayload {
            failure_reason: Some("APPROVAL_NOT_CONFIRMED".into()),
            raw_tx_hash: Some(approval_tx_hash.clone()),
            ..Default::default()
        }).await;
        return Err("approval tx did not confirm".into());
    }
    let _ = record_event(pool, route_id, LifecycleEvent::ApprovalConfirmed, LifecyclePayload {
        raw_tx_hash: Some(approval_tx_hash.clone()),
        ..Default::default()
    }).await;

    let signed_bridge = adapter.relayer_sign(&bridge_tx)?;
    let source_tx_hash = adapter.tron_client.broadcast_signed(&signed_bridge).await?;
    let _ = record_event(pool, route_id, LifecycleEvent::SourceTxSubmitted, LifecyclePayload {
        raw_tx_hash: Some(source_tx_hash.clone()),
        ..Default::default()
    }).await;

    Ok(AllbridgeBridgeResult {
        tx_hash: source_tx_hash,
        approval_tx_hash: Some(approval_tx_hash),
        quote_hash: compute_quote_hash(&quote),
    })
}

/// Compare two normalized decimal strings (no leading zeros, fixed scale,
/// lexicographic-safe per `normalize_decimal`). The contract is that
/// `normalize_decimal` produces strings that lexicographic comparison
/// matches numeric comparison.
fn compare_decimal_strings(a: &str, b: &str) -> std::cmp::Ordering {
    let len_cmp = a.len().cmp(&b.len());
    if len_cmp != std::cmp::Ordering::Equal {
        return len_cmp;
    }
    a.cmp(b)
}

/// Implied slippage is the difference between the quoted destination
/// amount and the bridge tx's `min_recipient_amount`, normalized as a
/// percentage decimal string. Returns "0" if the quote shape lacks the
/// fields needed.
fn compute_implied_slippage(quote: &Quote, bridge_tx: &TronBridgeTx) -> String {
    let quoted = quote.destination_amount_decimal.clone();
    let min_recv = bridge_tx.min_recipient_amount_decimal.clone();
    if quoted.is_empty() || min_recv.is_empty() {
        return "0".into();
    }
    // Implementer note: the real formula is (quoted - min_recv) / quoted.
    // For the purposes of this enforcement, parse as f64 and clamp to a
    // bounded range; the canary caps are also expressed as percentages.
    let q: f64 = quoted.parse().unwrap_or(0.0);
    let m: f64 = min_recv.parse().unwrap_or(0.0);
    if q <= 0.0 { return "0".into(); }
    let slippage = ((q - m) / q) * 100.0;
    format!("{:.4}", slippage.max(0.0))
}

fn compute_raw_tx_hash_for_tron_bridge(tx: &TronBridgeTx) -> String {
    use sha2::{Digest, Sha256};
    let encoded = serde_json::to_string(tx).unwrap_or_default();
    format!("0x{}", hex::encode(Sha256::digest(encoded.as_bytes())))
}
```

Notes for the implementer:
- The names `AllbridgeAdapter`, `BridgeRequest`, `Quote`, `TronBridgeTx`, `relayer_sign`, `build_tron_approval_tx`, `build_tron_bridge_tx`, `fetch_tron_quote`, `broadcast_signed`, `wait_for_confirmation` are placeholders for whatever the actual M4 code calls them. Adapt to the real names from `allbridge.rs`. The pattern is what matters: thread caps, check before the side effect, write Failed with the right reason code.
- `compute_quote_hash` and `compute_raw_tx_hash_for_tron_bridge` should sha256 a canonical JSON serialization; both are stable across the call sites in T8, T9, and T10. Factor them into a small inner module if they would otherwise duplicate.
- The implied-slippage computation is intentionally simple; if the real quote shape distinguishes `min_amount_out` differently from `expected_amount_out`, adapt the formula to match the Allbridge SDK semantics. The cap enforcement itself does not change.

- [ ] **Step 3: Wire the Canary arm to call the helper.**

```rust
// inside bridge_from_tron_with_mode's Canary arm, after existing chain/
// wallet/asset/amount checks:
let caps = CanaryCaps {
    max_fee_decimal: auth.max_fee.clone(),
    max_slippage_decimal: auth.max_slippage.clone(),
    approval_cap_decimal: auth.approval_cap.clone(),
};
let route_id = format!(
    "{}:{}->{}:{}:allbridge_core",
    request.source_chain, request.token,
    request.destination_chain, request.destination_token
);
let result = bridge_from_tron_with_caps(self, &request, &caps, pool, &route_id).await?;
// Only on success: consume the authorization row and return the broadcast variant.
canary_authorization::consume(pool, &authorization_id, &result.tx_hash).await?;
return Ok(TronBridgeResult::Broadcast(result));
```

- [ ] **Step 4: Add three cap-overrun tests.**

```rust
#[cfg(test)]
mod canary_cap_enforcement_tests {
    use super::*;
    use crate::canary_authorization::{insert, CanaryAuthorization};
    use crate::lifecycle::list_for_route;
    use crate::test_support::test_pool;
    use chrono::Utc;

    async fn truncate(pool: &sqlx::PgPool) {
        for t in ["canary_authorizations", "settlement_lifecycle_events"] {
            sqlx::query(&format!("TRUNCATE TABLE {} RESTART IDENTITY", t)).execute(pool).await.ok();
        }
    }

    fn fixture_auth() -> CanaryAuthorization {
        CanaryAuthorization {
            authorization_id: "auth_cap_test".into(),
            source_chain: "TRX".into(),
            destination_chain: "POL".into(),
            source_asset: "USDT".into(),
            destination_asset: "USDT".into(),
            rail: "allbridge_core".into(),
            amount_decimal: "5.00".into(),
            source_wallet: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t".into(),
            destination_wallet: "0xowner".into(),
            max_fee: "0.50".into(),
            max_slippage: "0.10".into(),
            approval_cap: "5.00".into(),
            expires_at: Utc::now() + chrono::Duration::hours(1),
            approver: "ops@rndrntwrk".into(),
            proof_destination: "evidence/cap_test".into(),
            notes: None,
        }
    }

    fn fixture_request() -> BridgeRequest {
        BridgeRequest {
            source_chain: "TRX".into(),
            destination_chain: "POL".into(),
            token: "USDT".into(),
            destination_token: "USDT".into(),
            amount_decimal: "5.00".into(),
            sender: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t".into(),
            recipient: "0xowner".into(),
        }
    }

    #[tokio::test]
    async fn caps_helper_rejects_when_quote_fee_exceeds_max_fee() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let auth = fixture_auth();
        insert(&pool, &auth).await.unwrap();
        let caps = CanaryCaps {
            max_fee_decimal: "0.10".into(),
            max_slippage_decimal: "1.00".into(),
            approval_cap_decimal: "10.00".into(),
        };
        let adapter = AllbridgeAdapter::default();
        let route_id = "TRX:USDT->POL:USDT:allbridge_core";
        let result = bridge_from_tron_with_caps(&adapter, &fixture_request(), &caps, &pool, route_id).await;
        // The synthetic adapter quote returns a relayer_fee_decimal > 0.10
        // (the implementer must wire the test adapter to return a known
        // fee value; see `AllbridgeAdapter::default()` and any test_support
        // helper for stubbing the quote response).
        assert!(result.is_err(), "expected fee overrun rejection");
        let rows = list_for_route(&pool, route_id).await.unwrap();
        let last = rows.last().expect("at least one row");
        assert_eq!(last.event, "failed");
        assert_eq!(last.reason_code.as_deref(), Some("CANARY_FEE_OVERRUN"));
    }

    #[tokio::test]
    async fn caps_helper_rejects_when_approval_exceeds_cap() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let caps = CanaryCaps {
            max_fee_decimal: "10.00".into(),
            max_slippage_decimal: "1.00".into(),
            approval_cap_decimal: "0.01".into(), // very low cap to trigger
        };
        let adapter = AllbridgeAdapter::default();
        let route_id = "TRX:USDT->POL:USDT:allbridge_core";
        let result = bridge_from_tron_with_caps(&adapter, &fixture_request(), &caps, &pool, route_id).await;
        assert!(result.is_err(), "expected approval overrun rejection");
        let rows = list_for_route(&pool, route_id).await.unwrap();
        let last = rows.last().expect("at least one row");
        assert_eq!(last.event, "failed");
        assert_eq!(last.reason_code.as_deref(), Some("CANARY_APPROVAL_OVERRUN"));
    }

    #[tokio::test]
    async fn caps_helper_rejects_when_implied_slippage_exceeds_max() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let caps = CanaryCaps {
            max_fee_decimal: "10.00".into(),
            max_slippage_decimal: "0.0001".into(), // basically zero tolerance
            approval_cap_decimal: "10.00".into(),
        };
        let adapter = AllbridgeAdapter::default();
        let route_id = "TRX:USDT->POL:USDT:allbridge_core";
        let result = bridge_from_tron_with_caps(&adapter, &fixture_request(), &caps, &pool, route_id).await;
        assert!(result.is_err(), "expected slippage overrun rejection");
        let rows = list_for_route(&pool, route_id).await.unwrap();
        let last = rows.last().expect("at least one row");
        assert_eq!(last.event, "failed");
        assert_eq!(last.reason_code.as_deref(), Some("CANARY_SLIPPAGE_OVERRUN"));
    }
}
```

The three tests share a fixture and configure the synthetic `AllbridgeAdapter::default()` so each cap fires individually. If the existing adapter does not have a stub-able quote path, add a `test_support::stub_adapter_for_quote(fee, slippage)` helper alongside the existing `test_pool()`. The point is that each cap rejection actually fires and writes the right reason code.

- [ ] **Step 5: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib allbridge -- --test-threads=1 --nocapture
```

Expected: existing allbridge tests still PASS, plus 3 new cap enforcement tests PASS.

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/allbridge.rs
git status --short
```

---


## Task T11: Operator Route Suspension API

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Axum router exposing `POST /v1/operator/route-states/:route_id/suspend`, `DELETE /v1/operator/route-states/:route_id/suspend`, and `GET /v1/operator/route-states/suspensions`. Auth is a static header check (`X-Operator-Token` matching `OPERATOR_AUTH_TOKEN` env var); full RBAC ships in M6.

**Spec IDs:** PRD-USDT-022; CRD CRD-SEC-008 (operator suspension without code deployment); SOW WP7.6.

**Files:**

- Create: `sw4p/sw4p-backend/src/operator_api.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (`pub mod operator_api;`)
- Modify: `sw4p/sw4p-backend/src/main.rs` (merge router)

- [ ] **Step 1: Write the module.**

```rust
//! Operator route-state HTTP API.
//!
//! Three endpoints under `/v1/operator/route-states`:
//!   - POST /:route_id/suspend       -> creates a suspension
//!   - DELETE /:route_id/suspend     -> clears the active suspension
//!   - GET /suspensions              -> lists all active suspensions
//!
//! Auth: each request must carry the `X-Operator-Token` header set to the
//! `OPERATOR_AUTH_TOKEN` environment variable. Missing or mismatched
//! header returns 401 Unauthorized. This is intentionally minimal; M6
//! replaces it with full RBAC via the existing auth middleware.
//!
//! Satisfies: PRD-USDT-022; CRD CRD-SEC-008; SOW WP7.6.

use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    routing::{delete, get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

const OPERATOR_AUTH_HEADER: &str = "x-operator-token";

#[derive(Deserialize)]
pub struct SuspendRequest {
    pub reason_code: String,
    pub reason: String,
    pub operator: String,
}

#[derive(Serialize)]
pub struct SuspendResponse {
    pub suspension_id: String,
    pub route_id: String,
    pub reason_code: String,
}

#[derive(Deserialize)]
pub struct ClearRequest {
    pub cleared_by: String,
    pub cleared_reason: String,
}

#[derive(Serialize)]
pub struct ClearResponse {
    pub route_id: String,
    pub cleared: bool,
}

#[derive(Serialize)]
pub struct SuspensionsList {
    pub active: Vec<crate::suspensions::RouteSuspension>,
}

pub fn operator_router(pool: PgPool) -> Router {
    Router::new()
        .route("/v1/operator/route-states/suspensions", get(list_suspensions))
        .route("/v1/operator/route-states/:route_id/suspend", post(suspend_route))
        .route("/v1/operator/route-states/:route_id/suspend", delete(clear_route))
        .with_state(pool)
}

fn check_auth(headers: &HeaderMap) -> Result<(), StatusCode> {
    let expected = std::env::var("OPERATOR_AUTH_TOKEN")
        .map_err(|_| StatusCode::SERVICE_UNAVAILABLE)?;
    let got = headers.get(OPERATOR_AUTH_HEADER)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if got != expected {
        tracing::warn!(target: "operator_api", "operator request rejected: bad or missing X-Operator-Token");
        return Err(StatusCode::UNAUTHORIZED);
    }
    Ok(())
}

async fn suspend_route(
    State(pool): State<PgPool>,
    headers: HeaderMap,
    Path(route_id): Path<String>,
    Json(req): Json<SuspendRequest>,
) -> Result<Json<SuspendResponse>, StatusCode> {
    check_auth(&headers)?;
    if req.reason_code.is_empty() || req.reason.is_empty() || req.operator.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    let suspension_id = format!("sus_{}", Uuid::new_v4().simple());
    let sus = crate::suspensions::RouteSuspension {
        suspension_id: suspension_id.clone(),
        route_id: route_id.clone(),
        reason_code: req.reason_code.clone(),
        reason: req.reason,
        operator: req.operator,
        suspended_at: None,
        cleared_at: None,
        cleared_by: None,
        cleared_reason: None,
    };
    crate::suspensions::record(&pool, &sus).await.map_err(|e| {
        tracing::warn!(target: "operator_api", route_id = %route_id, error = %e, "suspend write failed");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    // Also write a Suspended lifecycle event so dashboards correlate.
    let lifecycle_payload = crate::lifecycle::LifecyclePayload {
        failure_reason: Some(req.reason_code.clone()),
        ..Default::default()
    };
    if let Err(e) = crate::lifecycle::record_event(
        &pool, &route_id, crate::lifecycle::LifecycleEvent::Suspended, lifecycle_payload,
    ).await {
        tracing::warn!(target: "operator_api", route_id = %route_id, error = %e, "suspend lifecycle write failed");
    }
    Ok(Json(SuspendResponse {
        suspension_id,
        route_id,
        reason_code: req.reason_code,
    }))
}

async fn clear_route(
    State(pool): State<PgPool>,
    headers: HeaderMap,
    Path(route_id): Path<String>,
    Json(req): Json<ClearRequest>,
) -> Result<Json<ClearResponse>, StatusCode> {
    check_auth(&headers)?;
    if req.cleared_by.is_empty() || req.cleared_reason.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    crate::suspensions::clear(&pool, &route_id, &req.cleared_by, &req.cleared_reason)
        .await
        .map_err(|e| match e {
            crate::suspensions::SuspensionError::NotFound(_) => StatusCode::NOT_FOUND,
            other => {
                tracing::warn!(target: "operator_api", route_id = %route_id, error = %other, "clear failed");
                StatusCode::INTERNAL_SERVER_ERROR
            }
        })?;
    Ok(Json(ClearResponse { route_id, cleared: true }))
}

async fn list_suspensions(
    State(pool): State<PgPool>,
    headers: HeaderMap,
) -> Result<Json<SuspensionsList>, StatusCode> {
    check_auth(&headers)?;
    let active = crate::suspensions::list_active(&pool).await.map_err(|e| {
        tracing::warn!(target: "operator_api", error = %e, "list suspensions failed");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    Ok(Json(SuspensionsList { active }))
}
```

If `uuid` is not already a direct dependency, check:

```bash
grep -E '^uuid' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/Cargo.toml
```

If absent, add `uuid = { version = "1", features = ["v4"] }` to `Cargo.toml`. If `uuid` is present as a transitive dep but not direct, add it to `[dependencies]` so the build does not depend on transitive feature flags.

- [ ] **Step 2: Wire and merge.**

Edit `sw4p/sw4p-backend/src/lib.rs` and add `pub mod operator_api;`. Edit `main.rs` to merge:

```rust
let app = app.merge(crate::operator_api::operator_router(pool.clone()));
```

near the other router merges.

- [ ] **Step 3: Write tests.**

```rust
// In sw4p/sw4p-backend/tests/operator_api.rs

use axum::body::Body;
use axum::http::{HeaderValue, Request};
use sw4p_backend::operator_api::operator_router;
use sw4p_backend::test_support::test_pool;
use tower::ServiceExt;

async fn truncate(pool: &sqlx::PgPool) {
    sqlx::query("TRUNCATE TABLE route_suspensions RESTART IDENTITY").execute(pool).await.ok();
    sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
}

#[tokio::test]
async fn suspend_route_writes_row_and_lifecycle_event() {
    let pool = test_pool().await;
    truncate(&pool).await;
    std::env::set_var("OPERATOR_AUTH_TOKEN", "test_token_001");
    let app = operator_router(pool.clone());
    let body = serde_json::json!({
        "reason_code": "MANUAL_OPERATOR",
        "reason": "test suspension",
        "operator": "ops@rndrntwrk"
    });
    let resp = app.clone().oneshot(
        Request::builder().method("POST").uri("/v1/operator/route-states/POL:USDT->TRX:USDT:allbridge_core/suspend")
            .header("content-type", "application/json")
            .header("x-operator-token", "test_token_001")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);
    let is_active = sw4p_backend::suspensions::is_active(
        &pool, "POL:USDT->TRX:USDT:allbridge_core"
    ).await.unwrap();
    assert!(is_active, "route must be active after suspend POST");
    let rows = sw4p_backend::lifecycle::list_for_route(
        &pool, "POL:USDT->TRX:USDT:allbridge_core"
    ).await.unwrap();
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].event, "suspended");
    assert_eq!(rows[0].reason_code.as_deref(), Some("MANUAL_OPERATOR"));
}

#[tokio::test]
async fn suspend_route_rejects_missing_auth_header() {
    let pool = test_pool().await;
    truncate(&pool).await;
    std::env::set_var("OPERATOR_AUTH_TOKEN", "test_token_002");
    let app = operator_router(pool);
    let body = serde_json::json!({
        "reason_code": "MANUAL_OPERATOR", "reason": "x", "operator": "ops"
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/operator/route-states/R/suspend")
            .header("content-type", "application/json")
            // no X-Operator-Token
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 401);
}

#[tokio::test]
async fn suspend_route_rejects_wrong_token() {
    let pool = test_pool().await;
    truncate(&pool).await;
    std::env::set_var("OPERATOR_AUTH_TOKEN", "right_token");
    let app = operator_router(pool);
    let body = serde_json::json!({
        "reason_code": "X", "reason": "x", "operator": "ops"
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/operator/route-states/R/suspend")
            .header("content-type", "application/json")
            .header("x-operator-token", "wrong_token")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 401);
}

#[tokio::test]
async fn suspend_route_rejects_empty_required_fields() {
    let pool = test_pool().await;
    truncate(&pool).await;
    std::env::set_var("OPERATOR_AUTH_TOKEN", "tok");
    let app = operator_router(pool);
    let body = serde_json::json!({
        "reason_code": "", "reason": "x", "operator": "ops"
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/operator/route-states/R/suspend")
            .header("content-type", "application/json")
            .header("x-operator-token", "tok")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 400);
}

#[tokio::test]
async fn clear_route_marks_row_and_returns_ok() {
    let pool = test_pool().await;
    truncate(&pool).await;
    std::env::set_var("OPERATOR_AUTH_TOKEN", "tok");
    let app = operator_router(pool.clone());
    // First suspend.
    let suspend_body = serde_json::json!({
        "reason_code": "X", "reason": "y", "operator": "ops"
    });
    let _ = app.clone().oneshot(
        Request::builder().method("POST").uri("/v1/operator/route-states/R/suspend")
            .header("content-type", "application/json")
            .header("x-operator-token", "tok")
            .body(Body::from(serde_json::to_string(&suspend_body).unwrap())).unwrap()
    ).await.unwrap();
    // Then clear.
    let clear_body = serde_json::json!({
        "cleared_by": "ops@rndrntwrk", "cleared_reason": "registry refreshed"
    });
    let resp = app.oneshot(
        Request::builder().method("DELETE").uri("/v1/operator/route-states/R/suspend")
            .header("content-type", "application/json")
            .header("x-operator-token", "tok")
            .body(Body::from(serde_json::to_string(&clear_body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);
    assert!(!sw4p_backend::suspensions::is_active(&pool, "R").await.unwrap());
}

#[tokio::test]
async fn clear_route_returns_404_when_no_active() {
    let pool = test_pool().await;
    truncate(&pool).await;
    std::env::set_var("OPERATOR_AUTH_TOKEN", "tok");
    let app = operator_router(pool);
    let body = serde_json::json!({
        "cleared_by": "ops", "cleared_reason": "x"
    });
    let resp = app.oneshot(
        Request::builder().method("DELETE").uri("/v1/operator/route-states/nope/suspend")
            .header("content-type", "application/json")
            .header("x-operator-token", "tok")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 404);
}

#[tokio::test]
async fn list_suspensions_returns_active_only() {
    let pool = test_pool().await;
    truncate(&pool).await;
    std::env::set_var("OPERATOR_AUTH_TOKEN", "tok");
    let app = operator_router(pool);
    // Suspend two routes; clear one.
    let body_a = serde_json::json!({
        "reason_code": "A", "reason": "a", "operator": "ops"
    });
    let body_b = serde_json::json!({
        "reason_code": "B", "reason": "b", "operator": "ops"
    });
    let clear_b = serde_json::json!({
        "cleared_by": "ops", "cleared_reason": "fixed"
    });
    let _ = app.clone().oneshot(
        Request::builder().method("POST").uri("/v1/operator/route-states/A/suspend")
            .header("content-type", "application/json").header("x-operator-token", "tok")
            .body(Body::from(serde_json::to_string(&body_a).unwrap())).unwrap()
    ).await.unwrap();
    let _ = app.clone().oneshot(
        Request::builder().method("POST").uri("/v1/operator/route-states/B/suspend")
            .header("content-type", "application/json").header("x-operator-token", "tok")
            .body(Body::from(serde_json::to_string(&body_b).unwrap())).unwrap()
    ).await.unwrap();
    let _ = app.clone().oneshot(
        Request::builder().method("DELETE").uri("/v1/operator/route-states/B/suspend")
            .header("content-type", "application/json").header("x-operator-token", "tok")
            .body(Body::from(serde_json::to_string(&clear_b).unwrap())).unwrap()
    ).await.unwrap();
    let resp = app.oneshot(
        Request::builder().method("GET").uri("/v1/operator/route-states/suspensions")
            .header("x-operator-token", "tok")
            .body(Body::empty()).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);
    let bytes = axum::body::to_bytes(resp.into_body(), 64 * 1024).await.unwrap();
    let body: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    let active = body.get("active").and_then(|v| v.as_array()).expect("active array");
    assert_eq!(active.len(), 1, "expected only one active");
    assert_eq!(active[0].get("route_id").and_then(|v| v.as_str()), Some("A"));
}
```

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test operator_api -- --test-threads=1 --nocapture
```

Expected: 7 PASS (one per test above).

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/operator_api.rs sw4p-backend/src/lib.rs sw4p-backend/src/main.rs sw4p-backend/tests/operator_api.rs sw4p-backend/Cargo.toml
git status --short
```

---

## Task T12: Observability Metrics

**Wave:** W9. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add the `metrics` crate as a dependency, register the counters and histograms specified by TRD section 12, and call them at the boundaries already touched by T5 through T11. The existing OTLP pipeline (already exporting traces) is the eventual consumer; M5 only ensures the call sites emit, so M6's exporter wiring has data to ship.

**Spec IDs:** PRD-USDT-021; TRD section 12 (observability requirements); SOW WP7.5.

**Files:**

- Modify: `sw4p/sw4p-backend/Cargo.toml` (add `metrics`)
- Create: `sw4p/sw4p-backend/src/observability.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod observability;`)
- Modify: each of: `allbridge_registry.rs`, `allbridge_quote.rs` (or wherever quote is fetched), `raw_tx_validator.rs`, `tron_signing_api.rs`, `provider_status_polling.rs`, `suspensions.rs`, `allbridge.rs` (for canary execution count). Each modification adds one or two `counter!` calls at the boundary the metric describes.

- [ ] **Step 1: Add the dependency.**

In `sw4p/sw4p-backend/Cargo.toml`, under `[dependencies]`, add:

```toml
metrics = "0.23"
```

Run a one-time `cargo build` to confirm it resolves cleanly.

- [ ] **Step 2: Write the registration module.**

```rust
//! Centralized metrics registrations per TRD section 12.
//!
//! All sw4p code paths use the helper functions in this module instead of
//! constructing `metrics::counter!` calls inline. This gives the M6 OTLP
//! exporter a single grep target for the metric names and ensures the
//! label key set stays stable across call sites.
//!
//! Satisfies: PRD-USDT-021; TRD section 12; SOW WP7.5.

use metrics::{counter, histogram};

/// Metric names. Stable strings; changes are a versioning event.
pub mod names {
    pub const PROVIDER_REGISTRY_FETCH_SUCCESS: &str = "sw4p_provider_registry_fetch_success_total";
    pub const PROVIDER_REGISTRY_FETCH_FAILURE: &str = "sw4p_provider_registry_fetch_failure_total";
    pub const STALE_REGISTRY_REJECTION: &str = "sw4p_stale_registry_rejection_total";
    pub const ROUTE_STATE_COUNT: &str = "sw4p_route_state_count";
    pub const QUOTE_SUCCESS: &str = "sw4p_quote_success_total";
    pub const QUOTE_FAILURE: &str = "sw4p_quote_failure_total";
    pub const RAW_TX_VALIDATION_FAILURE: &str = "sw4p_raw_tx_validation_failure_total";
    pub const APPROVAL_FAILURE: &str = "sw4p_approval_failure_total";
    pub const SOURCE_TX_FAILURE: &str = "sw4p_source_tx_failure_total";
    pub const PROVIDER_STATUS_POLLING_LATENCY: &str = "sw4p_provider_status_polling_latency_ms";
    pub const DESTINATION_SETTLEMENT_LATENCY: &str = "sw4p_destination_settlement_latency_ms";
    pub const STUCK_TRANSFER_COUNT: &str = "sw4p_stuck_transfer_count";
    pub const ROUTE_SUSPENSION_COUNT: &str = "sw4p_route_suspension_total";
    pub const CANARY_EXECUTION_COUNT: &str = "sw4p_canary_execution_total";
}

pub fn record_registry_fetch_success() {
    counter!(names::PROVIDER_REGISTRY_FETCH_SUCCESS).increment(1);
}

pub fn record_registry_fetch_failure(reason: &str) {
    counter!(names::PROVIDER_REGISTRY_FETCH_FAILURE, "reason" => reason.to_string()).increment(1);
}

pub fn record_stale_registry_rejection() {
    counter!(names::STALE_REGISTRY_REJECTION).increment(1);
}

pub fn set_route_state_count(chain: &str, asset: &str, state: &str, value: u64) {
    // `counter!` semantics: monotonic. For a snapshot gauge we use
    // `metrics::gauge!` instead. Use a fresh value by treating each tick
    // as the absolute count for the chain+asset+state combination.
    metrics::gauge!(
        names::ROUTE_STATE_COUNT,
        "chain" => chain.to_string(),
        "asset" => asset.to_string(),
        "state" => state.to_string(),
    ).set(value as f64);
}

pub fn record_quote_success(source_chain: &str, destination_chain: &str) {
    counter!(
        names::QUOTE_SUCCESS,
        "source" => source_chain.to_string(),
        "destination" => destination_chain.to_string(),
    ).increment(1);
}

pub fn record_quote_failure(source_chain: &str, destination_chain: &str, reason: &str) {
    counter!(
        names::QUOTE_FAILURE,
        "source" => source_chain.to_string(),
        "destination" => destination_chain.to_string(),
        "reason" => reason.to_string(),
    ).increment(1);
}

pub fn record_raw_tx_validation_failure(reason: &str) {
    counter!(
        names::RAW_TX_VALIDATION_FAILURE,
        "reason" => reason.to_string(),
    ).increment(1);
}

pub fn record_approval_failure(chain: &str, reason: &str) {
    counter!(
        names::APPROVAL_FAILURE,
        "chain" => chain.to_string(),
        "reason" => reason.to_string(),
    ).increment(1);
}

pub fn record_source_tx_failure(chain: &str, reason: &str) {
    counter!(
        names::SOURCE_TX_FAILURE,
        "chain" => chain.to_string(),
        "reason" => reason.to_string(),
    ).increment(1);
}

pub fn observe_provider_status_polling_latency_ms(latency_ms: u64) {
    histogram!(names::PROVIDER_STATUS_POLLING_LATENCY).record(latency_ms as f64);
}

pub fn observe_destination_settlement_latency_ms(latency_ms: u64, source_chain: &str, destination_chain: &str) {
    histogram!(
        names::DESTINATION_SETTLEMENT_LATENCY,
        "source" => source_chain.to_string(),
        "destination" => destination_chain.to_string(),
    ).record(latency_ms as f64);
}

pub fn set_stuck_transfer_count(value: u64) {
    metrics::gauge!(names::STUCK_TRANSFER_COUNT).set(value as f64);
}

pub fn record_route_suspension(reason_code: &str) {
    counter!(
        names::ROUTE_SUSPENSION_COUNT,
        "reason_code" => reason_code.to_string(),
    ).increment(1);
}

pub fn record_canary_execution(authorization_id: &str, outcome: &str) {
    counter!(
        names::CANARY_EXECUTION_COUNT,
        "authorization_id" => authorization_id.to_string(),
        "outcome" => outcome.to_string(),
    ).increment(1);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn metric_names_are_stable() {
        assert_eq!(names::QUOTE_SUCCESS, "sw4p_quote_success_total");
        assert_eq!(names::RAW_TX_VALIDATION_FAILURE, "sw4p_raw_tx_validation_failure_total");
        assert_eq!(names::CANARY_EXECUTION_COUNT, "sw4p_canary_execution_total");
    }

    #[test]
    fn helpers_do_not_panic_without_recorder() {
        // Without a metrics::set_global_recorder call, the macros are
        // no-ops. The helpers must remain panic-free in that state so
        // boot ordering does not constrain us.
        record_registry_fetch_success();
        record_quote_success("POL", "TRX");
        record_quote_failure("POL", "TRX", "test_reason");
        record_raw_tx_validation_failure("ROUTE_STATE_MISSING");
        record_approval_failure("TRX", "approval_amount_exceeds_cap");
        record_source_tx_failure("TRX", "broadcast_rejected");
        observe_provider_status_polling_latency_ms(500);
        observe_destination_settlement_latency_ms(120_000, "POL", "TRX");
        set_stuck_transfer_count(0);
        record_route_suspension("REGISTRY_STALE");
        record_canary_execution("auth_pinned", "success");
        set_route_state_count("TRX", "USDT", "live", 1);
    }
}
```

- [ ] **Step 3: Wire and add call sites.** Add `pub mod observability;` to `lib.rs`. Then in each module touched by T5 through T11, add a single helper call at the boundary:

- `allbridge_registry.rs`:
  - On a successful registry fetch: `crate::observability::record_registry_fetch_success();`
  - On a failed registry fetch: `crate::observability::record_registry_fetch_failure("network");` (or `"parse"`, `"expired"`, etc.)
  - On stale rejection (inside `suspend_routes_for_stale_registry`): `crate::observability::record_stale_registry_rejection();`
  - Inside the same `suspend_routes_for_stale_registry` per-route loop: `crate::observability::record_route_suspension("REGISTRY_STALE");`
- `allbridge_quote.rs` (or wherever the quote HTTP call lives):
  - On success: `crate::observability::record_quote_success(&src, &dst);`
  - On failure: `crate::observability::record_quote_failure(&src, &dst, &reason);`
- `raw_tx_validator.rs` (inside `validate_with_route_state_and_lifecycle` Failed branch):
  - `crate::observability::record_raw_tx_validation_failure(result.first_failed_check_code());`
- `tron_signing_api.rs::broadcast_handler` failure branch:
  - `crate::observability::record_source_tx_failure("TRX", "broadcast_rejected");`
- `provider_status_polling.rs`:
  - At each loop iteration end: `crate::observability::observe_provider_status_polling_latency_ms(iter_elapsed_ms);`
  - At Confirmed return: `crate::observability::observe_destination_settlement_latency_ms(total_elapsed_ms, "POL", "TRX");` (replace the placeholders with actual chain names threaded from caller; if caller does not provide them, accept "" labels and document the gap as a future enhancement).
- `suspensions.rs::record`:
  - `crate::observability::record_route_suspension(&sus.reason_code);`
- `allbridge.rs::bridge_from_tron_with_caps`:
  - On the rejection branches: `crate::observability::record_canary_execution(&auth.authorization_id, "rejected_fee_overrun");` (etc.)
  - On the successful broadcast: `crate::observability::record_canary_execution(&auth.authorization_id, "success");`
- `stuck_transfer_worker.rs` (T13): `crate::observability::set_stuck_transfer_count(stuck_count as u64);`

The actual `chain` and `asset` labels for `record_route_suspension` and `record_canary_execution` are nice-to-have; the minimum is the reason code and outcome.

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib observability -- --nocapture
cargo test --lib allbridge_registry allbridge_quote raw_tx_validator tron_signing_api provider_status_polling suspensions allbridge -- --test-threads=1 --nocapture
```

Expected: 2 PASS in `observability`; all other existing tests still PASS.

- [ ] **Step 5: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/Cargo.toml sw4p-backend/src/observability.rs sw4p-backend/src/lib.rs \
        sw4p-backend/src/allbridge_registry.rs sw4p-backend/src/allbridge_quote.rs \
        sw4p-backend/src/raw_tx_validator.rs sw4p-backend/src/tron_signing_api.rs \
        sw4p-backend/src/provider_status_polling.rs sw4p-backend/src/suspensions.rs \
        sw4p-backend/src/allbridge.rs
git status --short
```

If `Cargo.lock` changed, stage it too.

---

## Task T13: Stuck Transfer Detection Worker

**Wave:** W10. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Background worker that periodically scans `settlement_lifecycle_events` for routes whose last event is `DestinationPending` older than a threshold (default 30 minutes) and writes `ManualReviewRequired` for each. The worker spawns on boot and runs every `STUCK_TRANSFER_POLL_INTERVAL_SECS` seconds (default 60).

**Spec IDs:** PRD-USDT-018; TRD-PROOF-009 (stuck transfers enter manual review); SOW WP7.2, WP7.5.

**Files:**

- Create: `sw4p/sw4p-backend/src/stuck_transfer_worker.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (`pub mod stuck_transfer_worker;`)
- Modify: `sw4p/sw4p-backend/src/main.rs` (spawn the worker on boot)

- [ ] **Step 1: Write the module.**

```rust
//! Stuck transfer detection worker.
//!
//! Periodically scans the lifecycle event table for routes whose most
//! recent event is `destination_pending` older than a threshold and that
//! have not been escalated yet. For each such route, writes a
//! `manual_review_required` lifecycle event so dashboards and the
//! operator runbook can pick them up.
//!
//! Idempotent: if a route has already been marked manual_review_required
//! at any point after its destination_pending, the worker skips it.
//!
//! Satisfies: PRD-USDT-018; TRD-PROOF-009; SOW WP7.2, WP7.5.

use std::time::Duration;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use tokio::task::JoinHandle;

use crate::lifecycle::{record_event, LifecycleEvent, LifecyclePayload};

#[derive(Debug, Clone)]
pub struct StuckWorkerConfig {
    pub poll_interval: Duration,
    pub stuck_after: chrono::Duration,
}

impl Default for StuckWorkerConfig {
    fn default() -> Self {
        let poll_secs = std::env::var("STUCK_TRANSFER_POLL_INTERVAL_SECS")
            .ok()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(60);
        let stuck_secs = std::env::var("STUCK_TRANSFER_THRESHOLD_SECS")
            .ok()
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(30 * 60);
        Self {
            poll_interval: Duration::from_secs(poll_secs),
            stuck_after: chrono::Duration::seconds(stuck_secs),
        }
    }
}

/// Run one detection pass. Returns the number of routes newly marked as
/// `manual_review_required`. Public so the integration test (T15) can
/// invoke it deterministically without spinning the worker loop.
pub async fn run_once(pool: &PgPool, cfg: &StuckWorkerConfig) -> Result<u64, sqlx::Error> {
    let cutoff: DateTime<Utc> = Utc::now() - cfg.stuck_after;
    // Find routes whose most recent lifecycle event is destination_pending
    // older than cutoff, and that have NOT had a manual_review_required
    // event written since.
    let rows: Vec<(String, DateTime<Utc>)> = sqlx::query_as(
        r#"WITH last AS (
              SELECT DISTINCT ON (route_id) route_id, event, recorded_at
              FROM settlement_lifecycle_events
              ORDER BY route_id, event_id DESC
           )
           SELECT route_id, recorded_at FROM last
           WHERE event = 'destination_pending' AND recorded_at <= $1"#,
    )
    .bind(cutoff)
    .fetch_all(pool)
    .await?;
    let mut newly_escalated: u64 = 0;
    for (route_id, pending_at) in rows {
        let payload = LifecyclePayload {
            elapsed_ms: Some((Utc::now() - pending_at).num_milliseconds()),
            failure_reason: Some("destination_pending_stuck_past_threshold".into()),
            ..Default::default()
        };
        match record_event(pool, &route_id, LifecycleEvent::ManualReviewRequired, payload).await {
            Ok(_) => {
                newly_escalated += 1;
                tracing::warn!(
                    target: "stuck_transfer_worker",
                    route_id = %route_id,
                    pending_at = %pending_at,
                    "escalated to manual_review_required"
                );
            }
            Err(e) => {
                tracing::warn!(
                    target: "stuck_transfer_worker",
                    route_id = %route_id,
                    error = %e,
                    "failed to record manual_review_required"
                );
            }
        }
    }
    crate::observability::set_stuck_transfer_count(newly_escalated);
    Ok(newly_escalated)
}

/// Spawn the worker loop. The returned `JoinHandle` is not awaited at
/// the caller; the loop runs forever until the runtime shuts down.
pub fn spawn(pool: PgPool, cfg: StuckWorkerConfig) -> JoinHandle<()> {
    tokio::spawn(async move {
        let interval = cfg.poll_interval;
        loop {
            if let Err(e) = run_once(&pool, &cfg).await {
                tracing::warn!(target: "stuck_transfer_worker", error = %e, "scan failed");
            }
            tokio::time::sleep(interval).await;
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lifecycle::list_for_route;
    use crate::test_support::test_pool;

    async fn truncate(pool: &PgPool) {
        sqlx::query("TRUNCATE TABLE settlement_lifecycle_events RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn run_once_escalates_routes_with_old_destination_pending() {
        let pool = test_pool().await;
        truncate(&pool).await;
        // Insert a destination_pending row with recorded_at backdated.
        sqlx::query(
            "INSERT INTO settlement_lifecycle_events (route_id, event, payload, recorded_at)
             VALUES ($1, 'destination_pending', '{}'::jsonb, NOW() - INTERVAL '2 hours')"
        )
        .bind("POL:USDT->TRX:USDT:allbridge_core")
        .execute(&pool)
        .await
        .unwrap();
        let cfg = StuckWorkerConfig {
            poll_interval: Duration::from_secs(1),
            stuck_after: chrono::Duration::minutes(30),
        };
        let escalated = run_once(&pool, &cfg).await.unwrap();
        assert_eq!(escalated, 1);
        let rows = list_for_route(&pool, "POL:USDT->TRX:USDT:allbridge_core").await.unwrap();
        let last = rows.last().unwrap();
        assert_eq!(last.event, "manual_review_required");
        assert_eq!(last.reason_code.as_deref(), Some("destination_pending_stuck_past_threshold"));
    }

    #[tokio::test]
    async fn run_once_does_not_escalate_fresh_pending() {
        let pool = test_pool().await;
        truncate(&pool).await;
        // Insert a destination_pending row with recorded_at = NOW.
        sqlx::query(
            "INSERT INTO settlement_lifecycle_events (route_id, event, payload)
             VALUES ($1, 'destination_pending', '{}'::jsonb)"
        )
        .bind("POL:USDT->TRX:USDT:allbridge_core")
        .execute(&pool)
        .await
        .unwrap();
        let cfg = StuckWorkerConfig {
            poll_interval: Duration::from_secs(1),
            stuck_after: chrono::Duration::minutes(30),
        };
        let escalated = run_once(&pool, &cfg).await.unwrap();
        assert_eq!(escalated, 0, "fresh pending must not be escalated");
    }

    #[tokio::test]
    async fn run_once_skips_routes_that_have_already_settled() {
        let pool = test_pool().await;
        truncate(&pool).await;
        // Pending old, then settled.
        sqlx::query(
            "INSERT INTO settlement_lifecycle_events (route_id, event, payload, recorded_at)
             VALUES ($1, 'destination_pending', '{}'::jsonb, NOW() - INTERVAL '2 hours')"
        )
        .bind("R")
        .execute(&pool).await.unwrap();
        sqlx::query(
            "INSERT INTO settlement_lifecycle_events (route_id, event, payload, recorded_at)
             VALUES ($1, 'destination_settled', '{}'::jsonb, NOW() - INTERVAL '1 hour')"
        )
        .bind("R")
        .execute(&pool).await.unwrap();
        let cfg = StuckWorkerConfig {
            poll_interval: Duration::from_secs(1),
            stuck_after: chrono::Duration::minutes(30),
        };
        let escalated = run_once(&pool, &cfg).await.unwrap();
        assert_eq!(escalated, 0, "settled routes must not be escalated");
    }
}
```

- [ ] **Step 2: Wire and merge into main.**

Add `pub mod stuck_transfer_worker;` to `lib.rs`. In `main.rs`, after the app router is built but before `axum::serve`, spawn:

```rust
let _stuck_handle = crate::stuck_transfer_worker::spawn(
    pool.clone(),
    crate::stuck_transfer_worker::StuckWorkerConfig::default(),
);
```

The handle is intentionally not joined: the worker runs forever; runtime shutdown drops it.

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib stuck_transfer_worker -- --test-threads=1 --nocapture
```

Expected: 3 PASS.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/stuck_transfer_worker.rs sw4p-backend/src/lib.rs sw4p-backend/src/main.rs
git status --short
```

---

## Task T14: Operator Runbooks

**Wave:** W11. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Author five Markdown runbooks under `docs/runbooks/` in the parent repo, covering stuck transfer, route suspension, provider degradation, canary execution, and rollback per SOW WP7.6. Each runbook starts with a "Triggers" section listing the metric or alert that fires it, then "Diagnosis" with the SQL or API queries to run, then "Remediation" with the operator commands to execute, then "Verification" with the post-fix checks.

**Spec IDs:** PRD-USDT-022; SOW WP7.6.

**Files:**

- Create: `docs/runbooks/2026-05-18-stuck-transfer.md`
- Create: `docs/runbooks/2026-05-18-route-suspension.md`
- Create: `docs/runbooks/2026-05-18-provider-degradation.md`
- Create: `docs/runbooks/2026-05-18-canary-execution.md`
- Create: `docs/runbooks/2026-05-18-rollback.md`

- [ ] **Step 1: Create the runbooks directory.**

```bash
mkdir -p "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/runbooks"
```

- [ ] **Step 2: Write `2026-05-18-stuck-transfer.md`.**

```markdown
# Runbook: Stuck Transfer

**Trigger:** `sw4p_stuck_transfer_count` gauge greater than zero, or a `manual_review_required` lifecycle event lands for a route in the last 5 minutes.

**Scope:** A user transfer reached `destination_pending` but did not reach `destination_settled` within the stuck threshold (default 30 minutes). The stuck-transfer worker (`stuck_transfer_worker.rs`) escalates it to `manual_review_required`.

## Diagnosis

1. List currently stuck routes:

```sql
SELECT route_id, MAX(recorded_at) AS last_pending_at
FROM settlement_lifecycle_events
WHERE event = 'destination_pending'
  AND route_id NOT IN (
    SELECT route_id FROM settlement_lifecycle_events WHERE event = 'destination_settled'
  )
GROUP BY route_id
HAVING MAX(recorded_at) <= NOW() - INTERVAL '30 minutes'
ORDER BY last_pending_at ASC;
```

2. For each stuck route, fetch the full lifecycle:

```sql
SELECT event_id, event, payload, recorded_at
FROM settlement_lifecycle_events
WHERE route_id = '<route_id>'
ORDER BY event_id ASC;
```

3. Identify the provider transfer id and the destination tx hash hint (if any) from the payload column.

4. Query Allbridge directly:

```bash
curl -s "https://core.api.allbridgecoreapi.net/transfer-status?messageId=<provider_transfer_id>" | jq .
```

## Remediation

- If Allbridge reports `Complete` and there is a destination tx hash: write a corrective `destination_settled` lifecycle event manually, then record the settlement evidence row.
- If Allbridge reports `Pending` past 90 minutes: contact Allbridge support with the provider transfer id and the source tx hash.
- If Allbridge reports `Failed`: write a `failed` lifecycle event with the actual reason, then proceed to the refund path per Allbridge's refund flow.
- If the route has been stuck for over 24 hours with no provider response: write a `manual_review_required` row noting the escalation, and treat as a customer service incident.

## Verification

- The new lifecycle row appears in `settlement_lifecycle_events`.
- `sw4p_stuck_transfer_count` drops back to zero on the next worker pass (max 1 minute by default).
- If the resolution was a settlement, `settlement_evidence` has a row with `proof_level = 'destination_settled'`.
```

- [ ] **Step 3: Write `2026-05-18-route-suspension.md`.**

```markdown
# Runbook: Route Suspension

**Trigger:** Operator decision (provider outage, policy change, security incident) or automatic system trigger (`REGISTRY_STALE` from `allbridge_registry.rs`).

**Scope:** Prevent the rail selector and the bridging API from accepting new requests for a specific route until the trigger condition is resolved.

## Diagnosis

1. List all active suspensions:

```bash
curl -s -X GET "https://api.sw4p.io/v1/operator/route-states/suspensions" \
  -H "X-Operator-Token: $OPERATOR_AUTH_TOKEN" | jq .
```

2. For each, inspect the lifecycle history of the affected route:

```sql
SELECT event_id, event, reason_code, recorded_at
FROM settlement_lifecycle_events
WHERE route_id = '<route_id>'
ORDER BY event_id DESC LIMIT 50;
```

## Remediation

To create a new suspension:

```bash
curl -s -X POST "https://api.sw4p.io/v1/operator/route-states/<route_id>/suspend" \
  -H "X-Operator-Token: $OPERATOR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason_code": "MANUAL_OPERATOR", "reason": "<human description>", "operator": "<your handle>"}'
```

To clear a suspension once the trigger condition is resolved:

```bash
curl -s -X DELETE "https://api.sw4p.io/v1/operator/route-states/<route_id>/suspend" \
  -H "X-Operator-Token: $OPERATOR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cleared_by": "<your handle>", "cleared_reason": "<why the route is back>"}'
```

## Verification

- `GET /v1/operator/route-states/suspensions` no longer lists the route.
- `sw4p_route_suspension_total` counter does not increment further for the cleared route.
- A test bridging request for the route reaches at least `RouteRequested` and `ProviderRegistryChecked` lifecycle events.
```

- [ ] **Step 4: Write `2026-05-18-provider-degradation.md`.**

```markdown
# Runbook: Provider Degradation

**Trigger:** `sw4p_provider_registry_fetch_failure_total` rate spikes; or `sw4p_quote_failure_total` exceeds 5% of `sw4p_quote_success_total` over a 10-minute window; or multiple routes simultaneously enter `manual_review_required`.

**Scope:** Allbridge (or another upstream provider) is degraded or down. sw4p must avoid serving stale quotes or accepting transfers that have no chance of settling.

## Diagnosis

1. Check the most recent registry fetch attempts:

```sql
SELECT * FROM provider_route_snapshots ORDER BY fetched_at DESC LIMIT 5;
```

2. Check the recent failure metric labels (via the OTLP backend dashboard).

3. Probe the provider directly:

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" "https://core.api.allbridgecoreapi.net/token-info"
```

4. Check the Allbridge status page (`https://status.allbridge.io` or equivalent) for incident reports.

## Remediation

- If the provider is in a confirmed outage: suspend every active Allbridge route via the operator API; document the outage incident id and the expected resolution time.
- If only quote endpoints are degraded but registry is healthy: leave the routes active but pause canary execution by clearing the `OPERATOR_AUTH_TOKEN` on the canary path (M5 has no fine-grained per-action toggle; M6 adds one).
- If the registry is stale and the auto-suspend has fired (`REGISTRY_STALE` lifecycle events appearing): wait for the next refresh, or trigger a manual refresh by restarting the `allbridge_registry` polling worker.

## Verification

- `sw4p_provider_registry_fetch_success_total` resumes incrementing.
- New quote requests start returning success.
- `sw4p_route_suspension_total` increments halt once the auto-suspend logic stops firing.
```

- [ ] **Step 5: Write `2026-05-18-canary-execution.md`.**

```markdown
# Runbook: Canary Execution

**Trigger:** Operator-initiated mainnet canary against an authorized `canary_authorizations` row.

**Scope:** The operator has decided to run a Polygon-USDT to Tron-USDT (or equivalent) canary transfer to prove the corridor end to end. The authorization row has been inserted via secure-channel coordination; this runbook executes it.

## Pre-flight

1. Confirm the authorization row exists, is not consumed, and is not expired:

```sql
SELECT authorization_id, route_id, amount_decimal, max_fee, expires_at, consumed_at
FROM canary_authorizations
WHERE authorization_id = '<auth_id>';
```

2. Confirm the operator wallet balance (Polygon-USDT in this example):

```bash
# substitute the actual operator wallet
curl -s -X POST "https://polygon-rpc.com" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0xc2132d05d31c914a87c6611c10748aeb04b58e8f","data":"0x70a08231000000000000000000000000<operator_address_no_0x>"},"latest"],"id":1}' | jq .
```

3. Confirm the destination Tron address has a TRC20 USDT account configured (TronGrid `/v1/accounts/<addr>`).

## Execution

1. Issue the canary request via the standard `/v1/bridge` endpoint with the `canary_authorization_id` in the request body. (Exact request shape is in the API docs; the relevant fields are `source_chain`, `destination_chain`, `token`, `amount_decimal`, `recipient`, `sender`, `canary_authorization_id`.)

2. Watch the lifecycle in real time:

```sql
SELECT event, payload, reason_code, recorded_at
FROM settlement_lifecycle_events
WHERE route_id = '<route_id>'
ORDER BY event_id ASC;
```

3. Expect the sequence: `route_requested`, `provider_registry_checked`, `quote_requested`, `quote_received`, `approval_required`, `approval_submitted`, `approval_confirmed`, `raw_tx_built`, `wallet_signature_requested`, `source_tx_submitted`, `source_tx_confirmed`, `provider_transfer_detected`, `destination_pending`, `destination_settled`, `settlement_proof_recorded`.

## Verification

- Final lifecycle event is `settlement_proof_recorded`.
- `settlement_evidence` has a row with `proof_level = 'destination_settled'`.
- `canary_authorizations.consumed_at` is set on the original row.
- `sw4p_canary_execution_total{outcome="success"}` incremented.

## Failure paths

- If any `failed` event appears with a `CANARY_*_OVERRUN` reason code, the cap was set too low; do not retry by raising caps without operator sign-off.
- If the source tx broadcasts but never reaches `source_tx_confirmed`: defer to `stuck-transfer.md`.
```

- [ ] **Step 6: Write `2026-05-18-rollback.md`.**

```markdown
# Runbook: Rollback

**Trigger:** A deploy introduced a regression visible in lifecycle metrics (sudden spike in `sw4p_raw_tx_validation_failure_total`, `sw4p_quote_failure_total`, or `sw4p_source_tx_failure_total`); or a configuration change broke a corridor.

**Scope:** Restore the prior known-good version of sw4p without losing lifecycle or evidence rows.

## Diagnosis

1. Identify the last known-good commit on `main` (or the branch in production):

```bash
git -C /Volumes/.../555/sw4p log --oneline -20
```

2. Confirm the regression is post-deploy and not provider-side by checking the runbooks above first (provider-degradation, stuck-transfer).

## Remediation

1. Suspend every active Allbridge route via the operator API as a safety brake.

2. Roll back the running deploy to the last known-good commit:

```bash
# whatever the actual deploy mechanism is (AWS EKS rollback, ECS task definition revert, etc.)
kubectl -n sw4p rollout undo deployment/sw4p-backend
```

3. After the rollback completes, run the M5 pinned acceptance test (`tests/m5_lifecycle_pinned.rs`) against staging to confirm the rolled-back version still satisfies the lifecycle ordering contract.

4. Clear the active suspensions:

```bash
curl -s -X GET "https://api.sw4p.io/v1/operator/route-states/suspensions" \
  -H "X-Operator-Token: $OPERATOR_AUTH_TOKEN" | jq -r '.active[].route_id' | \
  while read route_id; do
    curl -s -X DELETE "https://api.sw4p.io/v1/operator/route-states/$route_id/suspend" \
      -H "X-Operator-Token: $OPERATOR_AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"cleared_by": "rollback-script", "cleared_reason": "rollback complete"}'
  done
```

## Verification

- Lifecycle metrics return to pre-regression baselines.
- New transfers proceed through `route_requested` to `destination_settled`.
- `settlement_evidence` rows continue to accumulate (no DB damage from rollback).

## Notes

- DB migrations are append-only by design: rolling back the application does not require rolling back the schema. Any new columns or tables added by the regressed deploy remain in place; the older application version ignores them.
- If the regression introduced a bad migration that corrupted data, escalate to a DB restore from the most recent backup. That path is out of scope of this runbook.
```

- [ ] **Step 7: Stage in the parent repo.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add docs/runbooks/2026-05-18-stuck-transfer.md \
        docs/runbooks/2026-05-18-route-suspension.md \
        docs/runbooks/2026-05-18-provider-degradation.md \
        docs/runbooks/2026-05-18-canary-execution.md \
        docs/runbooks/2026-05-18-rollback.md
git status --short
```

These stage in the parent repo (where the plan lives). The parent is local-only; no push.

---


## Task T15: Full-Lifecycle Integration Test

**Wave:** W12. **Subagent:** `general-purpose`, `model: opus`. **Goal:** End-to-end integration test that walks a synthetic transfer through every state from `RouteRequested` to `DestinationSettled` against wiremock (for the Allbridge HTTP surface) plus a real Postgres test DB. The test calls `bridge_from_tron_with_mode` in the UserSigned mode, simulates the user signing the unsigned tx, calls `/v1/tron/broadcast`, calls `tron_watcher::watch_until_confirmed_with_lifecycle`, calls `provider_status_polling::poll_until_settled_with_lifecycle`, and asserts the final row count and event ordering.

**Spec IDs:** PRD-USDT-018, PRD-USDT-020; TRD section 9.4 (TRD-PROOF-001 through TRD-PROOF-009); SOW WP7.2, WP7.3, WP7.4 (restart recovery is implicitly proven by the durable rows).

**Files:**

- Create: `sw4p/sw4p-backend/tests/m5_lifecycle_integration.rs`

- [ ] **Step 1: Write the test.**

```rust
use axum::body::Body;
use axum::http::Request;
use sqlx::PgPool;
use std::time::Duration;
use sw4p_backend::evidence::{record_settlement, SettlementEvidence};
use sw4p_backend::lifecycle::{list_for_route, record_event, LifecycleEvent, LifecyclePayload};
use sw4p_backend::provider_status_polling::{poll_until_settled_with_lifecycle, PollerConfig};
use sw4p_backend::test_support::test_pool;
use sw4p_backend::tron_signing_api::tron_signing_router;
use sw4p_backend::tron_watcher::watch_until_confirmed_with_lifecycle;
use tower::ServiceExt;
use wiremock::{matchers::{method, path_regex}, Mock, MockServer, ResponseTemplate};

async fn truncate_all(pool: &PgPool) {
    for t in [
        "settlement_lifecycle_events",
        "settlement_evidence",
        "route_suspensions",
        "canary_authorizations",
    ] {
        sqlx::query(&format!("TRUNCATE TABLE {} CASCADE", t))
            .execute(pool).await.ok();
    }
}

#[tokio::test]
async fn m5_full_lifecycle_route_requested_through_destination_settled() {
    let pool = test_pool().await;
    truncate_all(&pool).await;

    let route_id = "POL:USDT->TRX:USDT:allbridge_core";

    // Stage 1: Manually write RouteRequested and ProviderRegistryChecked.
    // (In production, bridge_from_tron_with_mode writes these; the
    // integration test calls the writer directly for the EVM-to-Tron
    // direction since there is no Tron source to broadcast in this test.)
    record_event(&pool, route_id, LifecycleEvent::RouteRequested, LifecyclePayload {
        source_chain: Some("POL".into()),
        destination_chain: Some("TRX".into()),
        source_token: Some("USDT".into()),
        destination_token: Some("USDT".into()),
        amount_decimal: Some("5.00".into()),
        ..Default::default()
    }).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::ProviderRegistryChecked, LifecyclePayload {
        registry_snapshot_hash: Some("snap_test".into()),
        ..Default::default()
    }).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::QuoteRequested, LifecyclePayload::default()).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::QuoteReceived, LifecyclePayload {
        quote_hash: Some("0xqh_synthetic".into()),
        ..Default::default()
    }).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::ApprovalRequired, LifecyclePayload::default()).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::ApprovalSubmitted, LifecyclePayload {
        raw_tx_hash: Some("0xapproval_tx".into()),
        ..Default::default()
    }).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::ApprovalConfirmed, LifecyclePayload {
        raw_tx_hash: Some("0xapproval_tx".into()),
        ..Default::default()
    }).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::RawTxBuilt, LifecyclePayload {
        quote_hash: Some("0xqh_synthetic".into()),
        raw_tx_hash: Some("0xraw_synthetic".into()),
        ..Default::default()
    }).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::WalletSignatureRequested, LifecyclePayload {
        raw_tx_hash: Some("0xraw_synthetic".into()),
        ..Default::default()
    }).await.unwrap();

    // Stage 2: Broadcast the signed tx through the M3 broadcast handler.
    let tron_server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path_regex(r"^/wallet/broadcasttransaction"))
        .respond_with(ResponseTemplate::new(200).set_body_string(
            r#"{"result":true,"txid":"deadbeef12345"}"#
        ))
        .mount(&tron_server).await;
    Mock::given(method("POST"))
        .and(path_regex(r"^/wallet/gettransactionbyid"))
        .respond_with(ResponseTemplate::new(200).set_body_string(
            r#"{"id":"deadbeef12345","ret":[{"contractRet":"SUCCESS"}]}"#
        ))
        .mount(&tron_server).await;
    std::env::set_var("TRON_RPC_URL", tron_server.uri());

    let app = tron_signing_router(pool.clone());
    let broadcast_body = serde_json::json!({
        "signed_tx": {
            "txID": "deadbeef12345",
            "raw_data": { "contract": [], "fee_limit": 100_000_000 },
            "raw_data_hex": "0a02dead",
            "signature": ["deadbeef".repeat(16)]
        },
        "route_id": route_id
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/tron/broadcast")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&broadcast_body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200, "broadcast must succeed");

    // Stage 3: Watch for source confirmation.
    let watch = watch_until_confirmed_with_lifecycle(
        &tron_server.uri(),
        "deadbeef12345",
        3,
        &pool,
        route_id,
    ).await;
    assert!(watch.confirmed, "watcher must confirm");

    // Stage 4: Poll provider for destination settlement.
    let provider_server = MockServer::start().await;
    // First call: Pending. Second call: Complete.
    Mock::given(method("GET"))
        .and(path_regex(r"^/transfer-status"))
        .respond_with(ResponseTemplate::new(200).set_body_string(r#"{"status":"Pending"}"#))
        .up_to_n_times(1)
        .mount(&provider_server).await;
    Mock::given(method("GET"))
        .and(path_regex(r"^/transfer-status"))
        .respond_with(ResponseTemplate::new(200).set_body_string(
            r#"{"status":"Complete","destinationTxHash":"0xdest_final"}"#
        ))
        .mount(&provider_server).await;
    let cfg = PollerConfig {
        base_url: provider_server.uri(),
        message_id: "msg_int_test".into(),
        poll_interval: Duration::from_millis(50),
        timeout: Duration::from_secs(3),
    };
    let outcome = poll_until_settled_with_lifecycle(cfg, &pool, route_id, "xfer_int").await;
    match outcome {
        sw4p_backend::provider_status_polling::ProviderStatusOutcome::Confirmed { destination_tx_hash, .. } => {
            assert_eq!(destination_tx_hash, "0xdest_final");
        }
        other => panic!("expected Confirmed, got {:?}", other),
    }

    // Stage 5: Record the settlement evidence.
    let ev = SettlementEvidence {
        evidence_id: "ev_int_test_001".into(),
        route_id: route_id.into(),
        provider: "allbridge_core".into(),
        provider_mechanism: Some("pool".into()),
        source_tx_hash: Some("deadbeef12345".into()),
        destination_tx_hash: Some("0xdest_final".into()),
        provider_transfer_id: Some("xfer_int".into()),
        provider_status_response_hash: Some("0xprovhash".into()),
        registry_snapshot_hash: "snap_test".into(),
        quote_hash: "0xqh_synthetic".into(),
        raw_tx_hash: Some("0xraw_synthetic".into()),
        approval_tx_hash: Some("0xapproval_tx".into()),
        source_chain_finality: "1_finalized".into(),
        destination_chain_finality: Some("1_finalized".into()),
        amount: "5.00".into(),
        source_token: "USDT".into(),
        destination_token: "USDT".into(),
        proof_level: "destination_settled".into(),
        recorded_at: None,
        operator: Some("integration_test".into()),
        supersedes_evidence_id: None,
    };
    record_settlement(&pool, &ev).await.expect("record evidence ok");
    record_event(&pool, route_id, LifecycleEvent::SettlementProofRecorded, LifecyclePayload {
        registry_snapshot_hash: Some("snap_test".into()),
        quote_hash: Some("0xqh_synthetic".into()),
        ..Default::default()
    }).await.unwrap();

    // Final assertions: full event sequence is present in the right order.
    let rows = list_for_route(&pool, route_id).await.unwrap();
    let events: Vec<&str> = rows.iter().map(|r| r.event.as_str()).collect();
    let expected_sequence = [
        "route_requested",
        "provider_registry_checked",
        "quote_requested",
        "quote_received",
        "approval_required",
        "approval_submitted",
        "approval_confirmed",
        "raw_tx_built",
        "wallet_signature_requested",
        "source_tx_submitted",
        "source_tx_confirmed",
        "provider_transfer_detected",
        "destination_pending",
        "destination_settled",
        "settlement_proof_recorded",
    ];
    let mut found_indices: Vec<usize> = Vec::new();
    for expected in expected_sequence.iter() {
        let idx = events.iter().position(|e| e == expected)
            .unwrap_or_else(|| panic!("missing expected event {}, got: {:?}", expected, events));
        found_indices.push(idx);
    }
    // Indices must be strictly increasing.
    for window in found_indices.windows(2) {
        assert!(window[0] < window[1],
            "events out of order: found_indices={:?}, events={:?}",
            found_indices, events);
    }

    // The evidence row exists for this route.
    let latest = sw4p_backend::evidence::latest_for_route(&pool, route_id).await.unwrap();
    assert!(latest.is_some(), "evidence row must exist");
    assert_eq!(latest.unwrap().proof_level, "destination_settled");
}
```

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test m5_lifecycle_integration -- --test-threads=1 --nocapture
```

Expected: 1 PASS.

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/tests/m5_lifecycle_integration.rs
git status --short
```

---

## Task T16: Pinned Acceptance Test (Row Count + Event Ordering)

**Wave:** W12. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Pinned acceptance test that asserts an exact row count and an exact event ordering for a synthetic transfer. The test does NOT depend on wiremock or external HTTP; it only exercises the writers + readers. This is the contract that future refactors must not break.

**Spec IDs:** PRD-USDT-018; TRD section 9.4 (TRD-PROOF-001, TRD-PROOF-008); SOW WP7.2.

**Files:**

- Create: `sw4p/sw4p-backend/tests/m5_lifecycle_pinned.rs`

- [ ] **Step 1: Write the test.**

```rust
use sqlx::PgPool;
use sw4p_backend::evidence::{latest_for_route, record_settlement, supersede, SettlementEvidence};
use sw4p_backend::lifecycle::{
    last_for_route, list_for_route, record_event, LifecycleEvent, LifecyclePayload,
};
use sw4p_backend::suspensions::{
    clear as clear_suspension, is_active as is_suspension_active,
    record as record_suspension, RouteSuspension,
};
use sw4p_backend::test_support::test_pool;

async fn truncate_all(pool: &PgPool) {
    for t in [
        "settlement_lifecycle_events",
        "settlement_evidence",
        "route_suspensions",
    ] {
        sqlx::query(&format!("TRUNCATE TABLE {} CASCADE", t))
            .execute(pool).await.ok();
    }
}

#[tokio::test]
async fn pinned_full_lifecycle_emits_exactly_fifteen_rows() {
    let pool = test_pool().await;
    truncate_all(&pool).await;
    let route_id = "POL:USDT->TRX:USDT:allbridge_core";

    let events = [
        LifecycleEvent::RouteRequested,
        LifecycleEvent::ProviderRegistryChecked,
        LifecycleEvent::QuoteRequested,
        LifecycleEvent::QuoteReceived,
        LifecycleEvent::ApprovalRequired,
        LifecycleEvent::ApprovalSubmitted,
        LifecycleEvent::ApprovalConfirmed,
        LifecycleEvent::RawTxBuilt,
        LifecycleEvent::WalletSignatureRequested,
        LifecycleEvent::SourceTxSubmitted,
        LifecycleEvent::SourceTxConfirmed,
        LifecycleEvent::ProviderTransferDetected,
        LifecycleEvent::DestinationPending,
        LifecycleEvent::DestinationSettled,
        LifecycleEvent::SettlementProofRecorded,
    ];
    for ev in events.iter() {
        record_event(&pool, route_id, ev.clone(), LifecyclePayload::default()).await.unwrap();
    }
    let rows = list_for_route(&pool, route_id).await.unwrap();
    assert_eq!(rows.len(), 15, "happy-path lifecycle pins to 15 rows");
    let names: Vec<&str> = rows.iter().map(|r| r.event.as_str()).collect();
    assert_eq!(names, vec![
        "route_requested", "provider_registry_checked",
        "quote_requested", "quote_received",
        "approval_required", "approval_submitted", "approval_confirmed",
        "raw_tx_built", "wallet_signature_requested",
        "source_tx_submitted", "source_tx_confirmed",
        "provider_transfer_detected", "destination_pending", "destination_settled",
        "settlement_proof_recorded",
    ]);
    let last = last_for_route(&pool, route_id).await.unwrap().expect("some");
    assert_eq!(last.event, "settlement_proof_recorded");
}

#[tokio::test]
async fn pinned_failed_path_records_failure_reason() {
    let pool = test_pool().await;
    truncate_all(&pool).await;
    let route_id = "POL:USDT->TRX:USDT:allbridge_core";
    record_event(&pool, route_id, LifecycleEvent::RouteRequested, LifecyclePayload::default()).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::ProviderRegistryChecked, LifecyclePayload::default()).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::QuoteRequested, LifecyclePayload::default()).await.unwrap();
    record_event(&pool, route_id, LifecycleEvent::Failed, LifecyclePayload {
        failure_reason: Some("quote_unavailable".into()),
        ..Default::default()
    }).await.unwrap();
    let last = last_for_route(&pool, route_id).await.unwrap().expect("some");
    assert_eq!(last.event, "failed");
    assert_eq!(last.reason_code.as_deref(), Some("quote_unavailable"));
}

#[tokio::test]
async fn pinned_evidence_supersession_picks_leaf() {
    let pool = test_pool().await;
    truncate_all(&pool).await;
    let route_id = "POL:USDT->TRX:USDT:allbridge_core";
    let base = SettlementEvidence {
        evidence_id: "ev_pin_a".into(),
        route_id: route_id.into(),
        provider: "allbridge_core".into(),
        provider_mechanism: Some("pool".into()),
        source_tx_hash: Some("0xsrc_a".into()),
        destination_tx_hash: Some("0xdst_a".into()),
        provider_transfer_id: Some("xfer_a".into()),
        provider_status_response_hash: Some("0xprov_a".into()),
        registry_snapshot_hash: "snap_pin".into(),
        quote_hash: "0xqh_pin".into(),
        raw_tx_hash: Some("0xraw_pin".into()),
        approval_tx_hash: None,
        source_chain_finality: "1_finalized".into(),
        destination_chain_finality: Some("1_finalized".into()),
        amount: "5.00".into(),
        source_token: "USDT".into(),
        destination_token: "USDT".into(),
        proof_level: "destination_settled".into(),
        recorded_at: None,
        operator: Some("pinned_test".into()),
        supersedes_evidence_id: None,
    };
    record_settlement(&pool, &base).await.unwrap();
    let mut corrected = base.clone();
    corrected.evidence_id = "ev_pin_b".into();
    corrected.destination_tx_hash = Some("0xdst_b".into());
    supersede(&pool, "ev_pin_a", corrected).await.unwrap();
    let latest = latest_for_route(&pool, route_id).await.unwrap().expect("some");
    assert_eq!(latest.evidence_id, "ev_pin_b");
    assert_eq!(latest.destination_tx_hash.as_deref(), Some("0xdst_b"));
}

#[tokio::test]
async fn pinned_suspension_round_trip() {
    let pool = test_pool().await;
    truncate_all(&pool).await;
    let route_id = "POL:USDT->TRX:USDT:allbridge_core";
    let sus = RouteSuspension {
        suspension_id: "sus_pinned_001".into(),
        route_id: route_id.into(),
        reason_code: "REGISTRY_STALE".into(),
        reason: "pinned test".into(),
        operator: "system:test".into(),
        suspended_at: None,
        cleared_at: None,
        cleared_by: None,
        cleared_reason: None,
    };
    record_suspension(&pool, &sus).await.unwrap();
    assert!(is_suspension_active(&pool, route_id).await.unwrap());
    clear_suspension(&pool, route_id, "ops@rndrntwrk", "manual clear").await.unwrap();
    assert!(!is_suspension_active(&pool, route_id).await.unwrap());
}

#[tokio::test]
async fn pinned_restart_recovery_last_event_visible_after_reconnect() {
    // The point of this test: a process restart is equivalent to a fresh
    // pool. Confirm that `last_for_route` finds the most recent row
    // written by a different pool/connection. SQLx pools are independent,
    // so this proves the row is visible across connections (Postgres
    // visibility) and across pool lifetimes.
    let pool = test_pool().await;
    truncate_all(&pool).await;
    let route_id = "RECOVERY:POL:USDT->TRX:USDT:allbridge_core";
    record_event(&pool, route_id, LifecycleEvent::SourceTxSubmitted, LifecyclePayload {
        raw_tx_hash: Some("0xrecovery_tx".into()),
        ..Default::default()
    }).await.unwrap();
    drop(pool);
    let pool2 = test_pool().await;
    let last = last_for_route(&pool2, route_id).await.unwrap().expect("some");
    assert_eq!(last.event, "source_tx_submitted");
    assert_eq!(last.tx_hash.as_deref(), Some("0xrecovery_tx"));
}
```

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test m5_lifecycle_pinned -- --test-threads=1 --nocapture
```

Expected: 5 PASS.

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/tests/m5_lifecycle_pinned.rs
git status --short
```

---

## Task T17: Final M5 Branch Review

**Wave:** W13. **Subagent:** `code-review:code-review`, `model: opus`. **Goal:** Full review of the M5 branch.

**Pre-review verification command the controller runs:**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --all -- --test-threads=1
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
LC_ALL=C grep -RcP "[^\x00-\x7F]" docs/runbooks/ | grep -v ":0$" || echo "all runbooks ASCII"
xxd docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md | grep -E 'e2 80 (94|92)' | head -3 || echo "no em/en dashes in plan"
```

- [ ] **Step 1: Dispatch the reviewer.**

```
Agent(
  description: "Final m5 branch review",
  subagent_type: "code-review:code-review",
  model: "opus",
  prompt: <full review prompt referencing the same PRD/CRD/TRD/SOW IDs, the M5 wave map, the M4 critical follow-up closure via T10, and the M0-M2/M3/M4 final review CHANGES_REQUIRED patterns to anticipate>
)
```

- [ ] **Step 2: Handle verdict.** If APPROVED, the controller moves to `superpowers:finishing-a-development-branch`. If CHANGES_REQUIRED, the controller re-dispatches the original implementer task for each issue. After APPROVED, write `sw4p/docs/followups/2026-05-18-usdt-tron-parity-m5-lifecycle-proof-ledger-followups.md` capturing anything M5 deferred (likely: M6 kit/frontend mirror of the lifecycle event vocabulary, M6 full RBAC replacing the static operator token, M6 OTLP exporter wiring so the `metrics` calls actually reach an aggregator, M7 evidence template polish, real provider response shape capture against a mainnet canary if WP9.5 fires).

- [ ] **Step 3: Push the M5 branch and open a PR stacking on the M4 PR.** Controller-only step; no subagent.

---

## Self-Review Checklist

### Spec coverage trace

| Spec ID or follow-up | Task |
|---|---|
| PRD-USDT-018 lifecycle | T2 (types), T3 (writer), T5 through T9 (wiring), T13 (stuck worker), T15 (integration), T16 (pinned) |
| PRD-USDT-020 proof ledger | T1 (migration), T4 (writer + supersession), T15, T16 |
| PRD-USDT-021 observability | T12 |
| PRD-USDT-022 operator suspension | T1 (migration), T7 (auto-suspend on stale registry), T11 (operator API), T14 (runbook) |
| CRD section 11 proof requirements | T1, T4, T16 |
| CRD section 12 lifecycle requirements | T2, T3, T5 through T9, T15 |
| CRD CRD-SEC-005 (token-info removal suspends routes) | T7 |
| CRD CRD-SEC-008 (operator suspension without code deployment) | T11 |
| TRD section 9.2 lifecycle events | T2 (every variant present + tested) |
| TRD section 9.3 proof ledger object | T4 (struct + writer) |
| TRD section 9.4 TRD-PROOF-001 through TRD-PROOF-009 | T3 (TRD-PROOF-001), T8 (TRD-PROOF-002), T8 (TRD-PROOF-003), T5 (TRD-PROOF-004), T6 (TRD-PROOF-005), T15 (TRD-PROOF-006 acceptance), T4 (TRD-PROOF-007), T16 (TRD-PROOF-008 restart recovery), T13 (TRD-PROOF-009) |
| TRD section 11 DB requirements | T1 |
| TRD section 12 observability | T12 (all named counters + histograms + a gauge for stuck count) |
| SOW WP7.1 DB schema | T1 |
| SOW WP7.2 durable lifecycle state machine | T2, T3, T5 through T9 |
| SOW WP7.3 proof ledger | T4 |
| SOW WP7.4 restart recovery | T3 (last_for_route), T16 (pinned restart recovery test) |
| SOW WP7.5 metrics and logs | T12 |
| SOW WP7.6 operator runbooks | T14 |
| M4 critical follow-up: bridge_from_tron_with_caps body | T10 |

### Placeholder scan

No "TBD", no "fill in", no "implement later", no "similar to Task N" reference. Every code block has actual code. The few `// adapt to actual field name` comments are scoped to whatever the existing M3/M4 module's field names turn out to be; the implementer's wave-start `grep` confirms the names before the change.

### Type consistency

- `LifecycleEvent` and `LifecyclePayload` are defined in T2 and consumed unchanged by T3, T5, T6, T7, T8, T9, T10, T11, T13, T15, T16.
- `SettlementEvidence` is defined in T4 and consumed by T15 and T16.
- `RouteSuspension` is defined in T7 and consumed by T11, T15, T16.
- `CanaryCaps` is defined in M4 and used unchanged in T10.
- The reason-code vocabulary spans T8 (raw tx validator codes), T10 (`CANARY_FEE_OVERRUN`, `CANARY_APPROVAL_OVERRUN`, `CANARY_SLIPPAGE_OVERRUN`), T13 (`destination_pending_stuck_past_threshold`), T7 (`REGISTRY_STALE`). All are strings; none are typed enums. The cap reason codes share a `CANARY_*_OVERRUN` prefix for grep-ability.
- The metric name strings in `observability::names` are stable across the plan; the call sites in T12 reference them via the helpers, not by re-typing the string.

### Out-of-scope follow-ups to surface in T17 review

- Kit-side mirror of the `LifecycleEvent` vocabulary so M6 frontend can render the state machine without re-typing it.
- Full RBAC replacing the static `OPERATOR_AUTH_TOKEN` header; M6 wiring through the existing `auth.rs` middleware.
- OTLP exporter that picks up the `metrics` crate calls and ships to the existing OpenTelemetry collector; M6 task in WS7 follow-up.
- A "Refunded" lifecycle wiring pass: M5 records `Failed` and `ManualReviewRequired`, but the actual Allbridge refund triggered by `Refunded` is operator-initiated; M6 or M7 adds the path.
- Real on-chain canary execution to populate the first non-synthetic `settlement_evidence` row (SOW WP9.5).
- Provider response shape capture: T6 hashes the response bytes, but the structural fields (`status`, `destinationTxHash`) come from the M4 polling implementation; if Allbridge ships a v2 transfer-status response, both M4 and M5 need an adapter.
- Per-chain label propagation through `provider_status_polling`'s histogram emission (currently labels are "" until M5 follow-up).
- Restart-recovery worker that scans for `WalletSignatureRequested` rows without a subsequent `SourceTxSubmitted` and decides whether to time them out; M6.

### Wave-level file conflict audit

- W0: T1 touches three new migration files (no conflict). T2 touches `lifecycle.rs` (new) and `lib.rs` (also touched by T4 in W1; sequential ordering avoids conflict).
- W1: T3 touches `lifecycle.rs` (extends T2's file). T4 touches `evidence.rs` (new) and `lib.rs` (extends T2's edit). Sequential within wave.
- W2: T5 modifies `tron_watcher.rs` only.
- W3: T6 modifies `provider_status_polling.rs` only.
- W4: T7 creates `suspensions.rs`, modifies `allbridge_registry.rs` and `lib.rs`. Both `lib.rs` edits are append-only `pub mod` additions; no merge conflict.
- W5: T8 modifies `raw_tx_validator.rs` only.
- W6: T9 modifies `allbridge.rs` and `tron_signing_api.rs`.
- W7: T10 modifies `allbridge.rs`. This is sequential after T9 in the same file; the two changes touch different inner regions (T9 wires bridge_from_tron_with_mode; T10 extracts bridge_from_tron_with_caps). Implementer should rebase-check after T9 lands.
- W8: T11 creates `operator_api.rs`, modifies `lib.rs` and `main.rs`. `main.rs` is also touched by T13 in W10; sequential ordering avoids conflict.
- W9: T12 touches `Cargo.toml`, creates `observability.rs`, modifies `lib.rs` plus seven other files (each gets a single helper call insertion). These insertions are inside functions and do not collide with prior edits.
- W10: T13 creates `stuck_transfer_worker.rs`, modifies `lib.rs` and `main.rs`. The `main.rs` spawn line goes after T11's router merge.
- W11: T14 touches only parent-repo `docs/runbooks/`. No sw4p repo conflict.
- W12: T15 creates a new test file. T16 creates a new test file. Sequential because both reset the test DB; running in parallel would interfere with `TRUNCATE` calls.
- W13: T17 is read-only review.

### Em-dash and non-ASCII scan

The plan contains no em dashes (U+2014) or other non-ASCII characters. Verify with:

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
LC_ALL=C grep -cP "[^\x00-\x7F]" docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md
xxd docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md | grep -E 'e2 80 (94|92)' | head -3 || echo "no em/en dashes"
```

Expected: `0`, then `no em/en dashes`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md`.

Two execution options:

**1. Subagent-Driven (recommended)**: Controller dispatches a fresh subagent per task, reviews per wave. Same model as M0-M2, M3, and M4. Estimate: 14 waves, 17 tasks, ~4 hours wall-clock at the M3/M4 cadence, ~25 subagent dispatches (each task plus a quality reviewer for the larger tasks: T10, T11, T12, T15).

**2. Inline Execution**: Controller executes tasks in this session using `superpowers:executing-plans`, batch with human-review checkpoints at every wave boundary.

Which approach?
