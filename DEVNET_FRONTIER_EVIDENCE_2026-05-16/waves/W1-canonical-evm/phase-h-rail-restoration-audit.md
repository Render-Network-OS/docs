# Phase H: Hyperlane + Wormhole NTT Restoration Audit

**Wave:** W1 (canonical EVM rails)
**Date:** 2026-05-17 (auditing prior state generated 2026-05-13 through 2026-05-16)
**Worktree:** `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16`
**sw4p HEAD at audit time:** `7fb34ef feat(contracts): record V4.1 Tier 1 SCP-deployed addresses (Sepolia + Base Sepolia)`
**Branch:** `staging/devnet-frontier-2026-05-16`
**Scope:** ZERO on-chain action. Audit + restore files to working tree only. No commits to the sw4p submodule, no cargo build, no deps installed.

---

## 1. Rejection unwind context

The Frontier Engine design spec at `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` originally documented Hyperlane and Wormhole NTT as REJECT:

> Line 663: `| **Wormhole NTT** | **REJECT; do not re-add** |; | NTT is for *project-owned tokens*, not USDC. Its removal was correct. |`
> Line 664: `| **Hyperlane** | **REJECT; do not re-add** |; | Solves long-tail-chain reach; a non-problem for a CCTP-covered set. Its removal was correct. |`
> Line 858: `Re-add any rejected rail. Wormhole NTT, Hyperlane, zkSync/Starknet, and LayerZero are rejected in §10 and stay rejected.`

W0/W1 rejection drivers (from `sw4p-backend` commit `bedf6fc`, the deletion commit):

- **Hyperlane bug 1:** `derive_message_id()` used `DefaultHasher` from `std::collections::hash_map` rather than keccak256. Reference: `/tmp/hyperlane-last.rs:681; use std::collections::hash_map::DefaultHasher;`. Hyperlane on-chain message IDs are `keccak256(message_envelope)`; using `DefaultHasher` means the IDs the backend generates will never match what the destination Mailbox emits, breaking status lookup entirely.
- **Hyperlane bug 2:** `dispatch_message()` constructed Mailbox ABI calldata but never submitted it. Reference: `/tmp/hyperlane-last.rs:285; dispatch_tx: calldata,` returns the hex calldata string in the `dispatch_tx` response field. No `eth_sendRawTransaction` ever runs.
- **Wormhole NTT bug:** All contract addresses are empty strings. Every handler short-circuits with `Err("555 token not yet deployed on {chain}: address is placeholder")` (lines 285 to 519 of the restored file).

### User reversal direction (this task)

- CCTP V2 stays the native USDC corridor (delivered in W1.a through W1.f).
- **Wormhole NTT moves to canonical 555-token cross-chain rail** (Solana mainnet hub, EVM spokes in lock/mint mode).
- Allbridge Core is the USDT corridor (W2 deferred).
- Hyperlane role TBD; restored to working-tree pending decision between Warp Routes (asset bridge) and messaging-only.

The design corpus §10 rejection table and §11 "do not re-add" line both need to flip; this audit precedes the design-doc edit and is its evidence.

---

## 2. File restoration status

| File | Pre-deletion SHA (sw4p repo) | Lines | Status |
|------|------------------------------|-------|--------|
| `sw4p-backend/src/hyperlane.rs` | `f224afe` (parent of deletion) | 1564 | **Restored to worktree** (one import patched, see below) |
| `sw4p-backend/src/wormhole_ntt.rs` | `f224afe` (parent of deletion) | 1332 | **Restored to worktree** (byte-identical to last revision) |

### Restoration command audit trail

```
git show f224afe:sw4p-backend/src/hyperlane.rs > /tmp/hyperlane-last.rs   # 1564 lines
git show f224afe:sw4p-backend/src/wormhole_ntt.rs > /tmp/wormhole-ntt-last.rs   # 1332 lines
cp /tmp/hyperlane-last.rs sw4p-backend/src/hyperlane.rs
cp /tmp/wormhole-ntt-last.rs sw4p-backend/src/wormhole_ntt.rs
```

`git status` after restoration (recorded inside the worktree):

```
Untracked files:
  sw4p-backend/src/hyperlane.rs
  sw4p-backend/src/wormhole_ntt.rs
```

### Single import patch applied to restored hyperlane.rs

The pre-deletion source imported `crate::custom_ism::{CustomIsm, SecurityLevel}`. After deletion commit `bedf6fc`, commit `9668819 fix(backend): purge remaining Hyperlane terminology` **renamed** `custom_ism.rs` to `route_security.rs` and `CustomIsm` to `RouteSecurityModule`. To make the restored file compile cleanly against current `route_security.rs` without rewriting every call site, the import was patched to:

```rust
// Restored after Track A2/A3 reversal. The original module path was
// `crate::custom_ism`, which was renamed to `crate::route_security` in
// commit 9668819 ("fix(backend): purge remaining Hyperlane terminology").
// Aliasing here keeps the rest of this file untouched relative to its last
// pre-deletion revision so the audit diff is clean.
use crate::route_security::{RouteSecurityModule as CustomIsm, SecurityLevel};
```

`route_security::RouteSecurityModule::from_env()` is verified present at line 290 of the current `sw4p-backend/src/route_security.rs`, and `SecurityLevel` is re-exported from the same module. The aliased import is the minimum-blast-radius fix; a follow-up may rename the internal `let ism = CustomIsm::from_env();` call sites (`hyperlane.rs:559` and `:1031`) to use the canonical `RouteSecurityModule` name.

### Module declarations still needed in `sw4p-backend/src/lib.rs` (NOT applied here)

The deletion commit removed two `pub mod` lines from `lib.rs` (lines around 63 and 115 in the pre-deletion source) and roughly 60 lines of axum route declarations. They were **not** restored; restoration of `lib.rs` is a much larger surgical operation that pulls in 6 endpoints worth of routing and is out of scope for an audit step. The two `pub mod` declarations required:

```rust
pub mod hyperlane;
pub mod wormhole_ntt;
```

And the endpoint route additions (from `git show bedf6fc -- sw4p-backend/src/lib.rs`):

- `POST /v1/message/send` → `hyperlane::send_message_handler`
- `GET /v1/message/status/:message_id` → `hyperlane::message_status_handler`
- `POST /v1/bridge/warp` → `hyperlane::warp_transfer_handler`
- `POST /v1/bridge/hyperlane/transfer` → `hyperlane::warp_transfer_handler` (alias)
- `GET /v1/bridge/hyperlane/status/:message_id` → `hyperlane::warp_status_handler`
- `POST /v1/bridge/ntt/transfer` → `wormhole_ntt::ntt_transfer_handler`
- `GET /v1/bridge/ntt/status/:transfer_id` → `wormhole_ntt::ntt_status_handler`
- `GET /v1/hyperlane/config` (public) → `hyperlane::hyperlane_config_handler`
- `GET /v1/bridge/warp/routes` (public) → `hyperlane::warp_routes_handler`
- `GET /v1/bridge/ntt/config` (public) → `wormhole_ntt::ntt_config_handler`
- `GET /v1/bridge/ntt/rate-limits` (public) → `wormhole_ntt::ntt_rate_limits_handler`

These need to be re-added when the rails are actually wired back in; the patch is recorded verbatim in commit `bedf6fc` and can be reverse-applied.

---

## 3. `bridge_protocol.rs` enum diff

### Current state (HEAD, 2026-05-17)

```rust
// sw4p-backend/src/bridge_protocol.rs (full file)
pub enum BridgeProtocol {
    #[serde(rename = "CCTP_V2")]
    CctpV2,
    #[serde(rename = "AllbridgeCore")]
    AllbridgeCore,
}
```

This file was added in commit `08704af feat(sw4p): unify bridge protocol enum for frontier rails` and never carried Hyperlane or NTT variants; it was created **after** the rejection.

### Pre-rejection state (from `bedf6fc` deletion diff against `sw4p-backend/src/route_selector.rs`)

The legacy `BridgeProtocol` enum lived in `route_selector.rs` and carried these variants (removed in `bedf6fc`):

```rust
/// Hyperlane messaging + future warp routes
Hyperlane,
/// Wormhole NTT; 555 token native transfers
WormholeNtt,
```

Also stripped: `is_hyperlane_warp_enabled()`, `is_wormhole_ntt_enabled()`, default-gas estimates (90 sec Hyperlane, 180 sec NTT, $1.50 / $1.00 fees), CB defaults, and two tests (`test_hyperlane_eligible_only_with_feature_flag`, `test_wormhole_ntt_eligible_only_for_555_token_with_feature_flag`).

### Restoration delta needed

To re-enable, two paths exist:

1. **Canonical:** Add `Hyperlane` and `WormholeNtt` variants to the unified `bridge_protocol::BridgeProtocol` enum and update `metric_label()` + `Display`. Then patch `route_selector::eligible()` to push candidates and `multi_hop::execute_route()` to dispatch.
2. **Legacy:** Re-import the deleted variants into `route_selector.rs`'s own enum (the pre-deletion shape). Lossier; diverges from the post-merge canonical enum.

Path 1 is cleaner; it matches commit `08704af`'s unification direction.

---

## 4. 555 Token discovery (Solana mainnet inventory)

### Verdict

**FOUND in repo.** Canonical 555 SPL mint = `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`.

### Repo evidence

39 references across the worktree. Highest-signal pinning points:

- `sw4p-backend/src/ata.rs:19`; `pub const TOKEN_555_MINT: &str = "CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2";`
- `sw4p-backend/src/token_burn_verify.rs:24`; same const.
- `docs/GLOSSARY.md:215`; `- 555: \`CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2\``
- `RAILWAY_MIGRATION_PLAN.md:176`; `TOKEN_555_MINT=CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`
- `sw4p-backend/src/jupiter.rs:337, 352`; Jupiter quote output mint.
- `sw4p-backend/src/relayer.rs:358, 531, 680`; fallback default mint.
- `sw4p-backend/src/swap_handler.rs:550`; fallback default.
- `sw4p-backend/src/withdraw.rs:479`; fallback default.
- `sw4p-backend/src/limit_order_worker.rs:618`, `sw4p-backend/src/dca_worker.rs:870`, `sw4p-backend/src/bin/e2e_swap_test.rs:392`; workers.
- `sw4p-frontend/components/apps/WaaSWallet.tsx:402,531,701`, `Browser.tsx:102`, `DcaApp.tsx:24`, `limitOrderTokenOptions.ts:15`; frontend.
- `docs/guides/dca.mdx`, `docs/guides/limit-orders.mdx`; public docs.

### Deleted-file reference (NTT was already pre-wired with the right address)

`/tmp/wormhole-ntt-last.rs:44`:

```rust
pub const TOKEN_555_ADDRESSES: &[(&str, &str)] = &[
    ("SOL", "CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2"),
    // EVM deployments via NTT (placeholders; fill after deployment):
    ("ETH", ""),
    ("BASE", ""),
    ("ARB", ""),
    ("OP", ""),
];
```

### On-chain verification (Solana mainnet, RPC public endpoint)

```
POST https://api.mainnet-beta.solana.com  getAccountInfo
{
  "jsonrpc":"2.0","result":{
    "context":{"apiVersion":"3.1.14","slot":420329426},
    "value":{
      "data":{"parsed":{
        "info":{
          "decimals":6,
          "freezeAuthority":null,
          "isInitialized":true,
          "mintAuthority":null,
          "supply":"989859465050629"
        },
        "type":"mint"
      },"program":"spl-token","space":82},
      "executable":false,"lamports":1461600,
      "owner":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      "rentEpoch":18446744073709551615,"space":82
    }
  }
}
```

Observations:
- SPL Token (classic, not Token-2022); owner is `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`.
- 6 decimals; matches NTT `amount in base units (6 decimals)` comment.
- Supply: `989,859,465.050629` 555 tokens (current circulating).
- `mintAuthority: null` AND `freezeAuthority: null`; both **renounced**. This matches `/tmp/wormhole-ntt-last.rs:52; "555 is a pump.fun token; mint authority is renounced."` and confirms the locking-mode hub design is required (you cannot mint on the hub because nobody can mint anymore; you must escrow custody).

### Pump.fun lineage

The deleted comment `/tmp/wormhole-ntt-last.rs:52` says "pump.fun token". This is consistent with the mintAuthority being renounced at pump.fun graduation. Not verified separately; the 6-decimal SPL classic with renounced authorities is canonically pump.fun-shaped.

---

## 5. NTT readiness inventory

| Dimension | State |
|-----------|-------|
| Rust source | Restored (1332 lines) from `f224afe:sw4p-backend/src/wormhole_ntt.rs`. |
| Solana hub mint | **Live**; `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`. |
| NTT mode | Locking (Solana hub) + Burning (EVM spokes). Hardcoded `NTT_MODE: NttMode::Locking` at line 59. |
| Wormhole chain IDs | All in source: SOL=1, ETH=2, BASE=30, ARB=23, OP=24. |
| NTT Manager addresses (Solana) | **EMPTY string `""`** in `NTT_MANAGER_ADDRESSES`. No manager program deployed. |
| NTT Manager addresses (EVM) | **EMPTY strings `""`** for ETH/BASE/ARB/OP. No spoke contracts deployed. |
| Transceiver addresses | **EMPTY strings `""`** for all 5 chains. |
| Env var overrides | Plumbed in source via `WORMHOLE_NTT_MANAGER_{CHAIN}` and `WORMHOLE_NTT_TRANSCEIVER_{CHAIN}`. |
| Env var values | **None set.** `grep -E "^(NTT_\|WORMHOLE_)" .env.*` returns 0 results. Only feature flag exists: `.env.testnet: FEATURE_WORMHOLE_NTT=false`. |
| Rust SDK / Cargo deps | **None.** `grep -iE "wormhole\|ntt" sw4p-backend/Cargo.toml` = empty. Implementation is hand-rolled HTTP + ethers/solana_client; no NTT crate exists in the Rust ecosystem. |
| TypeScript SDK | `@wormhole-foundation/sdk-solana-cctp@^4.0.2` is in `sw4p-backend/scripts/package.json:22`. Note this is the **CCTP** flavor of the SDK, not the NTT package. |
| EVM spoke contracts (Solidity) | **None.** `find . -name "*Ntt*.sol" -o -name "*Wormhole*.sol"` = empty. Contracts source dir `sw4p-backend/contracts/contracts/` has only `Sw4pV4Controls.sol`, `ZapAndBridgeV{,4,41}.sol`, `ZapNative.sol`. |
| Anchor Solana programs | **None NTT-related.** `programs/sw4p` and `programs/sw4p-native` exist; neither references NTT, Wormhole, or guardian flows. |
| Deploy scripts | **None.** No `deploy-ntt*`, no `ntt-cli` invocation, no `wormhole-deploy*` scripts in `sw4p-backend/scripts/` or `bin/`. |
| Test coverage in restored file | Tests at lines 1072 to 1332 exist but are env-var-flow tests (e.g., `WORMHOLE_NTT_MANAGER_BASE=0xBaseManager`); no integration test against a real deployment. |

### Open-source NTT components that would be needed (per Wormhole docs)

1. **Solana hub program**; fork of `@wormhole-foundation/example-native-token-transfers/solana/programs/ntt-manager`, set to Locking mode, deploy with the 555 mint as `mint_authority` (it's renounced, so technically the locking-mode escrow doesn't need to mint; it just custody-locks).
2. **EVM spoke contracts (4 chains)**; `NttManager` (Burning) + `WormholeTransceiver` on ETH, BASE, ARB, OP. Each deploys a fresh ERC-20 wrapper-555 token whose mint authority is the local NttManager.
3. **NTT CLI configuration**; `ntt init`, `ntt add-chain`, peer registration on each spoke pointing back to the Solana hub.
4. **Guardian quorum**; production NTT uses Wormhole Guardian Set (19 validators). No bespoke validators required.

### Restoration verdict

Source code restored to worktree. **Real deployment is far from done.** Estimate of remaining work to first end-to-end NTT transfer: 1 spike to deploy hub + one spoke (e.g., Base), wire `.env` overrides, restore `lib.rs` mod + routes, write integration test.

---

## 6. Hyperlane readiness inventory

| Dimension | State |
|-----------|-------|
| Rust source | Restored (1564 lines) from `f224afe:sw4p-backend/src/hyperlane.rs`. |
| Mailbox addresses (mainnet) | **Hardcoded in source** for ETH, OP, ARB, AVAX, BASE, MATIC. Lines 39 to 46 of restored file. Examples: ETH `0xc005dc82818d67AF737725bD4bf75435d065D239`, BASE `0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D`. Not verified against Hyperlane's published registry in this audit. |
| Hyperlane domain IDs | Hardcoded: ETH=1, OP=10, ARB=42161, AVAX=43114, BASE=8453, MATIC=137, SOL=1399811149, STRK=`0x534e5f4d`. |
| Bug 1: `derive_message_id` | `DefaultHasher` (line 681); **must rewrite as `keccak256(message_envelope)`** using `tiny-keccak` or `ethers::utils::keccak256`. |
| Bug 2: `dispatch_message` | Returns ABI calldata in `dispatch_tx` field (line 285); never submits. **Must replace with `provider.send_raw_transaction(...)` flow** using the project's existing ethers signing path. |
| ISM scope | The original implementation gated security_required on a custom ISM check; that module was renamed to `route_security::RouteSecurityModule` in commit `9668819`. The restored hyperlane.rs uses an aliased import (see §2) so the code still calls `CustomIsm::from_env()` at lines 559 and 1031. |
| Env vars | **None set.** `grep -E "^(HYPERLANE_\|MAILBOX_)" .env.*` = empty. Only feature flag: `.env.testnet: FEATURE_HYPERLANE_WARP=false`. |
| Hyperlane SDK / deps | **None.** `grep -iE "hyperlane" sw4p-backend/Cargo.toml` = empty. Implementation is hand-rolled HTTP + ABI encoding. The TypeScript Hyperlane SDK is not installed either. |
| Warp Route contracts | **None.** No `HypERC20*.sol`, no `WarpRoute*.sol` in repo. |
| Registry shape | Hardcoded constants in source. No JSON registry file. |
| Tests | Tests at line 1269 onward verify `derive_message_id` determinism; which is OK structurally but means the wrong hash function is **frozen by tests**. Tests need rewriting when bug 1 is fixed. |

### Hyperlane role decision (TBD per user)

The user task description names this open. The restored file supports BOTH modes:

- **Messaging only:** `dispatch_message` / `check_message_delivery`; useful for cross-chain governance, attestation pipes, or building bespoke bridges atop Hyperlane.
- **Warp Routes (asset bridge):** `execute_warp_transfer` / `warp_routes_handler`; competing with CCTP V2 on the corridor surface.

Given the user reversal places NTT as the canonical 555 cross-chain rail, Hyperlane Warp Routes for 555 would duplicate NTT; **messaging-only** is the cleaner residual scope. This is a recommendation, not a decision; it belongs to the user.

---

## 7. Related modules still needing reverse-application

Beyond the two deleted files, commit `bedf6fc` modified six files in place. The pre-deletion shape of each (as it exists at SHA `f224afe`) needs to be reverse-applied selectively. Quoted from the bedf6fc diff (capture in this audit; no edits applied):

| File | What was stripped | Action needed |
|------|-------------------|---------------|
| `sw4p-backend/src/lib.rs` | `pub mod hyperlane;`, `pub mod wormhole_ntt;`, and 11 axum routes (see §2 list). | Re-add 2 mod lines + 11 route lines. |
| `sw4p-backend/src/config.rs` | `feature_hyperlane: bool`, `feature_wormhole_ntt: bool` FeatureFlags fields; `FEATURE_HYPERLANE` and `FEATURE_WORMHOLE_NTT` env reads; tracing log; config response keys. | Re-add 2 flags + 2 env reads + serialization. |
| `sw4p-backend/src/multi_hop.rs` | `BridgeProtocol::Hyperlane` variant routing; `use crate::hyperlane;`. | Re-add `Hyperlane` case in match (using canonical enum from §3). |
| `sw4p-backend/src/route_selector.rs` | `TOKEN_555_MINT` const; `NTT_CHAINS`, `HYPERLANE_CHAINS` const slices; `BridgeProtocol::Hyperlane` and `::WormholeNtt` variants; eligibility helpers; 2 tests. | Largest reverse-apply; ~80 lines. |
| `sw4p-backend/src/custom_ism.rs` → `route_security.rs` | File renamed; type renamed CustomIsm → RouteSecurityModule. | Hyperlane.rs uses aliased import (see §2). Long-term: rename call sites or change route_security to also export the old alias. |
| `sw4p-backend/src/native_bridge.rs` | "dead imports / env var reads / call sites" per commit message; not enumerated in this audit; needs a focused diff read. | Open. |
| `sw4p-backend/src/metrics.rs` | Doc comment `route_selected_total` no longer advertises "Hyperlane" / "WormholeNTT" Prometheus labels. | Re-add labels in doc + update operator dashboards. |

---

## 8. Blockers + open questions for the user

1. **Hyperlane role (asset bridge or messaging only).** With NTT canonical for 555, Hyperlane Warp Routes overlap NTT's 555 lane and overlap CCTP V2's USDC lane. Recommend messaging-only role; need confirmation.
2. **NTT deployment scope.** Restoration of the Rust handlers requires NTT Manager + Transceiver contracts on Solana (locking hub) + at least one EVM spoke. Decision needed: deploy fresh via NTT CLI, OR is there an existing deployment elsewhere (other chain, prior testnet) whose addresses should populate `WORMHOLE_NTT_MANAGER_{CHAIN}`?
3. **555 hub design.** Solana 555 mint authority is renounced. Locking-mode NTT escrows supply in a PDA-owned associated token account; fine, but the renounced state means the hub's NttManager cannot mint, only lock. Need confirmation that the production target is Solana → EVM unidirectional initially, or full bidirectional with EVM-side burning of wrapped supply on return.

---

## 9. Next-wave plan (concrete checklist)

For a follow-up agent to bring NTT to working state:

- [ ] Decision on Hyperlane role (per Q1).
- [ ] If NTT manager addresses exist elsewhere, drop them into `WORMHOLE_NTT_MANAGER_{SOL,ETH,BASE,ARB,OP}` and `WORMHOLE_NTT_TRANSCEIVER_{...}` env keys (already plumbed in restored code at `wormhole_ntt.rs:570 to 590`).
- [ ] Else: scaffold `programs/ntt-manager-555/` as a fork of `wormhole-foundation/example-native-token-transfers` Solana program; set Locking mode; deploy to devnet first.
- [ ] Solidity spoke: fork `NttManager.sol` + `WormholeTransceiver.sol` from the same upstream; deploy to Base Sepolia first (the chain with the most existing W1 acceptance evidence).
- [ ] Reverse-apply the lib.rs / config.rs / multi_hop.rs / route_selector.rs / metrics.rs / native_bridge.rs deltas from commit `bedf6fc` (see §7 table). Use canonical `BridgeProtocol` enum (§3 path 1).
- [ ] Re-name `CustomIsm` callsites in `hyperlane.rs:559, 1031` to `RouteSecurityModule` (drop the aliased import).
- [ ] **Hyperlane bug 1 fix:** replace `derive_message_id` body with `tiny_keccak::Keccak::v256` or `ethers::utils::keccak256` over the Hyperlane message envelope encoding (origin_domain || sender || dest_domain || recipient || body, with each field length-prefixed per Hyperlane v3 wire format). Rewrite the determinism + uniqueness tests against the real keccak output.
- [ ] **Hyperlane bug 2 fix:** in `dispatch_message`, instead of returning calldata, sign + broadcast via the existing ethers `Wallet::sign_transaction` plus `provider.send_raw_transaction`. Wire to whichever signer abstraction `cctp_burn.rs` uses (it has the working pattern).
- [ ] Reverse-apply 2 deleted tests in `route_selector.rs`: `test_hyperlane_eligible_only_with_feature_flag`, `test_wormhole_ntt_eligible_only_for_555_token_with_feature_flag`.
- [ ] Edit `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` lines 663, 664, 858 to flip the rejection table for NTT (now ACCEPTED for 555 token rail) and Hyperlane (per Q1 decision).
- [ ] Refresh `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md` and the W2/W3 wave plan to absorb NTT + Hyperlane into the corridor model.

---

## 10. State of the worktree at end of this audit

```
sw4p-backend/src/hyperlane.rs      ; restored 1564 lines + 1 import patched, NOT staged in submodule
sw4p-backend/src/wormhole_ntt.rs   ; restored 1332 lines byte-identical, NOT staged in submodule
.env.testnet                       ; pre-existing modification, unrelated to this audit
```

Per the task's "DO NOT add or commit these files yet; restoration touches sub-repo code and needs explicit user review" guidance, the two restored files are **staged in worktree but not committed to the sw4p submodule.** A follow-up agent should:

1. Read the restored files in place.
2. Apply the §7 reverse-application before any first `cargo build`.
3. Decide on a clean commit boundary (probably: one commit restoring files + lib.rs/config.rs wiring + module-only fixes, then a separate commit fixing Hyperlane bugs 1 and 2).

This audit file (committed in the parent `555` repo) is the only artifact of this task. The sw4p-backend submodule is left with restored-but-unwired source so that a human reviewer can read the diff in the worktree before any merge.

---

## 11. Em dash + placeholder scan

This file uses 0 em dashes (per user-level constraint). It uses no AI co-author attribution. No fabricated addresses: the one address asserted (`CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`) is grepped from 39 repo locations and verified via Solana mainnet RPC `getAccountInfo` in §4.

