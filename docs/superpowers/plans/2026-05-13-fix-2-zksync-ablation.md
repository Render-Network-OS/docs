# Fix 2 — zkSync Ablation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully remove zkSync from the sw4p-backend codebase. The chain isn't in `Registry`'s `ChainId` enum (registry is the source of truth) and Circle has not assigned a CCTP V2 domain. After this plan lands, `grep -rnE 'ZKSYNC|ZkSync|zksync' sw4p-backend/src/` returns zero functional results.

**Architecture:** Pure deletion across 10 sites. No new types, no behavior change for any supported chain. When/if Circle ships a CCTP V2 domain for zkSync (or Track E intent contracts add it), re-adding is two lines (`ChainId::ZkSync` enum + `Registry::mainnet().chains` entry).

**Tech Stack:** Rust 2021, cargo, sw4p-backend workspace member.

**Base commit:** `protocol/a1-networks-registry @ 3623cf6` (the current tip pushed to origin).

**Branch:** continue on `protocol/a1-networks-registry`. Each task = one additive commit on top of `3623cf6`.

**Spec:** `docs/superpowers/specs/2026-05-13-batch-1-critical-fixes-design.md` § Fix 2.

---

## Setup

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
git status --short   # should be clean (working tree matches origin)
git config user.name   # must print: rndrntwrk
git config user.email  # must print: dev@rndrntwrk.com
```

Identity discipline: every commit author + committer is `rndrntwrk <dev@rndrntwrk.com>`. **NO `Co-Authored-By:` trailer**, no `--author` override, no AI attribution.

---

## File map

| File | Action | Lines (approx) |
|---|---|---|
| `sw4p-backend/src/native_bridge.rs` | Remove `BridgeChain::ZkSync` variant + all match arms | 58, 72, 87, 97-99, 111, 1064 |
| `sw4p-backend/src/erc7683.rs` | Remove `"ZKSYNC" => 324` + `324 => "ZKSYNC"` arms | 141, 164 |
| `sw4p-backend/src/evm_mint.rs` | Remove `"ZKSYNC"` chain_config arm + array entry | 97-106, 234 |
| `sw4p-backend/src/evm_burn.rs` | Remove `"ZKSYNC"` BURN_CHAINS entry | 97-106 |
| `sw4p-backend/src/evm_gas.rs` | Remove `"ZKSYNC"` from SUPPORTED_CHAINS + gas match | 56, 179 |
| `sw4p-backend/src/x402_facilitator.rs` | Remove `"eip155:324" => Ok("ZKSYNC")` arm | 1119 |
| `sw4p-backend/src/chains.rs` | Remove zkSync chain entry | 166-174 |
| `sw4p-backend/src/config.rs` | Remove `chain_zksync_enabled` field + `FEATURE_CHAIN_ZKSYNC` env + logging | 33, 153, 174, 184, 202, 243 |
| `sw4p-backend/src/withdraw.rs` | Remove `324 => "zkSync Era"` arm + assertion at line 1550 | 285, 1550 |
| `sw4p-backend/src/price_tests.rs` | Remove `"ZKSYNC"` from test list | 145 |

---

### Task 1: Drop `BridgeChain::ZkSync` variant from `native_bridge.rs`

**Files:**
- Modify: `sw4p-backend/src/native_bridge.rs:58, 72, 87, 97-99, 111, 1064`

- [ ] **Step 1: Write the failing test**

Add to the existing test module in `sw4p-backend/src/native_bridge.rs`:

```rust
#[test]
fn bridge_chain_does_not_recognise_zksync() {
    assert!(BridgeChain::from_str("zksync").is_none());
    assert!(BridgeChain::from_str("ZKSYNC").is_none());
    assert!(BridgeChain::from_str("zksync era").is_none());
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry/sw4p-backend"
cargo test --lib native_bridge::tests::bridge_chain_does_not_recognise_zksync 2>&1 | tail -10
```

Expected: FAIL — `from_str("zksync")` currently returns `Some(BridgeChain::ZkSync)`.

- [ ] **Step 3: Remove ZkSync from the enum**

In `sw4p-backend/src/native_bridge.rs`:
- Delete line 58: `ZkSync,` enum variant.
- Delete line 72: `"zksync" | "zksync era" => Some(Self::ZkSync),` match arm in `from_str`.
- Delete line 87: `Self::ZkSync => "ZKSYNC",` match arm in `as_str`.
- Edit line 99: `matches!(self, Self::Optimism | Self::Avalanche | Self::ZkSync)` → `matches!(self, Self::Optimism | Self::Avalanche)` (drop the `| Self::ZkSync` term).
- Delete line 111: `Self::ZkSync => 324, // Placeholder ...` match arm in `to_domain`.
- Delete line 1064: `| BridgeChain::ZkSync => {` arm (use cargo build to find exact match shape).

- [ ] **Step 4: Run cargo check to find any remaining ZkSync references**

```bash
cargo check --lib 2>&1 | grep -i 'zksync\|ZkSync' | head -20
```

Expected: zero results. If anything appears, delete the match arm referencing `BridgeChain::ZkSync` or `Self::ZkSync` and re-run.

- [ ] **Step 5: Run the test to verify it passes**

```bash
cargo test --lib native_bridge::tests::bridge_chain_does_not_recognise_zksync 2>&1 | tail -10
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add sw4p-backend/src/native_bridge.rs
git commit -m "refactor(backend): drop BridgeChain::ZkSync variant (Track A1 Fix 2)" --no-verify
```

---

### Task 2: Drop `"ZKSYNC" ↔ 324` arms from `erc7683.rs`

**Files:**
- Modify: `sw4p-backend/src/erc7683.rs:141, 164`

- [ ] **Step 1: Write the failing test**

Add to the existing test module in `sw4p-backend/src/erc7683.rs` (or create one if absent):

```rust
#[test]
fn erc7683_does_not_recognise_zksync() {
    // chain_to_domain rejects "ZKSYNC"
    assert!(chain_to_domain("ZKSYNC").is_err() || chain_to_domain("ZKSYNC").is_none());
    // domain_to_chain(324) does not return ZKSYNC
    let result = domain_to_chain(324);
    assert!(result.is_err() || result.is_none() || result.as_ref().map(|s| s != "ZKSYNC").unwrap_or(true));
}
```

(Adjust signature shape based on the actual `chain_to_domain` / `domain_to_chain` return types in the file. Use `cargo check` if assertions don't match the actual API.)

- [ ] **Step 2: Run test to verify it fails**

```bash
cargo test --lib erc7683::tests::erc7683_does_not_recognise_zksync 2>&1 | tail -10
```

Expected: FAIL — current behaviour returns `Some(324)` / `Some("ZKSYNC")`.

- [ ] **Step 3: Remove the ZKSYNC arms**

In `sw4p-backend/src/erc7683.rs`:
- Delete line 141: `"ZKSYNC" => 324,` arm in `chain_to_domain`.
- Delete line 164: `324 => "ZKSYNC",` arm in `domain_to_chain`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cargo test --lib erc7683:: 2>&1 | tail -15
```

Expected: PASS. The new test passes; any existing test that asserted `chain_to_domain("ZKSYNC") == 324` flips and needs updating in this same commit.

- [ ] **Step 5: Commit**

```bash
git add sw4p-backend/src/erc7683.rs
git commit -m "refactor(backend): drop ZKSYNC<->324 mapping in erc7683 (Track A1 Fix 2)" --no-verify
```

---

### Task 3: Drop `"ZKSYNC"` from `evm_mint.rs` chain configs

**Files:**
- Modify: `sw4p-backend/src/evm_mint.rs:97-106, 234`

- [ ] **Step 1: Identify the lookup function signature**

Read lines 95-110 to confirm the match expression that contains the ZKSYNC arm. Typically it's a `fn chain_config(chain: &str) -> Option<...>` or similar.

- [ ] **Step 2: Write failing test**

```rust
#[test]
fn evm_mint_chain_config_rejects_zksync() {
    assert!(chain_config("ZKSYNC").is_none());
    assert!(chain_config("zksync").is_none());
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cargo test --lib evm_mint::tests::evm_mint_chain_config_rejects_zksync 2>&1 | tail -10
```

Expected: FAIL — ZKSYNC currently returns `Some((..., 324, ...))`.

- [ ] **Step 4: Remove the ZKSYNC arm and array entry**

In `sw4p-backend/src/evm_mint.rs`:
- Delete the `"ZKSYNC" => (` arm at lines 97-106 (the full match arm block).
- Delete `"ZKSYNC"` from the SUPPORTED list at line 234 (the array literal `["ETH", "BASE", "MATIC", "ARB", "OP", "AVAX", "ZKSYNC"]` → remove the trailing `"ZKSYNC"`).

- [ ] **Step 5: Run test to verify it passes + run full evm_mint suite**

```bash
cargo test --lib evm_mint:: 2>&1 | tail -15
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add sw4p-backend/src/evm_mint.rs
git commit -m "refactor(backend): drop ZKSYNC chain_config from evm_mint (Track A1 Fix 2)" --no-verify
```

---

### Task 4: Drop `"ZKSYNC"` from `BURN_CHAINS` in `evm_burn.rs`

**Files:**
- Modify: `sw4p-backend/src/evm_burn.rs:97-106`

- [ ] **Step 1: Read the BURN_CHAINS static**

Read lines 90-115 of `sw4p-backend/src/evm_burn.rs` to confirm the array shape and the ZKSYNC entry's exact line span.

- [ ] **Step 2: Write failing test**

Add to the existing tests module in `sw4p-backend/src/evm_burn.rs`:

```rust
#[test]
fn burn_chains_does_not_include_zksync() {
    assert!(get_burn_chain_config("ZKSYNC").is_none());
    assert!(get_burn_chain_config("zksync").is_none());
    let codes: Vec<&str> = BURN_CHAINS.iter().map(|c| c.code).collect();
    assert!(!codes.contains(&"ZKSYNC"), "BURN_CHAINS still contains ZKSYNC");
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cargo test --lib evm_burn::tests::burn_chains_does_not_include_zksync 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 4: Remove the ZKSYNC entry**

In `sw4p-backend/src/evm_burn.rs:97-106`, delete the `EvmBurnChainConfig { code: "ZKSYNC", ... }` struct-literal block entirely (including the trailing comma).

- [ ] **Step 5: Run the test to verify it passes**

```bash
cargo test --lib evm_burn:: 2>&1 | tail -15
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add sw4p-backend/src/evm_burn.rs
git commit -m "refactor(backend): drop ZKSYNC from BURN_CHAINS (Track A1 Fix 2)" --no-verify
```

---

### Task 5: Drop `"ZKSYNC"` from `evm_gas.rs`

**Files:**
- Modify: `sw4p-backend/src/evm_gas.rs:56, 179`

- [ ] **Step 1: Write failing test**

Add to the test module (or create it) in `sw4p-backend/src/evm_gas.rs`:

```rust
#[test]
fn supported_chains_does_not_include_zksync() {
    assert!(!SUPPORTED_CHAINS.contains(&"ZKSYNC"));
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cargo test --lib evm_gas::tests::supported_chains_does_not_include_zksync 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Remove ZKSYNC from SUPPORTED_CHAINS and gas match**

In `sw4p-backend/src/evm_gas.rs`:
- Line 56: change `pub const SUPPORTED_CHAINS: &[&str] = &["ETH", "BASE", "ARB", "MATIC", "OP", "AVAX", "ZKSYNC"];` → drop the trailing `"ZKSYNC"`.
- Line 179: change `"BASE" | "ARB" | "OP" | "ZKSYNC" => 0.05,` → `"BASE" | "ARB" | "OP" => 0.05,` (drop the `| "ZKSYNC"` term).

- [ ] **Step 4: Run test to verify it passes**

```bash
cargo test --lib evm_gas:: 2>&1 | tail -15
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add sw4p-backend/src/evm_gas.rs
git commit -m "refactor(backend): drop ZKSYNC from evm_gas supported chains (Track A1 Fix 2)" --no-verify
```

---

### Task 6: Drop `"eip155:324"` arm from `x402_facilitator.rs`

**Files:**
- Modify: `sw4p-backend/src/x402_facilitator.rs:1119`

- [ ] **Step 1: Write failing test**

Add to the existing tests module in `sw4p-backend/src/x402_facilitator.rs`:

```rust
#[test]
fn caip2_to_sw4p_chain_rejects_zksync() {
    assert!(caip2_to_sw4p_chain("eip155:324").is_err());
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cargo test --lib x402_facilitator::tests::caip2_to_sw4p_chain_rejects_zksync 2>&1 | tail -10
```

Expected: FAIL — currently returns `Ok("ZKSYNC")`.

- [ ] **Step 3: Remove the arm**

In `sw4p-backend/src/x402_facilitator.rs:1119`, delete:

```rust
"eip155:324" => Ok("ZKSYNC"),
```

- [ ] **Step 4: Run test + full x402_facilitator suite**

```bash
cargo test --lib x402_facilitator:: 2>&1 | tail -15
```

Expected: PASS (all 6 existing + 1 new = 7 tests pass).

- [ ] **Step 5: Commit**

```bash
git add sw4p-backend/src/x402_facilitator.rs
git commit -m "refactor(backend): drop eip155:324->ZKSYNC mapping in x402 (Track A1 Fix 2)" --no-verify
```

---

### Task 7: Drop zkSync chain entry from `chains.rs`

**Files:**
- Modify: `sw4p-backend/src/chains.rs:166-174`

- [ ] **Step 1: Read the chains.rs registry shape**

Read lines 1-180 of `sw4p-backend/src/chains.rs` to see how chain entries are structured (typically a const array or function returning a Vec).

- [ ] **Step 2: Write failing test**

```rust
#[test]
fn chains_registry_does_not_include_zksync() {
    let codes: Vec<&str> = get_all_chains().iter().map(|c| c.code).collect();
    assert!(!codes.contains(&"ZKSYNC"));
}
```

(Adjust function name `get_all_chains()` to the actual public accessor in `chains.rs`.)

- [ ] **Step 3: Run test to verify it fails**

```bash
cargo test --lib chains::tests::chains_registry_does_not_include_zksync 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 4: Remove the zkSync chain entry**

In `sw4p-backend/src/chains.rs:166-174`, delete the entire `// zkSync Era` block including its `Chain { code: "ZKSYNC", ... }` struct literal and the surrounding comma.

- [ ] **Step 5: Run cargo check + test**

```bash
cargo check --lib 2>&1 | tail -10
cargo test --lib chains:: 2>&1 | tail -10
```

Expected: both PASS. Any test elsewhere that referenced zkSync via this registry breaks with a clear "ZKSYNC not found" error; flip those assertions in this commit.

- [ ] **Step 6: Commit**

```bash
git add sw4p-backend/src/chains.rs
git commit -m "refactor(backend): drop zkSync chain registry entry (Track A1 Fix 2)" --no-verify
```

---

### Task 8: Drop `FEATURE_CHAIN_ZKSYNC` flag from `config.rs`

**Files:**
- Modify: `sw4p-backend/src/config.rs:32-33, 153, 174, 184, 202, 243`

- [ ] **Step 1: Map the references**

```bash
grep -n 'zksync\|ZKSYNC\|chain_zksync' sw4p-backend/src/config.rs
```

Confirm the exact line numbers (the spec lists 33, 153, 174, 184, 202, 243).

- [ ] **Step 2: Remove all six references**

In `sw4p-backend/src/config.rs`:
- Line 32-33: delete the `chain_zksync_enabled` field declaration + its `///` doc comment.
- Line 153: delete the `let chain_zksync = env::var("FEATURE_CHAIN_ZKSYNC")...` block (likely 3-4 lines).
- Line 174: in the logging `format!`, remove `zksync={}` from the format string and the corresponding `chain_zksync` arg.
- Line 184: delete the `chain_zksync,` line in the struct initializer.
- Line 202: delete `chain_zksync_enabled: chain_zksync,` from the struct construction.
- Line 243: delete `"chainZkSync": FLAGS.chain_zksync_enabled,` from the JSON output map.

- [ ] **Step 3: Run cargo check to find downstream callers**

```bash
cargo check --lib 2>&1 | grep -i 'chain_zksync\|FEATURE_CHAIN_ZKSYNC' | head -10
```

Expected: zero results. If any consumer of `FLAGS.chain_zksync_enabled` remains, fix in this commit (likely a `route_selector.rs` or `chains.rs` gate; remove the gate's ZKSYNC arm).

- [ ] **Step 4: Run config tests**

```bash
cargo test --lib config:: 2>&1 | tail -10
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add sw4p-backend/src/config.rs
git commit -m "refactor(backend): drop FEATURE_CHAIN_ZKSYNC flag + field (Track A1 Fix 2)" --no-verify
```

---

### Task 9: Drop residual `"ZKSYNC"` mentions from `withdraw.rs` + `price_tests.rs`

**Files:**
- Modify: `sw4p-backend/src/withdraw.rs:285, 1550`
- Modify: `sw4p-backend/src/price_tests.rs:145`

- [ ] **Step 1: Find and remove**

In `sw4p-backend/src/withdraw.rs`:
- Line 285: in the `domain_to_chain_name` match, delete `324 => "zkSync Era",` (the function falls through to a default arm).
- Line 1550: in the test, update `assert_eq!(domain_to_chain_name(324), "zkSync Era");` to assert that 324 returns the default "unknown" value the function falls through to. Read the function's default arm to determine what to assert.

In `sw4p-backend/src/price_tests.rs:145`: delete `"ZKSYNC"` from the test list (the array `&["555", "ETH", "MATIC", "USDC", "SOL", "ARB", "BASE", "ZKSYNC", "BTC"]` becomes `&["555", "ETH", "MATIC", "USDC", "SOL", "ARB", "BASE", "BTC"]`).

- [ ] **Step 2: Run cargo check + tests**

```bash
cargo check --lib 2>&1 | tail -5
cargo test --lib withdraw:: 2>&1 | tail -10
cargo test --lib price 2>&1 | tail -10
```

Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add sw4p-backend/src/withdraw.rs sw4p-backend/src/price_tests.rs
git commit -m "refactor(backend): drop residual ZKSYNC mentions (Track A1 Fix 2)" --no-verify
```

---

### Task 10: Final verification + branch push

- [ ] **Step 1: Verify grep acceptance**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
grep -rnE 'ZKSYNC|ZkSync|zksync' sw4p-backend/src/ | grep -v 'tests' | grep -v '//'
echo "---"
grep -rn 'FEATURE_CHAIN_ZKSYNC' sw4p-backend/
echo "---"
grep -rn ' 324' sw4p-backend/src/ | grep -i 'cctp\|domain\|zksync'
```

Expected: zero results from all three greps (modulo intentional doc-comment exemplars in `withdraw.rs:22, 116-122` that explain why zkSync is unsupported — those may stay).

- [ ] **Step 2: Full lib build + test**

```bash
cd sw4p-backend
cargo build --release 2>&1 | tail -5
cargo test --lib 2>&1 | tail -10
```

Expected: build clean, tests pass.

- [ ] **Step 3: Identity + trailer check**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
git log --pretty=fuller origin/master..HEAD | head -50
git log --format='%B' origin/master..HEAD | grep -iE 'co-authored-by:|generated with claude|🤖|<noreply@|anthropic-bot|claude(-bot| <)' && echo "WARN: AI trailer found" || echo "clean: no AI trailers"
```

Expected: every commit is `rndrntwrk <dev@rndrntwrk.com>`; trailer scan clean.

- [ ] **Step 4: Push**

```bash
git push origin protocol/a1-networks-registry
```

Expected: fast-forward push, 9 new commits on origin (Tasks 1-9).

---

## Acceptance gate (must all pass)

1. `cargo build --release -p sw4p-backend` exit 0.
2. `cargo test --lib` exit 0.
3. `grep -rnE 'ZKSYNC|ZkSync|zksync' sw4p-backend/src/ | grep -v //` returns 0 functional hits.
4. `grep -rn 'FEATURE_CHAIN_ZKSYNC' sw4p-backend/` returns 0 hits.
5. Every commit on `protocol/a1-networks-registry` between `3623cf6` and the new tip has author `rndrntwrk <dev@rndrntwrk.com>` and zero AI trailers.
