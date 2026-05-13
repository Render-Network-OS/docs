# Fix 1 — Network Dependency Injection Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Registry` the single, structural source of truth for network selection in `sw4p-backend`. After this plan lands, every CCTP / Iris / chain-aware client constructor accepts `Arc<Registry>`, the legacy `network_config.rs` module is deleted, `circle::circle_iris_host()` is deleted, and `NETWORK_MODE` is renamed to `SW4P_NETWORK` in every deploy template — closing A1 Critical #1 and #2 structurally rather than by patch.

**Architecture:** Explicit dependency injection. `Arc<Registry>` is constructed once at boot in `main.rs` / `bin/watcher.rs` (already true), stored on `AppState`, and passed into every client constructor that needs network constants. `Registry::from_env()` reads only `SW4P_NETWORK`. The legacy `network_config::get_network_mode()` and `circle::circle_iris_host()` helpers — and the entire `network_config.rs` module's static address tables — are deleted.

**Tech Stack:** Rust 2021, cargo, sw4p-backend workspace member.

**Base commit:** the tip of `protocol/a1-networks-registry` AFTER Fix 2 lands (Tasks 1-10 of `2026-05-13-fix-2-zksync-ablation.md` complete and pushed). Pull origin to confirm.

**Branch:** continue on `protocol/a1-networks-registry`. Each task = one additive commit on top of Fix 2's tip.

**Spec:** `docs/superpowers/specs/2026-05-13-batch-1-critical-fixes-design.md` § Fix 1.

---

## Setup

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
git fetch origin
git pull --ff-only origin protocol/a1-networks-registry  # picks up Fix 2's commits
git status --short   # clean working tree
git config user.name && git config user.email   # rndrntwrk / dev@rndrntwrk.com
```

Identity discipline: every commit author + committer is `rndrntwrk <dev@rndrntwrk.com>`. NO `Co-Authored-By:` trailer, no `--author` override, no AI attribution. Use `--no-verify` to skip hooks only because this repo has no hooks worth running on additive commits.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `sw4p-backend/src/networks.rs` | Modify | Strip any `NETWORK_MODE` fallback from `Registry::from_env()`. Single env var: `SW4P_NETWORK`. |
| `sw4p-backend/src/network_config.rs` | **Delete** | Address tables moved to `networks.rs`; the `OnceLock<NetworkMode>` cache + `get_*` helpers deleted. |
| `sw4p-backend/src/circle.rs` | Modify | Delete `circle_iris_host()`. Internal Iris-URL builders take `&Registry`. |
| `sw4p-backend/src/cctp_burn.rs` | Modify | `CctpBurnClient::new` takes `Arc<Registry>`. `resolved_*` helpers become registry lookups. Drop `USDC_MINT` / `TESTNET_USDC_MINT` module consts. |
| `sw4p-backend/src/cctp_mint.rs` | Modify | `CctpMintClient::new` takes `Arc<Registry>`. `resolved_usdc_mint()` → registry lookup. |
| `sw4p-backend/src/cctp_attestation.rs` | Modify | `CctpAttestationClient::new` takes `Arc<Registry>`. Iris base URL from `registry.iris_base_url`. |
| `sw4p-backend/src/evm_burn.rs` | Modify | The single `get_network_mode()` caller takes `&Registry` instead. |
| `sw4p-backend/src/relay.rs` | Modify | Same: `&Registry` param replaces `get_network_mode()` call. |
| `sw4p-backend/src/health.rs` | Modify | Health probe builds Iris URL from `state.registry.iris_base_url`. |
| `sw4p-backend/src/main.rs` | Modify | Pass `state.registry.clone()` into the constructors that now require it. |
| `sw4p-backend/src/bin/watcher.rs` | Modify | Same — workers receive `Arc<Registry>`. |
| `sw4p-backend/src/deploy_contract.rs:350` | Modify | Rename `NETWORK_MODE` → `SW4P_NETWORK` in the `format!` env block. |
| `RAILWAY_ENV_TEMPLATE.md` | Modify | All 7 `NETWORK_MODE` references → `SW4P_NETWORK`. |
| `.env.testnet` | Modify | `NETWORK_MODE=testnet` → `SW4P_NETWORK=testnet`. |

---

### Task 1: Strip `NETWORK_MODE` fallback from `Registry::from_env`

**Files:**
- Modify: `sw4p-backend/src/networks.rs:277-294`

- [ ] **Step 1: Write failing test**

In `sw4p-backend/src/networks.rs` test module:

```rust
#[test]
fn from_env_ignores_legacy_network_mode() {
    let _guard = env_guard();
    std::env::remove_var("SW4P_NETWORK");
    std::env::set_var("NETWORK_MODE", "mainnet");
    let r = Registry::from_env().unwrap();
    std::env::remove_var("NETWORK_MODE");
    // NETWORK_MODE is no longer honored — defaults to Testnet
    assert_eq!(r.network, Network::Testnet);
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry/sw4p-backend"
cargo test --lib networks::tests::from_env_ignores_legacy_network_mode 2>&1 | tail -10
```

Expected: FAIL if v1 spec's NETWORK_MODE fallback was implemented, else PASS by accident. Either way, this test locks the contract.

- [ ] **Step 3: Verify `from_env` reads only `SW4P_NETWORK`**

In `sw4p-backend/src/networks.rs:277-294`, the `from_env` function should look like:

```rust
pub fn from_env() -> Result<Self, NetworkError> {
    let raw = env::var("SW4P_NETWORK").unwrap_or_default();
    Self::from_env_str(&raw)
}
```

No `NETWORK_MODE` fallback. If any fallback code exists, delete it.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cargo test --lib networks::tests::from_env_ignores_legacy_network_mode 2>&1 | tail -10
cargo test --lib networks:: 2>&1 | tail -10  # full networks suite
```

Expected: both PASS (networks suite ≥ 23 tests now).

- [ ] **Step 5: Commit**

```bash
git add sw4p-backend/src/networks.rs
git commit -m "refactor(backend): Registry::from_env reads only SW4P_NETWORK (Track A1 Fix 1)" --no-verify
```

---

### Task 2: Refactor `CctpBurnClient` constructor to take `Arc<Registry>`

**Files:**
- Modify: `sw4p-backend/src/cctp_burn.rs` (constructor, `resolved_*` helpers, module consts)
- Modify: callers in `sw4p-backend/src/main.rs`, `bin/watcher.rs`, possibly `relay.rs`

- [ ] **Step 1: Read the current constructor + caller sites**

```bash
grep -n 'CctpBurnClient::new\|impl CctpBurnClient\|pub fn new' sw4p-backend/src/cctp_burn.rs | head
grep -rn 'CctpBurnClient::new' sw4p-backend/src/ | head
```

Note the exact signature and every call site.

- [ ] **Step 2: Write failing test**

```rust
#[test]
fn cctp_burn_client_reads_usdc_mint_from_registry() {
    let registry = Arc::new(Registry::mainnet());
    // Build minimal client deps — use existing test helpers in cctp_burn.rs if present.
    let client = CctpBurnClient::new(registry.clone(), /* other deps */);
    let mint = client.resolved_usdc_mint("SOL").expect("mainnet has Solana");
    assert_eq!(mint, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
}
```

(Use the actual test-helper builders that exist in `cctp_burn.rs`. If there's no helper, this test may need a `#[ignore]`-able variant; do not stub out fake deps that would invalidate the test.)

- [ ] **Step 3: Run test to verify it fails**

```bash
cargo test --lib cctp_burn::tests::cctp_burn_client_reads_usdc_mint_from_registry 2>&1 | tail -15
```

Expected: FAIL — current constructor doesn't take `Arc<Registry>`.

- [ ] **Step 4: Refactor the constructor**

In `sw4p-backend/src/cctp_burn.rs`:
- Add `registry: Arc<Registry>` as the first parameter of `CctpBurnClient::new`.
- Store `self.registry: Arc<Registry>` on the struct.
- Rewrite the four `resolved_*` helpers (at lines ~556-581):
  - `resolved_usdc_mint(chain)` → `self.registry.chain_or_err(parse_chain(chain))?.usdc_mint.clone().ok_or(...)`.
  - `resolved_message_transmitter_v2(chain)` → `self.registry.chain_or_err(...)?.message_transmitter.clone().ok_or(...)`.
  - `resolved_token_messenger_v2(chain)` → `self.registry.chain_or_err(...)?.token_messenger.clone().ok_or(...)`.
  - `resolved_sw4p_native_program_id(chain)` → `self.registry.chain_or_err(...)?.zap_native.clone().ok_or(...)`.
- Delete `pub const USDC_MINT` and `pub const TESTNET_USDC_MINT` from lines 50-51.

- [ ] **Step 5: Update all callers**

`grep -rn 'CctpBurnClient::new' sw4p-backend/src/` → for each caller, add `state.registry.clone()` (or equivalent) as the first argument. In `main.rs` / `bin/watcher.rs`, the `Arc<Registry>` is already constructed; pass `.clone()` into the call.

- [ ] **Step 6: Run cargo check + targeted tests**

```bash
cargo check --lib 2>&1 | tail -20
cargo test --lib cctp_burn:: 2>&1 | tail -15
```

Expected: build clean, cctp_burn tests pass including the new one.

- [ ] **Step 7: Commit**

```bash
git add sw4p-backend/src/cctp_burn.rs sw4p-backend/src/main.rs sw4p-backend/src/bin/watcher.rs
git commit -m "refactor(backend): CctpBurnClient constructor takes Arc<Registry> (Track A1 Fix 1)" --no-verify
```

(Stage only the files actually changed; cargo build will tell you which ones.)

---

### Task 3: Refactor `CctpMintClient` constructor to take `Arc<Registry>`

**Files:**
- Modify: `sw4p-backend/src/cctp_mint.rs` + all `CctpMintClient::new` callers

Pattern identical to Task 2. The differential is the helper rewrite:

- `resolved_usdc_mint()` (currently calls `network_config::get_usdc_address("SOL")`) → `self.registry.solana_usdc_mint().map(str::to_string).ok_or(...)`.

- [ ] **Step 1: Failing test**

```rust
#[test]
fn cctp_mint_client_reads_usdc_mint_from_registry() {
    let registry = Arc::new(Registry::mainnet());
    let client = CctpMintClient::new(registry.clone(), /* other deps */);
    let mint = client.resolved_usdc_mint().unwrap();
    assert_eq!(mint, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
}
```

- [ ] **Step 2: Run, verify FAIL.**

```bash
cargo test --lib cctp_mint::tests::cctp_mint_client_reads_usdc_mint_from_registry 2>&1 | tail -10
```

- [ ] **Step 3: Refactor.** Add `registry: Arc<Registry>` as first param of `CctpMintClient::new`. Rewrite `resolved_usdc_mint()` per the shape above. Delete any module-level USDC mint consts.

- [ ] **Step 4: Update callers** via `grep -rn 'CctpMintClient::new'`.

- [ ] **Step 5: cargo check + test.**

```bash
cargo check --lib 2>&1 | tail -10
cargo test --lib cctp_mint:: 2>&1 | tail -10
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add sw4p-backend/src/cctp_mint.rs sw4p-backend/src/main.rs sw4p-backend/src/bin/watcher.rs
git commit -m "refactor(backend): CctpMintClient constructor takes Arc<Registry> (Track A1 Fix 1)" --no-verify
```

---

### Task 4: Refactor `CctpAttestationClient` constructor + delete `circle_iris_host()`

**Files:**
- Modify: `sw4p-backend/src/cctp_attestation.rs`
- Modify: `sw4p-backend/src/circle.rs` (delete `circle_iris_host()` + internal usages)
- Modify: `sw4p-backend/src/health.rs:171`
- Modify: callers of `CctpAttestationClient::new`

- [ ] **Step 1: Failing test**

```rust
#[test]
fn cctp_attestation_client_uses_registry_iris_url() {
    let testnet_registry = Arc::new(Registry::testnet());
    let client = CctpAttestationClient::new(testnet_registry.clone(), /* other deps */);
    assert!(client.iris_base_url().contains("sandbox"));

    let mainnet_registry = Arc::new(Registry::mainnet());
    let client = CctpAttestationClient::new(mainnet_registry.clone(), /* other deps */);
    assert_eq!(client.iris_base_url(), "https://iris-api.circle.com");
}
```

(Expose a `pub fn iris_base_url(&self) -> &str` accessor on the client to make this testable cleanly.)

- [ ] **Step 2: Run, verify FAIL.**

```bash
cargo test --lib cctp_attestation::tests::cctp_attestation_client_uses_registry_iris_url 2>&1 | tail -10
```

- [ ] **Step 3: Refactor `CctpAttestationClient::new`.** Add `registry: Arc<Registry>` as first param. Store on struct. Add `pub fn iris_base_url(&self) -> &str { &self.registry.iris_base_url }`. Replace any internal `circle::circle_iris_host()` call with `self.iris_base_url()` or `self.registry.iris_base_url.as_str()`.

- [ ] **Step 4: Delete `circle::circle_iris_host()` from `sw4p-backend/src/circle.rs:98-103`.**

- [ ] **Step 5: Rewire `circle.rs`'s internal Iris-URL builders.** Lines 107, 127, 131 of `circle.rs`: change `format!("{}/v2/messages", circle_iris_host())` → either (a) accept `registry: &Registry` as a fn param and use it, or (b) restructure into methods on a `CircleClient` struct that owns `Arc<Registry>`. Choose (b) if there's no clean way to thread the `&Registry` to these call sites; (a) otherwise.

- [ ] **Step 6: Update `health.rs:171`.** Change `format!("{}/v2/burn/USDC/fees/5/6", crate::circle::circle_iris_host())` → `format!("{}/v2/burn/USDC/fees/5/6", state.registry.iris_base_url)`. The handler already has `State<AppState>` in scope.

- [ ] **Step 7: Update `cctp_attestation.rs` tests** that assert on hardcoded URL literals (lines 356-369). Update assertions to derive expected URL from `Registry::mainnet().iris_base_url` instead of inline string literals.

- [ ] **Step 8: Run cargo check + tests**

```bash
cargo check --lib 2>&1 | tail -15
cargo test --lib cctp_attestation:: 2>&1 | tail -15
cargo test --lib circle:: 2>&1 | tail -15
cargo test --lib health:: 2>&1 | tail -10
```

Expected: build clean; all targeted suites pass.

- [ ] **Step 9: Commit**

```bash
git add sw4p-backend/src/cctp_attestation.rs sw4p-backend/src/circle.rs sw4p-backend/src/health.rs sw4p-backend/src/main.rs sw4p-backend/src/bin/watcher.rs
git commit -m "refactor(backend): delete circle_iris_host; CctpAttestation takes Arc<Registry> (Track A1 Fix 1)" --no-verify
```

---

### Task 5: Refactor `evm_burn.rs` + `relay.rs` direct `get_network_mode()` callers

**Files:**
- Modify: `sw4p-backend/src/evm_burn.rs:119` (and surrounding fn signature)
- Modify: `sw4p-backend/src/relay.rs:1436` (and surrounding fn signature)

- [ ] **Step 1: Read both call sites + their containing fn signatures**

```bash
grep -B 3 -A 3 'get_network_mode' sw4p-backend/src/evm_burn.rs sw4p-backend/src/relay.rs | head -40
```

- [ ] **Step 2: Pick the threading approach for each.** Two options per fn:
  (a) Add `registry: &Registry` as a parameter to the containing fn — preferred if the fn is reachable from a handler that has `&AppState` in scope.
  (b) Convert the free fn into a method on a struct that owns `Arc<Registry>` — preferred if the fn is called from many sites or already part of a logical client.

  Decide per-fn by reading the call graph (`grep -rn '<fn_name>'`).

- [ ] **Step 3: Refactor evm_burn.rs:119**

If (a): change the containing fn signature to accept `registry: &Registry`, replace the `crate::network_config::get_network_mode()` call with `registry.network`, and update every caller (likely 1-3) to pass `&state.registry`.

If (b): make it a method on whichever struct holds the relevant logic.

- [ ] **Step 4: Refactor relay.rs:1436** — same pattern.

- [ ] **Step 5: cargo check + tests**

```bash
cargo check --lib 2>&1 | tail -15
cargo test --lib evm_burn:: 2>&1 | tail -10
cargo test --lib relay:: 2>&1 | tail -10
```

Expected: build clean, tests pass.

- [ ] **Step 6: Commit**

```bash
git add sw4p-backend/src/evm_burn.rs sw4p-backend/src/relay.rs
git commit -m "refactor(backend): evm_burn + relay take &Registry instead of NETWORK_MODE (Track A1 Fix 1)" --no-verify
```

---

### Task 6: Delete `network_config.rs`

**Files:**
- Delete: `sw4p-backend/src/network_config.rs`
- Modify: `sw4p-backend/src/lib.rs` (remove `pub mod network_config;`)
- Possibly migrate tests from `network_config.rs` into `networks.rs`

- [ ] **Step 1: Confirm there are no remaining consumers of `network_config`**

```bash
grep -rn 'crate::network_config\|use.*network_config' sw4p-backend/src/ | grep -v 'network_config.rs:'
```

Expected: zero matches outside the file itself. If any remain, you missed a caller in Tasks 2-5 — go back and migrate.

- [ ] **Step 2: Move any worth-keeping tests from `network_config.rs` to `networks.rs`**

The agent's prior `network_config.rs` had tests at lines 431-444 (`get_network_mode / is_testnet`) and other test cases. Read them; if any test verifies behavior that `networks.rs` doesn't already cover, port them as Registry-fixture tests in `networks.rs`'s `mod tests`. If `networks.rs` already covers the behavior, drop the test.

- [ ] **Step 3: Delete the file**

```bash
git rm sw4p-backend/src/network_config.rs
```

- [ ] **Step 4: Remove the `mod` declaration**

In `sw4p-backend/src/lib.rs`, remove the line that declares `pub mod network_config;` (or the equivalent).

- [ ] **Step 5: cargo check + test**

```bash
cargo check --lib 2>&1 | tail -15
cargo test --lib 2>&1 | tail -10
```

Expected: build clean, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(backend): delete legacy network_config module (Track A1 Fix 1)" --no-verify
```

---

### Task 7: Hard cutover `NETWORK_MODE` → `SW4P_NETWORK` in deploy templates + scripts

**Files:**
- Modify: `RAILWAY_ENV_TEMPLATE.md` (7 references)
- Modify: `.env.testnet` (1 reference)
- Modify: `sw4p-backend/src/deploy_contract.rs:350`

- [ ] **Step 1: Sed the templates**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
sed -i.bak 's/NETWORK_MODE/SW4P_NETWORK/g' RAILWAY_ENV_TEMPLATE.md .env.testnet
rm RAILWAY_ENV_TEMPLATE.md.bak .env.testnet.bak
```

- [ ] **Step 2: Sed the Rust deploy script**

```bash
sed -i.bak 's/NETWORK_MODE/SW4P_NETWORK/g' sw4p-backend/src/deploy_contract.rs
rm sw4p-backend/src/deploy_contract.rs.bak
```

- [ ] **Step 3: Verify**

```bash
grep -rn 'NETWORK_MODE' RAILWAY_ENV_TEMPLATE.md .env.testnet sw4p-backend/src/deploy_contract.rs
```

Expected: zero results.

- [ ] **Step 4: cargo check** (deploy_contract.rs is in a binary path; make sure it still compiles)

```bash
cd sw4p-backend
cargo check --bins 2>&1 | tail -10
```

Expected: build clean.

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
git add RAILWAY_ENV_TEMPLATE.md .env.testnet sw4p-backend/src/deploy_contract.rs
git commit -m "refactor: rename NETWORK_MODE -> SW4P_NETWORK in templates + scripts (Track A1 Fix 1)" --no-verify
```

---

### Task 8: Verification gate + push

- [ ] **Step 1: Full acceptance grep**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
echo "=== grep: NETWORK_MODE / get_network_mode / circle_iris_host anywhere ==="
grep -rn 'NETWORK_MODE\|get_network_mode\|circle_iris_host' sw4p-backend/src/ RAILWAY_ENV_TEMPLATE.md .env.testnet 2>/dev/null
echo "=== grep: iris-api / hardcoded USDC mints outside networks.rs + test fixtures ==="
grep -rn 'iris-api\|EPjFWdd5\|4zMMC9srt5' sw4p-backend/src/ | grep -v 'networks.rs\|/tests/'
```

Expected: both greps return zero functional results.

- [ ] **Step 2: Full build + test**

```bash
cd sw4p-backend
cargo build --release 2>&1 | tail -5
cargo test --lib 2>&1 | tail -10
```

Expected: build clean, all tests pass.

- [ ] **Step 3: Identity + trailer audit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
git log --format='%an <%ae> | %s' origin/master..HEAD | head -20
git log --format='%B' origin/master..HEAD | grep -iE 'co-authored-by:|generated with claude|🤖|<noreply@|anthropic-bot' && echo "WARN" || echo "clean"
```

Expected: every commit author is `rndrntwrk <dev@rndrntwrk.com>`; trailer scan clean.

- [ ] **Step 4: Push**

```bash
git push origin protocol/a1-networks-registry
```

Expected: fast-forward push. The `protocol/a1-networks-registry` branch now contains: original WIP (`5943ba8`) + gate fix (`3623cf6`) + Fix 2's commits + Fix 1's 7 commits from Tasks 1-7.

---

## Acceptance gate (must all pass before declaring Fix 1 done)

1. `cargo build --release -p sw4p-backend` exit 0.
2. `cargo test --lib` exit 0.
3. `grep -rn 'NETWORK_MODE\|get_network_mode\|circle_iris_host' sw4p-backend/src/` → 0 hits.
4. `grep -rn 'NETWORK_MODE' RAILWAY_ENV_TEMPLATE.md .env.testnet` → 0 hits.
5. `grep -rn 'iris-api\|EPjFWdd5\|4zMMC9srt5' sw4p-backend/src/ | grep -v 'networks.rs\|/tests/'` → 0 hits.
6. `sw4p-backend/src/network_config.rs` does not exist.
7. `sw4p-backend/src/circle.rs` does not contain `circle_iris_host` (function deleted).
8. Every commit on `protocol/a1-networks-registry` from `3623cf6` to the new tip has author `rndrntwrk <dev@rndrntwrk.com>` and zero AI trailers.

---

## Notes for the implementing engineer

- **Cargo watchdog**: prior agents stalled on >10min cargo cycles when output was buffered. **Never** pipe `cargo build` / `cargo test` to `tail` directly in this plan — always to `tee` or unbuffered, so streaming output keeps the watchdog satisfied. The `2>&1 | tail -N` patterns above are safe because they're each ≤60s per scoped command; if you need a full-suite test that runs longer, run it without piping at all and let the streaming output flow.
- **Commit per task**: each task above ends with one commit. **Do not** batch multiple tasks into one commit — each is independently reviewable.
- **No amend / no force-push**: every commit is additive. If you need to fix a mistake, write a new commit on top.
