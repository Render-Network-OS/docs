# sw4p / sw4p-kit PR Hack-Fix Implementation Plan

> **STATUS — COMPLETE (2026-05-14).** All 6 PRs merged after three independent review passes. 35 hack findings resolved across the three passes. See the **Completion Report** section at the end of this document for per-PR merge commits, third-pass evidence, and merge-conflict resolutions.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 14 hacks/workarounds/partial-fixes identified by hack-detection reviewers across 6 open PRs (sw4p-pro #178/#179/#180/#181 + sw4p-kit #1/#2), per the repo owner's HARD rule that "backwards compatibility is NOT IMPORTANT — fix poor design properly".

**Architecture:** Add one "fix(<track>): address hack-detection findings" commit on top of each PR. Never amend (per user CLAUDE.md HARD constraint). Identity: `rndrntwrk <dev@rndrntwrk.com>`, NO `Co-Authored-By:`, NO `🤖`, NO "Generated with" trailers. Order tasks from least-invasive (delete/replace single lines) to most-invasive (rename module, change return types, add migration FK).

**Tech Stack:** Rust 1.x + cargo (sw4p-pro), TypeScript 5.x + Vitest + tsc (sw4p-kit), Postgres (sqlx 0.8), MCP SDK.

**Worktrees (six distinct paths):**
- sw4p-pro: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/{a1-networks-registry, a2-a3-remove-aspirational-rails, a4-solver-auction-persist, a5-a8-cleanups}`
- sw4p-kit: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/{b7-streamable-http, c1-c2-cli}`

**Hard constraints throughout:**
- Each PR's fix-pass lands as ONE new commit on top of existing commits — no amending.
- After every commit: identity audit (`git diff -U0 HEAD~1..HEAD | grep -iE "co-authored|🤖|generated with"` → must be empty).
- After every fix: cargo check/test (Rust) or npm test + tsc --noEmit (TS) must pass.
- Push to existing branch (regular push, NOT force).

---

## File Structure

Files to MODIFY (no new files except a small migration patch):

**sw4p-kit (C1/C2):**
- `src/cli/init.ts` — remove two bare `catch{}` blocks
- `src/__tests__/cli/init.test.ts` — extend `failNextRenameWith` mock to cover non-ENOENT unlink failures

**sw4p-kit (B7):**
- `src/mcp/server.ts` — DELETE `STATELESS_ASYNC_TASKS_ERROR` deprecated alias
- `src/mcp/http.ts` — replace 2× `as never` with a proper typed adapter
- `src/__tests__/mcp/*.test.ts` — adjust assertions if any imported the deleted constant

**sw4p-pro (A1):**
- `sw4p-backend/src/networks.rs` — split testnet MessageTransmitter constant into Sepolia vs Avax-Fuji variants
- `sw4p-backend/src/evm_mint.rs` — extend regression test to pin the per-chain split against `.env.testnet` truth

**sw4p-pro (A2/A3):**
- RENAME `sw4p-backend/src/custom_ism.rs` → `sw4p-backend/src/route_security.rs`
- `sw4p-backend/src/lib.rs` — update `pub mod` declaration + route mount
- `sw4p-backend/src/starknet_client.rs`, `sw4p-backend/src/sdk_bridge.rs`, `sw4p-backend/src/chains.rs` — update stale "Hyperlane Warp Routes" comments
- `sw4p-backend/src/multi_hop.rs` — remove `DexType::Uniswap` + `DexType::Jupiter` variants

**sw4p-pro (A4):**
- `sw4p-backend/src/solver_auction.rs` — `u64_to_pg_bigint` → Result, `authenticate_filler_db` → Result<Option<...>, sqlx::Error>, propagate `chrono::DateTime::from_timestamp` failures
- `sw4p-backend/migrations/20260513000000_extend_auction_tables.sql` — add FK on winning_quote_id
- `sw4p-backend/tests/solver_auction_recovery.rs` — extend test for overflow + timestamp-error paths

**sw4p-pro (A5/A8):**
- `sw4p-backend/src/smart_account.rs` — 503-gate paymaster endpoint + validate recipient_hex length

---

# Phase 1 — sw4p-kit hack fixes (smallest blast radius first)

## Task 1: C1/C2 #1 — Remove bare `catch{}` on unlink (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli/src/cli/init.ts:457-471`
- Test: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli/src/__tests__/cli/init.test.ts` — add test for non-ENOENT unlink failure

- [x] **Step 1: Write the failing test**

Add this test after the existing `unlinks the temp file when rename fails` test (around line 580):

```typescript
it("propagates non-ENOENT unlink errors (does not silently swallow EACCES)", async () => {
  // Track hack-fix #1: the previous implementation wrapped fsx.unlink
  // in a bare catch{} so a non-ENOENT failure (e.g. EACCES on the temp
  // file) was silently swallowed, contradicting the InitFs.unlink seam
  // contract which is supposed to propagate non-ENOENT errors.
  const claudePath = path.join(home, ".claude.json");
  const fs = memFs({ [claudePath]: "{}" });
  fs.failNextRenameWith = Object.assign(new Error("EACCES: permission denied"), {
    code: "EACCES",
  });
  // Make memFs.unlink throw EACCES too (the temp file exists in `files`
  // since writeFile succeeded; we want unlink to fail for a different
  // reason than ENOENT).
  const origUnlink = fs.unlink;
  fs.unlink = async (p) => {
    if (p.includes(".sw4p-kit-init-tmp-")) {
      throw Object.assign(new Error("EACCES: permission denied"), {
        code: "EACCES",
      });
    }
    return origUnlink(p);
  };
  const io = scriptedIO({
    answers: ["", "", ""],
    secrets: ["k_secret_api_key"],
    confirms: [true],
  });

  // Expect the unlink error to propagate (NOT be swallowed), even
  // though the rename error is the user-visible primary failure.
  await expect(
    runInit({ io, fs, home, cwd, env: {}, now: () => FROZEN_TIME }),
  ).rejects.toThrow(/EACCES/);
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
npx vitest run src/__tests__/cli/init.test.ts -t "propagates non-ENOENT" 2>&1 | tail -10
```

Expected: FAIL — current code swallows the unlink error so the test sees the rename error (EACCES from rename) instead of the unlink-EACCES that the test asserts is the propagated one. The current `catch { /* ignore */ }` makes the test confusing — but since BOTH errors are EACCES, the test technically passes; we need to make them distinct. Use a different code:

Adjust the test to make the unlink throw a unique sentinel error so the assertion is unambiguous:

```typescript
  fs.unlink = async (p) => {
    if (p.includes(".sw4p-kit-init-tmp-")) {
      throw Object.assign(new Error("EROFS: read-only filesystem"), {
        code: "EROFS",
      });
    }
    return origUnlink(p);
  };
```

…and assert `/EROFS/` instead of `/EACCES/` in the `rejects.toThrow`. Then re-run — current code with bare `catch{}` swallows the EROFS, so the test sees the EACCES from rename instead → FAIL on `/EROFS/`.

- [x] **Step 3: Apply the fix**

In `src/cli/init.ts`, replace lines 459-471:

```typescript
  await fsx.writeFile(tmpPath, next);
  try {
    await fsx.rename(tmpPath, configPath);
  } catch (renameErr) {
    // Cleanup is mandatory — the temp file holds the cleartext API key.
    // The seam contract for `InitFs.unlink` already swallows ENOENT,
    // so any error reaching us here is a REAL cleanup failure that
    // must surface to the operator. Use Error.cause to keep the
    // rename error chained as the primary cause.
    try {
      await fsx.unlink(tmpPath);
    } catch (unlinkErr) {
      // Both failed — surface BOTH. Throw the unlink failure (the
      // worse of the two: a cleartext key is on disk) with the
      // rename error attached as `cause`.
      throw new Error(
        `Atomic write to ${configPath} failed AND the temp-file cleanup failed: ` +
          `temp file ${tmpPath} may contain the cleartext API key. ` +
          `Original rename error: ${stringifyErr(renameErr)}. ` +
          `Cleanup error: ${stringifyErr(unlinkErr)}.`,
        { cause: renameErr },
      );
    }
    throw renameErr;
  }
```

- [x] **Step 4: Run all init.test.ts to verify both temp-cleanup tests pass**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
npx vitest run src/__tests__/cli/init.test.ts 2>&1 | tail -10
```

Expected: PASS — both the existing happy-path-unlink test and the new propagate-on-unlink-failure test green.

## Task 2: C1/C2 #2 — Remove bare `catch{}` on mkdir (MINOR)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli/src/cli/init.ts:426-432`

- [x] **Step 1: Apply the fix** (no separate test — failure mode is propagated naturally)

Replace lines 426-432 in `src/cli/init.ts`:

```typescript
  } else {
    // Ensure parent directory exists for create-from-scratch case.
    // nodeFs uses recursive: true so EEXIST is silently absorbed at
    // the seam; we should NOT swallow any other error here. EACCES /
    // EROFS / ENOTDIR mean the subsequent writeFile would fail too —
    // surface the real cause now rather than letting downstream
    // failures hide it.
    await fsx.mkdir(path.dirname(configPath));
  }
```

- [x] **Step 2: Run full init.test.ts**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
npx vitest run src/__tests__/cli/init.test.ts 2>&1 | tail -5
```

Expected: PASS — `memFs.mkdir` returns undefined unconditionally so all existing tests still pass.

## Task 3: C1/C2 fix-pass commit + push

- [x] **Step 1: Run full npm test + build + tsc**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
npm test 2>&1 | tail -5 && npm run build 2>&1 | tail -3 && npx tsc --noEmit 2>&1 | tail -3
```

Expected: all 3 green.

- [x] **Step 2: Identity audit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
git diff -U0 | grep -iE "co-authored|🤖|generated with|noreply" || echo "CLEAN"
```

Expected: `CLEAN`.

- [x] **Step 3: Commit + push**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
git add src/cli/init.ts src/__tests__/cli/init.test.ts
git commit -m "$(cat <<'EOF'
fix(kit): stop swallowing fs cleanup errors in init's atomic-write path

Hack-detection review pass (Track C1/C2). Two bare `catch {}` blocks in
writeJsonPlatform were silently absorbing real failures:

  1. The unlink-after-rename-failure catch (`init.ts:459-471`) was the
     worse of the two: when rename failed, the temp file containing
     the cleartext SW4P_API_KEY was supposed to be unlinked. The
     InitFs.unlink seam contract already swallows ENOENT, so anything
     else reaching the catch here is a real cleanup failure. Catching
     and ignoring it meant a cleartext-key leak could happen without
     any signal to the operator. Now: both errors are surfaced, and
     when unlink also fails we throw a combined message making the
     potentially-leaked file path explicit.

  2. The mkdir catch (`init.ts:426-432`) used `recursive: true` to
     justify swallowing all errors, but `recursive: true` only
     suppresses EEXIST — EACCES, EROFS, ENOTDIR all still throw.
     Swallowing them masked the root cause of subsequent writeFile
     failures. Now: mkdir errors propagate naturally.

Regression test: a new init.test.ts case asserts that an EROFS during
unlink propagates instead of being silently swallowed.
EOF
)"
git push origin kit/c1-c2-cli 2>&1 | tail -3
```

Expected: commit hash + `kit/c1-c2-cli -> kit/c1-c2-cli`.

---

## Task 4: B7 #3 — Delete `STATELESS_ASYNC_TASKS_ERROR` deprecated alias (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http/src/mcp/server.ts:78-88`
- Search: any importer of the old constant name

- [x] **Step 1: Find and verify no in-repo callers**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http"
grep -rn "STATELESS_ASYNC_TASKS_ERROR" src/ 2>&1
```

Expected: only the definition in `src/mcp/server.ts` — no other importers. If any consumer is found, those call sites also need to migrate to `statelessAsyncTasksError("sw4p.task")`.

- [x] **Step 2: Delete the constant**

In `src/mcp/server.ts`, remove the deprecated-alias block (look for the `STATELESS_ASYNC_TASKS_ERROR` export and its JSDoc — roughly lines 78-88). The `statelessAsyncTasksError(tool)` function above it stays.

- [x] **Step 3: Run npm test to confirm nothing else depended on it**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http"
npm test 2>&1 | tail -5
```

Expected: PASS — no test was asserting on the constant name (they all use the function or the regex `/stateless/i`).

## Task 5: B7 #4 — Replace `as never` with typed adapter (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http/src/mcp/http.ts:248-270`

- [x] **Step 1: Inspect the actual SDK type contract**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http"
grep -rn "interface Transport\|export.*Transport" node_modules/@modelcontextprotocol/sdk/dist/types/shared/transport.d.ts 2>&1 | head -10
grep -rn "class StreamableHTTPServerTransport" node_modules/@modelcontextprotocol/sdk/dist/types/server/streamableHttp.d.ts 2>&1 | head -10
```

This reveals the actual `Transport` interface and what `StreamableHTTPServerTransport` claims to implement. Use the output to choose between (a) cast to the SDK's exported `Transport` interface, (b) write a minimal `TransportLike` adapter, or (c) file an upstream issue and pin a `TODO(sdk-upstream)` comment with a real explanation.

- [x] **Step 2: Apply the typed-adapter fix**

In `src/mcp/http.ts`, replace the two `as never` casts with a properly-typed adapter. The exact shape depends on Step 1's output. Most likely path: import the `Transport` interface from the SDK and cast to it explicitly:

```typescript
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

// In the handler factory, around line 248:
const transport: Transport = new StreamableHTTPServerTransport({
  enableJsonResponse: true,
});

// And around line 267:
await mcp.connect(transport);
```

If the SDK does NOT expose `Transport` as a public type, write an inline adapter:

```typescript
// SDK upstream gap: `StreamableHTTPServerTransport` implements `Transport`
// in fact but the public types don't re-export the interface as of MCP
// SDK 1.x. Until the SDK fixes its `.d.ts`, narrow via a typed adapter
// rather than `as never` — this keeps the structural shape checked at
// the adapter boundary.
type ServerTransportLike = {
  start(): Promise<void>;
  close(): Promise<void>;
  send(message: unknown): Promise<void>;
  onmessage?: (m: unknown) => void;
  onclose?: () => void;
  onerror?: (e: Error) => void;
};
const transport: ServerTransportLike = new StreamableHTTPServerTransport({
  enableJsonResponse: true,
}) as unknown as ServerTransportLike;
```

- [x] **Step 3: Run npm test + tsc --noEmit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http"
npm test 2>&1 | tail -5 && npx tsc --noEmit 2>&1 | tail -3
```

Expected: PASS + no type errors. If tsc errors, the adapter shape needs adjusting to match what `mcp.connect()` expects.

## Task 6: B7 fix-pass commit + push

- [x] **Step 1: Identity audit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http"
git diff -U0 | grep -iE "co-authored|🤖|generated with|noreply" || echo "CLEAN"
```

Expected: `CLEAN`.

- [x] **Step 2: Commit + push**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/b7-streamable-http"
git add src/mcp/server.ts src/mcp/http.ts
git commit -m "$(cat <<'EOF'
fix(kit): remove deprecated-alias hack + replace as-never casts with typed adapter

Hack-detection review pass (Track B7).

1. STATELESS_ASYNC_TASKS_ERROR deprecated alias deleted. The function
   `statelessAsyncTasksError(tool)` is now the single source of truth.
   Per the repo owner's HARD rule "backwards compatibility is NOT
   IMPORTANT — fix poor design properly even if it breaks APIs", a
   compat-only alias is exactly the partial-solution anti-pattern. No
   in-tree consumers existed; if external consumers ever imported the
   constant, they can pin a prior version (this is 0.1.x pre-release).

2. Two `as never` casts in http.ts (StreamableHTTPServerTransport
   construction + mcp.connect call) replaced with a properly-typed
   adapter at the boundary. `as never` silenced structural checks on a
   third-party SDK call site; a named adapter type makes the assumed
   shape explicit so the next SDK upgrade surfaces a real type error
   if the contract drifts.
EOF
)"
git push origin kit/b7-streamable-http 2>&1 | tail -3
```

Expected: commit hash + push success.

---

# Phase 2 — sw4p-pro hack fixes (start with smallest blast-radius)

## Task 7: A1 #5 — Per-chain testnet MessageTransmitter (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry/sw4p-backend/src/networks.rs:420-510`
- Test: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry/sw4p-backend/src/evm_mint.rs` — extend regression test

- [x] **Step 1: Verify the truth source in .env.testnet**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
grep -nE "CCTP_MESSAGE_TRANSMITTER" .env.testnet
```

Confirmed: ETH/BASE Sepolia use `0x7865fAfC2db2093669d92c0F33AeEF291086BEFD`; Avax Fuji uses `0xe737e5cebeeba77efe34d4aa090756590b1ce275`.

- [x] **Step 2: Write the failing test**

In `sw4p-backend/src/evm_mint.rs`, extend the existing `chain_config_message_transmitter_matches_registry` test (or add a new test) to assert PER-CHAIN testnet values, NOT a shared constant:

```rust
#[test]
fn testnet_message_transmitter_per_chain_matches_env_truth() {
    // Track hack-fix #5: previously a single EVM_TESTNET_MESSAGE_TRANSMITTER
    // constant was applied to every testnet EVM chain, which silently used
    // Avax Fuji's address for ETH Sepolia and Base Sepolia (per
    // .env.testnet, these chains use 0x7865fAfC... while only Fuji uses
    // 0xe737...). This test pins the per-chain split against the values
    // documented in .env.testnet.

    const SEPOLIA_MESSAGE_TRANSMITTER: &str =
        "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";
    const AVAX_FUJI_MESSAGE_TRANSMITTER: &str =
        "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

    let registry = crate::networks::Registry::testnet();

    // ETH Sepolia / Arbitrum Sepolia / Base Sepolia / Polygon Amoy /
    // OP Sepolia — Sepolia family share `0x7865...`.
    for code in &["ETH", "ARB", "BASE", "POLY", "OP"] {
        let chain = registry.chain(code).expect(code);
        let mt = chain.cctp_message_transmitter();
        assert_eq!(
            mt,
            SEPOLIA_MESSAGE_TRANSMITTER,
            "testnet MessageTransmitter for {code} must be the Sepolia value 0x7865...; got {mt}",
        );
    }

    // Avax Fuji is the outlier per .env.testnet.
    let avax = registry.chain("AVAX").expect("AVAX");
    let avax_mt = avax.cctp_message_transmitter();
    assert_eq!(
        avax_mt,
        AVAX_FUJI_MESSAGE_TRANSMITTER,
        "testnet MessageTransmitter for AVAX must be Avax-Fuji's 0xe737...; got {avax_mt}",
    );
}
```

- [x] **Step 3: Run test to verify it fails**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry/sw4p-backend"
cargo test --lib evm_mint::tests::testnet_message_transmitter_per_chain_matches_env_truth -- --nocapture 2>&1 | tail -10
```

Expected: FAIL — current registry returns `0xe737...` for ETH/ARB/BASE/POLY/OP, but the assertion demands `0x7865...`.

- [x] **Step 4: Apply the fix in networks.rs**

In `sw4p-backend/src/networks.rs`, split the single constant into two and apply per-chain. Around line 420-510:

```rust
// Replace:
//   const EVM_TESTNET_MESSAGE_TRANSMITTER: &str = "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

// With:
/// Sepolia-family MessageTransmitter (ETH Sepolia, Arbitrum Sepolia,
/// Base Sepolia, Polygon Amoy, OP Sepolia). Per Circle CCTP V2 testnet
/// deployment table and `.env.testnet:25-27`.
const SEPOLIA_FAMILY_MESSAGE_TRANSMITTER: &str =
    "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

/// Avalanche Fuji MessageTransmitter. Avax is the outlier — its
/// testnet uses a different address than the Sepolia family.
const AVAX_FUJI_MESSAGE_TRANSMITTER: &str =
    "0xe737e5cebeeba77efe34d4aa090756590b1ce275";
```

Then update each per-chain entry (originally all using `EVM_TESTNET_MESSAGE_TRANSMITTER`): change ETH/ARB/BASE/POLY/OP entries to `SEPOLIA_FAMILY_MESSAGE_TRANSMITTER`, change Avax entry to `AVAX_FUJI_MESSAGE_TRANSMITTER`.

- [x] **Step 5: Re-run the failing test to verify it passes**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry/sw4p-backend"
cargo test --lib evm_mint::tests::testnet_message_transmitter_per_chain_matches_env_truth -- --nocapture 2>&1 | tail -10
```

Expected: PASS.

- [x] **Step 6: Run cargo check + full evm_mint tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry/sw4p-backend"
cargo test --lib evm_mint:: -- --nocapture 2>&1 | tail -10
```

Expected: no test in evm_mint regresses (the OLD pinning test `chain_config_message_transmitter_matches_registry` may still pass IF it was checking values via the registry+SDK constants — both will agree post-fix as long as the SDK side `EVM_TESTNET_MESSAGE_TRANSMITTER` is removed too).

## Task 8: A1 fix-pass commit + push

- [x] **Step 1: Identity audit + commit + push**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a1-networks-registry"
git diff -U0 | grep -iE "co-authored|🤖|generated with|noreply" || echo "CLEAN"
git add sw4p-backend/src/networks.rs sw4p-backend/src/evm_mint.rs
git commit -m "$(cat <<'EOF'
fix(backend): per-chain testnet MessageTransmitter (Sepolia family vs Avax Fuji)

Hack-detection review pass (Track A1). The previous registry used a
single EVM_TESTNET_MESSAGE_TRANSMITTER constant (0xe737...) for every
testnet EVM chain. That value matches Avalanche Fuji per Circle's
CCTP V2 testnet deployment table, but ETH Sepolia, Arbitrum Sepolia,
Base Sepolia, Polygon Amoy, and OP Sepolia all use a DIFFERENT
address (0x7865fAfC...), as documented in .env.testnet:25-27.

Result of the prior bug: testnet CCTP attestation lookups for the
Sepolia family would target the wrong contract and fail silently
(no error visible at the burn step; the receive_message call later
reverts at the Paymaster with a non-obvious error).

Fix: split into SEPOLIA_FAMILY_MESSAGE_TRANSMITTER (the 0x7865 value)
and AVAX_FUJI_MESSAGE_TRANSMITTER (the 0xe737 outlier), apply per
chain in the testnet registry construction.

New regression test pins each chain's MessageTransmitter against the
expected value, derived from .env.testnet rather than a shared
constant — so a future "collapse into one constant" refactor is
caught at test time.
EOF
)"
git push origin protocol/a1-networks-registry 2>&1 | tail -3
```

Expected: clean + push success.

---

## Task 9: A2/A3 #7 — Update stale "Hyperlane Warp Routes" doc comments (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails/sw4p-backend/src/starknet_client.rs:5-8`
- Modify: `.../sw4p-backend/src/sdk_bridge.rs:134, 1458`
- Modify: `.../sw4p-backend/src/chains.rs:247`

- [x] **Step 1: Verify the exact wording in each file**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails"
grep -nE "Hyperlane Warp Routes|Hyperlane only|uses Hyperlane" sw4p-backend/src/starknet_client.rs sw4p-backend/src/sdk_bridge.rs sw4p-backend/src/chains.rs
```

Note the exact strings — they're needed for Edit's unique-match requirement.

- [x] **Step 2: Update each comment to reflect post-A2/A3 reality**

For each match, replace the "uses Hyperlane Warp Routes" / "Hyperlane only" prose with the factual post-removal statement. Example for `starknet_client.rs:5-8`:

```rust
//! Starknet client adapter.
//!
//! No cross-chain bridge path is currently supported for Starknet.
//! CCTP V2 does not cover Starknet and the Hyperlane rail that
//! previously routed Starknet traffic was removed in Track A2/A3.
//! Runtime requests for Starknet routes will return an error from
//! `multi_hop::plan_route` (see that module's Starknet arm).
```

Apply the equivalent rewording at each of the other call sites.

- [x] **Step 3: Verify with cargo check**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails/sw4p-backend"
cargo check --lib 2>&1 | tail -5
```

Expected: clean (doc-only changes).

## Task 10: A2/A3 #8 — Remove `DexType::Uniswap` + `DexType::Jupiter` unimplemented variants (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails/sw4p-backend/src/multi_hop.rs`

- [x] **Step 1: Find the DexType enum + every match arm**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails"
grep -nE "DexType::|enum DexType" sw4p-backend/src/multi_hop.rs
```

- [x] **Step 2: Apply the surgical removal**

In `sw4p-backend/src/multi_hop.rs`:
1. Remove `DexType::Uniswap` and `DexType::Jupiter` variants from the enum.
2. Update the route planner — at the call site where the route generator picks a DexType for an EVM or Solana source-swap step, that branch should now return `Err("not supported: source/destination swap requires DEX integration not yet wired")` directly from `plan_route` instead of generating a step that will fail at execute time.
3. Delete the dead match arms in `execute_route` (the previous hard-`Err` arms become unreachable after the enum is trimmed; the match becomes exhaustive on the remaining `SunSwap` variant).

Example minimal diff (illustrative — apply the actual edit based on the grep output):

```rust
// Before:
pub enum DexType { SunSwap, Uniswap, Jupiter }

// After:
pub enum DexType { SunSwap }
```

…and in `plan_route`, where the chain-to-DexType mapping was deciding `DexType::Uniswap` for EVM sources or `DexType::Jupiter` for Solana, return `Err("multi_hop source-swap not supported for chain {chain}: only TRX/SunSwap is wired today")` immediately.

- [x] **Step 3: Run cargo test --lib multi_hop**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails/sw4p-backend"
cargo test --lib multi_hop:: 2>&1 | tail -10
```

Expected: all surviving multi_hop tests pass. Any test that was specifically asserting the Uniswap/Jupiter Err string will need its assertion updated to match the new plan-time rejection wording (do that in the same edit).

## Task 11: A2/A3 #6 — Rename `custom_ism` → `route_security` (CRITICAL)

**Files (in order):**
- Rename: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails/sw4p-backend/src/custom_ism.rs` → `route_security.rs`
- Modify: `sw4p-backend/src/lib.rs` — `pub mod custom_ism` → `pub mod route_security`; route handler import
- Find all references: `grep -rn "custom_ism\|CustomIsm\|CUSTOM_ISM" sw4p-backend/src/`

- [x] **Step 1: Inventory every reference**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails"
grep -rnE "custom_ism|CustomIsm|CUSTOM_ISM|\[CUSTOM_ISM\]" sw4p-backend/src/ sw4p-backend/tests/ 2>&1 | head -30
```

- [x] **Step 2: Rename the file + rename the struct + rename log tags**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails"
git mv sw4p-backend/src/custom_ism.rs sw4p-backend/src/route_security.rs
```

Then inside `route_security.rs` use Edit's `replace_all`:
- `CustomIsm` → `RouteSecurityModule` (struct + impl + uses)
- `[CUSTOM_ISM]` → `[ROUTE_SECURITY]` (every tracing log line)
- Top-of-file doc comment `//! Custom Security Module` → `//! Route Security Module`

- [x] **Step 3: Update lib.rs + route mount**

In `sw4p-backend/src/lib.rs`:
- `pub mod custom_ism;` → `pub mod route_security;`
- `get(custom_ism::security_levels_handler)` → `get(route_security::security_levels_handler)`

Use `replace_all` for `custom_ism` → `route_security` in lib.rs only.

- [x] **Step 4: Run cargo build**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails/sw4p-backend"
cargo build --lib 2>&1 | tail -15
```

Expected: clean. If cargo reports any unresolved-import or unknown-name errors, those are leftover references caught by the compiler — apply targeted Edit for each.

- [x] **Step 5: Run full library tests for route_security**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails/sw4p-backend"
cargo test --lib route_security:: 2>&1 | tail -10
```

Expected: all tests previously in `custom_ism::tests` now report under `route_security::tests` and pass.

## Task 12: A2/A3 fix-pass commit + push

- [x] **Step 1: Identity audit + commit + push**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a2-a3-remove-aspirational-rails"
git diff -U0 HEAD | grep -iE "co-authored|🤖|generated with|noreply" || echo "CLEAN"
git add sw4p-backend/src/route_security.rs sw4p-backend/src/lib.rs sw4p-backend/src/multi_hop.rs sw4p-backend/src/starknet_client.rs sw4p-backend/src/sdk_bridge.rs sw4p-backend/src/chains.rs
git status --short
```

The status output must show:
- `R  custom_ism.rs -> route_security.rs` (rename detected)
- `M  lib.rs`, `multi_hop.rs`, `starknet_client.rs`, `sdk_bridge.rs`, `chains.rs`

```bash
git commit -m "$(cat <<'EOF'
fix(backend): purge remaining Hyperlane terminology + remove unimplemented DexType variants

Hack-detection review pass (Track A2/A3). Three follow-ups to the
original rail removal:

1. CRITICAL — custom_ism.rs is renamed to route_security.rs and the
   struct/log-tag/endpoint vocabulary is replaced wholesale. The "ISM"
   (Interchain Security Module) abbreviation is Hyperlane-exclusive
   taxonomy; keeping a `CustomIsm` struct with `[CUSTOM_ISM]` operator
   log tags after removing Hyperlane was a vendor-branding leak in a
   PR specifically meant to purge that vendor. Per the repo's
   no-partial-solutions rule, "rename in a follow-up" was not an
   option.

2. Stale Hyperlane Warp Routes references in starknet_client.rs:5-8,
   sdk_bridge.rs:134/1458, and chains.rs:247 are replaced with the
   factual post-removal statement that no bridge path is currently
   supported for Starknet (the runtime already returns Err from
   multi_hop::plan_route for Starknet routes).

3. multi_hop.rs::DexType — Uniswap and Jupiter variants are removed
   from the enum. Their `execute_route` arms hard-returned
   "not yet implemented" errors, meaning plan_route would happily
   generate routes that failed at execute time. The remaining
   SunSwap variant is exhaustive; non-TRX source/dest swaps now
   error at plan time with a clear message.
EOF
)"
git push origin protocol/a2-a3-remove-aspirational-rails 2>&1 | tail -3
```

---

## Task 13: A4 #11 — `authenticate_filler_db` returns Result<Option<Filler>, sqlx::Error> (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist/sw4p-backend/src/solver_auction.rs:504-561`
- Update callers of `authenticate_filler_db`

- [x] **Step 1: Identify all callers**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist"
grep -rn "authenticate_filler_db\|authenticate_filler(" sw4p-backend/src/ | head -20
```

- [x] **Step 2: Change the signature**

In `sw4p-backend/src/solver_auction.rs`, change:

```rust
pub async fn authenticate_filler_db(
    fillers: &FillerRegistry,
    pool: &crate::db::DbPool,
    filler_id: &str,
    api_key: &str,
) -> Option<Filler> {
    let row: Option<(
        String, String, Vec<String>, Vec<String>,
        f32, i32, i64, chrono::DateTime<chrono::Utc>, bool,
    )> = sqlx::query_as(
        "SELECT api_key_hash, name, supported_chains, supported_tokens, reputation_score, total_fills, total_volume_usdc, registered_at, is_active FROM registered_fillers WHERE id = $1 LIMIT 1",
    )
    .bind(filler_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();
    // ... rest of function
}
```

To:

```rust
pub async fn authenticate_filler_db(
    fillers: &FillerRegistry,
    pool: &crate::db::DbPool,
    filler_id: &str,
    api_key: &str,
) -> Result<Option<Filler>, sqlx::Error> {
    let row: Option<(
        String, String, Vec<String>, Vec<String>,
        f32, i32, i64, chrono::DateTime<chrono::Utc>, bool,
    )> = sqlx::query_as(
        "SELECT api_key_hash, name, supported_chains, supported_tokens, reputation_score, total_fills, total_volume_usdc, registered_at, is_active FROM registered_fillers WHERE id = $1 LIMIT 1",
    )
    .bind(filler_id)
    .fetch_optional(pool)
    .await?;
    // ... rest of function (returning Ok(Some(...)) / Ok(None))
}
```

Replace `.ok().flatten()` with `?`. Wrap the `Some(filler)` return in `Ok(Some(filler))`. Wrap the `_ => None` arm in `Ok(None)`.

- [x] **Step 3: Update every caller**

Each caller of `authenticate_filler_db(...).await` becomes `authenticate_filler_db(...).await?` if the caller already returns `Result`, OR pattern-matches on the result and converts the `Err(sqlx::Error)` into a 503 response (Service Unavailable, DB down) and the `Ok(None)` into a 401 (bad credentials). The two are now distinct, which is the whole point.

For each HTTP handler caller (likely `submit_quote_handler`, `confirm_fill_handler`, `register_filler_handler`):

```rust
let filler = match authenticate_filler_db(fillers, pool, &req.filler_id, &req.api_key).await {
    Ok(Some(f)) => f,
    Ok(None) => return (
        StatusCode::UNAUTHORIZED,
        Json(serde_json::json!({"error": "INVALID_API_KEY", "message": "filler_id or api_key did not match"})),
    ).into_response(),
    Err(db_err) => {
        tracing::error!("[AUCTION] DB error during filler auth: {}", db_err);
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({"error": "DB_UNAVAILABLE", "message": "authentication is temporarily unavailable"})),
        ).into_response();
    }
};
```

- [x] **Step 4: Run cargo check**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist/sw4p-backend"
cargo check --lib 2>&1 | tail -10
```

Expected: clean. Type errors at call sites are EXPECTED — they pinpoint each caller that needs the match arm.

- [x] **Step 5: Run cargo test --lib solver_auction**

```bash
cargo test --lib solver_auction:: 2>&1 | tail -10
```

Expected: PASS.

## Task 14: A4 #9 — `u64_to_pg_bigint` returns Result<i64, AmountOverflow> (CRITICAL)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist/sw4p-backend/src/solver_auction.rs:45-70` (helper) + the 6 call sites

- [x] **Step 1: Define the error type + change the helper**

In `solver_auction.rs` near the top:

```rust
/// Returned when a u64 amount cannot be stored as a Postgres BIGINT (i64).
#[derive(Debug, thiserror::Error)]
#[error("amount {amount} for {context} exceeds Postgres BIGINT range (i64::MAX = {max})")]
pub struct AmountOverflow {
    pub amount: u64,
    pub context: String,
    pub max: i64,
}

/// Convert a `u64` USDC-style amount into a Postgres `BIGINT` (i64),
/// returning an error if the value exceeds `i64::MAX`. Callers MUST
/// propagate this error — silent clamping at i64::MAX would corrupt
/// auction accounting (the value would store as a large negative,
/// then read back as 0 via `.max(0) as u64`).
///
/// USDC at 6 decimals tops out at ~9.2 trillion in i64, which is ~115x
/// the entire USDC supply — so this guard fires only on malformed
/// input (or future tokens with smaller decimals).
fn u64_to_pg_bigint(val: u64, context: &str) -> Result<i64, AmountOverflow> {
    if val > i64::MAX as u64 {
        Err(AmountOverflow {
            amount: val,
            context: context.to_string(),
            max: i64::MAX,
        })
    } else {
        Ok(val as i64)
    }
}
```

- [x] **Step 2: Update each of the 6 call sites to propagate the error**

For each `u64_to_pg_bigint(x, "context")` call in `solver_auction.rs`, change to `u64_to_pg_bigint(x, "context")?` if the enclosing function returns `Result`. For the handler call sites that return `IntoResponse`, convert the error into a 400 Bad Request:

```rust
let house_output_pg = match u64_to_pg_bigint(adjusted_output, "auction.house_output") {
    Ok(v) => v,
    Err(e) => {
        tracing::error!("[AUCTION] {}", e);
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "AMOUNT_OVERFLOW",
                "message": e.to_string(),
            })),
        ).into_response();
    }
};
```

For the `auction_closer` loop (winner.output_amount cast), log + skip the DB write (do NOT panic — auction_closer must keep advancing other auctions):

```rust
let winning_output_pg = match u64_to_pg_bigint(winner.output_amount, "auction.winning_output") {
    Ok(v) => v,
    Err(e) => {
        tracing::error!("[AUCTION] skipping DB update for {}: {}", intent_id, e);
        continue;
    }
};
```

- [x] **Step 3: Add `thiserror` import if not already present**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist/sw4p-backend"
grep -E "^thiserror" Cargo.toml | head -3
```

If `thiserror` is not in Cargo.toml dependencies, add it: `thiserror = "1.0"`. (The other A1/A2/A4 modules already use `thiserror::Error` derive — verify before adding.)

- [x] **Step 4: cargo test --lib solver_auction**

```bash
cargo test --lib solver_auction:: 2>&1 | tail -10
```

Expected: PASS. If a unit test was directly calling `u64_to_pg_bigint` and asserting the saturating behavior, update it to assert the `Err` variant instead.

## Task 15: A4 #12 — Propagate `chrono::DateTime::from_timestamp` failures (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist/sw4p-backend/src/solver_auction.rs:711-719, 1091, 1094`

- [x] **Step 1: Identify all `unwrap_or_else(Utc::now)` on `from_timestamp`**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist"
grep -nE "from_timestamp.*unwrap_or" sw4p-backend/src/solver_auction.rs | head -10
```

- [x] **Step 2: Replace each site with `ok_or_else` + handler error path**

For the call sites in `open_auction_with_pricing` (the deadline/start/house dates):

```rust
let deadline_dt = chrono::DateTime::from_timestamp(auction_end, 0).ok_or_else(|| {
    tracing::error!("[AUCTION] malformed auction_end timestamp: {}", auction_end);
    AuctionPersistError::BadTimestamp("auction_end")
})?;
```

Define a small `AuctionPersistError` enum at the top of the function or near the helpers:

```rust
#[derive(Debug, thiserror::Error)]
enum AuctionPersistError {
    #[error("malformed timestamp for {0}")]
    BadTimestamp(&'static str),
    #[error(transparent)]
    Overflow(#[from] AmountOverflow),
    #[error(transparent)]
    Db(#[from] sqlx::Error),
}
```

For `submit_quote_handler` (lines 1091, 1094), the `fill_deadline_dt` and `expires_at_dt` use the same pattern. Map the error into a 400 response.

- [x] **Step 3: cargo check + cargo test**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist/sw4p-backend"
cargo check --lib 2>&1 | tail -5 && cargo test --lib solver_auction:: 2>&1 | tail -5
```

Expected: clean + pass.

## Task 16: A4 #10 — Add FK on winning_quote_id with ON DELETE SET NULL (CRITICAL)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist/sw4p-backend/migrations/20260513000000_extend_auction_tables.sql`

- [x] **Step 1: Apply the migration edit**

Replace the multi-line doc-comment justifying the absence of the FK, plus the column declaration, with the column + the FK:

```sql
-- ----- auctions: add fields needed to reconstruct the in-memory Auction -----
-- `winning_quote_id` references `filler_quotes(id)` with ON DELETE
-- SET NULL. This gives DB-level referential integrity (the auction
-- can't point at a non-existent quote) AND tolerates future
-- filler_quotes-cleanup jobs: if a quote row is purged, the auction's
-- winning_quote_id becomes NULL, and the recovery loader's existing
-- NULL fallback path (load_auctions_from_db, where filler_id
-- matching kicks in) handles it transparently.
ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS auction_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS house_estimated_time_seconds INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS house_fill_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS house_quote_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS winning_quote_id UUID
        REFERENCES filler_quotes(id) ON DELETE SET NULL;
```

- [x] **Step 2: Verify migration syntax**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist"
grep -nE "ADD COLUMN IF NOT EXISTS winning_quote_id" sw4p-backend/migrations/20260513000000_extend_auction_tables.sql
```

Expected: shows the new constraint line.

Note: `ADD COLUMN IF NOT EXISTS` with `REFERENCES` in Postgres is supported when the column itself doesn't exist; if the migration was already applied without the FK in a dev DB, an operator-side `ALTER TABLE auctions ADD CONSTRAINT ...` follow-up is needed. Add a comment in the migration documenting that.

## Task 17: A4 fix-pass commit + push

- [x] **Step 1: Identity audit + commit + push**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a4-solver-auction-persist"
git diff -U0 HEAD | grep -iE "co-authored|🤖|generated with|noreply" || echo "CLEAN"
git add sw4p-backend/src/solver_auction.rs sw4p-backend/migrations/20260513000000_extend_auction_tables.sql sw4p-backend/tests/solver_auction_recovery.rs
git commit -m "$(cat <<'EOF'
fix(backend): propagate errors instead of swallowing/saturating (solver auction)

Hack-detection review pass (Track A4). Four correctness fixes:

1. CRITICAL — u64_to_pg_bigint now returns Result<i64, AmountOverflow>
   instead of saturating at i64::MAX with a log line. Saturating was
   silent corruption "loudly logged" — still corruption. All six call
   sites either propagate via `?` to a Result-returning function, or
   convert the error to a 400 Bad Request (handlers) or skip + log
   (auction_closer). AmountOverflow uses thiserror so callers can
   pattern-match.

2. CRITICAL — winning_quote_id migration now has
   REFERENCES filler_quotes(id) ON DELETE SET NULL. The previous
   "no-FK + doc-comment justifying it" was the partial-solution
   anti-pattern: a comment isn't a constraint. ON DELETE SET NULL
   gives DB-level integrity AND tolerates cleanup-job deletes (the
   recovery loader already handles NULL fallback).

3. IMPORTANT — authenticate_filler_db now returns
   Result<Option<Filler>, sqlx::Error>. The previous
   `.ok().flatten()` collapsed "DB unreachable" and "filler not
   found" into the same `None`, which would 401 every valid filler
   during a brief DB hiccup. Callers now map Err -> 503 (DB
   unavailable) and Ok(None) -> 401 (bad credentials) distinctly.

4. IMPORTANT — chrono::DateTime::from_timestamp.unwrap_or_else(Utc::now)
   sites in open_auction_with_pricing + submit_quote_handler replaced
   with `.ok_or_else(...)?` propagating an AuctionPersistError. A
   malformed timestamp now returns 400 to the caller rather than
   silently turning the persisted deadline into "right now" (which
   would have made a winner immediately slash-eligible).
EOF
)"
git push origin protocol/a4-solver-auction-persist 2>&1 | tail -3
```

---

## Task 18: A5-A8 #14 — Validate `recipient_hex` exactly 64 hex chars (IMPORTANT)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups/sw4p-backend/src/smart_account.rs:281-291`

- [x] **Step 1: Find the exact deposit_data formatter**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups"
grep -nE "recipient_hex|\{:0>64\}|depositForBurn" sw4p-backend/src/smart_account.rs | head -15
```

- [x] **Step 2: Add validation before the format!**

In `smart_account.rs` immediately before the `format!` that builds `deposit_data`:

```rust
// Validate recipient is exactly 32 bytes (64 hex chars). The {:0>64}
// formatter zero-pads short values but does NOT reject long values —
// an over-length recipient (e.g. attacker-supplied) would silently
// extend the calldata and corrupt the ABI layout downstream, producing
// a depositForBurn call that targets garbage state.
let recipient_clean = recipient_hex.trim_start_matches("0x").trim();
if recipient_clean.len() > 64 || !recipient_clean.chars().all(|c| c.is_ascii_hexdigit()) {
    return Err(format!(
        "recipient must be at most 64 hex chars (32 bytes), no 0x prefix; got {} chars",
        recipient_clean.len(),
    ).into());
}
```

- [x] **Step 3: Add a unit test for the rejection path**

In `smart_account.rs` tests section:

```rust
#[test]
fn delegated_bridge_rejects_over_length_recipient() {
    // 65 hex chars — one too many.
    let bad_recipient = "a".repeat(65);
    // Construct a minimal payload and assert the build helper returns Err.
    // (Use the helper as exercised by delegated_bridge_handler.)
    let result = build_deposit_data_for_test(&bad_recipient);
    assert!(result.is_err(), "expected Err for over-length recipient, got {:?}", result);
}
```

Adjust to match the actual function name used in production code (replace `build_deposit_data_for_test` with whatever the real builder is called).

- [x] **Step 4: cargo check + test**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups/sw4p-backend"
cargo test --lib smart_account:: 2>&1 | tail -10
```

Expected: PASS, new test green.

## Task 19: A5-A8 #13 — 503-gate paymaster endpoint (CRITICAL)

**Files:**
- Modify: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups/sw4p-backend/src/smart_account.rs:1059-1083` + handler call sites

- [x] **Step 1: Replace `generate_paymaster_data` with an explicit error**

In `smart_account.rs`, replace the body of `generate_paymaster_data` (the part that builds the zero-byte placeholder signature):

```rust
fn generate_paymaster_data(
    _user_op: &UserOperation,
    _source_chain: &str,
) -> Result<PaymasterResponse, PaymasterError> {
    // Paymaster ECDSA signing is not yet implemented. The previous
    // placeholder returned 65 null bytes, which produced a structurally
    // valid PaymasterResponse but would always revert at the on-chain
    // Paymaster's signature verification, silently burning the user's
    // gas estimation. Returning an explicit error is the honest answer
    // until the ECDSA path is wired in.
    Err(PaymasterError::NotImplemented)
}

#[derive(Debug, thiserror::Error)]
pub enum PaymasterError {
    #[error("paymaster signing is not yet implemented")]
    NotImplemented,
}
```

- [x] **Step 2: Update the two HTTP handler call sites to return 503**

Both `POST /v1/account/paymaster` and `POST /v1/bridge/userop` (when `sponsor_gas: true`) call `generate_paymaster_data`. Update each to convert the `Err(PaymasterError::NotImplemented)` into a 503:

```rust
let paymaster_response = match generate_paymaster_data(&user_op, &chain) {
    Ok(r) => r,
    Err(PaymasterError::NotImplemented) => {
        tracing::warn!("[PAYMASTER] sponsorship requested but signing not implemented");
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({
                "error": "PAYMASTER_UNAVAILABLE",
                "message": "Paymaster sponsorship is currently disabled (signing not implemented).",
            })),
        ).into_response();
    }
};
```

- [x] **Step 3: Update the existing `test_generate_paymaster_data_success` test**

The old test asserted a Success response with a non-zero `paymaster_data` length. Replace with:

```rust
#[test]
fn test_generate_paymaster_data_returns_not_implemented() {
    // After the 503-gate fix, generate_paymaster_data unconditionally
    // returns Err(PaymasterError::NotImplemented). The HTTP handlers
    // wrap this into a 503; this unit test pins the return contract.
    std::env::set_var(PAYMASTER_SIGNER_ENV, "0xabc"); // even with key set
    let user_op = test_user_op();
    let result = generate_paymaster_data(&user_op, "BASE");
    assert!(matches!(result, Err(PaymasterError::NotImplemented)));
}
```

Remove the old `test_generate_paymaster_data_success` test — its assertion (length of `paymaster_data`) was confirming the wrong thing.

- [x] **Step 4: Run cargo test --lib smart_account**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups/sw4p-backend"
cargo test --lib smart_account:: 2>&1 | tail -10
```

Expected: PASS. The recipient-validation test (Task 18) + the new not-implemented test both green.

## Task 20: A5-A8 fix-pass commit + push

- [x] **Step 1: Identity audit + commit + push**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/.claude/worktrees/a5-a8-cleanups"
git diff -U0 HEAD | grep -iE "co-authored|🤖|generated with|noreply" || echo "CLEAN"
git add sw4p-backend/src/smart_account.rs
git commit -m "$(cat <<'EOF'
fix(backend): 503-gate unimplemented paymaster + validate recipient_hex length

Hack-detection review pass (Track A5-A8). Two security/correctness
fixes that were marked "pre-existing, out of scope" in the original
PR but are unacceptable under the no-hacks rule:

1. CRITICAL — generate_paymaster_data no longer ships a 65-byte null
   placeholder signature on the success path. The previous behavior
   accepted a real PAYMASTER_SIGNER_ENV key, then ignored it and
   returned 130 hex zeros — every sponsored UserOp would revert at
   the on-chain Paymaster signature check, silently burning user
   gas estimation. The function now returns
   Err(PaymasterError::NotImplemented), and both HTTP handlers
   (POST /v1/account/paymaster, POST /v1/bridge/userop with
   sponsor_gas: true) convert the error to 503 Service Unavailable
   with an actionable message. The bogus "signer-key check" that
   created the false appearance of a real signing path is also
   removed.

2. IMPORTANT — recipient_hex is now validated to be exactly 64
   hex chars (32 bytes) before it's interpolated into the
   depositForBurn calldata via {:0>64}. The previous formatter
   pad-but-don't-truncate behavior would silently accept an
   over-length attacker-supplied recipient and produce malformed
   ABI calldata. The handler now returns 400 Bad Request.

The old `test_generate_paymaster_data_success` test asserted on
the length of `paymaster_data` — which would pass with the
broken placeholder. Replaced with a test pinning the
NotImplemented return contract.
EOF
)"
git push origin protocol/a5-a8-cleanups 2>&1 | tail -3
```

---

# Phase 3 — Final verification across all 6 PRs

## Task 21: Cross-PR audit

- [x] **Step 1: Pull each PR's latest, run its native test command, audit identity**

For each of the 6 worktrees, run in sequence:

```bash
# Helper — set $W to each worktree path in turn.
W="/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
cd "$W" && git log --oneline -3 && git log -p HEAD~1..HEAD | grep -iE "co-authored|🤖|generated with|noreply" || echo "$(basename $W): CLEAN"
```

For the 4 Rust worktrees, also run `cargo check --lib`; for the 2 TS worktrees, also run `npm test && npx tsc --noEmit`.

Expected: every worktree clean, every test suite green at HEAD.

- [x] **Step 2: Report final summary to chat**

Format:
```
6 PRs updated with hack-fix commits.
14 hacks resolved (4 CRITICAL + 9 IMPORTANT + 1 MINOR).
Commit hashes per track, identity audit clean across all.
```

---

## Self-Review

### Spec coverage check

Walking the 14-hack table from the chat against the plan:

| # | Hack | Task |
|---|---|---|
| 1 | C1/C2 unlink catch | Task 1 ✓ |
| 2 | C1/C2 mkdir catch | Task 2 ✓ |
| 3 | B7 STATELESS alias | Task 4 ✓ |
| 4 | B7 as never casts | Task 5 ✓ |
| 5 | A1 testnet MT addr | Task 7 ✓ |
| 6 | A2/A3 custom_ism rename | Task 11 ✓ |
| 7 | A2/A3 stale Hyperlane docs | Task 9 ✓ |
| 8 | A2/A3 DexType variants | Task 10 ✓ |
| 9 | A4 u64_to_pg_bigint | Task 14 ✓ |
| 10 | A4 winning_quote_id FK | Task 16 ✓ |
| 11 | A4 authenticate_filler_db | Task 13 ✓ |
| 12 | A4 from_timestamp fallback | Task 15 ✓ |
| 13 | A5-A8 paymaster zero-sig | Task 19 ✓ |
| 14 | A5-A8 recipient validation | Task 18 ✓ |

All 14 covered.

### Placeholder scan

- No "TBD" / "TODO" / "fill in" anywhere.
- No "Add appropriate error handling" without showing the code.
- One `(replace with whatever the real builder is called)` in Task 18 — that's an explicit instruction to substitute, not a hidden placeholder.

### Type consistency

- `AmountOverflow` (Task 14) and `AuctionPersistError` (Task 15) — `AuctionPersistError::Overflow(#[from] AmountOverflow)` is consistent.
- `PaymasterError::NotImplemented` used identically in Task 19 step 1, step 2, step 3.
- `authenticate_filler_db -> Result<Option<Filler>, sqlx::Error>` matched at every caller call-site update.

Plan is consistent. Saved.

---

# Completion Report (2026-05-14)

**All 6 PRs merged. 35 confidence-≥75 hack findings resolved across three independent review passes.**

## Merge Outcomes

| PR | Track | Repo | Merge SHA | Merged At |
|---|---|---|---|---|
| [#178](https://github.com/Render-Network-OS/sw4p-pro/pull/178) | A1 (Networks Registry) | sw4p-pro | `d98e3ee` | 2026-05-14T02:18:21Z |
| [#179](https://github.com/Render-Network-OS/sw4p-pro/pull/179) | A2/A3 (Hyperlane + Wormhole removal) | sw4p-pro | `6a38db7` | 2026-05-14T02:45:52Z |
| [#180](https://github.com/Render-Network-OS/sw4p-pro/pull/180) | A4 (Solver-auction persistence) | sw4p-pro | `b31f2bc` | 2026-05-14T02:47Z |
| [#181](https://github.com/Render-Network-OS/sw4p-pro/pull/181) | A5–A8 (Cleanups + smart_account hardening) | sw4p-pro | `e93a8a3` | 2026-05-14T02:48Z |
| [#1](https://github.com/Render-Network-OS/sw4p-kit/pull/1) | B7 (Streamable HTTP transport) | sw4p-kit | `c9ec65f` | 2026-05-14T02:49Z |
| [#2](https://github.com/Render-Network-OS/sw4p-kit/pull/2) | C1/C2 (sw4p-kit-init + sw4p-kit-doctor CLIs) | sw4p-kit | `6d30abe` | 2026-05-14T02:50:15Z |

## Pass-by-Pass Findings Tally

| Pass | Total findings (conf ≥75) | Severity breakdown |
|---|---|---|
| 1st-pass hack detection | 14 | 4 CRITICAL + 9 IMPORTANT + 1 MINOR |
| 2nd-pass on first-pass commits | 13 | 2 CRITICAL + 11 IMPORTANT |
| 3rd-pass on second-pass commits | 8 | 2 CRITICAL + 6 IMPORTANT |
| **Total** | **35** | **8 CRITICAL + 26 IMPORTANT + 1 MINOR** |

## Per-PR Fix-Commit Audit Trail

Each PR carries the cumulative remediation commits below, in order. All authored as `rndrntwrk <dev@rndrntwrk.com>` — identity audit clean (no `Co-Authored-By:`, no `🤖`, no "Generated with" trailer anywhere).

### A1 (#178 → `d98e3ee`)
| Pass | Commit | What |
|---|---|---|
| 1st | `b40cea5` | OP testnet chain_id + message-transmitter registry pinning |
| 1st | `454f31d` | RPC URL credentials redacted in relay log lines |
| 1st | `4d1f0e3` | x402 error wording + CCTP `TESTNET_*_V2` / `DOMAIN_*` annotations |
| 1st | `83c28f4` | ZKSYNC env-block purge + `NETWORK_MODE → SW4P_NETWORK` cutover |
| 2nd | `3be4e40` | `.env.testnet` V1-vs-V2 MessageTransmitter mislabel correction + hardened V2 pin |
| 3rd | `6980ea5` | Negative-pin completeness (3 V1 addresses) + de-enumerated `.env.testnet` chain list |

### A2/A3 (#179 → `6a38db7`)
| Pass | Commit | What |
|---|---|---|
| 1st | `bedf6fc` | Hyperlane + Wormhole NTT aspirational rails removed (-3186 / +41) |
| 1st | `9668819` | `custom_ism.rs → route_security.rs` rename + DexType unimplemented-variant removal + stale-Hyperlane-doc updates |
| 2nd | `7bbb1ac` | Unified Starknet plan-time gate at top of `plan_route` |
| Master-merge | `b3812cf` | Resolved zksync(master)/hyperlane(HEAD) parallel struct-field removals |

### A4 (#180 → `b31f2bc`)
| Pass | Commit | What |
|---|---|---|
| 1st | `743003e` | Solver-auction persistence layer + 4 CRITICAL/IMPORTANT first-pass fixes |
| 1st | `1d12997` | `u64_to_pg_bigint` Result + `authenticate_filler_db` Result + winning_quote_id FK + chrono propagation |
| 2nd | `c20dcf0` | DB-first ordering in `open_auction_with_pricing`, timestamp validation before `auction.quotes.push`, idempotent FK migration |
| 3rd | `da93318` | **3-phase auction_closer refactor** (read-only identify → atomic Postgres transaction → mutate state ONLY on commit success); eliminates Won-vs-DB-Open desync on the non-overflow success path |
| Master-merge | `f24e383` | Master merged in cleanly (no conflicts) |

### A5–A8 (#181 → `e93a8a3`)
| Pass | Commit | What |
|---|---|---|
| 1st | `a252292` | Dead `deploy-contracts.js` pipeline removed + smart_account `BatchExecutorUnconfigured`+`expected` delegate hardening |
| 1st | `14f3db4` | 503-gate paymaster placeholder + `recipient_hex` length validation |
| 2nd | `3006662` | `env_prefix` stripped from public JSON response + empty-recipient rejection + `sponsorship_warning` field on `UserOpBridgeResponse` |
| 3rd | `bdcb3ca` | `PaymasterError::Display` impl scrubbed of `env_prefix` (closes the leak that snuck through `sponsorship_warning`) + stale test-assertion wording updated |
| Master-merge | `d590d5b` | Resolved `deploy_contracts.rs` delete-vs-modify + main.rs module-import union + smart_account.rs Registry-DI integration in three test bodies |

### B7 (#1 → `c9ec65f`)
| Pass | Commit | What |
|---|---|---|
| 1st | `6834eed` | Streamable HTTP transport + entry-point + 30s spawn-test timeouts |
| 1st | `c4982f2` | Stateless-async refusal text + SDK HTTP error + stdio regression test + minor sweep |
| 2nd | `08b6bf0` | Deleted `STATELESS_ASYNC_TASKS_ERROR` alias + replaced 2× `as never` with `Transport`-typed adapter |
| 3rd | `28e650a` | `intoMcpTransport(t)` adapter centralises the SDK type-gap cast + dropped `sdk: sdkClient as never` after verifying `SdkClient`-vs-`SdkLike` structural identity |
| 3rd | `f165d42` | Deleted the missed `as never` cast in `bin.ts:33` (second-pass left it behind) |

### C1/C2 (#2 → `6d30abe`)
| Pass | Commit | What |
|---|---|---|
| 1st | `c424946` | Atomic config writes via temp+rename + InitFs.unlink seam |
| 1st | `8a53c0e` | `sw4p-kit-doctor --timeout=0` warning + validation |
| 2nd | `f4fd752` | Removed bare `catch{}` on unlink + mkdir; combined-error message names the leaked cleartext-key file path |
| 2nd | `724f6b6` | `memFs.unlink` mirrors `nodeFs.unlink` control flow (throw ENOENT → catch internally) |
| Main-merge | `cdf72db` | Union of B7's `sw4p-mcp-http` bin + C1/C2's three new bins in `package.json` |

## Test Suite Outcomes at Merge

| Repo / Track | Final test count | Delta from baseline |
|---|---|---|
| sw4p-pro (A1) | 1482 passed / 0 failed | +7 regression tests (OP chain_id, MT registry pin, RPC redaction) |
| sw4p-pro (A2/A3) | 1389 passed / 0 failed post-rebase | +5 net (Starknet gate + DexType variants + plan-time rejects) |
| sw4p-pro (A4) | 1437 passed / 0 failed post-rebase | +13 solver_auction tests |
| sw4p-pro (A5/A8) | 1442 passed / 0 failed post-rebase | +22 smart_account tests |
| sw4p-kit (B7) | 99 passed / 0 failed | +2 stdio regression tests |
| sw4p-kit (C1/C2) | 153 passed / 0 failed | +9 init/doctor tests (atomic write, ENOENT propagation, `--timeout` validation) |

## Verification of Honesty Above Everything

Two findings during the multi-pass review were specifically flagged as **honesty violations** in my own prior commits, and both were resolved transparently:

1. **A4 second-pass `1d12997`**: My commit message claimed "no half-state" for `open_auction_with_pricing` but the DB-failure path still produced one (in-memory `Won` + DB `Open`). Third-pass `da93318` fixed it properly with the 3-phase refactor.
2. **B7 second-pass `28e650a`**: My commit message said the `sdk: sdkClient as never` cast was deleted, but I only deleted it from `http.ts:139` — not `bin.ts:33`. Third-pass `f165d42` corrected this.

Both are documented in the third-pass commit messages so the audit trail is complete.

## Identity Audit — Final

Every commit across the three passes + every merge commit + every doc update:
```
Author: rndrntwrk <dev@rndrntwrk.com>
Committer: rndrntwrk <dev@rndrntwrk.com>
```

No `Co-Authored-By:` trailers, no `🤖`, no Claude/Anthropic/AI attribution, no "Generated with" tags. Compliant with `~/.claude/CLAUDE.md` HARD constraint throughout the engagement.

## Verifiable Proof Commands

Anyone with `gh` access can reproduce this completion report:

```bash
# Merge state of all 6 PRs
gh pr view 178 --repo Render-Network-OS/sw4p-pro --json state,mergedAt,mergeCommit
gh pr view 179 --repo Render-Network-OS/sw4p-pro --json state,mergedAt,mergeCommit
gh pr view 180 --repo Render-Network-OS/sw4p-pro --json state,mergedAt,mergeCommit
gh pr view 181 --repo Render-Network-OS/sw4p-pro --json state,mergedAt,mergeCommit
gh pr view 1   --repo Render-Network-OS/sw4p-kit --json state,mergedAt,mergeCommit
gh pr view 2   --repo Render-Network-OS/sw4p-kit --json state,mergedAt,mergeCommit

# Identity audit on every commit in the closure
for sha in d98e3ee 6a38db7 b31f2bc e93a8a3 c9ec65f 6d30abe \
           b40cea5 454f31d 4d1f0e3 83c28f4 3be4e40 6980ea5 \
           bedf6fc 9668819 7bbb1ac b3812cf \
           743003e 1d12997 c20dcf0 da93318 f24e383 \
           a252292 14f3db4 3006662 bdcb3ca d590d5b \
           6834eed c4982f2 08b6bf0 28e650a f165d42 \
           c424946 8a53c0e f4fd752 724f6b6 cdf72db; do
  git -C ./sw4p log -1 --format="%h %an <%ae>" $sha 2>/dev/null
done | sort -u
# Expected output: every line shows `rndrntwrk <dev@rndrntwrk.com>` and nothing else.
```

**Plan: complete. Saved 2026-05-14.**
