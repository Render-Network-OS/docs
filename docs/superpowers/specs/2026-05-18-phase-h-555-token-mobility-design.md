---
title: Phase H, 555 token cross-chain mobility design
date: 2026-05-18
status: design spec, brainstorm-approved, not yet implementation-plan-approved
supersedes: none (formalizes phase-h-spec-amendment-DRAFT)
basis:
  - DEVNET_FRONTIER_EVIDENCE_2026-05-16/coordination/phase-h-spec-amendment-DRAFT.md
  - DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/rail-scope-doc-audit.md
  - DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-h-rail-restoration-audit.md
  - DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/555-mint-probe.md
  - docs/superpowers/audits/2026-05-18-555-mint-metadata.md (this session, commit 60037a48)
  - docs/superpowers/audits/2026-05-18-wp2.4-closure-handover-corrigendum.md (this session, commit 402a5834)
  - docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md (Stage 2 NTT requirement, lines 87, 131, 153)
canonical_inputs:
  555_mint: CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
  decimals: 6
  supply_locked_at_genesis: 989859465.050629
  mint_authority: null (renounced)
  freeze_authority: null (renounced)
  evm_chains: [ETH, BASE, ARB, OP, AVAX, MATIC, UNI]
  approach_a_admin_sca: 0xe2f98e50d27df894703812d8c447985bd12f7ea6
  approach_a_pauser_sca: 0x9bac1ac094eae927505a626d0ab5727af1c63156
  approach_a_treasury_sca: 0x2b75e7b86620683b601fb0c5830dffa7b996e412
gating_prereqs:
  - Approach-A mainnet cutover (per-chain authorization, separate gate)
  - Wave-G corpus integrated (DONE, sw4p-earn/docs/wave-g-sw4p-earn-corpus at c320f60d)
  - OpenZeppelin solc bump lands in sw4p-pro (status: verify before H.1 kickoff)
  - W0.d backend reachability blocker unblocked (status: NOT VERIFIED in this spec, verify before H.1 kickoff)
---

# Headline

555 cross-chain mobility is implemented as a Wormhole NTT mesh with Solana as the hub (lock mode) and 7 EVM chains as spokes (burn mode). Each EVM spoke peers ONLY with Solana, forcing all inter-chain transfers through the hub. The token's supply is fixed and renounced on Solana; EVM-side supply is minted by the NTT manager against locked Solana custody, preserving the canonical invariant `Solana_locked == Σ EVM_minted` at all times. Phase H code lives in sw4p-pro alongside Approach-A V4.1; governance reuses the Approach-A Circle SCA triple unchanged on the EVM side; the Solana-side authority model is recorded as an open sub-question with three options and a default-if-parity rule.

## Cross-spec clarification (read before any review against Frontier Engine docs)

The Frontier Engine SOW at `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` categorically lists Wormhole NTT as a rejected rail. That rejection is **USDC settlement-specific** (the engine's scope is USDC bridging). It is unchanged by this spec. The NTT rail introduced here is the **ecosystem-layer 555 mobility rail**, owned by Phase H, not by the engine. The engine remains USDC-only; the engine repo absorbs no Phase H code. A reader of the engine SOW seeing the flat "NTT rejected" line should pair it with this clarification: rejected for USDC scope, used for 555 scope. The two scopes are independent.

# Decisions locked in (do not re-open without explicit user authorization)

| Item | Decision |
|---|---|
| Topology | Solana = hub (LOCK), 7 EVM chains = spokes (BURN) |
| Rail | Wormhole NTT, single transceiver (Wormhole Core Bridge), 1-of-1 threshold |
| Peer model | Solana-only peers on each EVM NTT manager; 7-peer set on Solana side. EVM-to-EVM transfers route through Solana |
| Token decimals | 6 (matches Solana mint, asserted across all 8 code surfaces by H.0) |
| Solana authorities | mint and freeze both remain null (renounced; cannot be re-enabled, this is final) |
| Repo | sw4p-pro (reuses deploy_v4.ts pattern, 7-chain Circle wallet inventory, CI/CodeBuild) |
| Governance (EVM) | reuse Approach-A Option-A triple: admin, pauser, treasury Circle SCAs; constructor-final; 1-day timelock; 7-day auto-unpause cap |
| Governance (Solana) | OPEN sub-question, three options (S.a Circle Solana wallet-set, S.b Squads multisig, S.c single-signer); default S.a if Circle Solana SCP parity holds, decide before H.2 deploy ceremony |
| Deploy mechanism (EVM) | Circle SCP only (POST /v1/w3s/contracts/deploy), HARD per user rule feedback_circle_scp_only_deploys |
| Deploy mechanism (Solana) | Solana-native tooling (Wormhole NTT CLI or equivalent) signed by the chosen Solana governance wallet (S.a / S.b / S.c). The "Circle SCP only" rule applies to EVM contract deploys; Solana program deploys are out of SCP's scope by mechanism, not by policy. Authorized via the same Solana governance choice that signs runtime admin actions. |
| H.1 chain set | all 7 in one wave: ETH, BASE, ARB, OP, AVAX, MATIC, UNI |
| Canary | supply-invariant (Solana locked = sum of EVM minted), 7 days continuous green for H.2 acceptance; alert-only during bake-in, auto-pause wired but disabled until H.2 close, then config-flipped to active |
| H.3 (Hyperlane) | conditional-future with explicit three-criterion promotion gate |
| Frontier Engine scope | unchanged: USDC-only; 555 mobility lives in this Phase H plan, not engine repo |

# Architecture overview

```
                          ┌──────────────────────────────────────┐
                          │  Solana mainnet (HUB)                │
                          │  555 mint: CQww...sysAF2 (decimals 6)│
                          │  Mint/freeze auth: NULL              │
                          │  NTT manager: LOCKING mode           │
                          │  locks the existing fixed supply     │
                          │  (989,859,465.050629 555)            │
                          └──┬───────────────────────────────────┘
                             │ Wormhole Core Bridge attestations
                             │ (single transceiver, 1-of-1)
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
   ┌───▼───┐   ┌────┐    ┌───▼──┐    ┌────┐    ┌──▼──┐    ┌─────┐    ┌────┐
   │  ETH  │   │BASE│    │  ARB │    │ OP │    │AVAX │    │MATIC│    │UNI │
   │ 555   │   │555 │    │ 555  │    │555 │    │ 555 │    │555  │    │555 │
   │NTT:   │   │NTT:│    │ NTT: │    │NTT:│    │ NTT:│    │NTT: │    │NTT:│
   │BURN   │   │BURN│    │BURN  │    │BURN│    │BURN │    │BURN │    │BURN│
   └───────┘   └────┘    └──────┘    └────┘    └─────┘    └─────┘    └────┘
```

Solana side: the existing 555 SPL mint at `CQww...sysAF2` stays as-is (decimals 6, authorities renounced, supply fixed). A new Wormhole NTT manager program (Anchor) is deployed; it owns a vault PDA that LOCKS 555 tokens deposited for cross-chain transfer.

Each EVM side: a new ERC-20 555 token (BURNING mode) is deployed via Circle SCP per chain. The NTT manager on that chain mints 555 on this token upon attestation of a corresponding lock event on Solana, and burns 555 on this token when forwarding to Solana (which triggers an unlock on the Solana vault).

Peer constraint: each EVM NTT manager has ONLY the Solana NTT manager as its peer. The Solana NTT manager has all 7 EVM NTT manager addresses as peers. Therefore EVM-A to EVM-B transfers ALWAYS route via Solana (two attestations, two NTT operations).

Hard invariant at all times: `Solana_NTT_vault_balance == Σ Token555.totalSupply() across the 7 EVM chains`.

# Components

Eight components. Four contract surfaces (built and deployed by Phase H), one messaging dependency (existing Wormhole infrastructure), three services and extensions.

## C1: Solana 555 NTT manager program

Anchor program, LOCKING mode. Path proposal: `sw4p-pro/sw4p-backend/programs/ntt-manager-555/` if a Solana programs tree exists or is created. **Open**: needs a directory-existence check before commit (see resolution path below).

Interface:
- `transfer(amount, recipient_chain, recipient_address)`: debits user, credits vault PDA, emits a Wormhole message.
- `redeem(vaa)`: verifies a Wormhole attestation from an EVM peer, decodes payload, verifies peer is in canonical 7-EVM set, transfers from vault to recipient.

Authority: depends on Solana governance choice S.a/S.b/S.c (deferred).

Peers: 7 entries, one per EVM chain, each pointing at that chain's NTT manager address (set post-H.1 / pre-H.2 acceptance).

## C2: EVM 555 ERC-20 token (per chain, x7)

Path: `sw4p-pro/sw4p-backend/contracts/contracts/Token555.sol`. Standard ERC-20 + ERC-2612 permit. Decimals = 6. BURNING mode (mint/burn restricted to NTT manager).

Constructor-final per Approach-A pattern: name, symbol, decimals, NTT-manager address, admin/pauser/treasury SCAs all baked at construction. No initial supply. All EVM supply is minted by the NTT manager on inbound transfers from Solana.

## C3: EVM NTT manager (per chain, x7)

Path: `sw4p-pro/sw4p-backend/contracts/contracts/NttManager555.sol`. Built from Wormhole NTT reference implementation (`wormhole-foundation/native-token-transfers` repo, vendored under `lib/ntt/` per existing sw4p-pro lib pattern).

Mode: BURNING. References its chain's 555 token; can mint/burn it. Peer: ONLY the Solana NTT manager. Transceiver: ONLY the Wormhole Core Bridge transceiver on that chain. Threshold: 1. Governance: Approach-A SCAs, constructor-final.

Rate limits: outbound and inbound per peer, 24-hour rolling window. Initial values: 10,000,000,000,000 (10M 555 per day per peer per direction), settable by admin SCA via 1-day timelock.

## C4: Wormhole Core Bridge transceivers (external, NOT built by Phase H)

Reference Wormhole Foundation's existing deployments per chain. Mainnet addresses published by Wormhole. The deploy script wires them in by constructor argument. Phase H verification: probe each address matches Wormhole's canonical published list.

## C5: Supply-invariant canary service

Path: `sw4p-pro/sw4p-backend/services/h-canary/` (new). Polls Solana NTT vault balance every N seconds (default 10s, configurable) and reads `totalSupply()` on each of the 7 EVM Token555 contracts. Computes drift, emits to existing sw4p-earn observability surface (Slack alert + metrics). 7-day continuous green-tier observation = H.2 acceptance gate.

Co-located with sw4p-pro deploys for repo unity (per repo-ownership decision). The canary is read-only against on-chain state.

## C6: Decimal verifier extension

Owned by sw4p-earn's existing decimal verifier service (per ecosystem design line 131). Phase H adds NTT manager probes: each chain's NTT manager and 555 token both report `decimals() == 6`, consistent with the Solana mint. New checks, same service.

## C7: CC-14 authority monitor extension

Owned by sw4p-earn's existing CC-14 monitor (per ecosystem design line 153). Phase H adds:
- Each NTT manager's peer set must match the canonical {Solana hub} (for EVM) or {7 EVM NTT managers} (for Solana).
- Each EVM 555 token's authorized minter must match the deployed NTT manager address.
- Solana mint authority must remain null forever.
- Each NTT manager's registered transceiver must match the canonical Wormhole Core Bridge address.

## C8: Operator runbook + 13-assertion sanity matrix

Path: `sw4p-pro/sw4p-backend/contracts/scripts/README.md` (extended) + new `scripts/sanity_matrix_ntt.sh`. Same `cast call` pattern as Approach-A: probe `paused()`, peer addresses, transceiver address, rate-limit configs, decimals, owner role, pauser role.

# Data flow

Three flow primitives, all routed through Solana per the hub-spoke peer constraint.

## Flow A: Solana to EVM-X

```
1. User calls Solana NTT manager: transfer(amount, EVM-X chain id, EVM recipient)
2. Solana NTT manager: debits user, credits vault PDA, emits Wormhole message
3. Wormhole Guardians observe and sign a VAA
4. Anyone (relayer or user) submits the VAA to EVM-X NTT manager: redeem(vaa)
5. EVM-X NTT manager: verifies signatures, decodes payload, verifies peer = Solana,
   checks inbound rate limit, calls Token555.mint(amount, recipient)
6. Recipient holds amount 555 on EVM-X
```

Invariant after Flow A: Solana vault +amount, EVM-X totalSupply +amount, net delta zero.

## Flow B: EVM-X to Solana

```
1. User calls EVM-X NTT manager: transfer(amount, Solana chain id, Solana recipient)
2. EVM-X NTT manager: checks outbound rate, calls Token555.burn(user, amount),
   emits Wormhole message
3. Wormhole Guardians sign a VAA
4. Relayer or user submits VAA to Solana NTT manager: redeem(vaa)
5. Solana NTT manager: verifies VAA, verifies peer = EVM-X NTT manager, checks inbound rate,
   transfers amount from vault PDA to recipient ATA (unlock)
6. Recipient holds amount 555 on Solana
```

Invariant after Flow B: Solana vault -amount, EVM-X totalSupply -amount, net delta zero.

## Flow C: EVM-X to EVM-Y

Two sequential rounds of Flow B then Flow A. NO direct EVM-X to EVM-Y peer. Latency = 2 x (Wormhole attestation + relayer submission). Fees = 2 x (gas on each EVM + Solana fee).

Spec records that front-end and SDK MAY abstract this as a single user action behind the scenes (auto-relay both legs), but on-chain reality is two transfers with a Solana intermediate state.

**Operational note (Flow C user-impact scenario)**: if the Solana inbound rate limit is hit during leg 1 (EVM-X to Solana redeem step), the user's EVM-X 555 tokens are ALREADY burned and the Solana unlock is queued for up to 24h until the rate-limit window refills. Funds are NOT lost; recovery is automatic on refill. Front-ends and ops should surface this state to users as "burned on source, pending unlock on hub" rather than a generic "transfer failed." This is the worst-case user-visible failure mode of the hub-spoke design and is preferred over the alternative (lose-funds-on-revert from a direct EVM-X to EVM-Y attempt).

## Replay safety

Wormhole VAAs are uniquely identified externally by `(emitter chain, emitter address, sequence)`, but NTT contracts track replay via VAA **hash** (the hash of the full signed VAA body, including guardian signatures). Each NTT manager maintains a "consumed" set keyed by this hash. `redeem(vaa)` is idempotent: a second submission with the same hash reverts with `AlreadyConsumed`. Guardian-set rotations do not invalidate old VAAs (Wormhole signs with the prior set during the rotation window).

**Subtlety with guardian-set rotation**: a rotation can produce different signatures on the same semantic payload, yielding a different VAA hash. The contract's consumed set tracks specific hashes it has seen. Operational guidance: in-flight VAAs at the moment of a guardian-set rotation should be redeemed using the original guardian-set form they were attested with, not re-requested with the new set's signatures. The NTT contract will accept either signature variant once it sees the corresponding hash, but the same semantic transfer cannot be replayed twice once any one signature variant has been redeemed.

## Rate-limit handling

Inbound rate limit per peer: amount per rolling 24h window that can be redeemed. Exceeding queues the VAA; queued VAAs redeem after the window refills, no funds lost. Outbound rate limit: amount per rolling 24h window that can be transferred OUT before the manager rejects new transfers. Rate limits are configurable via admin SCA + 1-day timelock. Initial: 10M 555 per peer per 24h per direction.

# Governance and key custody

## EVM side (no new authorities; reuses Approach-A triple)

| Role | SCA address | Powers on Phase H contracts |
|---|---|---|
| admin | `0xe2f98e50d27df894703812d8c447985bd12f7ea6` | rate-limit changes, peer additions, transceiver changes (timelocked 1 day); `transferAdmin` (timelocked 1 day) |
| pauser | `0x9bac1ac094eae927505a626d0ab5727af1c63156` | pause and unpause NTT manager + token contract (capped by 7-day auto-unpause) |
| treasury | `0x2b75e7b86620683b601fb0c5830dffa7b996e412` | receives any future fee accrual (Phase H initial fee_bps = 0, capped at MAX_PLATFORM_FEE_BPS = 1000 immutable) |

Same wallet-set derivation as Approach-A; same three addresses on every EVM chain via counterfactual property. No additional Circle wallet provisioning needed.

Hard caps inherited at the contract level:
- `MAX_PLATFORM_FEE_BPS = 1000` (10%, immutable ceiling; Phase H initial = 0)
- `AUTO_UNPAUSE_SECONDS = 604800` (7 days, capped pause)
- `TIMELOCK_DELAY = 86400` (1 day, gates admin transfers and parameter changes)

## Solana side (open sub-question, decide before H.2 deploy ceremony)

Three viable options, with decision criteria:

**S.a (default-if-parity): Circle Solana wallet-set, mirroring the EVM SCA pattern.** Three Solana wallets (admin / pauser / treasury) minted via Circle SCP. Same operator runbook shape. Requires verification that Circle Solana wallet-sets reach feature parity with EVM wallet-sets (program-PDA ownership, signature generation, timelock-equivalent semantics) before H.2 deploy ceremony.

**S.b: Dedicated Solana 3-of-5 multisig (Squads protocol or similar).** Pro: independent of Circle; human-operable. Con: introduces a multisig coordination layer Approach-A avoided; breaks the "Circle SCP only for deploys" rule unless the multisig itself is deployed via SCP.

**S.c: Constructor-final single-signer on a Solana wallet derived from the same wallet-set.** Pro: maximally simple. Con: single point of failure; not symmetric with the EVM triple.

**Decision rule recorded in spec**: test Circle Solana wallet-set feature parity before H.2 deploy ceremony. If parity holds, default to S.a. If parity fails on critical features, fall back to S.b. S.c is a non-default option requiring explicit user authorization.

## Key custody (operational)

- Circle entity-secret: lives in `/etc/circle-mainnet.env` on the deploy host, never in repo, never in CI logs.
- Circle API key: same env file, scoped to entity-level, quarterly rotation.
- Idempotency keys: `crypto.randomUUID()` per chain per attempt (per WP2.4 trip wire #4).
- Encryption ciphertext: single-use per Circle API call; regenerate inside per-chain loop (WP2.4 trip wire #3).
- No private keys ever in the codebase, commit messages, deploy logs, or PRs.

## Rotation procedures

- EVM admin / pauser / treasury rotation: 1-day timelocked `transferAdmin` flow, same as Approach-A.
- Solana authority rotation: dependent on S.a/S.b/S.c; spec defers detail.
- Wormhole guardian-set rotation: external, transparent to Phase H user funds.
- Circle entity-secret rotation: per Circle's quarterly cadence, in the Circle SCP operator runbook.

# Error handling and invariants

## Hard invariants (page-on-call if any breach)

| Invariant | Source of truth | Observer |
|---|---|---|
| Supply equality: `Solana_NTT_vault_balance == Σ Token555.totalSupply()` | on-chain reads | H.2 canary, per-block (or per-N-seconds, default 10s) |
| Decimal consistency: all surfaces report `decimals = 6` (Solana mint, 7 EVM Token555, 7 EVM NttManager555, NTT framework metadata) | on-chain reads | decimal verifier extension |
| Peer-set canonicality: each NTT manager's peer set is canonical | on-chain reads | CC-14 authority monitor |
| Authority canonicality: EVM admin/pauser/treasury matches Approach-A triple; Solana mint+freeze remain null | on-chain reads | CC-14 authority monitor |
| Transceiver canonicality: each EVM NTT manager's registered transceiver matches Wormhole Core Bridge canonical address | on-chain reads | CC-14 authority monitor |
| Token-to-NTT-manager linkage: each EVM Token555's authorized minter matches the deployed NTT manager | on-chain reads | CC-14 authority monitor |

## Soft invariants (warn-only, ops-tracked)

| Soft signal | Source | Response |
|---|---|---|
| Inbound rate-limit queue growing for > 1h on any peer | NTT manager state | Slack alert, investigate Wormhole guardian liveness |
| Outbound rate-limit exhausted in < 1h | NTT manager state | Slack alert, user education or admin SCA limit-raise |
| Wormhole guardian-set rotation in progress | external | Informational, verify peers and transceivers post-rotation |

## Canary response tiering (supply-invariant breach)

**Green-tier definition**: drift below the Tier-1 threshold (i.e., < 0.01% deviation from `Solana_locked == Σ EVM_minted`) sustained for the entire 7-day observation window. Continuous green-tier is the H.2 acceptance gate.

**Tier definitions and clock-reset rules**:
- **Tier 1 (drift < 0.01%, ~99 of 989M base units)**: Slack warn, log, daily summary. Does NOT reset the 7-day clock.
- **Tier 2 (drift 0.01% to 0.1%)**: page on-call, manual triage within 1h, no auto action. **RESETS the 7-day clock**. Post-mortem required before canary resumes.
- **Tier 3 (drift > 0.1%)**: page on-call AND (post-H.2-close only) auto-pause all NTT managers via pauser SCA. **RESETS the 7-day clock**. Post-mortem and root-cause-fix required before canary resumes.

During the H.2 7-day bake-in: alert-only at all tiers, humans pause manually on Tier 3. After H.2 close: a config flip activates auto-pause for Tier 3. The flip is a deliberate post-acceptance action, not part of H.2 itself.

**On-call SLA during bake-in**: Tier-3 pages target manual pause within **30 minutes** of page, maximum acceptable delay **1 hour**. If a Tier-3 event occurs during bake-in with no manual pause within 1 hour, escalate to a hard incident, force-pause everything via the pauser SCA, and reset the 7-day clock unconditionally. The choice of alert-only-during-bake-in (rather than auto-pause-from-day-1) is deliberate: it lets us calibrate the auto-pause threshold against real drift-signal quality before activating it, which avoids long-tail false-positive pauses that would cost user trust more than the bake-in risk costs.

## Error scenarios

1. VAA fails verification on destination: reverts, no state change. User resubmits if VAA is signed correctly but destination temporarily wrong; user contacts ops if signatures bad.
2. Inbound rate-limit exceeded: VAA queues internally; FIFO redeem after window refills; no funds lost.
3. Outbound rate-limit exceeded: transfer reverts at source; user retries after refill, or admin SCA raises limit (timelocked).
4. NTT manager paused on destination: VAA queues (Wormhole still attests); redeemable after unpause (manual or 7d auto).
5. Solana RPC outage: all inter-EVM 555 transfers halt (Flow C dependency); EVM-to-Solana redeem step also halts; recovery on RPC return.
6. Supply invariant breach: tiered response above.
7. Vault PDA receives direct (non-NTT) 555 deposit: positive drift in canary; Tier-1 if small; investigate depositor; recover via treasury policy decision.
8. Circle SCP deploy attempt fails mid-wave: same trip-wire procedure as Approach-A (idempotency key regenerate, entity-secret-ciphertext regenerate, description-field sanitize per WP2.4 risk register entries 1-7).

## Known systemic risk

Single-transceiver (1-of-1 Wormhole) introduces a guardian-set compromise risk. Mitigations:
- 7-day auto-unpause cap bounds any compromise window.
- Hyperlane H.3 promotion gate fires if Wormhole guardian-set compromise lasts > 30 days.
- No defense-in-depth at the rail layer; this is by design under the "single transceiver, simplest config" choice.

# Testing strategy

Five layers, escalating in fidelity and cost.

## Layer 1: Unit tests (per file)

- `Token555.sol`: ERC-20 conformance, ERC-2612 permit, `decimals() == 6`, mint/burn caller restriction, pauser SCA behavior, 7-day auto-unpause.
- `NttManager555.sol`: constructor wires triple correctly, peer-add (admin only, timelocked), rate-limit accounting (queue + FIFO refill), replay rejection (`AlreadyConsumed`), pause behavior, 13-assertion sanity matrix.
- Solana NTT manager: lock (debit user, credit vault, emit Wormhole), redeem (verify VAA, verify peer, transfer to recipient), replay rejection, peer-add (owner only, timelock-equivalent), decimals consistency with Solana mint.

## Layer 2: Drift tests (mirror Approach-A `cctp_v2_address_drift.test.cjs`)

- `ntt_address_drift.test.cjs`: canonical Wormhole Core Bridge addresses per chain hardcoded, asserted against deploy_ntt.ts CHAIN_META. 42+ assertions across 7 chains. Catches the regression class that hit Approach-A.
- `ntt_constructor_drift.test.cjs`: constructor args shape (triple + decimals + rate limits + transceiver + peer-init) asserted; any shape change requires explicit drift-test update.
- `ntt_governance_drift.test.cjs`: asserts the three SCA addresses match Approach-A's published triple. Catches accidental governance divergence.

## Layer 3: Mainnet-fork integration tests

Replicates `ZapAndBridgeV41.fork.test.cjs` pattern. One `runForkBlock` per EVM chain. Each fork block deploys 555 Token + NTT manager, then runs six sub-tests:
1. Chain ID identity.
2. Constructor parity (admin/pauser/treasury readback).
3. Outbound transfer with mocked Wormhole VAA emission.
4. Inbound redeem with mocked VAA verification.
5. Wrong-peer reject (VAA signed by unauthorized address fails).
6. Pause and 7-day auto-unpause behavior.

Per-process invocation pattern from Approach-A `1d243c6` (one chain per Hardhat process).

## Layer 4: Testnet end-to-end (real Wormhole, real chains)

Mirrors PR #234 schema-v2 evidence pattern. Per chain (testnet 555 mint TBD; may require deploying a testnet SPL Token with a new mint authority for this purpose only):
- Real Wormhole guardian-set testnet attestation.
- Solana devnet to EVM testnet round trip (Sepolia, Base Sepolia, Arbitrum Sepolia, Unichain Sepolia at minimum).
- Captured to `testnet_h_deploys.json` schema-v2 with Circle SCP contract IDs, transaction IDs, deployer wallet IDs, sanity-matrix results.

Acceptance: at least 3 round-trips per chain pass without ops intervention; rate-limit + pause + auto-unpause exercised on at least one chain.

## Layer 5: Mainnet 7-day supply-invariant canary

The H.2 acceptance gate. Defined in canary response tiering above. 7 days of continuous green-tier observation = H.2 ACCEPT.

## CI integration

- Layers 1, 2, 3 run on every commit to a Phase H branch in sw4p-pro (existing CodeBuild buildspec extends to include `npx hardhat test test/ntt*.test.cjs` and the Anchor test suite).
- Layer 4 runs as a separate manual workflow (testnet deploys are deliberate).
- Layer 5 runs continuously in production starting at H.2 deploy completion.

# Sequencing, sub-phases, acceptance gates

| Sub-phase | Status | Deliverables | Acceptance gate |
|---|---|---|---|
| H.0 | COMPLETE (this session) | Decimal contradiction map (`afad0307`), doc alignment commit (`a6586d0e`), 555 mint metadata audit (`60037a48`). All code surfaces already at 6 decimals; only docs needed fixing. | Verified canonical 6 across RNDRNTWRK_CANONICAL_TRUTH.md, tokenomics page, all 8 code consts. |
| H.1 | not started | 7 x `Token555.sol` deploys via Circle SCP (mainnet, all 7 chains in one wave). Per-chain `mainnet_h1_deploys.json` schema-v2 evidence. 13-assertion sanity matrix per deploy. Drift tests passing. Solana side: no work in H.1 (Solana mint already exists, unchanged). | All 7 contracts INERT (no NTT manager wired yet); admin/pauser/treasury readback matches Approach-A triple on all 7; `mint()` reverts for all callers including admin (no NTT manager wired yet). |
| H.2 | not started | Solana NTT manager program deploy (locking mode), 7 x `NttManager555.sol` deploys via Circle SCP (burning mode), peer wiring (Solana-hub-only on each EVM, full peer set on Solana), transceiver wiring (Wormhole Core Bridge per chain), rate-limit init, `mainnet_h2_deploys.json` schema-v2 evidence, supply-invariant canary deployed and started, 7-day canary green-tier window observed. | 7-day continuous canary green; CC-14 + decimal verifier extensions report all hard invariants intact; one real Solana to EVM to Solana round trip per chain succeeded with rate limits and pause exercise; auto-pause config flip applied at H.2 close. |
| H.3 | conditional-future | NONE in spec scope. Spec only defines promotion gate. | n/a |

## H.2 deploy order (mandatory)

All 8 managers (1 Solana + 7 EVM) must exist BEFORE any peer is wired. This order avoids chicken-and-egg confusion:

1. **Deploy Solana NTT manager** (Solana-native tooling per the deploy-mechanism row in the decisions table). Capture its program address.
2. **Deploy all 7 EVM NTT managers** via Circle SCP in one wave. Capture all 7 addresses.
3. After all 8 addresses are known, **set peers** on all 8 managers: Solana gets the 7 EVM NTT manager addresses; each EVM NTT manager gets the Solana NTT manager address (Solana-only peer per the topology decision).
4. **Set transceivers** on all 7 EVM managers (Wormhole Core Bridge canonical address per chain).
5. **Set initial rate limits** (10M 555 per peer per 24h inbound and outbound; both queueing options enabled).
6. **Verify peer-set canonicality** on all 8 managers via `cast` and `anchor` probes BEFORE handing off to the canary. This is a point-in-time assertion to add to the H.2 acceptance gate alongside the continuous CC-14 monitor.
7. **Wire each EVM 555 token's authorized minter** to its chain's NTT manager (`Token555.setMinter(nttManager)` or equivalent constructor input if not configurable post-deploy).
8. **Start the supply-invariant canary**; begin the 7-day clock.

## Downstream dependency

Per `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` line 87, **sw4p Earn Stage 2 hard-prereqs on the H.2 acceptance gate** (7-day NTT supply-invariant canary green). Any slip in H.2 acceptance silently blocks Earn Stage 2 until the canary completes its bake-in. Coordinate timeline accordingly; flag Phase H deploy slips to the Earn Stage 2 owner immediately.

## H.2 round-trip testing mechanism

The H.2 acceptance criterion "one real Solana → EVM → Solana round trip per chain" uses **DIRECT on-chain calls** (cast for EVM, anchor CLI for Solana) against the deployed NTT managers, NOT the front-end SDK. The front-end / SDK is owned by sw4p-earn product (per non-goals list) and is not gated on H.2 acceptance.

The 7 per-chain round trips MAY be executed CONCURRENTLY (one per chain in parallel). Concurrent execution fits comfortably within the 7-day canary window. Sequential execution is NOT required and could risk exceeding the window if any chain encounters rate-limit queueing.

## H.3 promotion gate

Promote H.3 from conditional-future to scheduled if ANY of:

1. **Coverage gap**: a partner ecosystem, product, or chain Phase H wants to reach is on a chain Wormhole NTT does not support adequately, AND the team commits to that partnership.
2. **Wormhole operational degradation**: Wormhole guardian-set or NTT infrastructure has documented user-impacting issues lasting > 30 continuous days.
3. **Product feature requirement**: a sw4p product feature explicitly requires Hyperlane's messaging semantics (generalized message passing beyond token transfer) that NTT does not provide. The product spec must name this requirement.

Promotion requires explicit user authorization. The Phase H plan does not estimate when, if ever, H.3 fires.

# Non-goals (in scope of spec to list, out of scope for execution)

- Fee accrual on the NTT manager (treasury wired in for symmetry, fee bps immutable at 0 initially).
- Bridged EVM 555 representation other than Wormhole NTT (no LayerZero OFT, no Axelar ITS, no Hyperlane Warp Routes in Phase H; H.3 conditional only).
- Cross-chain governance (each chain's contract is self-governed by its own SCA triple).
- Frontier Engine integration with 555 mobility (engine stays USDC-only per amendment Section 4.10.5).
- Fee model design for inter-chain 555 transfers (rate limits exist; user pays gas; no protocol fee initially).
- Front-end / SDK design for routing UX (e.g., the Flow C auto-relay abstraction): owned by sw4p-earn product, not by Phase H spec.
- Solana mint rotation or new authority: explicitly impossible (authorities renounced) and out of scope to attempt.

# Stop conditions

Raise immediately if any trigger during H.1 / H.2 execution:

1. Any deploy attempt outside Circle SCP (hardhat-direct, foundry-direct, raw EOA).
2. Any change to the EVM admin / pauser / treasury triple addresses vs Approach-A's set.
3. Any peer-set on an EVM NTT manager that includes anything other than the Solana NTT manager.
4. Any rate-limit initial value > 10M 555 per peer per 24h on any chain.
5. Any commit in the deploy diff with a Co-Authored-By trailer or AI attribution.
6. Any secret in the deploy diff (Circle entity-secret, private keys, mnemonics, API keys).
7. Any change to the canonical 555 Solana mint (`CQww...sysAF2`) or attempt to mint new supply.
8. Any drift-test failure during pre-deploy verification.
9. Any frontier engine code touched by Phase H (engine stays USDC-only).
10. Any tier-3 supply-invariant drift event during H.2 canary (resets 7-day clock, post-mortem required).
11. Any tier-2 supply-invariant drift event during H.2 canary (also resets 7-day clock, post-mortem required; tier-2 vs tier-3 differs only in auto-pause behavior, not in clock-reset rule).
12. Any Solana NTT manager program deploy using a keypair or wallet NOT authorized by the chosen Solana governance model (S.a / S.b / S.c). The Solana deploy uses Solana-native tooling, not Circle SCP; this stop condition is the Solana-side analog of stop condition 1.
13. Any H.2 deploy using a Wormhole NTT framework version different from the version pinned and audit-verified during pre-H.1 verification.

# Open items to resolve before H.1 kickoff

These are explicit pre-flight items the Phase H plan must address before H.1 deploys begin:

- **W0.d backend reachability blocker status**: amendment gating item 4. Verify resolved.
- **OpenZeppelin solc bump**: amendment gating item 3. Verify merged in sw4p-pro.
- **Solana programs tree location in sw4p-pro**: spec proposed `sw4p-backend/programs/ntt-manager-555/`; verify directory does not yet exist and confirm the convention with the sw4p-pro maintainer before creating.
- **Wormhole NTT framework reference version**: pin a specific commit of `wormhole-foundation/native-token-transfers` to vendor under `lib/ntt/`. Verify it is the most recent audited release.
- **Solana governance choice (S.a / S.b / S.c)**: test Circle Solana wallet-set feature parity. Default to S.a if parity holds.
- **Testnet 555 mint provisioning**: layer-4 testing needs a testnet SPL Token. Decide: deploy a brand-new testnet mint with a new (testnet-only) authority, OR mock the Solana side in testnet tests entirely.
- **Solana NTT manager program deploy mechanism and evidence shape**: distinct from the governance-wallet choice (S.a/S.b/S.c). Decide: which tool deploys the Anchor program binary (Wormhole NTT CLI vs custom wrapper); which keypair or wallet signs the deploy transaction (must align with the chosen Solana governance model); how the deploy evidence is captured into a schema-v2 record analogous to `mainnet_h1_deploys.json` and `mainnet_h2_deploys.json`, given that Circle SCP fields like `circle_contract_id` and `circle_tx_id` do not apply to Solana program deploys. Resolve BEFORE H.2 deploy ceremony.
- **Wormhole NTT framework audit-report inventory**: in addition to pinning the framework's commit/tag, collect the specific security-audit reports applicable to that revision (multiple firms have audited NTT at different times). Verify the pinned revision is covered by the most recent audit, NOT just the most recent tag. A newer unaudited tag is NOT acceptable for H.2 deploy.

# References

- Phase H amendment DRAFT: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/coordination/phase-h-spec-amendment-DRAFT.md`
- Rail-scope doc audit: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/rail-scope-doc-audit.md`
- Rail restoration audit: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-h-rail-restoration-audit.md`
- 555 mint metadata: `docs/superpowers/audits/2026-05-18-555-mint-metadata.md`
- WP2.4 closure corrigendum (Approach-A reference state): `docs/superpowers/audits/2026-05-18-wp2.4-closure-handover-corrigendum.md`
- Ecosystem unified design: `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md`
- Wormhole NTT framework: https://wormhole.com/docs/learn/messaging/native-token-transfers/
- Wormhole NTT reference repo: https://github.com/wormhole-foundation/native-token-transfers

# Authorization model

- This spec, on approval, becomes the basis for the Phase H implementation plan (via writing-plans skill).
- The implementation plan, on approval, may execute H.1 only after all gating prereqs are reverified.
- H.2 may execute only after H.1 acceptance.
- H.2 acceptance is the 7-day supply-invariant canary green-tier window.
- H.3 remains conditional; promotion requires explicit user authorization citing one of the three criteria.
- No deploys, no NTT, no Hyperlane code may be written or deployed until this spec is approved AND the implementation plan derived from it is approved AND gating prereqs reverify.
