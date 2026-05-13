# Batch 1 — Critical Fixes Design

**Date:** 2026-05-13
**Status:** approved (in chat); pending spec review before implementation
**Scope:** the four Critical findings from the Batch 1 code reviews. No Important or Minor items here — those land as fast-follows after the Criticals merge.
**Branches affected:**
- `sw4p` repo, `protocol/a1-networks-registry` (three fixes here)
- `sw4p-kit` repo, `kit/c1-c2-cli` (one fix here)

---

## Why this spec exists

The Batch 1 implementation pass shipped five branches. Five independent Opus reviews ran against them. Four Critical findings surfaced; their common shape is "the SOW's stated acceptance condition isn't structurally true — only locally true at one consumer." Patching individual call sites would keep the architectural problem alive. This design fixes the architecture so the acceptance condition holds for every consumer, present and future.

---

## Fix 1 — Single source of truth for network selection (A1 Critical #1 + #2)

### Problem

Two env-driven network selectors exist in the codebase:

- `SW4P_NETWORK` — read by `Registry::from_env()` at boot, propagated via `Arc<Registry>` on `AppState`.
- `NETWORK_MODE` — read by `network_config::get_network_mode()`, cached in a module-local `OnceLock`, exposed as the legacy address-table selector.

The reviewer confirmed: outside of `x402_facilitator.rs`, **no production consumer actually reads the registry**. Specifically:

- `cctp_burn.rs:556-581` — four `resolved_*` helpers branch on `crate::network_config::get_network_mode()`.
- `cctp_mint.rs:36-39` — `resolved_usdc_mint()` reads `network_config::get_usdc_address("SOL")`.
- `evm_burn.rs:119`, `relay.rs:1436` — direct `get_network_mode()` callers.
- `circle.rs:98-103` `circle_iris_host()` — reads `SW4P_NETWORK` *or* `NETWORK_MODE` for Iris URL selection. Called from `cctp_attestation.rs`, `health.rs:171`, `circle.rs:107/127/131`.

Result: two selectors that can disagree at runtime (set one, forget the other → x402 gates accept mainnet CAIPs while CCTP burn paths run testnet constants).

The registry's `iris_base_url` field is loaded but only read at startup logging (`main.rs:184`, `bin/watcher.rs:159`) — never on a real Iris call. P1 / P11 are "closed" only by coincidence: they pass tests because the env vars happen to agree in the dev environment.

### Design — Option C: process-global Registry, legacy helpers become facades

The cleanest architectural fix is to thread `&Registry` through every constructor (Option B). The scoping cost is high: ~10 files, multiple constructor signatures, breaks merge-friendliness against the three in-flight Rust branches (A4, A5–A8, A2/A3). Option C delivers the same structural invariant ("one source of truth, registry-defined") without the constructor churn.

**Mechanism:**

1. Introduce `pub static REGISTRY: OnceLock<Arc<Registry>>` in `networks.rs`. `Registry::install()` sets it; `Registry::current() -> &Registry` reads it. `Registry::current()` panics if not installed (caught at boot), matching the existing `NETWORK_MODE` OnceLock semantics.

2. In `main.rs` (after the existing `Registry::from_env()` call), call `Registry::install(registry.clone())` before any worker spawns. This is one new line.

3. Rewire the legacy helpers internally:
   - `network_config::get_network_mode()` returns `Registry::current().network` (mapped to the legacy `NetworkMode` enum via a 2-arm match).
   - `network_config::get_usdc_address(chain)` returns `Registry::current().chain_or_err(...)` results.
   - `network_config::get_message_transmitter(chain)`, `get_token_messenger(chain)`, etc. — same treatment.
   - `circle::circle_iris_host()` returns `Registry::current().iris_base_url.as_str()`.

4. `NETWORK_MODE` env var: kept for backward compatibility, but only as input to `Registry::from_env()`. The order of precedence becomes: `SW4P_NETWORK` → fall back to `NETWORK_MODE` (with a deprecation warning logged once at boot) → default `Testnet`. This is added inside `Registry::from_env()` — three lines of additional logic and one `eprintln!` warning.

5. `network_config.rs` keeps its public functions and its tests, but the giant static address tables (lines 86-220) get deleted — they're now dead code, replaced by registry lookups in the function bodies.

**Why this is "non-hacky":**

- After this change, there is exactly **one** place that knows mainnet from testnet (`networks.rs` `Registry::mainnet()` / `testnet()`). Every other place reads it. The single-source-of-truth claim becomes structurally true, not aspirational.
- No constructor signatures change — A4 / A5–A8 / A2/A3 branches don't need to rebase against signature deltas.
- `NETWORK_MODE` operator usage keeps working with a deprecation path. Nothing breaks on the operations side.
- The `OnceLock` global is bounded in scope (one cell in `networks.rs`), exposed via two functions (`install`, `current`), used by exactly the legacy facade helpers. No spooky-action-at-a-distance: any caller that needs the registry should still take `&Registry` from `AppState` when in scope. The global is only for the existing legacy callsites whose constructors don't have AppState.

**Files changed (estimate):**

| File | Change |
|---|---|
| `sw4p-backend/src/networks.rs` | Add `REGISTRY: OnceLock`, `install()`, `current()`. Extend `from_env()` to honor `NETWORK_MODE` fallback with deprecation log. |
| `sw4p-backend/src/main.rs` | One line: `Registry::install(registry.clone());` after construction. |
| `sw4p-backend/src/bin/watcher.rs` | Same one-line install. |
| `sw4p-backend/src/network_config.rs` | Function bodies rewired to read from `Registry::current()`. Static address tables deleted. Tests updated to install a test registry. |
| `sw4p-backend/src/circle.rs` | `circle_iris_host()` → one-line `Registry::current().iris_base_url.as_str()`. Tests updated. |

`cctp_burn.rs`, `cctp_mint.rs`, `cctp_attestation.rs`, `evm_burn.rs`, `relay.rs` callers **don't change** — they still call `network_config::get_network_mode()` / `circle::circle_iris_host()`, but those helpers now read from the registry.

### Test plan

- Existing `networks.rs` 22-test suite continues to pass unchanged.
- Existing `network_config.rs` tests must continue to pass — they assert on `get_usdc_address` / `get_network_mode` results. With the rewire, these now exercise the registry indirectly. Add one new test that installs `Registry::mainnet()` and confirms `network_config::get_usdc_address("SOL")` returns the mainnet mint.
- One new test in `circle.rs`: install `Registry::testnet()`, assert `circle_iris_host()` returns `https://iris-api-sandbox.circle.com`. Same with mainnet.
- One new test in `networks.rs`: `from_env()` with `SW4P_NETWORK` unset but `NETWORK_MODE=mainnet` returns Mainnet and logs the deprecation message.
- `cargo check -p sw4p-backend` exits 0.
- `cargo test --lib` exits 0 (full lib suite, not just `networks::` / `x402_facilitator::`).

### Acceptance

- The SOW grep acceptance criterion materializes: `grep -rn 'iris-api\|TokenMessenger\|MessageTransmitter\|EPjFWdd5\|4zMMC9srt5' sw4p-backend/src/ | grep -v 'networks.rs\|circle.rs:tests\|cctp_attestation.rs:tests' | wc -l` returns 0 outside `networks.rs` (modulo intentional test fixtures).
- Setting `NETWORK_MODE=mainnet` with `SW4P_NETWORK` unset still works (back-compat) and emits a deprecation warning once at boot.
- Setting both to disagreeing values: `SW4P_NETWORK` wins; emit a startup warning naming the disagreement.

---

## Fix 2 — zkSync residual placeholders (A1 Critical #3)

### Problem

`cctp_burn.rs` and `withdraw.rs` removed their `ZKSYNC = 324` placeholders. Five other modules still encode `324` as zkSync's CCTP V2 domain:

- `native_bridge.rs:111` — `Chain::ZkSync => 324`
- `erc7683.rs:141, 164` — `"ZKSYNC" => 324`, `324 => "ZKSYNC"`
- `evm_mint.rs:99-100` — `("zkSync Era", if is_testnet { 300 } else { 324 }, 324, ...)`
- `evm_burn.rs:97-106` — `BURN_CHAINS` array entry
- `x402_facilitator.rs:1119` — `caip2_to_sw4p_chain("eip155:324")` returns `Ok("ZKSYNC")` (a different `324` — that's Ethereum's chain ID for zkSync, not Circle's CCTP domain — but it's a colliding magic number worth disambiguating)

Plus generic-chain-support entries that are **fine to keep**:
- `chains.rs:166-174` — zkSync as a registered EVM chain (RPC, wallet)
- `evm_gas.rs:56` — zkSync in `SUPPORTED_CHAINS` for gas pricing
- `config.rs:32-33` — `FEATURE_CHAIN_ZKSYNC` flag

### Design — Option B: fail-closed on CCTP-domain paths, preserve generic-chain support

The pattern is already established by `withdraw.rs::chain_to_domain("ZKSYNC") => None` in the agent's prior work. Extend that pattern to every remaining site where a CCTP V2 domain ID is the return value.

**Mechanism:**

1. `native_bridge.rs::Chain::to_domain()` returns `Result<u32, &'static str>` instead of `u32`. The `ZkSync` arm returns `Err("zkSync has no CCTP V2 domain")`. Every caller (already enumerable via `cargo build`) gets a `?` operator or an explicit handle for the error path.

2. `erc7683.rs::chain_to_domain` / `domain_to_chain` — drop the `"ZKSYNC" <-> 324` arms. Tests asserting `chain_to_domain("ZKSYNC") == Some(324)` flip to `None`.

3. `evm_mint.rs::chain_config` — drop the `"ZKSYNC"` arm. The function already has `Option` shape; callers handle `None` as "unsupported chain."

4. `evm_burn.rs::BURN_CHAINS` — remove the `"ZKSYNC"` entry from the array.

5. `x402_facilitator.rs:1119` — remove the `"eip155:324" => Ok("ZKSYNC")` arm. zkSync is not in `Registry::mainnet().x402_supported` (it's not in the `ChainId` enum at all), so this arm is dead in the new registry-driven path.

6. **Untouched:** `chains.rs` (zkSync remains a known EVM chain — RPC + wallet), `evm_gas.rs` (gas pricing works for any EVM chain), `config.rs` `FEATURE_CHAIN_ZKSYNC` flag (operators can still gate the chain at the feature-flag level).

**Why this is "non-hacky":**

- The pattern matches what `withdraw.rs` already did in this same branch — consistency, not improvisation.
- zkSync's existence as an EVM chain is preserved (it's a real chain with real users); only its non-existent CCTP V2 domain ID is purged.
- "Wrong domain" becomes "explicit None / Err" — fail loud, not fail wrong.
- When Circle ships a real CCTP V2 domain for zkSync (or sw4p decides to support it via another rail), the change is **one line** in `Registry::mainnet()` — add `(ChainId::ZkSync, ...)` to the chains HashMap and the CCTP-domain arms in the remaining files come back via `cargo check` warnings about non-exhaustive matches.

**Files changed:**

| File | Change |
|---|---|
| `sw4p-backend/src/native_bridge.rs` | `Chain::to_domain()` → `Result`. Add `is_new_chain()` adjustment if needed. Update callers. |
| `sw4p-backend/src/erc7683.rs` | Remove ZKSYNC <-> 324 arms. |
| `sw4p-backend/src/evm_mint.rs` | Remove ZKSYNC chain_config arm + array entry. |
| `sw4p-backend/src/evm_burn.rs` | Remove ZKSYNC from BURN_CHAINS. |
| `sw4p-backend/src/x402_facilitator.rs` | Remove `eip155:324` → ZKSYNC arm. |
| Tests for each | Flip assertions from `Some(324)` to `None` / `Err`. |

### Test plan

- For each touched module, the existing tests that ASSERT on `324` or `"ZKSYNC"` CCTP-domain results flip to assertion of `None`/`Err`.
- Add one explicit test per module: `assert!(chain_to_domain("ZKSYNC").is_none())` (or analogous).
- `cargo build --release -p sw4p-backend` exits 0.

### Acceptance

- `grep -rn '324' sw4p-backend/src/ | grep -i 'cctp\|domain\|zksync' | grep -v '_tmp.rs\|tests'` returns zero hits. (The `evm_mint.rs` line that distinguished testnet `300` from mainnet `324` is removed entirely.)
- Any user request that supplies `"ZKSYNC"` as a chain to a CCTP burn / mint / domain-lookup path returns an explicit `None` / `Err`, not a silent route to a non-existent domain.

---

## Fix 3 — Claude Code MCP config path (C1/C2 Critical)

### Problem

`sw4p-kit/src/cli/_platforms.ts:43` writes the MCP server entry to `~/.claude/settings.json`. Claude Code reads its **settings** from there but reads **MCP server registrations** from one of two other locations:

1. `~/.claude.json` — top-level user config (under `$HOME`).
2. `<cwd>/.mcp.json` — project-local, commit-able, team-shareable.

The reviewer cross-checked against Anthropic's published Claude Code docs and existing GitHub issues. The error is unambiguous.

### Design — Option B: two entries (user + project), interactive choose

A two-line file path change (Option A) closes the bug. Adding the project-local option (Option B) is near-free given the existing scripted-IO infrastructure and covers the team-shared use case that the kit's "agent surface" framing implies as a real workflow.

**Mechanism:**

1. Split `_platforms.ts`'s `claude-code` entry into two:
   - `claude-code-user` — `configPath: (home, cwd) => path.join(home, ".claude.json")`, `mcpKey: "mcpServers"`, JSON format.
   - `claude-code-project` — `configPath: (home, cwd) => path.join(cwd, ".mcp.json")`, `mcpKey: "mcpServers"`, JSON format. Detection: only "detected" if the user explicitly opts into project-local registration.

2. In `init.ts`'s flow, when Claude Code is detected (either form), ask: "Register sw4p in Claude Code for: (1) just this user [~/.claude.json], (2) just this project [./.mcp.json], (3) both, (4) skip". Default = `(1)`.

3. `doctor.ts` reports both entries independently — "user-level: registered / not registered", "project-local: registered / not registered / not applicable here."

4. Tests in `_platforms.test.ts` + `init.test.ts` + `doctor.test.ts` updated for both entries. The `scriptedIO` helper makes the multi-answer flow easy.

**Why this is "non-hacky":**

- It mirrors how Claude Code itself thinks about the two scopes. Not a kit-invented division.
- The project-local option directly supports the team-shareable workflow (`.mcp.json` is meant to be committed).
- Doesn't write to the actual Claude Code **settings** file (which is what the current code does — that's wrong on two levels: wrong file *and* writing user settings is more invasive than writing MCP config).

**Files changed:**

| File | Change |
|---|---|
| `sw4p-kit/src/cli/_platforms.ts` | Split `claude-code` into `claude-code-user` + `claude-code-project`. |
| `sw4p-kit/src/cli/init.ts` | Add the "user / project / both / skip" prompt branch. |
| `sw4p-kit/src/cli/doctor.ts` | Report both entries independently. |
| `sw4p-kit/src/__tests__/cli/_platforms.test.ts` | Cover both new entries. |
| `sw4p-kit/src/__tests__/cli/init.test.ts` | Cover the new branch's scripted IO. |
| `sw4p-kit/src/__tests__/cli/doctor.test.ts` | Cover the dual-report. |

### Test plan

- All 26 existing C1/C2 tests still pass.
- New tests:
  - `claude-code-user` writes to `~/.claude.json`, preserves existing keys, backs up before write.
  - `claude-code-project` writes to `<cwd>/.mcp.json`, creates the file if absent, preserves existing keys.
  - The init flow with answer `(3)` writes to both and produces two backups.
  - The init flow with answer `(4)` writes neither and records `{ kind: "skipped" }`.
- `npm test`: 108 → 113 passing (5 new tests).
- `npm run typecheck` exit 0.

### Acceptance

- Running `sw4p-kit-init` against a fresh `$HOME` with Claude Code mock-installed, selecting `(1)`, produces `~/.claude.json` with the `mcpServers.sw4p` entry and a timestamped backup of any prior content.
- Same flow selecting `(2)` in a `cwd` containing `.mcp.json` produces a merged `.mcp.json` with the sw4p entry preserved alongside any existing servers.

---

## Out of scope for this spec

- All Important / Minor items from the five reviews. Those are fast-follows landed after the Criticals merge:
  - B7 `sw4p.task` stateless-HTTP gap (Important)
  - B7 `isMain` symlink bug (Important — release-blocker for the npm publish, but A1/C1-C2 are higher-criticality)
  - B8 `Mcp-Protocol-Version` header on error responses (Important)
  - C1/C2 `npx @sw4p/kit init` dispatch (Important — the bin-name resolution issue)
  - C1/C2 `doctor` fetch timeout (Important)
  - C1/C2 atomic write via temp + rename (Important)
  - C7 `install.mdx` platform paths (Important — landed after C1/C2 lands so paths can derive from the corrected source)
  - C7 `npx args` (Important — paired with the C1/C2 dispatch fix above)
- The A4 / A5–A8 / A2-A3 Rust branches still need their WIP-preserve commands run; once on origin, they get the same review-and-finish cycle and their own design docs as needed.

---

## Sequencing

These three fixes can be implemented in parallel because they're in different files (zero overlap) and three of them are in two different repos:

1. **Fix 1** (sw4p, A1 #1+#2) — single agent or direct, scoped to `networks.rs` / `network_config.rs` / `circle.rs` / `main.rs` / `bin/watcher.rs`.
2. **Fix 2** (sw4p, A1 #3) — single agent or direct, scoped to `native_bridge.rs` / `erc7683.rs` / `evm_mint.rs` / `evm_burn.rs` / `x402_facilitator.rs:1119`.
3. **Fix 3** (sw4p-kit, C1/C2) — single agent or direct, scoped to `src/cli/_platforms.ts` / `init.ts` / `doctor.ts` + tests.

All three land as new commits on their respective WIP branches (no force-push, no amend — additive commits per the user's standing rule). Identity `rndrntwrk <dev@rndrntwrk.com>`, no `Co-Authored-By` trailer.

---

## Verification gate (must all pass before claiming Criticals closed)

1. `sw4p` worktree: `cargo check -p sw4p-backend` exit 0; `cargo test --lib` exit 0.
2. `sw4p-kit` worktree: `npm run build` exit 0; `npm test` exit 0 (suite >= 113); `npm run typecheck` exit 0; `npm audit --omit=dev` shows 0 vulnerabilities.
3. SOW grep acceptance for A1 passes (zero hardcoded `iris-api` / `EPjFW...` / `TokenMessenger` / `MessageTransmitter` outside `networks.rs` + intentional test fixtures).
4. zkSync grep: zero `324` literals in CCTP-domain context outside intentional fail-closed tests.
5. C1/C2 Claude Code path is `~/.claude.json` (user) and `<cwd>/.mcp.json` (project) in `_platforms.ts`.
6. No `Co-Authored-By:` trailer on any commit on any branch.
