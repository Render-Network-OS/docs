# W1 Acceptance

**Date:** 2026-05-17
**Cycle:** sw4p devnet-frontier 2026-05-16
**Wave verdict:** PARTIAL (Tier 1 deploy + safety-control gates PASS on both chains; Phase E Tier 2 ABI-surface + USDC approve PASS on both chains; Tier 1 CCTP RT + Tier 2 burn-mint round-trip DEFERRED_PENDING_USDC_FAUCET)

| Gate | Plan task | Evidence link | Result |
|---|---|---|---|
| Worktree on `staging/devnet-frontier-2026-05-16` | (W0.1) | sw4p worktree HEAD on dated branch | PASS |
| V4.1 + Sw4pV4Controls coverage (5 controls mapped Solana to EVM) | A.1 | `phase-a-control-coverage.md` | PASS (49 + 25 unit tests + 7 fork it-blocks, real Hardhat runs) |
| Tier 1 constructor preconditions captured per chain | A.2 | `phase-a-control-coverage.md` Section 4 | PASS (Sepolia + Base Sepolia 6 chain-dep addresses verified) |
| Permit2 per-chain verification (canonical CREATE2 18,304 bytes) | B.1 | `phase-b-permit2-sourcing.md` | PASS (6 chains: Sepolia, Base Sepolia, Arb Sepolia, Op Sepolia, Fuji, Amoy) |
| Per-chain registry consolidation (tier1.json + tier2.json + tier3-mainnet-fork.json) | B.2 | sw4p commits `0dc8ee42` + `a062f780` | PASS (Base Sepolia Universal Router drift resolved to canonical `0x95273d871c8156636e114b63797d78D7E1720d81`) |
| `deploy_testnet.cjs` reads `tier1.json` | B.3 | sw4p commit `fef2ad7f` | PASS (11 resolution tests) |
| Tier 1 Sepolia V4.1 deploy via Circle SCP + Gas Station | C.2 | `phase-c-tier1-scp-deploys.md` | PASS (contract `0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665`, tx `0x6c68bd21311b4562e6137724542a261bef30840fd23528a065b9cc0ed12d77aa`, SCA balance stayed 0x0) |
| Tier 1 Base Sepolia V4.1 deploy via Circle SCP + Gas Station | C.3 | `phase-c-tier1-scp-deploys.md` | PASS (contract `0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed`, tx `0x48e137534ce6c032a23528817a4b9d04877ca9343376fc7e70af392df9b33e87`, SCA balance stayed 0x0) |
| Tier 1 pause + unpause (Sepolia) | D.1 | `phase-d-tier1-acceptance.md` | PASS (pause `0x169f3df4...`, unpause `0xba16e129...`) |
| Tier 1 pause + unpause (Base Sepolia) | D.1 | `phase-d-tier1-acceptance.md` | PASS (pause `0xa9d57379...`, unpause `0xf9678649...`) |
| Tier 1 direct `grantRole` reverts `MustGoThroughTimelock()` (Sepolia) | D.2 | `phase-d-tier1-acceptance.md` | PASS (SCP `507b3042-...`, eth_call confirms selector `0xe99beb96`) |
| Tier 1 direct `grantRole` reverts `MustGoThroughTimelock()` (Base Sepolia) | D.2 | `phase-d-tier1-acceptance.md` | PASS (SCP `8ac7c3d5-...`, eth_call confirms selector `0xe99beb96`) |
| Tier 1 propose + early-execute reverts `TimelockPending` (Sepolia) | D.3 | `phase-d-tier1-acceptance.md` | PASS (propose `0xd3341a11...`, exec early reverts `0xa80691a5` with remainingSeconds 86316) |
| Tier 1 propose + early-execute reverts `TimelockPending` (Base Sepolia) | D.3 | `phase-d-tier1-acceptance.md` | PASS (propose `0x5feee859...`, exec early reverts `0xa80691a5` with remainingSeconds 86342) |
| Tier 1 CCTP V2 zap-and-bridge round-trip | D.4 / D.5 | `phase-d-tier1-acceptance.md` Gate 4 | DEFERRED_PENDING_USDC_FAUCET (SCA holds 0 USDC on both chains) |
| Tier 2 CCTP V2 structural readiness (TM V2 + MT V2 + USDC bytecode) on Fuji + Amoy | E.2 / E.3 | `phase-e-tier2-cctp-only.md` | PASS (4350 + 4350 + 3704/3596 bytes per chain) |
| Tier 2 `USDC.approve(TokenMessengerV2, 1 USDC)` on Fuji | E.2 | `phase-e-tier2-cctp-only.md` Gate A | PASS (SCP `43e8e32c-...`, tx `0x9a5aea2d...`, allowance post-state = 1.0 USDC) |
| Tier 2 `USDC.approve(TokenMessengerV2, 1 USDC)` on Amoy | E.3 | `phase-e-tier2-cctp-only.md` Gate A | PASS (SCP `72a53fb4-...`, tx `0x4d5ba05c...`, allowance post-state = 1.0 USDC) |
| Tier 2 `TokenMessengerV2.depositForBurn` ABI reachability from SCA on Fuji | E.2 | `phase-e-tier2-cctp-only.md` Gate B | PASS (SCP `f40ad2a1-...` reverts `ERC20: transfer amount exceeds balance` at simulator, proves wiring) |
| Tier 2 `TokenMessengerV2.depositForBurn` ABI reachability from SCA on Amoy | E.3 | `phase-e-tier2-cctp-only.md` Gate B | PASS (SCP `845c5ee4-...` reverts same way, proves wiring) |
| Tier 2 on-chain burn + `MessageSent` emission on Fuji | E.2 | `phase-e-tier2-cctp-only.md` Gate C | DEFERRED_PENDING_USDC_FAUCET (SCA holds 0 USDC) |
| Tier 2 on-chain burn + `MessageSent` emission on Amoy | E.3 | `phase-e-tier2-cctp-only.md` Gate C | DEFERRED_PENDING_USDC_FAUCET (SCA holds 0 USDC) |
| Tier 2 Iris attestation + Sepolia `receiveMessage` mint | E.2 / E.3 | `phase-e-tier2-cctp-only.md` Gate C | DEFERRED_PENDING_USDC_FAUCET |
| Tier 3 AVAX mainnet-fork compat | F.1 | `phase-f-mainnet-fork-compat.md` | PASS (5 fork tests, block 85654647) |
| Tier 3 Polygon mainnet-fork compat | F.1 | `phase-f-mainnet-fork-compat.md` | PASS (5 fork tests, block 87012069) |

## ZERO-MOCKS check

No mock fixtures cited above. Per-gate citations:

- Phase A: real Hardhat unit-test runs (49 + 25 = 74 it-blocks PASS on `Sw4pV4Controls.test.cjs` + `ZapAndBridgeV41.test.cjs`); BASE-only fork suite 7 it-blocks PASS against live state.
- Phase B: real `eth_getCode` probes against six public RPCs, all returning identical 18,304-char bytecode at the canonical CREATE2 Permit2 address.
- Phase C: real Circle SCP deploys (`POST /v1/w3s/contracts/deploy`), real on-chain bytecode verified via `eth_getCode` (38,784 chars), real Etherscan + Basescan HTTP 200 responses, real `eth_getBalance` reads showing SCA balance stayed `0x0` end-to-end.
- Phase D: real Circle SCP `contractExecution` calls (6 CONFIRMED + 4 FAILED-at-estimation), real receipt-log decoders verifying `Paused` / `Unpaused` / `SafetyConfigProposed` event topics, independent `eth_call` revert-data decoding confirming `MustGoThroughTimelock()` (`0xe99beb96`) and `TimelockPending(uint64)` (`0xa80691a5`) custom-error selectors.
- Phase E: real `eth_getCode` probes for TokenMessengerV2 + MessageTransmitterV2 + USDC on Fuji + Amoy (4350 + 4350 + 3704/3596 bytes); real SCP `contractExecution` approves CONFIRMED on both chains; real `eth_call allowance(SCA, TM V2)` post-state reads decode to exactly `1000000` (1.0 USDC) on both chains; real SCP burn simulations reverted with decoded `Error("ERC20: transfer amount exceeds balance")` payload from the canonical USDC ERC-20.
- Phase F: block-pinned Hardhat-fork CI runs (pinned blocks 85654647 / 87012069) against real upstream mainnet state; `bytecode parity`, `chain id assertion`, `constructor parity`, `safety controls`, `USDC whale parity` tests pass against live Universal Router + Permit2 + CCTP V2 + native USDC + wrapped-native bytecode on both chains.

The DEFERRED entries (CCTP RT + Tier 2 burns) are honest about the USDC-funding prerequisite; no synthetic burn tx or attestation cited.

## Real-action authorizations exercised

- W0.d baseline round-trip auth (carry-over from W0; not consumed this wave; backend health blocker persists).
- Phase C Tier 1 funded deploys (deployer SCA native balance stayed `0x0` before, during, and after; Gas Station paymaster sponsored both userOps end-to-end).
- Phase D Tier 1 acceptance txs (8 SCP submissions total: 6 on-chain CONFIRMED, 2 reverted at estimation; all sponsored).
- Phase E Tier 2 approves (2 CONFIRMED on-chain on Fuji + Amoy) and burn simulations (2 FAILED-at-estimation; no native consumed). All four sponsored by Gas Station.

## W1 wave verdict

**Partial PASS.** Real V4.1 canonical EVM deployed and verified on both Tier 1 testnets (Sepolia + Base Sepolia) via Circle SCP + Gas Station, with three of four contract-level acceptance gates PASS per chain (pause + unpause, direct grantRole rejection, propose + early-execute revert). Tier 2 CCTP-only proof (Fuji + Amoy) landed structural readiness + USDC approve + `depositForBurn` ABI-reachability gates as PASS on both chains, with the SCA holding a `1.0 USDC` allowance on the canonical `TokenMessengerV2` and the Circle SCP userOp simulator reaching the burn function and reverting with the decoded `ERC20: transfer amount exceeds balance` error (positive wiring proof). The remaining `DEFERRED_PENDING_USDC_FAUCET` items are the Tier 1 CCTP V2 zap-and-bridge round-trip and the Tier 2 on-chain burn + `MessageSent` + Iris attestation + Sepolia `receiveMessage` mint. A single Circle faucet claim to `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` on Sepolia + Base Sepolia + Fuji + Amoy unblocks all four items in a follow-up Phase D' / E' session without redoing any code work. Tier 3 mainnet-fork compat is complete on AVAX + Polygon (5 + 5 tests against block-pinned live state). W1 ships as partial-PASS; the deferred items are scoped to a faucet-claim follow-up.
