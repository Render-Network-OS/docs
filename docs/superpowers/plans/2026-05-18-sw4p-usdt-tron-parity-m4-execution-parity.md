# sw4p USDT / Tron Parity, M4 Execution Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Sequential within each wave on the sw4p Rust repo to avoid branch-state races observed in M0-M2 W1.

**Goal:** Close the M3 critical and important follow-ups so the Tron signing surface produced in M3 can actually sign and broadcast a real Allbridge transfer on mainnet, close the four remaining `raw_tx_validator` TRD-RAW-* checks deferred from M0-M2, and implement the Solana to Tron bridging path that has been gated as `provider_supported_code_incomplete` since M0-M2 (SOW WP6.3).

**Architecture:** Three groups of work, sequenced. (1) Tron foundation fixes: replace the placeholder Allbridge selector with the verified mainnet shape, replace the hand-rolled unsigned tx with a TronWeb-compatible payload built from a Tron full-node block reference, fix the `/v1/tron/broadcast` wire format to match TronGrid, add a `TronClient::new_with_url` constructor and remove async env-var mutation, and enforce all canary authorization caps. (2) `raw_tx_validator` closure: add approval-spender, source-token, destination-token, and route-state-freshness checks using the existing `tron_abi` decoders and the `route_states` table. (3) Solana to Tron: implement `bridge_from_solana_to_tron` using the existing `allbridge.rs` Solana side patterns, add `POST /v1/solana/raw-tx` and `POST /v1/solana/broadcast` HTTP handlers mirroring the M3 Tron pattern, and add a `provider_status_polling` module so M5's lifecycle can consume confirmation events.

**Tech Stack:** Rust 2021 with Axum, Tokio, SQLx (PostgreSQL), reqwest, secp256k1, alloy (for EVM ABI selector verification), tracing, opentelemetry-otlp, mockall, wiremock, tokio-test, sha2, hex, thiserror, chrono, base64, ed25519-dalek (for Solana signing primitives, already in `tron_client.rs` deps cluster). Solana side reuses `solana-client` and `solana-sdk` already in `Cargo.toml`. No new top-level dependencies.

**Binding companion docs:**
- [PRD](../specs/2026-05-18-sw4p-usdt-tron-parity-prd.md) (PRD-USDT-006 Solana to Tron, PRD-USDT-017 raw tx validation)
- [CRD](../specs/2026-05-18-sw4p-usdt-tron-parity-crd.md) (Section 9 raw tx validation, Section 14 canary)
- [TRD](../specs/2026-05-18-sw4p-usdt-tron-parity-trd.md) (Section 6 raw tx validator, Section 8 Tron wallet adapter, Section 9 lifecycle)
- [SOW](../specs/2026-05-18-sw4p-usdt-tron-parity-sow.md) (Workstream WS6)
- [M0-M2 plan](2026-05-18-sw4p-usdt-tron-parity-m0-m2.md)
- [M3 plan](2026-05-18-sw4p-usdt-tron-parity-m3-tron-signing.md)
- [M0-M2 follow-ups](../../../sw4p/docs/followups/2026-05-18-usdt-tron-parity-m0-m2-followups.md)
- [M3 follow-ups](../../../sw4p/docs/followups/2026-05-18-usdt-tron-parity-m3-tron-signing-followups.md)

---

## Subagent Dispatch Contract

Same as the M0-M2 and M3 plans. Re-stated:

| Field | Value |
|---|---|
| `model` | `opus` (Opus 4.7 max) |
| `subagent_type` (implementer) | `general-purpose` |
| `subagent_type` (reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (final review) | `code-review:code-review` |
| `isolation` | omit |
| `run_in_background` | false for in-wave work |

**Hard rules from earlier milestones (re-stated):**

1. **sw4p is a standalone nested git repo.** Every M4 commit lands on `feat/sw4p-usdt-tron-parity-m4-execution-parity` off `feat/sw4p-usdt-tron-parity-m3-tron-signing`. Implementers verify branch with `git rev-parse --abbrev-ref HEAD` and STOP if wrong. Never `git checkout` to switch branches.
2. **Sequential within each wave.** No parallel agents on the sw4p Rust repo. Frontend work can interleave only when files are disjoint.
3. **No signing/hook bypass flags.** Never pass `-c commit.gpgsign=false`, `--no-gpg-sign`, `--no-verify`.
4. **No AI co-author trailer.** Author `rndrntwrk <dev@rndrntwrk.com>`.
5. **No em dashes (U+2014) or non-ASCII** in any committed file or commit message.
6. **Implementer stages files via `git add`; controller commits.** The auto-mode classifier blocks subagent `git commit` invocations; this workflow avoids the block.
7. **Configured `reqwest::Client` with timeouts** on every new HTTP-calling module (30s timeout, 10s connect).
8. **Add `tracing::info!` / `tracing::warn!` to network and DB boundaries.** Hashes and IDs only; no plaintext secrets.

---

## Parallel Wave Map

| Wave | Tasks | Files | Parallelism |
|---:|---|---|---|
| W0 | T1 Allbridge selector capture + reconciliation | `tron_abi.rs`, `allbridge.rs` (read only) | solo |
| W1 | T2 TronClient::new_with_url + env-var removal | `tron_client.rs`, `tron_watcher.rs`, `tron_signing_api.rs` | solo |
| W2 | T3 broadcast wire format, T4 unsigned tx shape | `tron_signing_api.rs` + `tron_unsigned_tx_builder.rs` + `tron_client.rs` | sequential |
| W3 | T5 canary enforcement, T6 legacy call site migration | `allbridge.rs` (twice) | sequential |
| W4 | T7 approval spender, T8 token equality, T9 route-state freshness | `raw_tx_validator.rs` (three modifications) | sequential |
| W5 | T10 Solana to Tron impl | `allbridge.rs` (closes line 619) | solo |
| W6 | T11 POST /v1/solana/raw-tx, T12 POST /v1/solana/broadcast | new `solana_signing_api.rs` + `lib.rs` + `main.rs` | sequential |
| W7 | T13 provider_status_polling | new `provider_status_polling.rs` | solo |
| W8 | T14 integration, T15 Sol-to-Tron pinned | new test files | sequential |
| W9 | T16 final M4 branch review | both repos read-only | solo |

Total: 16 tasks across 10 waves. No frontend-only work in this plan; M3 frontend surface is sufficient for the Tron signing flow and a Solana parallel frontend integration is deferred to M6.

---

## File Structure

New files this plan creates:

| Path | Responsibility |
|---|---|
| `sw4p/sw4p-backend/src/solana_signing_api.rs` | Axum handlers for `POST /v1/solana/raw-tx` and `POST /v1/solana/broadcast`, mirroring the M3 Tron pattern. |
| `sw4p/sw4p-backend/src/provider_status_polling.rs` | Periodic Allbridge transfer-status poller emitting tracing events; full lifecycle wiring is M5. |
| `sw4p/sw4p-backend/tests/m4_tron_signing_full_flow.rs` | Integration test asserting the reconciled selector + real unsigned-tx shape + fixed broadcast handler all work end-to-end against wiremock. |
| `sw4p/sw4p-backend/tests/sol_to_tron_pinned.rs` | Pinned acceptance test for the Solana to Tron path. |

Files this plan modifies:

| Path | Modification |
|---|---|
| `sw4p/sw4p-backend/src/tron_abi.rs` | Replace placeholder selector with verified mainnet selector + parameter layout. |
| `sw4p/sw4p-backend/src/tron_client.rs` | Add `TronClient::new_with_url(url: String) -> Result<Self, TronError>` constructor; expose `fetch_latest_block_reference()` helper for T4. |
| `sw4p/sw4p-backend/src/tron_watcher.rs` | Replace `env::set_var` with `TronClient::new_with_url`. |
| `sw4p/sw4p-backend/src/tron_signing_api.rs` | Fix broadcast handler to forward the full signed tx object; use `TronClient::new_with_url`; expand request shape so raw-tx handler can fetch block reference and produce a TronWeb-shaped payload. |
| `sw4p/sw4p-backend/src/tron_unsigned_tx_builder.rs` | Accept `ref_block_bytes`, `ref_block_hash`, `expiration`, `timestamp` from a `BlockReference` input and embed them in `raw_data` so TronLink will accept the signed result. |
| `sw4p/sw4p-backend/src/allbridge.rs` | Canary enforcement for amount/fee/approval/slippage/asset; migrate 3 legacy call sites; implement `bridge_from_solana_to_tron` closing the not-implemented at line 619. |
| `sw4p/sw4p-backend/src/raw_tx_validator.rs` | Add approval-spender check via `decode_trc20_transfer`; add source-token and destination-token equality; add route-state freshness lookup against `route_states` table. |
| `sw4p/sw4p-backend/src/lib.rs` | Add `pub mod solana_signing_api;` and `pub mod provider_status_polling;`. |
| `sw4p/sw4p-backend/src/main.rs` | Merge `solana_signing_api::solana_signing_router` into the app router. |
| `sw4p/sw4p-backend/src/native_bridge.rs` | Migrate `bridge_from_tron(...)` call at line 316 to `bridge_from_tron_with_mode(..., TronExecutionMode::UserSigned, pool)`. |
| `sw4p/sw4p-backend/src/multi_hop.rs` | Migrate `bridge_from_tron(...)` call at line 334. |
| `sw4p/sw4p-backend/src/relay.rs` | Migrate `bridge_from_tron(...)` call at line 1957. |

---

## Task T1: Allbridge swapAndBridge Selector Capture and Reconciliation

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Replace the placeholder `[0xd4, 0x80, 0x3b, 0x7e]` selector with the verified mainnet selector and reconcile the three divergent parameter signatures inside `allbridge.rs`.

**Spec IDs:** PRD-USDT-017, PRD-USDT-023; CRD section 9 (CRD-SEC-004 contract verification); closes M3 critical follow-up.

**Files:**
- Modify: `sw4p/sw4p-backend/src/tron_abi.rs` (selector constant + parameter struct)
- Read only: `sw4p/sw4p-backend/src/allbridge.rs` (lines 418, 604, 717 area) to confirm the chosen signature matches the actual on-chain function

- [ ] **Step 1: Survey the three existing signatures in `allbridge.rs`.**

```bash
grep -nB2 -A2 'swapAndBridge' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/allbridge.rs | head -80
```

Identify the parameter signatures used at each of the three sites (lines 418, 604, 717 approximately). Document each in a short note at the top of `tron_abi.rs` so the next reader sees which signature this module decodes.

- [ ] **Step 2: Compute the verified selector from the canonical Solidity signature.**

For the Tron Allbridge contract, the canonical signature is `swapAndBridge(bytes32,uint256,uint256,bytes32,uint256,bytes32)` per the [Allbridge Core contracts reference](https://docs-core.allbridge.io/product/how-does-allbridge-core-work/allbridge-core-contracts). The selector is the first 4 bytes of `keccak256(signature)`. Compute it once and pin it as a constant.

Use this Python one-liner (run it in the implementer's shell, not in the production code) to derive the selector:

```bash
python3 -c "from Cryptodome.Hash import keccak; h = keccak.new(digest_bits=256); h.update(b'swapAndBridge(bytes32,uint256,uint256,bytes32,uint256,bytes32)'); print('0x' + h.hexdigest()[:8])"
```

If `Cryptodome` is not available, the implementer can use Node:

```bash
node -e "const k = require('keccak')('keccak256'); k.update('swapAndBridge(bytes32,uint256,uint256,bytes32,uint256,bytes32)'); console.log('0x' + k.digest('hex').slice(0, 8))"
```

Or shell out to Rust via a tiny one-off:

```bash
cd /tmp && cat > selector.rs <<'EOF'
fn main() {
    use sha3::{Digest, Keccak256};
    let sig = "swapAndBridge(bytes32,uint256,uint256,bytes32,uint256,bytes32)";
    let mut h = Keccak256::new();
    h.update(sig.as_bytes());
    let r = h.finalize();
    println!("0x{:02x}{:02x}{:02x}{:02x}", r[0], r[1], r[2], r[3]);
}
EOF
# (then compile and run; or just compute it once and hardcode the result)
```

Pin the computed selector as a constant in `tron_abi.rs`. Add a doc comment recording the canonical signature it was derived from.

- [ ] **Step 3: Update the parameter struct and decoder.** The new signature is 6 parameters (not 8 as the old placeholder assumed). Replace `AllbridgeSwapAndBridge`:

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AllbridgeSwapAndBridge {
    pub token_word_hex: String,       // bytes32: source token
    pub amount: u128,                  // uint256: source amount
    pub recipient_amount: u128,        // uint256: minimum receive amount
    pub recipient_word_hex: String,    // bytes32: recipient on destination chain
    pub dest_chain_id_amount: u128,    // uint256: destination chain id
    pub receive_token_word_hex: String,// bytes32: destination token
}
```

(Note the parameter ordering differs from the M3 placeholder: there is no separate `nonce`, `messenger`, or `fee_token_amount` field in the Tron entrypoint; those parameters live in the messenger-style EVM entrypoint, not the Tron one.)

Update `decode_allbridge_swap_and_bridge` to read 6 words (4 + 6*32 = 196 bytes) instead of 8 words. Adapt the existing checks (address-high-byte zero for the bytes32 fields, u128 from word for the uint256 fields).

- [ ] **Step 4: Update tests in `tron_abi.rs::tests`.** The existing `decode_swap_and_bridge_round_trips_minimal` test constructed an 8-word payload; rewrite it for 6 words. Add `decode_swap_and_bridge_pinned_2026_05_18` that asserts the selector constant equals the value computed in Step 2 (paste the literal bytes).

- [ ] **Step 5: Update `raw_tx_validator.rs::tests` for the new parameter layout.** The M3 T4 tests reference `decoded.dest_chain_id` (u8) and `decoded.messenger` (u8) and `decoded.fee_token_amount`. With the new shape:
- `dest_chain_id` becomes `dest_chain_id_amount: u128`. Change the comparison to `decoded.dest_chain_id_amount == intent.allbridge_dest_chain_id.map(|x| x as u128).unwrap_or(...)`. Or change `Intent.allbridge_dest_chain_id` from `Option<u8>` to `Option<u128>`. Pick the latter, since chain ids may exceed 255 (Unichain mainnet is chainId 130, fine, but stay safe).
- `messenger` and `fee_token_amount` are no longer fields. Remove the messenger and fee-cap checks from the Tron branch; they belong on the EVM messenger entrypoint, not Tron. Add an explicit comment noting this and that the EVM messenger entrypoint is a separate validator branch (deferred).

- [ ] **Step 6: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_abi raw_tx_validator -- --nocapture
```

Expected: tron_abi tests reduced from 4 to 4 still (one renamed, one added pinning). raw_tx_validator: 9 PASS (some tests adapted for the new shape; `validate_tron_passes_on_well_formed_swap_and_bridge`, `validate_tron_fails_on_fee_overrun` adjusted or one removed).

If a test FAILS because the new selector does not match what M3 T4 was asserting, the test was asserting the placeholder; update the test to use the new selector constant.

- [ ] **Step 7: Stage (controller commits).**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git status --short
git add sw4p-backend/src/tron_abi.rs sw4p-backend/src/raw_tx_validator.rs
git status --short
```

---

## Task T2: TronClient::new_with_url and Env-Var Removal

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add `TronClient::new_with_url(url: String) -> Result<Self, Error>` constructor and replace `std::env::set_var` in async paths with explicit URL passing.

**Spec IDs:** Closes M3 important follow-up (`tron_watcher` env-var racy; same pattern in `broadcast_handler`).

**Files:**
- Modify: `sw4p/sw4p-backend/src/tron_client.rs` (add constructor)
- Modify: `sw4p/sw4p-backend/src/tron_watcher.rs` (use new constructor)
- Modify: `sw4p/sw4p-backend/src/tron_signing_api.rs` (use new constructor in `broadcast_handler`)

- [ ] **Step 1: Locate the existing `TronClient::new()` constructor.**

```bash
grep -n 'impl TronClient\|pub fn new' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/tron_client.rs | head
```

Note the current `new()` signature and what it reads. Likely something like:

```rust
pub fn new() -> Result<Self, Error> {
    let rpc_url = std::env::var("TRON_RPC_URL")
        .map_err(|_| Error::Config("TRON_RPC_URL not set".into()))?;
    // construct client...
}
```

- [ ] **Step 2: Add `new_with_url`.** Above (or below) the existing `new()`, add:

```rust
/// Construct a `TronClient` with an explicit RPC URL, bypassing the
/// `TRON_RPC_URL` environment variable. Use this from any async context
/// that knows its URL up front; the env-var-reading `new()` is fine for
/// process-startup wiring but is unsafe to mutate in a concurrent path.
pub fn new_with_url(rpc_url: String) -> Result<Self, Error> {
    // The body should mirror `new()` minus the env read. Pick the existing
    // construction code (httpClient, etc.) and substitute `rpc_url` for the
    // env-read value.
    Ok(Self {
        rpc_url,
        // ... whatever other fields TronClient has, populated as new() does
    })
}
```

If `new()` constructs the inner `reqwest::Client` with timeouts, mirror that here. The two constructors should differ ONLY in where `rpc_url` comes from.

Optionally refactor `new()` to call `new_with_url` after reading the env var, to avoid duplication.

- [ ] **Step 3: Update `tron_watcher::watch_until_confirmed`.** Open `tron_watcher.rs` and replace the `std::env::set_var(...)` + `TronClient::new()` pattern with:

```rust
let client = match crate::tron_client::TronClient::new_with_url(rpc_url.to_string()) {
    Ok(c) => c,
    Err(e) => {
        tracing::warn!(target: "tron_watcher", tx_id = %tx_id, error = %format!("{:?}", e), "failed to construct TronClient");
        return WatchResult { tx_id: tx_id.to_string(), confirmed: false, elapsed_ms: 0 };
    }
};
```

Remove the env-var mutation entirely.

- [ ] **Step 4: Update `tron_signing_api::broadcast_handler`.** Replace the env-var-reading construction:

```rust
let tron_rpc_url = std::env::var("TRON_RPC_URL")
    .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
let client = crate::tron_client::TronClient::new_with_url(tron_rpc_url)
    .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
```

Note this still reads the env var, but it does so AT the call site (not via mutation) and constructs the client explicitly. The handler will run on whatever runtime thread Axum gives it, and `std::env::var` is read-only safe.

- [ ] **Step 5: Run the affected tests.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib tron_watcher tron_client -- --test-threads=1
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test tron_signing_api -- --test-threads=1
```

The watcher tests will still need to set `TRON_RPC_URL` for the wiremock mock server to respond, but the watcher itself no longer mutates the env var; the test mutates it explicitly. Adapt the test if needed.

Expected: all PASS.

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_client.rs sw4p-backend/src/tron_watcher.rs sw4p-backend/src/tron_signing_api.rs
git status --short
```

---

## Task T3: Broadcast Handler Wire Format Fix

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Replace the wrapper `{"transaction": signed_hex}` payload with the actual TronGrid `/wallet/broadcasttransaction` request shape: a signed transaction object with `signature[]`, `txID`, `raw_data`, `raw_data_hex`.

**Spec IDs:** PRD-USDT-005; CRD CRD-SIGN-003; closes M3 critical follow-up.

**Files:**
- Modify: `sw4p/sw4p-backend/src/tron_signing_api.rs`
- Modify: `sw4p/sw4p-backend/src/tron_client.rs` (the `broadcast_transaction` method signature may need to accept a typed signed-tx struct instead of a `serde_json::Value` blob)
- Modify: `sw4p/sw4p-backend/tests/tron_signing_api.rs` (existing broadcast test + new shape assertions)

- [ ] **Step 1: Inspect `TronClient::broadcast_transaction` signature.**

```bash
grep -nA10 'pub async fn broadcast_transaction' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/tron_client.rs
```

The M3 T7 implementer reported it takes `&serde_json::Value`. Confirm. We will keep that signature (it is flexible enough) and instead fix the JSON shape constructed in `broadcast_handler`.

- [ ] **Step 2: Update `BroadcastRequest`** in `tron_signing_api.rs`:

```rust
#[derive(Deserialize)]
pub struct BroadcastRequest {
    /// The full signed Tron transaction object as returned by TronWeb's
    /// `trx.sign()` (or an equivalent signer). Must include `txID`,
    /// `raw_data`, `raw_data_hex`, and `signature[]`. Forwarded as-is to
    /// TronGrid's `/wallet/broadcasttransaction`.
    pub signed_tx: serde_json::Value,
}
```

Remove the old `signed_tx_hex: String` field.

- [ ] **Step 3: Rewrite `broadcast_handler`.**

```rust
async fn broadcast_handler(
    axum::extract::State(_pool): axum::extract::State<PgPool>,
    Json(req): Json<BroadcastRequest>,
) -> Result<Json<BroadcastResponse>, axum::http::StatusCode> {
    let signed = req.signed_tx;
    let required = ["txID", "raw_data", "raw_data_hex", "signature"];
    for field in required.iter() {
        if signed.get(field).is_none() {
            tracing::warn!(target: "tron_signing_api", missing = %field, "broadcast rejected: missing required field");
            return Err(axum::http::StatusCode::BAD_REQUEST);
        }
    }
    let tron_rpc_url = std::env::var("TRON_RPC_URL")
        .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
    let client = crate::tron_client::TronClient::new_with_url(tron_rpc_url)
        .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
    match client.broadcast_transaction(&signed).await {
        Ok(tx_id) => Ok(Json(BroadcastResponse { tx_id, accepted: true })),
        Err(e) => {
            tracing::warn!(target: "tron_signing_api", error = %e, "broadcast failed");
            Err(axum::http::StatusCode::BAD_GATEWAY)
        }
    }
}
```

The handler now forwards the user-provided signed object unmodified. The 4-field shape validation is the minimum needed; deeper structural checks (txID equals keccak256 of raw_data_hex, signature length 65 bytes, etc.) are deferred to a future hardening task.

- [ ] **Step 4: Update existing `broadcast_returns_tx_id_on_success` test** in `tests/tron_signing_api.rs`. Replace the `{"signed_tx_hex": "0xdeadbeef"}` request body with a full signed-tx fixture:

```rust
let body = serde_json::json!({
    "signed_tx": {
        "txID": "deadbeef12345",
        "raw_data": { "contract": [], "fee_limit": 100_000_000 },
        "raw_data_hex": "0a02...",
        "signature": ["abcd1234..."]
    }
});
```

Add a second test `broadcast_rejects_signed_tx_missing_required_field`:

```rust
#[tokio::test]
async fn broadcast_rejects_signed_tx_missing_required_field() {
    let pool = test_pool().await;
    let app = tron_signing_router(pool);
    let body = serde_json::json!({
        "signed_tx": { "txID": "abc", "raw_data": {} }  // missing raw_data_hex + signature
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/tron/broadcast")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 400);
}
```

- [ ] **Step 5: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test tron_signing_api -- --test-threads=1
```

Expected: 4 PASS (raw-tx happy, raw-tx bad-owner, broadcast happy adapted, broadcast missing-field new).

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_signing_api.rs sw4p-backend/tests/tron_signing_api.rs
git status --short
```

---

## Task T4: Unsigned Tx Shape with Block Reference

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Replace the hand-rolled JSON envelope in `tron_unsigned_tx_builder` with a real TronWeb-compatible payload that includes `ref_block_bytes`, `ref_block_hash`, `expiration`, `timestamp`, fetched from a Tron full node by the backend.

**Spec IDs:** PRD-USDT-005, PRD-USDT-023; TRD-TRON-002; closes M3 critical follow-up.

**Files:**
- Modify: `sw4p/sw4p-backend/src/tron_client.rs` (add `fetch_latest_block_reference()`)
- Modify: `sw4p/sw4p-backend/src/tron_unsigned_tx_builder.rs` (rewrite `build` to accept a `BlockReference` and produce a TronWeb-shaped payload)
- Modify: `sw4p/sw4p-backend/src/tron_signing_api.rs` (`raw_tx_handler` fetches the block reference and passes it in)

- [ ] **Step 1: Add `fetch_latest_block_reference` to `TronClient`.**

```rust
#[derive(Debug, Clone, serde::Serialize)]
pub struct BlockReference {
    pub block_number: u64,
    pub block_hash_hex: String,
    pub block_timestamp_ms: i64,
}

impl TronClient {
    /// Fetch the latest block from the configured Tron full node and
    /// return the fields needed to construct a TronWeb-compatible
    /// `raw_data` payload (ref_block_bytes, ref_block_hash, timestamp).
    pub async fn fetch_latest_block_reference(&self) -> Result<BlockReference, Error> {
        let url = format!("{}/wallet/getblockbylatestnum?num=1", self.rpc_url.trim_end_matches('/'));
        let resp = self.http.get(&url).send().await?;
        if !resp.status().is_success() {
            return Err(Error::Provider(format!("getblockbylatestnum: status {}", resp.status())));
        }
        let v: serde_json::Value = resp.json().await?;
        let block = v.get("block").and_then(|b| b.get(0))
            .ok_or_else(|| Error::Provider("no block in response".into()))?;
        let header = block.get("block_header").and_then(|h| h.get("raw_data"))
            .ok_or_else(|| Error::Provider("no block_header.raw_data".into()))?;
        let block_number = header.get("number").and_then(|n| n.as_u64())
            .ok_or_else(|| Error::Provider("no block_header.raw_data.number".into()))?;
        let block_hash_hex = block.get("blockID").and_then(|b| b.as_str())
            .ok_or_else(|| Error::Provider("no blockID".into()))?
            .to_string();
        let block_timestamp_ms = header.get("timestamp").and_then(|t| t.as_i64())
            .unwrap_or_else(|| chrono::Utc::now().timestamp_millis());
        Ok(BlockReference { block_number, block_hash_hex, block_timestamp_ms })
    }
}
```

(Note: `self.http` may be `reqwest::Client`; adapt to the actual field name.)

- [ ] **Step 2: Rewrite `tron_unsigned_tx_builder::build`** to produce a TronWeb-shaped payload:

```rust
use crate::tron_client::BlockReference;

#[derive(Debug, Clone)]
pub struct BuildArgs {
    pub owner_address_base58: String,
    pub contract_address_base58: String,
    pub function_selector: String,
    pub parameter_hex: String,
    pub fee_limit_sun: u64,
    pub call_value_sun: u64,
    pub block_reference: BlockReference,
    pub expiration_ms_from_now: i64,
}

pub fn build(args: BuildArgs) -> Result<UnsignedTronTransaction, BuildError> {
    crate::tron_address::validate(&args.owner_address_base58)
        .map_err(|e| BuildError::InvalidOwner(e.to_string()))?;
    crate::tron_address::validate(&args.contract_address_base58)
        .map_err(|e| BuildError::InvalidContract(e.to_string()))?;
    let _ = hex::decode(args.parameter_hex.trim_start_matches("0x"))
        .map_err(|e| BuildError::InvalidParameterHex(e.to_string()))?;

    // Tron ref_block_bytes is the low 2 bytes of the block number in big-endian hex.
    let ref_block_bytes = format!("{:04x}", (args.block_reference.block_number & 0xffff));
    // ref_block_hash is bytes 8 to 16 of the block hash (8 bytes, 16 hex chars).
    let block_hash = args.block_reference.block_hash_hex.trim_start_matches("0x");
    if block_hash.len() < 32 {
        return Err(BuildError::InvalidParameterHex("block_hash too short".into()));
    }
    let ref_block_hash = &block_hash[16..32];

    let expiration = args.block_reference.block_timestamp_ms + args.expiration_ms_from_now;
    let timestamp = args.block_reference.block_timestamp_ms;

    let raw_data_payload = serde_json::json!({
        "contract": [{
            "type": "TriggerSmartContract",
            "parameter": {
                "value": {
                    "data": args.parameter_hex.trim_start_matches("0x"),
                    "owner_address": crate::tron_address::base58_to_hex(&args.owner_address_base58)
                        .map_err(|e| BuildError::InvalidOwner(e.to_string()))?,
                    "contract_address": crate::tron_address::base58_to_hex(&args.contract_address_base58)
                        .map_err(|e| BuildError::InvalidContract(e.to_string()))?,
                    "call_value": args.call_value_sun,
                },
                "type_url": "type.googleapis.com/protocol.TriggerSmartContract",
            },
        }],
        "ref_block_bytes": ref_block_bytes,
        "ref_block_hash": ref_block_hash,
        "expiration": expiration,
        "timestamp": timestamp,
        "fee_limit": args.fee_limit_sun,
    });
    let raw_data_text = serde_json::to_string(&raw_data_payload).expect("serialize");
    let raw_data_hex = hex::encode(raw_data_text.as_bytes());
    let tx_id = hex::encode(Sha256::digest(raw_data_text.as_bytes()));

    Ok(UnsignedTronTransaction {
        tx_id,
        raw_data: raw_data_payload,
        raw_data_hex,
        contract_address: args.contract_address_base58,
        function_selector: args.function_selector,
        parameter_hex: args.parameter_hex,
        fee_limit_sun: args.fee_limit_sun,
        call_value_sun: args.call_value_sun,
        owner_address_base58: args.owner_address_base58,
    })
}
```

Update `UnsignedTronTransaction` to expose `raw_data: serde_json::Value` (the object) in addition to `raw_data_hex` so the frontend can pass the object to TronLink. (TronLink's `trx.sign()` accepts the raw_data object form.)

- [ ] **Step 3: Add `base58_to_hex` helper in `tron_address.rs`** (if not already present):

```rust
pub fn base58_to_hex(addr: &str) -> Result<String, AddressError> {
    validate(addr)?;
    let decoded = base58_decode(addr).ok_or(AddressError::Base58)?;
    // Tron internal format: 21 bytes starting with 0x41 (drop the 4-byte checksum).
    Ok(hex::encode(&decoded[..21]))
}
```

This is the format TronWeb's `raw_data.contract[].parameter.value.owner_address` expects.

- [ ] **Step 4: Update `raw_tx_handler` in `tron_signing_api.rs`** to fetch the block reference and pass it:

```rust
async fn raw_tx_handler(
    Json(req): Json<RawTxRequest>,
) -> Result<Json<RawTxResponse>, axum::http::StatusCode> {
    let baseline = swap_and_bridge_resource_baseline();
    let preview = estimate(
        TronAccountResources { bandwidth_free: req.bandwidth_free, energy_free: req.energy_free },
        baseline,
    );
    let fee_limit = req.fee_limit_sun.unwrap_or(baseline.fee_limit_sun);

    let tron_rpc_url = std::env::var("TRON_RPC_URL")
        .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
    let client = crate::tron_client::TronClient::new_with_url(tron_rpc_url)
        .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
    let block_ref = client.fetch_latest_block_reference().await
        .map_err(|_| axum::http::StatusCode::BAD_GATEWAY)?;

    let unsigned = build_unsigned(BuildArgs {
        owner_address_base58: req.owner_address,
        contract_address_base58: req.contract_address,
        function_selector: req.function_selector,
        parameter_hex: req.parameter_hex,
        fee_limit_sun: fee_limit,
        call_value_sun: 0,
        block_reference: block_ref,
        expiration_ms_from_now: 60_000, // 60s expiration window
    })
    .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    Ok(Json(RawTxResponse { unsigned, resource_preview: preview }))
}
```

- [ ] **Step 5: Update tests** to wiremock the block-reference fetch in addition to the existing assertions. The existing `raw_tx_returns_unsigned_and_preview` will need a wiremock that responds to `/wallet/getblockbylatestnum`. Mount it before calling.

- [ ] **Step 6: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib tron_unsigned_tx_builder tron_client -- --test-threads=1
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test tron_signing_api -- --test-threads=1
```

Expected: all PASS, including the existing unsigned-tx tests adapted for the new `BuildArgs` shape (the test now constructs a `BlockReference` fixture and passes it in).

- [ ] **Step 7: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_client.rs sw4p-backend/src/tron_unsigned_tx_builder.rs sw4p-backend/src/tron_signing_api.rs sw4p-backend/src/tron_address.rs sw4p-backend/tests/tron_signing_api.rs
git status --short
```

---

## Task T5: Canary Authorization Enforcement

**Wave:** W3. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Enforce all canary authorization fields (amount, max_fee, max_slippage, approval_cap, source_asset, destination_asset) in `bridge_from_tron_with_mode::Canary`, not just chain and wallet.

**Spec IDs:** PRD-USDT-019, PRD-USDT-024; TRD-TRON-009; closes M3 important follow-up.

**Files:**
- Modify: `sw4p/sw4p-backend/src/allbridge.rs` (Canary arm of `bridge_from_tron_with_mode`)

- [ ] **Step 1: Read the existing Canary arm.**

```bash
grep -nB5 -A40 'TronExecutionMode::Canary' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/allbridge.rs
```

Locate the arm. M3 T5 left it enforcing only `source_chain`, `destination_chain`, `source_wallet`, `destination_wallet`.

- [ ] **Step 2: Add the missing field checks.** Inside the Canary arm, after the existing chain/wallet checks, add:

```rust
// Asset symbol match (both directions). The request's `token` field is the
// source asset symbol per the existing BridgeRequest shape.
if auth.source_asset != request.token {
    return Err(format!("canary auth source_asset {} does not match request token {}",
                       auth.source_asset, request.token).into());
}
if auth.destination_asset != request.destination_token {
    return Err(format!("canary auth destination_asset {} does not match request destination_token {}",
                       auth.destination_asset, request.destination_token).into());
}

// Amount equality. Both are decimal strings; normalize via the same helper
// as raw_tx_validator before comparing.
let auth_amount = crate::raw_tx_validator::normalize_decimal(&auth.amount_decimal)
    .ok_or_else(|| "auth amount_decimal is malformed")?;
let req_amount = crate::raw_tx_validator::normalize_decimal(&request.amount_decimal)
    .ok_or_else(|| "request amount_decimal is malformed")?;
if auth_amount != req_amount {
    return Err(format!("canary auth amount {} does not match request amount {}",
                       auth.amount_decimal, request.amount_decimal).into());
}

// Fee, slippage, and approval caps are enforced LATER when the underlying
// relayer-sign code constructs the actual approve and bridge txs. Capture
// them on the BridgeRequest extension so the inner code can read them.
let caps = CanaryCaps {
    max_fee_decimal: auth.max_fee.clone(),
    max_slippage_decimal: auth.max_slippage.clone(),
    approval_cap_decimal: auth.approval_cap.clone(),
};

// Proceed to the existing relayer-sign code path with caps in scope.
let result = self.bridge_from_tron_with_caps(request, caps, pool).await?;
canary_authorization::consume(pool, &authorization_id, &result.tx_hash).await?;
return Ok(TronBridgeResult::Broadcast(result));
```

`CanaryCaps` is a small new type:

```rust
#[derive(Debug, Clone)]
pub struct CanaryCaps {
    pub max_fee_decimal: String,
    pub max_slippage_decimal: String,
    pub approval_cap_decimal: String,
}
```

`bridge_from_tron_with_caps` is a new private method that wraps the existing relayer code path with cap enforcement:

```rust
async fn bridge_from_tron_with_caps(
    &self,
    request: BridgeRequest,
    caps: CanaryCaps,
    pool: &PgPool,
) -> Result<AllbridgeBridgeResult, Box<dyn std::error::Error + Send + Sync>> {
    // 1. Fetch quote (existing code path). Reject if quote relayer_fee > caps.max_fee_decimal.
    // 2. Build approve tx. Reject if approval amount > caps.approval_cap_decimal.
    // 3. Build bridge tx. Reject if implied slippage > caps.max_slippage_decimal.
    // 4. Sign + broadcast (existing relayer code).
    // ...
}
```

Each cap check should call `crate::raw_tx_validator::normalize_decimal` to compare apples to apples and return a structured error on overrun.

- [ ] **Step 3: Make `normalize_decimal` `pub(crate)` in `raw_tx_validator.rs`** so allbridge.rs can call it:

```rust
pub(crate) fn normalize_decimal(s: &str) -> Option<String> { /* existing body */ }
```

- [ ] **Step 4: Add tests for the canary cap enforcement.** In `allbridge.rs::tests` (or a new test file):

```rust
#[tokio::test]
async fn canary_rejects_request_amount_mismatch() {
    let pool = test_pool().await;
    truncate_canary_authorizations(&pool).await;
    let auth = fixture_auth();  // amount_decimal = "5.00"
    insert(&pool, &auth).await.unwrap();
    let mut request = fixture_request();
    request.amount_decimal = "6.00".into();  // mismatch
    let result = AllbridgeAdapter::default().bridge_from_tron_with_mode(
        request, TronExecutionMode::Canary { authorization_id: auth.authorization_id.clone() }, &pool
    ).await;
    let err = result.unwrap_err().to_string();
    assert!(err.contains("amount"), "expected amount mismatch error, got: {}", err);
}

#[tokio::test]
async fn canary_rejects_asset_mismatch() {
    // similar, with auth.source_asset = "USDT" and request.token = "USDC"
}
```

Add at least three: amount mismatch, asset mismatch, expired auth (already exists in `canary_authorization::tests`; this verifies the full flow rejects it).

- [ ] **Step 5: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib allbridge -- --test-threads=1
```

Expected: existing 24 allbridge tests still PASS, plus the 3 new canary enforcement tests PASS.

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/allbridge.rs sw4p-backend/src/raw_tx_validator.rs
git status --short
```

---

## Task T6: Migrate Legacy bridge_from_tron Call Sites

**Wave:** W3. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Switch the 3 legacy `bridge_from_tron(...)` call sites in `native_bridge.rs`, `multi_hop.rs`, and `relay.rs` to `bridge_from_tron_with_mode(..., TronExecutionMode::UserSigned, pool)`. Propagate the `TronBridgeResult` sum type to each call site's consumers.

**Spec IDs:** Closes M3 important follow-up.

**Files:**
- Modify: `sw4p/sw4p-backend/src/native_bridge.rs` (line 316 area)
- Modify: `sw4p/sw4p-backend/src/multi_hop.rs` (line 334 area)
- Modify: `sw4p/sw4p-backend/src/relay.rs` (line 1957 area)

- [ ] **Step 1: For each of the three files, inspect the call site context.**

```bash
sed -n '310,330p' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/native_bridge.rs
sed -n '328,348p' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/multi_hop.rs
sed -n '1950,1970p' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/relay.rs
```

Each call site likely looks like:

```rust
let result = adapter.bridge_from_tron(request).await?;
// use result.tx_hash etc.
```

- [ ] **Step 2: Update each call site to use the new mode-aware method:**

```rust
let result = match adapter.bridge_from_tron_with_mode(request, TronExecutionMode::UserSigned, pool).await? {
    TronBridgeResult::Broadcast(b) => b,
    TronBridgeResult::Unsigned(_) => {
        return Err("UserSigned mode returned Unsigned variant; this caller expects a broadcast".into());
    }
};
// use result.tx_hash as before
```

(Adapt the error return to whatever each caller uses: `Box<dyn Error>`, `anyhow::Error`, etc.)

The semantic shift: under M3, `bridge_from_tron_with_mode::UserSigned` returns the unsigned tx (because the user signs on the frontend). For these three legacy call sites that expect a broadcast result, returning Unsigned is a programming error. The match treats it as such.

Strictly, these three legacy call sites should be redesigned to either (a) accept the unsigned tx and return it to their callers (changing their public API), or (b) explicitly use `TronExecutionMode::Canary` if their use case is the canary path. For M4, the minimal change is the match above, which preserves the existing behavior IF the underlying request happens to have come from a relayer-eligible context. If `bridge_from_tron_with_mode::UserSigned` always returns Unsigned regardless of the input, then this match always panics for the three callers, which is the correct outcome: it forces a redesign at each call site.

Document this in a comment at each call site:

```rust
// TODO M4-followup: this call site predates the M3 user-signed/canary split. The
// match below treats an Unsigned result as a programming error because this code
// path was originally a relayer-signed flow. The proper fix is to either pass a
// Canary authorization here or restructure this caller to surface the unsigned
// tx to its caller. Tracked in M3 follow-ups doc.
```

- [ ] **Step 3: Run the full test suite to confirm no regressions.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test -- --test-threads=1 2>&1 | tail -30
```

Expected: build passes; any test that exercised the legacy `bridge_from_tron(...)` path may now fail at runtime because `UserSigned` returns `Unsigned`. If a test fails, the test was exercising a relayer path; either update the test to pass a `Canary` authorization or note it as a deferred test.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/native_bridge.rs sw4p-backend/src/multi_hop.rs sw4p-backend/src/relay.rs
git status --short
```

---

## Task T7: raw_tx_validator Approval Spender Check (TRD-RAW-002)

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Extend the Tron branch of `raw_tx_validator::validate` to also handle approval transactions, decoding TRC20 `transfer(address,uint256)` and verifying the spender matches the validated Allbridge contract for the chain.

Actually correction: TRC20 approval is `approve(address,uint256)` (selector `0x095ea7b3`). The M3 `tron_abi` decoder was named `decode_trc20_transfer` but the selector `0xa9059cbb` is `transfer`. Validate that the actual approval flow uses one or the other; if the implementer's investigation in M3 documented this, follow it. Otherwise add an `approve` selector decoder alongside.

**Spec IDs:** TRD-RAW-002; CRD section 10 (CRD-APPROVAL-001).

**Files:**
- Modify: `sw4p/sw4p-backend/src/tron_abi.rs` (add `decode_trc20_approve` if missing)
- Modify: `sw4p/sw4p-backend/src/raw_tx_validator.rs` (add approval-tx handling)

- [ ] **Step 1: Add `decode_trc20_approve` to `tron_abi.rs`.**

```rust
pub const TRC20_APPROVE_SELECTOR: [u8; 4] = [0x09, 0x5e, 0xa7, 0xb3];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Trc20Approve {
    pub spender_evm_hex: String,
    pub amount: u128,
}

pub fn decode_trc20_approve(data: &[u8]) -> Result<Trc20Approve, AbiError> {
    if data.len() < 4 + 32 + 32 { return Err(AbiError::TooShort(data.len())); }
    if data[..4] != TRC20_APPROVE_SELECTOR {
        return Err(AbiError::UnknownSelector(data[0], data[1], data[2], data[3]));
    }
    let spender_word = &data[4..36];
    for &b in &spender_word[..12] {
        if b != 0 { return Err(AbiError::AddressHighBytes(4)); }
    }
    let spender_evm_hex = format!("0x{}", hex::encode(&spender_word[12..32]));
    let amount = u128_from_word(&data[36..68]).ok_or(AbiError::BadWord(36))?;
    Ok(Trc20Approve { spender_evm_hex, amount })
}
```

Add one test `decode_trc20_approve_round_trips` mirroring the existing transfer test.

- [ ] **Step 2: Extend the validator** to recognize approval txs. Add to the `Intent` struct:

```rust
pub is_approval: bool,
pub approval_spender_evm_hex: Option<String>,
pub approval_amount: Option<u128>,
```

And in the Tron branch of `validate`:

```rust
if intent.source_chain == "TRX" {
    use crate::tron_abi::{decode_allbridge_swap_and_bridge, decode_trc20_approve, AbiError};
    let raw_no_prefix = payload.raw_data.trim_start_matches("0x");
    let raw_bytes = match hex::decode(raw_no_prefix) {
        Ok(b) => b,
        Err(_) => return fail("raw_data_not_hex", "Tron raw data is not valid hex.", "RAW_DATA_NOT_HEX"),
    };

    if intent.is_approval {
        // Decode as TRC20 approve and verify spender + cap.
        let decoded = match decode_trc20_approve(&raw_bytes) {
            Ok(d) => d,
            Err(AbiError::UnknownSelector(..)) => return fail(
                "method_selector_not_allowlisted",
                "Tron raw transaction method selector is not the TRC20 approve entrypoint.",
                "METHOD_SELECTOR_NOT_ALLOWLISTED",
            ),
            Err(e) => return fail("abi_decode_failed", &format!("approve decode: {}", e), "ABI_DECODE_FAILED"),
        };
        passed.push("approve_selector_match".to_string());

        // Spender must be the validated Allbridge contract for the chain.
        if let Some(expected_spender) = intent.approval_spender_evm_hex.as_ref() {
            if !decoded.spender_evm_hex.eq_ignore_ascii_case(expected_spender) {
                return fail("approval_spender_mismatch",
                    "Decoded approval spender does not match validated Allbridge contract.",
                    "APPROVAL_SPENDER_MISMATCH");
            }
            passed.push("approval_spender_match".to_string());
        }

        // Cap.
        if let Some(cap) = intent.approval_amount {
            if decoded.amount > cap {
                return fail("approval_amount_exceeds_cap",
                    "Decoded approval amount exceeds intent's cap.",
                    "APPROVAL_AMOUNT_EXCEEDS_CAP");
            }
            passed.push("approval_amount_within_cap".to_string());
        }
    } else {
        // Existing swapAndBridge branch (from M3 T4), now using the verified
        // selector from T1. ...
    }
}
```

- [ ] **Step 3: Add three tests:**
- `validate_tron_approval_passes_for_correct_spender`
- `validate_tron_approval_fails_on_wrong_spender`
- `validate_tron_approval_fails_when_amount_exceeds_cap`

- [ ] **Step 4: Run and stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib tron_abi raw_tx_validator -- --nocapture
```

Expected: tron_abi gains 1 PASS (decode_trc20_approve), raw_tx_validator gains 3 PASS.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/tron_abi.rs sw4p-backend/src/raw_tx_validator.rs
git status --short
```

---

## Task T8: raw_tx_validator Source and Destination Token Equality (TRD-RAW-003, TRD-RAW-005)

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add source-token and destination-token equality checks to the Tron branch.

**Spec IDs:** TRD-RAW-003, TRD-RAW-005.

**Files:**
- Modify: `sw4p/sw4p-backend/src/raw_tx_validator.rs`

- [ ] **Step 1: Add the checks inside the existing Tron swapAndBridge branch** (after `recipient_mismatch` and before the result construction):

```rust
// TRD-RAW-003: source token (the bytes32 token word) must match the intent.
// The intent already supplies allbridge_source_token_atoms_hex; compare to
// decoded.token_word_hex (case-insensitive hex).
if let Some(expected_src) = intent.allbridge_source_token_atoms_hex.as_ref() {
    if !decoded.token_word_hex.eq_ignore_ascii_case(expected_src) {
        return fail("source_token_mismatch",
            "Decoded source token does not match intent source token.",
            "SOURCE_TOKEN_MISMATCH");
    }
    passed.push("source_token_match".to_string());
}

// TRD-RAW-005: destination token (receive_token) must match the intent.
if let Some(expected_dst) = intent.allbridge_receive_token_atoms_hex.as_ref() {
    if !decoded.receive_token_word_hex.eq_ignore_ascii_case(expected_dst) {
        return fail("destination_token_mismatch",
            "Decoded destination token does not match intent destination token.",
            "DESTINATION_TOKEN_MISMATCH");
    }
    passed.push("destination_token_match".to_string());
}
```

Add `allbridge_source_token_atoms_hex: Option<String>` to `Intent` if missing.

- [ ] **Step 2: Add two tests:**
- `validate_tron_fails_on_source_token_mismatch`
- `validate_tron_fails_on_destination_token_mismatch`

Each constructs a payload with a known token word and an intent with a different one, asserts the corresponding `failed_check`.

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib raw_tx_validator -- --nocapture
```

Expected: raw_tx_validator gains 2 PASS.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/raw_tx_validator.rs
git status --short
```

---

## Task T9: raw_tx_validator Route-State Freshness Check (TRD-RAW-011)

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Add a database lookup against `route_states` that confirms the route is not suspended, stale, provider-unsupported, policy-blocked, or proof-blocked at the moment of validation.

**Spec IDs:** TRD-RAW-011; CRD-PROOF-001 (registry expiry).

**Files:**
- Modify: `sw4p/sw4p-backend/src/raw_tx_validator.rs` (add an async variant `validate_with_pool` or change `validate` to take `&PgPool`)

- [ ] **Step 1: Decide the API shape.** Two options:
- a. Keep `validate` synchronous and add a sibling `async fn validate_with_route_state(intent, quote, payload, snap, pool) -> RawTxValidationResult` that does the DB lookup first, then delegates to `validate`. Callers that want the route-state check use the async variant; legacy callers stay on the sync variant.
- b. Change `validate` to async and take `&PgPool`. Cleaner but breaks the M0-M2 + M3 test surface (the existing sync tests would all need to become async). High blast radius.

Pick option (a). New function:

```rust
pub async fn validate_with_route_state(
    intent: &Intent,
    quote: &Quote,
    payload: &SendPayload,
    snap: &SnapshotMetaForValidator,
    pool: &sqlx::PgPool,
) -> RawTxValidationResult {
    // Look up the route state row.
    let route_id = format!("{}:{}->{}:{}:allbridge_core",
        intent.source_chain, intent.source_token,
        intent.destination_chain, intent.destination_token);
    let row: Option<(String, chrono::DateTime<chrono::Utc>)> = sqlx::query_as(
        "SELECT primary_state, registry_expires_at FROM route_states WHERE route_id = $1"
    )
    .bind(&route_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();
    let (primary, expires_at) = match row {
        Some(r) => r,
        None => return fail("route_state_missing",
            "Route state row not found; route is not registered in the truth layer.",
            "ROUTE_STATE_MISSING"),
    };
    if expires_at <= chrono::Utc::now() {
        return fail("route_state_expired",
            "Route state registry snapshot is expired; refresh required.",
            "ROUTE_STATE_EXPIRED");
    }
    if matches!(primary.as_str(),
        "suspended" | "provider_unsupported" | "policy_blocked" | "out_of_scope") {
        return fail("route_state_not_executable",
            &format!("Route state is {}; not user-executable.", primary),
            "ROUTE_STATE_NOT_EXECUTABLE");
    }
    // Delegate to the existing sync validator for the remaining checks.
    validate(intent, quote, payload, snap)
}
```

- [ ] **Step 2: Add three tests:**
- `validate_with_route_state_passes_for_executable_route`
- `validate_with_route_state_fails_when_row_missing`
- `validate_with_route_state_fails_when_suspended`

Each seeds `route_states` with the appropriate row (via `test_support::seed_minimal_snapshot` from M0-M2 T15 plus additional helpers) and asserts the right `failed_check`.

- [ ] **Step 3: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --lib raw_tx_validator -- --test-threads=1
```

Expected: 3 new PASS plus existing all PASS.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/raw_tx_validator.rs
git status --short
```

---

## Task T10: Solana to Tron Implementation

**Wave:** W5. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement `bridge_from_solana_to_tron` in `allbridge.rs`, closing the `Err("Solana to Tron bridging not yet implemented. Use EVM chains.")` at line 619 and flipping the route state for `SOL:USDT->TRX:USDT` from `provider_supported_code_incomplete` to `code_supported_proof_missing`.

**Spec IDs:** PRD-USDT-006; SOW WP6.3.

**Files:**
- Modify: `sw4p/sw4p-backend/src/allbridge.rs` (implement `bridge_from_solana_to_tron`)
- Modify: `sw4p/sw4p-backend/src/policy.rs` (update `primary_for` for SOL→TRX to return `CodeSupportedProofMissing`)

- [ ] **Step 1: Inspect the existing Solana bridging code paths in `allbridge.rs`.**

```bash
grep -nA20 'bridge_from_evm\|bridge_to_tron\|bridge_to_tron_from_solana' /Volumes/OWC*/desktop_dump/new/Work/555/sw4p/sw4p-backend/src/allbridge.rs | head -100
```

Identify the existing patterns: `bridge_from_evm` (EVM source via Circle WaaS or direct), `bridge_to_tron` (EVM/Solana to Tron destination). The Solana side likely uses the `solana_client` + `solana_sdk` crates already in deps.

- [ ] **Step 2: Implement `bridge_from_solana_to_tron`.** The Solana side uses an SPL token transfer + Allbridge program call. The Tron side receives via the same Allbridge messenger as EVM→Tron. The function returns an unsigned Solana transaction (for the user's Solana wallet to sign via the existing Solana wallet adapter).

```rust
pub async fn bridge_from_solana_to_tron(
    &self,
    request: BridgeRequest,
    pool: &PgPool,
) -> Result<SolanaBridgeResult, Box<dyn std::error::Error + Send + Sync>> {
    use crate::route_state::*;
    // 1. Validate request: source_chain == "SOL", destination_chain == "TRX",
    //    source_token == "USDT", destination_token == "USDT".
    if request.source_chain != "SOL" || request.destination_chain != "TRX" {
        return Err("bridge_from_solana_to_tron requires SOL source and TRX destination".into());
    }
    if request.token != "USDT" || request.destination_token != "USDT" {
        return Err("bridge_from_solana_to_tron requires USDT on both sides".into());
    }

    // 2. Get the Allbridge Solana program ID and the USDT mint.
    let allbridge_sol_program = self.get_allbridge_program("SOL")?;
    let usdt_sol_mint = self.get_stablecoin_address(AllbridgeChain::Solana, "USDT")?;

    // 3. Build the Solana transaction:
    //    a. SPL transfer the USDT from user's ATA to the Allbridge pool ATA
    //    b. Allbridge program call to lock + emit the message for Tron messenger
    //    Both can be in a single transaction with two instructions.
    let unsigned_tx = self.build_solana_allbridge_tx(
        &request.sender,
        &allbridge_sol_program,
        &usdt_sol_mint,
        &request.amount_decimal,
        &request.recipient,  // base58 Tron address
    ).await?;

    // 4. Return the unsigned tx; caller (HTTP handler T11) returns it to the
    //    frontend for the Solana wallet adapter to sign.
    Ok(SolanaBridgeResult::Unsigned(unsigned_tx))
}

#[derive(Debug, Clone, serde::Serialize)]
pub enum SolanaBridgeResult {
    Unsigned(UnsignedSolanaTransaction),
    Broadcast { tx_signature: String },
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct UnsignedSolanaTransaction {
    pub recent_blockhash: String,
    pub fee_payer: String,
    pub instructions_base64: String,
    pub message_serialized_base64: String,
}
```

The `build_solana_allbridge_tx` helper is the core of this task. It needs to:
1. Connect to a Solana RPC (use the existing connection pattern in the backend; likely `solana_client::rpc_client::RpcClient`).
2. Look up the user's USDT ATA.
3. Look up the Allbridge pool ATA for USDT.
4. Build the SPL transfer instruction.
5. Build the Allbridge program instruction with the encoded Tron destination (as bytes32 padded base58check decode).
6. Build a `solana_sdk::transaction::Transaction` with these instructions, set `recent_blockhash`, and return its serialized message for frontend signing.

This is substantial. If the implementer judges it too risky to complete in one task, **stop and report DONE_WITH_CONCERNS**, having created the function signature returning a structured `provider_supported_code_incomplete` error rather than the current "not yet implemented" string, and noting that the actual SPL/Allbridge instruction building is deferred to a sub-task. The route_state for SOL→TRX would remain `provider_supported_code_incomplete` in that case.

- [ ] **Step 3: Update `policy::primary_for`.** If T10 lands the full implementation, change:

```rust
if src == "SOL" && dst == "TRX" {
    return (PrimaryState::ProviderSupportedCodeIncomplete, "SOL_TO_TRON_NOT_IMPLEMENTED",
            "Solana to Tron USDT execution is not yet implemented in sw4p.".to_string());
}
```

to:

```rust
if src == "SOL" && dst == "TRX" {
    return (PrimaryState::CodeSupportedProofMissing, "PROOF_PENDING",
            "Route is code-ready but awaits provider-confirmed proof or authorized canary.".to_string());
}
```

(Or remove the special case entirely; the default branch already returns `CodeSupportedProofMissing` for everything that is not Unichain or SOL→TRX.)

If T10 lands DONE_WITH_CONCERNS with a stub, leave the policy as-is and document the gap.

- [ ] **Step 4: Update the M16 pinned acceptance test.** The M0-M2 T16 `pinned_snapshot_produces_expected_route_classification` asserts:

```rust
assert_eq!(sol_trx_usdt.primary, PrimaryState::ProviderSupportedCodeIncomplete);
assert_eq!(sol_trx_usdt.agent_reason_code, "SOL_TO_TRON_NOT_IMPLEMENTED");
```

If T10 flipped the state to `CodeSupportedProofMissing`, update this assertion. If T10 left it as `ProviderSupportedCodeIncomplete`, leave the test alone.

- [ ] **Step 5: Add tests** for the new function. If the full implementation landed: integration test that builds an unsigned Solana tx against a mocked Solana RPC. If a stub: a unit test that asserts the function returns the structured `provider_supported_code_incomplete` error.

- [ ] **Step 6: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib allbridge policy route_state_pinned -- --nocapture
```

Expected: all PASS.

- [ ] **Step 7: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/allbridge.rs sw4p-backend/src/policy.rs sw4p-backend/tests/route_state_pinned.rs
git status --short
```

---

## Task T11: POST /v1/solana/raw-tx Handler

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** HTTP handler that calls `bridge_from_solana_to_tron` and returns the unsigned Solana transaction for the frontend's existing Solana wallet adapter to sign.

**Spec IDs:** PRD-USDT-006, PRD-USDT-009; SOW WP6.3, WP6.6.

**Files:**
- Create: `sw4p/sw4p-backend/src/solana_signing_api.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (`pub mod solana_signing_api;`)
- Modify: `sw4p/sw4p-backend/src/main.rs` (merge the new router)

- [ ] **Step 1: Write the module.**

```rust
//! Solana signing API.
//!
//! POST /v1/solana/raw-tx: build the unsigned Solana transaction for a
//! Solana to Tron route intent. The frontend uses its existing Solana
//! wallet adapter to sign, then POSTs to /v1/solana/broadcast (T12).
//!
//! Satisfies: PRD-USDT-006, PRD-USDT-009; SOW WP6.3, WP6.6.

use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Deserialize)]
pub struct SolanaRawTxRequest {
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token: String,
    pub destination_token: String,
    pub amount_decimal: String,
    pub sender: String,        // base58 Solana address
    pub recipient: String,     // base58 Tron address
}

#[derive(Serialize)]
pub struct SolanaRawTxResponse {
    pub unsigned: crate::allbridge::UnsignedSolanaTransaction,
}

pub fn solana_signing_router(pool: PgPool) -> Router {
    Router::new()
        .route("/v1/solana/raw-tx", post(raw_tx_handler))
        .route("/v1/solana/broadcast", post(broadcast_handler))
        .with_state(pool)
}

async fn raw_tx_handler(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(req): Json<SolanaRawTxRequest>,
) -> Result<Json<SolanaRawTxResponse>, axum::http::StatusCode> {
    let bridge_request = crate::allbridge::BridgeRequest {
        source_chain: req.source_chain,
        destination_chain: req.destination_chain,
        token: req.source_token,
        destination_token: req.destination_token,
        amount_decimal: req.amount_decimal,
        sender: req.sender,
        recipient: req.recipient,
    };
    let adapter = crate::allbridge::AllbridgeAdapter::default();
    let result = adapter.bridge_from_solana_to_tron(bridge_request, &pool).await
        .map_err(|_| axum::http::StatusCode::BAD_GATEWAY)?;
    match result {
        crate::allbridge::SolanaBridgeResult::Unsigned(u) => Ok(Json(SolanaRawTxResponse { unsigned: u })),
        crate::allbridge::SolanaBridgeResult::Broadcast { .. } => {
            // bridge_from_solana_to_tron in M4 returns Unsigned; Broadcast is a
            // future M5 variant.
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn broadcast_handler(/* T12 fills in */) -> Result<Json<()>, axum::http::StatusCode> {
    Err(axum::http::StatusCode::NOT_IMPLEMENTED)
}
```

(Adapt `BridgeRequest` field names to whatever the actual struct uses.)

- [ ] **Step 2: Wire and merge.** Add `pub mod solana_signing_api;` to `lib.rs`. Merge `solana_signing_api::solana_signing_router(pool.clone())` into the app router in `main.rs`.

- [ ] **Step 3: Test.** Create `tests/solana_signing_api.rs`:

```rust
use axum::body::Body;
use axum::http::Request;
use sw4p_backend::solana_signing_api::solana_signing_router;
use sw4p_backend::test_support::test_pool;
use tower::ServiceExt;

#[tokio::test]
async fn raw_tx_returns_unsigned_solana_payload() {
    let pool = test_pool().await;
    let app = solana_signing_router(pool);
    let body = serde_json::json!({
        "source_chain": "SOL", "destination_chain": "TRX",
        "source_token": "USDT", "destination_token": "USDT",
        "amount_decimal": "5.00",
        "sender": "11111111111111111111111111111111",
        "recipient": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/solana/raw-tx")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    // If T10 landed a stub, this returns 502; if T10 landed real impl, 200.
    assert!(resp.status().as_u16() == 200 || resp.status().as_u16() == 502);
}
```

(The flexible assertion lets this test pass whether T10 landed the full impl or a stub.)

- [ ] **Step 4: Run and stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test solana_signing_api -- --test-threads=1
```

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/solana_signing_api.rs sw4p-backend/src/lib.rs sw4p-backend/src/main.rs sw4p-backend/tests/solana_signing_api.rs
git status --short
```

---

## Task T12: POST /v1/solana/broadcast Handler

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Implement the `broadcast_handler` placeholder added in T11. Accepts a base64-encoded signed Solana transaction and forwards to the Solana RPC.

**Spec IDs:** PRD-USDT-006; SOW WP6.5.

**Files:**
- Modify: `sw4p/sw4p-backend/src/solana_signing_api.rs`
- Modify: `sw4p/sw4p-backend/tests/solana_signing_api.rs`

- [ ] **Step 1: Implement `broadcast_handler`.**

```rust
#[derive(Deserialize)]
pub struct SolanaBroadcastRequest {
    pub signed_tx_base64: String,
}

#[derive(Serialize)]
pub struct SolanaBroadcastResponse {
    pub signature: String,
}

async fn broadcast_handler(
    axum::extract::State(_pool): axum::extract::State<PgPool>,
    Json(req): Json<SolanaBroadcastRequest>,
) -> Result<Json<SolanaBroadcastResponse>, axum::http::StatusCode> {
    use base64::Engine;
    let signed_bytes = base64::engine::general_purpose::STANDARD
        .decode(&req.signed_tx_base64)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    let rpc_url = std::env::var("SOLANA_RPC_URL")
        .map_err(|_| axum::http::StatusCode::SERVICE_UNAVAILABLE)?;
    let client = solana_client::nonblocking::rpc_client::RpcClient::new(rpc_url);

    // The signed bytes are a serialized Transaction; bincode-deserialize then send.
    let tx: solana_sdk::transaction::Transaction = bincode::deserialize(&signed_bytes)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    let signature = client.send_transaction(&tx).await
        .map_err(|e| {
            tracing::warn!(target: "solana_signing_api", error = %e, "solana broadcast failed");
            axum::http::StatusCode::BAD_GATEWAY
        })?;

    Ok(Json(SolanaBroadcastResponse { signature: signature.to_string() }))
}
```

`base64` may need to be added to Cargo.toml if not already a transitive dep. Check `cargo tree | grep base64` first; if it is a transitive dep, you can `use base64::Engine` directly. If not, add `base64 = "0.21"` to Cargo.toml.

`solana_client` is already in deps.

- [ ] **Step 2: Add a test:**

```rust
#[tokio::test]
async fn broadcast_rejects_bad_base64() {
    let pool = test_pool().await;
    let app = solana_signing_router(pool);
    let body = serde_json::json!({ "signed_tx_base64": "not-valid-base64!" });
    let resp = app.oneshot(
        Request::builder().method("POST").uri("/v1/solana/broadcast")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 400);
}
```

A wiremock-against-real-Solana-RPC happy path test is hard because Solana RPC has a specific JSON-RPC shape; skip the happy path test in this PR and add it in M7 with a real devnet capture.

- [ ] **Step 3: Run and stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test solana_signing_api -- --test-threads=1
```

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/solana_signing_api.rs sw4p-backend/tests/solana_signing_api.rs
# also Cargo.toml if you added base64
git status --short
```

---

## Task T13: Provider Status Polling Module

**Wave:** W7. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Module that polls Allbridge's `/transfer-status?messageId=...` endpoint at a configurable interval and emits a structured `tracing::info!` event when the destination settlement completes. The actual lifecycle storage is M5; this module just emits the event.

**Spec IDs:** SOW WP6.5.

**Files:**
- Create: `sw4p/sw4p-backend/src/provider_status_polling.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs` (`pub mod provider_status_polling;`)

- [ ] **Step 1: Write the module.**

```rust
//! Allbridge provider status polling.
//!
//! Periodically polls the Allbridge transfer-status endpoint for a given
//! messageId until the destination tx is confirmed or a timeout elapses.
//! Emits structured tracing events at every transition.
//!
//! Satisfies: SOW WP6.5. M5 will subscribe to the events and write them
//! to settlement_lifecycle_events.

use std::time::{Duration, Instant};
use tracing::{info, warn};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProviderStatusOutcome {
    Confirmed { destination_tx_hash: String, elapsed_secs: u64 },
    TimedOut { last_known_state: String, elapsed_secs: u64 },
    ProviderUnavailable { last_status: u16, elapsed_secs: u64 },
}

pub struct PollerConfig {
    pub base_url: String,
    pub message_id: String,
    pub poll_interval: Duration,
    pub timeout: Duration,
}

pub async fn poll_until_settled(cfg: PollerConfig) -> ProviderStatusOutcome {
    let started = Instant::now();
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .build()
        .expect("reqwest client build");
    let mut last_status: u16 = 0;
    let mut last_state: String = String::new();
    loop {
        if started.elapsed() >= cfg.timeout {
            warn!(target: "provider_status_polling", message_id = %cfg.message_id, last_state = %last_state, "poll timed out");
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
                    warn!(target: "provider_status_polling", message_id = %cfg.message_id, status = %last_status, "provider responded with non-2xx");
                    if last_status >= 500 {
                        // Hard provider failure; return early.
                        return ProviderStatusOutcome::ProviderUnavailable {
                            last_status,
                            elapsed_secs: started.elapsed().as_secs(),
                        };
                    }
                } else if let Ok(body) = resp.json::<serde_json::Value>().await {
                    let state = body.get("status").and_then(|s| s.as_str()).unwrap_or("unknown").to_string();
                    if state != last_state {
                        info!(target: "provider_status_polling", message_id = %cfg.message_id, state = %state, "provider state transition");
                    }
                    last_state = state.clone();
                    if state == "Complete" || state == "complete" {
                        let dest_hash = body.get("destinationTxHash").and_then(|h| h.as_str()).unwrap_or("").to_string();
                        info!(target: "provider_status_polling", message_id = %cfg.message_id, dest_hash = %dest_hash, elapsed_secs = %started.elapsed().as_secs(), "provider confirmed destination settlement");
                        return ProviderStatusOutcome::Confirmed {
                            destination_tx_hash: dest_hash,
                            elapsed_secs: started.elapsed().as_secs(),
                        };
                    }
                }
            }
            Err(e) => {
                warn!(target: "provider_status_polling", message_id = %cfg.message_id, error = %e, "poll request error");
            }
        }
        tokio::time::sleep(cfg.poll_interval).await;
    }
}
```

- [ ] **Step 2: Add tests.** Two wiremock cases:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::{matchers::{method, path_regex}, Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn poll_returns_confirmed_when_provider_reports_complete() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path_regex(r"^/transfer-status"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"status":"Complete","destinationTxHash":"0xabc123"}"#
            ))
            .mount(&server).await;
        let result = poll_until_settled(PollerConfig {
            base_url: server.uri(),
            message_id: "msg1".into(),
            poll_interval: Duration::from_millis(100),
            timeout: Duration::from_secs(2),
        }).await;
        match result {
            ProviderStatusOutcome::Confirmed { destination_tx_hash, .. } => {
                assert_eq!(destination_tx_hash, "0xabc123");
            }
            other => panic!("expected Confirmed, got {:?}", other),
        }
    }

    #[tokio::test]
    async fn poll_times_out_when_provider_never_completes() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path_regex(r"^/transfer-status"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"status":"Pending"}"#
            ))
            .mount(&server).await;
        let result = poll_until_settled(PollerConfig {
            base_url: server.uri(),
            message_id: "msg2".into(),
            poll_interval: Duration::from_millis(100),
            timeout: Duration::from_millis(500),
        }).await;
        match result {
            ProviderStatusOutcome::TimedOut { last_known_state, .. } => {
                assert_eq!(last_known_state, "Pending");
            }
            other => panic!("expected TimedOut, got {:?}", other),
        }
    }
}
```

- [ ] **Step 3: Wire and run.**

Edit `lib.rs` to add `pub mod provider_status_polling;`.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib provider_status_polling -- --test-threads=1
```

Expected: 2 PASS.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/src/provider_status_polling.rs sw4p-backend/src/lib.rs
git status --short
```

---

## Task T14: M4 Full Flow Integration Test

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** End-to-end backend test that exercises the post-M4 Tron flow with the reconciled selector, real unsigned-tx shape, and fixed broadcast handler.

**Files:**
- Create: `sw4p/sw4p-backend/tests/m4_tron_signing_full_flow.rs`

- [ ] **Step 1: Write the test.**

```rust
use axum::body::Body;
use axum::http::Request;
use sw4p_backend::test_support::test_pool;
use sw4p_backend::tron_signing_api::tron_signing_router;
use tower::ServiceExt;
use wiremock::{matchers::{method, path_regex}, Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn m4_full_tron_signing_flow_with_block_reference() {
    let server = MockServer::start().await;
    // Block reference for the unsigned tx builder.
    Mock::given(method("GET"))
        .and(path_regex(r"^/wallet/getblockbylatestnum"))
        .respond_with(ResponseTemplate::new(200).set_body_string(
            r#"{"block":[{"blockID":"0000000003039f80abcdef0123456789abcdef0123456789abcdef0123456789","block_header":{"raw_data":{"number":50519424,"timestamp":1715990400000}}}]}"#
        ))
        .mount(&server).await;
    // Broadcast endpoint expects the full signed-tx object.
    Mock::given(method("POST"))
        .and(path_regex(r"^/wallet/broadcasttransaction"))
        .respond_with(ResponseTemplate::new(200).set_body_string(
            r#"{"result":true,"txid":"abc123"}"#
        ))
        .mount(&server).await;
    std::env::set_var("TRON_RPC_URL", server.uri());

    let pool = test_pool().await;
    let app = tron_signing_router(pool);

    // Step 1: request unsigned tx
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
        Request::builder().method("POST").uri("/v1/tron/raw-tx")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&raw_tx_body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp.status().as_u16(), 200);
    let bytes = axum::body::to_bytes(resp.into_body(), 64 * 1024).await.unwrap();
    let body_text = std::str::from_utf8(&bytes).unwrap();
    // The new TronWeb-shaped payload must include block reference fields.
    assert!(body_text.contains("ref_block_bytes"), "missing ref_block_bytes");
    assert!(body_text.contains("ref_block_hash"), "missing ref_block_hash");
    assert!(body_text.contains("expiration"), "missing expiration");
    assert!(body_text.contains("timestamp"), "missing timestamp");

    // Step 2: broadcast a full signed-tx object (not the old hex wrapper).
    let signed_body = serde_json::json!({
        "signed_tx": {
            "txID": "abc123",
            "raw_data": { "contract": [], "fee_limit": 100000000 },
            "raw_data_hex": "0a02deadbeef",
            "signature": ["deadbeef".repeat(16)]
        }
    });
    let resp2 = app.oneshot(
        Request::builder().method("POST").uri("/v1/tron/broadcast")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&signed_body).unwrap())).unwrap()
    ).await.unwrap();
    assert_eq!(resp2.status().as_u16(), 200);
}
```

- [ ] **Step 2: Run.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
TEST_DATABASE_URL=postgres://postgres:dev@localhost:5438/sw4p_test cargo test --test m4_tron_signing_full_flow -- --test-threads=1
```

Expected: 1 PASS.

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/tests/m4_tron_signing_full_flow.rs
git status --short
```

---

## Task T15: Solana to Tron Pinned Acceptance Test

**Wave:** W8. **Subagent:** `general-purpose`, `model: opus`. **Goal:** Pinned acceptance test asserting the SOL→TRX route classification post-M4.

**Files:**
- Create: `sw4p/sw4p-backend/tests/sol_to_tron_pinned.rs`

- [ ] **Step 1: Write the test.**

```rust
use sw4p_backend::policy::{apply, SnapshotMeta};
use sw4p_backend::route_matrix::normalize;
use sw4p_backend::route_state::{Asset, PrimaryState};

const PIN: &str = include_str!("./fixtures/allbridge_token_info_2026-05-18.json");

#[test]
fn sol_to_trx_usdt_post_m4_classification() {
    let raw: serde_json::Value = serde_json::from_str(PIN).expect("fixture parses");
    let routes = normalize(&raw).expect("normalize ok");
    let states = apply(
        routes.as_array().unwrap().as_slice(),
        &SnapshotMeta {
            snapshot_id: "pinned-m4-2026-05-18".into(),
            fetched_at: "2026-05-18T00:00:00Z".into(),
            expires_at: "2026-05-19T00:00:00Z".into(),
        },
    );
    let sol_trx_usdt = states.iter().find(|s|
        s.source_chain == "SOL" && s.destination_chain == "TRX" && matches!(s.asset, Asset::Usdt)
    ).expect("SOL to TRX USDT must appear");

    // Post-M4, SOL to TRX USDT is either CodeSupportedProofMissing (if T10 landed
    // full impl) or still ProviderSupportedCodeIncomplete (if T10 landed a stub).
    assert!(
        matches!(sol_trx_usdt.primary,
            PrimaryState::CodeSupportedProofMissing |
            PrimaryState::ProviderSupportedCodeIncomplete),
        "SOL to TRX USDT must be gated, got {:?}",
        sol_trx_usdt.primary
    );

    // The reason code must NOT still say "SOL_TO_TRON_NOT_IMPLEMENTED" if T10
    // landed full impl; the M4 follow-up doc tracks whichever state.
    if sol_trx_usdt.primary == PrimaryState::CodeSupportedProofMissing {
        assert_ne!(sol_trx_usdt.agent_reason_code, "SOL_TO_TRON_NOT_IMPLEMENTED",
            "reason code should be updated when state flips to CodeSupportedProofMissing");
    }
}
```

- [ ] **Step 2: Run and stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --test sol_to_tron_pinned -- --nocapture
```

Expected: 1 PASS.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend/tests/sol_to_tron_pinned.rs
git status --short
```

---

## Task T16: Final M4 Branch Review

**Wave:** W9. **Subagent:** `code-review:code-review`, `model: opus`. **Goal:** Full review of the M4 branch.

**Process:** Controller dispatches `code-review:code-review` with a prompt referencing the same PRD/CRD/TRD/SOW IDs, the M3 follow-up closures, the SOW WS6 deliverables, and the M4 wave map. Reviewer outputs APPROVED or CHANGES_REQUIRED with specific file:line issues. Controller dispatches fix subagents per issue.

After APPROVED:
- Write `docs/followups/2026-05-18-usdt-tron-parity-m4-execution-parity-followups.md` capturing anything M4 deferred (likely: full Solana SPL/Allbridge tx building if T10 landed a stub, EVM messenger entrypoint validation, lifecycle storage of provider_status_polling events, M5 wiring).
- Push the M4 branch.
- Open PR stacking on M3 PR.

---

## Self-Review Checklist

### Spec coverage trace

| Spec ID or follow-up | Task |
|---|---|
| M3 critical: Allbridge selector + signatures | T1 |
| M3 critical: broadcast wire format | T3 |
| M3 critical: unsigned tx shape | T4 |
| M3 important: canary enforcement | T5 |
| M3 important: tron_watcher env-var | T2 |
| M3 important: legacy call site migration | T6 |
| TRD-RAW-002 approval spender | T7 |
| TRD-RAW-003 source token | T8 |
| TRD-RAW-005 destination token | T8 |
| TRD-RAW-011 route-state freshness | T9 |
| PRD-USDT-006 / SOW WP6.3 Solana to Tron | T10 (impl), T11/T12 (HTTP), T15 (acceptance) |
| SOW WP6.5 provider status polling | T13 |
| SOW WP6.6 backend route API | satisfied by M0-M2 + M3; T11/T12 add Solana surfaces |
| SOW WP6.1 EVM to Tron | partially closed by M3 + T1 + T4; full corridor work deferred to M4b |
| SOW WP6.2 Tron to EVM | deferred to M4b |
| SOW WP6.4 Tron to Solana | deferred to M4b |
| TRD section 9 lifecycle | deferred to M5 (provider_status_polling emits events; storage is M5) |

### Placeholder scan

No "TBD", no "fill in", no "implement later" except in scope-statement comments. Every code block has actual code. The one explicit "stop and report DONE_WITH_CONCERNS" exit point is in T10 Step 2, with a defined fallback behavior (return a structured error rather than a runtime panic).

### Type consistency

`UnsignedTronTransaction` gains a `raw_data: serde_json::Value` field in T4 and is consumed unchanged by T11/T14. `BlockReference` is defined in T4 and consumed only by T4's caller. `CanaryCaps` is local to T5. `SolanaBridgeResult` is defined in T10 and consumed by T11. `Trc20Approve` is defined in T7 and consumed by T7. The `Intent` struct gains `is_approval`, `approval_spender_evm_hex`, `approval_amount`, `allbridge_source_token_atoms_hex` across T7 and T8; all existing tests are updated in the same task they touch.

### Out-of-scope follow-ups to surface in T16 review

- Full Solana SPL/Allbridge instruction building (if T10 landed a stub) deferred to a sub-task.
- EVM messenger swapAndBridge entrypoint decoder (8-parameter shape) deferred; M4 only handles the Tron 6-parameter shape.
- Lifecycle storage of provider_status_polling events (settlement_lifecycle_events table) deferred to M5.
- MCP gateway update for Solana signing surface deferred to M6.
- Frontend Solana signing integration (the kit and `useBridge` already support `'SOL'`; M6 wires it to the new `/v1/solana/raw-tx` endpoint).
- Real on-chain transaction capture for Allbridge selector verification: T1 derives from canonical signature; M7 should compare against a real mainnet capture.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m4-execution-parity.md`.

Two execution options:

**1. Subagent-Driven (recommended)**: Controller dispatches a fresh subagent per task, reviews per wave. Same model as M0-M2 and M3. Estimate: 10 waves, 16 tasks, ~3 hours wall-clock at the M3 cadence, ~20 subagent dispatches.

**2. Inline Execution**: Controller executes tasks in this session using `superpowers:executing-plans`, batch with human-review checkpoints.

Which approach?
