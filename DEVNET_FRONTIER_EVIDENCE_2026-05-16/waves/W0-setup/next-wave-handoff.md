# W0 to W1 Handoff

**Date:** 2026-05-17T06:36:07Z
**Status of W0:** partial (probes complete; baseline deferred BLOCKED).

## Cycle-gating blocker (must resolve before W1 starts)

**sw4p-backend HTTP API not reachable.** Gates W1 through W8 ZERO-MOCKS acceptance.

Detail and unblock criteria: `phase-5-baseline-deferred.md`.

Three unblock paths (any one resolves):
1. Restore sw4p-backend on AWS EKS staging (re-run deploy/aws/scripts/deploy-staging.sh; verify via bastion kubectl).
2. Restore sw4p-backend on Railway and re-bind api.sw4p.io.
3. Provision SW4P_API_KEY against whichever restored backend.

W1 plan cannot be authored productively until this blocker is at least scoped: the W1 plan-writer needs to know which deployment target to write deploy + canary commands against.

## Decisions locked

| Decision | Value | Source evidence |
|---|---|---|
| W1 Tier 1 (canonical V4.1 testnet acceptance) | Ethereum Sepolia, Base Sepolia | `probes/uniswap-deploy-addresses.md` |
| W1 Tier 2 (real CCTP-only proof) | Avalanche Fuji, Polygon Amoy | same |
| W1 Tier 3 (mainnet-fork compat) | Arbitrum Sepolia, Optimism Sepolia, Avalanche mainnet, Polygon mainnet | same; spec divergence flagged |
| W2 Phase 2 path | B2 (defer live Allbridge tx) | `probes/allbridge-discovery.md` |
| Kora retirement candidacy | DEFERRED | `probes/circle-gas-sponsor.md`, `circle-sponsor-deferral.md` |
| sw4p.io AWS / Cloudflare state | PASS (already on AWS; no cutover) | `probes/aws-landing.md`, `phase-3-no-cutover-summary.md` |
| Allbridge multi-transport corridors | Adapter must handle 5 transport modes per corridor | `probes/allbridge-discovery.md` |

## Spec amendments recommended

- **Cycle spec W1 tier roster:** extend "R3 escape hatch" language to cover Arbitrum Sepolia identically to Optimism Sepolia. Spec line 178 currently lists Arb Sepolia as Tier 1 default without conditional; reality drops it to Tier 3.

## Carried env-var corrections (Task 1.6 finding)

The W0 plan listed env var names that diverged from actual sw4p env files. The actual names:
- `CIRCLE_WAAS_API_KEY` (plan said CIRCLE_SCP_API_KEY)
- `CIRCLE_WAAS_ENTITY_SECRET_RAW` (plan said CIRCLE_SCP_ENTITY_SECRET)
- `IRIS_API_URL` (plan said IRIS_BASE_URL_TESTNET)
- `CIRCLE_TEST_API_KEY`, `CIRCLE_LIVE_API_KEY` (testnet/mainnet split)

These corrections should propagate into the W1 plan's env-var verification list.

## Inputs to the W1 plan writer

Once backend is unblocked, the W1 plan can lock in:
- Concrete Tier 1 chain rosters with Universal Router + Permit2 addresses (sourced from Uniswap deploy-addresses commit SHA `050b93cf4e9508b78412f23ad66e85d5c76a45b5`).
- CCTP V2 contract addresses (universal across testnets: TokenMessengerV2 `0x8FE6B999...`, MessageTransmitterV2 `0xE737e5cE...`).
- Solana CCTP V2 program IDs (TokenMessengerMinterV2 `CCTPV2vP...`, MessageTransmitterV2 `CCTPV2Sm...`).
- W1 safety-control surface scope (pause, period limit, timelock, governed admin, fee guardrails) per the EVM Safety-Control Scope table in `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`.
- W1.b separate sourcing of Permit2 addresses (not in Universal Router registry).

## Action items required from user before W1 starts

1. **Decide unblock path** for sw4p-backend (AWS / Railway / both).
2. **Authorize** the corresponding deploy run (`deploy-staging.sh` or `railway up`) and provide credentials (Railway token, AWS bastion access, or operator runbook).
3. **Mint and provide** `SW4P_API_KEY` to populate in `sw4p-kit-devnet-frontier-2026-05-16/.env`.

Once these are addressed, W0 Tasks 5.2 + 5.3 can resume against the real backend, and the W1 plan can be authored.

## W0 evidence locations (all paths absolute)

- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/README.md` (Critical blockers section)
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/acceptance.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/prs.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/commands.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/next-wave-handoff.md` (this file)
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/phase-3-no-cutover-summary.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/phase-5-baseline-deferred.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-sponsor-deferral.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-cctp-v2.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/uniswap-deploy-addresses.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/cloudflare-dns.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/aws-landing.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-gas-sponsor.md`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/protocol-endpoint-discovery.md`
