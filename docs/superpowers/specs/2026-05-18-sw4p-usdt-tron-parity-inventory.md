# sw4p USDT/Tron Parity, WS0 Inventory

Date: 2026-05-18.
Branch surveyed: `docs/wave-g-sw4p-earn-corpus` at HEAD `7557777c docs(sw4p): revise usdt tron pack + add canonical m0-m2 plan`.
Satisfies SOW WP0.1, WP0.2, WP0.3, WP0.4, WP0.5 (see `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-sow.md`).
This doc is the single source of truth for branch and code state before any T1 to T16 task is dispatched.

## 1. Branch presence (WP0.1)

Source data: `/tmp/sw4p_tron_branches.txt` (from `git branch -a | grep -iE 'tron|sw4p'`) plus per-branch `git rev-parse --verify --quiet` checks against local, `origin`, and `sw4p-earn` remotes.

| Legacy branch (per PRD section 3, lines 102 to 105) | Present locally | Present on origin | Present on sw4p-earn | Resolution |
|---|---|---|---|---|
| `feat/sw4p-tron-sdk-contract`           | absent | absent | absent | never-existed in this clone, proceed without it |
| `fix/sw4p-tron-backend-adapter`         | absent | absent | absent | never-existed in this clone, proceed without it |
| `ops/sw4p-tron-proof-corridor-provisioning` | absent | absent | absent | never-existed in this clone, proceed without it |
| `docs/sw4p-tron-proof-corridor-research`    | absent | absent | absent | never-existed in this clone, proceed without it |

Confirms the PRD section 3 footnote: these four branches were referenced in earlier sessions but are not present on the local clone or any origin remote as of 2026-05-18. Per PRD instruction, treat as discoverable-but-not-blocking; do not stall WS1+ waiting for them.

Tron and sw4p related branches that do exist (from `/tmp/sw4p_tron_branches.txt`):
- `chore/sw4p-submodule-bump-2026-05-16` (local)
- `design/sw4p-earn-xp-reskin` (local + remote)
- `docs/wave-g-sw4p-earn-corpus` (current, local + remote)
- `feat/sw4p-fee-outbox` (local + remote)
- `sw4p-earn-extract`, `sw4p-earn-extract-v2` (local)
- A large set of `sw4p-earn/*` remote branches (claim flow, vault tests, decimal verifier, runtime authority monitor, etc.). None of these match a USDT/Tron parity name.

No branch on the survey output references `tron-sdk-contract`, `tron-backend-adapter`, `tron-proof-corridor-provisioning`, or `tron-proof-corridor-research`. WS0 closes branch discovery here.

Tron and Allbridge related commits across `git log --all` (`/tmp/sw4p_tron_commits.txt`):
- `7557777c docs(sw4p): revise usdt tron pack + add canonical m0-m2 plan`
- `5089fd0b docs(sw4p): complete usdt tron external handoff pack`
- `74fe5fa7 docs(sw4p): add usdt tron parity requirements suite`
- `d813973a evidence(W0.a): flag Allbridge multi-transport corridor design for W2`
- `6322d28b evidence(W0.a): Allbridge Core REST API discovery + W2 Phase 2 path determination`
- `d54da0c6 docs(sw4p): record localnet allbridge blocker`
- `adb277f6 feat(sw4p): record allbridge explicit rail checkpoint`

All seven are docs or evidence commits. No implementation commits reference Tron or Allbridge by message text, which matches the inventory finding that the actual Rust code in `sw4p/sw4p-backend/src/` predates this naming convention.

## 2. Backend surface (WP0.2)

Source: `/tmp/sw4p_backend_files.txt` and `wc -l` against each path. Verdicts align with PRD section 3 lines 88 to 92 and Goal G3 (no false live routes).

| File | Path | Lines | Verdict |
|---|---|---|---|
| `tron_client.rs`     | `sw4p/sw4p-backend/src/tron_client.rs`     |   635 | Useful Tron RPC, TRC20 USDT balance, signing, and broadcast foundation; private-key signing alone is not production parity, keep but do not surface as live until route-state truth lands. |
| `tron_swap.rs`       | `sw4p/sw4p-backend/src/tron_swap.rs`       |   344 | SunSwap V2 router code; no call sites in `allbridge.rs`, `route_selector.rs`, or `native_bridge.rs`; keep dormant, must not be silently composed into a parity route (G3, non-goal item 8). |
| `allbridge.rs`       | `sw4p/sw4p-backend/src/allbridge.rs`       |  1309 | Real adapter scaffold; `get_stablecoin_address` currently returns the Base USDC contract for Base USDT (PRD line 90), `bridge_to_tron_from_solana` returns `Err`. Reconcile with provider snapshot (T2, T3) and route-state gates (T5, T6) before any user-facing claim. |
| `route_selector.rs`  | `sw4p/sw4p-backend/src/route_selector.rs`  |   650 | Selects Allbridge when destination is Tron/TRX or token is USDT; scoring is confidence > time > fee; directionally correct, must consume `RouteState` and stop silent substitution (T6). |
| `native_bridge.rs`   | `sw4p/sw4p-backend/src/native_bridge.rs`   |  3658 | Largest file in the set; maps Tron to non-CCTP domain 99 and picks Allbridge for USDT and Tron source/dest; needs route-state plus proof gates (T5, T6, T11). |
| `bridge_protocol.rs` | `sw4p/sw4p-backend/src/bridge_protocol.rs` |    30 | Canonical enum (`CctpV2`, `AllbridgeCore`); minimal and already correct for M0 to M2 scope; do not extend. |
| `Cargo.toml`         | `sw4p/sw4p-backend/Cargo.toml`             |    92 | Workspace member declaration; will need SQLx migrations wired for T4 and possibly a new internal `route_state` module entry once T1 lands. |

Adjacent files seen in `/tmp/sw4p_backend_files.txt` that are not in the PRD seven but are nearby: `bridge_kit.rs` (12759 bytes), `fee_collection_route_tests.rs` (8718 bytes), `route_security.rs` (27655 bytes), `sdk_bridge.rs` (68008 bytes). These remain out of scope for M0 to M2 but should be re-read during T17 final review for hidden Tron or USDT references.

## 3. Kit surface (WP0.2, kit row)

File: `sw4p-kit/src/core/intent.ts` (28 lines, last modified 2026-05-11).

Current schema, verbatim from the file:
```
const ChainSchema = z.enum(["base", "arbitrum", "polygon", "avalanche", "solana"]);
const AssetSchema = z.enum(["USDC", "USDT"]);
```

Observations:
- `ChainSchema` does not include `"tron"`. This is the documented agent parity gap (PRD line 96).
- `AssetSchema` already includes `"USDT"`, so no asset list change is required to add Tron.
- `EndpointSchema` constrains `address` to `z.string().min(1)`; no chain-specific address-shape validation today.
- `IntentSchema` enforces `amount` as positive decimal and `ttlSeconds` between 30 and 86400; `recipientMemo` is optional and capped at 200 chars.

Other files in `sw4p-kit/src/core/` (from `/tmp/sw4p_kit_files.txt`): `client.ts` (2555 bytes), `errors.ts` (1497 bytes), `gasless.ts` (2607 bytes), `index.ts` (662 bytes), `task.ts` (2487 bytes). T13 must add `"tron"` to the enum without breaking any of these consumers, and T14 must add a new `route_state.ts` next to `intent.ts`.

## 4. Frontend surface (WP0.2, frontend rows)

Frontend (`sw4p-frontend/src/WalletProvider.tsx`, `sw4p-frontend/src/config/settlementChains.ts`, `sw4p-frontend/hooks/useBridge.ts`) is documented in PRD section 3 lines 93 to 95 but is explicitly **out of scope for M0 to M2**. Per plan, no T-task in T0 to T16 modifies frontend code. The current posture (Tron `sourceEnabled: false`, `destinationEnabled: false`, `badge: 'Gated'` in `settlementChains.ts`) is correct until backend route-state truth and proof gates close in later milestones.

This task records no frontend reads, edits, or measurements.

## 5. MCP gateway surface (WP0.2)

| File | Path | Bytes | Lines | Note |
|---|---|---|---|---|
| index | `sw4p-mcp-gateway/src/index.ts` | 16324 | 527 | Confirmed present, wraps sw4p-kit for LLM/MCP clients. |
| tools | `sw4p-mcp-gateway/src/tools.ts` |  9869 | 298 | Confirmed present, must consume kit's updated chain and route-state schema once T13 and T14 land. |

No edits to either file in M0 to M2; consumption of the updated kit schema is implicit and will be exercised by T17 final review.

## 6. Provider source check (WP0.3, WP0.4)

Evidence file: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md`, 12681 bytes, last modified 2026-05-17.

Confirms PRD assumption that Allbridge token-info lists Tron with USDT only. Captured TRX line verbatim:
```
TRX: chainId=3  tokens=['USDT']
```

Context line in the same file enumerates the full chain set:
```
ETH, BSC, POL, ARB, AVA, OPT, CEL, UNI, TRX, SOL
```

These two lines anchor T2 (snapshot fetcher), T3 (matrix normalizer), and T16 (pinned acceptance test). The pinned snapshot for T16 must contain `chainId=3` and `tokens=['USDT']` for TRX or the acceptance test is invalid.

Additional provider sources to be exercised in later waves (per SOW WP0.3 scope): Circle CCTP, Circle Contracts, Tether, and TRON dev portal. WS0 does not enumerate URLs here; T2 owns canonical URL capture against a live fetch.

## 7. Gap report (WP0.5)

Five P0 gaps the rest of the plan must close, each mapped to the task ID that closes it. Task IDs are from `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m0-m2.md`.

1. **No route-state truth layer.** Today `allbridge.rs` and `route_selector.rs` return optimistic results with no `provider_state`, `code_state`, `policy_state` separation, so a route can be exposed as live with no liquidity, proof, or policy backing (PRD G3). Closed by T1 (route state types), T4 (route-truth migrations), T2 (provider snapshot fetcher), T3 (matrix normalizer), T5 (policy filter), T6 (rail selector refactor), T15 (route API handler).
2. **Silent substitution risk in stablecoin address lookup.** `allbridge.rs` `get_stablecoin_address` returns Base USDC for Base USDT (PRD line 90), which violates G1 (asset clarity) and G3. Closed by T6 (rail selector refactor with no silent asset/chain/provider substitution), T7 (substitution regression tests), and T8 (per-chain contract allowlist).
3. **Solana to Tron returns hard `Err`.** `allbridge.rs` line 619 returns `"Solana to Tron bridging not yet implemented. Use EVM chains."`, breaking PRD use case U3. Closed by T9 (Allbridge quote module), T10 (Allbridge tx builder module), T11 (raw transaction validator), T12 (approval policy). These four together implement the unsigned send path that the Solana to Tron corridor consumes once T6 unblocks the selector.
4. **Kit chain schema missing Tron.** `sw4p-kit/src/core/intent.ts` `ChainSchema` enumerates only `base`, `arbitrum`, `polygon`, `avalanche`, `solana` (PRD line 96). Closed by T13 (kit chain schema update) and T14 (kit route-state response type). T15 must serialize the same shape as T14 declares.
5. **No pinned acceptance test for the Allbridge snapshot.** Without a frozen 2026-05-18 fixture, T6 and T15 could regress silently; current evidence file is informational, not enforcement. Closed by T16 (pinned acceptance test) which asserts the expected route-state set and forbids any disallowed route (for example BTC/Omni USDT, which must remain `out_of_scope` per G6).

T17 (final branch code review) closes the loop by re-reading `bridge_kit.rs`, `route_security.rs`, `sdk_bridge.rs`, and the adjacent files listed in section 2 above for any hidden Tron, USDT, or substitution path that this inventory missed.

## Exit gate

WP0.1 through WP0.5 are complete. The plan may begin dispatching W1 tasks (T1 and T4) without further WS0 work.
