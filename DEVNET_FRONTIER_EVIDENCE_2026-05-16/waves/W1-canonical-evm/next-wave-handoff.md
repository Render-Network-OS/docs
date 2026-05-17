# W1 to W2 Handoff

**Date:** 2026-05-17
**Status of W1:** partial PASS (Tier 1 deploys + safety-control acceptance landed; CCTP RT + Tier 2 burns deferred; Tier 3 mainnet-fork compat complete).

## W1 wave outcome

All canonical-EVM control + deploy + acceptance gates pass on real Tier 1 testnets via Circle SCP + Gas Station, with the SCA deployer's native balance staying at `0x0` end-to-end (Gas Station paymaster sponsored every userOp). Tier 2 CCTP-only structural readiness + USDC approve + `depositForBurn` ABI-reachability gates pass on both Fuji + Amoy (SCA holds a positive `1.0 USDC` allowance on the canonical `TokenMessengerV2`; the SCP simulator reaches the burn function and reverts with the decoded ERC-20 balance error, proving wiring). The remaining deferred items (Tier 1 CCTP V2 round-trip + Tier 2 on-chain burn + Iris attestation + Sepolia receive) all unblock on a single Circle USDC faucet claim to the shared SCA address `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` on four chains (Sepolia, Base Sepolia, Fuji, Amoy). Tier 3 mainnet-fork compat (AVAX + Polygon) is complete with 5 + 5 fork tests against block-pinned live state.

## Decisions locked for W2

| Decision | Value | Source |
|---|---|---|
| Allbridge live-route path (W2.b) | B2 (defer live Allbridge tx) | `waves/W0-setup/next-wave-handoff.md` |
| sw4p-backend HTTP health | BLOCKED on build push (still open from W0.d) | `waves/W0-setup/phase-5-baseline-deferred.md` |
| Circle SCA wallets | LIVE on 6 EVM + 1 Solana, all sharing counterfactual `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` on EVM | `waves/W0-setup/circle-wallet-sca-addendum.md` |
| Gas Station sponsorship for EVM SCA wallets | CONFIRMED (zero SCA balance debit across 10+ Phase C + D txs) | `phase-c-tier1-scp-deploys.md`, `phase-d-tier1-acceptance.md` |
| Tier 1 V4.1 addresses | Sepolia `0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665`, Base Sepolia `0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed` | `phase-c-tier1-scp-deploys.md` |
| Tier 1 admin / pauser / treasury at init | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` (SCA) per chain | `phase-c-tier1-scp-deploys.md` constructor table |
| Tier 1 `defaultAdminDelay_` | `86400` (1 day, matches Solana TIMELOCK_SECONDS and OZ default-admin transfer delay) | `phase-c-tier1-scp-deploys.md` |
| Tier 2 CCTP V2 stack | TokenMessengerV2 `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` + MessageTransmitterV2 `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` live on Fuji + Amoy | `waves/W0-setup/probes/circle-cctp-v2.md`, `phase-a-control-coverage.md` |
| Permit2 canonical CREATE2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3`, 18304 bytes on all 6 W1 chains | `phase-b-permit2-sourcing.md` |
| AWS landing | already serving from EKS; no cutover needed | `waves/W0-setup/phase-3-no-cutover-summary.md` |
| Kora retirement | DEFERRED (reopens once SCA wallets sponsor Solana too) | `waves/W0-setup/circle-sponsor-deferral.md` |

## Open items carried into W2

1. **Backend restoration (cycle-level blocker).** sw4p-backend HTTP API still unreachable. Required for W2 rail-consolidation observability + sdk-bridge endpoints. Build-push retry needed (Docker Desktop / BuildKit cache flow). Three unblock paths still apply: AWS EKS re-deploy, Railway re-bind, or direct API-key provision against a restored backend.
2. **USDC faucet to SCA (unblocks D.4 + E.C on both Tier 2 chains).** Claim 10 USDC at `https://faucet.circle.com` to `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` on Sepolia, Base Sepolia, Fuji, Amoy. Unblocks Phase D Tier 1 CCTP RT and Phase E Gate C (Tier 2 on-chain burn + Iris attestation + Sepolia receive). Single off-chain ask, no code work. Note: the programmatic faucet `POST /v1/faucet/drips` returned Cloudflare `error code: 1015` (rate-limit) on Phase E attempts; the user-facing faucet UI is the operational path.
3. **Phase D' / E' execution (W1 follow-up).** With USDC funded, a follow-up session can run the Tier 1 CCTP V2 round-trip (D.4 / D.5) and the Tier 2 Fuji + Amoy burn-mint round-trip (E.C) from the same SCA via Circle SCP. The Tier 2 allowance state is already `1.0 USDC` pre-approved on both chains (Phase E Gate A residual), so no additional approve is needed. Recipe is in `commands.md` Phase E + Phase D.
4. **W2 plan not yet authored.** Inputs are ready: Allbridge production endpoint discovery + multi-transport corridor caveat (from W0 evidence), BridgeProtocol enum cleanup scope (cycle spec W2.b), localnet Allbridge blocker (parent commit `d54da0c6`, status now closed per `020b55bd docs(audits): localnet Track A1 blocker d54da0c6 closed`).

## Spec amendments surfaced in W1

- **W1.b registry-drift correction.** W0 `probes/uniswap-deploy-addresses.md` recorded Base Sepolia Universal Router as `0x95273d871c8156636e114b63797d78D7E1720d81` (canonical). `sw4p-backend/contracts/registry/testnet.json` had `0x492E6456...` before W1.b. The B.2 commit set (`0dc8ee42` + downstream) consolidates the canonical value into `tier1.json` and uses it in the constructor at deploy time. No cycle-spec text edit needed.
- **Permit2 sourcing.** W0 `probes/uniswap-deploy-addresses.md` did not carry Permit2 (Uniswap registry schema omits it). W1.b adds `sw4p-backend/contracts/registry/permit2.json` sourced from the Uniswap/permit2 README + per-chain `eth_getCode` confirmation. No spec edit needed; B.1 commit covers.
- **V4.1 has no pure `cctpBurn(amount, dest, recipient)` shortcut.** Phase D evidence flagged that all V4.1 outbound entry points (`zapEthAndBridge`, `zapWithPermit2`) require either native ETH or a Permit2 signature plus the input token. A "have-USDC, just-bridge" flow would call `TokenMessengerV2.depositForBurn` directly via SCP, bypassing V4.1. Phase E confirmed this SCP-direct path is functional on both Tier 2 chains. Not a blocker; W2 or later cycle can decide whether to add a thin V4.1 bridge-only path or leave the SCP-direct path as the documented "just-bridge" flow.
- **CCTP V2 `depositForBurn` ABI shape confirmed.** Phase E used the 7-param form (`uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold`) end-to-end on Fuji + Amoy. The SCP simulator reached the burn function on both chains and reverted only at the USDC balance check; no ABI mismatch. W2 plan-writer can rely on this 7-param shape across CCTP V2 testnets.
- **Arbitrum Sepolia tier classification.** W0 handoff noted spec line 178 lists Arb Sepolia as a Tier 1 default; W1 plan dropped it to Tier 3 (mainnet-fork compat) per the W0 probe finding. W1 execution honored Tier 3; W2 should treat Arb Sepolia + Op Sepolia as Tier 3 fork-only and not over-promise Tier 1 deploys there.

## Inputs to the W2 plan writer

- **Allbridge production endpoint + chain map:** `waves/W0-setup/probes/allbridge-discovery.md`. Core REST API at `https://core.api.allbridgecoreapi.net/token-info`; multi-transport corridor types in `bridgeAddress`, `cctpAddress`, `cctpV2Address`, `oftBridgeAddress`, `xReserve.bridgeAddress`.
- **BridgeProtocol enum location:** `sw4p-backend/src/bridge_protocol.rs` (cycle spec W2.b).
- **Existing Allbridge integration:** `sw4p-backend/src/allbridge.rs` (already wired into sw4p-backend; localnet harness referenced in `bb68593 ops(sw4p): add tron allbridge proof harness` and `78c2e71 fix(sw4p-backend): persist allbridge tracking state`).
- **localnet Allbridge blocker:** tracked in worktree commit `d54da0c6 docs(sw4p): record localnet allbridge blocker`; closed per parent commit `020b55bd docs(audits): localnet Track A1 blocker d54da0c6 closed (env-var migration)`.
- **Allbridge explicit-rail decision:** parent commit `e209073c feat(sw4p): record bridge protocol enum consolidation` plus `adb277f6 feat(sw4p): record allbridge explicit rail checkpoint` already record the W2 path.
- **Circle sponsor frontier carry-over:** parent commit `4a34c30a docs(sw4p): record Circle sponsor frontier update` plus `ff2091ff chore(sw4p): record frontier evm testnet dry runs` are the most recent state-of-the-world entries the W2 plan-writer should read.

## W1 evidence locations (all paths absolute)

- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/acceptance.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/prs.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/commands.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/next-wave-handoff.md` (this file)
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/preflight-funding.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-a-control-coverage.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-b-permit2-sourcing.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-c-tier1-scp-deploys.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-d-tier1-acceptance.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-e-tier2-cctp-only.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-f-mainnet-fork-compat.md`
