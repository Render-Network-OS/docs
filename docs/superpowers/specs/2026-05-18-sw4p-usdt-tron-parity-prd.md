# sw4p USDT / Tron Stablecoin Parity PRD

**Status:** Product requirements - review gate.
**Date:** 2026-05-18.
**Owner:** sw4p Frontier Engine corpus.
**Scope:** USDT support parity across EVM, Solana, and Tron. BTC is explicitly out of scope for USDT parity.
**Companion docs:** `2026-05-18-sw4p-usdt-tron-parity-crd.md`, `2026-05-18-sw4p-usdt-tron-parity-sow.md`.

---

## 1. Executive Summary

sw4p already has meaningful Tron and USDT code, but it does not yet meet the product bar implied by the canonical RNDRNTWRK story. The product claim is not simply "Tron exists in the enum." The product claim is: users, agents, and operators can move supported stablecoin value across EVM, Solana, and Tron with the same clarity, safety, observability, and no-native-gas posture that the USDC/CCTP path is designed to provide.

This PRD establishes USDT / Tron parity as a dedicated product track. It does not replace Frontier Engine Approach A; it corrects and sharpens Approach A's Allbridge/Tron row. The day-one USDC path remains CCTP V2 across EVM and Solana. The USDT path is Allbridge Core across the Allbridge-supported EVM, Solana, and Tron corridors. Bitcoin/Omni USDT is excluded because Tether's official supported-protocol page marks Omni as deprecated legacy support, not a current issuance/redemption path.

The required product outcome is a route surface that is honest: every displayed route is executable, every gated route says why it is gated, and every proof claim points at real provider support, real chain data, or an explicitly authorized mainnet proof transaction.

## 2. Problem Statement

The corpus currently talks about sw4p as a cross-chain settlement engine with USDT corridor support including Tron. That is directionally correct, but incomplete. Local code and docs show three realities that must be reconciled before we claim parity:

1. The backend has Tron/Allbridge code, but not every advertised route is executable.
2. The frontend and kit contain Tron/USDT surface area, but not full Tron execution parity.
3. Allbridge Core has no public hosted testnet corridor, so the normal devnet/testnet acceptance model does not apply to Tron/USDT.

Without this PRD, future agents will keep cycling between two bad outcomes: overclaiming Tron parity because code exists, or deleting/deprioritizing Tron because the proof corridor is hard. The correct posture is a third path: keep Tron/USDT as a first-class requirement, but gate public support on corridor-specific proof and product safety.

## 3. Goals

### G1. Product parity for supported stablecoin movement

Users and agents must understand USDC and USDT as supported stablecoin assets with distinct rails and route eligibility.

### G2. Tron as a first-class USDT chain

Tron must not be treated as an afterthought, fallback, or disabled marketing badge. When enabled, Tron must support explicit route discovery, wallet connection, address validation, fee explanation, signing, submission, tracking, and recovery.

### G3. No false route availability

If a route cannot execute, the product must return a visible unsupported or gated state. It must not silently fall back to CCTP, pretend a testnet exists, or show a button that cannot produce a real transaction.

### G4. Honest evidence standard

USDT/Tron acceptance must be based on one of:

- a provider-confirmed non-production Allbridge corridor,
- a real mainnet Allbridge micro-transfer explicitly authorized by the user,
- live Allbridge API discovery plus route-gated code where no transaction proof is authorized.

Mocks, local-only Allbridge simulations, or inferred testnet addresses do not count as product acceptance.

### G5. BTC exclusion is explicit

Bitcoin/Omni USDT is not in scope. BTC can remain a preview or future settlement concept elsewhere, but it is not part of USDT issuer-supported parity for this track.

## 4. Non-Goals

- No BTC/Omni USDT integration.
- No new bridge rail beyond CCTP V2 and Allbridge Core.
- No public claim that Allbridge has a public testnet corridor unless provider documentation or direct provider confirmation proves it.
- No mainnet transfer without explicit per-action authorization.
- No replacement of V4.1 EVM contracts or Circle SCP deployment policy.
- No NTT/555 token mobility work. That remains Phase H, a separate track.
- No fiat settlement work.

## 5. Users and Use Cases

### User U1. Creator or earner receiving settlement

A creator wants to receive value on the chain they actually use. If they prefer Tron USDT, sw4p must clearly show whether that route is enabled, what asset they will receive, what fees apply, and how long it may take.

### User U2. EVM user moving USDT to Tron

An EVM user with USDT on Ethereum, Arbitrum, Polygon, Avalanche, Optimism, or Unichain wants to settle to Tron USDT without manually using an external bridge interface.

### User U3. Solana user moving USDT to Tron or EVM

A Solana user with SPL USDT wants the same route clarity and transaction tracking. This is a known gap because local `allbridge.rs` currently returns a not-implemented error for Solana to Tron.

### User U4. Agent using `@sw4p/kit`

An agent must be able to ask for balances, estimate routes, and initiate supported settlements without hardcoded USDC-only assumptions. Unsupported Tron routes must be machine-readable.

### User U5. Operator

An operator needs a clean route matrix, proof state, secrets model, canary plan, and rollback posture for every USDT corridor that is enabled.

## 6. Product Requirements

| ID | Priority | Requirement |
|---|---|---|
| PRD-USDT-001 | MUST | The product must distinguish stablecoin asset from chain. USDC and USDT are separate route assets, not display aliases. |
| PRD-USDT-002 | MUST | The product must support USDT as a first-class asset in route discovery, quote display, fee display, status tracking, and agent output. |
| PRD-USDT-003 | MUST | Tron support must be gated until a route has executable evidence or an explicit provider/mainnet proof decision. |
| PRD-USDT-004 | MUST | Tron destination routes must display TRC20 USDT as the received asset. |
| PRD-USDT-005 | MUST | Tron source routes must require a real Tron wallet/signing path or a consciously approved relayer/custody model. |
| PRD-USDT-006 | MUST | The UI and SDK must never show a Tron/USDT route as live if the backend would return `Solana to Tron bridging not yet implemented` or equivalent. |
| PRD-USDT-007 | MUST | Route selection must be explicit: USDC CCTP V2 routes use CCTP V2, USDT/Tron routes use Allbridge Core, and unsupported crossovers fail visibly. |
| PRD-USDT-008 | MUST | The product must explain Tron fees in terms of TRX, Energy, and Bandwidth where the user is exposed to Tron signing. |
| PRD-USDT-009 | MUST | The agent surface must return machine-readable unsupported/gated reasons for Tron and USDT routes. |
| PRD-USDT-010 | MUST | BTC/Omni USDT must not appear as a supported route, settlement chain, or hidden bridge target. |
| PRD-USDT-011 | SHOULD | Where Allbridge can provide destination gas top-up, the product should expose it as an explicit option, not an implicit promise. |
| PRD-USDT-012 | SHOULD | The product should prefer provider-generated raw transactions or SDK calls over hand-maintained ABI encodings for Allbridge operations. |
| PRD-USDT-013 | SHOULD | The route UI should show source asset, destination asset, rail, estimated received amount, fees, proof status, and expected completion time before signing. |
| PRD-USDT-014 | MAY | A small mainnet canary route can be used for acceptance if and only if explicitly authorized by the user for a named source, destination, amount, and wallet. |

## 7. Current Product Surface Inventory

| Surface | Current state | Product verdict |
|---|---|---|
| Backend Tron client | `sw4p-backend/src/tron_client.rs` supports Tron RPC, TRC20 USDT balance, signing, broadcast. | Useful foundation, but private-key based signing is not product parity by itself. |
| Backend Allbridge adapter | `sw4p-backend/src/allbridge.rs` supports Allbridge chain enum and several EVM/Tron paths. | Real scaffold, but incomplete and partially stale. |
| Route selector | Chooses Allbridge for USDT or Tron. | Directionally right, but can over-advertise unsupported execution. |
| Solana to Tron | Explicitly not implemented in `bridge_to_tron_from_solana`. | P0 parity gap. |
| Frontend TronLink | Wallet connection exists. | Connection is not execution parity. |
| Frontend settlement config | Tron exists but gated. | Correct posture until proof gates close. |
| `useBridge` hook | Bridge factory supports only `EVM` and `SOL`. | Tron source cannot execute through this hook today. |
| `@sw4p/kit` | Asset type mentions USDT, but chain schemas and agent tools are mostly base/solana/USDC. | Agent parity gap. |
| Ops docs | Existing docs state no canonical non-production Tron proof corridor. | Correct and must remain authoritative until provider proof exists. |

## 8. Product Route Matrix

| Source | Destination | Asset | Rail | Product state |
|---|---|---|---|---|
| EVM CCTP chain | EVM CCTP chain | USDC | CCTP V2 | Existing Frontier path. |
| EVM CCTP chain | Solana | USDC | CCTP V2 | Existing Frontier path. |
| Solana | EVM CCTP chain | USDC | CCTP V2 | Existing Frontier path. |
| Tron | EVM Allbridge USDT chain | USDT | Allbridge Core | Required, gated on signing/custody and proof. |
| EVM Allbridge USDT chain | Tron | USDT | Allbridge Core | Required, gated on proof and operational wallet model. |
| Solana | Tron | USDT | Allbridge Core | Required for parity, currently not implemented. |
| Tron | Solana | USDT | Allbridge Core | Required for parity, needs proof and signing model. |
| Base | Tron | USDT | Allbridge Core | Not available as Base USDT in live Allbridge token-info as of 2026-05-18. Must be gated or converted through an explicit route. |
| BTC/Omni | Any | USDT | None | Out of scope. |

## 9. Evidence and Sources

Primary external sources used by this PRD:

- Tether supported protocols: https://tether.to/en/supported-protocols/
- Tether legacy blockchain transition update: https://tether.io/news/tether-provides-update-on-transition-plan-for-legacy-blockchains/
- Allbridge Core overview: https://docs-core.allbridge.io/
- Allbridge Core REST API: https://docs-core.allbridge.io/sdk/allbridge-core-rest-api
- TRON TRC20 protocol interface: https://developers.tron.network/docs/trc20-protocol-interface
- TRON transaction fees: https://developers.tron.network/docs/tron-protocol-transaction

Local sources:

- `sw4p/sw4p-backend/src/tron_client.rs`
- `sw4p/sw4p-backend/src/allbridge.rs`
- `sw4p/sw4p-backend/src/route_selector.rs`
- `sw4p/sw4p-backend/src/native_bridge.rs`
- `sw4p/sw4p-frontend/src/WalletProvider.tsx`
- `sw4p/sw4p-frontend/src/config/settlementChains.ts`
- `sw4p/sw4p-frontend/hooks/useBridge.ts`
- `sw4p-kit/src/core/intent.ts`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md`
- `sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md`
- `sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md`

## 10. Acceptance Criteria

The product track is done only when all of the following are true:

1. A route matrix is generated from live Allbridge token-info plus canonical CCTP registry data, not hardcoded route optimism.
2. Every displayed USDT route has a rail, asset, proof state, and unsupported reason where applicable.
3. TronLink or an approved Tron signing/custody model can produce a real source transaction for enabled Tron source routes.
4. Solana to Tron no longer returns a not-implemented error for a route marked live.
5. `@sw4p/kit` can represent USDT and Tron in balance, estimate, send, and unsupported-route outputs.
6. Allbridge lifecycle tracking has durable DB state and recovery behavior aligned to the Frontier 3-phase discipline.
7. The non-production proof limitation is explicitly documented. If no provider-confirmed non-production corridor exists, the acceptance mode is live API discovery plus explicitly authorized mainnet canary or gated deferral.
8. BTC/Omni USDT is absent from supported surfaces.

## 11. Recommended Product Decision

Approve a dedicated USDT / Tron Stablecoin Parity track. Do not bury this inside generic W2 cleanup, and do not wait until Phase H. It is adjacent to Frontier Approach A because Approach A already names Allbridge Core and Tron, but it deserves its own PRD/CRD/SOW because the asset, wallet, fee, proof, and user-experience model are different from CCTP V2.
