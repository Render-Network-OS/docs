# Batch 1 — Critical Fixes Design (v2 — frontier-practice)

**Date:** 2026-05-13
**Status:** approved (in chat); pending spec review before implementation
**Supersedes:** v1 of this doc (committed at `b0cdf83c`), which proposed soft pragmatic compromises that wouldn't actually deliver the SOW's stated acceptance condition.
**Scope:** the four Critical findings from the Batch 1 code reviews. No Important or Minor items here — those land as fast-follows after the Criticals merge.
**Branches affected:**
- `sw4p` repo, `protocol/a1-networks-registry` (three fixes here)
- `sw4p-kit` repo, `kit/c1-c2-cli` (one fix here)

---

## v1 → v2 delta

After an audit pass, three of v1's four recommendations were upgraded to the more aggressive (and structurally cleaner) options:

| Question | v1 | v2 | Why |
|---|---|---|---|
| Fix 1 mechanism | OnceLock process-global | **Thread `&Registry` / `Arc<Registry>` through constructors** | Audit showed the merge-conflict argument was overstated — only `main.rs` overlaps the in-flight branches and that's auto-resolvable. Explicit DI is the frontier practice; the codebase's existing `AppState.registry: Arc<Registry>` is the DI container, and a parallel global undermines it. |
| `NETWORK_MODE` back-compat | Soft deprecation + warning | **Hard cutover** | Sw4p is pre-mainnet; no production operator exists. The 8 references in `RAILWAY_ENV_TEMPLATE.md` and `.env.testnet` ARE the installed base, and they're text files we own. |
| zkSync scope | Fail-closed CCTP paths only | **Full ablation** | Zero operator-facing zkSync config exists. The 5 zkSync code sites are vestigial pre-Registry code that contradicts the new source of truth. Settlement protocols (Across, LayerZero, Stargate) don't carry types for unsupported chains. |
| Claude Code scope | 4-option menu | **Smart default + conditional project prompt + `--project`/`--user-only` flags** | Mature CLIs default-to-common-case (`gh`, `npm`, `eslint init`). Surfacing scope to every user puts a power-user decision in front of every user. |

---

## Why this spec exists

The Batch 1 implementation pass shipped five branches. Five Opus reviews ran. Four Critical findings surfaced; their common shape is "the SOW's stated acceptance condition isn't structurally true — only locally true at one consumer." Patching individual call sites would keep the architectural problem alive. This design fixes the architecture so the acceptance condition holds for every consumer, present and future.

---

## Fix 1 — Single source of truth for network selection (A1 Critical #1 + #2)

### Problem

Two env-driven network selectors exist in the codebase:

- `SW4P_NETWORK` — read by `Registry::from_env()` at boot, propagated via `Arc<Registry>` on `AppState`.
- `NETWORK_MODE` — read by `network_config::get_network_mode()`, cached in a module-local `OnceLock`, exposed as the legacy address-table selector.

Outside of `x402_facilitator.rs`, **no production consumer actually reads the registry**:
- `cctp_burn.rs:556-581` — four `resolved_*` helpers branch on `crate::network_config::get_network_mode()`.
- `cctp_mint.rs:36-39` — `resolved_usdc_mint()` reads `network_config::get_usdc_address("SOL")`.
- `evm_burn.rs:119`, `relay.rs:1436` — direct `get_network_mode()` callers.
- `circle.rs:98-103` `circle_iris_host()` reads `SW4P_NETWORK` *or* `NETWORK_MODE` for Iris URL selection. Called from `cctp_attestation.rs`, `health.rs:171`, `circle.rs:107/127/131`.

Registry's `iris_base_url` is loaded but only read at startup logging (`main.rs:184`). Two parallel selectors that can disagree at runtime.

### Design — explicit dependency injection

#### Mechanism

1. **Every CCTP / Iris / network-aware client constructor accepts a registry.** Signature shape:
   ```rust
   impl CctpBurnClient {
       pub fn new(registry: Arc<Registry>, ...other_deps) -> Self { ... }
   }
   ```
   Same for `CctpMintClient`, `CctpAttestationClient`. Stored as `self.registry: Arc<Registry>`. The four `resolved_*` helpers (and their equivalents in `cctp_mint.rs`) become one-line registry lookups via `self.registry.chain_or_err(ChainId::Sol)?` etc.

2. **Function-level callers (not part of a client struct) accept `&Registry`.** Concretely: `evm_burn.rs:119`, `relay.rs:1436`, and any other free function reading `get_network_mode()` gains a `registry: &Registry` parameter. Callers (which have `AppState` in scope per `main.rs:189-210`) pass `&state.registry`.

3. **Iris URL plumbing.** `circle::circle_iris_host()` is **deleted**. Callers take `registry: &Registry` and read `registry.iris_base_url.as_str()` directly. Specifically:
   - `cctp_attestation.rs:35` (constructor) accepts `Arc<Registry>`.
   - `health.rs:171` accepts `&Registry` from the handler signature (it already has `State<AppState>`).
   - The internal `circle.rs:107/127/131` calls become receiver methods on a new `CircleClient` struct, or take `&Registry` directly.

4. **`network_config.rs` is deleted.** Its public functions (`get_network_mode`, `get_usdc_address`, `get_message_transmitter`, `get_token_messenger`, `is_testnet`) had two responsibilities — env reading and address-table lookup. Both are replaced by the Registry. Tests in `network_config.rs` (if they verified address-table correctness) migrate to `networks.rs` with `Registry::mainnet()` / `Registry::testnet()` fixtures.

5. **`NETWORK_MODE` env var — hard cutover.** Removed entirely. `Registry::from_env()` reads only `SW4P_NETWORK`. The `NETWORK_MODE` references in `RAILWAY_ENV_TEMPLATE.md` (7), `.env.testnet` (1), and `deploy_contract.rs:350` (the `format!` line that builds the deploy-script env block) are renamed to `SW4P_NETWORK` in the same commit. No deprecation warning — there is no installed base.

#### Files changed

| File | Change |
|---|---|
| `sw4p-backend/src/networks.rs` | No structural change. Optionally simplify `from_env()` (remove any `NETWORK_MODE` fallback that v1 considered). |
| `sw4p-backend/src/network_config.rs` | **Deleted.** Tests migrate to `networks.rs`. |
| `sw4p-backend/src/circle.rs` | Delete `circle_iris_host()`. Functions that hit Iris become free fns or methods taking `&Registry`. Tests updated. |
| `sw4p-backend/src/cctp_burn.rs` | `CctpBurnClient::new()` takes `Arc<Registry>`. Replace `resolved_usdc_mint()` etc. with registry lookups. Drop module consts `USDC_MINT` / `TESTNET_USDC_MINT`. |
| `sw4p-backend/src/cctp_mint.rs` | Same constructor change. `resolved_usdc_mint()` becomes one-line registry lookup. |
| `sw4p-backend/src/cctp_attestation.rs` | Constructor takes `Arc<Registry>`. Iris URL from registry. Test base URLs derived from `Registry::testnet().iris_base_url`. |
| `sw4p-backend/src/evm_burn.rs` | The one `get_network_mode()` caller takes `&Registry` param. `BURN_CHAINS` static array is **replaced** with derived-from-registry data (or wraps registry lookups). |
| `sw4p-backend/src/relay.rs` | Same: take `&Registry` where `get_network_mode()` was read. |
| `sw4p-backend/src/health.rs` | Health probe takes `&Registry`. |
| `sw4p-backend/src/main.rs` | No structural change beyond passing `state.registry.clone()` into the constructors that now require it. (Already constructs `Arc<Registry>`.) |
| `sw4p-backend/src/bin/watcher.rs` | Same pattern — workers receive `Arc<Registry>` at spawn time. |
| `sw4p-backend/src/deploy_contract.rs:350` | Rename `NETWORK_MODE` → `SW4P_NETWORK` in the `format!` env block. |
| `RAILWAY_ENV_TEMPLATE.md` | All 7 `NETWORK_MODE` references → `SW4P_NETWORK`. |
| `.env.testnet` | `NETWORK_MODE=testnet` → `SW4P_NETWORK=testnet`. |
| Tests across the above | Construct `Registry::testnet()` / `Registry::mainnet()` as fixtures rather than mutating env. |

#### Test plan

- Every test that previously used `std::env::set_var("NETWORK_MODE", ...)` is rewritten to construct an explicit `Registry::mainnet()` / `Registry::testnet()` fixture and pass it as `Arc<Registry>` to the client under test. Tests no longer touch process env.
- New unit tests in `cctp_burn` / `cctp_mint` / `cctp_attestation`: with a testnet registry, the client reads the testnet USDC mint / Iris sandbox URL; with a mainnet registry, the mainnet values.
- `cargo check -p sw4p-backend` exits 0.
- `cargo test --lib` exits 0 (full lib suite).
- `cargo test --tests` exits 0 where feasible (integration tests may need DB / RPC mocks; preserve existing skip-without-env conventions).

#### Acceptance

- The SOW grep acceptance criterion **structurally** holds. `grep -rn 'iris-api\|EPjFWdd5\|4zMMC9srt5' sw4p-backend/src/ | grep -v 'networks.rs\|/tests/'` returns 0.
- `grep -rn 'NETWORK_MODE\|get_network_mode\|circle_iris_host' sw4p-backend/src/` returns 0.
- `grep -rn 'NETWORK_MODE' RAILWAY_ENV_TEMPLATE.md .env.testnet` returns 0.
- Setting `SW4P_NETWORK=mainnet` with everything else default produces a process that hits `https://iris-api.circle.com` for attestation and uses the canonical EVM mainnet USDC addresses.

---

## Fix 2 — zkSync ablation (A1 Critical #3)

### Problem

`cctp_burn.rs` and `withdraw.rs` removed their `ZKSYNC = 324` placeholders. Five other modules still encode `324` as zkSync's CCTP V2 domain; in addition, infrastructure code (`chains.rs`, `evm_gas.rs`, `config.rs`) carries zkSync as a generic EVM chain that no rail can actually settle. The reviewer's audit confirmed zero operator-facing zkSync configuration exists — the chain is internal-code only.

### Design — full ablation; Registry is the source of truth

If a chain isn't in the Registry's `ChainId` enum, sw4p doesn't support it. Period. zkSync is not in `ChainId`; the residual sites are vestigial.

#### Mechanism

Remove zkSync **everywhere** outside the Registry. When Circle ships a CCTP V2 domain for zkSync (or sw4p decides to support it via Track E intent contracts), re-adding it is two lines: append `ChainId::ZkSync` to the `ChainId` enum + the entry to `Registry::mainnet().chains`. All downstream code that grew zkSync arms re-grows them at that time via `cargo check`'s non-exhaustive-match warnings.

#### Files changed

| File | Change |
|---|---|
| `sw4p-backend/src/native_bridge.rs` | **Delete `BridgeChain::ZkSync` variant** + all its match arms (`from_str` line 72, `as_str` line 87, `is_new_chain` line 99, `to_domain` line 111, line 1064). |
| `sw4p-backend/src/erc7683.rs` | Delete `"ZKSYNC" => 324` (line 141) and `324 => "ZKSYNC"` (line 164) arms. |
| `sw4p-backend/src/evm_mint.rs` | Delete `"ZKSYNC"` chain_config arm (lines 97-106) + the `"ZKSYNC"` literal in the SUPPORTED list (line 234). |
| `sw4p-backend/src/evm_burn.rs` | Delete the `"ZKSYNC"` entry from `BURN_CHAINS` (lines 97-106). |
| `sw4p-backend/src/evm_gas.rs` | Delete `"ZKSYNC"` from `SUPPORTED_CHAINS` (line 56) and from the gas-pricing match (line 179). |
| `sw4p-backend/src/x402_facilitator.rs:1119` | Delete `"eip155:324" => Ok("ZKSYNC")` arm. (Pre-Registry legacy mapping; redundant now that the gate is registry-driven.) |
| `sw4p-backend/src/chains.rs:166-174` | Delete the zkSync chain entry. |
| `sw4p-backend/src/config.rs` | Delete `chain_zksync_enabled` field (line 33), the `FEATURE_CHAIN_ZKSYNC` env read (line 153), the logging line (line 174), the struct init line (line 184), the JSON serialization line (line 243). |
| `sw4p-backend/src/withdraw.rs:285` | `324 => "zkSync Era"` — drop. The fail-closed pattern at `chain_to_domain` line 1433-1434 stays as the doc-comment exemplar. |
| `sw4p-backend/src/price_tests.rs:145` | Drop `"ZKSYNC"` from the test list. |
| Tests across the above | Drop any assertion that asserted on `324` or `"ZKSYNC"`. |

#### Test plan

- `cargo build --release -p sw4p-backend` exits 0.
- `cargo test --lib` exits 0.
- No new tests required (this is a deletion pass; existing tests update to drop their zkSync arms).

#### Acceptance

- `grep -rn '324' sw4p-backend/src/ | grep -i 'cctp\|domain\|zksync'` returns zero hits (modulo intentional fail-closed doc comments in `withdraw.rs`).
- `grep -rn -E 'ZKSYNC|ZkSync|zksync' sw4p-backend/src/` returns zero hits.
- `grep -rn 'FEATURE_CHAIN_ZKSYNC' sw4p-backend/` returns zero hits.
- Any user request that supplies `"ZKSYNC"` / `"zksync"` / domain `324` to a CCTP or chain-routing path now returns an unambiguous "unsupported chain" error from the registry's existing `chain_or_err` / `from_str` paths.

---

## Fix 3 — Claude Code MCP config (C1/C2 Critical)

### Problem

`sw4p-kit/src/cli/_platforms.ts:43` writes to `~/.claude/settings.json` (Claude Code's user-level settings file). Claude Code reads its **settings** from there but reads **MCP server registrations** from `~/.claude.json` (top-level `$HOME` dotfile) or `<cwd>/.mcp.json` (project-local). Documented at https://code.claude.com/docs/en/mcp.

### Design — smart default + conditional project prompt + CLI flags

Single platform entry. Smart default behavior. Project-local registration only surfaces when the user's filesystem signals they're in a project context. Power users get explicit flags for scripted runs.

#### Mechanism

1. **`_platforms.ts`** — single `claude-code` entry:
   ```ts
   {
     id: "claude-code",
     label: "Claude Code",
     configPath: (home, _cwd) => path.join(home, ".claude.json"),
     format: "json",
     mcpKey: "mcpServers",
   }
   ```
   No `claude-code-project`. The project-local case is handled in the init flow, not as a separate platform.

2. **`init.ts` flow** — after writing to `~/.claude.json`, run a project-local detection step:
   ```
   if (existsSync(path.join(cwd, ".mcp.json")) || flags.project) {
     ask: "Also register sw4p in this project's .mcp.json? [Y/n]"
     on yes: write to <cwd>/.mcp.json with same backup-before-mutate discipline
   }
   ```
   If neither the file exists nor `--project` was passed, no prompt — user-level only.

3. **CLI flags** (added to `init.ts`'s arg parser):
   - `--project` — force project-local registration regardless of file presence (creates `<cwd>/.mcp.json` if absent).
   - `--user-only` — skip the project-local detection step even if `.mcp.json` exists.
   - Both flags accepted on `sw4p-kit-init`. Mutually exclusive — passing both errors.

4. **`doctor.ts`** — reports user-level Claude Code registration always; additionally reports project-local registration **only when `<cwd>/.mcp.json` exists**. If neither: "not registered". Exit-code semantics unchanged.

5. **Backup discipline** — same atomic write + timestamped backup pattern for both files. The atomic-write fix from C1/C2 Important #4 (temp + rename) lands in a separate commit on the same branch; this fix doesn't fold it in to keep diffs reviewable.

#### Files changed

| File | Change |
|---|---|
| `sw4p-kit/src/cli/_platforms.ts:41-46` | Single entry, path → `~/.claude.json`. |
| `sw4p-kit/src/cli/init.ts` | Add post-write project-local detection step + Y/n prompt. Add `--project` / `--user-only` flag parsing. |
| `sw4p-kit/src/cli/doctor.ts` | Conditional project-local report. |
| `sw4p-kit/src/__tests__/cli/_platforms.test.ts:30-31` | Update path assertion. |
| `sw4p-kit/src/__tests__/cli/init.test.ts` | Cover the four scenarios: (a) no `.mcp.json` and no flag → user-only write; (b) `.mcp.json` present, user says no → user-only; (c) `.mcp.json` present, user says yes → both writes + two backups; (d) `--project` flag with no `.mcp.json` → user + new `.mcp.json`. |
| `sw4p-kit/src/__tests__/cli/doctor.test.ts` | Cover both report shapes (project-local present vs absent). |
| `sw4p-kit/README.md` | Document `--project` / `--user-only` flags + the default behavior. |

#### Test plan

- All 26 existing C1/C2 tests still pass (path assertion in `_platforms.test.ts` updates).
- 4 new init tests (the four scenarios above).
- 2 new doctor tests (both report shapes).
- `npm test`: 108 → 114 passing.
- `npm run typecheck`: exit 0.
- `npm audit --omit=dev`: 0 vulnerabilities.

#### Acceptance

- `sw4p-kit-init` in a directory with no `.mcp.json` writes only `~/.claude.json` and prompts only for the Claude Code yes/no, not for scope.
- `sw4p-kit-init` in a directory containing `.mcp.json` writes `~/.claude.json` (always) and asks once "Also register in this project's `.mcp.json`?" Y → both written, N → user-level only.
- `sw4p-kit-init --project` forces the project-local write regardless of file presence.
- `sw4p-kit-init --user-only` skips the project-local prompt regardless of file presence.
- `sw4p-kit-init --project --user-only` errors out with a clear "mutually exclusive" message.
- `sw4p-kit-doctor` reports the user-level registration; project-local appears in the report only when `<cwd>/.mcp.json` exists.

---

## Out of scope for this spec

- All Important / Minor items from the five reviews. Those are fast-follows landed after the Criticals merge.
- The A4 / A5–A8 / A2-A3 Rust branches still need their WIP-preserve commands run; once on origin, they get the same review-and-finish cycle and their own design docs as needed.
- Track B7 / B8 fixes (sw4p.task stateless gap, isMain symlink, Mcp-Protocol-Version header, etc.) land as a Batch 1.5.

---

## Sequencing

Three fixes, two repos. Independent at the file level:

1. **Fix 1** (sw4p, A1 #1+#2) — single agent or direct, largest of the three. Touches ~10 files plus deploy templates. Cargo build cycle is the slow path; mitigate the watchdog by checking incrementally (`cargo check` per touched module) rather than full-suite waits.
2. **Fix 2** (sw4p, A1 #3) — single agent or direct, scoped to ~10 deletion sites + tests.
3. **Fix 3** (sw4p-kit, C1/C2) — single agent or direct, scoped to 4 source files + 2 test files + README.

All three land as new commits on their respective WIP branches (additive only, no force-push, no amend). Identity `rndrntwrk <dev@rndrntwrk.com>`, no `Co-Authored-By` trailer.

---

## Verification gate (must all pass before claiming Criticals closed)

1. `sw4p` worktree: `cargo check -p sw4p-backend` exit 0; `cargo test --lib` exit 0.
2. `sw4p-kit` worktree: `npm run build` exit 0; `npm test` exit 0 (suite ≥ 114); `npm run typecheck` exit 0; `npm audit --omit=dev` shows 0 vulnerabilities.
3. **SOW grep acceptance** structurally true:
   - `grep -rn 'iris-api\|EPjFWdd5\|4zMMC9srt5' sw4p-backend/src/ | grep -v 'networks.rs\|/tests/'` → 0 results.
   - `grep -rn 'NETWORK_MODE\|get_network_mode\|circle_iris_host' sw4p-backend/src/` → 0 results.
   - `grep -rn 'NETWORK_MODE' RAILWAY_ENV_TEMPLATE.md .env.testnet` → 0 results.
4. zkSync grep: `grep -rnE 'ZKSYNC|ZkSync|zksync' sw4p-backend/src/` → 0 results (modulo intentional doc-comment exemplars in `withdraw.rs`).
5. C1/C2 Claude Code platform entry points at `~/.claude.json`; init flow handles project-local conditionally; `--project` / `--user-only` flags work.
6. No `Co-Authored-By:` trailer on any commit on any branch.
