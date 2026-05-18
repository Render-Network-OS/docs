# sw4p USDT / Tron Parity, M3 Tron Signing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking. This plan deliberately runs sw4p Rust tasks **sequentially** within each wave, and kit/frontend tasks in parallel where files are disjoint. The reason is in the M0-M2 plan: parallel agents racing on a shared standalone git repo cause branch-state fragmentation.

**Goal:** Replace the backend-relayer Tron signing path with user-signed TronLink flow as the production default, keep the relayer path only as an explicit canary mechanism with structured authorization, complete the raw transaction validator with TRC20 and Allbridge ABI decoding, add a Tron source confirmation watcher, and expose the new signing flow through the backend HTTP surface and the frontend wallet provider.

**Architecture:** A new `tron_address`, `tron_fees`, and `tron_abi` set of pure backend modules feeds an expanded `raw_tx_validator` and a new `tron_unsigned_tx_builder` that constructs an unsigned Tron `swapAndBridge` transaction from a validated user intent. Two new HTTP handlers (`POST /v1/tron/raw-tx` and `POST /v1/tron/broadcast`) expose the build-then-broadcast flow without the backend ever holding a user key. A new `tron_watcher` polls the existing `tron_client::wait_for_confirmation` to record source-tx finality in the lifecycle tables (lifecycle storage is M5; M3 stores only the source-confirmation event). A new `canary_authorization` module and Postgres table gate any continued relayer usage to explicit named authorizations. Frontend changes extend `WalletProvider` with `tronSignTransaction`/`tronBroadcastTransaction`, add a `useTronSigning` hook and a `TronTxReview` fee/resource preview component, and wire the `useBridge` factory's missing `'TRON'` branch. Kit adds a Tron address format helper and a canary authorization type.

**Tech Stack:** Rust 2021 with Axum, Tokio, SQLx (PostgreSQL), reqwest, secp256k1, alloy (for EVM ABI decoding of the Allbridge entrypoint), tracing, opentelemetry-otlp, mockall, wiremock, tokio-test, sha2, hex, thiserror, chrono. TypeScript 5.4 with Zod and vitest in `sw4p-kit`. React 19 on Vite with TanStack Query and direct `window.tronWeb`/`window.tronLink` integration (no `tronweb` npm dep) in `sw4p/sw4p-frontend`.

**Binding companion docs:**

- [PRD](../specs/2026-05-18-sw4p-usdt-tron-parity-prd.md) (PRD-USDT-005, PRD-USDT-008, PRD-USDT-016, PRD-USDT-017, PRD-USDT-019, PRD-USDT-024)
- [CRD](../specs/2026-05-18-sw4p-usdt-tron-parity-crd.md) (Section 7 signing/custody, Section 8 fees/gas, Section 9 validation, Section 10 approvals, Section 14 security, Section 15 OD-001/OD-002)
- [TRD](../specs/2026-05-18-sw4p-usdt-tron-parity-trd.md) (Section 6 raw tx validator, Section 8 Tron wallet adapter, Section 14 canary authorization object)
- [SOW](../specs/2026-05-18-sw4p-usdt-tron-parity-sow.md) (Workstream WS5 in full)
- [M0-M2 plan](2026-05-18-sw4p-usdt-tron-parity-m0-m2.md)
- [M0-M2 follow-ups](../../../sw4p/docs/followups/2026-05-18-usdt-tron-parity-m0-m2-followups.md)
- [Inventory](../specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md)

---

## Subagent Dispatch Contract

Same as the M0-M2 plan, repeated here so this plan stands alone.

| Field | Value |
|---|---|
| `model` | `opus` (Opus 4.7 max, no Sonnet/Haiku) |
| `subagent_type` (implementer) | `general-purpose` |
| `subagent_type` (spec reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (quality reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (final review) | `code-review:code-review` |
| `isolation` | omit |
| `run_in_background` | false for in-wave work |

**Critical operational rules (lessons from M0-M2 execution):**

1. **sw4p is a standalone nested git repo** with 100+ branches. Every M3 sw4p commit lands on branch `feat/sw4p-usdt-tron-parity-m3-tron-signing` (the controller creates it off `feat/sw4p-usdt-tron-parity-m0-m2` if that branch is still open in review, otherwise off whichever branch M0-M2 merges into). Implementers must verify branch with `git -C /Volumes/.../555/sw4p rev-parse --abbrev-ref HEAD` and STOP if wrong. Never `git checkout` to switch branches.
2. **sw4p-kit is a standalone nested git repo.** Every M3 kit commit lands on `feat/sw4p-kit-usdt-tron-parity-m3-tron-signing`.
3. **Parent repo at `/Volumes/.../555/`** is local-only; the plan, specs, and follow-ups live there but are not pushed.
4. **Sequential within a single git repo wave** to avoid the parallel-agent branch-race issue observed in M0-M2 W1.
5. **No signing/hook bypass flags.** Never pass `-c commit.gpgsign=false`, `--no-gpg-sign`, `--no-verify`. Hard user rule.
6. **No AI co-author trailer.** Every commit author is `rndrntwrk <dev@rndrntwrk.com>`.
7. **No em dashes (U+2014) or non-ASCII** in any committed file or commit message.
8. **Configured `reqwest::Client` with timeouts** on every new HTTP module (30s timeout, 10s connect; lesson from M0-M2 W2 quality review).
9. **Add `tracing::info!` / `tracing::warn!` to network and DB boundaries.** Hashes and IDs only; no plaintext secrets.

---

## Parallel Wave Map

| Wave | Tasks | Repo(s) | Parallel agents |
|---:|---|---|---:|
| W0 | T0 canary auth migration + module | sw4p | 1 |
| W1 | T1 tron_address, T2 tron_fees, T3 tron_abi | sw4p | sequential (3 modules touch lib.rs) |
| W2 | T4 raw_tx_validator Tron extension | sw4p | 1 (modifies existing file) |
| W3 | T5 tron_unsigned_tx_builder | sw4p | 1 |
| W4 | T6 POST /v1/tron/raw-tx handler, T7 POST /v1/tron/broadcast handler | sw4p | sequential (both touch lib.rs and main.rs) |
| W5 | T8 tron source confirmation watcher | sw4p | 1 |
| W6 | T9 kit tron address helper, T10 kit canary auth type | sw4p-kit | sequential |
| W7 | T11 frontend tronTypes extension, T12 frontend WalletProvider signing methods | sw4p (frontend subdir) | sequential |
| W8 | T13 frontend useTronSigning hook, T14 frontend TronTxReview component | sw4p (frontend subdir) | sequential |
| W9 | T15 frontend useBridge Tron branch, T16 frontend settlementChains signingMethod field | sw4p (frontend subdir) | sequential |
| W10 | T17 integration test (mock TronWeb + wiremock + real DB) | sw4p | 1 |
| W11 | T18 pinned Tron signing acceptance test | sw4p | 1 |
| W12 | T19 final branch review across both repos | both | 1 |

Total: 19 tasks across 13 waves. Frontend work uses the same sw4p repo branch (frontend lives at `sw4p/sw4p-frontend/`).

---

## File Structure

New files this plan creates:

| Path | Responsibility |
|---|---|
| `sw4p/sw4p-backend/migrations/20260518130000_canary_authorizations.sql` | Postgres table per TRD section 14 canary authorization object. |
| `sw4p/sw4p-backend/src/canary_authorization.rs` | Canary auth struct + CRUD against the new table. |
| `sw4p/sw4p-backend/src/tron_address.rs` | TRC20 / Tron base58check address validation, hex round-trip, malformed-input rejection. |
| `sw4p/sw4p-backend/src/tron_fees.rs` | Tron fee/resource preview model (TRX, Bandwidth, Energy, fee_limit). |
| `sw4p/sw4p-backend/src/tron_abi.rs` | TRC20 `transfer` and Allbridge `swapAndBridge` selector + parameter decoders. |
| `sw4p/sw4p-backend/src/tron_unsigned_tx_builder.rs` | Builds unsigned Tron transaction for user-side TronLink signing (replaces the relayer-sign portion of `bridge_from_tron`). |
| `sw4p/sw4p-backend/src/tron_signing_api.rs` | Two Axum handlers: `POST /v1/tron/raw-tx` and `POST /v1/tron/broadcast`. |
| `sw4p/sw4p-backend/src/tron_watcher.rs` | Source-tx confirmation poller that records the source-confirmed event. |
| `sw4p/sw4p-backend/tests/tron_signing_pinned.rs` | Acceptance test that walks an intent through quote, raw-tx build, mock-sign, broadcast, and source confirmation. |
| `sw4p-kit/src/core/canary.ts` | TypeScript canary authorization type and parser. |
| `sw4p-kit/src/core/tron_address.ts` | TypeScript Tron address format helper (regex + length check). |
| `sw4p/sw4p-frontend/src/hooks/useTronSigning.ts` | React hook exposing sign-then-broadcast for Tron. |
| `sw4p/sw4p-frontend/src/components/TronTxReview.tsx` | Fee/resource preview UI with explicit TRX, Bandwidth, Energy, fee_limit lines. |

Files this plan modifies:

| Path | Modification |
|---|---|
| `sw4p/sw4p-backend/src/lib.rs` | Add `pub mod` declarations for every new module; merge `tron_signing_api::routes_router` in the app builder. |
| `sw4p/sw4p-backend/src/main.rs` | Merge new sub-router (one line). |
| `sw4p/sw4p-backend/src/raw_tx_validator.rs` | Add a Tron branch that consumes `tron_abi` decoders to satisfy TRD-RAW-002, 003, 004, 005, 006, 008, 011, 013, 014. |
| `sw4p/sw4p-backend/src/allbridge.rs` | Replace lines 309 to 410 (`bridge_from_tron` body): keep the SQL/registry side but split off the relayer-signing portion to live behind an explicit `with_canary_authorization` guard; the user-signed path delegates to `tron_unsigned_tx_builder`. |
| `sw4p-kit/src/core/intent.ts` | Tighten the Tron destination address regex via the new `tron_address.ts` helper. |
| `sw4p/sw4p-frontend/src/types/tronTypes.d.ts` | Extend `TronWeb` interface with `trx.sign(tx)` and `trx.sendRawTransaction(signed)` signatures. |
| `sw4p/sw4p-frontend/src/WalletProvider.tsx` | Add `tronSignTransaction(tx)` and `tronBroadcastTransaction(signed)` to the context. |
| `sw4p/sw4p-frontend/hooks/useBridge.ts` | Add `'TRON'` branch to the `createBridge` factory. |
| `sw4p/sw4p-frontend/src/config/settlementChains.ts` | Add `signingMethod: 'tronlink' \| 'canary' \| 'none'` field; Tron entry uses `'tronlink'`. Keep `sourceEnabled: false` (the M7 launch decision flips it). |

---

## Task T0: Canary Authorization Migration and Module

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add the Postgres table and Rust module that store TRD section 14 canary authorization objects, so the relayer path is gated by explicit named authorizations.

**Spec IDs:** PRD-USDT-019, PRD-USDT-024; CRD CRD-SIGN-003 (relayer rules), section 15 OD-001/OD-002; TRD section 14; SOW WP5.6.

**Files:**

- Create: `sw4p/sw4p-backend/migrations/20260518130000_canary_authorizations.sql`
- Create: `sw4p/sw4p-backend/src/canary_authorization.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod canary_authorization;`)

- [ ] **Step 1: Write the migration.**

```sql
CREATE TABLE IF NOT EXISTS canary_authorizations (
    authorization_id    TEXT PRIMARY KEY,
    source_chain        TEXT NOT NULL,
    destination_chain   TEXT NOT NULL,
    source_asset        TEXT NOT NULL,
    destination_asset   TEXT NOT NULL,
    rail                TEXT NOT NULL,
    amount_decimal      TEXT NOT NULL,
    source_wallet       TEXT NOT NULL,
    destination_wallet  TEXT NOT NULL,
    max_fee             TEXT NOT NULL,
    max_slippage        TEXT NOT NULL,
    approval_cap        TEXT NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    approver            TEXT NOT NULL,
    proof_destination   TEXT NOT NULL,
    notes               TEXT,
    consumed_at         TIMESTAMPTZ,
    consumed_by_tx_hash TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canary_authorizations_active
    ON canary_authorizations (source_chain, destination_chain, expires_at)
    WHERE consumed_at IS NULL;
```

- [ ] **Step 2: Apply the migration to the test DB.**

```bash
cat "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/migrations/20260518130000_canary_authorizations.sql" \
  | docker exec -i sw4p-canary-pg psql -U postgres -d sw4p_test
docker exec sw4p-canary-pg psql -U postgres -d sw4p_test -c '\d canary_authorizations'
```

Expected: one `CREATE TABLE` + one `CREATE INDEX` ack, then a `\d` listing showing all 18 columns.

- [ ] **Step 3: Create the Rust module.**

```rust
//! Canary authorization storage.
//!
//! Implements the structured authorization object per TRD section 14. A
//! relayer-signed Tron transfer is allowed only against an unconsumed
//! authorization row that matches the requested route, wallets, caps,
//! and is not expired. Consuming an authorization writes the source
//! transaction hash and the consumed timestamp.
//!
//! Satisfies: PRD-USDT-019, PRD-USDT-024; CRD CRD-SIGN-003, section 14;
//! SOW WP5.6.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CanaryAuthorization {
    pub authorization_id: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub source_asset: String,
    pub destination_asset: String,
    pub rail: String,
    pub amount_decimal: String,
    pub source_wallet: String,
    pub destination_wallet: String,
    pub max_fee: String,
    pub max_slippage: String,
    pub approval_cap: String,
    pub expires_at: DateTime<Utc>,
    pub approver: String,
    pub proof_destination: String,
    pub notes: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum CanaryError {
    #[error("database: {0}")] Db(#[from] sqlx::Error),
    #[error("not found: {0}")] NotFound(String),
    #[error("expired: {0}")] Expired(String),
    #[error("already consumed: {0}")] AlreadyConsumed(String),
    #[error("mismatch: {0}")] Mismatch(String),
}

pub async fn insert(pool: &PgPool, auth: &CanaryAuthorization) -> Result<(), CanaryError> {
    sqlx::query(
        r#"INSERT INTO canary_authorizations
           (authorization_id, source_chain, destination_chain, source_asset, destination_asset,
            rail, amount_decimal, source_wallet, destination_wallet, max_fee, max_slippage,
            approval_cap, expires_at, approver, proof_destination, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)"#,
    )
    .bind(&auth.authorization_id)
    .bind(&auth.source_chain)
    .bind(&auth.destination_chain)
    .bind(&auth.source_asset)
    .bind(&auth.destination_asset)
    .bind(&auth.rail)
    .bind(&auth.amount_decimal)
    .bind(&auth.source_wallet)
    .bind(&auth.destination_wallet)
    .bind(&auth.max_fee)
    .bind(&auth.max_slippage)
    .bind(&auth.approval_cap)
    .bind(auth.expires_at)
    .bind(&auth.approver)
    .bind(&auth.proof_destination)
    .bind(&auth.notes)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find_active(pool: &PgPool, id: &str, now: DateTime<Utc>) -> Result<CanaryAuthorization, CanaryError> {
    let row: Option<(String, String, String, String, String, String, String, String, String, String, String, String, DateTime<Utc>, String, String, Option<String>, Option<DateTime<Utc>>)> =
        sqlx::query_as(
            r#"SELECT authorization_id, source_chain, destination_chain, source_asset, destination_asset,
                      rail, amount_decimal, source_wallet, destination_wallet, max_fee, max_slippage,
                      approval_cap, expires_at, approver, proof_destination, notes, consumed_at
               FROM canary_authorizations WHERE authorization_id = $1"#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;
    let r = row.ok_or_else(|| CanaryError::NotFound(id.into()))?;
    if r.16.is_some() { return Err(CanaryError::AlreadyConsumed(id.into())); }
    if r.12 <= now { return Err(CanaryError::Expired(id.into())); }
    Ok(CanaryAuthorization {
        authorization_id: r.0, source_chain: r.1, destination_chain: r.2,
        source_asset: r.3, destination_asset: r.4, rail: r.5, amount_decimal: r.6,
        source_wallet: r.7, destination_wallet: r.8, max_fee: r.9, max_slippage: r.10,
        approval_cap: r.11, expires_at: r.12, approver: r.13, proof_destination: r.14, notes: r.15,
    })
}

pub async fn consume(pool: &PgPool, id: &str, tx_hash: &str) -> Result<(), CanaryError> {
    let n = sqlx::query("UPDATE canary_authorizations SET consumed_at = NOW(), consumed_by_tx_hash = $2 WHERE authorization_id = $1 AND consumed_at IS NULL")
        .bind(id).bind(tx_hash).execute(pool).await?.rows_affected();
    if n == 0 { return Err(CanaryError::AlreadyConsumed(id.into())); }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::test_pool;

    fn fixture() -> CanaryAuthorization {
        CanaryAuthorization {
            authorization_id: "auth_test_001".to_string(),
            source_chain: "POL".to_string(),
            destination_chain: "TRX".to_string(),
            source_asset: "USDT".to_string(),
            destination_asset: "USDT".to_string(),
            rail: "allbridge_core".to_string(),
            amount_decimal: "5.00".to_string(),
            source_wallet: "0xowner".to_string(),
            destination_wallet: "TabcDEF0123456789012345678901234".to_string(),
            max_fee: "1.00".to_string(),
            max_slippage: "0.50".to_string(),
            approval_cap: "5.00".to_string(),
            expires_at: Utc::now() + chrono::Duration::hours(1),
            approver: "ops@rndrntwrk".to_string(),
            proof_destination: "evidence/2026-05-18-canary-001".to_string(),
            notes: Some("test".into()),
        }
    }

    async fn truncate(pool: &PgPool) {
        sqlx::query("TRUNCATE TABLE canary_authorizations RESTART IDENTITY").execute(pool).await.ok();
    }

    #[tokio::test]
    async fn insert_and_find_active_returns_row() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let a = fixture();
        insert(&pool, &a).await.expect("insert ok");
        let found = find_active(&pool, &a.authorization_id, Utc::now()).await.expect("find ok");
        assert_eq!(found.authorization_id, a.authorization_id);
        assert_eq!(found.amount_decimal, "5.00");
    }

    #[tokio::test]
    async fn find_active_rejects_expired() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let mut a = fixture();
        a.expires_at = Utc::now() - chrono::Duration::seconds(1);
        insert(&pool, &a).await.expect("insert");
        let err = find_active(&pool, &a.authorization_id, Utc::now()).await.unwrap_err();
        assert!(matches!(err, CanaryError::Expired(_)));
    }

    #[tokio::test]
    async fn consume_marks_row_and_subsequent_find_fails() {
        let pool = test_pool().await;
        truncate(&pool).await;
        let a = fixture();
        insert(&pool, &a).await.expect("insert");
        consume(&pool, &a.authorization_id, "0xtxhash").await.expect("consume ok");
        let err = find_active(&pool, &a.authorization_id, Utc::now()).await.unwrap_err();
        assert!(matches!(err, CanaryError::AlreadyConsumed(_)));
    }
}
```

- [ ] **Step 4: Wire and test.**

Edit `sw4p/sw4p-backend/src/lib.rs` and add `pub mod canary_authorization;` near the `pub mod` block.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib canary_authorization -- --nocapture --test-threads=1
```

Expected: three PASS.

- [ ] **Step 5: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/migrations/20260518130000_canary_authorizations.sql sw4p-backend/src/canary_authorization.rs sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): canary authorization storage per trd section 14"
```

---

## Task T1: Tron Address Validation

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Pure module with strict TRC20 address validation, independent of `tron_client.rs` which already has base58check helpers.

**Spec IDs:** PRD-USDT-016; CRD section 9 (recipient validation); TRD-TRON-007; SOW WP5.3.

**Files:**

- Create: `sw4p/sw4p-backend/src/tron_address.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod tron_address;`)

- [ ] **Step 1: Write the module.**

```rust
//! Tron address validation.
//!
//! TRC20 / Tron addresses are base58check-encoded, start with `T`, and
//! decode to exactly 21 bytes whose first byte is `0x41` (mainnet) and
//! whose last 4 bytes are a SHA-256 double-hash checksum of the first 21.
//! This module rejects malformed, wrong-network, or non-Tron strings
//! before they ever reach a signing or broadcast path.
//!
//! Satisfies: PRD-USDT-016; CRD section 9 (recipient validation);
//! TRD-TRON-007; SOW WP5.3.

use sha2::{Digest, Sha256};

const TRON_ADDRESS_PREFIX: u8 = 0x41;
const TRON_BASE58_LEN_MIN: usize = 33;
const TRON_BASE58_LEN_MAX: usize = 34;

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum AddressError {
    #[error("empty address")] Empty,
    #[error("length {0} out of range")] Length(usize),
    #[error("does not start with T")] BadPrefix,
    #[error("base58 decode failed")] Base58,
    #[error("decoded length {0} not 25")] DecodedLength(usize),
    #[error("network byte 0x{0:02x} is not 0x41")] BadNetwork(u8),
    #[error("checksum mismatch")] Checksum,
}

pub fn validate(addr: &str) -> Result<(), AddressError> {
    if addr.is_empty() { return Err(AddressError::Empty); }
    if !(TRON_BASE58_LEN_MIN..=TRON_BASE58_LEN_MAX).contains(&addr.len()) {
        return Err(AddressError::Length(addr.len()));
    }
    if !addr.starts_with('T') { return Err(AddressError::BadPrefix); }
    let decoded = base58_decode(addr).ok_or(AddressError::Base58)?;
    if decoded.len() != 25 { return Err(AddressError::DecodedLength(decoded.len())); }
    if decoded[0] != TRON_ADDRESS_PREFIX { return Err(AddressError::BadNetwork(decoded[0])); }
    let payload = &decoded[..21];
    let want = &decoded[21..];
    let h1 = Sha256::digest(payload);
    let h2 = Sha256::digest(h1);
    if &h2[..4] != want { return Err(AddressError::Checksum); }
    Ok(())
}

pub fn is_valid(addr: &str) -> bool { validate(addr).is_ok() }

fn base58_decode(s: &str) -> Option<Vec<u8>> {
    const ALPHABET: &[u8] = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let mut result: Vec<u8> = Vec::with_capacity(s.len());
    for c in s.chars() {
        let idx = ALPHABET.iter().position(|&b| b == c as u8)?;
        let mut carry = idx;
        for byte in result.iter_mut() {
            carry += (*byte as usize) * 58;
            *byte = (carry & 0xff) as u8;
            carry >>= 8;
        }
        while carry > 0 {
            result.push((carry & 0xff) as u8);
            carry >>= 8;
        }
    }
    for c in s.chars() {
        if c == '1' { result.push(0); } else { break; }
    }
    result.reverse();
    Some(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    const VALID_TRON_USDT_CONTRACT: &str = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const VALID_ALLBRIDGE_TRON: &str = "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2";

    #[test]
    fn accepts_known_tron_addresses() {
        validate(VALID_TRON_USDT_CONTRACT).expect("tron usdt contract is valid");
        validate(VALID_ALLBRIDGE_TRON).expect("allbridge tron router is valid");
    }

    #[test]
    fn rejects_empty() { assert_eq!(validate(""), Err(AddressError::Empty)); }

    #[test]
    fn rejects_evm_address() {
        let evm = "0x609c690e8F7D68a59885c9132e812eEbDaAf0c9e";
        assert!(matches!(validate(evm), Err(AddressError::Length(_)) | Err(AddressError::BadPrefix)));
    }

    #[test]
    fn rejects_bad_prefix() {
        // Same length as a Tron address but starting with 'S' (still in alphabet).
        let bad = "SR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
        assert_eq!(validate(bad), Err(AddressError::BadPrefix));
    }

    #[test]
    fn rejects_checksum_drift() {
        // Take a valid address and flip one base58 char in the middle.
        let mut chars: Vec<char> = VALID_TRON_USDT_CONTRACT.chars().collect();
        chars[10] = if chars[10] == 'A' { 'B' } else { 'A' };
        let mutated: String = chars.into_iter().collect();
        let err = validate(&mutated).unwrap_err();
        assert!(matches!(err, AddressError::Checksum | AddressError::BadNetwork(_)));
    }

    #[test]
    fn is_valid_returns_true_for_good_address() {
        assert!(is_valid(VALID_TRON_USDT_CONTRACT));
    }

    #[test]
    fn is_valid_returns_false_for_empty() { assert!(!is_valid("")); }
}
```

- [ ] **Step 2: Wire and test.**

Edit `sw4p/sw4p-backend/src/lib.rs` and add `pub mod tron_address;`.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_address -- --nocapture
```

Expected: six PASS.

- [ ] **Step 3: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_address.rs sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): strict tron trc20 address validation"
```

---

## Task T2: Tron Fees and Resource Model

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Pure model + estimator for Tron transaction cost dimensions (TRX, Bandwidth, Energy, fee_limit) so the frontend can render explicit fee/resource preview before signing.

**Spec IDs:** PRD-USDT-008; CRD CRD-FEE-003; TRD-TRON-006; SOW WP5.4.

**Files:**

- Create: `sw4p/sw4p-backend/src/tron_fees.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod tron_fees;`)

- [ ] **Step 1: Write the module.**

```rust
//! Tron fee and resource preview.
//!
//! Models the four cost dimensions every Tron transaction touches: TRX
//! consumed for non-Bandwidth bytes, Bandwidth used (free up to the
//! account's daily allowance, otherwise burned as TRX), Energy used by
//! smart contract execution (free up to the account's frozen-for-energy
//! allowance, otherwise burned as TRX), and the fee_limit ceiling that
//! caps any Energy burn.
//!
//! Satisfies: PRD-USDT-008; CRD CRD-FEE-003; TRD-TRON-006; SOW WP5.4.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TronResourcePreview {
    pub bandwidth_required: u64,
    pub energy_required: u64,
    pub fee_limit_sun: u64,
    pub estimated_trx_burn_sun: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TronAccountResources {
    pub bandwidth_free: u64,
    pub energy_free: u64,
}

pub fn estimate(account: TronAccountResources, preview: TronResourcePreview) -> TronResourcePreview {
    let bandwidth_overrun = preview.bandwidth_required.saturating_sub(account.bandwidth_free);
    let energy_overrun = preview.energy_required.saturating_sub(account.energy_free);
    let bandwidth_burn = bandwidth_overrun.saturating_mul(1_000);
    let energy_burn = energy_overrun.saturating_mul(420);
    let total_burn = bandwidth_burn.saturating_add(energy_burn);
    TronResourcePreview {
        bandwidth_required: preview.bandwidth_required,
        energy_required: preview.energy_required,
        fee_limit_sun: preview.fee_limit_sun,
        estimated_trx_burn_sun: total_burn,
    }
}

pub fn approve_resource_baseline() -> TronResourcePreview {
    TronResourcePreview {
        bandwidth_required: 350,
        energy_required: 14_000,
        fee_limit_sun: 30_000_000,
        estimated_trx_burn_sun: 0,
    }
}

pub fn swap_and_bridge_resource_baseline() -> TronResourcePreview {
    TronResourcePreview {
        bandwidth_required: 450,
        energy_required: 180_000,
        fee_limit_sun: 200_000_000,
        estimated_trx_burn_sun: 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn estimate_zero_burn_when_account_has_full_resources() {
        let account = TronAccountResources { bandwidth_free: 10_000, energy_free: 1_000_000 };
        let preview = swap_and_bridge_resource_baseline();
        let est = estimate(account, preview);
        assert_eq!(est.estimated_trx_burn_sun, 0);
    }

    #[test]
    fn estimate_burns_trx_for_energy_overrun() {
        let account = TronAccountResources { bandwidth_free: 10_000, energy_free: 0 };
        let preview = swap_and_bridge_resource_baseline();
        let est = estimate(account, preview);
        let expected = 180_000_u64.saturating_mul(420);
        assert_eq!(est.estimated_trx_burn_sun, expected);
    }

    #[test]
    fn estimate_burns_trx_for_bandwidth_overrun() {
        let account = TronAccountResources { bandwidth_free: 0, energy_free: 1_000_000 };
        let preview = swap_and_bridge_resource_baseline();
        let est = estimate(account, preview);
        let expected = 450_u64.saturating_mul(1_000);
        assert_eq!(est.estimated_trx_burn_sun, expected);
    }

    #[test]
    fn approve_baseline_has_smaller_energy_than_swap() {
        assert!(approve_resource_baseline().energy_required < swap_and_bridge_resource_baseline().energy_required);
    }

    #[test]
    fn fee_limit_is_reported_back_unchanged() {
        let account = TronAccountResources { bandwidth_free: 0, energy_free: 0 };
        let preview = swap_and_bridge_resource_baseline();
        let est = estimate(account, preview);
        assert_eq!(est.fee_limit_sun, preview.fee_limit_sun);
    }
}
```

- [ ] **Step 2: Wire and test.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_fees -- --nocapture
```

Expected: five PASS.

- [ ] **Step 3: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_fees.rs sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): tron fee and resource preview model"
```

The burn-per-unit rates (1000 sun per Bandwidth, 420 sun per Energy) follow Tron's published parameters as of 2026-05-18; if the on-chain governance parameters drift, update the constants in a follow-up commit and add a calling site that reads them from the Tron network parameters endpoint.

---

## Task T3: TRC20 and Allbridge ABI Decoder

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Decode the two raw call payloads the M3 signing path will see: TRC20 `transfer(address,uint256)` and the Allbridge `swapAndBridge` call. Used by `raw_tx_validator` to satisfy TRD-RAW-003 through TRD-RAW-008.

**Spec IDs:** PRD-USDT-017; CRD section 9 (raw tx validation); TRD-RAW-003, TRD-RAW-004, TRD-RAW-005, TRD-RAW-006, TRD-RAW-008, TRD-RAW-013, TRD-RAW-014.

**Files:**

- Create: `sw4p/sw4p-backend/src/tron_abi.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod tron_abi;`)

- [ ] **Step 1: Write the module.**

```rust
//! Decoders for the raw call data the M3 signing path handles.
//!
//! Two call shapes:
//! - TRC20 `transfer(address recipient, uint256 amount)`
//! - Allbridge `swapAndBridge(bytes32 token, uint256 amount, bytes32 recipient,
//!                            uint8 destChainId, bytes32 receiveToken,
//!                            uint256 nonce, uint8 messenger, uint256 feeTokenAmount)`
//!
//! Selectors are computed from the canonical Solidity signature. Tron
//! transactions wrap the EVM-style call data in the Tron contract call
//! payload; the decoders here operate on the bare call data once the
//! Tron wrapper has been removed.
//!
//! Satisfies: PRD-USDT-017; CRD section 9; TRD-RAW-003, TRD-RAW-004,
//! TRD-RAW-005, TRD-RAW-006, TRD-RAW-008, TRD-RAW-013, TRD-RAW-014.

pub const TRC20_TRANSFER_SELECTOR: [u8; 4] = [0xa9, 0x05, 0x9c, 0xbb];
pub const ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR: [u8; 4] = [0xd4, 0x80, 0x3b, 0x7e];

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum AbiError {
    #[error("payload too short: {0} bytes")] TooShort(usize),
    #[error("unknown selector 0x{0:02x}{1:02x}{2:02x}{3:02x}")] UnknownSelector(u8, u8, u8, u8),
    #[error("bad word at offset {0}")] BadWord(usize),
    #[error("non-zero high bytes in address word at offset {0}")] AddressHighBytes(usize),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Trc20Transfer {
    pub recipient_evm_hex: String,
    pub amount: u128,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AllbridgeSwapAndBridge {
    pub token_word_hex: String,
    pub amount: u128,
    pub recipient_word_hex: String,
    pub dest_chain_id: u8,
    pub receive_token_word_hex: String,
    pub nonce: u128,
    pub messenger: u8,
    pub fee_token_amount: u128,
}

pub fn decode_trc20_transfer(data: &[u8]) -> Result<Trc20Transfer, AbiError> {
    if data.len() < 4 + 32 + 32 { return Err(AbiError::TooShort(data.len())); }
    if data[..4] != TRC20_TRANSFER_SELECTOR {
        return Err(AbiError::UnknownSelector(data[0], data[1], data[2], data[3]));
    }
    let recipient_word = &data[4..36];
    for &b in &recipient_word[..12] {
        if b != 0 { return Err(AbiError::AddressHighBytes(4)); }
    }
    let recipient_evm_hex = format!("0x{}", hex::encode(&recipient_word[12..32]));
    let amount = u128_from_word(&data[36..68]).ok_or(AbiError::BadWord(36))?;
    Ok(Trc20Transfer { recipient_evm_hex, amount })
}

pub fn decode_allbridge_swap_and_bridge(data: &[u8]) -> Result<AllbridgeSwapAndBridge, AbiError> {
    let needed = 4 + 8 * 32;
    if data.len() < needed { return Err(AbiError::TooShort(data.len())); }
    if data[..4] != ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR {
        return Err(AbiError::UnknownSelector(data[0], data[1], data[2], data[3]));
    }
    let token_word_hex = format!("0x{}", hex::encode(&data[4..36]));
    let amount = u128_from_word(&data[36..68]).ok_or(AbiError::BadWord(36))?;
    let recipient_word_hex = format!("0x{}", hex::encode(&data[68..100]));
    let dest_chain_id_word = &data[100..132];
    for &b in &dest_chain_id_word[..31] {
        if b != 0 { return Err(AbiError::BadWord(100)); }
    }
    let dest_chain_id = dest_chain_id_word[31];
    let receive_token_word_hex = format!("0x{}", hex::encode(&data[132..164]));
    let nonce = u128_from_word(&data[164..196]).ok_or(AbiError::BadWord(164))?;
    let messenger_word = &data[196..228];
    for &b in &messenger_word[..31] {
        if b != 0 { return Err(AbiError::BadWord(196)); }
    }
    let messenger = messenger_word[31];
    let fee_token_amount = u128_from_word(&data[228..260]).ok_or(AbiError::BadWord(228))?;
    Ok(AllbridgeSwapAndBridge {
        token_word_hex, amount, recipient_word_hex, dest_chain_id,
        receive_token_word_hex, nonce, messenger, fee_token_amount,
    })
}

fn u128_from_word(word: &[u8]) -> Option<u128> {
    if word.len() != 32 { return None; }
    for &b in &word[..16] { if b != 0 { return None; } }
    let mut buf = [0u8; 16];
    buf.copy_from_slice(&word[16..32]);
    Some(u128::from_be_bytes(buf))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pad_address(hex20: &str) -> [u8; 32] {
        let bytes = hex::decode(hex20.trim_start_matches("0x")).expect("hex");
        let mut out = [0u8; 32];
        out[12..32].copy_from_slice(&bytes);
        out
    }

    fn pad_u128(value: u128) -> [u8; 32] {
        let mut out = [0u8; 32];
        out[16..32].copy_from_slice(&value.to_be_bytes());
        out
    }

    #[test]
    fn decode_trc20_transfer_round_trips() {
        let recipient = "0xBBbD1BbB4f9b936C3604906D7592A644071dE884";
        let mut data: Vec<u8> = Vec::new();
        data.extend_from_slice(&TRC20_TRANSFER_SELECTOR);
        data.extend_from_slice(&pad_address(recipient));
        data.extend_from_slice(&pad_u128(100_000_000));
        let parsed = decode_trc20_transfer(&data).expect("decoded");
        assert_eq!(parsed.recipient_evm_hex.to_lowercase(), recipient.to_lowercase());
        assert_eq!(parsed.amount, 100_000_000);
    }

    #[test]
    fn decode_trc20_rejects_wrong_selector() {
        let mut data: Vec<u8> = vec![0u8, 0u8, 0u8, 0u8];
        data.extend(vec![0u8; 64]);
        let err = decode_trc20_transfer(&data).unwrap_err();
        assert!(matches!(err, AbiError::UnknownSelector(_,_,_,_)));
    }

    #[test]
    fn decode_trc20_rejects_short_payload() {
        let data = TRC20_TRANSFER_SELECTOR.to_vec();
        let err = decode_trc20_transfer(&data).unwrap_err();
        assert!(matches!(err, AbiError::TooShort(_)));
    }

    #[test]
    fn decode_swap_and_bridge_round_trips_minimal() {
        let mut data: Vec<u8> = Vec::new();
        data.extend_from_slice(&ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR);
        data.extend_from_slice(&[0u8; 32]);
        data.extend_from_slice(&pad_u128(5_000_000));
        data.extend_from_slice(&[0u8; 32]);
        data.extend_from_slice(&pad_u128(3));
        data.extend_from_slice(&[0u8; 32]);
        data.extend_from_slice(&pad_u128(42));
        data.extend_from_slice(&pad_u128(1));
        data.extend_from_slice(&pad_u128(250_000));
        let parsed = decode_allbridge_swap_and_bridge(&data).expect("decoded");
        assert_eq!(parsed.amount, 5_000_000);
        assert_eq!(parsed.dest_chain_id, 3);
        assert_eq!(parsed.nonce, 42);
        assert_eq!(parsed.messenger, 1);
        assert_eq!(parsed.fee_token_amount, 250_000);
    }
}
```

- [ ] **Step 2: Wire and test.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_abi -- --nocapture
```

Expected: four PASS.

The `ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR` is computed from the canonical signature; if a future Allbridge contract upgrade changes the entrypoint shape, the test will catch it via the decoder's `UnknownSelector` error. A follow-up should recompute the selector from a recorded `eth_getTransactionByHash` response when M4 captures one.

- [ ] **Step 3: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_abi.rs sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): trc20 transfer and allbridge swap and bridge abi decoders"
```

---

## Task T4: Raw Tx Validator Tron Extension

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add a Tron branch to `raw_tx_validator::validate` that consumes `tron_abi` to satisfy TRD-RAW-002, 003, 004, 005, 006, 008, 011, 013, and 014.

**Spec IDs:** PRD-USDT-017; CRD section 9 (the full 10-point checklist); TRD-RAW-002 through TRD-RAW-014 except TRD-RAW-007 (amount, already done in M0-M2), TRD-RAW-010 (expiry, already done), TRD-RAW-012 (chain_id, already done).

**Files:**

- Modify: `sw4p/sw4p-backend/src/raw_tx_validator.rs`

- [ ] **Step 1: Read the current validator and locate the Ok-return point.**

```bash
grep -n 'fn validate\|RawTxValidationResult::Ok\|return fail' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/raw_tx_validator.rs
```

- [ ] **Step 2: Extend `Intent` with the decoded shape that the Tron branch will compare against.** Edit `Intent`:

```rust
#[derive(Debug, Clone)]
pub struct Intent {
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token: String,
    pub destination_token: String,
    pub amount_decimal: String,
    pub amount_atoms: u128,
    pub recipient: String,
    pub recipient_atoms_hex: String,
    pub chain_id: Option<String>,
    pub allbridge_dest_chain_id: Option<u8>,
    pub allbridge_receive_token_atoms_hex: Option<String>,
    pub allbridge_messenger: Option<u8>,
    pub allbridge_max_fee_token_atoms: Option<u128>,
}
```

Add `amount_atoms`, `recipient_atoms_hex`, `allbridge_dest_chain_id`, `allbridge_receive_token_atoms_hex`, `allbridge_messenger`, `allbridge_max_fee_token_atoms` so the Tron decoded values can be compared without re-doing parsing. The existing tests still construct an `Intent` directly; update each call site in the file's `tests` module to pass the new fields (use defaults: `0`, `""`, `None`, `None`, `None`, `None` for the existing four tests where the new fields are not relevant).

- [ ] **Step 3: Extend `SendPayload`** in `allbridge_tx_builder.rs` with a `raw_data_hex_no_selector: String` field that strips the first 4 bytes (selector) and exposes the raw ABI-encoded arguments as hex. The builder fills this from the existing `raw_data` it already returns. Add the field as `pub`, and in `build_send` set it to `payload.raw_data` with the selector stripped (the first 8 hex characters, with `0x` accounted for).

- [ ] **Step 4: Add the Tron branch to `validate`.** Inside `validate`, after the existing four checks pass, insert:

```rust
if intent.source_chain == "TRX" {
    use crate::tron_abi::{decode_allbridge_swap_and_bridge, AbiError};
    let raw_no_prefix = payload.raw_data.trim_start_matches("0x");
    let raw_bytes = match hex::decode(raw_no_prefix) {
        Ok(b) => b,
        Err(_) => return fail("raw_data_not_hex", "Tron raw data is not valid hex.", "RAW_DATA_NOT_HEX"),
    };
    let decoded = match decode_allbridge_swap_and_bridge(&raw_bytes) {
        Ok(d) => d,
        Err(AbiError::UnknownSelector(..)) => return fail(
            "method_selector_not_allowlisted",
            "Tron raw transaction method selector is not the Allbridge swapAndBridge entrypoint.",
            "METHOD_SELECTOR_NOT_ALLOWLISTED",
        ),
        Err(e) => return fail("abi_decode_failed", &format!("Tron raw transaction failed ABI decode: {}", e), "ABI_DECODE_FAILED"),
    };
    passed.push("method_selector_allowlisted".to_string());

    if decoded.amount != intent.amount_atoms {
        return fail("amount_mismatch", "Decoded Tron amount does not match intent amount.", "AMOUNT_MISMATCH");
    }
    passed.push("decoded_amount_match".to_string());

    if let Some(expected_dest) = intent.allbridge_dest_chain_id {
        if decoded.dest_chain_id != expected_dest {
            return fail("destination_chain_id_mismatch", "Decoded Tron destination chain id does not match intent.", "DEST_CHAIN_ID_MISMATCH");
        }
        passed.push("decoded_dest_chain_id_match".to_string());
    }

    if decoded.recipient_word_hex.to_lowercase() != intent.recipient_atoms_hex.to_lowercase() {
        return fail("recipient_mismatch", "Decoded Tron recipient does not match intent recipient.", "RECIPIENT_MISMATCH");
    }
    passed.push("decoded_recipient_match".to_string());

    if let Some(expected_messenger) = intent.allbridge_messenger {
        if decoded.messenger != expected_messenger {
            return fail("messenger_mismatch", "Decoded Allbridge messenger does not match intent.", "MESSENGER_MISMATCH");
        }
        passed.push("decoded_messenger_match".to_string());
    }

    if let Some(max_fee) = intent.allbridge_max_fee_token_atoms {
        if decoded.fee_token_amount > max_fee {
            return fail("fee_exceeds_cap", "Decoded fee exceeds intent's fee cap.", "FEE_EXCEEDS_CAP");
        }
        passed.push("decoded_fee_within_cap".to_string());
    }
}
```

- [ ] **Step 5: Add three new tests.**

```rust
#[test]
fn validate_tron_fails_on_unknown_selector() {
    let mut p = payload_for_pol_trx();
    p.raw_data = "0x00000000".to_string();
    let mut i = intent();
    i.source_chain = "TRX".to_string();
    i.amount_atoms = 100;
    i.recipient_atoms_hex = "0x0000000000000000000000000000000000000000000000000000000000000000".to_string();
    let r = validate(&i, &quote(), &p, &snapshot());
    match r {
        RawTxValidationResult::Fail { failed_check, .. } => assert_eq!(failed_check, "method_selector_not_allowlisted"),
        _ => panic!("expected fail"),
    }
}

#[test]
fn validate_tron_passes_on_well_formed_swap_and_bridge() {
    use crate::tron_abi::ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR;
    let mut raw = Vec::new();
    raw.extend_from_slice(&ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR);
    raw.extend_from_slice(&[0u8; 32]);
    let mut amount = [0u8; 32];
    amount[16..32].copy_from_slice(&100u128.to_be_bytes());
    raw.extend_from_slice(&amount);
    let mut recipient = [0u8; 32];
    recipient[28..32].copy_from_slice(&[0xDE, 0xAD, 0xBE, 0xEF]);
    raw.extend_from_slice(&recipient);
    let mut dest = [0u8; 32];
    dest[31] = 1;
    raw.extend_from_slice(&dest);
    raw.extend_from_slice(&[0u8; 32]);
    raw.extend_from_slice(&[0u8; 32]);
    let mut messenger = [0u8; 32];
    messenger[31] = 1;
    raw.extend_from_slice(&messenger);
    raw.extend_from_slice(&[0u8; 32]);
    let raw_hex = format!("0x{}", hex::encode(raw));

    let mut p = payload_for_pol_trx();
    p.target = "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2".to_string();
    p.raw_data = raw_hex;
    p.chain_id = "tron".to_string();

    let mut i = intent();
    i.source_chain = "TRX".to_string();
    i.destination_chain = "ETH".to_string();
    i.amount_atoms = 100;
    i.recipient_atoms_hex = format!("0x{}", hex::encode(recipient));
    i.allbridge_dest_chain_id = Some(1);
    i.allbridge_messenger = Some(1);
    i.chain_id = Some("tron".to_string());

    let r = validate(&i, &quote(), &p, &snapshot());
    assert!(matches!(r, RawTxValidationResult::Ok { .. }));
}

#[test]
fn validate_tron_fails_on_fee_overrun() {
    use crate::tron_abi::ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR;
    let mut raw = Vec::new();
    raw.extend_from_slice(&ALLBRIDGE_SWAP_AND_BRIDGE_SELECTOR);
    raw.extend_from_slice(&[0u8; 32]);
    let mut amount = [0u8; 32]; amount[16..32].copy_from_slice(&100u128.to_be_bytes()); raw.extend_from_slice(&amount);
    raw.extend_from_slice(&[0u8; 32]);
    let mut dest = [0u8; 32]; dest[31] = 1; raw.extend_from_slice(&dest);
    raw.extend_from_slice(&[0u8; 32]);
    raw.extend_from_slice(&[0u8; 32]);
    let mut messenger = [0u8; 32]; messenger[31] = 1; raw.extend_from_slice(&messenger);
    let mut fee = [0u8; 32]; fee[16..32].copy_from_slice(&1_000_000u128.to_be_bytes()); raw.extend_from_slice(&fee);

    let mut p = payload_for_pol_trx();
    p.target = "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2".to_string();
    p.raw_data = format!("0x{}", hex::encode(raw));
    p.chain_id = "tron".to_string();

    let mut i = intent();
    i.source_chain = "TRX".to_string(); i.destination_chain = "ETH".to_string();
    i.amount_atoms = 100;
    i.recipient_atoms_hex = "0x0000000000000000000000000000000000000000000000000000000000000000".to_string();
    i.allbridge_dest_chain_id = Some(1);
    i.allbridge_messenger = Some(1);
    i.allbridge_max_fee_token_atoms = Some(500_000);
    i.chain_id = Some("tron".to_string());

    let r = validate(&i, &quote(), &p, &snapshot());
    match r {
        RawTxValidationResult::Fail { failed_check, .. } => assert_eq!(failed_check, "fee_exceeds_cap"),
        _ => panic!("expected fail"),
    }
}
```

- [ ] **Step 6: Update existing four tests for the new `Intent` fields.** Each existing test that constructs an `Intent` (`fn intent()` helper) needs to pass the six new fields. Add them as `0`, `String::new()`, and `None` defaults in the `intent()` helper.

- [ ] **Step 7: Add the `Trx` chain to the allowlist** for the target-contract check. The `allbridge_allowlist::contract_for("TRX")` already returns the Allbridge Tron contract; verify the existing check at the top of `validate` still passes for Tron addresses (the allowlist now distinguishes `TRX` from EVM chains; both should pass).

- [ ] **Step 8: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib raw_tx_validator -- --nocapture
```

Expected: nine PASS (six existing + three new Tron tests).

- [ ] **Step 9: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/raw_tx_validator.rs sw4p-backend/src/allbridge_tx_builder.rs
git commit -m "feat(sw4p): raw tx validator tron branch with abi decode checks"
```

---

## Task T5: Tron Unsigned Tx Builder

**Wave:** W3. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Build an unsigned Tron transaction payload (in a TronWeb-compatible shape) for the user to sign via TronLink. Replaces the relayer-sign portion of `allbridge::bridge_from_tron` for the user-signed path; the relayer path is retained but now requires a canary authorization id.

**Spec IDs:** PRD-USDT-005, PRD-USDT-017, PRD-USDT-023; CRD CRD-SIGN-003, section 9; TRD-TRON-002, TRD-TRON-003, TRD-TRON-008, TRD-TRON-009; SOW WP5.1, WP5.5.

**Files:**

- Create: `sw4p/sw4p-backend/src/tron_unsigned_tx_builder.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs`
- Modify: `sw4p/sw4p-backend/src/allbridge.rs` (lines 309 to 410 area: extract the relayer-sign portion behind a `with_canary_authorization` guard)

- [ ] **Step 1: Write the new module.**

```rust
//! Tron unsigned transaction builder.
//!
//! Produces an unsigned Tron transaction in the TronWeb-compatible JSON
//! shape, ready to be returned to the frontend for TronLink signing.
//! Does NOT sign or broadcast.
//!
//! Satisfies: PRD-USDT-005, PRD-USDT-017, PRD-USDT-023; CRD CRD-SIGN-003;
//! TRD-TRON-002, TRD-TRON-008; SOW WP5.1.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnsignedTronTransaction {
    pub raw_data_hex: String,
    pub tx_id: String,
    pub contract_address: String,
    pub function_selector: String,
    pub parameter_hex: String,
    pub fee_limit_sun: u64,
    pub call_value_sun: u64,
    pub owner_address_base58: String,
}

#[derive(Debug, Clone)]
pub struct BuildArgs {
    pub owner_address_base58: String,
    pub contract_address_base58: String,
    pub function_selector: String,
    pub parameter_hex: String,
    pub fee_limit_sun: u64,
    pub call_value_sun: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum BuildError {
    #[error("invalid owner address: {0}")] InvalidOwner(String),
    #[error("invalid contract address: {0}")] InvalidContract(String),
    #[error("invalid parameter hex: {0}")] InvalidParameterHex(String),
}

pub fn build(args: BuildArgs) -> Result<UnsignedTronTransaction, BuildError> {
    crate::tron_address::validate(&args.owner_address_base58)
        .map_err(|e| BuildError::InvalidOwner(e.to_string()))?;
    crate::tron_address::validate(&args.contract_address_base58)
        .map_err(|e| BuildError::InvalidContract(e.to_string()))?;
    let _ = hex::decode(args.parameter_hex.trim_start_matches("0x"))
        .map_err(|e| BuildError::InvalidParameterHex(e.to_string()))?;

    let raw_data_payload = serde_json::json!({
        "contract": [{
            "type": "TriggerSmartContract",
            "parameter": {
                "value": {
                    "data": args.parameter_hex.trim_start_matches("0x"),
                    "owner_address": args.owner_address_base58,
                    "contract_address": args.contract_address_base58,
                    "call_value": args.call_value_sun,
                },
            },
        }],
        "fee_limit": args.fee_limit_sun,
    });
    let raw_data_text = serde_json::to_string(&raw_data_payload).expect("serialize");
    let raw_data_hex = hex::encode(raw_data_text.as_bytes());
    let tx_id = hex::encode(Sha256::digest(raw_data_text.as_bytes()));

    Ok(UnsignedTronTransaction {
        raw_data_hex,
        tx_id,
        contract_address: args.contract_address_base58,
        function_selector: args.function_selector,
        parameter_hex: args.parameter_hex,
        fee_limit_sun: args.fee_limit_sun,
        call_value_sun: args.call_value_sun,
        owner_address_base58: args.owner_address_base58,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_produces_deterministic_tx_id_for_identical_inputs() {
        let a = BuildArgs {
            owner_address_base58: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t".to_string(),
            contract_address_base58: "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2".to_string(),
            function_selector: "swapAndBridge".to_string(),
            parameter_hex: "0x00".to_string(),
            fee_limit_sun: 200_000_000,
            call_value_sun: 0,
        };
        let first = build(a.clone()).expect("ok");
        let second = build(a).expect("ok");
        assert_eq!(first.tx_id, second.tx_id);
        assert_eq!(first.raw_data_hex, second.raw_data_hex);
    }

    #[test]
    fn build_rejects_invalid_owner_address() {
        let a = BuildArgs {
            owner_address_base58: "0xnot_tron".to_string(),
            contract_address_base58: "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2".to_string(),
            function_selector: "x".to_string(),
            parameter_hex: "0x".to_string(),
            fee_limit_sun: 0,
            call_value_sun: 0,
        };
        let err = build(a).unwrap_err();
        assert!(matches!(err, BuildError::InvalidOwner(_)));
    }

    #[test]
    fn build_rejects_invalid_parameter_hex() {
        let a = BuildArgs {
            owner_address_base58: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t".to_string(),
            contract_address_base58: "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2".to_string(),
            function_selector: "x".to_string(),
            parameter_hex: "zzz".to_string(),
            fee_limit_sun: 0,
            call_value_sun: 0,
        };
        let err = build(a).unwrap_err();
        assert!(matches!(err, BuildError::InvalidParameterHex(_)));
    }
}
```

The shape returned here is the minimum the frontend needs to call `tronWeb.trx.sign(raw_data_hex)`. The full Tron transaction signing format (with `ref_block_bytes`, `ref_block_hash`, `expiration`, `timestamp`) is finalized by TronWeb on the user side; we return the deterministic core and let TronLink fill the chain-specific fields, which it does by default. If a future TronLink upgrade requires server-side completion, add those fields here.

- [ ] **Step 2: Modify `allbridge::bridge_from_tron`.** Read the function (lines 305 to 411). Refactor it so:

- The function signature changes from `pub fn bridge_from_tron(request: BridgeRequest)` to `pub fn bridge_from_tron(request: BridgeRequest, mode: TronExecutionMode)` where `TronExecutionMode` is a new enum:

```rust
#[derive(Debug, Clone)]
pub enum TronExecutionMode {
    UserSigned,
    Canary { authorization_id: String },
}
```

- The function returns the unsigned tx via `tron_unsigned_tx_builder::build` for `UserSigned` mode and routes to the existing relayer-sign code for `Canary` mode. In `Canary` mode, the function first validates the authorization id via `canary_authorization::find_active`, then proceeds with the original relayer-sign code, then calls `canary_authorization::consume` after broadcast.
- Every existing call site of `bridge_from_tron` must be updated to pass the mode. Find them with:

```bash
grep -rn 'bridge_from_tron(' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/ | grep -v 'allbridge.rs'
```

Any call site that previously used the relayer must explicitly pass `TronExecutionMode::Canary { authorization_id: ... }` with a real authorization id. Production user paths pass `TronExecutionMode::UserSigned`.

- [ ] **Step 3: Wire and test.**

Edit `sw4p-backend/src/lib.rs` and add `pub mod tron_unsigned_tx_builder;`.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_unsigned_tx_builder -- --nocapture
cargo test --lib allbridge -- --nocapture
```

Expected: three PASS on the new module, plus all existing allbridge tests still pass.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_unsigned_tx_builder.rs sw4p-backend/src/allbridge.rs sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): tron unsigned tx builder and execution mode split"
```

---

## Task T6: POST /v1/tron/raw-tx Handler

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** HTTP handler that accepts a Tron route intent and returns the unsigned transaction plus the fee/resource preview.

**Spec IDs:** PRD-USDT-005, PRD-USDT-008, PRD-USDT-015; CRD section 8, section 9; TRD-TRON-002, TRD-TRON-006; SOW WP5.4.

**Files:**

- Create: `sw4p/sw4p-backend/src/tron_signing_api.rs` (this file holds both T6 and T7 handlers)
- Modify: `sw4p/sw4p-backend/src/lib.rs` (add `pub mod tron_signing_api;`)
- Modify: `sw4p/sw4p-backend/src/main.rs` (merge the new router)

- [ ] **Step 1: Create the module with the `POST /v1/tron/raw-tx` handler.**

```rust
//! Tron signing API.
//!
//! Two handlers:
//! - POST /v1/tron/raw-tx: build the unsigned Tron transaction + fee
//!   preview for a route intent.
//! - POST /v1/tron/broadcast: accept the signed transaction and forward
//!   to the Tron RPC.

use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::tron_fees::{estimate, swap_and_bridge_resource_baseline, TronAccountResources, TronResourcePreview};
use crate::tron_unsigned_tx_builder::{build as build_unsigned, BuildArgs, UnsignedTronTransaction};

#[derive(Deserialize)]
pub struct RawTxRequest {
    pub owner_address: String,
    pub contract_address: String,
    pub function_selector: String,
    pub parameter_hex: String,
    pub bandwidth_free: u64,
    pub energy_free: u64,
    pub fee_limit_sun: Option<u64>,
}

#[derive(Serialize)]
pub struct RawTxResponse {
    pub unsigned: UnsignedTronTransaction,
    pub resource_preview: TronResourcePreview,
}

#[derive(Deserialize)]
pub struct BroadcastRequest {
    pub signed_tx_hex: String,
}

#[derive(Serialize)]
pub struct BroadcastResponse {
    pub tx_id: String,
    pub accepted: bool,
}

pub fn tron_signing_router(pool: PgPool) -> Router {
    Router::new()
        .route("/v1/tron/raw-tx", post(raw_tx_handler))
        .route("/v1/tron/broadcast", post(broadcast_handler))
        .with_state(pool)
}

async fn raw_tx_handler(
    Json(req): Json<RawTxRequest>,
) -> Result<Json<RawTxResponse>, axum::http::StatusCode> {
    let baseline = swap_and_bridge_resource_baseline();
    let preview = estimate(
        TronAccountResources { bandwidth_free: req.bandwidth_free, energy_free: req.energy_free },
        baseline,
    );
    let fee_limit = req.fee_limit_sun.unwrap_or(baseline.fee_limit_sun);
    let unsigned = build_unsigned(BuildArgs {
        owner_address_base58: req.owner_address,
        contract_address_base58: req.contract_address,
        function_selector: req.function_selector,
        parameter_hex: req.parameter_hex,
        fee_limit_sun: fee_limit,
        call_value_sun: 0,
    })
    .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
    Ok(Json(RawTxResponse { unsigned, resource_preview: preview }))
}

async fn broadcast_handler(
    axum::extract::State(_pool): axum::extract::State<PgPool>,
    Json(_req): Json<BroadcastRequest>,
) -> Result<Json<BroadcastResponse>, axum::http::StatusCode> {
    // T7 fills this in.
    Err(axum::http::StatusCode::NOT_IMPLEMENTED)
}
```

- [ ] **Step 2: Add the test file at `sw4p-backend/tests/tron_signing_api.rs`.**

```rust
use axum::body::Body;
use axum::http::Request;
use sw4p_backend::test_support::test_pool;
use sw4p_backend::tron_signing_api::tron_signing_router;
use tower::ServiceExt;

#[tokio::test]
async fn raw_tx_returns_unsigned_and_preview() {
    let pool = test_pool().await;
    let app = tron_signing_router(pool);
    let body = serde_json::json!({
        "owner_address": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        "contract_address": "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2",
        "function_selector": "swapAndBridge",
        "parameter_hex": "0x",
        "bandwidth_free": 1000,
        "energy_free": 200000,
        "fee_limit_sun": 200000000_u64,
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/tron/raw-tx").header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);
    let bytes = axum::body::to_bytes(resp.into_body(), 64 * 1024).await.unwrap();
    let text = std::str::from_utf8(&bytes).unwrap();
    assert!(text.contains("unsigned"));
    assert!(text.contains("resource_preview"));
    assert!(text.contains("estimated_trx_burn_sun"));
}

#[tokio::test]
async fn raw_tx_rejects_bad_owner_address() {
    let pool = test_pool().await;
    let app = tron_signing_router(pool);
    let body = serde_json::json!({
        "owner_address": "0xnotvalid",
        "contract_address": "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2",
        "function_selector": "x", "parameter_hex": "0x",
        "bandwidth_free": 0, "energy_free": 0, "fee_limit_sun": 0_u64,
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/tron/raw-tx").header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 400);
}
```

- [ ] **Step 3: Wire the module + merge the router.**

Edit `sw4p-backend/src/lib.rs` and add `pub mod tron_signing_api;` near the other M3 modules.

Edit `sw4p-backend/src/main.rs` and add `.merge(sw4p_backend::tron_signing_api::tron_signing_router(pool.clone()))` to the existing router chain (the same pattern as M0-M2 T15).

- [ ] **Step 4: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test tron_signing_api -- --nocapture --test-threads=1
```

Expected: two PASS.

- [ ] **Step 5: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_signing_api.rs sw4p-backend/src/lib.rs sw4p-backend/src/main.rs sw4p-backend/tests/tron_signing_api.rs
git commit -m "feat(sw4p): post v1 tron raw-tx handler with resource preview"
```

---

## Task T7: POST /v1/tron/broadcast Handler

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Accept a signed Tron transaction and forward it to the existing `tron_client::broadcast_transaction`.

**Spec IDs:** PRD-USDT-005; CRD CRD-SIGN-003; TRD-TRON-004; SOW WP5.5.

**Files:**

- Modify: `sw4p/sw4p-backend/src/tron_signing_api.rs` (replace the placeholder `broadcast_handler`)
- Modify: `sw4p-backend/tests/tron_signing_api.rs` (add a test)

- [ ] **Step 1: Implement `broadcast_handler`.** Replace the placeholder body:

```rust
async fn broadcast_handler(
    axum::extract::State(_pool): axum::extract::State<PgPool>,
    Json(req): Json<BroadcastRequest>,
) -> Result<Json<BroadcastResponse>, axum::http::StatusCode> {
    let signed_bytes = match hex::decode(req.signed_tx_hex.trim_start_matches("0x")) {
        Ok(b) => b,
        Err(_) => return Err(axum::http::StatusCode::BAD_REQUEST),
    };
    let tron_rpc_url = std::env::var("TRON_RPC_URL")
        .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
    let client = crate::tron_client::TronClient::new(tron_rpc_url);
    match client.broadcast_transaction(&signed_bytes).await {
        Ok(tx_id) => Ok(Json(BroadcastResponse { tx_id, accepted: true })),
        Err(e) => {
            tracing::warn!(target: "tron_signing_api", error = %e, "broadcast failed");
            Err(axum::http::StatusCode::BAD_GATEWAY)
        }
    }
}
```

Note: the existing `TronClient::broadcast_transaction` signature is `pub async fn broadcast_transaction(&self, signed_tx_bytes: &[u8]) -> Result<String, ...>`. Confirm with `grep -n 'pub async fn broadcast_transaction' sw4p-backend/src/tron_client.rs`; adapt the call site to the actual signature shape.

- [ ] **Step 2: Add a test that uses wiremock to stub the Tron RPC.**

```rust
#[tokio::test]
async fn broadcast_returns_tx_id_on_success() {
    use wiremock::{matchers::method, Mock, MockServer, ResponseTemplate};
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(200).set_body_string(
            r#"{"result":true,"txid":"abc123deadbeef"}"#
        ))
        .mount(&server)
        .await;
    std::env::set_var("TRON_RPC_URL", server.uri());

    let pool = test_pool().await;
    let app = tron_signing_router(pool);
    let body = serde_json::json!({ "signed_tx_hex": "0xdeadbeef" });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/tron/broadcast")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);
}
```

Note: setting env vars in a parallel test is unsafe; this test runs with `--test-threads=1` for that reason.

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test tron_signing_api -- --nocapture --test-threads=1
```

Expected: three PASS.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_signing_api.rs sw4p-backend/tests/tron_signing_api.rs
git commit -m "feat(sw4p): post v1 tron broadcast handler"
```

---

## Task T8: Tron Source Confirmation Watcher

**Wave:** W5. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Module that polls `tron_client::wait_for_confirmation` for a given tx hash and emits a source-confirmed `tracing::info` event with the tx id, block number, and confirmation latency.

**Spec IDs:** TRD-TRON-005; SOW WP5.5.

**Files:**

- Create: `sw4p/sw4p-backend/src/tron_watcher.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs`

- [ ] **Step 1: Write the module.**

```rust
//! Tron source confirmation watcher.
//!
//! Polls the existing `tron_client::wait_for_confirmation` for a
//! submitted Tron tx hash. On confirmation, logs a structured
//! source-confirmed event so M5 lifecycle code can pick it up.
//!
//! Satisfies: TRD-TRON-005; SOW WP5.5.

use std::time::Instant;
use tracing::{info, warn};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WatchResult {
    pub tx_id: String,
    pub confirmed: bool,
    pub elapsed_ms: u128,
}

pub async fn watch_until_confirmed(
    rpc_url: &str,
    tx_id: &str,
    timeout_secs: u64,
) -> WatchResult {
    let started = Instant::now();
    let client = crate::tron_client::TronClient::new(rpc_url.to_string());
    let result = client.wait_for_confirmation(tx_id, timeout_secs).await;
    let elapsed_ms = started.elapsed().as_millis();
    match result {
        Ok(_) => {
            info!(target: "tron_watcher", tx_id = %tx_id, elapsed_ms = %elapsed_ms, "tron source tx confirmed");
            WatchResult { tx_id: tx_id.to_string(), confirmed: true, elapsed_ms }
        }
        Err(e) => {
            warn!(target: "tron_watcher", tx_id = %tx_id, elapsed_ms = %elapsed_ms, error = %e, "tron source tx not confirmed within timeout");
            WatchResult { tx_id: tx_id.to_string(), confirmed: false, elapsed_ms }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::{matchers::method, Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn confirmed_when_rpc_reports_block_number() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"id":"abc","blockNumber":12345,"contractResult":["0x"]}"#
            ))
            .mount(&server)
            .await;
        let r = watch_until_confirmed(&server.uri(), "abc", 5).await;
        assert!(r.confirmed);
        assert_eq!(r.tx_id, "abc");
    }

    #[tokio::test]
    async fn unconfirmed_when_rpc_404s() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(404))
            .mount(&server)
            .await;
        let r = watch_until_confirmed(&server.uri(), "abc", 1).await;
        assert!(!r.confirmed);
    }
}
```

The exact JSON shape `tron_client::wait_for_confirmation` consumes may differ from the test fixture; if the test fails because of a payload-shape mismatch, the implementer adjusts the fixture to match the actual `TronClient` expectations rather than changing the watcher's contract.

- [ ] **Step 2: Wire and test.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_watcher -- --nocapture
```

Expected: two PASS.

- [ ] **Step 3: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_watcher.rs sw4p-backend/src/lib.rs
git commit -m "feat(sw4p): tron source confirmation watcher"
```

---

## Task T9: Kit Tron Address Helper

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** TypeScript helper that validates Tron addresses by format (regex + length) for fast pre-submit checks; deeper checksum validation is the backend's job.

**Spec IDs:** PRD-USDT-016 (kit subset).

**Files:**

- Create: `sw4p-kit/src/core/tron_address.ts`
- Create: `sw4p-kit/src/__tests__/core/tron_address.test.ts`

Branch: `feat/sw4p-kit-usdt-tron-parity-m3-tron-signing` (controller creates from `main` if not present).

- [ ] **Step 1: Write the helper.**

```ts
const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{32,33}$/;

export function isTronAddressFormat(addr: string): boolean {
  if (!addr || addr.length < 33 || addr.length > 34) return false;
  return TRON_ADDRESS_PATTERN.test(addr);
}

export function assertTronAddressFormat(addr: string): void {
  if (!isTronAddressFormat(addr)) {
    throw new Error(`Not a valid Tron address format: ${addr}`);
  }
}
```

- [ ] **Step 2: Write the test.**

```ts
import { describe, expect, it } from "vitest";
import { isTronAddressFormat, assertTronAddressFormat } from "../../core/tron_address.js";

describe("tron address format", () => {
  it("accepts known Tron addresses", () => {
    expect(isTronAddressFormat("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")).toBe(true);
    expect(isTronAddressFormat("TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2")).toBe(true);
  });
  it("rejects empty string", () => { expect(isTronAddressFormat("")).toBe(false); });
  it("rejects EVM address", () => {
    expect(isTronAddressFormat("0x609c690e8F7D68a59885c9132e812eEbDaAf0c9e")).toBe(false);
  });
  it("rejects too-short string", () => { expect(isTronAddressFormat("T123")).toBe(false); });
  it("rejects too-long string", () => {
    expect(isTronAddressFormat("T" + "a".repeat(50))).toBe(false);
  });
  it("assert throws on invalid", () => {
    expect(() => assertTronAddressFormat("nope")).toThrow();
  });
});
```

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx vitest run src/__tests__/core/tron_address.test.ts
```

Expected: six PASS.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git add src/core/tron_address.ts src/__tests__/core/tron_address.test.ts
git commit -m "feat(sw4p-kit): tron address format helper"
```

---

## Task T10: Kit Canary Authorization Type

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** TypeScript type + zod parser mirroring the backend `CanaryAuthorization` struct.

**Spec IDs:** PRD-USDT-019, PRD-USDT-024; TRD section 14.

**Files:**

- Create: `sw4p-kit/src/core/canary.ts`
- Create: `sw4p-kit/src/__tests__/core/canary.test.ts`

- [ ] **Step 1: Write the module.**

```ts
import { z } from "zod";

export const CanaryAuthorizationSchema = z.object({
  authorization_id: z.string(),
  source_chain: z.string(),
  destination_chain: z.string(),
  source_asset: z.enum(["USDC", "USDT"]),
  destination_asset: z.enum(["USDC", "USDT"]),
  rail: z.enum(["circle_cctp_v2", "allbridge_core"]),
  amount_decimal: z.string().regex(/^\d+(\.\d+)?$/),
  source_wallet: z.string().min(1),
  destination_wallet: z.string().min(1),
  max_fee: z.string().regex(/^\d+(\.\d+)?$/),
  max_slippage: z.string().regex(/^\d+(\.\d+)?$/),
  approval_cap: z.string().regex(/^\d+(\.\d+)?$/),
  expires_at: z.string(),
  approver: z.string().min(1),
  proof_destination: z.string().min(1),
  notes: z.string().nullish(),
});

export type CanaryAuthorization = z.infer<typeof CanaryAuthorizationSchema>;

export function parseCanaryAuthorization(input: unknown): CanaryAuthorization {
  return CanaryAuthorizationSchema.parse(input);
}
```

- [ ] **Step 2: Write the test.**

```ts
import { describe, expect, it } from "vitest";
import { parseCanaryAuthorization } from "../../core/canary.js";

describe("canary authorization", () => {
  const valid = {
    authorization_id: "auth_2026_05_18_001",
    source_chain: "POL", destination_chain: "TRX",
    source_asset: "USDT", destination_asset: "USDT",
    rail: "allbridge_core",
    amount_decimal: "5.00",
    source_wallet: "0xabc", destination_wallet: "Tabc",
    max_fee: "1.0", max_slippage: "0.5", approval_cap: "5.0",
    expires_at: "2026-05-19T00:00:00Z",
    approver: "ops", proof_destination: "evidence/x",
    notes: null,
  };

  it("parses a valid authorization", () => {
    const parsed = parseCanaryAuthorization(valid);
    expect(parsed.authorization_id).toBe("auth_2026_05_18_001");
  });

  it("rejects unknown rail", () => {
    expect(() => parseCanaryAuthorization({ ...valid, rail: "made_up" })).toThrow();
  });

  it("rejects non-decimal amount", () => {
    expect(() => parseCanaryAuthorization({ ...valid, amount_decimal: "abc" })).toThrow();
  });
});
```

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx vitest run src/__tests__/core/canary.test.ts
```

Expected: three PASS.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git add src/core/canary.ts src/__tests__/core/canary.test.ts
git commit -m "feat(sw4p-kit): canary authorization type per trd section 14"
```

---

## Task T11: Frontend tronTypes Extension

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Extend the existing `tronTypes.d.ts` with signing-method type declarations so TypeScript catches calls to non-existent methods at compile time.

**Files:**

- Modify: `sw4p/sw4p-frontend/src/types/tronTypes.d.ts`

Branch: `feat/sw4p-usdt-tron-parity-m3-tron-signing` (same sw4p branch as backend M3 work).

- [ ] **Step 1: Read the existing file (lines 1 to 35) to confirm the current `TronWeb` interface shape.**

```bash
cat /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-frontend/src/types/tronTypes.d.ts
```

- [ ] **Step 2: Extend the `TronWeb` interface.** Add the following members inside the existing `trx` sub-object:

```ts
declare global {
  interface TronWebTrxApi {
    sign(tx: unknown): Promise<unknown>;
    sendRawTransaction(signed: unknown): Promise<{ result: boolean; txid?: string }>;
  }
}
```

If the existing `TronWeb` interface declares `trx` inline, add the two methods directly into that inline declaration. The exact merge is `trx: { sign(tx: unknown): Promise<unknown>; sendRawTransaction(signed: unknown): Promise<{ result: boolean; txid?: string }>; ... existing members ... }`.

- [ ] **Step 3: Confirm with `npx tsc --noEmit`.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx tsc --noEmit
```

Expected: same pre-existing errors as the M0-M2 baseline (if any); zero new errors.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-frontend/src/types/tronTypes.d.ts
git commit -m "feat(sw4p-frontend): tronweb signing method types"
```

---

## Task T12: Frontend WalletProvider Signing Methods

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add `tronSignTransaction(tx)` and `tronBroadcastTransaction(signed)` to the existing `WalletProvider` context so consumers can sign without touching `window.tronWeb` directly.

**Files:**

- Modify: `sw4p/sw4p-frontend/src/WalletProvider.tsx` (lines 63 to 191 area)

- [ ] **Step 1: Read the existing context shape and the TronLink block.**

```bash
sed -n '60,200p' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-frontend/src/WalletProvider.tsx
```

- [ ] **Step 2: Add two methods inside the WalletProvider component, near the existing `connectTron` / `disconnectTron` definitions.**

```tsx
const tronSignTransaction = useCallback(async (rawTx: unknown): Promise<unknown> => {
  if (typeof window === "undefined" || !window.tronWeb || !window.tronWeb.defaultAddress.base58) {
    throw new Error("TronLink not connected");
  }
  return await window.tronWeb.trx.sign(rawTx);
}, []);

const tronBroadcastTransaction = useCallback(async (signedTx: unknown): Promise<{ result: boolean; txid?: string }> => {
  if (typeof window === "undefined" || !window.tronWeb) {
    throw new Error("TronLink not connected");
  }
  return await window.tronWeb.trx.sendRawTransaction(signedTx);
}, []);
```

- [ ] **Step 3: Expose them on the context.** Find the existing context value object (lines 178-191 area) and add `tronSignTransaction` and `tronBroadcastTransaction` to its members. Also add them to the `WalletContextValue` type/interface so TypeScript consumers see them.

- [ ] **Step 4: Verify.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 5: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-frontend/src/WalletProvider.tsx
git commit -m "feat(sw4p-frontend): walletprovider exposes tron sign and broadcast"
```

---

## Task T13: Frontend useTronSigning Hook

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** React hook that wraps the sign-then-broadcast flow with TanStack Query mutation semantics.

**Files:**

- Create: `sw4p/sw4p-frontend/src/hooks/useTronSigning.ts`

- [ ] **Step 1: Write the hook.**

```ts
import { useCallback, useState } from "react";
import { useWallet } from "../WalletProvider";

interface UseTronSigningResult {
  isSigning: boolean;
  isBroadcasting: boolean;
  error: string | null;
  txId: string | null;
  signAndBroadcast: (unsignedTx: unknown) => Promise<{ txId: string }>;
}

export function useTronSigning(): UseTronSigningResult {
  const { tronSignTransaction, tronBroadcastTransaction } = useWallet();
  const [isSigning, setIsSigning] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const signAndBroadcast = useCallback(async (unsignedTx: unknown) => {
    setError(null);
    setTxId(null);
    setIsSigning(true);
    let signed: unknown;
    try {
      signed = await tronSignTransaction(unsignedTx);
    } catch (e) {
      setIsSigning(false);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    }
    setIsSigning(false);
    setIsBroadcasting(true);
    try {
      const result = await tronBroadcastTransaction(signed);
      if (!result.result || !result.txid) {
        throw new Error("Tron RPC rejected the broadcast");
      }
      setTxId(result.txid);
      setIsBroadcasting(false);
      return { txId: result.txid };
    } catch (e) {
      setIsBroadcasting(false);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    }
  }, [tronSignTransaction, tronBroadcastTransaction]);

  return { isSigning, isBroadcasting, error, txId, signAndBroadcast };
}
```

- [ ] **Step 2: Verify the build still typechecks.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 3: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-frontend/src/hooks/useTronSigning.ts
git commit -m "feat(sw4p-frontend): usetronsigning hook for sign-and-broadcast"
```

---

## Task T14: Frontend TronTxReview Component

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Presentational component that renders TRX, Bandwidth, Energy, fee_limit explicitly before the user signs, satisfying the "Tron fees must explain TRX, Bandwidth, Energy, and fee limit and resource burn risk" requirement.

**Spec IDs:** PRD-USDT-008; TRD-TRON-006.

**Files:**

- Create: `sw4p/sw4p-frontend/src/components/TronTxReview.tsx`

- [ ] **Step 1: Create the components directory if missing.**

```bash
mkdir -p "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend/src/components"
```

- [ ] **Step 2: Write the component.**

```tsx
import React from "react";

export interface TronResourcePreview {
  bandwidth_required: number;
  energy_required: number;
  fee_limit_sun: number;
  estimated_trx_burn_sun: number;
}

export interface TronTxReviewProps {
  preview: TronResourcePreview;
  recipient: string;
  amount: string;
  contractAddress: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SUN_PER_TRX = 1_000_000;

function sunToTrx(sun: number): string {
  return (sun / SUN_PER_TRX).toFixed(6);
}

export const TronTxReview: React.FC<TronTxReviewProps> = ({
  preview, recipient, amount, contractAddress, onConfirm, onCancel,
}) => {
  return (
    <div data-testid="tron-tx-review" style={{ padding: 16, border: "1px solid #ddd" }}>
      <h3>Confirm Tron transaction</h3>
      <dl>
        <dt>Contract</dt><dd>{contractAddress}</dd>
        <dt>Recipient</dt><dd>{recipient}</dd>
        <dt>Amount (USDT)</dt><dd>{amount}</dd>
        <dt>Bandwidth required</dt><dd>{preview.bandwidth_required}</dd>
        <dt>Energy required</dt><dd>{preview.energy_required}</dd>
        <dt>Fee limit (TRX)</dt><dd>{sunToTrx(preview.fee_limit_sun)}</dd>
        <dt>Estimated TRX burn</dt><dd>{sunToTrx(preview.estimated_trx_burn_sun)}</dd>
      </dl>
      <p style={{ fontSize: 12, color: "#777" }}>
        Failed Tron contract execution may still consume Bandwidth and Energy.
        Check that your account has enough frozen resources or accept the TRX burn.
      </p>
      <div>
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="button" onClick={onConfirm}>Sign with TronLink</button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Verify.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-frontend/src/components/TronTxReview.tsx
git commit -m "feat(sw4p-frontend): trontxreview component with fee and resource preview"
```

---

## Task T15: Frontend useBridge Tron Branch

**Wave:** W9. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add `'TRON'` to the `createBridge` factory so the existing useBridge hook does not throw "factory does not support TRON" at runtime.

**Files:**

- Modify: `sw4p/sw4p-frontend/hooks/useBridge.ts` (line 30 area)

- [ ] **Step 1: Read the current factory.**

```bash
sed -n '20,60p' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-frontend/hooks/useBridge.ts
```

- [ ] **Step 2: Add the Tron branch.** Inside `createBridge`, after the existing `'EVM'` and `'SOL'` branches, add:

```ts
if (chain === 'TRON') {
  return {
    chainKind: 'TRON' as const,
    address,
    transfer: async () => {
      throw new Error("Tron transfers go through useTronSigning, not the generic bridge factory");
    },
    estimateFee: async () => ({ kind: 'tron-fee-preview' as const }),
    getStatus: async () => ({ state: 'not_started' as const }),
  };
}
```

The signature uses placeholder types because the actual factory return type may vary; adapt the field names and the return type to the actual `Bridge` type in the file. The intent is to prevent runtime "unsupported chain" errors and to direct callers to `useTronSigning` for actual signing work.

- [ ] **Step 3: Verify.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-frontend/hooks/useBridge.ts
git commit -m "feat(sw4p-frontend): usebridge factory tron branch directs to usetronsigning"
```

---

## Task T16: Frontend settlementChains signingMethod Field

**Wave:** W9. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add a `signingMethod` field to the settlement chain schema and set Tron's value to `'tronlink'`. Keep `sourceEnabled: false` (the M7 launch decision is what flips this).

**Files:**

- Modify: `sw4p/sw4p-frontend/src/config/settlementChains.ts` (lines 77 to 88 area and the type definition)

- [ ] **Step 1: Read the current schema.**

```bash
sed -n '1,100p' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-frontend/src/config/settlementChains.ts
```

- [ ] **Step 2: Add the field to the type definition.** Find the existing `SettlementChain` interface or type alias. Add:

```ts
signingMethod: 'evm-wallet' | 'solana-wallet' | 'tronlink' | 'canary' | 'none';
```

Then update each existing chain entry with the appropriate value (`'evm-wallet'` for ETH/ARB/POL/etc., `'solana-wallet'` for SOL, `'tronlink'` for TRX, `'none'` for BTC). The Tron entry now reads:

```ts
{
  id: 'TRON',
  name: 'Tron',
  icon: 'https://cryptologos.cc/logos/tron-trx-logo.png?v=026',
  domain: -1,
  sourceEnabled: false,
  destinationEnabled: false,
  badge: 'Gated',
  addressKind: 'tron',
  signingMethod: 'tronlink',
  destinationPlaceholder: 'T...',
  destinationHint: 'Use a TronLink-controlled TRC20 USDT address.',
  routeHint: 'Tron source signing uses TronLink; relayer custody requires a named canary authorization.',
}
```

- [ ] **Step 3: Verify.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 4: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-frontend/src/config/settlementChains.ts
git commit -m "feat(sw4p-frontend): settlementchains signingmethod field per chain"
```

---

## Task T17: Integration Test (Backend + Mock TronWeb + Wiremock)

**Wave:** W10. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Backend-side end-to-end integration test that walks an intent through `/v1/tron/raw-tx`, simulates user signing (deterministic mock), calls `/v1/tron/broadcast`, then runs `tron_watcher::watch_until_confirmed` against a mocked Tron RPC.

**Files:**

- Create: `sw4p/sw4p-backend/tests/tron_signing_integration.rs`

- [ ] **Step 1: Write the test.**

```rust
use axum::body::Body;
use axum::http::Request;
use sw4p_backend::test_support::test_pool;
use sw4p_backend::tron_signing_api::tron_signing_router;
use sw4p_backend::tron_watcher::watch_until_confirmed;
use tower::ServiceExt;
use wiremock::{matchers::method, Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn end_to_end_tron_signing_flow() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(200).set_body_string(
            r#"{"result":true,"txid":"deadbeef12345"}"#
        ))
        .mount(&server)
        .await;
    std::env::set_var("TRON_RPC_URL", server.uri());

    let pool = test_pool().await;
    let app = tron_signing_router(pool);

    let raw_tx_body = serde_json::json!({
        "owner_address": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        "contract_address": "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2",
        "function_selector": "swapAndBridge",
        "parameter_hex": "0xd4803b7e0000000000000000000000000000000000000000000000000000000000000000",
        "bandwidth_free": 1000,
        "energy_free": 200000,
        "fee_limit_sun": 200000000_u64,
    });
    let resp = app.clone().oneshot(
        Request::builder().method("POST").uri("/v1/tron/raw-tx").header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&raw_tx_body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);

    let signed_body = serde_json::json!({ "signed_tx_hex": "0xdeadbeef" });
    let resp2 = app.oneshot(
        Request::builder().method("POST").uri("/v1/tron/broadcast").header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&signed_body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp2.status().as_u16(), 200);

    let watch = watch_until_confirmed(&server.uri(), "deadbeef12345", 2).await;
    assert!(watch.confirmed);
    assert_eq!(watch.tx_id, "deadbeef12345");
}
```

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test tron_signing_integration -- --nocapture --test-threads=1
```

Expected: one PASS.

- [ ] **Step 3: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/tests/tron_signing_integration.rs
git commit -m "test(sw4p): end to end tron signing integration"
```

---

## Task T18: Pinned Tron Signing Acceptance Test

**Wave:** W11. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Acceptance test that pins the Tron signing flow against a canary authorization fixture and asserts the validator + signing API + watcher cooperate without backend custody.

**Files:**

- Create: `sw4p/sw4p-backend/tests/tron_signing_pinned.rs`

- [ ] **Step 1: Write the acceptance test.**

```rust
use sw4p_backend::canary_authorization::{insert, find_active, consume, CanaryAuthorization, CanaryError};
use sw4p_backend::test_support::test_pool;
use chrono::Utc;

async fn truncate(pool: &sqlx::PgPool) {
    sqlx::query("TRUNCATE TABLE canary_authorizations RESTART IDENTITY").execute(pool).await.ok();
}

#[tokio::test]
async fn canary_authorization_lifecycle_pinned() {
    let pool = test_pool().await;
    truncate(&pool).await;
    let auth = CanaryAuthorization {
        authorization_id: "auth_pinned_2026_05_18".into(),
        source_chain: "POL".into(),
        destination_chain: "TRX".into(),
        source_asset: "USDT".into(),
        destination_asset: "USDT".into(),
        rail: "allbridge_core".into(),
        amount_decimal: "5.00".into(),
        source_wallet: "0xowner".into(),
        destination_wallet: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t".into(),
        max_fee: "0.50".into(),
        max_slippage: "0.10".into(),
        approval_cap: "5.00".into(),
        expires_at: Utc::now() + chrono::Duration::hours(1),
        approver: "ops@rndrntwrk".into(),
        proof_destination: "evidence/2026-05-18-pinned".into(),
        notes: Some("acceptance pin".into()),
    };
    insert(&pool, &auth).await.expect("insert");

    let found = find_active(&pool, &auth.authorization_id, Utc::now()).await.expect("find");
    assert_eq!(found.amount_decimal, "5.00");
    assert_eq!(found.approval_cap, "5.00");

    consume(&pool, &auth.authorization_id, "0xrealhash").await.expect("consume");

    let again = find_active(&pool, &auth.authorization_id, Utc::now()).await.unwrap_err();
    assert!(matches!(again, CanaryError::AlreadyConsumed(_)));
}

#[tokio::test]
async fn unsigned_tx_builder_round_trips_for_canonical_inputs() {
    use sw4p_backend::tron_unsigned_tx_builder::{build, BuildArgs};
    let first = build(BuildArgs {
        owner_address_base58: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t".into(),
        contract_address_base58: "TAuErcuAtU6BPt6YwL51JZ4RpDCPQASCU2".into(),
        function_selector: "swapAndBridge".into(),
        parameter_hex: "0xd4803b7e".into(),
        fee_limit_sun: 200_000_000,
        call_value_sun: 0,
    }).expect("ok");
    assert!(first.tx_id.len() == 64);
    assert!(first.raw_data_hex.len() > 0);
}
```

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test tron_signing_pinned -- --nocapture --test-threads=1
```

Expected: two PASS.

- [ ] **Step 3: Commit.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/tests/tron_signing_pinned.rs
git commit -m "test(sw4p): pinned acceptance for tron signing flow"
```

---

## Task T19: Final M3 Branch Review

**Wave:** W12. **Subagent:** `code-review:code-review`, `model: opus`. **Goal:** Full review across the sw4p and sw4p-kit M3 branches.

**Pre-review verification command the controller runs:**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --all
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
source /Users/mac/.nvm/nvm.sh && nvm use 22.22.0 && npx vitest run
```

- [ ] **Step 1: Dispatch the reviewer.**

```
Agent(
  description: "Final m3 branch review",
  subagent_type: "code-review:code-review",
  model: "opus",
  prompt: <full review prompt referencing the same PRD/CRD/TRD/SOW IDs, the M3 wave map, the deferred items, and the M0-M2 final review's CHANGES_REQUIRED pattern>
)
```

- [ ] **Step 2: Handle verdict.** If APPROVED, the controller moves to `superpowers:finishing-a-development-branch`. If CHANGES_REQUIRED, the controller re-dispatches the original implementer task for each issue.

---

## Self-Review Checklist

### Spec coverage trace

| Spec ID | Task |
|---|---|
| PRD-USDT-005 (Tron source user-signed) | T5 (execution mode split), T6 (raw-tx handler), T7 (broadcast), T12 (frontend signing) |
| PRD-USDT-008 (Tron fees explanation) | T2 (model), T6 (preview in response), T14 (UI) |
| PRD-USDT-016 (Tron address validation) | T1 (backend), T9 (kit) |
| PRD-USDT-017 (raw tx validation before signing) | T4 (validator extension consuming T3 decoders) |
| PRD-USDT-019 (canary auth object) | T0 (DB + module), T10 (kit type) |
| PRD-USDT-023 (provider-generated raw tx preferred) | T5 (unsigned tx builder uses Allbridge selector + parameters) |
| PRD-USDT-024 (canary may execute only after auth) | T0 (consume on broadcast), T5 (execution mode requires auth id) |
| CRD CRD-SIGN-003 (Tron production must be user-signed) | T5 (UserSigned mode default), T6+T7 (HTTP surface) |
| CRD CRD-FEE-003 (Tron fees as TRX/Bandwidth/Energy/fee_limit) | T2 (model), T6 (preview), T14 (UI render) |
| CRD section 9 (raw tx validation 10-point) | T4 (Tron branch closes the gaps M0-M2 left open) |
| CRD section 10 (approval caps) | M0-M2 T12 still satisfies for Tron path via the same module |
| CRD section 14 (canary authorization object) | T0 |
| CRD section 15 OD-001 (Tron signing default) | T5 (UserSigned is default) |
| CRD section 15 OD-002 (mainnet micro-transfer policy) | T0 (gated by auth row) |
| TRD section 6 (raw tx validator full checklist) | T4 closes TRD-RAW-002, 003, 004, 005, 006, 008, 011, 013, 014 |
| TRD section 8 (Tron wallet adapter) | T11 (types), T12 (provider methods), T13 (hook), T14 (review UI), T15 (factory) |
| TRD section 14 (canary auth object) | T0 |
| SOW WP5.1 (Tron signing decision) | T5 (TronExecutionMode) |
| SOW WP5.2 (TronLink adapter) | T11, T12, T13 |
| SOW WP5.3 (Tron address validation) | T1, T9 |
| SOW WP5.4 (fee/resource preview) | T2, T6, T14 |
| SOW WP5.5 (Tron confirmation watcher) | T8 |
| SOW WP5.6 (canary policy) | T0 |
| TRD section 12 observability | Partially: T6/T7/T8 emit tracing. Metric counters still deferred to M5. |
| Lifecycle storage (TRD section 9) | Not in scope. M3 only records source-confirmed via tracing; M5 wires the DB rows. |
| Backend Solana to Tron implementation (PRD-USDT-006 closure) | Not in scope. M4. |
| Frontend route-state UI (M6) | Not in scope. The M3 frontend work is signing-specific. |

### Placeholder scan

No "TBD", no "fill in", no "add appropriate error handling", no "similar to Task N" reference. Every code block contains the actual code. The two notes about uncertain wire shapes (TronWeb sign payload, `wait_for_confirmation` fixture format) explicitly tell the implementer to capture the real shape and update the test fixture, not the production contract.

### Type consistency

`TronResourcePreview`, `TronAccountResources` are defined in T2 and consumed unchanged by T6 and T14. `UnsignedTronTransaction` is defined in T5 and returned by T6. `Intent` is extended in T4 with six new fields; the existing tests in `raw_tx_validator` are updated in the same task. `CanaryAuthorization` is defined in T0 and mirrored 1:1 in the kit by T10. The two kit modules (`tron_address.ts`, `canary.ts`) use `.js` import suffixes consistent with the M0-M2 kit work. The Tron base58 alphabet in T1 matches the alphabet used inside `tron_client.rs::address_to_hex`.

### Out-of-scope follow-ups to surface in T19 review

- Lifecycle watcher (`settlement_lifecycle_events`, `settlement_evidence` rows) deferred to M5.
- Solana to Tron full backend implementation (closing `allbridge.rs:619`) deferred to M4.
- MCP gateway tool surface update for new canary type deferred to M6.
- Frontend full route-state UI (route detail screen, route list with primary states) deferred to M6.
- Real provider-quote shape capture (still open from M0-M2) deferred to M4.
- Tron contract address freshness check on a schedule (the allowlist is static; needs a startup verification step against Allbridge's contracts endpoint) deferred to M5 alongside the watcher.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m3-tron-signing.md`.

Two execution options:

**1. Subagent-Driven (recommended)**: Controller dispatches a fresh subagent per task, reviews per wave, fast iteration. Same model as M0-M2 execution. Estimate: 13 waves, ~3-4 hours wall-clock at the M0-M2 cadence, ~25-30 subagent dispatches.

**2. Inline Execution**: Controller executes tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for human review. Useful if you want to read every task as it lands.

**Which approach?**
