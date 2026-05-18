# sw4p USDT / Tron Stablecoin Parity PRD

**Status:** Product requirements - external-team handoff ready.
**Date:** 2026-05-18.
**Owner:** sw4p Frontier Engine corpus.
**Audience:** External implementation team with no prior sw4p context.
**Scope:** USDT support parity across EVM, Solana, and Tron. BTC and Omni USDT are explicitly out of scope.
**Companion docs:** `2026-05-18-sw4p-usdt-tron-parity-crd.md`, `2026-05-18-sw4p-usdt-tron-parity-trd.md`, `2026-05-18-sw4p-usdt-tron-parity-sow.md`.

---

## 1. Executive Summary

sw4p is the RNDRNTWRK settlement rail. Its current Frontier Engine work is strongest around USDC movement across EVM and Solana through Circle CCTP V2. The missing product requirement is full USDT parity across EVM, Solana, and Tron.

The product requirement is not "add Tron to an enum." The product requirement is that users, agents, and operators can reason about and execute supported stablecoin movement across EVM, Solana, and Tron with the same clarity, safety, lifecycle tracking, and no-fake-evidence discipline expected of the USDC path.

The product split is canonical:

- USDC routes use Circle CCTP V2 where CCTP supports the source and destination pair.
- USDT and Tron routes use Allbridge Core where provider data, local execution support, liquidity, signing, fee display, lifecycle tracking, and proof gates all pass.
- BTC and Omni USDT are `out_of_scope`, not merely `not_implemented`.
- Tron is first-class, but not live until route, signing, fee, proof, and operations gates close.

The central risk is false parity. Allbridge token metadata can prove that a provider recognizes a token and chain. It cannot prove that sw4p can safely execute, monitor, recover, and publicly expose the route. Product availability must therefore be derived from multiple dimensions: provider support, code support, quote support, liquidity state, proof state, policy state, runtime exposure, and operational health.

## 2. External Truth Baseline

### 2.1 Circle CCTP truth

Circle CCTP is a native USDC burn-and-mint protocol. Circle documents CCTP as a permissionless onchain utility for native USDC transfers without traditional bridge liquidity pools or wrapped tokens.

Product implication: USDC remains on CCTP V2. USDT must not pretend to use CCTP.

Source: https://developers.circle.com/cctp

### 2.2 Circle Contracts deployment truth

Circle Contracts supports deployment and interaction through console and APIs using Circle Wallets. sw4p's existing deployment rule remains unchanged: sw4p contract deployments must use Circle Smart Contract Platform only unless explicitly overridden for a named deployment.

Product implication: this PRD does not authorize any non-Circle deployment path.

Source: https://developers.circle.com/contracts

### 2.3 Tether issuer truth

Tether's supported-protocol material lists current USDT support on networks including ERC20, TRC20 on Tron, and Solana Token. The same source states that Tether is no longer issuing or obligated to redeem Tether Tokens on Omni Layer and several other legacy networks, and that the legacy rows are maintained for historical reference.

Product implication: EVM, Tron, and Solana USDT are in scope. BTC and Omni USDT are out of scope.

Sources:

- https://tether.to/en/supported-protocols/
- https://tether.io/news/tether-provides-update-on-transition-plan-for-legacy-blockchains/

### 2.4 Allbridge Core truth

Allbridge Core enables native stablecoin transfers between blockchains by connecting liquidity pools through a virtual stable-swap mechanism. Its docs describe stablecoin pools, vUsd accounting, cross-chain messaging, optional alternative mechanisms such as CCTP or OFT for some routes, fees, liquidity effects, raw transaction builders, approvals, and transfer status.

Product implication: Allbridge support is provider-stateful. A route needs metadata, quote, liquidity, approval, raw transaction, signing, status, and proof handling. It is not a single boolean bridge flag.

Sources:

- https://docs-core.allbridge.io/product/how-does-allbridge-core-work
- https://docs-core.allbridge.io/product/how-does-allbridge-core-work/fees
- https://docs-core.allbridge.io/product/how-does-allbridge-core-work/allbridge-core-contracts
- https://github.com/allbridge-io/allbridge-core-js-sdk
- https://github.com/allbridge-io/allbridge-core-rest-api

### 2.5 TRON execution truth

TRON source execution needs TronLink or equivalent user-controlled wallet signing for production flows. TronWeb builds transactions, TronLink signs, and the signed transaction is broadcast. TRON fees and resource exposure must be described in TRX, Bandwidth, Energy, and fee limit terms.

Product implication: a backend `TRON_RELAYER_PRIVATE_KEY` is not production user custody. It can only be used for a named canary or proof workflow if explicitly approved.

Sources:

- https://developers.tron.network/docs/tronlink-integration
- https://developers.tron.network/docs/resource-model
- https://developers.tron.network/docs/tron-network-security-and-scam-prevention-guide

## 3. Local System Baseline

The codebase already contains Tron and USDT work, but not full parity.

| Surface | Current known state | Product verdict |
|---|---|---|
| Backend Tron client | `sw4p-backend/src/tron_client.rs` supports Tron RPC, TRC20 USDT balance (`get_usdt_balance` at line 92), signing, broadcast, and Tron USDT contract `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (line 13). | Useful foundation. Private-key signing is not production parity by itself. |
| Backend Tron swap | `sw4p-backend/src/tron_swap.rs` contains SunSwap V2 router `TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax`, WTRX, and USDT logic. Currently has no call sites in `allbridge.rs`, `route_selector.rs`, or `native_bridge.rs`. | Adjacent capability, currently unused. Must not be silently composed into parity routes. |
| Backend Allbridge adapter | `sw4p-backend/src/allbridge.rs` exposes chain enum (Tron=3, Solana=4, Base=9), `bridge_from_tron`, `bridge_to_tron`, `bridge_to_tron_from_solana` (line 619: returns `Err("Solana to Tron bridging not yet implemented. Use EVM chains.")`), and `get_stablecoin_address` whose Base USDT match returns the Base USDC contract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (line 812). | Real scaffold. Must be reconciled with provider APIs and fail-closed route states. |
| Route selector | `sw4p-backend/src/route_selector.rs` chooses Allbridge when destination is Tron/TRX or token is USDT (line 155); selection scoring is confidence > time > fee (line 275). | Directionally right, but too optimistic unless route state gates are added. |
| Native bridge layer | `sw4p-backend/src/native_bridge.rs` maps Tron to non-CCTP domain 99 (line 108) and selects Allbridge for USDT (line 140) and Tron source/dest (line 146). | Needs route-state and proof integration. |
| Frontend wallet layer | `sw4p-frontend/src/WalletProvider.tsx` lines 63 to 96 implement TronLink connection via `window.tronWeb`/`window.tronLink`, account-change postMessage, and disconnect. | Connection is not execution parity. |
| Frontend settlement config | `sw4p-frontend/src/config/settlementChains.ts` lines 77 to 88 include Tron with `sourceEnabled: false`, `destinationEnabled: false`, `badge: 'Gated'`. | Correct posture until proof gates close. |
| Frontend bridge hook | `sw4p-frontend/hooks/useBridge.ts` line 30 `createBridge(address, chain)` only branches on `'EVM'` or `'SOL'`. | Tron source execution will fail at runtime unless extended. |
| Kit and agent surface | `sw4p-kit/src/core/intent.ts` line 3 `ChainSchema = z.enum(["base", "arbitrum", "polygon", "avalanche", "solana"])` lacks Tron entirely; assets include USDC and USDT. | Agent parity gap. |
| MCP gateway | `sw4p-mcp-gateway/src/index.ts` and `src/tools.ts` wrap sw4p-kit for LLM/MCP clients. | Must consume kit's updated chain/asset schema and route-state response. |
| Ops docs | Existing docs recorded no canonical public non-production Tron proof corridor. | Correct controlling assumption until provider-confirmed proof exists. |

Older branches were referenced in earlier sessions but were not found on the local clone or origin remotes as of 2026-05-18:

- `feat/sw4p-tron-sdk-contract`
- `fix/sw4p-tron-backend-adapter`
- `ops/sw4p-tron-proof-corridor-provisioning`
- `docs/sw4p-tron-proof-corridor-research`

Treat these as discoverable-but-not-blocking. WS0 must run `git branch -a | grep -iE "tron|sw4p"`, document what is or is not present, and proceed without depending on missing branches. Do not stall implementation waiting for these to be recovered.

## 4. Product Goals

### G1. Stablecoin asset clarity

USDC and USDT are separate assets with separate rails. Product copy, route APIs, kit outputs, and UI must never treat USDT as a USDC alias.

### G2. Tron as a first-class USDT chain

Tron must support route discovery, wallet connection, address validation, fee preview, approval review, signing, submission, status tracking, recovery, and proof once enabled.

### G3. No false live routes

Provider metadata does not make a route live. A route is live only when provider support, code support, quote support, liquidity, proof, policy, runtime exposure, frontend state, kit state, and operations state agree.

### G4. Proof-gated availability

USDT/Tron acceptance must use one of:

- provider-confirmed non-production Allbridge corridor,
- explicitly authorized mainnet micro-transfer,
- gated deferral where live provider data exists but no transaction proof is authorized.

Mocks, local-only Allbridge simulations, guessed testnet contracts, and stale snapshots do not count.

### G5. Agent-safe outputs

Agents must receive route-state reasons and remediation hints. They must not receive a boolean `available` answer that hides proof, policy, or code gaps.

### G6. BTC and Omni exclusion

BTC/Omni USDT must never appear as an active sw4p settlement route. The correct state is `out_of_scope`.

## 5. Non-Goals

- No BTC/Omni USDT integration.
- No new bridge rail beyond CCTP V2 and Allbridge Core.
- No public claim that Allbridge has a public testnet corridor unless provider documentation or direct confirmation proves it.
- No mainnet transfer without explicit per-action authorization.
- No replacement of V4.1 EVM contracts or Circle SCP deployment policy.
- No NTT or 555 token mobility work. That remains separate Phase H work.
- No fiat settlement work.
- No silent composed route such as Base USDT to Base USDC to Tron USDT.
- No frontend or kit enablement before backend route-state truth exists.

## 6. Users And Use Cases

### U1. Creator or earner receiving settlement

A creator wants value on the chain they use. If they prefer Tron USDT, sw4p must show whether the route is live, gated, policy-blocked, suspended, or unsupported.

### U2. EVM user moving USDT to Tron

A user with USDT on an Allbridge-supported EVM chain wants to receive TRC20 USDT on Tron without leaving sw4p.

### U3. Solana user moving USDT to Tron or EVM

A Solana user with SPL USDT wants the same route clarity and tracking. This is currently a P0 parity gap because local code reports Solana to Tron as not implemented.

### U4. Tron user moving USDT to EVM or Solana

A Tron user wants a non-custodial source flow using TronLink or equivalent wallet signing, not hidden backend custody.

### U5. Agent using `@sw4p/kit`

An agent needs balance, route estimate, send, and unsupported-route responses that distinguish USDC, USDT, EVM, Solana, Tron, provider support, and proof state.

### U6. Operator

An operator needs route truth, provider snapshot, proof ledger, transfer status, stuck-transfer recovery, route suspension, and canary controls.

## 7. Product Requirements

| ID | Priority | Requirement |
|---|---:|---|
| PRD-USDT-001 | MUST | The product must distinguish stablecoin asset from chain. USDC and USDT are separate route assets. |
| PRD-USDT-002 | MUST | USDT must be first-class in route discovery, quote display, fee display, status tracking, and agent output. |
| PRD-USDT-003 | MUST | Tron support must be gated until executable evidence or explicit canary/proof authorization exists. |
| PRD-USDT-004 | MUST | Tron destination routes must display TRC20 USDT as the received asset. |
| PRD-USDT-005 | MUST | Tron source routes must use a real Tron wallet signing path or a consciously approved relayer/canary custody model. |
| PRD-USDT-006 | MUST | UI and SDK must never show a Tron/USDT route as live if backend execution would return `Solana to Tron bridging not yet implemented` or equivalent. |
| PRD-USDT-007 | MUST | Route selection must be explicit: USDC CCTP V2 routes use CCTP V2, USDT/Tron routes use Allbridge Core, unsupported crossovers fail visibly. |
| PRD-USDT-008 | MUST | Tron fees must be explained as TRX, Bandwidth, Energy, and fee limit exposure before signing. |
| PRD-USDT-009 | MUST | Agent surfaces must return machine-readable route states, reasons, and remediation hints. |
| PRD-USDT-010 | MUST | BTC/Omni USDT must not appear as a supported route, settlement chain, or hidden bridge target. |
| PRD-USDT-011 | MUST | Route availability must be generated from provider-backed registry state, not hardcoded enums. |
| PRD-USDT-012 | MUST | Provider token support, quote support, liquidity state, code support, proof state, runtime exposure, and policy state must be separate fields. |
| PRD-USDT-013 | MUST | Provider metadata alone must never promote a route to `live`. |
| PRD-USDT-014 | MUST | The product must never silently convert Base USDT to Base USDC, USDT to USDC, or one token standard to another without an explicit user-visible composed route. |
| PRD-USDT-015 | MUST | The route confirmation surface must show exact source asset, destination asset, token standard, provider rail, estimated receive amount, fees, slippage or pool impact, approval requirement, proof state, and expected completion status before signing. |
| PRD-USDT-016 | MUST | Tron routes must validate recipient addresses and reject ambiguous, malformed, or wrong-chain destination inputs. |
| PRD-USDT-017 | MUST | Allbridge raw transactions must be validated against the user's original route intent before wallet signing. |
| PRD-USDT-018 | MUST | The UI and SDK must support a `suspended` state for routes disabled due to provider degradation, stale registry, insufficient liquidity, incident response, or policy hold. |
| PRD-USDT-019 | MUST | Mainnet canary authorization must be captured as a structured object: route, amount, source wallet, destination wallet, fee cap, slippage cap, approval cap, expiry, approver, and proof destination. |
| PRD-USDT-020 | MUST | A route must not move to `live` unless frontend, backend, kit, provider registry, proof ledger, and operations dashboard agree. |
| PRD-USDT-021 | SHOULD | Destination gas top-up should be exposed only when provider support exists and must be shown separately from bridge fees. |
| PRD-USDT-022 | SHOULD | The route detail screen should show whether the Allbridge route mechanism is pool, CCTP, CCTP V2, OFT, or unknown. |
| PRD-USDT-023 | SHOULD | The product should prefer provider-generated raw transactions or SDK calls over hand-maintained ABI encodings. |
| PRD-USDT-024 | MAY | A small mainnet canary route may be used for acceptance only after explicit authorization for a named source, destination, amount, and wallet. |

## 8. Route Matrix Policy

The route matrix below is a policy starting point, not a permanent hardcoded registry. Implementation must regenerate route support from live Allbridge metadata and then apply sw4p policy, code support, proof state, liquidity state, and runtime exposure.

| Source | Destination | Asset | Provider status | sw4p V1 policy |
|---|---|---|---|---|
| EVM CCTP chain | EVM CCTP chain | USDC | CCTP-supported pairs | Existing Frontier path. |
| EVM CCTP chain | Solana | USDC | CCTP-supported pairs | Existing Frontier path. |
| Solana | EVM CCTP chain | USDC | CCTP-supported pairs | Existing Frontier path. |
| EVM Allbridge USDT chain | Tron | USDT | Provider-supported on eligible chains except unsupported tuples such as Base direct USDT | Gated until quote, tx, proof, and ops pass. |
| Tron | EVM Allbridge USDT chain | USDT | Provider-supported | Gated until Tron signing/custody and proof pass. |
| Solana | Tron | USDT | Provider-supported | P0 parity gap until implementation removes not-implemented path. |
| Tron | Solana | USDT | Provider-supported | Gated until signing and proof pass. |
| Base | Tron | USDT | Direct Base USDT unsupported in current Allbridge token-info | `provider_unsupported` unless explicit conversion route is designed. |
| Unichain | Tron | USDT | Provider-supported in Allbridge data | `policy_blocked` unless runtime policy admits Unichain. |
| BTC/Omni | Any | USDT | Issuer legacy/deprecated | `out_of_scope`. |

## 9. Required User-Facing Route States

| State | Product meaning | User behavior |
|---|---|---|
| `live` | Fully executable and proof-backed. | User can execute. |
| `canary_authorized` | Limited proof transfer explicitly approved. | Only named canary can execute. |
| `code_supported_proof_missing` | Code exists but proof is missing. | Route visible as gated, no public execution. |
| `provider_supported_code_incomplete` | Provider supports tuple but sw4p cannot execute safely yet. | Gated. |
| `provider_unsupported` | Provider does not expose the asset/chain tuple. | No live button. |
| `suspended` | Previously live/candidate route disabled by provider, liquidity, stale registry, incident, or policy hold. | No execution until cleared. |
| `policy_blocked` | Provider may support it but sw4p policy blocks exposure. | No execution. |
| `out_of_scope` | Deliberately excluded. | No execution. |

## 10. Required Product Copy Rules

- Do not say "Tron live" until launch gate passes.
- Do not say "USDT everywhere" until route matrix and proof ledger support each route.
- Do not say "gasless" for Tron unless the user is insulated from TRX, Energy, and Bandwidth costs by an approved sponsor or provider mechanism.
- Do not call provider metadata proof of execution.
- Do not use BTC/Omni in any active route copy.
- Do not collapse USDC and USDT under the generic label "stablecoin" at the signing point.

## 11. Evidence And Sources

Primary external sources:

- Circle CCTP: https://developers.circle.com/cctp
- Circle Contracts: https://developers.circle.com/contracts
- Tether supported protocols: https://tether.to/en/supported-protocols/
- Tether legacy blockchain transition update: https://tether.io/news/tether-provides-update-on-transition-plan-for-legacy-blockchains/
- Allbridge Core overview: https://docs-core.allbridge.io/product/how-does-allbridge-core-work
- Allbridge Core fees: https://docs-core.allbridge.io/product/how-does-allbridge-core-work/fees
- Allbridge Core contracts: https://docs-core.allbridge.io/product/how-does-allbridge-core-work/allbridge-core-contracts
- Allbridge Core JS SDK: https://github.com/allbridge-io/allbridge-core-js-sdk
- Allbridge Core REST API: https://github.com/allbridge-io/allbridge-core-rest-api
- TRON TronLink integration: https://developers.tron.network/docs/tronlink-integration
- TRON resource model: https://developers.tron.network/docs/resource-model
- TRON security guide: https://developers.tron.network/docs/tron-network-security-and-scam-prevention-guide

Local sources to inspect before coding:

- `sw4p/sw4p-backend/src/tron_client.rs`
- `sw4p/sw4p-backend/src/tron_swap.rs`
- `sw4p/sw4p-backend/src/allbridge.rs` (Solana to Tron gap at line 619, Base USDT to Base USDC mapping at line 812)
- `sw4p/sw4p-backend/src/route_selector.rs` (Allbridge selection at line 155)
- `sw4p/sw4p-backend/src/native_bridge.rs` (provider selection at lines 140 and 146)
- `sw4p/sw4p-backend/src/bridge_protocol.rs`
- `sw4p/sw4p-backend/Cargo.toml` (Axum, Tokio, SQLx for PostgreSQL, reqwest, secp256k1, tracing, opentelemetry-otlp, alloy)
- `sw4p/sw4p-backend/migrations/` (sqlx-cli auto-run)
- `sw4p/sw4p-frontend/src/WalletProvider.tsx` (TronLink block lines 63 to 96)
- `sw4p/sw4p-frontend/src/config/settlementChains.ts` (Tron entry lines 77 to 88)
- `sw4p/sw4p-frontend/hooks/useBridge.ts` (factory at line 30)
- `sw4p-kit/src/core/intent.ts` (ChainSchema at line 3)
- `sw4p-kit/package.json` (vitest test runner)
- `sw4p-mcp-gateway/src/index.ts`, `sw4p-mcp-gateway/src/tools.ts`
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md` (2026-05-17 probe: TRX chainId=3 tokens=['USDT'])
- `sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md`
- `sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md`

## 12. Product Acceptance Gates

### Gate A: Route truth

- Provider registry is live-fetched or pinned with release evidence.
- Route states are derived from provider data plus sw4p policy.
- Stale registry snapshots are rejected.
- Base direct USDT is not exposed while unsupported.
- Tron USDC is not exposed while unsupported.
- BTC/Omni is `out_of_scope`.

### Gate B: Execution safety

- Quote is provider-backed.
- Fees are itemized.
- Approval is bounded.
- Raw transaction validates against original route intent.
- Wallet signing uses the correct chain signer.
- No silent rail or asset conversion exists.

### Gate C: Tron parity

- TronLink source signing works.
- TRC20 USDT destination display is exact.
- TRX, Energy, Bandwidth, and fee limit are shown.
- Tron confirmation watcher works.
- Backend relayer is blocked for production user flows.

### Gate D: Lifecycle and proof

- Source tx hash is captured.
- Provider status is tracked.
- Destination settlement proof is captured where applicable.
- Stuck routes can be escalated.
- Evidence is stored with registry, quote, and proof hashes.

### Gate E: Public live route

A route may be public-live only if all are true:

- provider support is `supported`,
- code support is `implemented`,
- quote support is `available`,
- proof state is `destination_settled` or `provider_confirmed_nonprod`,
- provider health is `ok`,
- liquidity state is `available`,
- frontend state equals backend state equals kit state,
- runbook is ready.

## 13. Recommended Product Decision

Approve USDT/Tron as a dedicated parity track. Do not bury it in generic Allbridge cleanup, and do not defer it to 555 token mobility. The strongest positioning is:

> sw4p USDT/Tron parity is not a bridge badge. It is a proof-gated settlement capability. USDC remains native CCTP V2. USDT/Tron uses Allbridge Core only where current provider data, sw4p execution code, user signing, fee clarity, liquidity, lifecycle tracking, and proof gates all pass. Unsupported or unproven routes remain visible to agents and operators as gated states, but never appear to users as live execution paths.
