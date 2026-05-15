# sw4p Frontier Engine Live-State Audit

**Date:** 2026-05-15
**Scope:** Approach A WS0 gates.
**Inputs:** design spec, SOW, TRD, local filesystem, public RPC checks, official Circle/Solana/Uniswap/EIP sources.

## Gate Summary

| Gate | Status | Evidence |
|---|---|---|
| Solana deployment-status audit | Complete | See "Solana Deployment Status". Public RPC checks found no mainnet account for either declared Solana program ID; devnet has two native-program references and no Anchor account. |
| EVM live-path audit | Complete | See "EVM Deployment / Live-Path Status". V4 bytecode exists on Base, Arbitrum, and Polygon; legacy `ZapAndBridge_V2` bytecode exists on Ethereum, Base, Arbitrum, and Polygon; `ZapNative` has no artifact address but still has an active backend deploy path. |
| P-Token activation-status check | Complete | See "P-Token Activation Status". Direct `solana feature status` checks show `ptokFjwyJtrwCa9Kgo9xoDS59V4QccBGEaRFnRPnSdP` / SIMD-0266 active on mainnet-beta and devnet. |
| EVM safety-control scoping | Complete | See "EVM Safety-Control Scope". V4 is ownerless/immutable today and lacks the Solana-native pause, timelock, daily-limit, governed-admin, and fee-guardrail control surface. |

## Decisions Produced

| Decision | Value | Reason |
|---|---|---|
| Can WS1 migration sequence start? | Yes, with explicit target reconciliation | The audit resolved the live-state unknown: consumers must migrate off the Anchor ID and the hard-coded devnet native ID, and WS1 must treat mainnet Solana promotion as a deploy/promotion step rather than assuming the declared native ID is already live on mainnet. |
| Can ZapNative be deleted? | Blocked | No deployed `ZapNative` address is recorded, but `sw4p-backend deploy` still routes to `deploy_zap_native::deploy_zap_native_contracts()`, the backend has a dedicated `deploy_zap_native` binary/module, and frontend components still carry `ZAP_NATIVE_ABI`. WP0.3 must first remove or migrate those operational references. |
| Can P-Token batch be required on target mainnet? | Yes for mainnet-beta and devnet as checked; keep fallback elsewhere | Mainnet-beta and devnet both report SIMD-0266 active through `solana feature status`. Approach A may use `batch` on those clusters, but code must still retain individual-CPI fallback for local/test clusters or future target clusters without activation evidence. |
| What EVM safety controls must V4-derived canonical contract carry? | Pause, per-period movement limits, timelocked config changes, governed admin/multisig handoff, and fee-take guardrails | These are present or explicitly modeled in `sw4p-native`; V4 currently has CCTP V2 net-mint safety checks and constructor validation, but no owner/admin, no pause, no timelock, no movement limit, and no platform-fee guardrails. |

## Solana Deployment Status

Commands run on 2026-05-15:

```bash
rg -n '555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG|555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3|HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf|SW4P_NATIVE_PROGRAM_ID|SW4P_PROGRAM_ID' sw4p -g '!target' -g '!node_modules' -g '!artifacts'
solana program show 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG --url https://api.mainnet-beta.solana.com
solana program show 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3 --url https://api.mainnet-beta.solana.com
solana program show 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG --url https://api.devnet.solana.com
solana program show 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3 --url https://api.devnet.solana.com
solana program show HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf --url https://api.devnet.solana.com
```

| Program label | Program ID | Mainnet status | Devnet status | Consumers | Migration consequence |
|---|---|---|---|---|---|
| Native canonical candidate | `555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG` | Public mainnet-beta RPC returned `Unable to find the account 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG`. | Exists. ProgramData `6f6sWdyJ8zaiERTaZtnTDTizrBaKe6dWj75C8Sahh556`; authority `555o4r175YQ3tqkNwk8vEN3hAP9rF2QQPRBSXfyvq94g`; last deployed slot `462251543`; data length `166832`; balance `1.1623548 SOL`. | Declared by `sw4p/programs/sw4p-native/src/lib.rs`; configured in `sw4p/render.yaml`; allowed by `sw4p/kora/kora.toml` and `sw4p/sw4p-backend/kora.toml`; used as the mainnet Solana registry value in `sw4p/sw4p-backend/src/networks.rs`; env-overridable through `SW4P_NATIVE_PROGRAM_ID` in backend scripts and `cctp_burn.rs`. | Treat as canonical source identifier but not as an already-live mainnet deployment. WS1 can start after code consumers are made registry/env-driven; WS9 must include the mainnet Solana promotion. |
| Anchor legacy | `555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3` | Public mainnet-beta RPC returned `Unable to find the account 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3`. | Public devnet RPC returned `Unable to find the account 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3`. | Pre-WS1 audit found consumer references in the frontend bridge service, Kora configs, backend watcher rent reclaim, scripts, and tests. WP1.3-WP1.5 migrated those runtime/config references to the canonical native path; remaining direct references are audit/planning evidence only. | Consumer migration is complete, but program retirement is not part of WS1. Actual decommissioning remains gated on WP7.5 testnet cutover validation and WP9.3. |
| Devnet native reference | `HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf` | Not expected on mainnet. | Exists. ProgramData `8JsajWxVjQtrv6X6gFZpPJpRRKTEE5MPcuciUYPmk4px`; authority `555Tm1cfV52SrBQmnxXiHMUMrpci8miW3CkLP1Qbmtd7`; last deployed slot `452264710`; data length `169832`; balance `1.1832348 SOL`. | Hard-coded in `sw4p/sw4p-frontend/services/koraBridge.ts` as `SW4P_NATIVE_PROGRAM_ID`, but that constant is not used by the current transaction builder; used as testnet Solana registry value in `sw4p/sw4p-backend/src/networks.rs`, defaults in backend scripts, and native bridge docs/tests. | Keep as devnet/testnet evidence only. WS1 should remove frontend hard-coding and select the canonical Solana program through registry/env configuration. |

**Solana audit decision:** WS1 migration sequencing can start because the unknown is resolved. The migration must not assume a live mainnet Solana program exists today; it must consolidate consumers onto the canonical native program path, remove Anchor consumer references, and leave mainnet program deployment/promotion as an explicit WS9 gate.

**Anchor consumer migration:** complete for runtime consumers. The Anchor program is not decommissioned here. Retirement remains gated on WP7.5 testnet cutover validation and WP9.3.

## EVM Deployment / Live-Path Status

Commands run on 2026-05-15:

```bash
jq '.' sw4p/sw4p-backend/contracts/scripts/deployed_addresses.json
rg -n 'ZapNative|deploy_zap_native|ZapAndBridgeV4|ZapAndBridge_V2|ZapAndBridge_V3|ZAP_BRIDGE_V4|deployed_addresses|BridgeApp|zapWithPermit2|receiveMessage' sw4p/sw4p-backend sw4p/sw4p-frontend -g '!target' -g '!node_modules' -g '!artifacts'
cast code 0x15f8de526744c2b438db430d2e16c45b00eee0b0 --rpc-url https://mainnet.base.org | wc -c
cast code 0xe0fa3c274d90d415c26adbca06293d97215ad11f --rpc-url https://arb1.arbitrum.io/rpc | wc -c
cast code 0x224d7b22a99bd9890454ced9209e47470894e7df --rpc-url https://polygon-bor-rpc.publicnode.com | wc -c
cast code 0xe10453fda879e89576602551904e5aeb056b8ed8 --rpc-url https://ethereum-rpc.publicnode.com | wc -c
cast code 0xed174c115d7bfe00ccdbd596bf619a3cc0bd771c --rpc-url https://mainnet.base.org | wc -c
cast code 0x8464cee62cba2416c9ef7273ef926571bfda54cd --rpc-url https://arb1.arbitrum.io/rpc | wc -c
cast code 0x903a03b08ee430f5b3a853d045cc4e139cfc48fd --rpc-url https://polygon-bor-rpc.publicnode.com | wc -c
```

Byte-count interpretation: `cast code ... | wc -c` reports `3` for empty bytecode (`0x\n`) and a larger count for deployed bytecode.

| Contract generation | Chain | Artifact address | Bytecode present | Local references | Retirement / deletion gate |
|---|---|---|---|---|---|
| `ZapAndBridgeV4` | Base | `0x15f8de526744c2b438db430d2e16c45b00eee0b0` | Yes; byte count `15405` from `https://mainnet.base.org`. | `deployed_addresses.json` under `ZAP_BRIDGE_V4` and `ZapAndBridgeV4`; `deploy_v4_mainnet.rs`; `evm_swap.rs` reads `ZAP_BRIDGE_V4_BASE`; `evm_burn.rs` defaults active bridge version to V4 unless `ZAP_BRIDGE_ACTIVE_VERSION_BASE` opts legacy. | Keeper; canonical base. |
| `ZapAndBridgeV4` | Arbitrum | `0xe0fa3c274d90d415c26adbca06293d97215ad11f` | Yes; byte count `15405` from `https://arb1.arbitrum.io/rpc`. | `deployed_addresses.json`; V4 deploy scripts; `evm_swap.rs`; `evm_burn.rs` active-version gate. | Keeper; canonical base. |
| `ZapAndBridgeV4` | Polygon | `0x224d7b22a99bd9890454ced9209e47470894e7df` | Yes; byte count `15405` from `https://polygon-bor-rpc.publicnode.com`. | `deployed_addresses.json`; V4 deploy scripts; `evm_swap.rs`; `evm_burn.rs` active-version gate. | Keeper; canonical base. |
| `ZapAndBridgeV4` | Ethereum | Missing from artifact before Approach A | Not checked until deployed; no artifact address exists. | V4 deploy script supports mainnet reconciliation/deploy, but no Ethereum V4 artifact address is recorded. | Must deploy before V3/V2 Ethereum retirement. |
| `ZapAndBridgeV4` | Optimism | Missing from artifact before Approach A | Not checked until deployed; no artifact address exists. | V4 deploy script supports additional EVM chains, but no Optimism V4 artifact address is recorded. | Must deploy for six-chain Approach A coverage. |
| `ZapAndBridgeV4` | Avalanche | Missing from artifact before Approach A | Not checked until deployed; no artifact address exists. | V4 deploy script supports additional EVM chains, but no Avalanche V4 artifact address is recorded. | Must deploy for six-chain Approach A coverage. |
| `ZapAndBridge` / `ZapAndBridge_V2` | Ethereum | `0xe10453fda879e89576602551904e5aeb056b8ed8` | Yes; byte count `8307` from `https://ethereum-rpc.publicnode.com`. | `deployed_addresses.json`; `ZapAndBridge.sol`; legacy approval path in `evm_burn.rs`; active-version env can opt a chain to `legacy`. | Retire only after V4 Ethereum cutover. |
| `ZapAndBridge` / `ZapAndBridge_V2` | Base | `0xed174c115d7bfe00ccdbd596bf619a3cc0bd771c` | Yes; byte count `8307` from `https://mainnet.base.org`. | Same legacy contract lineage; V4 is also deployed on Base, so active-version/env determines runtime path where configured. | Retire after canonical V4 path is confirmed for the chain and no legacy env opt-in remains. |
| `ZapAndBridge` / `ZapAndBridge_V2` | Arbitrum | `0x8464cee62cba2416c9ef7273ef926571bfda54cd` | Yes; byte count `8307` from `https://arb1.arbitrum.io/rpc`. | Same legacy contract lineage; V4 is also deployed on Arbitrum, so active-version/env determines runtime path where configured. | Retire after canonical V4 path is confirmed for the chain and no legacy env opt-in remains. |
| `ZapAndBridge` / `ZapAndBridge_V2` | Polygon | `0x903a03b08ee430f5b3a853d045cc4e139cfc48fd` | Yes; byte count `8307` from `https://polygon-bor-rpc.publicnode.com`. | Same legacy contract lineage; V4 is also deployed on Polygon, so active-version/env determines runtime path where configured. | Retire after canonical V4 path is confirmed for the chain and no legacy env opt-in remains. |
| `ZapAndBridge_V3` | All EVM chains | `{}` in `deployed_addresses.json` | Not checked; no artifact address exists. | Local deploy/test references are mostly historical naming around `ZapAndBridge.sol`; no recorded V3 address map. | No independent V3 artifact retirement can be claimed without environment/deploy-host confirmation. |
| `ZapNative` | All EVM chains | `{}` in `deployed_addresses.json` | Not checked; no artifact address exists. | `sw4p-backend/src/main.rs` maps `sw4p-backend deploy` to `deploy_zap_native::deploy_zap_native_contracts()`; `src/bin/deploy_zap_native.rs`, `src/deploy_zap_native.rs`, and `contracts/scripts/deploy-zap-native.js` deploy it; `BridgeApp.tsx` and `BridgeAppSDK.tsx` define `ZAP_NATIVE_ABI`, though current native-token UI flow deposits to a WaaS address rather than calling that ABI. | Delete only after the deploy subcommand/module/scripts and stale frontend ABI constants are migrated or removed; do not delete as a zero-risk first action. |

**ZapNative deletion gate:** BLOCKED. The EVM deployment / live-path table above names active operational paths that still depend on `ZapNative`: the backend deploy subcommand/module/binary and stale frontend ABI constants. WP0.3 must not delete `ZapNative.sol` until those paths migrate to the canonical V4-derived contract or are deliberately removed as part of a reviewed deletion patch.

**EVM audit decision:** WS2 can start from V4 as the canonical base, but Approach A must deploy V4 to Ethereum, Optimism, and Avalanche before claiming six-chain coverage. Legacy `ZapAndBridge_V2` bytecode is real on four chains and must remain until active-version/env usage is audited on the deployment host and the canonical V4 path is verified for each chain.

## P-Token Activation Status

Source checks run on 2026-05-15:

- Solana upgrade page: `https://solana.com/it/upgrades/p-token`. The page says "Devnet Live Target Mainnet: May 2026", "Devnet Activation Completed", and lists `batch` as one of the added P-Token instructions.
- Anza feature-gate tracker: `https://github.com/anza-xyz/agave/wiki/Feature-Gate-Tracker-Schedule`. The page was edited 2026-05-14 and its pending mainnet/devnet/testnet activation tables do not list SIMD-0266 as pending.
- Direct cluster checks:

```bash
solana feature status --url https://api.mainnet-beta.solana.com | rg -i '0266|efficient|p-token|ptok|token'
solana feature status --url https://api.devnet.solana.com | rg -i '0266|efficient|p-token|ptok|token'
```

| Cluster | Source evidence | Direct cluster evidence | Approach-A mode |
|---|---|---|---|
| mainnet-beta | Solana page still frames mainnet as a May 2026 target; Anza pending-activation table does not list SIMD-0266 as pending. | `ptokFjwyJtrwCa9Kgo9xoDS59V4QccBGEaRFnRPnSdP | active since epoch 971 | 419472000 | SIMD-0266: Efficient Token program`. | `batch` active on checked target mainnet; retain fallback for any unchecked cluster. |
| devnet | Solana page says devnet activation completed; Anza pending-devnet table does not list SIMD-0266 as pending. | `ptokFjwyJtrwCa9Kgo9xoDS59V4QccBGEaRFnRPnSdP | active since epoch 1044 | 451008000 | SIMD-0266: Efficient Token program`. | `batch` active on checked devnet; use devnet to exercise batch-path tests. |

**Implementation decision:** Use P-Token `batch` on activated clusters; keep individual-CPI fallback on non-activated or unverified clusters. It is now acceptable to claim SIMD-0266 activation for public mainnet-beta and devnet as of this audit, but not for arbitrary local/test clusters without fresh feature evidence.

## EVM Safety-Control Scope

Commands run on 2026-05-15:

```bash
rg -n 'pause|paused|timelock|daily|limit|fee|signature|squads|multisig|admin|authority' sw4p/programs/sw4p-native/src sw4p/programs/sw4p-native/tests
rg -n 'pause|paused|Pausable|Ownable|AccessControl|timelock|daily|limit|cap|max|admin|owner|authority|fee' sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs
```

Current Solana control evidence:

- `sw4p/programs/sw4p-native/src/state.rs` stores `admin`, `backend_authority`, `paused`, `pause_authority`, `paused_at`, `PendingConfig`, and `UserDailyUsage`.
- `sw4p/programs/sw4p-native/src/lib.rs` defines `TIMELOCK_SECONDS = 86_400`, `DAILY_BRIDGE_LIMIT_USDC = 50_000_000_000`, `MIN_BRIDGE_AMOUNT = 5_000_000`, and `AUTO_UNPAUSE_SECONDS = 604_800`.
- `sw4p/programs/sw4p-native/src/processor.rs` verifies admin/pause-authority signers, blocks bridging while paused, auto-unpauses after the configured window, enforces the minimum amount and daily bridge limit, verifies the backend Ed25519 signature over the fee commitment, caps the platform fee at 10%, and proposes/executes config changes through the 24-hour timelock.
- `sw4p/programs/sw4p-native/tests/squads_integration.rs` covers admin migration to a vault PDA, pause-authority transfer through the timelock, pause/unpause through the authority model, and the timelock boundary.

Current V4 control evidence:

- `sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol` has immutable constructor wiring for Universal Router, Permit2, CCTP V2 TokenMessenger/MessageTransmitter, USDC, and WETH.
- V4 validates nonzero constructor addresses, nonzero outbound amounts, nonzero inbound recipients/tokens, CCTP V2 message shape, and net minted amount (`amount - feeExecuted`) before transferring or swapping inbound funds.
- V4 does **not** import or inherit `Ownable`, `AccessControl`, or `Pausable`; has no owner/admin field; has no pause/unpause functions; has no timelocked configuration path; has no daily/per-period movement limits; and has no platform-fee configuration or signature-gated fee take.

| Control | Solana canonical source | Present in V4 today | Required in canonical EVM contract | Verification required |
|---|---|---|---|---|
| Pause | `Config.paused`, `Config.pause_authority`, `process_pause`, `process_unpause`, bridge-time paused check, auto-unpause after `AUTO_UNPAUSE_SECONDS`. | No. V4 has no pause state, authority, or pause guard on value-moving functions. | Yes. Every value-moving outbound and inbound function must respect pause state. | Unit test: paused value movement reverts; unpaused value movement proceeds. |
| Daily / per-period movement limit | `UserDailyUsage`, `DAILY_BRIDGE_LIMIT_USDC`, and `process_bridge_to_evm` limit checks. | No. V4 has no per-user, per-chain, or global movement accounting. | Yes. At minimum, enforce a configurable per-period cap for value-moving outbound paths; if inbound routes are exposed through the contract, define whether inbound should count separately or share the cap. | Unit test: over-limit value movement reverts; reset behavior tested. |
| Timelocked config changes | `PendingConfig`, `ProposeConfigUpdate`, `ExecuteConfigUpdate`, and `TIMELOCK_SECONDS = 86_400`. | No. V4 is immutable and ownerless; no mutable config exists today. | Yes. Any mutable safety config, admin handoff, fee config, limit config, registry pointers, or pause-authority update must use a timelocked propose/execute flow. | Unit test: change cannot execute before delay, can execute after delay. |
| Admin authority / multisig handoff | `Config.admin`, `pause_authority`, signer checks compatible with Squads vault PDA, and Squads integration tests. | No. V4 has no admin/owner/multisig-controlled surface. | Yes. Use a governed admin model suitable for multisig ownership; separate emergency pause authority from slower config authority if possible. | Inspection: owner/admin set to governed address; tests cover only authorization. |
| Fee-take guardrails | Ed25519 backend signature over amount/fee/domain/recipient/maxFee/finality/nonce/expiry; `MIN_BRIDGE_AMOUNT`; platform-fee ceiling at 10%; fee transferred once to treasury. | Partial but insufficient. V4 forwards CCTP `maxFee` and parses `feeExecuted`; it does not implement platform-fee configuration, fee ceiling, fee signature, or fee transfer. | Yes. Canonical EVM must define fee config, max fee bounds, exact-once fee deduction, and whether fee authorization is signature-gated or admin-configured. | Unit test: invalid fee config reverts, valid fee deducted exactly once. |

**EVM safety-control decision:** WS2 must not ship the current V4 contract unchanged as the canonical EVM contract. The canonical V4-derived contract must add the safety-control surface above before six-chain deployment or audit handoff.
